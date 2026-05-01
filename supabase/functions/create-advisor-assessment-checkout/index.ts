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
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const guestPassword = String(body.guestPassword || "");
    const accessCode = String(body.accessCode || "").trim();

    if (!slug || !guestName || !guestEmail || !guestPassword) {
      return jsonResponse(400, { error: "Landing page, full name, email, password, and advisor code are required" });
    }
    if (guestPassword.length < 8) {
      return jsonResponse(400, { error: "Password must be at least 8 characters." });
    }

    const supabase = createServiceClient();
    const { data: page, error: pageError } = await supabase
      .from("advisor_landing_pages")
      .select("*, advisor:advisors(*)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (pageError) throw pageError;
    const advisorAccessCode = String(page.advisor?.active_access_code || "").trim();
    const advisorCodeStatus = String(page.advisor?.access_code_status || "inactive");
    if (!advisorAccessCode || advisorCodeStatus !== "active" || accessCode !== advisorAccessCode) {
      return jsonResponse(403, { error: "Code not active or already used, please speak to your advisor for a new code." });
    }

    const assessmentType = page.assessment_type as AssessmentType;
    const price = calculateAdvisorPrice(assessmentType, page.discount_percent, page.commission_percent);

    const { data: existingUserId, error: existingUserError } = await supabase.rpc("resolve_auth_user_id_by_email", {
      _email: guestEmail,
    });
    if (existingUserError) {
      console.warn("Could not resolve existing auth user by email:", existingUserError.message);
    }
    let guestUserId: string;

    if (existingUserId) {
      const authClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      );
      const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
        email: guestEmail,
        password: guestPassword,
      });
      if (signInError || !signInData?.user?.id) {
        return jsonResponse(401, {
          error: "This email already has an account. Enter the correct password to continue with advisor checkout.",
        });
      }
      guestUserId = signInData.user.id;
    } else {
      const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: guestEmail,
        password: guestPassword,
        email_confirm: true,
        user_metadata: {
          full_name: guestName,
          source: "advisor_landing_signup",
          advisor_id: page.advisor_id,
          landing_page_id: page.id,
        },
      });
      if (createUserError || !createdUser?.user?.id) {
        throw createUserError || new Error("Unable to create account for this email.");
      }
      guestUserId = createdUser.user.id;
    }

    await supabase
      .from("profiles")
      .upsert(
        {
          user_id: guestUserId,
          full_name: guestName,
          email: guestEmail,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    const { data: submission, error: submissionError } = await supabase
      .from("advisor_landing_submissions")
      .insert({
        landing_page_id: page.id,
        advisor_id: page.advisor_id,
        guest_user_id: guestUserId,
        guest_name: guestName,
        guest_email: guestEmail,
        assessment_type: assessmentType,
        status: "checkout_started",
        currency: price.currency,
        original_amount_minor: price.originalAmountMinor,
        discounted_amount_minor: price.discountedAmountMinor,
        discount_percent: price.discountPercent,
        commission_percent: price.commissionPercent,
        access_code_used: advisorAccessCode,
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
        commission_rate: String(price.commissionRate),
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
