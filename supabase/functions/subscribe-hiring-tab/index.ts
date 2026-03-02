import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Returns exactly one month from the current moment (subscription sign-up date → renewal date)
const oneMonthFromNow = () => {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
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
    // Renewal is always exactly one month from the moment the subscription is created
    const nextRenewalDate = oneMonthFromNow();
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

    // --- Billing split: credits first, card for the remainder ---
    // credit_balance is stored as DECIMAL; ensure it's a JS number
    const creditBalance = typeof company.credit_balance === "number"
      ? company.credit_balance
      : parseFloat((company.credit_balance as unknown as string) ?? "0");

    // How much of the $500 can credits cover (capped at $500)?
    const creditContribution = Number(Math.min(creditBalance, hiringCost).toFixed(2));
    // How much still needs to go on the card?
    const cardCharge = Number((hiringCost - creditContribution).toFixed(2));

    // --- Case A: Credits cover the full $500 (no card needed) ---
    if (cardCharge === 0) {
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
        console.error("update_company (full credits) error", updateError);
        return new Response(JSON.stringify({
          error: "Failed to activate subscription",
          step: "update_company",
          details: (updateError as any)?.message || updateError,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }

      await supabase.from("billing_transactions").insert({
        company_id: companyId,
        amount: hiringCost,
        type: "credit_used",
        description: "Hiring Tab Subscription (fully covered by billing credits)",
      });

      console.log("Subscription activated — fully covered by credits");
      return new Response(JSON.stringify({
        success: true,
        message: "Subscription activated using billing credits",
        creditApplied: creditContribution,
        cardCharged: 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // --- Case B & C: Card must be charged (all or partial $500) ---
    // We continue below to charge the card. Credits are only deducted AFTER the card succeeds.

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

    // Create the $500/month price used for all recurring billing
    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: 50000, // $500.00 in cents
      recurring: { interval: "month" },
      product_data: { name: "RoleColorFinder Hiring Tab" },
    });

    // If the customer has partial credits, create a one-time coupon so Stripe only
    // charges the card for the remainder. The coupon is `duration: once` so subsequent
    // monthly renewals are billed at the full $500.
    let couponId: string | null = null;
    if (creditContribution > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(creditContribution * 100), // cents
        currency: "usd",
        duration: "once",
        name: `Billing Credits ($${creditContribution.toFixed(2)})`,
      });
      couponId = coupon.id;
      console.log(`Created coupon ${couponId} for $${creditContribution.toFixed(2)} credit contribution`);
    }

    // Find any attached payment method. If the stored customer has no card, search all customers
    // for this email — handles the case where the card was set up against a different Stripe customer.
    let paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    // Fallback 1: scan other Stripe customers with the same email
    if (paymentMethods.data.length === 0) {
      console.log("No card on stored customer, scanning all email-matched customers...");
      const emailCustomers = await stripe.customers.list({ email: company.admin_email, limit: 10 });
      for (const c of emailCustomers.data) {
        if (c.id === customerId) continue;
        const pms = await stripe.paymentMethods.list({ customer: c.id, type: "card" });
        if (pms.data.length > 0) {
          console.log("Found card on alternate customer", c.id, "— updating stored customer ID");
          paymentMethods = pms;
          customerId = c.id;
          await supabase.from("companies").update({ stripe_customer_id: customerId }).eq("id", companyId);
          break;
        }
      }
    }

    // Fallback 2: check the customer's invoice_settings.default_payment_method
    // (covers cards set as the customer default but not returned by paymentMethods.list)
    let defaultPM: string | null = null;
    if (paymentMethods.data.length > 0) {
      defaultPM = paymentMethods.data[0].id;
    } else {
      try {
        const customerObj = await stripe.customers.retrieve(customerId) as any;
        const invoiceDefault = customerObj?.invoice_settings?.default_payment_method;
        const sourceDefault = customerObj?.default_source;
        if (invoiceDefault) {
          console.log("Using invoice_settings.default_payment_method as fallback:", invoiceDefault);
          defaultPM = typeof invoiceDefault === "string" ? invoiceDefault : invoiceDefault.id;
        } else if (sourceDefault) {
          console.log("Using default_source as fallback:", sourceDefault);
          defaultPM = typeof sourceDefault === "string" ? sourceDefault : sourceDefault.id;
        }
      } catch (e) {
        console.error("Failed to retrieve customer for fallback PM check:", e);
      }
    }

    if (!defaultPM) {
      console.error("no payment method on file for any customer matching", company.admin_email);
      return new Response(JSON.stringify({
        error: "No payment method on file. Please add a payment method first.",
        step: "no_default_payment_method",
        details: { customerId },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    // Use error_if_incomplete so Stripe immediately throws on card decline rather than
    // creating an incomplete subscription we'd have to clean up manually.
    let subscription: Stripe.Subscription;
    try {
      subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        default_payment_method: defaultPM,
        payment_behavior: "error_if_incomplete",
        expand: ["latest_invoice.payment_intent"],
        metadata: { company_id: companyId, type: "hiring_subscription" },
        // Apply one-time credit coupon if the customer has partial credits
        ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
      });
    } catch (stripeErr: any) {
      // Card failed — clean up the coupon so it's not left dangling
      if (couponId) { try { await stripe.coupons.del(couponId); } catch (_) {} }
      // Card declined / insufficient funds / do_not_honor etc.
      if (stripeErr?.type === "StripeCardError" || stripeErr?.code === "card_declined" ||
          stripeErr?.decline_code || stripeErr?.param === "payment_method_data") {
        return new Response(JSON.stringify({
          error: "Your card was declined. Please check your card details or update your payment method and try again.",
          step: "card_declined",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }
      // 3DS / authentication required
      if (stripeErr?.payment_intent?.status === "requires_action" ||
          stripeErr?.code === "subscription_payment_intent_requires_action") {
        const pi = stripeErr.payment_intent;
        const actionUrl = pi?.next_action?.redirect_to_url?.url ?? pi?.next_action?.use_stripe_sdk?.stripe_js;
        return new Response(JSON.stringify({
          success: false,
          requiresAction: true,
          actionUrl,
          clientSecret: pi?.client_secret,
          step: "requires_authentication",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
      }
      // Any other Stripe error (network, config, etc.)
      console.error("Stripe subscription create error:", stripeErr);
      return new Response(JSON.stringify({
        error: stripeErr?.message || "Payment could not be processed. Please update your payment method and try again.",
        step: "payment_failed",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    const latestInvoice = typeof subscription.latest_invoice !== "string" ? subscription.latest_invoice : null;
    const paymentIntent = latestInvoice && typeof latestInvoice.payment_intent !== "string"
      ? latestInvoice.payment_intent
      : null;

    // Catch any incomplete state that slipped through (shouldn't happen with error_if_incomplete)
    if (subscription.status === "incomplete") {
      if (paymentIntent?.status === "requires_action") {
        const actionUrl = (paymentIntent as any)?.next_action?.redirect_to_url?.url
          ?? (paymentIntent as any)?.next_action?.use_stripe_sdk?.stripe_js;
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
      try { await stripe.subscriptions.cancel(subscription.id); } catch (_) {}
      return new Response(JSON.stringify({
        error: "Your card was declined. Please check your card details or update your payment method and try again.",
        step: "card_declined",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    // Card charge succeeded — now it's safe to deduct credits
    if (creditContribution > 0) {
      const newBalance = Number((creditBalance - creditContribution).toFixed(2));
      await supabase.from("companies").update({ credit_balance: newBalance }).eq("id", companyId);
      await supabase.from("billing_transactions").insert({
        company_id: companyId,
        type: "credit_used",
        amount: creditContribution,
        description: `Billing credits applied to Hiring Tab subscription ($${creditContribution.toFixed(2)} of $500.00)`,
      });
      console.log(`Deducted $${creditContribution.toFixed(2)} in credits after successful card charge`);
    }

    // Save subscription to company
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

    // Record the card charge (only the amount actually charged to the card)
    const { error: txErr } = await supabase.from("billing_transactions").insert({
      company_id: companyId,
      type: "charge",
      amount: cardCharge,
      description: creditContribution > 0
        ? `Hiring Tab subscription — card charged $${cardCharge.toFixed(2)} ($${creditContribution.toFixed(2)} covered by credits)`
        : "Hiring Tab subscription (card on file)",
      stripe_payment_intent_id: paymentIntent?.id,
    });
    if (txErr) console.error("Billing transaction insert error:", txErr);

    return new Response(JSON.stringify({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      creditApplied: creditContribution,
      cardCharged: cardCharge,
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
