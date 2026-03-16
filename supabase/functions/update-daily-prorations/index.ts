import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  MONTHLY_RATE_DOLLARS,
  getNextRenewalAt,
  getProrationAmountCents,
  isUnlimitedCompany,
  resolveStripeCustomerAndDefaultPaymentMethod,
  toMoney,
} from "../_shared/companyPortalBilling.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MONTHLY_RATE_CENTS = Math.round(MONTHLY_RATE_DOLLARS * 100);

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[DAILY-PRORATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const now = new Date();
    const todayUtc = now.toISOString().slice(0, 10);

    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, name, admin_email, created_at, credit_balance, stripe_customer_id, portal_billing_anchor_at, portal_billing_next_renewal_at");

    if (companiesError) throw new Error(`Failed to fetch companies: ${companiesError.message}`);

    let adjustedUsers = 0;
    let skippedUsers = 0;
    let failedUsers = 0;

    for (const company of companies || []) {
      if (isUnlimitedCompany(company.name)) {
        continue;
      }

      const anchorAt = new Date(company.portal_billing_anchor_at || company.created_at);
      const rawRenewal = company.portal_billing_next_renewal_at ? new Date(company.portal_billing_next_renewal_at) : null;
      const hasValidFutureRenewal = !!rawRenewal && !Number.isNaN(rawRenewal.getTime()) && rawRenewal.getTime() > now.getTime();
      const nextRenewalAt = hasValidFutureRenewal ? rawRenewal : getNextRenewalAt(anchorAt, now);

      if (!hasValidFutureRenewal) {
        await supabase
          .from("companies")
          .update({
            portal_billing_anchor_at: anchorAt.toISOString(),
            portal_billing_next_renewal_at: nextRenewalAt.toISOString(),
          })
          .eq("id", company.id);
      }

      const { data: usersToAdjust, error: usersError } = await supabase
        .from("company_users")
        .select("id, charged_at, charge_amount, proration_last_adjusted_on")
        .eq("company_id", company.id)
        .neq("status", "revoked")
        .gt("charge_amount", 0)
        .or(`proration_last_adjusted_on.is.null,proration_last_adjusted_on.lt.${todayUtc}`);

      if (usersError) {
        failedUsers += 1;
        logStep("Failed to load company users for proration", { companyId: company.id, error: usersError.message });
        continue;
      }

      if (!usersToAdjust || usersToAdjust.length === 0) {
        continue;
      }

      let companyCreditBalance = toMoney(Number(company.credit_balance || 0));

      for (const user of usersToAdjust) {
        const currentAmountCents = Math.max(0, Math.round(Number(user.charge_amount || 0) * 100));
        const targetAmountCents = getProrationAmountCents(nextRenewalAt, now, MONTHLY_RATE_CENTS);

        if (targetAmountCents <= currentAmountCents) {
          await supabase
            .from("company_users")
            .update({ proration_last_adjusted_on: todayUtc })
            .eq("id", user.id);
          skippedUsers += 1;
          continue;
        }

        const deltaCents = targetAmountCents - currentAmountCents;
        let creditsUsedCents = 0;
        let cardChargedCents = deltaCents;

        if (companyCreditBalance > 0) {
          const creditBalanceCents = Math.round(companyCreditBalance * 100);
          creditsUsedCents = Math.min(creditBalanceCents, deltaCents);
          cardChargedCents = deltaCents - creditsUsedCents;

          const newBalance = toMoney(companyCreditBalance - creditsUsedCents / 100);
          const { error: creditUpdateError } = await supabase
            .from("companies")
            .update({ credit_balance: newBalance })
            .eq("id", company.id);

          if (creditUpdateError) {
            failedUsers += 1;
            logStep("Failed to apply credits", { companyId: company.id, userId: user.id, error: creditUpdateError.message });
            continue;
          }

          companyCreditBalance = newBalance;

          const { error: creditTxError } = await supabase.from("billing_transactions").insert({
            company_id: company.id,
            company_user_id: user.id,
            type: "credit_used",
            amount: -(creditsUsedCents / 100),
            description: `Daily proration adjustment credit offset ($${(creditsUsedCents / 100).toFixed(2)})`,
          });

          if (creditTxError) {
            failedUsers += 1;
            logStep("Failed to record credit transaction", { companyId: company.id, userId: user.id, error: creditTxError.message });
            continue;
          }
        }

        let paymentIntentId: string | null = null;

        if (cardChargedCents > 0) {
          const { customerId, defaultPaymentMethodId } = await resolveStripeCustomerAndDefaultPaymentMethod(stripe, supabase, {
            id: company.id,
            admin_email: company.admin_email,
            stripe_customer_id: company.stripe_customer_id,
          });

          if (!customerId || !defaultPaymentMethodId) {
            failedUsers += 1;
            logStep("No payment method for daily proration", { companyId: company.id, userId: user.id });
            continue;
          }

          try {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: cardChargedCents,
              currency: "usd",
              customer: customerId,
              payment_method: defaultPaymentMethodId,
              off_session: true,
              confirm: true,
              description: `Daily proration adjustment - ${company.name}`,
              metadata: {
                company_id: company.id,
                company_user_id: user.id,
                type: "daily_proration_adjustment",
                target_amount_cents: String(targetAmountCents),
                delta_amount_cents: String(deltaCents),
              },
            }, {
              idempotencyKey: `daily-proration-${company.id}-${user.id}-${todayUtc}`,
            });

            if (paymentIntent.status !== "succeeded") {
              failedUsers += 1;
              logStep("Daily proration payment not succeeded", { companyId: company.id, userId: user.id, status: paymentIntent.status });
              continue;
            }

            paymentIntentId = paymentIntent.id;
          } catch (paymentError) {
            failedUsers += 1;
            const message = paymentError instanceof Error ? paymentError.message : String(paymentError);
            logStep("Daily proration card charge failed", { companyId: company.id, userId: user.id, error: message });
            continue;
          }
        }

        const chargeAmountDollars = toMoney(deltaCents / 100);
        const { error: chargeTxError } = await supabase.from("billing_transactions").insert({
          company_id: company.id,
          company_user_id: user.id,
          type: "charge",
          amount: chargeAmountDollars,
          stripe_payment_intent_id: paymentIntentId,
          description: `Daily proration adjustment charge ($${chargeAmountDollars.toFixed(2)})`,
        });

        if (chargeTxError) {
          failedUsers += 1;
          logStep("Failed to record daily proration charge", { companyId: company.id, userId: user.id, error: chargeTxError.message });
          continue;
        }

        const { error: userUpdateError } = await supabase
          .from("company_users")
          .update({
            charge_amount: toMoney(targetAmountCents / 100),
            charged_at: user.charged_at || now.toISOString(),
            proration_last_adjusted_on: todayUtc,
          })
          .eq("id", user.id);

        if (userUpdateError) {
          failedUsers += 1;
          logStep("Failed to update company user daily proration fields", { companyId: company.id, userId: user.id, error: userUpdateError.message });
          continue;
        }

        adjustedUsers += 1;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      adjustedUsers,
      skippedUsers,
      failedUsers,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });

    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
