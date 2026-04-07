import {
  createServiceSupabaseClient,
  getActiveSlackConnectionByTeamId,
  getCompanyByOrgId,
  logSlackError,
  parseSlackFormBody,
  verifySlackSignature,
} from "../_shared/slack.ts";
import {
  approveSlackPendingConfirmationByAdmin,
  ensureCompanyUserFromSlackProfile,
  expireSlackPendingConfirmationIfNeeded,
  getCompanyUserIdentityById,
  getSlackPendingConfirmationByToken,
  linkSlackAccountToCompanyUser,
  manualSlackLinkUrl,
  resolveMatchedUserFromConfirmation,
  sendAdminNotificationForConfirmation,
  sendAssessmentInviteDm,
  sendLinkedWelcomeDm,
  sendNoMatchDm,
  sendSlackAdminFollowUp,
  sendSlackDm,
  updateSlackPendingConfirmation,
} from "../_shared/slack-onboarding.ts";

const ack = (payload: unknown = null) =>
  new Response(payload === null ? null : JSON.stringify(payload), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      ...(payload === null ? {} : { "Content-Type": "application/json" }),
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type, x-slack-request-timestamp, x-slack-signature",
      },
    });
  }

  const rawBody = await req.text();

  try {
    const isValid = await verifySlackSignature(req.headers, rawBody);
    if (!isValid) {
      return new Response("Invalid Slack signature", { status: 403 });
    }

    const form = parseSlackFormBody(rawBody);
    const payloadRaw = form.get("payload");
    const payload = payloadRaw ? JSON.parse(payloadRaw) : {};
    const teamId = payload?.team?.id || null;
    const actionId = payload?.actions?.[0]?.action_id || "unknown";
    const actionValue = payload?.actions?.[0]?.value || null;
    const adminSlackUserId = payload?.user?.id || null;

    const supabase = createServiceSupabaseClient();
    let orgId: string | null = null;
    let connection = null;

    if (teamId) {
      connection = await getActiveSlackConnectionByTeamId(supabase, teamId);
      orgId = connection?.org_id || null;
    }

    await supabase.from("slack_interactions").insert({
      org_id: orgId,
      user_id: adminSlackUserId || "unknown",
      action_id: actionId,
    } as any);

    if (!connection?.bot_token || !orgId) {
      return ack({
        text: "RoleColorFinder needs to be reconnected. Ask your admin to visit Settings -> Integrations.",
      });
    }

    if (!actionValue) {
      return ack({ text: "That Slack action is missing the confirmation token." });
    }

    const confirmation = await getSlackPendingConfirmationByToken(supabase, actionValue);
    if (!confirmation || confirmation.org_id !== orgId) {
      return ack({ text: "That RoleColorFinder confirmation could not be found." });
    }

    const activeConfirmation = await expireSlackPendingConfirmationIfNeeded(supabase, connection, confirmation);
    if (activeConfirmation.status !== "pending") {
      return ack({ text: "That confirmation is no longer active." });
    }

    const company = await getCompanyByOrgId(supabase, orgId);

    if (actionId === "confirm_identity") {
      const matchedUser = await resolveMatchedUserFromConfirmation(supabase, activeConfirmation);
      if (!matchedUser) {
        return ack({ text: "We could not find the matched RoleColorFinder profile anymore." });
      }

      await linkSlackAccountToCompanyUser(supabase, orgId, matchedUser.id, activeConfirmation.slack_user_id);
      const linkedUser = (await getCompanyUserIdentityById(supabase, orgId, matchedUser.id)) || matchedUser;

      await updateSlackPendingConfirmation(supabase, activeConfirmation.id, {
        status: "confirmed",
        responded_at: new Date().toISOString(),
        matched_rcf_user_id: linkedUser.id,
        matched_rcf_name: linkedUser.fullName,
        matched_rcf_role: linkedUser.jobRole || linkedUser.role,
        matched_rcf_color: linkedUser.roleColor,
      });

      await sendLinkedWelcomeDm(connection, company, linkedUser);
      return ack({ text: "Linked! Check your Slack DM for the updated RoleColorFinder details." });
    }

    if (actionId === "reject_identity") {
      const updated = await updateSlackPendingConfirmation(supabase, activeConfirmation.id, {
        status: "rejected",
        responded_at: new Date().toISOString(),
      });

      if (connection.auto_add_users) {
        const companyUser = await ensureCompanyUserFromSlackProfile(supabase, company, {
          slackUserId: updated.slack_user_id,
          email: updated.slack_email,
          displayName: updated.slack_display_name,
          realName: updated.slack_real_name,
          title: updated.slack_title,
          avatarUrl: updated.slack_avatar_url,
        });
        await sendAssessmentInviteDm(connection, company, companyUser);
      } else if (connection.admin_notify_on_new_user) {
        await sendAdminNotificationForConfirmation(connection, updated);
      } else {
        await sendNoMatchDm(connection, company, updated);
      }

      return ack({ text: "Thanks. RoleColorFinder updated your onboarding status." });
    }

    if (actionId === "admin_approve_add_user") {
      const result = await approveSlackPendingConfirmationByAdmin(supabase, connection, activeConfirmation, true);
      if (adminSlackUserId) {
        await sendSlackAdminFollowUp(
          connection,
          adminSlackUserId,
          `✅ ${result.companyUser.fullName || result.companyUser.email} has been added to RCF and sent an assessment invite.`,
        );
      }
      return ack({ text: "User approved and added to RoleColorFinder." });
    }

    if (actionId === "admin_reject_add_user") {
      await updateSlackPendingConfirmation(supabase, activeConfirmation.id, {
        status: "admin_rejected",
        responded_at: new Date().toISOString(),
        initiated_by: "admin",
      });

      if (adminSlackUserId) {
        await sendSlackAdminFollowUp(
          connection,
          adminSlackUserId,
          `Skipped. ${activeConfirmation.slack_real_name || activeConfirmation.slack_display_name || "That Slack member"} was not added to RCF.`,
        );
      }

      return ack({ text: "Skipped. That Slack member was not added to RoleColorFinder." });
    }

    if (actionId === "take_assessment") {
      const companyUser = await ensureCompanyUserFromSlackProfile(supabase, company, {
        slackUserId: activeConfirmation.slack_user_id,
        email: activeConfirmation.slack_email,
        displayName: activeConfirmation.slack_display_name,
        realName: activeConfirmation.slack_real_name,
        title: activeConfirmation.slack_title,
        avatarUrl: activeConfirmation.slack_avatar_url,
      });

      await updateSlackPendingConfirmation(supabase, activeConfirmation.id, {
        status: "auto_created",
        responded_at: new Date().toISOString(),
      });

      await sendAssessmentInviteDm(connection, company, companyUser);

      return ack({ text: "Assessment invite sent." });
    }

    if (actionId === "link_existing") {
      const manualLink = manualSlackLinkUrl(activeConfirmation.confirmation_token);
      await updateSlackPendingConfirmation(supabase, activeConfirmation.id, {
        dm_sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });

      await sendSlackDm(connection.bot_token, activeConfirmation.slack_user_id, {
        text: "Use this secure RoleColorFinder link to sign in and connect your existing account.",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                "Use this secure RoleColorFinder link to sign in and connect your existing account.",
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "🔗 Link Existing Account" },
                url: manualLink,
              },
            ],
          },
        ],
      });

      return ack({ text: "Sign-in link sent in Slack DM." });
    }

    return ack({ text: "RoleColorFinder received that Slack action." });
  } catch (error) {
    let payload: any = { rawBody };
    try {
      const form = parseSlackFormBody(rawBody);
      payload = JSON.parse(form.get("payload") || "{}");
    } catch {
      // Keep raw body fallback.
    }

    const supabase = createServiceSupabaseClient();
    const teamId = payload?.team?.id || null;
    let orgId: string | null = null;

    try {
      if (teamId) {
        const connection = await getActiveSlackConnectionByTeamId(supabase, teamId);
        orgId = connection?.org_id || null;
      }
    } catch {
      // Ignore lookup failures while logging.
    }

    await logSlackError({
      supabase,
      orgId,
      functionName: "slack-interactivity",
      errorMessage: error instanceof Error ? error.message : "Internal server error",
      payload,
    });

    return ack({
      text: "RoleColorFinder hit an internal error while processing that Slack action.",
    });
  }
});
