import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminCorsHeaders, logAdminAction, requireSuperAdmin } from "../_shared/admin.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: adminCorsHeaders });
  }

  try {
    const { supabase, user } = await requireSuperAdmin(req);
    const body = await req.json().catch(() => ({}));
    const email = (body?.email || "").toString().trim().toLowerCase();
    const password = (body?.password || "").toString();
    const fullName = (body?.full_name || "").toString().trim();
    const companyId = (body?.company_id || "").toString().trim();
    const companyRole = (body?.company_role || "employee").toString().trim();
    const roleColor = body?.role_color ? (body.role_color as string) : null;

    if (!email || !password || !fullName) throw new Error("full_name, email, and password are required");

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role_color: roleColor,
        created_by_admin: true,
        temp_password: true,
      },
    });

    if (error || !data.user) throw new Error(error?.message || "Failed to create user");

    if (companyId) {
      const { error: memberError } = await supabase
        .from("company_users")
        .insert({
          company_id: companyId,
          user_id: data.user.id,
          email,
          full_name: fullName,
          role: companyRole,
          status: "active",
          joined_at: new Date().toISOString(),
        });

      if (memberError) throw memberError;
    }

    await logAdminAction({
      supabase,
      actorId: user.id,
      actorEmail: user.email,
      actionType: "user_create",
      targetType: "user",
      targetId: data.user.id,
      targetLabel: email,
      metadata: {
        company_id: companyId || null,
        company_role: companyId ? companyRole : null,
        role_color: roleColor,
        temp_password: true,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: data.user.id,
        email,
        full_name: fullName,
        company_id: companyId || null,
        company_role: companyId ? companyRole : null,
        role_color: roleColor,
      },
    }), {
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
