import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: companyRows } = await supabase
      .from("company_users")
      .select("company_id, role, status")
      .eq("user_id", user.id)
      .eq("status", "active");

    const companyIds = (companyRows || []).map((row) => row.company_id);
    const isAdminUser = (companyRows || []).some((row) => ["admin", "hr", "partner"].includes(row.role));

    let query = supabase
      .from("announcements")
      .select("id, title, body, audience, company_id, scheduled_at, is_active, created_at")
      .eq("is_active", true)
      .or(
        [
          "audience.eq.all",
          companyIds.length > 0 ? `and(audience.eq.company,company_id.in.(${companyIds.join(",")}))` : null,
          isAdminUser ? "audience.eq.admins" : null,
        ]
          .filter(Boolean)
          .join(","),
      )
      .order("created_at", { ascending: false })
      .limit(10);

    const { data, error } = await query;
    if (error) throw error;

    const now = Date.now();
    const rows = (data || []).filter((row) => !row.scheduled_at || new Date(row.scheduled_at).getTime() <= now);

    return new Response(JSON.stringify({ announcements: rows }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in list-user-announcements:", error);
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || "Unexpected error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
