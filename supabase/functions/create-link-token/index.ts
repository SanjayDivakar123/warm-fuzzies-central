import {
  callMergeApi,
  corsHeaders,
  getConnectionByCategory,
  isHttpError,
  isMergeApiError,
  json,
  requireCompanyAccess,
} from "../_shared/merge.ts";

interface CreateLinkTokenRequest {
  orgId?: string;
  category?: "hris" | "ats";
  platformName?: string;
  integration?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json()) as CreateLinkTokenRequest;
    const orgId = body.orgId;
    const category = body.category;
    const platformName = body.platformName;

    if (!orgId || !category || !platformName) {
      return json({ error: "orgId, category, and platformName are required" }, 400);
    }

    const context = await requireCompanyAccess(req, orgId);
    if (!context.user.email) {
      return json({ error: "Signed-in user email is required to create a Merge Link token" }, 400);
    }

    const existingConnection = await getConnectionByCategory(context.supabase, orgId, category);

    if (
      existingConnection?.is_active &&
      existingConnection.platform_name !== platformName &&
      existingConnection.connection_status !== "disconnected"
    ) {
      return json(
        {
          error: `Disconnect ${existingConnection.platform_name} before connecting another ${category.toUpperCase()} platform.`,
        },
        409,
      );
    }

    const payload = await callMergeApi<{ link_token?: string; integration_name?: string | null }>({
      supabase: context.supabase,
      path: "/api/integrations/create-link-token",
      method: "POST",
      body: {
        end_user_origin_id: orgId,
        end_user_organization_name: context.company.name,
        end_user_email_address: context.user.email,
        categories: [category],
        integration: body.integration || undefined,
        link_expiry_mins: 30,
      },
    });

    if (!payload?.link_token) {
      return json({ error: "Merge did not return a link token" }, 502);
    }

    return json({
      success: true,
      linkToken: payload.link_token,
      integrationName: payload.integration_name ?? null,
    });
  } catch (error) {
    if (isHttpError(error)) {
      return json({ error: error.message }, error.status);
    }

    if (isMergeApiError(error)) {
      return json({ error: error.message, code: error.code }, error.status >= 400 ? error.status : 500);
    }

    console.error("create-link-token error", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
