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
    const { proposalSlug, signedName } = await req.json();
    const trimmedName = typeof signedName === "string" ? signedName.trim() : "";

    if (!proposalSlug || trimmedName.length < 2) {
      throw new Error("Proposal slug and signer name are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase configuration error");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: proposal, error: proposalError } = await supabase
      .from("client_proposals")
      .select("id")
      .eq("slug", proposalSlug)
      .order("version", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (proposalError || !proposal) throw new Error("Proposal not found");

    const { data, error } = await supabase
      .from("proposal_acceptances")
      .insert({
        proposal_slug: proposalSlug,
        loi_signed_name: trimmedName,
        loi_signed_at: new Date().toISOString(),
        payment_status: "pending",
        status: "loe_pending",
      })
      .select("id")
      .single();

    if (error || !data) throw error ?? new Error("Failed to record signature");

    return new Response(JSON.stringify({ success: true, acceptanceId: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("sign-proposal-loi error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
