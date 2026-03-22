import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof str === "string" && uuidRegex.test(str);
}

const ALLOWED_SUPER_ADMINS = new Set([
  "sanjay@rolecolorfinder.com",
  "tristan@rolecolorfinder.com",
  "aaron@rolecolor.com",
  "kody@rolecolor.com",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Verify user's JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    const callerEmail = (user.email || "").toLowerCase();
    if (!ALLOWED_SUPER_ADMINS.has(callerEmail)) {
      return jsonResponse({ error: "Forbidden: Only super admins can grant credits to companies" }, 403);
    }

    const body = await req.json();
    const { company_id, amount, charge_amount, promo_code } = body;

    // Validate inputs
    if (!company_id || !isValidUUID(company_id)) {
      return jsonResponse({ error: "Invalid company ID" }, 400);
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return jsonResponse({ error: "Invalid amount" }, 400);
    }

    if (
      charge_amount !== undefined &&
      (typeof charge_amount !== "number" || charge_amount < 0 || charge_amount > amount)
    ) {
      return jsonResponse({ error: "Invalid charge amount" }, 400);
    }

    console.log("Adding credits:", { company_id, amount, user_id: user.id });

    // Create service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current balance + Stripe metadata
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, admin_email, credit_balance, stripe_customer_id")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      return jsonResponse({ error: "Company not found" }, 404);
    }

    const chargeAmount = Number(((charge_amount ?? amount) as number).toFixed(2));
    const creditAmount = Number((amount as number).toFixed(2));
    const promoSuffix = promo_code ? ` (Promo: ${promo_code})` : "";

    let chargedPaymentIntentId: string | null = null;
    if (chargeAmount > 0) {
      const stripeSecret = Deno.env.get("STRIPE_SECRET");
      if (!stripeSecret) {
        return jsonResponse({ error: "Stripe is not configured" }, 500);
      }

      const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

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

        const { error: customerUpdateError } = await supabase
          .from("companies")
          .update({ stripe_customer_id: customerId })
          .eq("id", company_id);
        if (customerUpdateError) {
          throw customerUpdateError;
        }
      }

      const customer = await stripe.customers.retrieve(customerId, {
        expand: ["invoice_settings.default_payment_method"],
      });

      let paymentMethodId: string | null = null;
      if (!("deleted" in customer) && customer.invoice_settings?.default_payment_method) {
        const defaultPm = customer.invoice_settings.default_payment_method;
        paymentMethodId = typeof defaultPm === "string" ? defaultPm : defaultPm.id;
      }

      if (!paymentMethodId) {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customerId,
          type: "card",
        });
        paymentMethodId = paymentMethods.data[0]?.id ?? null;
      }

      if (!paymentMethodId) {
        return jsonResponse({ error: "No payment method on file", payment_failed: true }, 402);
      }

      let paymentIntent: Stripe.PaymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(chargeAmount * 100),
          currency: "usd",
          customer: customerId,
          payment_method: paymentMethodId,
          off_session: true,
          confirm: true,
          description: `Wallet credit purchase for ${company.name}: $${chargeAmount.toFixed(2)}`,
          metadata: {
            company_id: company.id,
            type: "wallet_credit_purchase",
            credits_added: creditAmount.toFixed(2),
          },
        });
      } catch (paymentError: any) {
        const declineCode = paymentError?.decline_code ? ` (${paymentError.decline_code})` : "";
        const providerMessage =
          paymentError?.message || "Card payment failed. Please update your payment method and try again.";
        return jsonResponse(
          {
            error: `${providerMessage}${declineCode}`,
            payment_failed: true,
          },
          402
        );
      }

      if (paymentIntent.status !== "succeeded") {
        return jsonResponse(
          { error: `Payment failed with status ${paymentIntent.status}`, payment_failed: true },
          402
        );
      }

      chargedPaymentIntentId = paymentIntent.id;
    }

    const newBalance = Number((Number(company.credit_balance || 0) + creditAmount).toFixed(2));

    // Update company credit balance
    const { error: updateError } = await supabase
      .from("companies")
      .update({ credit_balance: newBalance })
      .eq("id", company_id);

    if (updateError) {
      console.error("Error updating balance:", updateError);
      throw updateError;
    }

    // Log the credit addition in billing_credits (using service role to bypass RLS)
    const { error: creditLogError } = await supabase
      .from("billing_credits")
      .insert({
        company_id,
        amount: creditAmount,
        type: chargeAmount > 0 ? "payment" : "manual",
        description:
          chargeAmount > 0
            ? `Credit purchase: added $${creditAmount.toFixed(2)}, charged $${chargeAmount.toFixed(2)}${promoSuffix}`
            : `Free credits added: $${creditAmount.toFixed(2)}${promoSuffix}`,
        created_by: user.id,
      });

    if (creditLogError) {
      console.error("Error logging credit:", creditLogError);
      // Don't throw - the credit was added, logging failed
    }

    if (chargeAmount > 0) {
      const { error: txError } = await supabase
        .from("billing_transactions")
        .insert({
          company_id,
          amount: chargeAmount,
          type: "charge",
          stripe_payment_intent_id: chargedPaymentIntentId,
          description: `Wallet credit purchase charge: $${chargeAmount.toFixed(2)}`,
        });

      if (txError) {
        console.error("Error logging charge transaction:", txError);
      }
    }

    console.log("Credits added successfully. New balance:", newBalance);

    return jsonResponse({
      success: true,
      previousBalance: company.credit_balance || 0,
      amountAdded: creditAmount,
      chargeAmount,
      chargedPaymentIntentId,
      newBalance,
    });
  } catch (error) {
    console.error("Error:", error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
