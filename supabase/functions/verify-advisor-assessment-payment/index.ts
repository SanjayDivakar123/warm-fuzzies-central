import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  ADVISOR_COMMISSION_RATE,
  advisorCorsHeaders,
  createServiceClient,
  getStripe,
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
    const { sessionId } = await req.json();
    if (!sessionId) {
      return jsonResponse(400, { error: "sessionId is required" });
    }

    const supabase = createServiceClient();
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(String(sessionId));

    if (session.payment_status !== "paid") {
      return jsonResponse(402, { error: "Payment is not complete yet", paymentStatus: session.payment_status });
    }

    const { data: submission, error: submissionError } = await supabase
      .from("advisor_landing_submissions")
      .select("*, advisor:advisors(*), landing_page:advisor_landing_pages(*)")
      .eq("stripe_checkout_session_id", session.id)
      .single();

    if (submissionError) throw submissionError;

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    const { data: updatedSubmission, error: updateError } = await supabase
      .from("advisor_landing_submissions")
      .update({
        status: submission.status === "completed" ? "completed" : "paid",
        stripe_payment_intent_id: paymentIntentId,
      })
      .eq("id", submission.id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    const commissionPercent =
      Number(submission.commission_percent) ||
      Number(submission.landing_page?.commission_percent) ||
      Math.round(ADVISOR_COMMISSION_RATE * 100);
    const commissionRate = Math.min(1, Math.max(0, commissionPercent / 100));
    const commissionAmountMinor = Math.round(submission.discounted_amount_minor * commissionRate);
    await supabase
      .from("advisor_commissions")
      .upsert({
        submission_id: submission.id,
        advisor_id: submission.advisor_id,
        currency: submission.currency,
        payment_amount_minor: submission.discounted_amount_minor,
        commission_rate: commissionRate,
        commission_amount_minor: commissionAmountMinor,
        stripe_connect_account_id: submission.advisor?.stripe_connect_account_id ?? null,
        status: submission.advisor?.stripe_connect_account_id ? "pending" : "held",
      }, { onConflict: "submission_id" });

    return jsonResponse(200, {
      assessmentToken: updatedSubmission.assessment_token,
      assessmentType: updatedSubmission.assessment_type,
      submissionId: updatedSubmission.id,
      redirectPath: `/advisor/assessment/${updatedSubmission.assessment_token}`,
    });
  } catch (error) {
    console.error("verify-advisor-assessment-payment error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
});
