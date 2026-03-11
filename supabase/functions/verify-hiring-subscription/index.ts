import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  console.log("=== VERIFY HIRING SUBSCRIPTION PAYMENT FUNCTION STARTED ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) throw new Error("sessionId is required");

    const stripeSecret = Deno.env.get("STRIPE_SECRET");
    if (!stripeSecret) throw new Error("Stripe configuration error");

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const companyId = session.metadata?.company_id;
    if (!companyId) throw new Error("No company ID in session metadata");

    // Get subscription details
    const subscriptionId = session.subscription as string;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice.payment_intent"],
    });

    const isActiveSubscription = subscription.status === "active" || subscription.status === "trialing";

    if (!isActiveSubscription) {
      await supabase
        .from("companies")
        .update({
          hiring_subscription_enabled: false,
          hiring_subscription_status: subscription.status,
          hiring_subscription_id: subscriptionId,
          hiring_subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          hiring_subscription_cancel_at_period_end: subscription.cancel_at_period_end || false,
        })
        .eq("id", companyId);

      throw new Error(`Subscription is not active. Current status: ${subscription.status}`);
    }

    // Update company with subscription details
    const { error: updateError } = await supabase
      .from("companies")
      .update({
        hiring_subscription_enabled: isActiveSubscription,
        hiring_subscription_status: subscription.status,
        hiring_subscription_id: subscriptionId,
        hiring_subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        hiring_subscription_cancel_at_period_end: subscription.cancel_at_period_end || false,
      })
      .eq("id", companyId);

    if (updateError) {
      console.error("Error updating company:", updateError);
      throw updateError;
    }

    const latestInvoice = typeof subscription.latest_invoice !== "string" ? subscription.latest_invoice : null;
    const paymentIntent = latestInvoice && typeof latestInvoice.payment_intent !== "string"
      ? latestInvoice.payment_intent
      : null;

    // Record initial charge only when we have a real Stripe payment intent.
    const paymentIntentId = paymentIntent?.id ?? null;
    const { error: txError } = paymentIntentId
      ? await supabase.from("billing_transactions").upsert({
          company_id: companyId,
          type: "charge",
          amount: 500.0,
          stripe_payment_intent_id: paymentIntentId,
          description: "Hiring Tab subscription started",
        }, { onConflict: "stripe_payment_intent_id" })
      : { error: null };

    if (txError) {
      console.error("Error inserting billing transaction:", txError);
      // Do not fail verification due to logging issues
    }

    console.log("Hiring subscription activated for company:", companyId);

    return new Response(JSON.stringify({ 
      success: true,
      subscriptionId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error verifying hiring subscription:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
