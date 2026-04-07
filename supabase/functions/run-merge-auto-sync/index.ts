import {
  corsHeaders,
  createServiceSupabaseClient,
  logMergeSyncError,
  syncAtsConnection,
  type MergeConnectionRecord,
} from "../_shared/merge.ts";

const AUTO_SYNC_INTERVAL_MS = 15 * 60 * 1000;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const isDue = (lastSyncedAt: string | null) => {
  if (!lastSyncedAt) return true;
  const ts = new Date(lastSyncedAt).getTime();
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts >= AUTO_SYNC_INTERVAL_MS;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const configuredKey = Deno.env.get("MERGE_AUTO_SYNC_KEY");
    const providedKey = req.headers.get("x-merge-auto-sync-key") || "";

    if (!configuredKey) {
      return json({ error: "MERGE_AUTO_SYNC_KEY is not configured" }, 500);
    }
    if (providedKey !== configuredKey) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createServiceSupabaseClient();

    const { data: connections, error } = await supabase
      .from("merge_connections")
      .select(
        [
          "id",
          "org_id",
          "platform_name",
          "category",
          "integration_slug",
          "account_token",
          "linked_account_id",
          "webhook_listener_url",
          "connection_status",
          "sync_status",
          "connected_at",
          "last_synced_at",
          "last_error_code",
          "last_error_message",
          "is_active",
        ].join(", "),
      )
      .eq("category", "ats")
      .eq("is_active", true)
      .eq("connection_status", "connected");

    if (error) {
      return json({ error: `Failed to load Merge ATS connections: ${error.message}` }, 500);
    }

    const dueConnections = (connections || []).filter((connection) => {
      const typedConnection = connection as MergeConnectionRecord;
      if (typedConnection.sync_status === "syncing") return false;
      return isDue(typedConnection.last_synced_at);
    }) as MergeConnectionRecord[];

    let attempted = 0;
    let succeeded = 0;
    const failures: Array<{ orgId: string; platform: string; error: string }> = [];

    for (const connection of dueConnections) {
      attempted += 1;

      try {
        await syncAtsConnection({
          supabase,
          connection,
        });
        succeeded += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        failures.push({
          orgId: connection.org_id,
          platform: connection.platform_name,
          error: message,
        });

        await logMergeSyncError({
          supabase,
          orgId: connection.org_id,
          platform: connection.platform_name,
          category: "ats",
          errorCode: "AUTO_SYNC_FAILED",
          errorMessage: message,
          context: {
            triggeredBy: "run-merge-auto-sync",
          },
        });
      }
    }

    return json({
      success: true,
      scanned: (connections || []).length,
      due: dueConnections.length,
      attempted,
      succeeded,
      failed: failures.length,
      failures,
    });
  } catch (error) {
    console.error("run-merge-auto-sync error", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
