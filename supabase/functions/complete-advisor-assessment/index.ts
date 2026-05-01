import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  advisorCorsHeaders,
  buildResultSummary,
  createServiceClient,
  formatMoney,
  getOrigin,
  getStripe,
  jsonResponse,
  sendMailgunEmail,
} from "../_shared/advisorLanding.ts";

const sendResultEmails = async (params: {
  advisorEmail: string;
  advisorName: string;
  guestEmail: string;
  guestName: string;
  assessmentType: string;
  resultSummary: Record<string, unknown>;
  advisorResultUrl: string;
  guestResultUrl: string;
}) => {
  const dominantColor = String(params.resultSummary.dominantColor || "Not available");
  const secondaryColor = String(params.resultSummary.secondaryColor || "Not available");

  const advisorHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>${params.guestName} completed an assessment</h2>
      <p>${params.guestName} completed the ${params.assessmentType} Role Color assessment through your advisor landing page.</p>
      <p><strong>Dominant color:</strong> ${dominantColor}<br><strong>Secondary color:</strong> ${secondaryColor}</p>
      <p><a href="${params.advisorResultUrl}">Sign in to view the full result</a></p>
    </div>
  `;

  const guestHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Your Role Color assessment is complete</h2>
      <p>Thanks, ${params.guestName}. Your results were sent to ${params.advisorName}, and you can view your own result below.</p>
      <p><strong>Dominant color:</strong> ${dominantColor}<br><strong>Secondary color:</strong> ${secondaryColor}</p>
      <p><a href="${params.guestResultUrl}">View your result</a></p>
    </div>
  `;

  const [advisorResult, guestResult] = await Promise.allSettled([
    sendMailgunEmail({
      to: params.advisorEmail,
      subject: `${params.guestName}'s Role Color results are ready`,
      html: advisorHtml,
    }),
    sendMailgunEmail({
      to: params.guestEmail,
      subject: "Your Role Color assessment results",
      html: guestHtml,
    }),
  ]);

  if (advisorResult.status === "rejected") {
    console.error("Advisor result email failed:", advisorResult.reason);
  }
  if (guestResult.status === "rejected") {
    console.error("Guest result email failed:", guestResult.reason);
  }

  return {
    advisorSent: advisorResult.status === "fulfilled",
    guestSent: guestResult.status === "fulfilled",
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: advisorCorsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const body = await req.json();
    const assessmentToken = String(body.assessmentToken || "");
    const results = body.results as Record<string, unknown>;

    if (!assessmentToken || !results) {
      return jsonResponse(400, { error: "assessmentToken and results are required" });
    }

    const supabase = createServiceClient();
    const { data: submission, error: submissionError } = await supabase
      .from("advisor_landing_submissions")
      .select("*, advisor:advisors(*), landing_page:advisor_landing_pages(*)")
      .eq("assessment_token", assessmentToken)
      .single();

    if (submissionError) throw submissionError;

    if (!["paid", "assessment_started", "completed"].includes(submission.status)) {
      return jsonResponse(409, { error: "Submission has not been paid" });
    }

    const resultSummary = buildResultSummary(results);
    const now = new Date().toISOString();
    const origin = getOrigin(req);
    const guestResultUrl = `${origin}/advisor/results/${submission.guest_result_token}`;
    const advisorResultUrl = `${origin}/advisor-portal?submission=${submission.id}`;

    const { advisorSent, guestSent } = await sendResultEmails({
      advisorEmail: submission.advisor.email,
      advisorName: submission.advisor.name,
      guestEmail: submission.guest_email,
      guestName: submission.guest_name,
      assessmentType: submission.assessment_type,
      resultSummary,
      advisorResultUrl,
      guestResultUrl,
    });

    const { data: updatedSubmission, error: updateError } = await supabase
      .from("advisor_landing_submissions")
      .update({
        status: "completed",
        results,
        result_summary: resultSummary,
        completed_at: submission.completed_at || now,
        advisor_notified_at: advisorSent ? now : submission.advisor_notified_at,
        guest_notified_at: guestSent ? now : submission.guest_notified_at,
      })
      .eq("id", submission.id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    const { data: commission } = await supabase
      .from("advisor_commissions")
      .select("*")
      .eq("submission_id", submission.id)
      .maybeSingle();

    let transferStatus = commission?.status || "held";
    let transferId = commission?.stripe_transfer_id || null;
    let transferFailureMessage = commission?.failure_message || null;

    if (
      commission &&
      commission.status === "pending" &&
      submission.advisor?.stripe_connect_account_id &&
      submission.advisor?.payouts_enabled
    ) {
      try {
        const stripe = getStripe();
        const transfer = await stripe.transfers.create({
          amount: commission.commission_amount_minor,
          currency: commission.currency,
          destination: submission.advisor.stripe_connect_account_id,
          description: `Advisor commission for ${submission.guest_name}`,
          metadata: {
            advisor_id: submission.advisor_id,
            submission_id: submission.id,
            landing_page_id: submission.landing_page_id,
          },
        });
        transferStatus = "transfer_created";
        transferId = transfer.id;
        transferFailureMessage = null;
      } catch (transferError) {
        console.error("Advisor commission transfer failed:", transferError);
        transferStatus = "failed";
        transferFailureMessage = transferError instanceof Error ? transferError.message : "Transfer failed";
      }
    }

    if (commission) {
      await supabase
        .from("advisor_commissions")
        .update({
          status: transferStatus,
          stripe_transfer_id: transferId,
          failure_message: transferFailureMessage,
        })
        .eq("id", commission.id);
    }

    return jsonResponse(200, {
      submission: updatedSubmission,
      guestResultUrl,
      advisorResultUrl,
      transferStatus,
      transferId,
      message: `Results were sent to ${submission.advisor.name}. Your result link was sent to ${submission.guest_email}.`,
      commissionFormatted: commission ? formatMoney(commission.commission_amount_minor, commission.currency) : null,
    });
  } catch (error) {
    console.error("complete-advisor-assessment error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
});
