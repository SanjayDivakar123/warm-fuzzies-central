import {
  buildCompanyAdminPortalUrl,
  buildEmployeePortalUrl,
  createServiceSupabaseClient,
  getActiveSlackConnectionByTeamId,
  getCompanyByOrgId,
  logSlackError,
  parseSlackFormBody,
  respondToSlack,
  respondToSlackText,
  verifySlackSignature,
} from "../_shared/slack.ts";
import {
  SLACK_SUPPORTED_COMMANDS,
  generateSlackAssistantReply,
} from "../_shared/slack-assistant.ts";

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
    if (!teamId) {
      return respondToSlackText("Slack team_id was missing from the request.");
    }

    const supabase = createServiceSupabaseClient();
    const connection = await getActiveSlackConnectionByTeamId(supabase, teamId);
    if (!connection) {
      return respondToSlackText("RoleColorFinder needs to be reconnected. Ask your admin to visit Settings -> Integrations.");
    }

    const company = await getCompanyByOrgId(supabase, connection.org_id);
    const assessmentUrl = buildEmployeePortalUrl(company);
    const profileUrl = buildEmployeePortalUrl(company);
    const dashboardUrl = buildCompanyAdminPortalUrl(company, { tab: "overview" });
    const inviteUrl = buildCompanyAdminPortalUrl(company, { tab: "users" });
    const integrationsUrl = buildCompanyAdminPortalUrl(company, { tab: "settings", settingsTab: "integrations" });
    const queryText = (form.get("text") || "").trim();

    if (queryText && queryText.toLowerCase() !== "help" && queryText.toLowerCase() !== "commands") {
      const assistantReply = await generateSlackAssistantReply({
        supabase,
        company,
        connection,
        userText: queryText,
      });

      return respondToSlack({
        response_type: "ephemeral",
        text: assistantReply.text,
        blocks: assistantReply.blocks,
      });
    }

    const commandList = SLACK_SUPPORTED_COMMANDS.map((item) =>
      `• *${item.command}* — ${item.description}${item.example ? `\n  _Example:_ ${item.example}` : ""}`,
    ).join("\n");

    return respondToSlack({
      response_type: "ephemeral",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*RoleColorFinder quick actions*",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              `${commandList}\n\n` +
              "You can also DM the RoleColorFinder app and it will reply with AI help for RoleColor questions, assessments, hiring workflows, and portal navigation.",
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Take Assessment" },
              url: assessmentUrl,
            },
            {
              type: "button",
              text: { type: "plain_text", text: "View My Profile" },
              url: profileUrl,
            },
            {
              type: "button",
              text: { type: "plain_text", text: "Team Dashboard" },
              url: dashboardUrl,
            },
            {
              type: "button",
              text: { type: "plain_text", text: "Invite Teammate" },
              url: inviteUrl,
            },
            {
              type: "button",
              text: { type: "plain_text", text: "Slack Settings" },
              url: integrationsUrl,
            },
          ],
        },
      ],
    });
  } catch (error) {
    const supabase = createServiceSupabaseClient();
    const form = parseSlackFormBody(rawBody);
    const teamId = form.get("team_id");
    let orgId: string | null = null;

    try {
      if (teamId) {
        const connection = await getActiveSlackConnectionByTeamId(supabase, teamId);
        orgId = connection?.org_id || null;
      }
    } catch {
      // Ignore secondary lookup errors while logging.
    }

    await logSlackError({
      supabase,
      orgId,
      functionName: "slack-rcf",
      errorMessage: error instanceof Error ? error.message : "Internal server error",
      payload: Object.fromEntries(form.entries()),
    });

    return respondToSlackText("RoleColorFinder could not load the Slack shortcuts right now.");
  }
});
