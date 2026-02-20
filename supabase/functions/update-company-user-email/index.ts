// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && email.length <= 255 && emailRegex.test(email);
}

function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof value === "string" && uuidRegex.test(value);
}

async function findAuthUserIdByEmail(supabase: any, email: string): Promise<string | null> {
  const normalizedEmail = email.toLowerCase();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw error;
    }

    const users = data?.users || [];
    const match = users.find((user: any) => (user.email || "").toLowerCase() === normalizedEmail);
    if (match?.id) {
      return match.id;
    }

    if (users.length < 1000) {
      break;
    }

    page += 1;
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await authClient.auth.getUser();

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const companyUserId = (
      body?.company_user_id ||
      body?.companyUserId ||
      ""
    ).toString();
    const newEmail = (
      body?.new_email ||
      body?.newEmail ||
      ""
    ).toString().trim().toLowerCase();

    if (!isValidUUID(companyUserId)) {
      return new Response(JSON.stringify({ error: "Invalid company user id", received: companyUserId || null }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isValidEmail(newEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: targetUser, error: targetUserError } = await supabase
      .from("company_users")
      .select("id, company_id, email, user_id, role, status, invite_code")
      .eq("id", companyUserId)
      .maybeSingle();

    if (targetUserError || !targetUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminCheck } = await supabase
      .from("company_users")
      .select("id")
      .eq("company_id", targetUser.company_id)
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .eq("status", "active")
      .maybeSingle();

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: "Forbidden: admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: duplicate } = await supabase
      .from("company_users")
      .select("id")
      .eq("company_id", targetUser.company_id)
      .ilike("email", newEmail)
      .neq("id", companyUserId)
      .maybeSingle();

    if (duplicate) {
      return new Response(JSON.stringify({ error: "Email already in use in this company" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let resolvedUserId: string | null = targetUser.user_id || null;
    let authEmailUpdated = false;

    if (targetUser.user_id) {
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(targetUser.user_id, {
        email: newEmail,
        email_confirm: true,
      });

      if (!authUpdateError) {
        resolvedUserId = targetUser.user_id;
        authEmailUpdated = true;
      } else {
        const matchedAuthUserId = await findAuthUserIdByEmail(supabase, newEmail);
        resolvedUserId = matchedAuthUserId;
      }
    } else {
      const matchedAuthUserId = await findAuthUserIdByEmail(supabase, newEmail);
      resolvedUserId = matchedAuthUserId;
    }

    const updatePayload: Record<string, unknown> = {
      email: newEmail,
      user_id: resolvedUserId,
    };

    if (!resolvedUserId) {
      const { data: inviteCodeData } = await supabase.rpc("generate_invite_code");
      updatePayload.invite_code = (typeof inviteCodeData === "string" && inviteCodeData.trim())
        ? inviteCodeData.toUpperCase()
        : targetUser.invite_code;
      updatePayload.invited_at = new Date().toISOString();
      updatePayload.invite_count = 1;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("company_users")
      .update(updatePayload)
      .eq("id", companyUserId)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        user: updatedUser,
        authEmailUpdated,
        hasLinkedAuthUser: Boolean(resolvedUserId),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in update-company-user-email:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Unexpected error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
