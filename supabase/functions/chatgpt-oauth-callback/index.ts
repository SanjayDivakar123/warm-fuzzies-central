import {
  buildPortalPath,
  consumeChatgptOAuthState,
  corsHeaders,
  createServiceSupabaseClient,
  getCompanyById,
  HttpError,
  json,
  upsertChatgptConnection,
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
    const stateToken = (url.searchParams.get("state") || "").trim();

    if (!stateToken) {
      throw new HttpError(400, "state is required");
    }

    const state = await consumeChatgptOAuthState(stateToken);
    const connectionResult = await upsertChatgptConnection({
      connectionType: state.connection_type,
      userId: state.user_id,
      connectedByUserId: state.connected_by_user_id,
      orgId: state.org_id,
      scopesGranted: state.requested_scopes || [],
    });

    const supabase = createServiceSupabaseClient();
    await supabase
      .from("chatgpt_oauth_states")
      .update({ updated_at: new Date().toISOString() } as any)
      .eq("id", state.id);

    if (state.redirect_uri) {
      const redirectUrl = new URL(state.redirect_uri);
      redirectUrl.searchParams.set("state", state.state_token);
      redirectUrl.searchParams.set("code", state.code || connectionResult.accessTokenPlain);
      return redirect(redirectUrl.toString());
    }

    if (state.connection_type === "b2b" && state.org_id) {
      const company = await getCompanyById(supabase, state.org_id);
      return redirect(buildPortalPath(company, { tab: "settings", settingsTab: "integrations", chatgpt: "connected" }));
    }

    return redirect(buildPortalPath(null, { chatgpt: "connected" }));
  } catch (error) {
    if (error instanceof HttpError) {
      return json({ error: error.message }, error.status);
    }

    console.error("chatgpt-oauth-callback error", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
