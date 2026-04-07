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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getDominantColor(results: any): string {
  const candidate =
    results?.dominantColor ||
    results?.primaryColor ||
    results?.role_color ||
    results?.color ||
    "blue";
  return String(candidate).trim().toLowerCase() || "blue";
}

function getScores(results: any) {
  const scores = results?.scores || {};
  return {
    yellow: Number(scores.yellow || 0),
    red: Number(scores.red || 0),
    green: Number(scores.green || 0),
    blue: Number(scores.blue || 0),
  };
}

function generateTeamInsightsHash(teamMembers: Array<{
  id: string;
  job_role: string | null;
  dominantColor: string;
  scores: { yellow: number; red: number; green: number; blue: number };
}>): string {
  const hashData = [...teamMembers]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((member) =>
      `${member.id}:${member.job_role || ""}:${member.dominantColor}:${member.scores.yellow}-${member.scores.red}-${member.scores.green}-${member.scores.blue}`,
    )
    .join("|");

  return btoa(hashData);
}

async function syncTeamInsightsCacheForEmailChange(supabase: any, params: {
  companyId: string;
  companyUserId: string;
  oldEmail: string;
  newEmail: string;
}) {
  const { data: teamInsight, error: insightError } = await supabase
    .from("team_insights")
    .select("id, insights")
    .eq("company_id", params.companyId)
    .maybeSingle();

  if (insightError || !teamInsight?.id) {
    return;
  }

  const { data: assessedUsers, error: assessedUsersError } = await supabase
    .from("company_users")
    .select(`
      id,
      email,
      job_role,
      assessment_result_id,
      assessment_results:assessment_result_id(
        results
      )
    `)
    .eq("company_id", params.companyId)
    .neq("status", "revoked")
    .not("assessment_result_id", "is", null);

  if (assessedUsersError) {
    throw assessedUsersError;
  }

  const normalizedCurrentUsers = (assessedUsers || []).map((user: any) => {
    const resultRecord = Array.isArray(user.assessment_results)
      ? user.assessment_results[0]
      : user.assessment_results;
    const results = resultRecord?.results || {};

    return {
      id: user.id,
      email: normalizeEmail(user.email),
      job_role: user.job_role || null,
      dominantColor: getDominantColor(results),
      scores: getScores(results),
    };
  });

  const insightsPayload = teamInsight.insights && typeof teamInsight.insights === "object"
    ? structuredClone(teamInsight.insights)
    : {};

  const memberInsights = Array.isArray(insightsPayload.memberInsights)
    ? insightsPayload.memberInsights
    : [];

  const currentUserByEmail = new Map(
    normalizedCurrentUsers.map((user: any) => [normalizeEmail(user.email), user]),
  );

  insightsPayload.memberInsights = memberInsights.map((member: any) => {
    const memberEmail = normalizeEmail(member.email || "");
    const matchedCurrentUser =
      member.memberId === params.companyUserId
        ? normalizedCurrentUsers.find((user: any) => user.id === params.companyUserId) || null
        : currentUserByEmail.get(memberEmail) || null;

    if (member.memberId === params.companyUserId || memberEmail === params.oldEmail) {
      return {
        ...member,
        memberId: params.companyUserId,
        email: params.newEmail,
      };
    }

    if (matchedCurrentUser?.id) {
      return {
        ...member,
        memberId: matchedCurrentUser.id,
        email: matchedCurrentUser.email,
      };
    }

    return member;
  });

  const teamHash = generateTeamInsightsHash(normalizedCurrentUsers);

  const { error: updateInsightError } = await supabase
    .from("team_insights")
    .update({
      insights: insightsPayload,
      team_hash: teamHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id", teamInsight.id);

  if (updateInsightError) {
    throw updateInsightError;
  }
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

    await syncTeamInsightsCacheForEmailChange(supabase, {
      companyId: targetUser.company_id,
      companyUserId,
      oldEmail: normalizeEmail(targetUser.email),
      newEmail,
    });

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
