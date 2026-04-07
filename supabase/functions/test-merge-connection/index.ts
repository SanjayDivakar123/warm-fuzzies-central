import {
  corsHeaders,
  isHttpError,
  json,
  logMergeSyncError,
  requireCompanyAccess,
  setConnectionState,
} from "../_shared/merge.ts";

type ProcessEnv = Record<string, string | undefined>;

const process = {
  env:
    ((globalThis as typeof globalThis & { process?: { env?: ProcessEnv } }).process?.env as ProcessEnv | undefined) ??
    Deno.env.toObject(),
};

interface TestMergeConnectionRequest {
  orgId?: string;
  category?: "hris" | "ats";
  platformName?: string;
}

const TEST_PATHS = {
  hris: "/api/hris/v1/employees?page_size=1",
  ats: "/api/ats/v1/jobs?page_size=1",
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json()) as TestMergeConnectionRequest;
    const orgId = body.orgId;
    const category = body.category;
    const platformName = body.platformName;

    if (!orgId || !category || !platformName) {
      return json({ error: "orgId, category, and platformName are required" }, 400);
    }

    const apiKey = process.env.REACT_APP_MERGE_API_KEY;
    if (!apiKey) {
      return json({ error: "REACT_APP_MERGE_API_KEY is not configured" }, 500);
    }

    const context = await requireCompanyAccess(req, orgId);
    const { data: connection, error: connectionError } = await context.supabase
      .from("merge_connections")
      .select("id, org_id, platform_name, category, account_token, connection_status, sync_status, is_active")
      .eq("org_id", orgId)
      .eq("category", category)
      .eq("platform_name", platformName)
      .eq("is_active", true)
      .maybeSingle();

    if (connectionError) {
      throw new Error(`Failed to load Merge connection: ${connectionError.message}`);
    }

    if (!connection?.account_token) {
      return json({ error: "No active Merge connection found for this platform" }, 404);
    }

    const startedAt = performance.now();
    const response = await fetch(`https://api.merge.dev${TEST_PATHS[category]}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "X-Account-Token": connection.account_token,
      },
    });
    const latencyMs = Math.round(performance.now() - startedAt);

    if (response.ok) {
      await setConnectionState({
        supabase: context.supabase,
        orgId,
        category,
        values: {
          connection_status: "connected",
          last_error_code: null,
          last_error_message: null,
        },
      });

      return json({ success: true, latency_ms: latencyMs });
    }

    let errorMessage = `Connection error: ${response.status}`;
    const errorCode = "TEST_FAILED";
    let reconnectRequired = false;

    if (response.status === 401) {
      errorMessage = "Authentication failed — reconnect required";
      reconnectRequired = true;
      await setConnectionState({
        supabase: context.supabase,
        orgId,
        category,
        values: {
          connection_status: "reconnect_required",
          sync_status: "error",
          last_error_code: "401",
          last_error_message: errorMessage,
        },
      });
    } else if (response.status === 404) {
      await setConnectionState({
        supabase: context.supabase,
        orgId,
        category,
        values: {
          connection_status: "disconnected",
          sync_status: "error",
          account_token: null,
          last_error_code: "404",
          last_error_message: errorMessage,
          is_active: false,
        },
      });
    } else if (response.status === 429) {
      errorMessage = "Rate limited — try again in 60s";
      await setConnectionState({
        supabase: context.supabase,
        orgId,
        category,
        values: {
          sync_status: "retrying",
          last_error_code: "429",
          last_error_message: errorMessage,
        },
      });
    } else if (response.status === 403) {
      errorMessage = "Connected, but this provider did not grant access to the test endpoint.";
    } else {
      await setConnectionState({
        supabase: context.supabase,
        orgId,
        category,
        values: {
          sync_status: "error",
          last_error_code: String(response.status),
          last_error_message: errorMessage,
        },
      });
    }

    await logMergeSyncError({
      supabase: context.supabase,
      orgId,
      platform: platformName,
      category,
      errorCode,
      errorMessage,
      context: {
        status: response.status,
        latency_ms: latencyMs,
        path: TEST_PATHS[category],
      },
    });

    return json({
      success: false,
      error: errorMessage,
      latency_ms: latencyMs,
      reconnect_required: reconnectRequired,
    });
  } catch (error) {
    if (isHttpError(error)) {
      return json({ error: error.message }, error.status);
    }

    console.error("test-merge-connection error", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
