import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { parseProposalFeeToCents, formatCentsAsUsd } from "../_shared/proposalPricing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalSlug, acceptanceId, successUrl, cancelUrl } = await req.json();

    if (!proposalSlug || !successUrl || !cancelUrl || !acceptanceId) {
      throw new Error("Missing required fields");
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET");
    if (!stripeSecret) throw new Error("Stripe configuration error");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration error");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: proposal, error: proposalError } = await supabase
      .from("client_proposals")
      .select("proposal_id, company_name, pricing, version, updated_at")
      .eq("slug", proposalSlug)
      .order("version", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (proposalError || !proposal) {
      throw new Error("Proposal not found");
    }

    const { data: acceptance, error: acceptanceError } = await supabase
      .from("proposal_acceptances")
      .select("id, proposal_slug, status, agreement_accepted, loe_signed_name")
      .eq("id", acceptanceId)
      .eq("proposal_slug", proposalSlug)
      .maybeSingle();

    if (acceptanceError || !acceptance) {
      throw new Error("Acceptance record not found");
    }

    if (!acceptance.agreement_accepted || !acceptance.loe_signed_name) {
      throw new Error("Agreement must be signed before payment");
    }

    const pricing = proposal.pricing as Record<string, unknown>;
    const setupFeeCents = parseProposalFeeToCents(pricing?.platformDeployment);
    if (setupFeeCents === null) {
      throw new Error("Invalid platform deployment fee");
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
    const setupFeeLabel = formatCentsAsUsd(setupFeeCents);
    const metadata = {
      proposal_slug: proposalSlug,
      proposal_id: proposal.proposal_id ?? "",
      company_name: proposal.company_name,
      acceptance_id: acceptanceId,
      type: "proposal_deployment",
      setup_fee_cents: setupFeeCents.toString(),
      setup_fee_label: setupFeeCents === 0 ? "Platform Deployment Fee Waived" : setupFeeLabel,
    };

    const session = setupFeeCents === 0
      ? await stripe.checkout.sessions.create({
          mode: "setup",
          payment_method_types: ["card"],
          customer: (await stripe.customers.create({
            name: proposal.company_name,
            metadata,
          })).id,
          success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&acceptance_id=${acceptanceId}`,
          cancel_url: cancelUrl,
          metadata,
          setup_intent_data: {
            metadata,
          },
        })
      : await stripe.checkout.sessions.create({
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "RoleColorFinder — Platform Deployment",
                  description: `One-time platform deployment fee for ${proposal.company_name}`,
                },
                unit_amount: setupFeeCents,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          customer_creation: "always",
          payment_intent_data: {
            setup_future_usage: "off_session",
            metadata,
          },
          success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&acceptance_id=${acceptanceId}`,
          cancel_url: cancelUrl,
          metadata,
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
