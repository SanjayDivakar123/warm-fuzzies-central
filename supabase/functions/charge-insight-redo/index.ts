import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INSIGHT_REDO_PRICE_USD = 5; // $5.00
const INSIGHT_REDO_PRICE_CENTS = INSIGHT_REDO_PRICE_USD * 100;

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHARGE-INSIGHT-REDO] ${step}${detailsStr}`);
};

const getCurrentMonthUtc = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
};

const incrementInsightUsageCount = async (
  supabase: ReturnType<typeof createClient>,
  companyId: string,
) => {
  const currentMonth = getCurrentMonthUtc();
  const { data: usageRow, error: usageFetchError } = await supabase
    .from("companies")
    .select("insight_usage_count, insight_usage_month")
    .eq("id", companyId)
    .single();

  if (usageFetchError) {
    throw new Error("Failed to load current insight usage");
  }

  const existingCount =
    usageRow?.insight_usage_month === currentMonth
      ? Number(usageRow?.insight_usage_count || 0)
      : 0;

  const { error: usageUpdateError } = await supabase
    .from("companies")
    .update({
      insight_usage_count: existingCount + 1,
      insight_usage_month: currentMonth,
    })
    .eq("id", companyId);

  if (usageUpdateError) {
    throw new Error("Failed to update insight usage count");
  }
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { company_id } = body;
    if (!company_id) throw new Error("company_id is required");

    const { data: companyUser, error: cuError } = await supabase
      .from("company_users")
      .select("role, status")
      .eq("company_id", company_id)
      .eq("user_id", user.id)
      .single();

    if (cuError || !companyUser || companyUser.role !== "admin" || companyUser.status !== "active") {
      throw new Error("User is not an admin for this company");
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, admin_email, stripe_customer_id, insight_credits, credit_balance")
      .eq("id", company_id)
      .single();

    if (companyError || !company) throw new Error("Company not found");

    // Consume wallet credits first so company credit balance reflects each paid re-do.
    const availableWalletCredits = Number(company.credit_balance || 0);
    if (availableWalletCredits >= INSIGHT_REDO_PRICE_USD) {
      const updatedCreditBalance = Number(
        (availableWalletCredits - INSIGHT_REDO_PRICE_USD).toFixed(2)
      );

      const { error: walletUpdateError } = await supabase
        .from("companies")
        .update({ credit_balance: updatedCreditBalance })
        .eq("id", company_id);

      if (walletUpdateError) throw new Error("Failed to apply wallet credits");

      await supabase.from("billing_transactions").insert({
        company_id: company_id,
        type: "insight_redo_wallet",
        amount: INSIGHT_REDO_PRICE_USD,
        description: "Insight re-do charged to wallet credits ($5.00)",
      });

      await incrementInsightUsageCount(supabase, company_id);

      return new Response(JSON.stringify({
        success: true,
        charged: false,
        usedWalletCredits: true,
        remainingWalletCredits: updatedCreditBalance,
        amountCharged: INSIGHT_REDO_PRICE_USD,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fall back to purchased insight credits if wallet balance is not enough.
    if ((company.insight_credits || 0) > 0) {
      const newInsightCredits = (company.insight_credits || 0) - 1;
      const { error: updateError } = await supabase
        .from("companies")
        .update({ insight_credits: newInsightCredits })
        .eq("id", company_id);

      if (updateError) throw new Error("Failed to apply insight credit");

      await supabase.from("billing_transactions").insert({
        company_id: company_id,
        type: "insight_redo_credit",
        amount: 0,
        description: "Insight re-do paid using 1 purchased insight credit",
      });

      await incrementInsightUsageCount(supabase, company_id);

      return new Response(JSON.stringify({
        success: true,
        charged: false,
        usedCredits: true,
        remainingInsightCredits: newInsightCredits,
        amountCharged: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    let customerId = company.stripe_customer_id;

    if (!customerId) {
      const customers = await stripe.customers.list({ email: company.admin_email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: company.admin_email,
          name: company.name,
          metadata: { company_id: company.id },
        });
        customerId = customer.id;
      }

      await supabase
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", company_id);
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    if (paymentMethods.data.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        needsPaymentMethod: true,
        error: "No payment method on file",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const paymentMethodId = paymentMethods.data[0].id;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: INSIGHT_REDO_PRICE_CENTS,
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: `Insight re-do for ${company.name}`,
      metadata: {
        company_id: company.id,
        type: "insight_redo",
      },
    });

    if (paymentIntent.status !== "succeeded") {
      throw new Error(`Payment failed with status: ${paymentIntent.status}`);
    }

    await supabase.from("billing_transactions").insert({
      company_id: company_id,
      type: "insight_redo_card",
      amount: INSIGHT_REDO_PRICE_USD,
      stripe_payment_intent_id: paymentIntent.id,
      description: "Insight re-do charged to card on file ($5.00)",
    });

    await incrementInsightUsageCount(supabase, company_id);

    logStep("Charge succeeded", { companyId: company_id, paymentIntentId: paymentIntent.id });

    return new Response(JSON.stringify({
      success: true,
      charged: true,
      amountCharged: INSIGHT_REDO_PRICE_USD,
      paymentIntentId: paymentIntent.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
