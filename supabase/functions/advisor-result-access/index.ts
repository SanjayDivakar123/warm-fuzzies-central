import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  advisorCorsHeaders,
  createServiceClient,
  getAdvisorForAuthUser,
  jsonResponse,
} from "../_shared/advisorLanding.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: advisorCorsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const body = await req.json();
    const submissionId = body.submissionId ? String(body.submissionId) : "";
    const guestResultToken = body.guestResultToken ? String(body.guestResultToken) : "";
    const supabase = createServiceClient();

    if (guestResultToken) {
      const { data: submission, error } = await supabase
        .from("advisor_landing_submissions")
        .select("id,guest_name,assessment_type,status,results,result_summary,completed_at,landing_page:advisor_landing_pages(title,slug),advisor:advisors(name,company_name)")
        .eq("guest_result_token", guestResultToken)
        .eq("status", "completed")
        .single();

      if (error) throw error;
      return jsonResponse(200, { submission, access: "guest" });
    }

    if (!submissionId) {
      return jsonResponse(400, { error: "submissionId or guestResultToken is required" });
    }

    const { advisor } = await getAdvisorForAuthUser(req, supabase);
    const { data: submission, error } = await supabase
      .from("advisor_landing_submissions")
      .select("*, landing_page:advisor_landing_pages(title,slug), commission:advisor_commissions(*)")
      .eq("id", submissionId)
      .eq("advisor_id", advisor.id)
      .single();

    if (error) throw error;
    return jsonResponse(200, { submission, access: "advisor" });
  } catch (error) {
    console.error("advisor-result-access error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return jsonResponse(status, { error: message });
  }
});
