import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreateProbationReminderRequest {
  offerId: string;
  companyId: string;
  adminCompanyUserId: string;
  probationPeriod: string;
  reminderAt: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return new Response(JSON.stringify({ error: "Supabase configuration is missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

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

    const payload = (await req.json()) as CreateProbationReminderRequest;

    if (
      !payload.offerId ||
      !payload.companyId ||
      !payload.adminCompanyUserId ||
      !payload.probationPeriod ||
      !payload.reminderAt
    ) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reminderAt = new Date(payload.reminderAt);
    if (Number.isNaN(reminderAt.getTime())) {
      return new Response(JSON.stringify({ error: "Invalid reminderAt value" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure the caller can only schedule reminders for their own company_user record.
    const { data: companyUser, error: companyUserError } = await serviceClient
      .from("company_users")
      .select("id, company_id, role, status, user_id")
      .eq("id", payload.adminCompanyUserId)
      .eq("company_id", payload.companyId)
      .single();

    if (companyUserError || !companyUser) {
      return new Response(JSON.stringify({ error: "Company user not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (companyUser.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "You can only schedule reminders for your own admin account" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["admin", "hr"].includes(companyUser.role) || companyUser.status !== "active") {
      return new Response(JSON.stringify({ error: "Only active admin/hr users can schedule reminders" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: upsertError } = await serviceClient
      .from("offer_probation_reminders")
      .upsert(
        {
          offer_id: payload.offerId,
          company_id: payload.companyId,
          admin_company_user_id: payload.adminCompanyUserId,
          probation_period: payload.probationPeriod.trim(),
          reminder_at: reminderAt.toISOString(),
          status: "pending",
          sent_at: null,
          failure_reason: null,
        },
        { onConflict: "offer_id" },
      );

    if (upsertError) {
      console.error("Failed to create probation reminder:", upsertError);
      return new Response(JSON.stringify({ error: "Failed to schedule probation reminder" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-probation-reminder error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

