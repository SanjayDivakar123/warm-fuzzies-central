import {
  corsHeaders,
  createServiceSupabaseClient,
  getConnectionByCategory,
  json,
  parseWebhookMetadata,
  setConnectionState,
  shouldSyncForWebhook,
  softDeleteCategoryRecords,
  syncAtsConnection,
  syncHrisConnection,
  verifyMergeWebhookSignature,
} from "../_shared/merge.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const rawBody = await req.text();
    const isValid = await verifyMergeWebhookSignature(rawBody, req.headers.get("X-Merge-Webhook-Signature"));

    if (!isValid) {
      return json({ error: "Invalid webhook signature" }, 401);
    }

    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const metadata = parseWebhookMetadata(payload);

    if (!metadata.orgId || (metadata.category !== "hris" && metadata.category !== "ats")) {
      return json({ received: true, ignored: true, reason: "Missing orgId or category" }, 200);
    }

    const supabase = createServiceSupabaseClient();
    const connection = await getConnectionByCategory(supabase, metadata.orgId, metadata.category);

    if (!connection) {
      return json({ received: true, ignored: true, reason: "Connection not found" }, 200);
    }

    if (metadata.event.includes("linked account deleted")) {
      await softDeleteCategoryRecords(supabase, metadata.orgId, metadata.category);
      await setConnectionState({
        supabase,
        orgId: metadata.orgId,
        category: metadata.category,
        values: {
          account_token: null,
          connection_status: "disconnected",
          sync_status: "idle",
          is_active: false,
        },
      });

      return json({ received: true, disconnected: true }, 200);
    }

    if (!shouldSyncForWebhook(metadata)) {
      return json({ received: true, ignored: true }, 200);
    }

    if (!connection.is_active || !connection.account_token) {
      return json({ received: true, ignored: true, reason: "No active account token" }, 200);
    }

    if (metadata.category === "hris") {
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, name, subdomain")
        .eq("id", metadata.orgId)
        .maybeSingle();

      if (companyError || !company) {
        return json({ error: "Company not found for webhook sync" }, 404);
      }

      const syncResult = await syncHrisConnection({
        supabase,
        connection,
        company,
      });

      return json({ received: true, syncResult }, 200);
    }

    const syncResult = await syncAtsConnection({
      supabase,
      connection,
    });

    return json({ received: true, syncResult }, 200);
  } catch (error) {
    console.error("webhook-handler error", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
