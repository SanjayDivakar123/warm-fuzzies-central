import {
  buildCompanyAdminPortalUrl,
  corsHeaders,
  createServiceSupabaseClient,
  exchangeSlackOAuthCode,
  getCompanyByOrgId,
  json,
  logSlackError,
} from "../_shared/slack.ts";

const redirect = (url: string) =>
  new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      Location: url,
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const orgId = url.searchParams.get("state");
  const slackError = url.searchParams.get("error");

  if (!orgId) {
    return json({ error: "Missing OAuth state" }, 400);
  }

  const supabase = createServiceSupabaseClient();
  let companyUrl = buildCompanyAdminPortalUrl(
    { id: orgId, name: "Company", subdomain: null },
    { tab: "settings", settingsTab: "integrations", slack: "error" },
  );

  try {
    const company = await getCompanyByOrgId(supabase, orgId);
    companyUrl = buildCompanyAdminPortalUrl(company, { tab: "settings", settingsTab: "integrations", slack: "connected" });

    if (slackError) {
      await logSlackError({
        supabase,
        orgId,
        functionName: "slack-oauth-callback",
        errorMessage: `Slack OAuth error: ${slackError}`,
        payload: Object.fromEntries(url.searchParams.entries()),
      });
      return redirect(buildCompanyAdminPortalUrl(company, { tab: "settings", settingsTab: "integrations", slack: "error" }));
    }

    if (!code) {
      return json({ error: "Missing Slack OAuth code" }, 400);
    }

    const oauthPayload = await exchangeSlackOAuthCode(code);
    const teamId = oauthPayload.team?.id;
    const teamName = oauthPayload.team?.name;
    const botToken = oauthPayload.access_token;

    if (!teamId || !teamName || !botToken) {
      throw new Error("Slack OAuth response is missing team or bot token details");
    }

    const incomingWebhook = oauthPayload.incoming_webhook || {};
    const nowIso = new Date().toISOString();

    await supabase
      .from("slack_connections")
      .update({
        is_active: false,
        updated_at: nowIso,
      } as any)
      .or(`org_id.eq.${orgId},team_id.eq.${teamId}`)
      .eq("is_active", true);

    const { error: upsertError } = await supabase.from("slack_connections").upsert(
      {
        org_id: orgId,
        team_id: teamId,
        team_name: teamName,
        bot_token: botToken,
        authed_user_id: oauthPayload.authed_user?.id || null,
        incoming_webhook_url: incomingWebhook.url || null,
        incoming_webhook_channel: incomingWebhook.channel || null,
        connected_at: nowIso,
        is_active: true,
      } as any,
      {
        onConflict: "org_id,team_id",
      },
    );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    await supabase
      .from("companies")
      .update({
        slack_notifications_enabled: true,
      })
      .eq("id", orgId);

    return redirect(companyUrl);
  } catch (error) {
    console.error("slack-oauth-callback error", error);
    await logSlackError({
      supabase,
      orgId,
      functionName: "slack-oauth-callback",
      errorMessage: error instanceof Error ? error.message : "Internal server error",
      payload: Object.fromEntries(url.searchParams.entries()),
    });
    return redirect(companyUrl.replace("slack=connected", "slack=error"));
  }
});
