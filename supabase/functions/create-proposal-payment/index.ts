import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalSlug, proposalId, companyName, acceptanceId, successUrl, cancelUrl } =
      await req.json();

    if (!proposalSlug || !companyName || !successUrl || !cancelUrl || !acceptanceId) {
      throw new Error("Missing required fields");
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET");
    if (!stripeSecret) throw new Error("Stripe configuration error");

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "RoleColorFinder — Platform Deployment",
              description: `One-time platform deployment fee for ${companyName}`,
            },
            unit_amount: 500000, // $5,000 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      allow_promotion_codes: true,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&acceptance_id=${acceptanceId}`,
      cancel_url: cancelUrl,
      metadata: {
        proposal_slug: proposalSlug,
        proposal_id: proposalId ?? "",
        company_name: companyName,
        acceptance_id: acceptanceId,
        type: "proposal_deployment",
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-proposal-payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
