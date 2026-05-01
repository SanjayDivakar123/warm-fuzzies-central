import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  advisorCorsHeaders,
  calculateAdvisorPrice,
  createServiceClient,
  getOrigin,
  getStripe,
  jsonResponse,
  normalizeEmail,
  normalizeSlug,
  type AssessmentType,
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
    const slug = normalizeSlug(String(body.slug || ""));
    const guestName = String(body.guestName || "").trim();
    const guestEmail = normalizeEmail(body.guestEmail);

    if (!slug || !guestName || !guestEmail) {
      return jsonResponse(400, { error: "Landing page, guest name, and guest email are required" });
    }

    const supabase = createServiceClient();
    const { data: page, error: pageError } = await supabase
      .from("advisor_landing_pages")
      .select("*, advisor:advisors(*)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (pageError) throw pageError;

    const assessmentType = page.assessment_type as AssessmentType;
    const price = calculateAdvisorPrice(assessmentType, page.discount_percent);

    const { data: submission, error: submissionError } = await supabase
      .from("advisor_landing_submissions")
      .insert({
        landing_page_id: page.id,
        advisor_id: page.advisor_id,
        guest_name: guestName,
        guest_email: guestEmail,
        assessment_type: assessmentType,
        status: "checkout_started",
        currency: price.currency,
        original_amount_minor: price.originalAmountMinor,
        discounted_amount_minor: price.discountedAmountMinor,
        discount_percent: price.discountPercent,
      })
      .select("*")
      .single();

    if (submissionError) throw submissionError;

    const stripe = getStripe();
    const origin = getOrigin(req);
    const session = await stripe.checkout.sessions.create({
      customer_email: guestEmail,
      line_items: [
        {
          price_data: {
            currency: price.currency,
            product_data: {
              name: `${price.product.name} - Advisor Discount`,
              description: `${price.discountPercent}% discount through ${page.advisor?.name || "your advisor"}`,
            },
            unit_amount: price.discountedAmountMinor,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/advisor-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/advisor/${page.slug}`,
      metadata: {
        flow: "advisor_landing_page",
        submission_id: submission.id,
        landing_page_id: page.id,
        advisor_id: page.advisor_id,
        assessment_type: assessmentType,
        commission_rate: "0.15",
      },
    });

    const { error: updateError } = await supabase
      .from("advisor_landing_submissions")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", submission.id);

    if (updateError) throw updateError;

    return jsonResponse(200, {
      url: session.url,
      sessionId: session.id,
      submissionId: submission.id,
    });
  } catch (error) {
    console.error("create-advisor-assessment-checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
});
