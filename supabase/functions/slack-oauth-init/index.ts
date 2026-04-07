import {
  buildSlackOAuthUrl,
  corsHeaders,
  HttpError,
  json,
  requireCompanyAccess,
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

  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("orgId") || url.searchParams.get("state");
    const accessToken = url.searchParams.get("access_token");

    if (!orgId) {
      return json({ error: "orgId is required" }, 400);
    }

    await requireCompanyAccess(req, orgId, accessToken);
    return redirect(buildSlackOAuthUrl(orgId));
  } catch (error) {
    if (error instanceof HttpError) {
      return json({ error: error.message }, error.status);
    }

    console.error("slack-oauth-init error", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
