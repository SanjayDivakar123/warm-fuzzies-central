import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-PAYMENT-METHOD] ${step}${detailsStr}`);
};

const MANAGEMENT_ROLES = ["admin", "hr", "partner"] as const;
const DEPLOYMENT_FEE_CENTS = 500000;

const isMissingStripeCustomerError = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error || "").toLowerCase();
  return message.includes("no such customer");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const { company_id, action, success_url, cancel_url } = body;

    if (!company_id) throw new Error("company_id is required");

    // Verify user has management access for this company
    const { data: companyUser, error: cuError } = await supabase
      .from("company_users")
      .select("role, status")
      .eq("company_id", company_id)
      .eq("user_id", user.id)
      .single();

    if (cuError || !companyUser || companyUser.status !== "active" || !MANAGEMENT_ROLES.includes(companyUser.role)) {
      throw new Error("User is not authorized to manage billing for this company");
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, admin_email, stripe_customer_id")
      .eq("id", company_id)
      .single();

    if (companyError || !company) throw new Error(companyError?.message || "Company not found");

    logStep("Company found", { companyId: company.id, name: company.name });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const saveCustomerId = async (nextCustomerId: string) => {
      await supabase
        .from("companies")
        .update({ stripe_customer_id: nextCustomerId })
        .eq("id", company_id);
    };

    const findOrCreateCustomerByEmail = async () => {
      const customers = await stripe.customers.list({ email: company.admin_email, limit: 1 });

      if (customers.data.length > 0) {
        const nextCustomerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId: nextCustomerId });
        return nextCustomerId;
      }

      const customer = await stripe.customers.create({
        email: company.admin_email,
        name: company.name,
        metadata: { company_id: company.id }
      });
      logStep("Created new Stripe customer", { customerId: customer.id });
      return customer.id;
    };

    // Get or create Stripe customer, and recover automatically if the stored ID
    // belongs to an old Stripe account.
    let customerId = company.stripe_customer_id;

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch (error) {
        if (!isMissingStripeCustomerError(error)) {
          throw error;
        }

        logStep("Stored Stripe customer missing; rebuilding customer mapping", { customerId });
        customerId = null;
      }
    }

    if (!customerId) {
      customerId = await findOrCreateCustomerByEmail();
      await saveCustomerId(customerId);
    }

    const getDefaultPaymentMethodId = async () => {
      try {
        const customerObj = await stripe.customers.retrieve(customerId) as any;
        const invoiceDefault = customerObj?.invoice_settings?.default_payment_method;
        const invoiceDefaultId = typeof invoiceDefault === "string" ? invoiceDefault : invoiceDefault?.id;
        if (typeof invoiceDefaultId === "string" && invoiceDefaultId.startsWith("pm_")) {
          return invoiceDefaultId;
        }
      } catch (customerRetrieveError) {
        logStep("Failed to retrieve customer invoice default", { customerId, error: customerRetrieveError });
      }
      return null;
    };

    const listSupportedPaymentMethods = async () => {
      const [cards, bankAccounts] = await Promise.all([
        stripe.paymentMethods.list({ customer: customerId, type: "card" }),
        stripe.paymentMethods.list({ customer: customerId, type: "us_bank_account" }),
      ]);

      return [...cards.data, ...bankAccounts.data];
    };

    // Handle different actions
    if (action === "get_payment_method") {
      // Get current payment method
      const paymentMethods = await listSupportedPaymentMethods();

      if (paymentMethods.length === 0) {
        return new Response(JSON.stringify({ 
          hasPaymentMethod: false 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const defaultPaymentMethodId = await getDefaultPaymentMethodId();

      const pm = defaultPaymentMethodId
        ? (paymentMethods.find((method) => method.id === defaultPaymentMethodId) || paymentMethods[0])
        : paymentMethods[0];

      logStep("Payment method found", {
        type: pm.type,
        brand: pm.card?.brand,
        last4: pm.card?.last4 || pm.us_bank_account?.last4,
      });

      return new Response(JSON.stringify({ 
        hasPaymentMethod: true,
        paymentMethod: {
          id: pm.id,
          type: pm.type,
          brand: pm.card?.brand,
          bankName: pm.us_bank_account?.bank_name,
          last4: pm.card?.last4 || pm.us_bank_account?.last4,
          expMonth: pm.card?.exp_month,
          expYear: pm.card?.exp_year,
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "setup_payment_method") {
      // Create a Checkout Session in setup mode
      const origin = req.headers.get("origin") || success_url?.split('/').slice(0, 3).join('/') || "https://rolecolorfinder.com";

      let session;
      try {
        session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "setup",
          payment_method_types: ["card", "us_bank_account"],
          success_url: success_url || `${origin}/b2b/dashboard?payment_setup=success`,
          cancel_url: cancel_url || `${origin}/b2b/dashboard?payment_setup=cancelled`,
          metadata: {
            company_id: company.id,
            type: "payment_method_setup"
          }
        });
      } catch (setupError) {
        logStep("Card+bank setup unavailable; falling back to card-only", { error: setupError });
        session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "setup",
          payment_method_types: ["card"],
          success_url: success_url || `${origin}/b2b/dashboard?payment_setup=success`,
          cancel_url: cancel_url || `${origin}/b2b/dashboard?payment_setup=cancelled`,
          metadata: {
            company_id: company.id,
            type: "payment_method_setup"
          }
        });
      }

      logStep("Checkout session created", { sessionId: session.id, url: session.url });

      return new Response(JSON.stringify({ 
        success: true,
        url: session.url,
        sessionId: session.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "charge_deployment_fee_if_needed") {
      // Read deployment-fee state in a separate query so setup/get actions do not
      // fail when migration columns are not present yet.
      let deploymentFeeRequired = false;
      let deploymentFeeWaived = false;
      let deploymentFeeChargedAt: string | null = null;

      const { data: feeState, error: feeStateError } = await supabase
        .from("companies")
        .select("requires_post_setup_deployment_fee, deployment_fee_waived, deployment_fee_charged_at")
        .eq("id", company.id)
        .maybeSingle();

      if (feeStateError) {
        logStep("Deployment fee columns unavailable; using backward-compatible inference", {
          companyId: company.id,
          error: feeStateError.message,
        });
      } else if (feeState) {
        deploymentFeeRequired = Boolean((feeState as any).requires_post_setup_deployment_fee);
        deploymentFeeWaived = Boolean((feeState as any).deployment_fee_waived);
        deploymentFeeChargedAt = ((feeState as any).deployment_fee_charged_at as string | null) || null;
      }

      if (!deploymentFeeRequired && !deploymentFeeWaived && !deploymentFeeChargedAt) {
        const { data: priorChargeRecord } = await supabase
          .from("billing_transactions")
          .select("id")
          .eq("company_id", company.id)
          .eq("type", "deployment_fee_charge")
          .limit(1)
          .maybeSingle();

        if (priorChargeRecord?.id) {
          deploymentFeeChargedAt = new Date().toISOString();
        }
      }

      if (!deploymentFeeRequired && !deploymentFeeWaived && !deploymentFeeChargedAt) {
        const { data: historyRows, error: historyError } = await supabase
          .from("billing_transactions")
          .select("type, created_at")
          .eq("company_id", company.id)
          .in("type", [
            "super_admin_company_created",
            "super_admin_assign_admin",
            "deployment_fee_waived",
            "deployment_fee_unwaived",
            "deployment_fee_charge",
          ])
          .order("created_at", { ascending: false })
          .limit(30);

        if (historyError) {
          logStep("Failed to load deployment fee inference history", {
            companyId: company.id,
            error: historyError.message,
          });
        } else if (historyRows?.length) {
          const latestWaiverToggle = historyRows.find(
            (row: any) => row.type === "deployment_fee_waived" || row.type === "deployment_fee_unwaived",
          );

          if (latestWaiverToggle?.type === "deployment_fee_waived") {
            deploymentFeeWaived = true;
          }

          const anyDeploymentFeeCharge = historyRows.some((row: any) => row.type === "deployment_fee_charge");
          if (anyDeploymentFeeCharge) {
            deploymentFeeChargedAt = new Date().toISOString();
          }

          const adminManagedBootstrap = historyRows.some(
            (row: any) => row.type === "super_admin_company_created" || row.type === "super_admin_assign_admin",
          );

          if (adminManagedBootstrap && !deploymentFeeWaived && !deploymentFeeChargedAt) {
            deploymentFeeRequired = true;
          }
        }
      }

      // Backward-compatibility: older super-admin-created companies may predate
      // the requires_post_setup_deployment_fee flag. Infer requirement from history.
      if (!deploymentFeeRequired && !deploymentFeeWaived && !deploymentFeeChargedAt) {
        const { data: legacyCreationRecord } = await supabase
          .from("billing_transactions")
          .select("id")
          .eq("company_id", company.id)
          .eq("type", "super_admin_company_created")
          .limit(1)
          .maybeSingle();

        if (legacyCreationRecord?.id) {
          deploymentFeeRequired = true;
          const { error: markRequiredError } = await supabase
            .from("companies")
            .update({ requires_post_setup_deployment_fee: true })
            .eq("id", company.id);

          if (markRequiredError) {
            logStep("Failed to persist inferred deployment fee requirement", {
              companyId: company.id,
              error: markRequiredError.message,
            });
          }
        }
      }

      if (!deploymentFeeRequired) {
        return new Response(JSON.stringify({
          success: true,
          status: "not_required",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (deploymentFeeWaived) {
        return new Response(JSON.stringify({
          success: true,
          status: "waived",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (deploymentFeeChargedAt) {
        return new Response(JSON.stringify({
          success: true,
          status: "already_charged",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const paymentMethods = await listSupportedPaymentMethods();
      if (paymentMethods.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          status: "no_payment_method",
          error: "No payment method on file",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const defaultPaymentMethodId = await getDefaultPaymentMethodId();
      const selectedPaymentMethod = defaultPaymentMethodId
        ? (paymentMethods.find((method) => method.id === defaultPaymentMethodId) || paymentMethods[0])
        : paymentMethods[0];

      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: DEPLOYMENT_FEE_CENTS,
          currency: "usd",
          customer: customerId,
          payment_method: selectedPaymentMethod.id,
          off_session: true,
          confirm: true,
          description: `One-time deployment fee for ${company.name}`,
          metadata: {
            company_id: company.id,
            type: "deployment_fee_charge",
          },
        }, {
          idempotencyKey: `deployment-fee-${company.id}`,
        });
      } catch (stripeErr: any) {
        const pi = stripeErr?.payment_intent;
        const requiresAction =
          pi?.status === "requires_action" ||
          stripeErr?.code === "authentication_required" ||
          stripeErr?.code === "payment_intent_authentication_failure";

        if (requiresAction) {
          const actionUrl = pi?.next_action?.redirect_to_url?.url ?? null;
          return new Response(JSON.stringify({
            success: false,
            status: "requires_action",
            requiresAction: true,
            actionUrl,
            clientSecret: pi?.client_secret,
            error: "Card requires verification before the deployment fee can be charged.",
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        throw stripeErr;
      }

      if (paymentIntent.status !== "succeeded") {
        throw new Error(`Deployment fee charge failed with status ${paymentIntent.status}`);
      }

      await supabase
        .from("companies")
        .update({
          deployment_fee_charged_at: new Date().toISOString(),
          deployment_fee_payment_intent_id: paymentIntent.id,
          requires_post_setup_deployment_fee: false,
        })
        .eq("id", company.id);

      const { error: billingTransactionError } = await supabase.from("billing_transactions").insert({
        company_id: company.id,
        type: "deployment_fee_charge",
        amount: DEPLOYMENT_FEE_CENTS,
        stripe_payment_intent_id: paymentIntent.id,
        description: "One-time deployment fee charged after payment method setup",
      });

      if (billingTransactionError) {
        logStep("Failed to insert deployment fee billing transaction", { error: billingTransactionError.message });
      }

      return new Response(JSON.stringify({
        success: true,
        status: "charged",
        amount_cents: DEPLOYMENT_FEE_CENTS,
        payment_intent_id: paymentIntent.id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action. Use 'get_payment_method', 'setup_payment_method', or 'charge_deployment_fee_if_needed'");

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
