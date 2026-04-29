import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { proposalSlug, acceptanceId, signedName } = await req.json();
    const trimmedName = typeof signedName === "string" ? signedName.trim() : "";

    if (!proposalSlug || !acceptanceId || trimmedName.length < 2) {
      throw new Error("Proposal slug, acceptance ID, and signer name are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase configuration error");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: acceptance, error: acceptanceError } = await supabase
      .from("proposal_acceptances")
      .select("id, proposal_slug, loi_signed_name, payment_status")
      .eq("id", acceptanceId)
      .eq("proposal_slug", proposalSlug)
      .maybeSingle();

    if (acceptanceError || !acceptance) throw new Error("Acceptance record not found");
    if (!acceptance.loi_signed_name) throw new Error("Letter of Intent must be signed first");
    if (acceptance.payment_status === "paid") throw new Error("Proposal is already paid");

    const { error } = await supabase
      .from("proposal_acceptances")
      .update({
        loe_signed_name: trimmedName,
        loe_signed_at: new Date().toISOString(),
        agreement_accepted: true,
        status: "payment_pending",
      })
      .eq("id", acceptanceId)
      .eq("proposal_slug", proposalSlug);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("sign-proposal-loe error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
