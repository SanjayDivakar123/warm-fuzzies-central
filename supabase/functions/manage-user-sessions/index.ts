import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminCorsHeaders, logAdminAction, requireSuperAdmin } from "../_shared/admin.ts";

const jsonHeaders = { ...adminCorsHeaders, "Content-Type": "application/json" };

async function listSessionsForUser(
  supabase: Awaited<ReturnType<typeof requireSuperAdmin>>["supabase"],
  targetUserId: string,
) {
  const { data, error } = await supabase.rpc("list_auth_sessions", {
    p_target_user_id: targetUserId,
  });

  if (error) {
    console.error("Session inspection failed:", error.message);
    return {
      sessions: [],
      unavailable: false,
      error: error.message || "Failed to inspect auth sessions.",
    };
  }

  return {
    sessions: data || [],
    unavailable: false,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: adminCorsHeaders });
  }

  try {
    const { user, supabase } = await requireSuperAdmin(req);
    const body = await req.json().catch(() => ({}));
    const action = (body?.action || "list").toString();
    const targetUserId = (body?.user_id || "").toString();
    const sessionId = body?.session_id ? body.session_id.toString() : null;

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    if (action === "list") {
      const payload = await listSessionsForUser(supabase, targetUserId);

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    if (action === "force_sign_out") {
      const { data, error } = await supabase.rpc("revoke_auth_sessions", {
        p_target_user_id: targetUserId,
        p_session_id: sessionId,
      });

      if (error) {
        console.error("Session sign-out failed:", error.message);
        return new Response(
          JSON.stringify({
            success: false,
            unavailable: false,
            error: error.message || "Failed to revoke auth sessions.",
          }),
          {
            status: 200,
            headers: jsonHeaders,
          },
        );
      }

      await logAdminAction({
        supabase,
        actorId: user.id,
        actorEmail: user.email || "",
        actionType: sessionId ? "force_sign_out_session" : "force_sign_out_all_sessions",
        targetType: "user",
        targetId: targetUserId,
        targetLabel: targetUserId,
        metadata: { session_id: sessionId },
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: jsonHeaders,
    });
  } catch (error) {
    console.error("Error in manage-user-sessions:", error);
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || "Unexpected error" }),
      {
        status: 500,
        headers: jsonHeaders,
      },
    );
  }
});
