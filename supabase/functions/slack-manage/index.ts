import {
  HttpError,
  corsHeaders,
  createServiceSupabaseClient,
  getActiveSlackConnectionByOrgId,
  json,
  listSlackWorkspaceUsers,
  logSlackError,
  requireCompanyAccess,
  resolveRoleColorFromResults,
} from "../_shared/slack.ts";
import {
  approveSlackPendingConfirmationByAdmin,
  buildPendingConfirmationViewModel,
  expireSlackPendingConfirmations,
  getSlackPendingConfirmationById,
  listSlackChannels,
  listSlackPendingConfirmations,
  manuallyMapSlackUserToCompanyUser,
  rejectSlackPendingConfirmationByAdmin,
  resendSlackPendingConfirmationDm,
  unlinkSlackAccountFromCompanyUser,
  updateSlackConnectionSettings,
} from "../_shared/slack-onboarding.ts";

const listCompanyUsersForMapping = async (orgId: string) => {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("company_users")
    .select("id, email, full_name, job_role, role, status, slack_user_id, slack_linked_at, assessment_result_id")
    .eq("company_id", orgId)
    .neq("status", "revoked")
    .order("full_name", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data || []) as Array<{
    id: string;
    email: string;
    full_name: string | null;
    job_role: string | null;
    role: string;
    status: string | null;
    slack_user_id: string | null;
    slack_linked_at: string | null;
    assessment_result_id: string | null;
  }>;

  const assessmentIds = rows
    .map((row) => row.assessment_result_id)
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  const resultsById = new Map<string, Record<string, unknown>>();
  if (assessmentIds.length > 0) {
    const { data: assessments, error: assessmentsError } = await supabase
      .from("assessment_results")
      .select("id, results")
      .in("id", assessmentIds);

    if (assessmentsError) {
      throw new Error(assessmentsError.message);
    }

    for (const assessment of assessments || []) {
      resultsById.set(assessment.id, (assessment.results as Record<string, unknown>) || {});
    }
  }

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    job_role: row.job_role,
    role: row.role,
    status: row.status,
    slack_user_id: row.slack_user_id,
    slack_linked_at: row.slack_linked_at,
    role_color: resolveRoleColorFromResults(resultsById.get(row.assessment_result_id || "")),
  }));
};

const buildState = async (orgId: string) => {
  const supabase = createServiceSupabaseClient();
  const connection = await getActiveSlackConnectionByOrgId(supabase, orgId);

  if (!connection) {
    throw new HttpError(404, "Slack is not connected for this company");
  }

  await expireSlackPendingConfirmations(supabase, connection);

  const pendingConfirmations = await listSlackPendingConfirmations(supabase, orgId);
  const companyUsers = await listCompanyUsersForMapping(orgId);
  const companyUsersBySlackId = new Map(
    companyUsers
      .filter((user) => user.slack_user_id)
      .map((user) => [user.slack_user_id as string, user]),
  );
  let availableChannels: { id: string; name: string }[] = [];
  let workspaceUsers: Array<{
    slack_user_id: string;
    email: string | null;
    display_name: string | null;
    real_name: string | null;
    title: string | null;
    avatar_url: string | null;
    linked_company_user_id: string | null;
    linked_company_user_name: string | null;
    linked_company_user_email: string | null;
    linked_company_user_role: string | null;
    linked_company_user_role_color: string | null;
    linked_at: string | null;
  }> = [];

  try {
    availableChannels = await listSlackChannels(connection.bot_token);
  } catch (error) {
    console.warn("Could not load Slack channels", error);
  }

  try {
    workspaceUsers = (await listSlackWorkspaceUsers(connection.bot_token)).map((user) => {
      const linkedCompanyUser = companyUsersBySlackId.get(user.slack_user_id) || null;
      return {
        ...user,
        linked_company_user_id: linkedCompanyUser?.id || null,
        linked_company_user_name: linkedCompanyUser?.full_name || null,
        linked_company_user_email: linkedCompanyUser?.email || null,
        linked_company_user_role: linkedCompanyUser?.job_role || linkedCompanyUser?.role || null,
        linked_company_user_role_color: linkedCompanyUser?.role_color || null,
        linked_at: linkedCompanyUser?.slack_linked_at || null,
      };
    });
  } catch (error) {
    console.warn("Could not load Slack workspace users", error);
  }

  return {
    connection: {
      id: connection.id,
      org_id: connection.org_id,
      team_id: connection.team_id,
      team_name: connection.team_name,
      authed_user_id: connection.authed_user_id,
      incoming_webhook_channel: connection.incoming_webhook_channel,
      connected_at: connection.connected_at,
      is_active: connection.is_active,
      auto_add_users: connection.auto_add_users,
      email_mismatch_action: connection.email_mismatch_action,
      name_matching_enabled: connection.name_matching_enabled,
      admin_notify_on_new_user: connection.admin_notify_on_new_user,
      admin_notify_channel: connection.admin_notify_channel,
    },
    pending_confirmations: pendingConfirmations.map(buildPendingConfirmationViewModel),
    available_channels: availableChannels,
    company_users: companyUsers,
    workspace_users: workspaceUsers,
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: Record<string, unknown> = {};

  try {
    body = await req.json();
    const orgId = String(body.orgId || "").trim();
    const action = String(body.action || "get");

    if (!orgId) {
      throw new HttpError(400, "Missing orgId");
    }

    const auth = await requireCompanyAccess(req, orgId);
    const connection = await getActiveSlackConnectionByOrgId(auth.supabase, orgId);

    if (!connection) {
      throw new HttpError(404, "Slack is not connected for this company");
    }

    if (action === "get") {
      return json(await buildState(orgId));
    }

    if (action === "update_settings") {
      const emailMismatchAction = String(body.email_mismatch_action || "confirm");
      if (!["confirm", "ignore", "auto_create"].includes(emailMismatchAction)) {
        throw new HttpError(400, "Invalid email mismatch action");
      }

      await updateSlackConnectionSettings(auth.supabase, orgId, {
        auto_add_users: Boolean(body.auto_add_users),
        email_mismatch_action: emailMismatchAction as "confirm" | "ignore" | "auto_create",
        name_matching_enabled: Boolean(body.name_matching_enabled),
        admin_notify_on_new_user: Boolean(body.admin_notify_on_new_user),
        admin_notify_channel:
          typeof body.admin_notify_channel === "string" && body.admin_notify_channel.trim().length
            ? body.admin_notify_channel.trim()
            : null,
      });

      return json({
        success: true,
        message: "Slack settings updated",
        ...(await buildState(orgId)),
      });
    }

    if (action === "map_user") {
      const companyUserId = String(body.companyUserId || "").trim();
      const slackUserId = String(body.slackUserId || "").trim();

      if (!companyUserId || !slackUserId) {
        throw new HttpError(400, "Missing companyUserId or slackUserId");
      }

      const mappedUser = await manuallyMapSlackUserToCompanyUser(auth.supabase, connection, companyUserId, slackUserId);

      return json({
        success: true,
        message: `${mappedUser.fullName || mappedUser.email} is now linked to that Slack user.`,
        ...(await buildState(orgId)),
      });
    }

    if (action === "unlink_user") {
      const slackUserId = String(body.slackUserId || "").trim();
      if (!slackUserId) {
        throw new HttpError(400, "Missing slackUserId");
      }

      await unlinkSlackAccountFromCompanyUser(auth.supabase, orgId, slackUserId);

      return json({
        success: true,
        message: "Slack user mapping removed.",
        ...(await buildState(orgId)),
      });
    }

    const confirmationId = String(body.confirmationId || "").trim();
    if (!confirmationId) {
      throw new HttpError(400, "Missing confirmationId");
    }

    const confirmation = await getSlackPendingConfirmationById(auth.supabase, confirmationId);
    if (!confirmation || confirmation.org_id !== orgId) {
      throw new HttpError(404, "Pending confirmation not found");
    }

    if (action === "approve_confirmation") {
      const result = await approveSlackPendingConfirmationByAdmin(
        auth.supabase,
        connection,
        confirmation,
        !confirmation.matched_rcf_user_id,
      );

      return json({
        success: true,
        message: result.companyUser
          ? `${result.companyUser.fullName || result.companyUser.email} is ready in RoleColorFinder.`
          : "Slack confirmation approved.",
        ...(await buildState(orgId)),
      });
    }

    if (action === "reject_confirmation") {
      const result = await rejectSlackPendingConfirmationByAdmin(auth.supabase, connection, confirmation);

      return json({
        success: true,
        message: result.companyUser
          ? `${result.companyUser.fullName || result.companyUser.email} was created and invited.`
          : `${confirmation.slack_real_name || confirmation.slack_display_name || "Slack member"} was skipped.`,
        ...(await buildState(orgId)),
      });
    }

    if (action === "resend_confirmation") {
      await resendSlackPendingConfirmationDm(auth.supabase, connection, confirmation);

      return json({
        success: true,
        message: `Confirmation DM re-sent to ${confirmation.slack_real_name || confirmation.slack_display_name || "the Slack user"}.`,
        ...(await buildState(orgId)),
      });
    }

    throw new HttpError(400, "Unsupported action");
  } catch (error) {
    const orgId = typeof body.orgId === "string" ? body.orgId : null;

    await logSlackError({
      orgId,
      functionName: "slack-manage",
      errorMessage: error instanceof Error ? error.message : "Internal server error",
      payload: body,
    });

    if (error instanceof HttpError) {
      return json({ error: error.message }, error.status);
    }

    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
