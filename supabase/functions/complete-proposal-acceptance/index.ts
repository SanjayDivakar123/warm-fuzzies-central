import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function requireText(value: unknown, field: string) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) throw new Error(`${field} is required`);
  return trimmed;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalSlug, acceptanceId, firstName, lastName, email, phone, designation } = await req.json();

    if (!proposalSlug || !acceptanceId) {
      throw new Error("Proposal slug and acceptance ID are required");
    }

    const contact = {
      first_name: requireText(firstName, "First name"),
      last_name: requireText(lastName, "Last name"),
      email: requireText(email, "Email"),
      phone: requireText(phone, "Phone"),
      designation: requireText(designation, "Designation"),
    };

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase configuration error");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: acceptance, error: acceptanceError } = await supabase
      .from("proposal_acceptances")
      .select("id, proposal_slug, payment_status")
      .eq("id", acceptanceId)
      .eq("proposal_slug", proposalSlug)
      .maybeSingle();

    if (acceptanceError || !acceptance) throw new Error("Acceptance record not found");
    if (acceptance.payment_status !== "paid") throw new Error("Payment must be verified before onboarding");

    const { error: updateAcceptanceError } = await supabase
      .from("proposal_acceptances")
      .update({
        ...contact,
        status: "completed",
      })
      .eq("id", acceptanceId)
      .eq("proposal_slug", proposalSlug);

    if (updateAcceptanceError) throw updateAcceptanceError;

    const { data: proposal, error: proposalError } = await supabase
      .from("client_proposals")
      .select("id")
      .eq("slug", proposalSlug)
      .order("version", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (proposalError || !proposal) throw new Error("Proposal not found");

    const { error: updateProposalError } = await supabase
      .from("client_proposals")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", proposal.id);

    if (updateProposalError) throw updateProposalError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("complete-proposal-acceptance error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
