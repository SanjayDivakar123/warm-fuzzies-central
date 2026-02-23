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

type CompanyMembership = {
  email: string;
  user_id: string | null;
  role: string;
  status: string;
  company_id: string;
  companies: { name: string } | null;
};

type AuthUserSummary = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
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

    const body = await req.json().catch(() => ({}));
    const search = (body?.search || "").toString().trim().toLowerCase();
    const ownersOnly = Boolean(body?.owners_only);
    const adminLevelOnly = Boolean(body?.admin_level_only);

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: memberships, error: membershipsError } = await supabase
      .from("company_users")
      .select("email, user_id, role, status, company_id, companies(name)");

    if (membershipsError) throw membershipsError;

    const byUserId = new Map<string, CompanyMembership[]>();
    const byEmail = new Map<string, CompanyMembership[]>();

    for (const row of (memberships || []) as CompanyMembership[]) {
      if (row.user_id) {
        const current = byUserId.get(row.user_id) || [];
        current.push(row);
        byUserId.set(row.user_id, current);
      }

      const normalizedEmail = (row.email || "").toLowerCase();
      if (normalizedEmail) {
        const current = byEmail.get(normalizedEmail) || [];
        current.push(row);
        byEmail.set(normalizedEmail, current);
      }
    }

    const authUsers: AuthUserSummary[] = [];
    let page = 1;

    while (page <= 10) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;

      const users = (data?.users || []) as AuthUserSummary[];
      authUsers.push(...users);

      if (users.length < 1000) break;
      page += 1;
    }

    const responseUsers = authUsers
      .map((authUser) => {
        const normalizedEmail = (authUser.email || "").toLowerCase();
        const linkedMemberships = [
          ...(byUserId.get(authUser.id) || []),
          ...(normalizedEmail ? byEmail.get(normalizedEmail) || [] : []),
        ];

        const dedupedMemberships = Array.from(
          new Map(linkedMemberships.map((item) => [`${item.company_id}:${item.role}:${item.status}`, item])).values(),
        );

        const activeMemberships = dedupedMemberships.filter((m) => m.status !== "revoked");
        const companyNames = Array.from(
          new Set(activeMemberships.map((m) => m.companies?.name).filter(Boolean) as string[]),
        );
        const companyIds = Array.from(new Set(activeMemberships.map((m) => m.company_id)));

        const isB2BOwner = activeMemberships.some((m) => m.role === "admin");
        const isB2BAdminLevel = activeMemberships.some((m) =>
          ["admin", "hr", "partner"].includes(m.role),
        );

        return {
          id: authUser.id,
          email: authUser.email,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          email_confirmed_at: authUser.email_confirmed_at,
          is_b2b_owner: isB2BOwner,
          is_b2b_admin_level: isB2BAdminLevel,
          b2b_company_count: companyIds.length,
          b2b_companies: companyNames,
        };
      })
      .filter((entry) => {
        if (ownersOnly && !entry.is_b2b_owner) return false;
        if (adminLevelOnly && !entry.is_b2b_admin_level) return false;
        if (search && !(entry.email || "").toLowerCase().includes(search)) return false;
        return true;
      })
      .sort((a, b) => (a.email || "").localeCompare(b.email || ""));

    return new Response(JSON.stringify({ users: responseUsers }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in list-rcf-platform-users:", error);
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || "Unexpected error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
