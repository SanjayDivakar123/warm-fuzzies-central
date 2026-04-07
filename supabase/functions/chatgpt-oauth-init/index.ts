import {
  createChatgptOAuthState,
  corsHeaders,
  HttpError,
  json,
  requireAuthenticatedUser,
  requireCompanyAccess,
} from "../_shared/chatgpt.ts";

const redirect = (location: string) =>
  new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      Location: location,
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL is not configured");
    }
    const connectionType = (url.searchParams.get("type") || "").trim() as "b2b" | "personal";
    const accessToken = url.searchParams.get("access_token");
    const requestedScopes = (url.searchParams.get("scope") || "rolecolor:read team:read advice:read")
      .split(/[,\s]+/)
      .map((scope) => scope.trim())
      .filter(Boolean);
    const redirectUri = url.searchParams.get("redirect_uri");
    const resource = url.searchParams.get("resource");
    const clientId = url.searchParams.get("client_id");

    if (!["b2b", "personal"].includes(connectionType)) {
      throw new HttpError(400, "type must be 'b2b' or 'personal'");
    }

    if (connectionType === "b2b") {
      const orgId = (url.searchParams.get("orgId") || "").trim();
      if (!orgId) {
        throw new HttpError(400, "orgId is required for Business mode");
      }

      const auth = await requireCompanyAccess(req, orgId, accessToken);
      const state = await createChatgptOAuthState({
        connectionType: "b2b",
        orgId,
        connectedByUserId: auth.user.id,
        requestedScopes,
        redirectUri,
        resource,
        clientId,
      });

      return redirect(`${supabaseUrl}/functions/v1/chatgpt-oauth-callback?state=${encodeURIComponent(state.state_token)}`);
    }

    const auth = await requireAuthenticatedUser(req, accessToken);
    const state = await createChatgptOAuthState({
      connectionType: "personal",
      userId: auth.user.id,
      connectedByUserId: auth.user.id,
      requestedScopes,
      redirectUri,
      resource,
      clientId,
    });

    return redirect(`${supabaseUrl}/functions/v1/chatgpt-oauth-callback?state=${encodeURIComponent(state.state_token)}`);
  } catch (error) {
    if (error instanceof HttpError) {
      return json({ error: error.message }, error.status);
    }

    console.error("chatgpt-oauth-init error", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
