import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  advisorCorsHeaders,
  createServiceClient,
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
    const { assessmentToken } = await req.json();
    if (!assessmentToken) {
      return jsonResponse(400, { error: "assessmentToken is required" });
    }

    const supabase = createServiceClient();
    const { data: submission, error } = await supabase
      .from("advisor_landing_submissions")
      .select("id,guest_name,assessment_type,status,landing_page:advisor_landing_pages(title),advisor:advisors(name)")
      .eq("assessment_token", String(assessmentToken))
      .single();

    if (error) throw error;

    if (!["paid", "assessment_started", "completed"].includes(submission.status)) {
      return jsonResponse(409, { error: "This assessment has not been paid for yet" });
    }

    if (submission.status === "paid") {
      await supabase
        .from("advisor_landing_submissions")
        .update({ status: "assessment_started" })
        .eq("id", submission.id);
    }

    return jsonResponse(200, {
      submission: {
        id: submission.id,
        guestName: submission.guest_name,
        assessmentType: submission.assessment_type,
        status: submission.status === "paid" ? "assessment_started" : submission.status,
        advisorName: submission.advisor?.name ?? null,
        landingPageTitle: submission.landing_page?.title ?? null,
      },
    });
  } catch (error) {
    console.error("get-advisor-assessment-session error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
});
