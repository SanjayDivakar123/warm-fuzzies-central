import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPER_ADMIN_EMAILS = new Set([
  "sanjay@rolecolorfinder.com",
  "tristan@rolecolorfinder.com",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { acceptanceId } = await req.json();
    if (!acceptanceId) throw new Error("Acceptance ID is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error("Supabase configuration error");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const userEmail = user.email?.toLowerCase() ?? "";
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole && !SUPER_ADMIN_EMAILS.has(userEmail)) {
      throw new Error("Forbidden");
    }

    const { data: acceptance, error: fetchError } = await supabase
      .from("proposal_acceptances")
      .select("id, proposal_slug, status, email")
      .eq("id", acceptanceId)
      .maybeSingle();

    if (fetchError || !acceptance) throw new Error("Acceptance not found");

    const { error: deleteError } = await supabase
      .from("proposal_acceptances")
      .delete()
      .eq("id", acceptanceId);

    if (deleteError) throw deleteError;

    await supabase.rpc("log_admin_action", {
      p_actor_id: user.id,
      p_actor_email: userEmail,
      p_action_type: "proposal_acceptance_delete",
      p_target_type: "proposal_acceptance",
      p_target_id: acceptance.id,
      p_target_label: acceptance.email ?? acceptance.proposal_slug,
      p_metadata: {
        proposal_slug: acceptance.proposal_slug,
        status: acceptance.status,
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("delete-proposal-acceptance error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error.message === "Forbidden" || error.message === "Unauthorized" ? 403 : 400,
    });
  }
});
