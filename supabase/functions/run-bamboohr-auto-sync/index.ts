// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bamboo-auto-sync-key",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const configuredAutoSyncKey = Deno.env.get("BAMBOOHR_AUTO_SYNC_KEY");
    const providedAutoSyncKey = req.headers.get("x-bamboo-auto-sync-key") || "";

    if (!configuredAutoSyncKey) {
      return json({ error: "BAMBOOHR_AUTO_SYNC_KEY is not configured" }, 500);
    }
    if (providedAutoSyncKey !== configuredAutoSyncKey) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Supabase environment is not configured" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: integrations, error } = await supabase
      .from("bamboohr_integrations")
      .select("company_id, auto_sync_enabled, auto_sync_interval_seconds, last_auto_sync_at")
      .eq("auto_sync_enabled", true);

    if (error) {
      return json({ error: "Failed to load auto-sync integrations" }, 500);
    }

    const now = Date.now();
    const dueIntegrations = (integrations || []).filter((item: any) => {
      const intervalSeconds = Number(item.auto_sync_interval_seconds || 3600);
      if (!Number.isFinite(intervalSeconds) || intervalSeconds < 6) return false;

      if (!item.last_auto_sync_at) return true;

      const lastRun = new Date(item.last_auto_sync_at).getTime();
      if (Number.isNaN(lastRun)) return true;
      return now - lastRun >= intervalSeconds * 1000;
    });

    const functionUrl = `${supabaseUrl}/functions/v1/sync-bamboohr-hiring`;

    let attempted = 0;
    let succeeded = 0;
    const failures: Array<{ company_id: string; error: string }> = [];

    for (const integration of dueIntegrations) {
      attempted += 1;

      try {
        const response = await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-bamboo-auto-sync-key": configuredAutoSyncKey,
          },
          body: JSON.stringify({
            action: "sync_jobs",
            company_id: integration.company_id,
            auto_trigger: true,
          }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          failures.push({
            company_id: integration.company_id,
            error: payload?.error || payload?.message || `Sync failed (${response.status})`,
          });
          continue;
        }

        succeeded += 1;
      } catch (err) {
        failures.push({
          company_id: integration.company_id,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return json({
      success: true,
      scanned: integrations?.length || 0,
      due: dueIntegrations.length,
      attempted,
      succeeded,
      failed: failures.length,
      failures,
    });
  } catch (error) {
    console.error("run-bamboohr-auto-sync error", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
