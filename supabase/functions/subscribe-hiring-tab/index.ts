import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const addOneMonthAnchored = (current: Date, anchorDay: number) => {
  const year = current.getUTCFullYear();
  const month = current.getUTCMonth();
  const hour = current.getUTCHours();
  const minute = current.getUTCMinutes();
  const second = current.getUTCSeconds();
  const ms = current.getUTCMilliseconds();
  const targetMonthDate = new Date(Date.UTC(year, month + 1, 1, hour, minute, second, ms));
  const lastDayOfTargetMonth = new Date(
    Date.UTC(targetMonthDate.getUTCFullYear(), targetMonthDate.getUTCMonth() + 1, 0, hour, minute, second, ms)
  ).getUTCDate();
  const day = Math.min(anchorDay, lastDayOfTargetMonth);
  return new Date(
    Date.UTC(
      targetMonthDate.getUTCFullYear(),
      targetMonthDate.getUTCMonth(),
      day,
      hour,
      minute,
      second,
      ms
    )
  );
};

const getNextRenewalFromCompanyCreatedAt = (companyCreatedAtIso?: string) => {
  if (!companyCreatedAtIso) {
    const fallback = new Date();
    fallback.setUTCMonth(fallback.getUTCMonth() + 1);
    return fallback;
  }

  const companyCreatedAt = new Date(companyCreatedAtIso);
  if (Number.isNaN(companyCreatedAt.getTime())) {
    const fallback = new Date();
    fallback.setUTCMonth(fallback.getUTCMonth() + 1);
    return fallback;
  }

  const now = new Date();
  const anchorDay = companyCreatedAt.getUTCDate();
  let cursor = new Date(companyCreatedAt);
  while (cursor <= now) {
    cursor = addOneMonthAnchored(cursor, anchorDay);
  }
  return cursor;
};

serve(async (req) => {
  console.log("=== SUBSCRIBE TO HIRING TAB FUNCTION STARTED ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { companyId, useCredits = false } = body;

    if (!companyId) throw new Error("companyId is required");

    // Verify user is admin
    const { data: companyUser, error: cuError } = await supabase
      .from("company_users")
      .select("role, status")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .single();

    if (cuError || !companyUser || companyUser.role !== "admin" || companyUser.status !== "active") {
      throw new Error("User is not an admin for this company");
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, admin_email, stripe_customer_id, credit_balance, created_at")
      .eq("id", companyId)
      .single();

    if (companyError || !company) throw new Error("Company not found");

    // Use dollars for all internal accounting (DECIMAL(10,2))
    const hiringCost = 500.0; // $500.00 in dollars
    const nextRenewalDate = getNextRenewalFromCompanyCreatedAt(company.created_at);
    const normalizedName = (company.name ?? "").trim().toLowerCase().replace(/\s+/g, "");
    const isInternalAdminCompany = normalizedName === "rolecolorfinderllc";

    // Internal admin company gets the hiring platform for free
    if (isInternalAdminCompany) {
      const { error: freeUpdateError } = await supabase
        .from("companies")
        .update({
          hiring_subscription_enabled: true,
          hiring_subscription_status: "active",
          hiring_subscription_current_period_end: nextRenewalDate.toISOString(),
          hiring_subscription_cancel_at_period_end: false,
        })
        .eq("id", companyId);

      if (freeUpdateError) {
        console.error("update_company_internal_free error", freeUpdateError);
        return new Response(JSON.stringify({
          error: "Failed to activate internal free hiring subscription",
          step: "update_company_internal_free",
          details: (freeUpdateError as any)?.message || freeUpdateError,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }

      return new Response(JSON.stringify({
        success: true,
        subscriptionId: null,
        status: "active",
        internalFree: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle credit-based payment
    if (useCredits) {
      // credit_balance is DECIMAL, ensure numeric
      const creditBalance = typeof company.credit_balance === "number"
        ? company.credit_balance
        : parseFloat(company.credit_balance as unknown as string ?? "0");

      if (creditBalance < hiringCost) {
        throw new Error("Insufficient billing credits");
      }

      // Deduct credits and activate subscription
      const newBalance = Number((creditBalance - hiringCost).toFixed(2));
      
      const { error: updateError } = await supabase
        .from("companies")
        .update({
          credit_balance: newBalance,
          hiring_subscription_enabled: true,
          hiring_subscription_status: "active",
          hiring_subscription_current_period_end: nextRenewalDate.toISOString(),
          hiring_subscription_cancel_at_period_end: false,
        })
        .eq("id", companyId);

      if (updateError) {
        console.error("update_company error", updateError);
        return new Response(JSON.stringify({
          error: "Failed to update company with subscription",
          step: "update_company",
          details: (updateError as any)?.message || updateError,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }

      // Log transaction
      const { error: txError } = await supabase
        .from("billing_transactions")
        .insert({
          company_id: companyId,
          amount: hiringCost,
          type: "credit_used",
          description: "Hiring Tab Subscription (Credits)",
        });

      if (txError) {
        console.error("insert_transaction error", txError);
        return new Response(JSON.stringify({
          error: "Failed to insert billing transaction",
          step: "insert_transaction",
          details: (txError as any)?.message || txError,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }

      console.log("Subscription activated with credits");

      return new Response(JSON.stringify({ 
        success: true,
        message: "Subscription activated using credits"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET");
    if (!stripeSecret) throw new Error("Stripe configuration error");

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    // Get or create Stripe customer
    let customerId = company.stripe_customer_id;

    if (!customerId) {
      const customers = await stripe.customers.list({ email: company.admin_email, limit: 1 });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: company.admin_email,
          name: company.name,
          metadata: { company_id: company.id }
        });
        customerId = customer.id;
      }

      // Save customer ID
      await supabase
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", companyId);
    }

    // Create monthly subscription directly and charge card on file (no Checkout)
    const priceAmount = 50000; // $500.00 in cents for Stripe
    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: priceAmount,
      recurring: { interval: "month" },
      product_data: {
        name: "RoleColorFinder Hiring Tab",
      },
    });

    // Find any attached payment method (list is more reliable than invoice_settings.default_payment_method
    // because Stripe Checkout Setup mode attaches the card but doesn't always set it as the invoice default)
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    if (paymentMethods.data.length === 0) {
      console.error("no payment method on file for customer", customerId);
      return new Response(JSON.stringify({
        error: "No payment method on file. Please add a payment method first.",
        step: "no_default_payment_method",
        details: { customerId },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    const defaultPM = paymentMethods.data[0].id;

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      default_payment_method: defaultPM,
      billing_cycle_anchor: Math.floor(nextRenewalDate.getTime() / 1000),
      proration_behavior: "create_prorations",
      // "default_incomplete" lets us handle 3DS/requires_action instead of immediately erroring
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
      metadata: { company_id: companyId, type: "hiring_subscription" },
    });

    const latestInvoice = typeof subscription.latest_invoice !== "string" ? subscription.latest_invoice : null;
    const paymentIntent = latestInvoice && typeof latestInvoice.payment_intent !== "string"
      ? latestInvoice.payment_intent
      : null;

    // If the card requires 3DS authentication, return the action URL so the frontend can redirect
    if (paymentIntent?.status === "requires_action" || paymentIntent?.status === "requires_source_action") {
      const actionUrl = (paymentIntent as any)?.next_action?.redirect_to_url?.url
        ?? (paymentIntent as any)?.next_action?.use_stripe_sdk?.stripe_js;

      // Save the incomplete subscription so we can activate it after auth completes
      await supabase.from("companies").update({
        hiring_subscription_id: subscription.id,
        hiring_subscription_status: subscription.status,
        hiring_subscription_enabled: false,
        hiring_subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        hiring_subscription_cancel_at_period_end: false,
      }).eq("id", companyId);

      return new Response(JSON.stringify({
        success: false,
        requiresAction: true,
        actionUrl,
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
        step: "requires_authentication",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // Payment succeeded or is in trialing — save subscription
    const { error: subUpdateError } = await supabase
      .from("companies")
      .update({
        hiring_subscription_enabled: subscription.status === "active" || subscription.status === "trialing",
        hiring_subscription_status: subscription.status,
        hiring_subscription_id: subscription.id,
        hiring_subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        hiring_subscription_cancel_at_period_end: subscription.cancel_at_period_end || false,
      })
      .eq("id", companyId);
    if (subUpdateError) {
      console.error("update_company_subscription error", subUpdateError);
      return new Response(JSON.stringify({
        error: "Failed to update company with Stripe subscription",
        step: "update_company_subscription",
        details: (subUpdateError as any)?.message || subUpdateError,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    // Record charge
    const { error: txErr } = await supabase.from("billing_transactions").insert({
      company_id: companyId,
      type: "charge",
      amount: 500.0,
      description: "Hiring Tab subscription (card on file)",
      stripe_payment_intent_id: paymentIntent?.id,
    });
    if (txErr) console.error("Billing transaction insert error:", txErr);

    return new Response(JSON.stringify({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating hiring subscription:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
