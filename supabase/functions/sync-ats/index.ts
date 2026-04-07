import {
  corsHeaders,
  getConnectionByCategory,
  isHttpError,
  isMergeApiError,
  json,
  listConnectionSummaries,
  requireCompanyAccess,
  syncAtsConnection,
} from "../_shared/merge.ts";

interface SyncAtsRequest {
  orgId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json()) as SyncAtsRequest;
    if (!body.orgId) {
      return json({ error: "orgId is required" }, 400);
    }

    const context = await requireCompanyAccess(req, body.orgId);
    const connection = await getConnectionByCategory(context.supabase, body.orgId, "ats");

    if (!connection?.is_active) {
      return json({ error: "No active ATS connection found" }, 404);
    }

    const syncResult = await syncAtsConnection({
      supabase: context.supabase,
      connection,
    });

    const connections = await listConnectionSummaries(context.supabase, body.orgId);
    return json({ success: true, syncResult, connections });
  } catch (error) {
    if (isHttpError(error)) {
      return json({ error: error.message }, error.status);
    }

    if (isMergeApiError(error)) {
      if (error.code === "RATE_LIMITED") {
        return json(
          {
            success: false,
            retrying: true,
            message: "Sync in progress. Merge rate limiting triggered a retry window.",
          },
          202,
        );
      }

      return json({ error: error.message, code: error.code }, error.status >= 400 ? error.status : 500);
    }

    console.error("sync-ats error", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
