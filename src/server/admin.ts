import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const emailSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
});

async function assertCallerIsAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const grantUnlimitedAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => emailSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.userId);

    // Find user by email via admin API
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) throw new Error(listErr.message);
    const target = list.users.find((u) => u.email?.toLowerCase() === data.email);
    if (!target) {
      throw new Error(`No user found with email ${data.email}. They must sign up first.`);
    }

    // Grant admin role (acts as "unlimited" flag in this system)
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: target.id, role: "admin" },
        { onConflict: "user_id,role", ignoreDuplicates: true }
      );
    if (roleErr && !/duplicate/i.test(roleErr.message)) throw new Error(roleErr.message);

    // Ensure they have an active tenant
    const { data: tenants, error: tErr } = await supabaseAdmin
      .from("tenants")
      .select("id, status")
      .eq("owner_id", target.id);
    if (tErr) throw new Error(tErr.message);

    if (!tenants || tenants.length === 0) {
      const { error: createErr } = await supabaseAdmin.from("tenants").insert({
        name: `${data.email.split("@")[0]} Workspace`,
        owner_id: target.id,
        status: "active",
      });
      if (createErr) throw new Error(createErr.message);
    } else {
      const { error: updErr } = await supabaseAdmin
        .from("tenants")
        .update({ status: "active" })
        .eq("owner_id", target.id);
      if (updErr) throw new Error(updErr.message);
    }

    return {
      success: true,
      userId: target.id,
      email: target.email,
      message: `${data.email} now has unlimited access (admin + active tenant).`,
    };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });
