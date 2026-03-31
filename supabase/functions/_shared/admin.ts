import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isSuperAdminEmail, normalizeEmail } from "./superAdmin.ts";

export const adminCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export type ServiceSupabaseClient = ReturnType<typeof createClient>;

export interface SuperAdminContext {
  user: {
    id: string;
    email: string;
  };
  supabase: ServiceSupabaseClient;
}

export async function requireSuperAdmin(req: Request): Promise<SuperAdminContext> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Unauthorized");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user?.email) {
    throw new Error("Unauthorized");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const callerEmail = normalizeEmail(user.email);

  if (!(await isSuperAdminEmail(supabase, callerEmail))) {
    throw new Error("Forbidden");
  }

  return {
    user: {
      id: user.id,
      email: callerEmail,
    },
    supabase,
  };
}

export async function logAdminAction(params: {
  supabase: ServiceSupabaseClient;
  actorId: string;
  actorEmail: string;
  actionType: string;
  targetType?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const { error } = await params.supabase.rpc("log_admin_action", {
    p_actor_id: params.actorId,
    p_actor_email: params.actorEmail,
    p_action_type: params.actionType,
    p_target_type: params.targetType ?? null,
    p_target_id: params.targetId ?? null,
    p_target_label: params.targetLabel ?? null,
    p_metadata: params.metadata ?? {},
  });

  if (error) {
    console.error("Failed to write admin action log:", error.message);
  }
}
