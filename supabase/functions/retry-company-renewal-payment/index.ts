import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  getNextRenewalAt,
  resolveStripeCustomerAndDefaultPaymentMethod,
  toMoney,
} from "../_shared/companyPortalBilling.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MANAGEMENT_ROLES = ["admin", "hr", "partner"] as const;

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecret = Deno.env.get("STRIPE_SECRET");
    if (!stripeSecret) return jsonResponse({ error: "Stripe is not configured" }, 500);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) return jsonResponse({ error: "Invalid token" }, 401);

    const body = await req.json();
    const companyId = (body?.company_id || "").toString();
    if (!companyId) return jsonResponse({ error: "company_id is required" }, 400);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    const { data: companyUser, error: companyUserError } = await supabase
      .from("company_users")
      .select("role, status")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .single();

    if (
      companyUserError ||
      !companyUser ||
      companyUser.status !== "active" ||
      !MANAGEMENT_ROLES.includes(companyUser.role)
    ) {
      return jsonResponse({ error: "Forbidden: You must be an active management user for this company" }, 403);
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, admin_email, created_at, stripe_customer_id, credit_balance, portal_access_locked, portal_access_outstanding_balance, portal_billing_anchor_at, portal_billing_next_renewal_at")
      .eq("id", companyId)
      .single();

    if (companyError || !company) return jsonResponse({ error: "Company not found" }, 404);

    const outstandingBalance = toMoney(Number(company.portal_access_outstanding_balance || 0));
    const currentCreditBalance = toMoney(Number(company.credit_balance || 0));

    if (!company.portal_access_locked || outstandingBalance <= 0) {
      await supabase
        .from("companies")
        .update({
          portal_access_locked: false,
          portal_access_lock_reason: null,
          portal_access_locked_at: null,
          portal_access_outstanding_balance: 0,
        })
        .eq("id", companyId);

      return jsonResponse({ success: true, resolved: true, cardCharged: 0, creditsApplied: 0, remainingOutstanding: 0 });
    }

    const { data: failedPeriod } = await supabase
      .from("company_portal_billing_periods")
      .select("id, period_end, credits_applied, card_charged, outstanding_balance, attempt_count")
      .eq("company_id", companyId)
      .eq("status", "failed")
      .order("renewal_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!failedPeriod) {
      return jsonResponse({ error: "No failed renewal period was found for this company." }, 409);
    }

    let creditsApplied = 0;
    let cardCharged = 0;
    let paymentIntentId: string | null = null;
    let remainingOutstanding = outstandingBalance;

    const persistFailedAttempt = async (failureReason?: string) => {
      await supabase
        .from("company_portal_billing_periods")
        .update({
          credits_applied: toMoney(Number(failedPeriod.credits_applied || 0) + creditsApplied),
          card_charged: toMoney(Number(failedPeriod.card_charged || 0) + cardCharged),
          outstanding_balance: remainingOutstanding,
          failure_reason: failureReason ?? null,
          updated_at: new Date().toISOString(),
          attempt_count: Number(failedPeriod.attempt_count || 0) + 1,
          stripe_payment_intent_id: paymentIntentId,
        })
        .eq("id", failedPeriod.id);
    };

    if (currentCreditBalance > 0) {
      creditsApplied = toMoney(Math.min(currentCreditBalance, remainingOutstanding));
      remainingOutstanding = toMoney(remainingOutstanding - creditsApplied);

      const newCreditBalance = toMoney(currentCreditBalance - creditsApplied);
      const { error: creditUpdateError } = await supabase
        .from("companies")
        .update({ credit_balance: newCreditBalance })
        .eq("id", companyId);

      if (creditUpdateError) throw creditUpdateError;

      if (creditsApplied > 0) {
        await supabase.from("billing_transactions").insert({
          company_id: companyId,
          billing_period_id: failedPeriod.id,
          type: "monthly_billing_credits",
          amount: -creditsApplied,
          description: "Applied billing credits to outstanding portal renewal balance",
        });
      }
    }

    if (remainingOutstanding > 0) {
      const { customerId, defaultPaymentMethodId } = await resolveStripeCustomerAndDefaultPaymentMethod(stripe, supabase, {
        id: company.id,
        admin_email: company.admin_email,
        stripe_customer_id: company.stripe_customer_id,
      });

      if (!customerId || !defaultPaymentMethodId) {
        await supabase
          .from("companies")
          .update({ portal_access_outstanding_balance: remainingOutstanding })
          .eq("id", companyId);
        await persistFailedAttempt("No payment method is on file for this company.");
        return jsonResponse({
          error: "No payment method is on file for this company.",
          errorCode: "NO_PAYMENT_METHOD",
          creditsApplied,
          remainingOutstanding,
        }, 402);
      }

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(remainingOutstanding * 100),
          currency: "usd",
          customer: customerId,
          payment_method: defaultPaymentMethodId,
          off_session: true,
          confirm: true,
          description: `Outstanding portal renewal charge for ${company.name}`,
          metadata: {
            company_id: company.id,
            type: "monthly_billing_recovery",
            billing_period_id: failedPeriod.id,
          },
        }, {
          idempotencyKey: `portal-recovery-${company.id}-${failedPeriod.id}`,
        });

        paymentIntentId = paymentIntent.id;

        if (paymentIntent.status !== "succeeded") {
          await supabase
            .from("companies")
            .update({ portal_access_outstanding_balance: remainingOutstanding })
            .eq("id", companyId);
          await persistFailedAttempt(`Payment failed with status ${paymentIntent.status}`);
          return jsonResponse({
            error: `Payment failed with status ${paymentIntent.status}`,
            errorCode: "CHARGE_FAILED",
            creditsApplied,
            remainingOutstanding,
          }, 402);
        }

        cardCharged = remainingOutstanding;
        remainingOutstanding = 0;

        await supabase.from("billing_transactions").insert({
          company_id: companyId,
          billing_period_id: failedPeriod.id,
          type: "monthly_billing_card",
          amount: cardCharged,
          stripe_payment_intent_id: paymentIntent.id,
          description: "Recovered outstanding portal renewal charge",
        });
      } catch (paymentError: any) {
        await supabase
          .from("companies")
          .update({ portal_access_outstanding_balance: remainingOutstanding })
          .eq("id", companyId);
        const errorMessage = paymentError?.message || "Your card could not be charged.";
        await persistFailedAttempt(errorMessage);
        return jsonResponse({
          error: errorMessage,
          errorCode: "CHARGE_FAILED",
          creditsApplied,
          remainingOutstanding,
        }, 402);
      }
    }

    await supabase
      .from("companies")
      .update({
        portal_access_locked: false,
        portal_access_lock_reason: null,
        portal_access_locked_at: null,
        portal_access_outstanding_balance: 0,
        portal_billing_next_renewal_at: getNextRenewalAt(
          new Date(company.portal_billing_anchor_at || company.created_at),
          new Date(failedPeriod.period_end),
        ).toISOString(),
      })
      .eq("id", companyId);

    await supabase
      .from("company_portal_billing_periods")
      .update({
        status: "recovered",
        credits_applied: toMoney(Number(failedPeriod.credits_applied || 0) + creditsApplied),
        card_charged: toMoney(Number(failedPeriod.card_charged || 0) + cardCharged),
        outstanding_balance: 0,
        stripe_payment_intent_id: paymentIntentId,
        failure_reason: null,
        recovered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attempt_count: Number(failedPeriod.attempt_count || 0) + 1,
      })
      .eq("id", failedPeriod.id);

    return jsonResponse({
      success: true,
      resolved: true,
      creditsApplied,
      cardCharged,
      remainingOutstanding: 0,
    });
  } catch (error) {
    console.error("Error retrying company renewal payment:", error);
    return jsonResponse({ error: (error as Error)?.message || "Unexpected error" }, 500);
  }
});