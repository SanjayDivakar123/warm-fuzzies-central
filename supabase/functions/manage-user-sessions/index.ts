import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminCorsHeaders, logAdminAction, requireSuperAdmin } from "../_shared/admin.ts";

const jsonHeaders = { ...adminCorsHeaders, "Content-Type": "application/json" };

async function listSessionsForUser(
  supabase: Awaited<ReturnType<typeof requireSuperAdmin>>["supabase"],
  targetUserId: string,
) {
  const { data, error } = await supabase
    .schema("auth")
    .from("sessions")
    .select("id, user_id, created_at, updated_at, ip, user_agent")
    .eq("user_id", targetUserId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("Session inspection unavailable:", error.message);
    return {
      sessions: [],
      unavailable: true,
      error: "Session inspection is unavailable in this environment.",
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
      let query = supabase.schema("auth").from("sessions").delete().eq("user_id", targetUserId);
      if (sessionId) {
        query = query.eq("id", sessionId);
      }
      const { error } = await query;
      if (error) {
        console.warn("Session sign-out unavailable:", error.message);
        return new Response(
          JSON.stringify({
            success: false,
            unavailable: true,
            error: "Session management is unavailable in this environment.",
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
