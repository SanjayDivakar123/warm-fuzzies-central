import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { INITIAL_SUPER_ADMIN_EMAILS, isSuperAdminEmail, normalizeEmail, resolveFullName } from "../_shared/superAdmin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof value === "string" && uuidRegex.test(value);
}

function isMissingTableError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code: string }).code === "42P01"
  );
}

function buildFallbackSuperAdmins() {
  return INITIAL_SUPER_ADMIN_EMAILS.map((email) => ({
    id: `fallback-${email}`,
    user_id: null,
    email,
    full_name: null,
    added_by: null,
    added_by_email: null,
    created_at: new Date(0).toISOString(),
  }));
}

async function ensurePlatformSuperAdminsTable() {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL") ?? "";
  if (!dbUrl) {
    throw new Error("SUPABASE_DB_URL is not configured for automatic super admin storage setup.");
  }

  const client = new Client(dbUrl);
  await client.connect();

  try {
    const statements = [
      `create extension if not exists pgcrypto`,
      `create table if not exists public.platform_super_admins (
        id uuid primary key default gen_random_uuid(),
        user_id uuid,
        email text not null,
        full_name text,
        added_by uuid,
        added_by_email text,
        created_at timestamptz not null default now()
      )`,
      `create unique index if not exists platform_super_admins_email_unique_idx
        on public.platform_super_admins (email)`,
      `create unique index if not exists platform_super_admins_user_id_unique_idx
        on public.platform_super_admins (user_id)
        where user_id is not null`,
      `insert into public.platform_super_admins (email)
        values ${INITIAL_SUPER_ADMIN_EMAILS.map((email) => `('${email}')`).join(", ")}
        on conflict do nothing`,
      `alter table public.platform_super_admins enable row level security`,
      `drop policy if exists "service role manages platform super admins" on public.platform_super_admins`,
      `create policy "service role manages platform super admins"
        on public.platform_super_admins
        as permissive
        for all
        to service_role
        using (true)
        with check (true)`,
    ];

    for (const statement of statements) {
      await client.queryArray(statement);
    }
  } finally {
    await client.end();
  }
}

async function selectSuperAdmins(
  supabase: ReturnType<typeof createClient>,
): Promise<{ data: unknown[] | null; fallback?: boolean }> {
  const { data, error } = await supabase
    .from("platform_super_admins")
    .select("id, user_id, email, full_name, added_by, added_by_email, created_at")
    .order("created_at", { ascending: true });

  if (!error) {
    return { data: data || [] };
  }

  if (!isMissingTableError(error)) {
    throw error;
  }

  await ensurePlatformSuperAdminsTable();

  const retry = await supabase
    .from("platform_super_admins")
    .select("id, user_id, email, full_name, added_by, added_by_email, created_at")
    .order("created_at", { ascending: true });

  if (retry.error) throw retry.error;
  return { data: retry.data || [] };
}

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

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const callerEmail = normalizeEmail(user.email);

    if (!(await isSuperAdminEmail(supabase, callerEmail))) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = (body?.action || "list").toString();

    if (action === "list") {
      try {
        const { data } = await selectSuperAdmins(supabase);

        return new Response(JSON.stringify({ super_admins: data || [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        if (isMissingTableError(error)) {
          return new Response(JSON.stringify({ super_admins: buildFallbackSuperAdmins(), fallback: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw error;
      }
    }

    if (action === "add") {
      const targetUserId = (body?.user_id || "").toString().trim();
      if (!isValidUUID(targetUserId)) {
        return new Response(JSON.stringify({ error: "Invalid user_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(targetUserId);
      if (authUserError || !authUserData?.user?.email) {
        throw new Error("Could not find auth user for user_id");
      }

      const targetEmail = normalizeEmail(authUserData.user.email);
      const fullName = resolveFullName(authUserData.user.user_metadata);

      const upsertSuperAdmin = async () =>
        supabase
          .from("platform_super_admins")
          .upsert(
            {
              user_id: targetUserId,
              email: targetEmail,
              full_name: fullName,
              added_by: user.id,
              added_by_email: callerEmail,
            },
            { onConflict: "email" },
          );

      let { error: upsertError } = await upsertSuperAdmin();

      if (upsertError) {
        if (isMissingTableError(upsertError)) {
          await ensurePlatformSuperAdminsTable();
          ({ error: upsertError } = await upsertSuperAdmin());
        }
        if (upsertError) throw upsertError;
      }

      const { data } = await selectSuperAdmins(supabase);

      return new Response(
        JSON.stringify({
          success: true,
          added_email: targetEmail,
          super_admins: data || [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in manage-super-admins:", error);
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || "Unexpected error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
