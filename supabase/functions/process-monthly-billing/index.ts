import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  CORE_PLATFORM_MONTHLY_DOLLARS,
  HIRING_INTELLIGENCE_MONTHLY_DOLLARS,
  getActiveRoleScalingCharge,
  getOutcomeBasedCharge,
  getNextRenewalAt,
  getPreviousRenewalAt,
  isUnlimitedCompany,
  resolveStripeCustomerAndDefaultPaymentMethod,
  toMoney,
} from "../_shared/companyPortalBilling.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TRIAL_ASSESSMENT_PRICE_DOLLARS = 20;

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MONTHLY-BILLING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const now = new Date();
    const nowIso = now.toISOString();

    const clearPortalLock = async (companyId: string, nextRenewalAt?: string) => {
      const updatePayload: Record<string, unknown> = {
        portal_access_locked: false,
        portal_access_lock_reason: null,
        portal_access_locked_at: null,
        portal_access_outstanding_balance: 0,
      };

      if (nextRenewalAt) {
        updatePayload.portal_billing_next_renewal_at = nextRenewalAt;
      }

      await supabase
        .from("companies")
        .update(updatePayload)
        .eq("id", companyId);
    };

    const setPortalLock = async (companyId: string, outstandingBalance: number, reason: string) => {
      await supabase
        .from("companies")
        .update({
          portal_access_locked: true,
          portal_access_lock_reason: reason,
          portal_access_locked_at: nowIso,
          portal_access_outstanding_balance: toMoney(outstandingBalance),
        })
        .eq("id", companyId);
    };

    const recordFailedPeriod = async (
      billingPeriodId: string,
      companyId: string,
      reason: string,
      outstandingBalance: number,
      creditsApplied: number,
      userCount: number,
      totalAmount: number,
    ) => {
      await supabase
        .from("company_portal_billing_periods")
        .update({
          status: "failed",
          billed_user_count: userCount,
          total_amount: totalAmount,
          credits_applied: creditsApplied,
          card_charged: 0,
          outstanding_balance: toMoney(outstandingBalance),
          failure_reason: reason,
          attempt_count: 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", billingPeriodId);

      await supabase.from("billing_transactions").insert({
        company_id: companyId,
        billing_period_id: billingPeriodId,
        type: "monthly_billing_failed",
        amount: toMoney(outstandingBalance),
        description: reason,
      });
    };

    // Get all companies with billing state. Exact-date gating happens per company below.
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, name, admin_email, created_at, seats_purchased, credit_balance, stripe_customer_id, portal_billing_anchor_at, portal_billing_next_renewal_at, portal_access_locked, portal_access_outstanding_balance, hiring_subscription_enabled, hiring_subscription_status, b2b_trial_enabled, b2b_trial_starts_at, b2b_trial_ends_at, b2b_trial_user_limit, b2b_trial_converted_at");

    if (companiesError) throw new Error(`Failed to fetch companies: ${companiesError.message}`);

    logStep("Found companies to process", { count: companies?.length || 0 });

    const results: Array<{
      companyId: string;
      companyName: string;
      activeUsers: number;
      totalCharge: number;
      creditsUsed: number;
      cardCharged: number;
      success: boolean;
      error?: string;
    }> = [];

    for (const company of companies || []) {
      let activeUsers = 0;
      let activeRoleCount = 0;
      let successfulHires = 0;
      let trialAssessedUserCount = 0;
      let trialUsageCharge = 0;
      let totalCharge = 0;
      let creditsUsed = 0;
      let cardCharged = 0;

      try {
        if (isUnlimitedCompany(company.name)) {
          results.push({
            companyId: company.id,
            companyName: company.name,
            activeUsers: 0,
            totalCharge: 0,
            creditsUsed: 0,
            cardCharged: 0,
            success: true,
          });
          continue;
        }

        logStep("Processing company", { companyId: company.id, name: company.name });

        const anchorAt = new Date(company.portal_billing_anchor_at || company.created_at);
        let nextRenewalAt = company.portal_billing_next_renewal_at
          ? new Date(company.portal_billing_next_renewal_at)
          : getNextRenewalAt(anchorAt, now);

        if (!company.portal_billing_anchor_at || !company.portal_billing_next_renewal_at) {
          await supabase
            .from("companies")
            .update({
              portal_billing_anchor_at: anchorAt.toISOString(),
              portal_billing_next_renewal_at: nextRenewalAt.toISOString(),
            })
            .eq("id", company.id);
        }

        if (nextRenewalAt.getTime() > now.getTime()) {
          results.push({
            companyId: company.id,
            companyName: company.name,
            activeUsers: 0,
            totalCharge: 0,
            creditsUsed: 0,
            cardCharged: 0,
            success: true,
          });
          continue;
        }

        const trialEndsAt = company.b2b_trial_ends_at ? new Date(company.b2b_trial_ends_at) : null;
        const trialIsActive = Boolean(
          company.b2b_trial_enabled &&
          trialEndsAt &&
          !Number.isNaN(trialEndsAt.getTime()) &&
          trialEndsAt.getTime() > now.getTime(),
        );

        if (trialIsActive) {
          const nextPeriodRenewalAt = getNextRenewalAt(anchorAt, nextRenewalAt);
          await clearPortalLock(company.id, nextPeriodRenewalAt.toISOString());
          await supabase
            .from("companies")
            .update({
              portal_billing_next_renewal_at: nextPeriodRenewalAt.toISOString(),
            })
            .eq("id", company.id);

          results.push({
            companyId: company.id,
            companyName: company.name,
            activeUsers: 0,
            totalCharge: 0,
            creditsUsed: 0,
            cardCharged: 0,
            success: true,
          });
          continue;
        }

        const periodStart = getPreviousRenewalAt(anchorAt, nextRenewalAt);
        const periodEndIso = nextRenewalAt.toISOString();
        const periodStartIso = periodStart.toISOString();
        const idempotencyKey = `portal-renewal-${company.id}-${periodEndIso}`;

        const { data: existingPeriod } = await supabase
          .from("company_portal_billing_periods")
          .select("id, status")
          .eq("company_id", company.id)
          .eq("period_start", periodStartIso)
          .eq("period_end", periodEndIso)
          .maybeSingle();

        if (existingPeriod?.status === "succeeded" || existingPeriod?.status === "recovered") {
          const nextPeriodRenewalAt = getNextRenewalAt(anchorAt, nextRenewalAt);
          await clearPortalLock(company.id, nextPeriodRenewalAt.toISOString());
          results.push({
            companyId: company.id,
            companyName: company.name,
            activeUsers: 0,
            totalCharge: 0,
            creditsUsed: 0,
            cardCharged: 0,
            success: true,
          });
          continue;
        }

        if (existingPeriod?.status === "failed" || existingPeriod?.status === "pending") {
          results.push({
            companyId: company.id,
            companyName: company.name,
            activeUsers: 0,
            totalCharge: 0,
            creditsUsed: 0,
            cardCharged: 0,
            success: false,
            error: existingPeriod.status === "failed"
              ? "Renewal already failed and is awaiting recovery"
              : "Renewal is already being processed",
          });
          continue;
        }

        const { data: insertedPeriods, error: insertPeriodError } = await supabase
          .from("company_portal_billing_periods")
          .insert({
            company_id: company.id,
            period_start: periodStartIso,
            period_end: periodEndIso,
            renewal_at: periodEndIso,
            status: "pending",
            idempotency_key: idempotencyKey,
            updated_at: nowIso,
          })
          .select("id")
          .single();

        if (insertPeriodError || !insertedPeriods) {
          throw new Error(`Failed to initialize billing period: ${insertPeriodError?.message || "Unknown error"}`);
        }

        const billingPeriodId = insertedPeriods.id;

        // Keep active user count for analytics/auditing.
        const { count: activeUserCount, error: countError } = await supabase
          .from("company_users")
          .select("*", { count: "exact", head: true })
          .eq("company_id", company.id)
          .neq("status", "revoked");

        if (countError) {
          logStep("Error counting users", { error: countError.message });
          await supabase
            .from("company_portal_billing_periods")
            .update({
              status: "failed",
              failure_reason: countError.message,
              updated_at: new Date().toISOString(),
              attempt_count: 1,
            })
            .eq("id", billingPeriodId);
          results.push({
            companyId: company.id,
            companyName: company.name,
            activeUsers: 0,
            totalCharge: 0,
            creditsUsed: 0,
            cardCharged: 0,
            success: false,
            error: countError.message
          });
          continue;
        }

        activeUsers = activeUserCount || 0;

        const { count: activeRoleResult, error: activeRoleError } = await supabase
          .from("job_postings")
          .select("*", { count: "exact", head: true })
          .eq("company_id", company.id)
          .eq("status", "open");

        if (activeRoleError) {
          throw new Error(`Failed to count active job roles: ${activeRoleError.message}`);
        }

        activeRoleCount = activeRoleResult || 0;

        const { count: successfulHireResult, error: successfulHireError } = await supabase
          .from("candidate_applications")
          .select("id, job_postings!inner(company_id)", { count: "exact", head: true })
          .eq("job_postings.company_id", company.id)
          .gte("hired_at", periodStartIso)
          .lt("hired_at", periodEndIso)
          .not("hired_at", "is", null);

        if (successfulHireError) {
          throw new Error(`Failed to count successful hires: ${successfulHireError.message}`);
        }

        successfulHires = successfulHireResult || 0;

        const trialHasEndedAndNeedsConversion = Boolean(
          company.b2b_trial_enabled &&
          trialEndsAt &&
          !Number.isNaN(trialEndsAt.getTime()) &&
          trialEndsAt.getTime() <= now.getTime() &&
          !company.b2b_trial_converted_at,
        );

        if (trialHasEndedAndNeedsConversion) {
          const { count: trialAssessedCount, error: trialAssessedError } = await supabase
            .from("company_users")
            .select("id", { count: "exact", head: true })
            .eq("company_id", company.id)
            .not("assessment_result_id", "is", null);

          if (trialAssessedError) {
            throw new Error(`Failed to count trial assessed users: ${trialAssessedError.message}`);
          }

          trialAssessedUserCount = trialAssessedCount || 0;
          trialUsageCharge = toMoney(trialAssessedUserCount * TRIAL_ASSESSMENT_PRICE_DOLLARS);
        }

        const hasHiringIntelligence = company.hiring_subscription_enabled &&
          ["active", "trialing", "admin_override"].includes(company.hiring_subscription_status || "");

        const coreCharge = CORE_PLATFORM_MONTHLY_DOLLARS;
        const hiringBaseCharge = hasHiringIntelligence ? HIRING_INTELLIGENCE_MONTHLY_DOLLARS : 0;
        const activeRoleScalingCharge = hasHiringIntelligence ? getActiveRoleScalingCharge(activeRoleCount) : 0;
        const outcomeBasedCharge = hasHiringIntelligence ? getOutcomeBasedCharge(successfulHires) : 0;

        totalCharge = toMoney(coreCharge + hiringBaseCharge + activeRoleScalingCharge + outcomeBasedCharge + trialUsageCharge);
        const creditBalance = toMoney(Number(company.credit_balance || 0));

        logStep("Calculating charges", { 
          activeUsers, 
          activeRoleCount,
          successfulHires,
          trialAssessedUserCount,
          trialUsageCharge,
          coreCharge,
          hiringBaseCharge,
          activeRoleScalingCharge,
          outcomeBasedCharge,
          totalCharge, 
          creditBalance 
        });

        // Use credits first
        if (creditBalance >= totalCharge) {
          creditsUsed = totalCharge;
          const newBalance = toMoney(creditBalance - totalCharge);
          
          await supabase
            .from("companies")
            .update({ credit_balance: newBalance })
            .eq("id", company.id);

          await supabase.from("billing_transactions").insert({
            company_id: company.id,
            billing_period_id: billingPeriodId,
            type: "monthly_billing_credits",
            amount: -totalCharge,
            description: `Portal renewal used credits (core: $${coreCharge.toFixed(2)}, hiring base: $${hiringBaseCharge.toFixed(2)}, scaling: $${activeRoleScalingCharge.toFixed(2)}, outcomes: $${outcomeBasedCharge.toFixed(2)}, trial conversion: $${trialUsageCharge.toFixed(2)})`
          });

          const nextPeriodRenewalAt = getNextRenewalAt(anchorAt, nextRenewalAt);
          await supabase
            .from("company_portal_billing_periods")
            .update({
              status: "succeeded",
              billed_user_count: activeUsers,
              total_amount: totalCharge,
              credits_applied: creditsUsed,
              card_charged: 0,
              outstanding_balance: 0,
              updated_at: new Date().toISOString(),
              attempt_count: 1,
            })
            .eq("id", billingPeriodId);

          await clearPortalLock(company.id, nextPeriodRenewalAt.toISOString());

          if (trialUsageCharge > 0 || (company.b2b_trial_enabled && !company.b2b_trial_converted_at)) {
            await supabase
              .from("companies")
              .update({
                b2b_trial_enabled: false,
                b2b_trial_converted_at: new Date().toISOString(),
              })
              .eq("id", company.id);
          }

          logStep("Charged via credits", { creditsUsed, newBalance });
        } else {
          if (creditBalance > 0) {
            creditsUsed = creditBalance;
            await supabase
              .from("companies")
              .update({ credit_balance: 0 })
              .eq("id", company.id);

            await supabase.from("billing_transactions").insert({
              company_id: company.id,
              billing_period_id: billingPeriodId,
              type: "monthly_billing_credits",
              amount: -creditBalance,
              description: `Portal renewal partial credit application`
            });
          }

          cardCharged = toMoney(totalCharge - creditsUsed);

          if (cardCharged > 0) {
            const { customerId, defaultPaymentMethodId } = await resolveStripeCustomerAndDefaultPaymentMethod(stripe, supabase, {
              id: company.id,
              admin_email: company.admin_email,
              stripe_customer_id: company.stripe_customer_id,
            });

            if (!customerId || !defaultPaymentMethodId) {
              const failureReason = "Monthly renewal failed because no payment method is on file.";
              logStep("No payment method on file", { companyId: company.id });
              await recordFailedPeriod(
                billingPeriodId,
                company.id,
                failureReason,
                cardCharged,
                creditsUsed,
                activeUsers,
                totalCharge,
              );
              await setPortalLock(company.id, cardCharged, failureReason);

              results.push({
                companyId: company.id,
                companyName: company.name,
                activeUsers,
                totalCharge,
                creditsUsed,
                cardCharged: 0,
                success: false,
                error: failureReason,
              });
              continue;
            }

            try {
              const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(cardCharged * 100),
                currency: "usd",
                customer: customerId,
                payment_method: defaultPaymentMethodId,
                off_session: true,
                confirm: true,
                description: `Portal renewal charge - ${company.name}`,
                metadata: {
                  company_id: company.id,
                  type: "portal_monthly_billing",
                  renewal_at: periodEndIso,
                  active_users: activeUsers.toString(),
                  active_roles: activeRoleCount.toString(),
                  successful_hires: successfulHires.toString(),
                  trial_conversion_assessed_users: trialAssessedUserCount.toString(),
                  trial_conversion_charge: trialUsageCharge.toFixed(2),
                },
              }, {
                idempotencyKey,
              });

              if (paymentIntent.status !== "succeeded") {
                const failureReason = `Monthly renewal payment failed with status ${paymentIntent.status}.`;
                await recordFailedPeriod(
                  billingPeriodId,
                  company.id,
                  failureReason,
                  cardCharged,
                  creditsUsed,
                  activeUsers,
                  totalCharge,
                );
                await setPortalLock(company.id, cardCharged, "Monthly renewal payment failed. Update the card on file or add credits to restore access.");
              
                results.push({
                  companyId: company.id,
                  companyName: company.name,
                  activeUsers,
                  totalCharge,
                  creditsUsed,
                  cardCharged: 0,
                  success: false,
                  error: failureReason,
                });
                continue;
              }

              await supabase.from("billing_transactions").insert({
                company_id: company.id,
                billing_period_id: billingPeriodId,
                type: "monthly_billing_card",
                amount: cardCharged,
                stripe_payment_intent_id: paymentIntent.id,
                description: `Portal renewal card charge (core: $${coreCharge.toFixed(2)}, hiring base: $${hiringBaseCharge.toFixed(2)}, scaling: $${activeRoleScalingCharge.toFixed(2)}, outcomes: $${outcomeBasedCharge.toFixed(2)}, trial conversion: $${trialUsageCharge.toFixed(2)})`,
              });

              const nextPeriodRenewalAt = getNextRenewalAt(anchorAt, nextRenewalAt);
              await supabase
                .from("company_portal_billing_periods")
                .update({
                  status: "succeeded",
                  billed_user_count: activeUsers,
                  total_amount: totalCharge,
                  credits_applied: creditsUsed,
                  card_charged: cardCharged,
                  outstanding_balance: 0,
                  stripe_payment_intent_id: paymentIntent.id,
                  failure_reason: null,
                  attempt_count: 1,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", billingPeriodId);

              await clearPortalLock(company.id, nextPeriodRenewalAt.toISOString());

              if (trialUsageCharge > 0 || (company.b2b_trial_enabled && !company.b2b_trial_converted_at)) {
                await supabase
                  .from("companies")
                  .update({
                    b2b_trial_enabled: false,
                    b2b_trial_converted_at: new Date().toISOString(),
                  })
                  .eq("id", company.id);
              }

              logStep("Charged via card", { cardCharged, paymentIntentId: paymentIntent.id });
            } catch (paymentError) {
              const paymentMessage = paymentError instanceof Error ? paymentError.message : String(paymentError);
              await recordFailedPeriod(
                billingPeriodId,
                company.id,
                `Monthly renewal failed - ${paymentMessage}`,
                cardCharged,
                creditsUsed,
                activeUsers,
                totalCharge,
              );
              await setPortalLock(company.id, cardCharged, "Monthly renewal payment failed. Update the card on file or add credits to restore access.");

              results.push({
                companyId: company.id,
                companyName: company.name,
                activeUsers,
                totalCharge,
                creditsUsed,
                cardCharged: 0,
                success: false,
                error: paymentMessage,
              });
              continue;
            }
          }
        }

        results.push({
          companyId: company.id,
          companyName: company.name,
          activeUsers,
          totalCharge,
          creditsUsed,
          cardCharged,
          success: true
        });

      } catch (companyError) {
        const errorMessage = companyError instanceof Error ? companyError.message : String(companyError);
        logStep("Error processing company", { companyId: company.id, error: errorMessage });
        if (cardCharged > 0) {
          await setPortalLock(company.id, cardCharged, "Monthly renewal payment failed. Update the card on file or add credits to restore access.");
        }
        
        results.push({
          companyId: company.id,
          companyName: company.name,
          activeUsers,
          totalCharge,
          creditsUsed,
          cardCharged: 0,
          success: false,
          error: errorMessage
        });
      }
    }

    logStep("Processing complete", { 
      totalCompanies: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    let dailyProrationRun: unknown = null;
    try {
      const dailyProrationResponse = await fetch(`${supabaseUrl}/functions/v1/update-daily-prorations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "apikey": supabaseServiceKey,
        },
        body: JSON.stringify({ trigger: "process-monthly-billing" }),
      });

      dailyProrationRun = await dailyProrationResponse.json().catch(() => ({
        success: false,
        error: "Failed to parse daily proration response",
      }));

      if (!dailyProrationResponse.ok) {
        logStep("Daily proration run failed", dailyProrationRun);
      } else {
        logStep("Daily proration run completed", dailyProrationRun);
      }
    } catch (dailyProrationError) {
      const message = dailyProrationError instanceof Error ? dailyProrationError.message : String(dailyProrationError);
      dailyProrationRun = { success: false, error: message };
      logStep("Daily proration run crashed", { error: message });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      dailyProrationRun,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});