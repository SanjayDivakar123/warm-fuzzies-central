import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_SUPER_ADMINS = new Set([
  "sanjay@rolecolorfinder.com",
  "tristan@rolecolorfinder.com",
  "aaron@rolecolor.com",
  "kody@rolecolor.com",
]);

function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof value === "string" && uuidRegex.test(value);
}

function normalizeSubdomain(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isValidSubdomain(value: string): boolean {
  if (!value) return false;
  if (value.length < 3 || value.length > 63) return false;
  if (value.startsWith("-") || value.endsWith("-")) return false;
  return /^[a-z0-9-]+$/.test(value);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET") ?? "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized");

    const callerEmail = (user.email || "").toLowerCase();
    if (!ALLOWED_SUPER_ADMINS.has(callerEmail)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = (body?.action || "").toString();
    const companyId = (body?.company_id || "").toString();
    const amountCents = Number(body?.amount_cents || 0);
    const description = (body?.description || "").toString().trim();
    const trialEndsAtInput = (body?.trial_ends_at || "").toString().trim();
    const trialUserLimitInput = Number(body?.trial_user_limit || 10);
    const companyNameInput = (body?.company_name || "").toString().trim();
    const subdomainInput = (body?.subdomain || "").toString().trim();
    const adminUserId = (body?.admin_user_id || "").toString().trim();
    const adminEmailInput = (body?.admin_email || "").toString().trim().toLowerCase();
    const waiveDeploymentFeeInput = Boolean(body?.waive_deployment_fee);
    const deploymentFeeWaivedInput = Boolean(body?.deployment_fee_waived);

    const supportedActions = [
      "add_free_credits",
      "charge_card",
      "remove_credits",
      "set_trial",
      "create_company",
      "assign_admin",
      "set_deployment_fee_waived",
    ];

    if (!supportedActions.includes(action)) {
      throw new Error("Invalid action");
    }

    if (action !== "create_company" && !isValidUUID(companyId)) {
      throw new Error("Invalid company_id");
    }

    if (
      ["add_free_credits", "charge_card", "remove_credits"].includes(action) &&
      (!Number.isInteger(amountCents) || amountCents <= 0)
    ) {
      throw new Error("amount_cents must be a positive integer");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    if (action === "create_company") {
      if (!companyNameInput) {
        throw new Error("company_name is required");
      }
      const normalizedSubdomain = normalizeSubdomain(subdomainInput);
      if (!isValidSubdomain(normalizedSubdomain)) {
        throw new Error("subdomain must be 3-63 chars and contain only letters, numbers, and hyphens");
      }

      let adminUserEmail = adminEmailInput;
      if (adminUserId) {
        if (!isValidUUID(adminUserId)) throw new Error("Invalid admin_user_id");
        const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(adminUserId);
        if (authUserError || !authUserData?.user?.email) {
          throw new Error("Could not find auth user for admin_user_id");
        }
        adminUserEmail = authUserData.user.email.toLowerCase();
      }

      if (!adminUserEmail || !adminUserEmail.includes("@")) {
        throw new Error("A valid admin email or admin_user_id is required");
      }

      const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("subdomain", normalizedSubdomain)
        .maybeSingle();

      if (existingCompany) {
        throw new Error("Subdomain is already in use");
      }

      const { data: createdCompany, error: createCompanyError } = await supabase
        .from("companies")
        .insert({
          name: companyNameInput,
          subdomain: normalizedSubdomain,
          admin_email: adminUserEmail,
          seats_purchased: 2,
          assessment_type: "25q",
          requires_post_setup_deployment_fee: !waiveDeploymentFeeInput,
          deployment_fee_waived: waiveDeploymentFeeInput,
          deployment_fee_waived_at: waiveDeploymentFeeInput ? new Date().toISOString() : null,
        })
        .select("id, name, subdomain, admin_email")
        .single();

      if (createCompanyError || !createdCompany) {
        throw new Error(createCompanyError?.message || "Failed to create company");
      }

      const membershipPayload: Record<string, unknown> = {
        company_id: createdCompany.id,
        email: adminUserEmail,
        role: "admin",
        status: "active",
        joined_at: new Date().toISOString(),
      };

      if (adminUserId) {
        membershipPayload.user_id = adminUserId;
      }

      const { error: membershipError } = await supabase
        .from("company_users")
        .insert(membershipPayload);

      if (membershipError) {
        throw new Error(membershipError.message || "Company created but failed to assign admin membership");
      }

      await supabase.from("billing_transactions").insert({
        company_id: createdCompany.id,
        type: "super_admin_company_created",
        amount: 0,
        description: description || `Super-admin created company and assigned admin ${adminUserEmail}`,
      });

      return new Response(
        JSON.stringify({
          success: true,
          action,
          company: createdCompany,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (action === "assign_admin") {
      if (!adminUserId) throw new Error("admin_user_id is required");
      if (!isValidUUID(adminUserId)) throw new Error("Invalid admin_user_id");

      const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(adminUserId);
      const resolvedEmail = authUserData?.user?.email?.toLowerCase() || "";
      if (authUserError || !resolvedEmail) {
        throw new Error("Could not find auth user for admin_user_id");
      }

      const { data: existingMembership } = await supabase
        .from("company_users")
        .select("id")
        .eq("company_id", companyId)
        .eq("user_id", adminUserId)
        .maybeSingle();

      if (existingMembership?.id) {
        const { error: updateMembershipError } = await supabase
          .from("company_users")
          .update({
            role: "admin",
            status: "active",
            email: resolvedEmail,
            joined_at: new Date().toISOString(),
          })
          .eq("id", existingMembership.id);

        if (updateMembershipError) {
          throw new Error(updateMembershipError.message || "Failed to promote existing membership to admin");
        }
      } else {
        const { error: insertMembershipError } = await supabase
          .from("company_users")
          .insert({
            company_id: companyId,
            user_id: adminUserId,
            email: resolvedEmail,
            role: "admin",
            status: "active",
            joined_at: new Date().toISOString(),
          });

        if (insertMembershipError) {
          throw new Error(insertMembershipError.message || "Failed to add admin membership");
        }
      }

      const { error: updateCompanyAdminEmailError } = await supabase
        .from("companies")
        .update({ admin_email: resolvedEmail })
        .eq("id", companyId);

      if (updateCompanyAdminEmailError) {
        throw new Error(updateCompanyAdminEmailError.message || "Failed updating company admin email");
      }

      await supabase.from("billing_transactions").insert({
        company_id: companyId,
        type: "super_admin_assign_admin",
        amount: 0,
        description: description || `Super-admin assigned ${resolvedEmail} as company admin`,
      });

      return new Response(
        JSON.stringify({
          success: true,
          action,
          company_id: companyId,
          admin_user_id: adminUserId,
          admin_email: resolvedEmail,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (action === "set_deployment_fee_waived") {
      const deploymentFeeWaived = Boolean(deploymentFeeWaivedInput);

      const { data: currentCompany, error: currentCompanyError } = await supabase
        .from("companies")
        .select("id, deployment_fee_charged_at")
        .eq("id", companyId)
        .single();

      if (currentCompanyError || !currentCompany) {
        throw new Error("Company not found");
      }

      const alreadyCharged = Boolean(currentCompany.deployment_fee_charged_at);

      const { error: updateDeploymentFeeError } = await supabase
        .from("companies")
        .update({
          deployment_fee_waived: deploymentFeeWaived,
          deployment_fee_waived_at: deploymentFeeWaived ? new Date().toISOString() : null,
          requires_post_setup_deployment_fee: deploymentFeeWaived ? false : !alreadyCharged,
        })
        .eq("id", companyId);

      if (updateDeploymentFeeError) throw updateDeploymentFeeError;

      await supabase.from("billing_transactions").insert({
        company_id: companyId,
        type: deploymentFeeWaived ? "deployment_fee_waived" : "deployment_fee_unwaived",
        amount: 0,
        description: deploymentFeeWaived
          ? "Super-admin waived one-time deployment fee"
          : "Super-admin removed deployment fee waiver",
      });

      return new Response(
        JSON.stringify({
          success: true,
          action,
          deployment_fee_waived: deploymentFeeWaived,
          deployment_fee_already_charged: alreadyCharged,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, admin_email, stripe_customer_id, credit_balance")
      .eq("id", companyId)
      .single();
    if (companyError || !company) throw new Error("Company not found");

    const currentBalance = company.credit_balance || 0;

    if (action === "set_trial") {
      const trialEndsAt = new Date(trialEndsAtInput);
      if (!trialEndsAtInput || Number.isNaN(trialEndsAt.getTime())) {
        throw new Error("trial_ends_at must be a valid ISO date");
      }
      if (trialEndsAt.getTime() <= Date.now()) {
        throw new Error("trial_ends_at must be in the future");
      }

      const trialUserLimit = Number.isFinite(trialUserLimitInput)
        ? Math.max(1, Math.min(10000, Math.floor(trialUserLimitInput)))
        : 10;

      const { error: updateTrialError } = await supabase
        .from("companies")
        .update({
          b2b_trial_enabled: true,
          b2b_trial_starts_at: new Date().toISOString(),
          b2b_trial_ends_at: trialEndsAt.toISOString(),
          b2b_trial_user_limit: trialUserLimit,
          b2b_trial_converted_at: null,
        })
        .eq("id", companyId);

      if (updateTrialError) throw updateTrialError;

      const { error: trialLogError } = await supabase.from("billing_transactions").insert({
        company_id: companyId,
        type: "super_admin_trial_configured",
        amount: 0,
        description: description || `Super-admin trial configured through ${trialEndsAt.toISOString()} with user limit ${trialUserLimit}`,
      });
      if (trialLogError) {
        console.error("Failed to write super_admin_trial_configured log:", trialLogError.message);
      }

      return new Response(
        JSON.stringify({
          success: true,
          action,
          trial_ends_at: trialEndsAt.toISOString(),
          trial_user_limit: trialUserLimit,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (action === "add_free_credits") {
      const newBalance = currentBalance + amountCents / 100;

      const { error: updateError } = await supabase
        .from("companies")
        .update({ credit_balance: newBalance })
        .eq("id", companyId);
      if (updateError) throw updateError;

      await supabase.from("billing_credits").insert({
        company_id: companyId,
        amount: amountCents / 100,
        type: "super_admin_free_credit",
        description:
          description || `Super-admin free credit: $${(amountCents / 100).toFixed(2)}`,
        created_by: user.id,
      });

      // Audit log (fire-and-forget)
      supabase.from('audit_logs').insert({
        company_id: companyId,
        user_id: user.id,
        user_email: user.email,
        action: 'credits_added',
        entity_type: 'billing',
        details: {
          amount: (amountCents / 100).toFixed(2),
          type: 'free_credit',
          description: description || null,
        },
      }).then(({ error }) => { if (error) console.error('Audit log failed:', error.message); });

      return new Response(
        JSON.stringify({
          success: true,
          action,
          amount_cents: amountCents,
          previous_balance_cents: currentBalance,
          new_balance_cents: newBalance,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (action === "remove_credits") {
      const removeAmount = amountCents / 100;
      const newBalance = Math.max(0, currentBalance - removeAmount);

      const { error: updateError } = await supabase
        .from("companies")
        .update({ credit_balance: newBalance })
        .eq("id", companyId);
      if (updateError) throw updateError;

      await supabase.from("billing_credits").insert({
        company_id: companyId,
        amount: -removeAmount,
        type: "super_admin_credit_removal",
        description:
          description || `Super-admin credit removal: -$${removeAmount.toFixed(2)}`,
        created_by: user.id,
      });

      // Audit log (fire-and-forget)
      supabase.from('audit_logs').insert({
        company_id: companyId,
        user_id: user.id,
        user_email: user.email,
        action: 'credits_removed',
        entity_type: 'billing',
        details: {
          amount: (amountCents / 100).toFixed(2),
          description: description || null,
        },
      }).then(({ error }) => { if (error) console.error('Audit log failed:', error.message); });

      return new Response(
        JSON.stringify({
          success: true,
          action,
          amount_cents: amountCents,
          previous_balance_cents: currentBalance,
          new_balance_cents: newBalance,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!stripeKey) throw new Error("STRIPE_SECRET is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    let customerId = company.stripe_customer_id;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: company.admin_email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: company.admin_email,
          name: company.name,
          metadata: { company_id: company.id },
        });
        customerId = customer.id;
      }

      await supabase
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", companyId);
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });
    if (paymentMethods.data.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          needsPaymentMethod: true,
          error: "No payment method on file for this company",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethods.data[0].id,
      off_session: true,
      confirm: true,
      description:
        description || `Super-admin manual charge for ${company.name}: $${(amountCents / 100).toFixed(2)}`,
      metadata: {
        company_id: company.id,
        type: "super_admin_manual_charge",
      },
    });

    if (paymentIntent.status !== "succeeded") {
      throw new Error(`Payment failed with status: ${paymentIntent.status}`);
    }

    const newBalance = currentBalance + amountCents / 100;
    const { error: updateError } = await supabase
      .from("companies")
      .update({ credit_balance: newBalance })
      .eq("id", companyId);
    if (updateError) throw updateError;

    await supabase.from("billing_transactions").insert({
      company_id: companyId,
      type: "super_admin_manual_charge",
      amount: amountCents,
      stripe_payment_intent_id: paymentIntent.id,
      description:
        description || `Super-admin manual charge: $${(amountCents / 100).toFixed(2)}`,
    });

    await supabase.from("billing_credits").insert({
      company_id: companyId,
      amount: amountCents / 100,
      type: "super_admin_paid_credit",
      description:
        description || `Credits added from manual card charge: $${(amountCents / 100).toFixed(2)}`,
      created_by: user.id,
    });

    // Audit log (fire-and-forget)
    supabase.from('audit_logs').insert({
      company_id: companyId,
      user_id: user.id,
      user_email: user.email,
      action: 'payment',
      entity_type: 'billing',
      details: {
        amount: (amountCents / 100).toFixed(2),
        type: 'card_charge',
        description: description || null,
        payment_intent_id: paymentIntent.id,
      },
    }).then(({ error }) => { if (error) console.error('Audit log failed:', error.message); });

    return new Response(
      JSON.stringify({
        success: true,
        action,
        amount_cents: amountCents,
        payment_intent_id: paymentIntent.id,
        previous_balance_cents: currentBalance,
        new_balance_cents: newBalance,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in rcf-company-billing-admin:", error);
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || "Unexpected error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
