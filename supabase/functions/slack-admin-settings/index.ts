import {
  HttpError,
  corsHeaders,
  createServiceSupabaseClient,
  getActiveSlackConnectionByOrgId,
  json,
  logSlackError,
  requireCompanyAccess,
} from "../_shared/slack.ts";
import {
  approveSlackPendingConfirmationByAdmin,
  buildPendingConfirmationViewModel,
  expireSlackPendingConfirmations,
  getSlackPendingConfirmationById,
  listSlackChannels,
  listSlackPendingConfirmations,
  rejectSlackPendingConfirmationByAdmin,
  resendSlackPendingConfirmationDm,
  updateSlackConnectionSettings,
} from "../_shared/slack-onboarding.ts";

const buildState = async (orgId: string) => {
  const supabase = createServiceSupabaseClient();
  const connection = await getActiveSlackConnectionByOrgId(supabase, orgId);

  if (!connection) {
    throw new HttpError(404, "Slack is not connected for this company");
  }

  await expireSlackPendingConfirmations(supabase, connection);

  const pendingConfirmations = await listSlackPendingConfirmations(supabase, orgId);
  let availableChannels: { id: string; name: string }[] = [];

  try {
    availableChannels = await listSlackChannels(connection.bot_token);
  } catch (error) {
    console.warn("Could not load Slack channels", error);
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
      functionName: "slack-admin-settings",
      errorMessage: error instanceof Error ? error.message : "Internal server error",
      payload: body,
    });

    if (error instanceof HttpError) {
      return json({ error: error.message }, error.status);
    }

    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
