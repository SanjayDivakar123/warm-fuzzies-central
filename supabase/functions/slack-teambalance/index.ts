import {
  buildTeamBalanceInsight,
  createServiceSupabaseClient,
  getActiveSlackConnectionByTeamId,
  getCompanyByOrgId,
  listOrgRoleColors,
  logSlackError,
  parseSlackFormBody,
  respondToSlack,
  respondToSlackText,
  verifySlackSignature,
} from "../_shared/slack.ts";

const COLORS = ["red", "yellow", "green", "blue"] as const;

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
    const users = await listOrgRoleColors(supabase, connection.org_id);
    const counts = COLORS.reduce<Record<string, number>>((accumulator, color) => {
      accumulator[color] = 0;
      return accumulator;
    }, {});

    for (const user of users) {
      if (user.color && counts[user.color] !== undefined) {
        counts[user.color] += 1;
      }
    }

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const fields = COLORS.map((color) => {
      const count = counts[color];
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      const label = color.charAt(0).toUpperCase() + color.slice(1);

      return {
        type: "mrkdwn",
        text: `*${label}*\n${count} (${percentage}%)`,
      };
    });

    return respondToSlack({
      response_type: "ephemeral",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${company.name}* team balance snapshot`,
          },
        },
        {
          type: "section",
          fields,
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: buildTeamBalanceInsight(counts, total),
          },
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
      functionName: "slack-teambalance",
      errorMessage: error instanceof Error ? error.message : "Internal server error",
      payload: Object.fromEntries(form.entries()),
    });

    return respondToSlackText("RoleColorFinder could not build the team balance snapshot right now.");
  }
});
