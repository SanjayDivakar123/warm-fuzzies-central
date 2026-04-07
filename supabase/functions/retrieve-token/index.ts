import {
  callMergeApi,
  corsHeaders,
  disconnectConnection,
  fetchAccountDetails,
  getConnectionByCategory,
  isHttpError,
  isMergeApiError,
  json,
  listConnectionSummaries,
  requireCompanyAccess,
  saveConnection,
  syncAtsConnection,
  syncHrisConnection,
} from "../_shared/merge.ts";

type RetrieveTokenMetadata = {
  name: string;
  slug: string;
  image?: string | null;
  square_image?: string | null;
  categories?: string[];
};

type RetrieveTokenAction = "list_connections" | "list_metadata" | "exchange_public_token" | "disconnect";

interface RetrieveTokenRequest {
  action?: RetrieveTokenAction;
  orgId?: string;
  category?: "hris" | "ats";
  platformName?: string;
  integration?: string | null;
  publicToken?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json()) as RetrieveTokenRequest;
    const action = body.action;
    const orgId = body.orgId;

    if (!action || !orgId) {
      return json({ error: "action and orgId are required" }, 400);
    }

    const context = await requireCompanyAccess(req, orgId);

    if (action === "list_connections") {
      const connections = await listConnectionSummaries(context.supabase, orgId);
      return json({ success: true, connections });
    }

    if (action === "list_metadata") {
      const metadata = await callMergeApi<RetrieveTokenMetadata[]>({
        supabase: context.supabase,
        path: "/api/integrations/",
      });

      return json({ success: true, metadata });
    }

    if (!body.category) {
      return json({ error: "category is required" }, 400);
    }

    if (action === "disconnect") {
      const connection = await getConnectionByCategory(context.supabase, orgId, body.category);
      if (connection?.is_active) {
        await disconnectConnection({
          supabase: context.supabase,
          connection,
        });
      }

      const connections = await listConnectionSummaries(context.supabase, orgId);
      return json({ success: true, connections });
    }

    if (!body.publicToken || !body.platformName) {
      return json({ error: "publicToken and platformName are required" }, 400);
    }

    const tokenPayload = await callMergeApi<{ account_token?: string }>({
      supabase: context.supabase,
      path: `/api/integrations/account-token/${encodeURIComponent(body.publicToken)}`,
    });

    if (!tokenPayload?.account_token) {
      return json({ error: "Merge did not return an account token" }, 502);
    }

    const accountDetails = await fetchAccountDetails({
      supabase: context.supabase,
      orgId,
      category: body.category,
      platformName: body.platformName,
      accountToken: tokenPayload.account_token,
    });

    const connection = await saveConnection({
      supabase: context.supabase,
      orgId,
      platformName: body.platformName,
      category: body.category,
      integration: body.integration ?? null,
      accountToken: tokenPayload.account_token,
      linkedAccountId: accountDetails.linkedAccountId,
      webhookListenerUrl: accountDetails.webhookListenerUrl,
    });

    try {
      const syncResult = body.category === "hris"
        ? await syncHrisConnection({
          supabase: context.supabase,
          connection,
          company: context.company,
        })
        : await syncAtsConnection({
          supabase: context.supabase,
          connection,
        });

      const connections = await listConnectionSummaries(context.supabase, orgId);
      return json({ success: true, syncResult, connections });
    } catch (error) {
      if (isMergeApiError(error) && error.code === "RATE_LIMITED") {
        const connections = await listConnectionSummaries(context.supabase, orgId);
        return json(
          {
            success: true,
            retrying: true,
            message: "Sync in progress. Merge rate limiting triggered a retry window.",
            connections,
          },
          202,
        );
      }

      throw error;
    }
  } catch (error) {
    if (isHttpError(error)) {
      return json({ error: error.message }, error.status);
    }

    if (isMergeApiError(error)) {
      return json({ error: error.message, code: error.code }, error.status >= 400 ? error.status : 500);
    }

    console.error("retrieve-token error", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
