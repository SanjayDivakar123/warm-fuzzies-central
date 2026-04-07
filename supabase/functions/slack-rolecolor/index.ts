import {
  buildCompanyAdminPortalUrl,
  buildEmployeePortalUrl,
  createServiceSupabaseClient,
  getActiveSlackConnectionByTeamId,
  getCompanyByOrgId,
  HttpError,
  logSlackError,
  parseSlackFormBody,
  reconnectMessage,
  resolveCompanyUserByEmail,
  resolveCompanyUserBySlackUserId,
  resolveSlackLookupTargetFromText,
  respondToSlack,
  respondToSlackText,
  roleColorToProfile,
  verifySlackSignature,
} from "../_shared/slack.ts";

const roleColorBlocks = (name: string, profile: { color: string; role: string; tips: string[] }) => ({
  response_type: "ephemeral",
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${name}* is a *${profile.color} ${profile.role}*`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `🎨 *Color:* ${profile.color}\n💼 *Role:* ${profile.role}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Working with them:*\n• ${profile.tips.join("\n• ")}`,
      },
    },
  ],
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
  }

  const rawBody = await req.text();

  try {
    const isValid = await verifySlackSignature(req.headers, rawBody);
    if (!isValid) {
      return new Response("Invalid Slack signature", { status: 403 });
    }

    const form = parseSlackFormBody(rawBody);
    const teamId = form.get("team_id");
    const requestUserId = form.get("user_id");
    const requestUserName = form.get("user_name");
    const queryText = form.get("text") || "";

    if (!teamId) {
      return respondToSlackText("Slack team_id was missing from the request.");
    }

    const supabase = createServiceSupabaseClient();
    const connection = await getActiveSlackConnectionByTeamId(supabase, teamId);

    if (!connection?.bot_token) {
      return respondToSlackText("RoleColorFinder needs to be reconnected. Ask your admin to visit Settings -> Integrations.");
    }

    const company = await getCompanyByOrgId(supabase, connection.org_id);
    const lookup = await resolveSlackLookupTargetFromText({
      text: queryText,
      requestUserId,
      requestUserName,
      botToken: connection.bot_token,
    });

    if (!lookup) {
      return respondToSlackText("Use an email address, @handle, or a Slack mention like @teammate so RoleColorFinder can find the right person.");
    }

    const companyUser =
      (lookup.slackUserId
        ? await resolveCompanyUserBySlackUserId(supabase, connection.org_id, lookup.slackUserId)
        : null) ||
      (lookup.email ? await resolveCompanyUserByEmail(supabase, connection.org_id, lookup.email) : null);
    const portalUrl = buildEmployeePortalUrl(company);
    const targetLabel =
      companyUser?.fullName ||
      lookup.realName ||
      lookup.displayName ||
      lookup.email ||
      queryText.trim() ||
      "that teammate";

    if (!companyUser?.results) {
      return respondToSlackText(`No RoleColor found for ${targetLabel}. Send them an assessment: ${portalUrl}`);
    }

    const profile = roleColorToProfile(
      typeof companyUser.results === "object"
        ? String(
            companyUser.results.dominantColor ||
              companyUser.results.primaryColor ||
              companyUser.results.role_color ||
              "",
          ).toLowerCase()
        : null,
    );

    if (!profile) {
      return respondToSlackText(`No RoleColor found for ${companyUser.fullName || targetLabel}. Send them an assessment: ${portalUrl}`);
    }

    return respondToSlack(roleColorBlocks(companyUser.fullName || targetLabel, profile));
  } catch (error) {
    const supabase = createServiceSupabaseClient();
    const form = parseSlackFormBody(rawBody);
    const teamId = form.get("team_id");
    let orgId: string | null = null;

    try {
      if (teamId) {
        const connection = await getActiveSlackConnectionByTeamId(supabase, teamId);
        orgId = connection?.org_id || null;

        if (error instanceof Error && /invalid_auth|account_inactive|token_revoked/i.test(error.message) && orgId) {
          const company = await getCompanyByOrgId(supabase, orgId);
          return respondToSlackText(
            reconnectMessage(buildCompanyAdminPortalUrl(company, { tab: 'settings', settingsTab: 'integrations' })),
          );
        }
      }
    } catch {
      // Ignore secondary lookup errors while building the Slack response.
    }

    await logSlackError({
      supabase,
      orgId,
      functionName: "slack-rolecolor",
      errorMessage: error instanceof Error ? error.message : "Internal server error",
      payload: Object.fromEntries(form.entries()),
    });

    if (error instanceof HttpError) {
      return respondToSlackText(error.message);
    }

    return respondToSlackText("RoleColorFinder hit an internal error while looking up that RoleColor.");
  }
});
