import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminCorsHeaders, logAdminAction, requireSuperAdmin } from "../_shared/admin.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: adminCorsHeaders });
  }

  try {
    const { user, supabase } = await requireSuperAdmin(req);
    const body = await req.json().catch(() => ({}));
    const accessType = (body?.access_type || "").toString();
    const userId = (body?.user_id || "").toString();
    const email = (body?.email || "").toString().toLowerCase();
    const companyId = body?.company_id ? body.company_id.toString() : null;

    if (!accessType || (!userId && !email)) {
      return new Response(JSON.stringify({ error: "access_type and user identifier are required" }), {
        status: 400,
        headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
      });
    }

    if (accessType === "super_admin") {
      let query = supabase.from("platform_super_admins").delete();
      if (userId) {
        query = query.eq("user_id", userId);
      } else {
        query = query.eq("email", email);
      }
      const { error } = await query;
      if (error) throw error;

      await logAdminAction({
        supabase,
        actorId: user.id,
        actorEmail: user.email || "",
        actionType: "super_admin_remove",
        targetType: "user",
        targetId: userId || null,
        targetLabel: email || userId,
        metadata: {},
      });
    } else {
      let query = supabase
        .from("company_users")
        .update({ role: "employee" })
        .in("role", ["admin", "hr", "partner"]);

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      if (userId) {
        query = query.eq("user_id", userId);
      } else {
        query = query.eq("email", email);
      }

      const { error } = await query;
      if (error) throw error;

      await logAdminAction({
        supabase,
        actorId: user.id,
        actorEmail: user.email || "",
        actionType: "company_admin_revoke",
        targetType: "user",
        targetId: userId || null,
        targetLabel: email || userId,
        metadata: { company_id: companyId, access_type: accessType },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in revoke-elevated-access:", error);
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || "Unexpected error" }),
      {
        status: 500,
        headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
