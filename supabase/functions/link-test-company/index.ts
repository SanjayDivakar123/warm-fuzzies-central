import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { user_id, company_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const targetCompanyId =
      company_id ?? "00000000-0000-0000-0000-000000000001"; // default Test Company

    // Link the authenticated user to the test company admin record
    const { data, error } = await supabase
      .from("company_users")
      .update({
        user_id,
        status: "active",
        joined_at: new Date().toISOString(),
      })
      .eq("company_id", targetCompanyId)
      .eq("role", "admin")
      .is("user_id", null)
      .select("id, company_id, user_id, email, role, status")
      .single();

    if (error) {
      console.error("Error linking test company:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, companyUser: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unexpected error in link-test-company:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
