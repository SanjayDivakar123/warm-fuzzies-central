import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminCorsHeaders, logAdminAction, requireSuperAdmin } from "../_shared/admin.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: adminCorsHeaders });
  }

  try {
    const { supabase, user } = await requireSuperAdmin(req);
    const body = await req.json().catch(() => ({}));
    const companyId = (body?.company_id || "").toString().trim();
    const name = (body?.name || "").toString().trim();
    const subdomain = (body?.subdomain || "").toString().trim().toLowerCase();
    const planTier = (body?.plan_tier || "").toString().trim().toLowerCase();
    const archive = body?.archive === true;
    const unarchive = body?.unarchive === true;
    const notes = typeof body?.notes === "string" ? body.notes : null;
    const require2FA = typeof body?.require_2fa === "boolean" ? body.require_2fa : null;

    if (!companyId) throw new Error("company_id is required");

    const { data: existingCompany, error: existingError } = await supabase
      .from("companies")
      .select("id, name, subdomain, plan_tier, archived_at, notes, require_2fa")
      .eq("id", companyId)
      .single();

    if (existingError || !existingCompany) throw new Error("Company not found");

    const before = { ...existingCompany };
    const updatePayload: Record<string, unknown> = {};

    if (name) updatePayload.name = name;
    if (subdomain) updatePayload.subdomain = subdomain;
    if (planTier) updatePayload.plan_tier = planTier;
    if (archive) updatePayload.archived_at = new Date().toISOString();
    if (unarchive) updatePayload.archived_at = null;
    if (notes !== null) updatePayload.notes = notes;
    if (require2FA !== null) updatePayload.require_2fa = require2FA;

    const { data: updatedCompany, error: updateError } = await supabase
      .from("companies")
      .update(updatePayload)
      .eq("id", companyId)
      .select("id, name, subdomain, plan_tier, archived_at, notes, require_2fa")
      .single();

    if (updateError || !updatedCompany) throw new Error(updateError?.message || "Failed to update company");

    await logAdminAction({
      supabase,
      actorId: user.id,
      actorEmail: user.email,
      actionType: archive ? "company_archive" : unarchive ? "company_unarchive" : "company_update",
      targetType: "company",
      targetId: companyId,
      targetLabel: updatedCompany.name,
      metadata: {
        before,
        after: updatedCompany,
      },
    });

    return new Response(JSON.stringify({ success: true, company: updatedCompany }), {
      status: 200,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message || "Unexpected error" }), {
      status: 500,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  }
});
