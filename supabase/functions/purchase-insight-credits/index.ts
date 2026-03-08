import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

const THREE_DECIMAL_CURRENCIES = new Set(["BHD", "JOD", "KWD", "OMR", "TND"]);

const STRIPE_ALLOWED_CURRENCIES = new Set([
  "aed", "aud", "bam", "bbd", "bdt", "bgn", "bnd", "bob", "brl", "bwp", "cad", "chf", "clp", "cny", "cop", "crc", "czk",
  "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "gbp", "gel", "ghs", "gtq", "gyd", "hkd", "hnl", "hrk", "huf", "idr",
  "ils", "inr", "isk", "jmd", "jpy", "kes", "krw", "kzt", "lak", "lkr", "mad", "mdl", "mnt", "mur", "mxn", "myr", "nad",
  "ngn", "nok", "npr", "nzd", "omr", "pen", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "sar", "scr", "sek",
  "sgd", "thb", "tnd", "try", "twd", "tzs", "uah", "ugx", "usd", "uyu", "vnd", "xaf", "xof", "zar", "zmw",
]);

const toMinorUnits = (amount: number, currency: string): number => {
  const code = currency.toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(code)) return Math.round(amount);
  if (THREE_DECIMAL_CURRENCIES.has(code)) return Math.round(amount * 1000);
  return Math.round(amount * 100);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase service configuration is missing");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const companyId = body?.company_id as string | undefined;
    const creditsRaw = body?.credits;
    const amountRaw = body?.amount_usd;
    const amountLocalRaw = body?.amount_local;
    const currencyRaw = body?.currency;
    const countryCodeRaw = body?.country_code;

    const credits = Number(creditsRaw);
    const amountUsd = Number(amountRaw);
    const amountLocal = Number(amountLocalRaw);
    const requestedCurrency = typeof currencyRaw === "string" ? currencyRaw.toLowerCase() : "usd";
    const chargeCurrency = STRIPE_ALLOWED_CURRENCIES.has(requestedCurrency) ? requestedCurrency : "usd";
    const countryCode = typeof countryCodeRaw === "string" ? countryCodeRaw.toUpperCase() : "US";

    if (!companyId) throw new Error("company_id is required");
    if (!Number.isFinite(credits) || credits <= 0) throw new Error("credits must be a positive number");
    if (!Number.isFinite(amountUsd) || amountUsd < 0) throw new Error("amount_usd must be a non-negative number");
    if (chargeCurrency !== "usd" && (!Number.isFinite(amountLocal) || amountLocal <= 0)) {
      throw new Error("amount_local must be a positive number for local-currency purchases");
    }

    const { data: companyUser, error: companyUserError } = await supabase
      .from("company_users")
      .select("role, status")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .single();

    if (
      companyUserError ||
      !companyUser ||
      companyUser.role !== "admin" ||
      companyUser.status !== "active"
    ) {
      throw new Error("User is not an admin for this company");
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, admin_email, insight_credits, credit_balance, stripe_customer_id")
      .eq("id", companyId)
      .single();
    if (companyError || !company) throw new Error("Company not found");

    const perCredit = amountUsd / credits;
    if (!Number.isFinite(perCredit) || perCredit <= 0) {
      throw new Error("Invalid pricing for insight credit purchase");
    }

    const roundedAmountUsd = Number(amountUsd.toFixed(2));
    const walletBalance = Number(company.credit_balance || 0);
    let chargedPaymentIntentId: string | null = null;
    let usedWallet = false;

    // Consume wallet credits first.
    if (walletBalance >= roundedAmountUsd) {
      const updatedBalance = Number((walletBalance - roundedAmountUsd).toFixed(2));
      const { error: walletError } = await supabase
        .from("companies")
        .update({ credit_balance: updatedBalance })
        .eq("id", companyId);
      if (walletError) throw new Error("Failed to apply wallet credits");
      usedWallet = true;
    } else {
      // Fall back to charging card on file.
      const stripeKey = Deno.env.get("STRIPE_SECRET");
      if (!stripeKey) throw new Error("STRIPE_SECRET is not configured");
      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

      let customerId = company.stripe_customer_id as string | null;
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

        const { error: customerUpdateError } = await supabase
          .from("companies")
          .update({ stripe_customer_id: customerId })
          .eq("id", companyId);
        if (customerUpdateError) throw new Error("Failed to save Stripe customer");
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });
      if (paymentMethods.data.length === 0) throw new Error("No payment method on file");

      const paymentIntent = await stripe.paymentIntents.create({
        amount: chargeCurrency === "usd"
          ? Math.round(roundedAmountUsd * 100)
          : toMinorUnits(amountLocal, chargeCurrency),
        currency: chargeCurrency,
        customer: customerId,
        payment_method: paymentMethods.data[0].id,
        off_session: true,
        confirm: true,
        description: `Purchased ${credits} extra insight credits for ${company.name} (${chargeCurrency.toUpperCase()})`,
        metadata: {
          company_id: company.id,
          type: "extra_insight_purchase",
          credits: String(credits),
          amount_usd: roundedAmountUsd.toString(),
          amount_local: Number.isFinite(amountLocal) ? amountLocal.toString() : "",
          currency: chargeCurrency.toUpperCase(),
          country_code: countryCode,
        },
      });

      if (paymentIntent.status !== "succeeded") {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
      }
      chargedPaymentIntentId = paymentIntent.id;
    }

    const currentCredits = Number(company.insight_credits || 0);
    const nextCredits = currentCredits + credits;

    const { error: updateError } = await supabase
      .from("companies")
      .update({ insight_credits: nextCredits })
      .eq("id", companyId);
    if (updateError) throw new Error("Failed to update insight credits");

    const { error: txError } = await supabase
      .from("billing_transactions")
      .insert({
        company_id: companyId,
        type: "extra_insight_purchase",
        amount: roundedAmountUsd,
        stripe_payment_intent_id: chargedPaymentIntentId,
        description: usedWallet
          ? `Purchased ${credits} extra insight credits using wallet balance`
          : `Purchased ${credits} extra insight credits charged to card on file`,
      });
    if (txError) throw new Error("Failed to log purchase transaction");

    return new Response(
      JSON.stringify({
        success: true,
        purchasedCredits: credits,
        remainingInsightCredits: nextCredits,
        amountCharged: roundedAmountUsd,
        chargedCurrency: chargeCurrency.toUpperCase(),
        chargedAmountLocal:
          chargeCurrency === "usd"
            ? roundedAmountUsd
            : (Number.isFinite(amountLocal) ? amountLocal : null),
        chargedVia: usedWallet ? "wallet" : "card",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
