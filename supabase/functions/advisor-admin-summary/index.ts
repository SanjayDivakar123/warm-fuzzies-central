import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requireSuperAdmin } from "../_shared/admin.ts";
import { advisorCorsHeaders, jsonResponse } from "../_shared/advisorLanding.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: advisorCorsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const { supabase } = await requireSuperAdmin(req);
    const [{ count: advisors }, { count: pages }, { count: submissions }, { data: completed }, { data: commissions }] =
      await Promise.all([
        supabase.from("advisors").select("id", { count: "exact", head: true }),
        supabase.from("advisor_landing_pages").select("id", { count: "exact", head: true }),
        supabase.from("advisor_landing_submissions").select("id", { count: "exact", head: true }),
        supabase.from("advisor_landing_submissions").select("discounted_amount_minor").eq("status", "completed"),
        supabase.from("advisor_commissions").select("commission_amount_minor,status"),
      ]);

    return jsonResponse(200, {
      stats: {
        advisors: advisors ?? 0,
        pages: pages ?? 0,
        submissions: submissions ?? 0,
        completedRevenueMinor: (completed ?? []).reduce((sum: number, row: any) => sum + (row.discounted_amount_minor || 0), 0),
        commissionMinor: (commissions ?? []).reduce((sum: number, row: any) => sum + (row.commission_amount_minor || 0), 0),
        pendingCommissions: (commissions ?? []).filter((row: any) => ["pending", "held", "failed"].includes(row.status)).length,
      },
    });
  } catch (error) {
    console.error("advisor-admin-summary error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse(status, { error: message });
  }
});
