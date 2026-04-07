import {
  createServiceSupabaseClient,
  getActiveSlackConnectionByTeamId,
  getCompanyByOrgId,
  logSlackError,
  verifySlackSignature,
} from "../_shared/slack.ts";
import {
  generateSlackAssistantReply,
  postSlackAssistantReply,
} from "../_shared/slack-assistant.ts";
import {
  applyEmailMismatchRoute,
  fetchSlackProfileSnapshot,
  findFuzzyNameMatch,
  getCompanyUserIdentityById,
  insertSlackPendingConfirmation,
  linkSlackAccountToCompanyUser,
  resolveCompanyUserIdentityByEmail,
  sendLinkedWelcomeDm,
  updateSlackPendingConfirmation,
} from "../_shared/slack-onboarding.ts";

const ack = (payload: unknown = { ok: true }) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });

const backgroundTask = (task: Promise<unknown>) => {
  const edgeRuntime = (globalThis as typeof globalThis & {
    EdgeRuntime?: { waitUntil?: (promise: Promise<unknown>) => void };
  }).EdgeRuntime;

  if (edgeRuntime?.waitUntil) {
    edgeRuntime.waitUntil(task);
    return;
  }

  void task.catch((error) => console.error("slack-events background task failed", error));
};

const handleTeamJoin = async (payload: any) => {
  const teamId = payload.team_id || payload.authorizations?.[0]?.team_id;
  const slackUserId = payload?.event?.user?.id || null;
  const supabase = createServiceSupabaseClient();

  try {
    if (!teamId || !slackUserId) {
      return;
    }

    const connection = await getActiveSlackConnectionByTeamId(supabase, teamId);
    if (!connection?.bot_token) {
      return;
    }

    const company = await getCompanyByOrgId(supabase, connection.org_id);
    const profile = await fetchSlackProfileSnapshot(connection.bot_token, slackUserId);

    if (!profile) {
      return;
    }

    const exactEmailMatch = profile.email
      ? await resolveCompanyUserIdentityByEmail(supabase, connection.org_id, profile.email)
      : null;

    if (exactEmailMatch) {
      await linkSlackAccountToCompanyUser(supabase, connection.org_id, exactEmailMatch.id, profile.slackUserId);
      const linkedUser =
        (await getCompanyUserIdentityById(supabase, connection.org_id, exactEmailMatch.id)) || exactEmailMatch;

      const confirmation = await insertSlackPendingConfirmation({
        supabase,
        orgId: connection.org_id,
        profile,
        matchType: "exact_email",
        matchedUser: linkedUser,
        status: "confirmed",
      });

      await updateSlackPendingConfirmation(supabase, confirmation.id, {
        responded_at: new Date().toISOString(),
      });
      await sendLinkedWelcomeDm(connection, company, linkedUser);
      return;
    }

    let fuzzyUser = null;
    let matchConfidence: number | null = null;

    if (connection.name_matching_enabled) {
      const fuzzyMatch = await findFuzzyNameMatch(
        supabase,
        connection.org_id,
        profile.realName || profile.displayName,
      );

      if (fuzzyMatch?.companyUserId) {
        fuzzyUser = await getCompanyUserIdentityById(supabase, connection.org_id, fuzzyMatch.companyUserId);
        matchConfidence = fuzzyMatch.matchConfidence;
      }
    }

    await applyEmailMismatchRoute({
      supabase,
      company,
      connection,
      profile,
      fuzzyMatch: fuzzyUser,
      matchConfidence,
      mismatchAction: connection.email_mismatch_action,
    });
  } catch (error) {
    await logSlackError({
      supabase,
      orgId: teamId ? (await getActiveSlackConnectionByTeamId(supabase, teamId))?.org_id || null : null,
      functionName: "slack-events",
      errorMessage: error instanceof Error ? error.message : "Background team_join error",
      payload,
    });
  }
};

const handleAssistantEvent = async (payload: any) => {
  const event = payload?.event;
  const teamId = payload.team_id || payload.authorizations?.[0]?.team_id;
  const channel = event?.channel || null;
  const userId = event?.user || null;
  const supabase = createServiceSupabaseClient();

  try {
    if (!teamId || !channel || !userId) {
      return;
    }

    if (event?.bot_id || event?.subtype) {
      return;
    }

    const channelType = event?.channel_type || null;
    const isDirectMessage = event?.type === "message" && (channelType === "im" || channelType === "app_home");
    const isAppMention = event?.type === "app_mention";

    if (!isDirectMessage && !isAppMention) {
      return;
    }

    const connection = await getActiveSlackConnectionByTeamId(supabase, teamId);
    if (!connection?.bot_token) {
      return;
    }

    const company = await getCompanyByOrgId(supabase, connection.org_id);
    const reply = await generateSlackAssistantReply({
      supabase,
      company,
      connection,
      userText: event?.text || "",
    });

    await postSlackAssistantReply({
      connection,
      channel,
      text: isAppMention ? `<@${userId}> ${reply.text}` : reply.text,
      blocks: reply.blocks,
      threadTs: isAppMention ? event?.thread_ts || event?.ts || null : null,
    });
  } catch (error) {
    await logSlackError({
      supabase,
      orgId: teamId ? (await getActiveSlackConnectionByTeamId(supabase, teamId))?.org_id || null : null,
      functionName: "slack-events",
      errorMessage: error instanceof Error ? error.message : "Background assistant event error",
      payload,
    });
  }
};

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
    const payload = rawBody ? JSON.parse(rawBody) : {};

    if (payload?.type === "url_verification" && payload?.challenge) {
      return ack({ challenge: payload.challenge });
    }

    const isValid = await verifySlackSignature(req.headers, rawBody);
    if (!isValid) {
      return new Response("Invalid Slack signature", { status: 403 });
    }

    if (payload?.type !== "event_callback") {
      return ack();
    }
    if (payload?.event?.type === "team_join") {
      backgroundTask(handleTeamJoin(payload));
      return ack();
    }

    if (
      payload?.event?.type === "app_mention" ||
      (payload?.event?.type === "message" &&
        (payload?.event?.channel_type === "im" || payload?.event?.channel_type === "app_home"))
    ) {
      backgroundTask(handleAssistantEvent(payload));
      return ack();
    }

    return ack();
  } catch (error) {
    let payload: any = {};
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      payload = { rawBody };
    }

    const supabase = createServiceSupabaseClient();
    const teamId = payload?.team_id || payload?.authorizations?.[0]?.team_id || null;
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
      functionName: "slack-events",
      errorMessage: error instanceof Error ? error.message : "Internal server error",
      payload,
    });

    return ack();
  }
});
