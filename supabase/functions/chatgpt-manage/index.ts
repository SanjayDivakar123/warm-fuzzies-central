import {
  buildBusinessConnectionState,
  buildPersonalConnectionState,
  CHATGPT_TOOL_NAMES,
  corsHeaders,
  getChatgptConnectionByOrgId,
  getChatgptConnectionByUserId,
  HttpError,
  json,
  requireAuthenticatedUser,
  requireCompanyAccess,
  updateChatgptConnection,
} from "../_shared/chatgpt.ts";

const toText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const mode = toText(body.mode) as "b2b" | "personal" | null;
    const action = toText(body.action) || "get";

    if (!mode || !["b2b", "personal"].includes(mode)) {
      throw new HttpError(400, "mode must be 'b2b' or 'personal'");
    }

    if (mode === "b2b") {
      const orgId = toText(body.orgId);
      if (!orgId) {
        throw new HttpError(400, "orgId is required for Business mode");
      }

      await requireCompanyAccess(req, orgId);
      const connection = await getChatgptConnectionByOrgId(orgId);

      if (!connection && action === "get") {
        return json({ connection: null });
      }

      if (!connection) {
        throw new HttpError(404, "ChatGPT is not connected for this company");
      }

      if (action === "sync") {
        await updateChatgptConnection(connection.id, { last_sync_at: new Date().toISOString() });
        const refreshed = await getChatgptConnectionByOrgId(orgId);
        if (!refreshed) {
          throw new HttpError(404, "ChatGPT is no longer connected for this company");
        }
        return json({ success: true, ...(await buildBusinessConnectionState(refreshed)) });
      }

      if (action === "disconnect") {
        await updateChatgptConnection(connection.id, { is_active: false });
        return json({ success: true, connection: null });
      }

      if (action === "update_settings") {
        const requestedTools = Array.isArray(body.enabled_tools)
          ? body.enabled_tools
            .map((value) => String(value))
            .filter((value) => CHATGPT_TOOL_NAMES.includes(value))
          : connection.enabled_tools || [];

        await updateChatgptConnection(connection.id, {
          auto_inject_context: body.auto_inject_context === undefined ? connection.auto_inject_context : Boolean(body.auto_inject_context),
          enabled_tools: requestedTools.length ? requestedTools : connection.enabled_tools,
          last_sync_at: new Date().toISOString(),
        });

        const refreshed = await getChatgptConnectionByOrgId(orgId);
        if (!refreshed) {
          throw new HttpError(404, "ChatGPT is no longer connected for this company");
        }
        return json({ success: true, ...(await buildBusinessConnectionState(refreshed)) });
      }

      return json(await buildBusinessConnectionState(connection));
    }

    const auth = await requireAuthenticatedUser(req);
    const connection = await getChatgptConnectionByUserId(auth.user.id);

    if (!connection && action === "get") {
      return json({ connection: null });
    }

    if (!connection) {
      throw new HttpError(404, "ChatGPT is not connected for this user");
    }

    if (action === "disconnect") {
      await updateChatgptConnection(connection.id, { is_active: false });
      return json({ success: true, connection: null });
    }

    if (action === "sync") {
      await updateChatgptConnection(connection.id, { last_sync_at: new Date().toISOString() });
      const refreshed = await getChatgptConnectionByUserId(auth.user.id);
      if (!refreshed) {
        throw new HttpError(404, "ChatGPT is no longer connected for this user");
      }
      return json({ success: true, ...(await buildPersonalConnectionState(refreshed)) });
    }

    if (action === "update_settings") {
      const requestedTools = Array.isArray(body.enabled_tools)
        ? body.enabled_tools
          .map((value) => String(value))
          .filter((value) => CHATGPT_TOOL_NAMES.includes(value))
        : connection.enabled_tools || [];

      await updateChatgptConnection(connection.id, {
        share_profile: body.share_profile === undefined ? connection.share_profile : Boolean(body.share_profile),
        include_teammates: body.include_teammates === undefined ? connection.include_teammates : Boolean(body.include_teammates),
        enabled_tools: requestedTools.length ? requestedTools : connection.enabled_tools,
        last_sync_at: new Date().toISOString(),
      });

      const refreshed = await getChatgptConnectionByUserId(auth.user.id);
      if (!refreshed) {
        throw new HttpError(404, "ChatGPT is no longer connected for this user");
      }
      return json({ success: true, ...(await buildPersonalConnectionState(refreshed)) });
    }

    return json(await buildPersonalConnectionState(connection));
  } catch (error) {
    if (error instanceof HttpError) {
      return json({ error: error.message }, error.status);
    }

    console.error("chatgpt-manage error", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
