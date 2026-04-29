import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, acceptanceId, proposalSlug } = await req.json();
    if (!sessionId || !acceptanceId || !proposalSlug) {
      throw new Error("Session ID, acceptance ID, and proposal slug are required");
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET");
    if (!stripeSecret) throw new Error("Stripe configuration error");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase configuration error");

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer", "payment_intent", "setup_intent"],
    });

    const metadata = session.metadata ?? {};
    if (
      metadata.type !== "proposal_deployment" ||
      metadata.acceptance_id !== acceptanceId ||
      metadata.proposal_slug !== proposalSlug
    ) {
      throw new Error("Payment session does not match this proposal");
    }

    const expectedAmount = Number(metadata.setup_fee_cents);
    if (!Number.isFinite(expectedAmount)) {
      throw new Error("Payment amount does not match the proposal setup fee");
    }

    if (expectedAmount > 0 && (session.payment_status !== "paid" || session.amount_total !== expectedAmount)) {
      throw new Error("Payment amount does not match the proposal setup fee");
    }

    if (expectedAmount === 0 && (session.mode !== "setup" || session.status !== "complete")) {
      throw new Error("Waived deployment fee must use a setup session");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const stripeCustomerId = typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

    const paymentIntent = typeof session.payment_intent === "string"
      ? await stripe.paymentIntents.retrieve(session.payment_intent)
      : session.payment_intent;

    const setupIntent = typeof session.setup_intent === "string"
      ? await stripe.setupIntents.retrieve(session.setup_intent)
      : session.setup_intent;

    const paymentMethodId = typeof paymentIntent?.payment_method === "string"
      ? paymentIntent.payment_method
      : paymentIntent?.payment_method?.id ?? (
        typeof setupIntent?.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent?.payment_method?.id ?? null
      );

    if (stripeCustomerId && paymentMethodId) {
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    const { data: acceptance, error: acceptanceError } = await supabase
      .from("proposal_acceptances")
      .select("id, proposal_slug, payment_status, stripe_customer_id")
      .eq("id", acceptanceId)
      .eq("proposal_slug", proposalSlug)
      .maybeSingle();

    if (acceptanceError || !acceptance) throw new Error("Acceptance record not found");

    if (acceptance.payment_status !== "paid") {
      const { error } = await supabase
        .from("proposal_acceptances")
        .update({
          stripe_session_id: session.id,
          stripe_customer_id: stripeCustomerId,
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          status: "contact_pending",
        })
        .eq("id", acceptanceId)
        .eq("proposal_slug", proposalSlug);

      if (error) throw error;
    } else if (stripeCustomerId && !acceptance.stripe_customer_id) {
      const { error } = await supabase
        .from("proposal_acceptances")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", acceptanceId)
        .eq("proposal_slug", proposalSlug);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("verify-proposal-payment error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
