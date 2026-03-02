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
    const companyId = body?.companyId;
    const rawRequestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";
    const requestId = rawRequestId || crypto.randomUUID();

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
      .select("id, name, admin_email, stripe_customer_id, credit_balance, created_at, hiring_subscription_enabled, hiring_subscription_status, hiring_subscription_id")
      .eq("id", companyId)
      .single();

    if (companyError || !company) throw new Error("Company not found");

    const responseHeaders = { ...corsHeaders, "Content-Type": "application/json" };

    // Block if an active subscription already exists — max 1 per company
    if (
      company.hiring_subscription_enabled &&
      company.hiring_subscription_id &&
      (company.hiring_subscription_status === "active" || company.hiring_subscription_status === "trialing")
    ) {
      return new Response(JSON.stringify({
        error: "This company already has an active Hiring Tab subscription.",
        step: "already_subscribed",
      }), { headers: responseHeaders, status: 400 });
    }

    let lockAcquired = false;
    let lockStatus: "processing" | "completed" | "failed" = "failed";
    let lockTtlSeconds = 15;
    let lockSubscriptionId: string | null = null;
    let lockPaymentIntentId: string | null = null;
    let lockError: string | null = null;

    const { data: lockData, error: lockErrorResponse } = await supabase.rpc("acquire_hiring_subscription_lock", {
      p_company_id: companyId,
      p_request_id: requestId,
      p_ttl_seconds: 120,
    });

    if (lockErrorResponse) {
      console.error("Failed to acquire subscription lock:", lockErrorResponse);
      return new Response(JSON.stringify({
        error: "Unable to process subscription right now. Please try again.",
        step: "acquire_lock_failed",
      }), { headers: responseHeaders, status: 500 });
    }

    const currentLock = Array.isArray(lockData) ? lockData[0] : lockData;
    if (!currentLock?.acquired) {
      return new Response(JSON.stringify({
        error: "A subscription request is already being processed. Please wait a few seconds and try again.",
        step: "already_processing",
        requestId: currentLock?.current_request_id ?? null,
      }), { headers: responseHeaders, status: 409 });
    }

    lockAcquired = true;

    try {

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
        lockError = "Failed to activate internal free hiring subscription";
        console.error("update_company_internal_free error", freeUpdateError);
        return new Response(JSON.stringify({
          error: "Failed to activate internal free hiring subscription",
          step: "update_company_internal_free",
          details: (freeUpdateError as any)?.message || freeUpdateError,
        }), { headers: responseHeaders, status: 400 });
      }

      lockStatus = "completed";
      lockTtlSeconds = 600;
      return new Response(JSON.stringify({
        success: true,
        subscriptionId: null,
        status: "active",
        internalFree: true,
      }), {
        headers: responseHeaders,
        status: 200,
      });
    }

    // --- Billing split: credits first, card for the remainder ---
    // credit_balance is stored as DECIMAL; ensure it's a JS number
    const rawCreditBalance = company.credit_balance;
    const creditBalance = typeof rawCreditBalance === "number"
      ? rawCreditBalance
      : parseFloat((rawCreditBalance as unknown as string) ?? "0");

    // How much of the $500 can credits cover (capped at $500)?
    const creditContribution = Number(Math.min(creditBalance, hiringCost).toFixed(2));
    // How much still needs to go on the card?
    const cardCharge = Number((hiringCost - creditContribution).toFixed(2));

    console.log("Billing calculation:", {
      companyId,
      rawCreditBalance,
      creditBalance,
      creditContribution,
      cardCharge,
      hiringCost,
    });

    // Initialise Stripe once — reused for duplicate guard and subscription creation
    const stripeSecret = Deno.env.get("STRIPE_SECRET");
    if (!stripeSecret) throw new Error("Stripe configuration error");
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    // Request-scoped idempotency key base so retries of the same client request
    // reuse the same Stripe operation and never double-charge.
    const idempotencyKeyBase = `hiring-${companyId}-${requestId}`;

    // --- Resolve Stripe customer FIRST (before duplicate guard) ---
    // This ensures we have a valid customer ID to check for existing subscriptions,
    // even if the company record doesn't have stripe_customer_id yet.
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
        }, { idempotencyKey: `cust-${idempotencyKeyBase}` });
        customerId = customer.id;
      }
      await supabase.from("companies").update({ stripe_customer_id: customerId }).eq("id", companyId);
    }

    // --- Stripe-level duplicate guard ---
    // Check Stripe directly for existing hiring subscriptions on this customer.
    // This protects against double charges in several scenarios:
    //   1. A previous call charged the card but the DB update failed.
    //   2. Two concurrent calls both pass the DB guard before either writes back.
    //   3. Multiple browser tabs / network retries.
    if (cardCharge > 0) {
      const [activeSubs, trialingSubs, incompleteSubs] = await Promise.all([
        stripe.subscriptions.list({ customer: customerId, status: "active", limit: 10 }),
        stripe.subscriptions.list({ customer: customerId, status: "trialing", limit: 10 }),
        stripe.subscriptions.list({ customer: customerId, status: "incomplete", limit: 10 }),
      ]);
      const existingHiringSub = [
        ...activeSubs.data,
        ...trialingSubs.data,
        ...incompleteSubs.data,
      ].find(
        (sub) =>
          sub.metadata?.company_id === companyId &&
          sub.metadata?.type === "hiring_subscription"
      );

      if (existingHiringSub) {
        if (existingHiringSub.status === "active" || existingHiringSub.status === "trialing") {
          console.log("Stripe-level duplicate guard triggered — existing active sub found:", existingHiringSub.id);
          // Sync DB to match Stripe reality and return success without charging again
          await supabase.from("companies").update({
            hiring_subscription_enabled: true,
            hiring_subscription_status: existingHiringSub.status,
            hiring_subscription_id: existingHiringSub.id,
            hiring_subscription_current_period_end: new Date(existingHiringSub.current_period_end * 1000).toISOString(),
            hiring_subscription_cancel_at_period_end: existingHiringSub.cancel_at_period_end,
          }).eq("id", companyId);
          lockStatus = "completed";
          lockTtlSeconds = 600;
          lockSubscriptionId = existingHiringSub.id;
          return new Response(JSON.stringify({
            success: true,
            subscriptionId: existingHiringSub.id,
            status: existingHiringSub.status,
            alreadyExisted: true,
          }), { headers: responseHeaders, status: 200 });
        }

        // Incomplete subscription exists (from failed payment) — cancel it to avoid duplicates
        // before attempting a new subscription with fresh payment
        if (existingHiringSub.status === "incomplete") {
          console.log("Found incomplete hiring subscription, cancelling before retry:", existingHiringSub.id);
          try {
            await stripe.subscriptions.cancel(existingHiringSub.id);
          } catch (cancelErr) {
            console.error("Failed to cancel incomplete subscription:", cancelErr);
          }
        }
      }
    }

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
        lockError = "Failed to activate subscription";
        console.error("update_company (full credits) error", updateError);
        return new Response(JSON.stringify({
          error: "Failed to activate subscription",
          step: "update_company",
          details: (updateError as any)?.message || updateError,
        }), { headers: responseHeaders, status: 400 });
      }

      await supabase.from("billing_transactions").insert({
        company_id: companyId,
        amount: hiringCost,
        type: "credit_used",
        description: "Hiring Tab Subscription (fully covered by billing credits)",
      });

      console.log("Subscription activated — fully covered by credits");
      lockStatus = "completed";
      lockTtlSeconds = 600;
      return new Response(JSON.stringify({
        success: true,
        message: "Subscription activated using billing credits",
        creditApplied: creditContribution,
        cardCharged: 0,
      }), { headers: responseHeaders, status: 200 });
    }

    // --- Case B & C: Card must be charged (all or partial $500) ---
    // Credits are only deducted AFTER the card succeeds.
    //
    // The price + subscription idempotency keys are request-scoped, so retries
    // of the same request ID reuse the exact same Stripe operation.
    // The Stripe-level duplicate guard above handles cross-request retries.

    // Find attached payment method (email-based fallback handles customer ID mismatches)
    let paymentMethods = await stripe.paymentMethods.list({ customer: customerId, type: "card" });

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

    let defaultPM: string | null = paymentMethods.data.length > 0 ? paymentMethods.data[0].id : null;
    if (!defaultPM) {
      try {
        const customerObj = await stripe.customers.retrieve(customerId) as any;
        const inv = customerObj?.invoice_settings?.default_payment_method;
        const src = customerObj?.default_source;
        defaultPM = (typeof inv === "string" ? inv : inv?.id) ?? (typeof src === "string" ? src : src?.id) ?? null;
      } catch (_) {}
    }

    if (!defaultPM) {
      lockError = "No payment method on file";
      return new Response(JSON.stringify({
        error: "No payment method on file. Please add a payment method first.",
        step: "no_default_payment_method",
      }), { headers: responseHeaders, status: 400 });
    }

    // Create $500/month price for recurring billing using request-scoped idempotency.
    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: 50000,
      recurring: { interval: "month" },
      product_data: { name: "RoleColorFinder Hiring Tab" },
    }, { idempotencyKey: `price-${idempotencyKeyBase}` });

    // If partial credits apply, create a one-time coupon to reduce the first invoice.
    // Both the coupon and subscription use idempotency keys so concurrent calls
    // produce the same Stripe objects and the card is charged only once.
    let couponId: string | null = null;
    if (creditContribution > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(creditContribution * 100),
        currency: "usd",
        duration: "once",
        name: `Billing Credits ($${creditContribution.toFixed(2)})`,
      }, { idempotencyKey: `coupon-${idempotencyKeyBase}` });
      couponId = coupon.id;
      console.log(`Coupon ${couponId} for $${creditContribution.toFixed(2)} (request ${requestId})`);
    }

    // Create the subscription. error_if_incomplete makes Stripe throw immediately on
    // card decline rather than leaving an incomplete subscription to clean up.
    let subscription: Stripe.Subscription;
    try {
      subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        default_payment_method: defaultPM,
        payment_behavior: "error_if_incomplete",
        expand: ["latest_invoice.payment_intent"],
        metadata: { company_id: companyId, type: "hiring_subscription" },
        ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
      }, { idempotencyKey: `sub-${idempotencyKeyBase}` });
    } catch (stripeErr: any) {
      // Card declined / insufficient funds / etc.
      if (stripeErr?.type === "StripeCardError" || stripeErr?.code === "card_declined" ||
          stripeErr?.decline_code || stripeErr?.param === "payment_method_data") {
        lockError = "Card declined";
        return new Response(JSON.stringify({
          error: "Your card was declined. Please check your card details or update your payment method and try again.",
          step: "card_declined",
        }), { headers: responseHeaders, status: 400 });
      }
      // 3DS / bank authentication required
      if (stripeErr?.payment_intent?.status === "requires_action" ||
          stripeErr?.code === "subscription_payment_intent_requires_action") {
        const pi = stripeErr.payment_intent;
        const actionUrl = pi?.next_action?.redirect_to_url?.url ?? pi?.next_action?.use_stripe_sdk?.stripe_js;
        lockError = "Requires authentication";
        return new Response(JSON.stringify({
          success: false,
          requiresAction: true,
          actionUrl,
          clientSecret: pi?.client_secret,
          step: "requires_authentication",
        }), { headers: responseHeaders, status: 200 });
      }
      console.error("Stripe subscription create error:", stripeErr);
      lockError = stripeErr?.message || "Payment failed";
      return new Response(JSON.stringify({
        error: stripeErr?.message || "Payment could not be processed. Please update your payment method and try again.",
        step: "payment_failed",
      }), { headers: responseHeaders, status: 400 });
    }

    const latestInvoice = typeof subscription.latest_invoice !== "string" ? subscription.latest_invoice : null;
    const paymentIntent = latestInvoice && typeof latestInvoice.payment_intent !== "string"
      ? latestInvoice.payment_intent : null;

    // Catch any incomplete state that slipped through
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
        lockError = "Requires authentication";
        return new Response(JSON.stringify({
          success: false, requiresAction: true, actionUrl,
          clientSecret: paymentIntent.client_secret, subscriptionId: subscription.id,
          step: "requires_authentication",
        }), { headers: responseHeaders, status: 200 });
      }
      try { await stripe.subscriptions.cancel(subscription.id); } catch (_) {}
      lockError = "Card declined";
      return new Response(JSON.stringify({
        error: "Your card was declined. Please check your card details or update your payment method and try again.",
        step: "card_declined",
      }), { headers: responseHeaders, status: 400 });
    }

    // Card charge succeeded — now safe to deduct credits
    if (creditContribution > 0) {
      const newBalance = Number((creditBalance - creditContribution).toFixed(2));
      await supabase.from("companies").update({ credit_balance: newBalance }).eq("id", companyId);
      await supabase.from("billing_transactions").insert({
        company_id: companyId,
        type: "credit_used",
        amount: creditContribution,
        description: `Billing credits applied to Hiring Tab subscription ($${creditContribution.toFixed(2)} of $500.00)`,
      });
      console.log(`Deducted $${creditContribution.toFixed(2)} credits after successful card charge`);
    }

    // Save subscription
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
      lockError = "Failed to update company with Stripe subscription";
      console.error("update_company_subscription error", subUpdateError);
      return new Response(JSON.stringify({
        error: "Failed to update company with Stripe subscription",
        step: "update_company_subscription",
      }), { headers: responseHeaders, status: 400 });
    }

    if (!paymentIntent?.id) {
      lockError = "Missing payment intent on successful subscription";
      return new Response(JSON.stringify({
        error: "Payment succeeded but no payment intent was returned.",
        step: "missing_payment_intent",
      }), { headers: responseHeaders, status: 400 });
    }

    const { error: chargeInsertError } = await supabase
      .from("billing_transactions")
      .upsert({
        company_id: companyId,
        type: "charge",
        amount: cardCharge,
        description: creditContribution > 0
          ? `Hiring Tab subscription — $${cardCharge.toFixed(2)} card + $${creditContribution.toFixed(2)} credits`
          : "Hiring Tab subscription (card on file)",
        stripe_payment_intent_id: paymentIntent.id,
      }, { onConflict: "stripe_payment_intent_id" });

    if (chargeInsertError) {
      lockError = "Failed to persist charge transaction";
      return new Response(JSON.stringify({
        error: "Failed to persist billing transaction.",
        step: "insert_billing_transaction",
      }), { headers: responseHeaders, status: 400 });
    }

    lockStatus = "completed";
    lockTtlSeconds = 600;
    lockSubscriptionId = subscription.id;
    lockPaymentIntentId = paymentIntent.id;
    return new Response(JSON.stringify({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      creditApplied: creditContribution,
      cardCharged: cardCharge,
    }), {
      headers: responseHeaders,
      status: 200,
    });
    } finally {
      if (lockAcquired) {
        const { error: persistLockError } = await supabase
          .from("hiring_subscription_request_locks")
          .update({
            status: lockStatus,
            updated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + lockTtlSeconds * 1000).toISOString(),
            subscription_id: lockSubscriptionId,
            payment_intent_id: lockPaymentIntentId,
            last_error: lockStatus === "failed" ? (lockError ?? "Subscription failed") : null,
          })
          .eq("company_id", companyId)
          .eq("request_id", requestId);

        if (persistLockError) {
          console.error("Failed to persist hiring subscription lock state:", persistLockError);
        }
      }
    }
  } catch (error: any) {
    console.error("Error creating hiring subscription:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
