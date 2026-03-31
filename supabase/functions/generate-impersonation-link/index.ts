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

    if (!email) throw new Error("email is required");

    const { data: currentSuperAdmins } = await supabase
      .from("platform_super_admins")
      .select("email");

    const isTargetSuperAdmin = (currentSuperAdmins || []).some((row) => row.email.toLowerCase() === email);
    if (isTargetSuperAdmin) {
      throw new Error("Impersonation is not available for other super admins");
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: "https://rolecolorfinder.com/dashboard",
      },
    });

    if (error) throw error;

    const actionLink = data?.properties?.action_link;
    if (!actionLink) throw new Error("Could not generate impersonation link");

    await logAdminAction({
      supabase,
      actorId: user.id,
      actorEmail: user.email,
      actionType: "impersonation_link_generated",
      targetType: "user",
      targetLabel: email,
      metadata: {},
    });

    return new Response(JSON.stringify({ success: true, link: actionLink }), {
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
