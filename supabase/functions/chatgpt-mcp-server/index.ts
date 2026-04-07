import {
  buildInitializeResult,
  buildProtectedResourceMetadata,
  buildToolsListResult,
  buildUnauthorizedToolResponse,
  CHATGPT_MCP_SERVER_URL,
  corsHeaders,
  executeToolCall,
  getChatgptConnectionByAccessToken,
  HttpError,
  json,
  logToolCall,
  mcpError,
  mcpSuccess,
} from "../_shared/chatgpt.ts";

const unauthorizedResponse = (id: string | number | null) =>
  json(
    {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32001,
        message: "Reconnect RoleColorFinder in your portal to continue using this MCP server.",
        data: buildUnauthorizedToolResponse(
          `${CHATGPT_MCP_SERVER_URL}?metadata=protected-resource`,
          "Reconnect RoleColorFinder in your portal to continue using this MCP server.",
        ),
      },
    },
    401,
    {
      "WWW-Authenticate":
        `Bearer resource_metadata="${CHATGPT_MCP_SERVER_URL}?metadata=protected-resource", error="invalid_token", ` +
        `error_description="Reconnect RoleColorFinder in your portal to continue using this MCP server."`,
    },
  );

const parseBearerToken = (req: Request) => req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim() || null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);

  if (req.method === "GET") {
    if (url.searchParams.get("metadata") === "protected-resource") {
      return json(buildProtectedResourceMetadata());
    }

    return json({
      name: "RoleColorFinder MCP",
      status: "ok",
      resource: CHATGPT_MCP_SERVER_URL,
      metadata_url: `${CHATGPT_MCP_SERVER_URL}?metadata=protected-resource`,
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let payload: any = null;

  try {
    payload = await req.json();
    const id = payload?.id ?? null;
    const method = String(payload?.method || "");
    const token = parseBearerToken(req);
    const connection = token ? await getChatgptConnectionByAccessToken(token) : null;

    if (method === "initialize") {
      return mcpSuccess(id, await buildInitializeResult(connection));
    }

    if (method === "ping" || method === "notifications/initialized") {
      return mcpSuccess(id, {});
    }

    if (!connection) {
      return unauthorizedResponse(id);
    }

    if (method === "tools/list") {
      return mcpSuccess(id, buildToolsListResult(connection));
    }

    if (method === "tools/call") {
      const toolName = String(payload?.params?.name || "");
      const input = (payload?.params?.arguments || {}) as Record<string, unknown>;
      const startedAt = Date.now();

      try {
        const result = await executeToolCall(connection, toolName, input);
        const latencyMs = Date.now() - startedAt;

        await logToolCall({
          connectionId: connection.id,
          toolName,
          inputParams: input,
          response: result,
          latencyMs,
        });

        return mcpSuccess(id, {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
          structuredContent: result,
        });
      } catch (error) {
        const latencyMs = Date.now() - startedAt;
        const message = error instanceof HttpError ? error.message : error instanceof Error ? error.message : "Tool call failed";

        await logToolCall({
          connectionId: connection.id,
          toolName,
          inputParams: input,
          response: { error: message },
          latencyMs,
          isError: true,
          errorMessage: message,
        });

        if (error instanceof HttpError && error.status === 401) {
          return unauthorizedResponse(id);
        }

        return mcpSuccess(id, {
          content: [{ type: "text", text: message }],
          isError: true,
        });
      }
    }

    return mcpError(id, -32601, `Unsupported MCP method: ${method}`);
  } catch (error) {
    console.error("chatgpt-mcp-server error", error);
    return mcpError(payload?.id ?? null, -32603, error instanceof Error ? error.message : "Internal server error");
  }
});
