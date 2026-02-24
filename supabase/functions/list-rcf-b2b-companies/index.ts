import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_SUPER_ADMINS = new Set([
  "sanjay@rolecolorfinder.com",
  "tristan@rolecolorfinder.com",
]);

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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
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

    const callerEmail = (user.email || "").toLowerCase();
    if (!ALLOWED_SUPER_ADMINS.has(callerEmail)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const [{ data: companies, error: companiesError }, { data: companyUsers, error: companyUsersError }] =
      await Promise.all([
        supabase
          .from("companies")
          .select("id, name, subdomain, admin_email, created_at, seats_purchased, credit_balance")
          .order("created_at", { ascending: false }),
        supabase.from("company_users").select("company_id, role, status"),
      ]);

    if (companiesError) throw companiesError;
    if (companyUsersError) throw companyUsersError;

    const userStats = new Map<
      string,
      {
        memberCount: number;
        activeMemberCount: number;
        ownerCount: number;
        adminLevelCount: number;
      }
    >();

    for (const row of companyUsers || []) {
      const key = row.company_id;
      const current = userStats.get(key) || {
        memberCount: 0,
        activeMemberCount: 0,
        ownerCount: 0,
        adminLevelCount: 0,
      };

      if (row.status !== "revoked") {
        current.memberCount += 1;
      }
      if (row.status === "active") {
        current.activeMemberCount += 1;
      }
      if (row.role === "admin" && row.status !== "revoked") {
        current.ownerCount += 1;
      }
      if (["admin", "hr", "partner"].includes(row.role) && row.status !== "revoked") {
        current.adminLevelCount += 1;
      }

      userStats.set(key, current);
    }

    const payload = (companies || []).map((company) => {
      const stats = userStats.get(company.id) || {
        memberCount: 0,
        activeMemberCount: 0,
        ownerCount: 0,
        adminLevelCount: 0,
      };

      return {
        id: company.id,
        name: company.name,
        subdomain: company.subdomain,
        admin_email: company.admin_email,
        created_at: company.created_at,
        seats_purchased: company.seats_purchased,
        credit_balance: company.credit_balance || 0,
        ...stats,
      };
    });

    return new Response(JSON.stringify({ companies: payload }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in list-rcf-b2b-companies:", error);
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || "Unexpected error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
