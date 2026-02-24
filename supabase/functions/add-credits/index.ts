import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof str === "string" && uuidRegex.test(str);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { company_id, amount, charge_amount, promo_code } = body;

    // Validate inputs
    if (!company_id || !isValidUUID(company_id)) {
      return new Response(JSON.stringify({ error: "Invalid company ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (
      charge_amount !== undefined &&
      (typeof charge_amount !== "number" || charge_amount < 0 || charge_amount > amount)
    ) {
      return new Response(JSON.stringify({ error: "Invalid charge amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Adding credits:", { company_id, amount, user_id: user.id });

    // Create service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is a company admin
    const { data: adminCheck, error: adminError } = await supabase
      .from("company_users")
      .select("role")
      .eq("company_id", company_id)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .eq("status", "active")
      .maybeSingle();

    if (adminError || !adminCheck) {
      return new Response(JSON.stringify({ error: "Forbidden: You must be a company admin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current balance + Stripe metadata
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, admin_email, credit_balance, stripe_customer_id")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chargeAmount = Number(((charge_amount ?? amount) as number).toFixed(2));
    const creditAmount = Number((amount as number).toFixed(2));
    const promoSuffix = promo_code ? ` (Promo: ${promo_code})` : "";

    let chargedPaymentIntentId: string | null = null;
    if (chargeAmount > 0) {
      const stripeSecret = Deno.env.get("STRIPE_SECRET");
      if (!stripeSecret) {
        return new Response(JSON.stringify({ error: "Stripe is not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      if (paymentMethods.data.length === 0) {
        return new Response(JSON.stringify({ error: "No payment method on file" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(chargeAmount * 100),
        currency: "usd",
        customer: customerId,
        payment_method: paymentMethods.data[0].id,
        off_session: true,
        confirm: true,
        description: `Wallet credit purchase for ${company.name}: $${chargeAmount.toFixed(2)}`,
        metadata: {
          company_id: company.id,
          type: "wallet_credit_purchase",
          credits_added: creditAmount.toFixed(2),
        },
      });

      if (paymentIntent.status !== "succeeded") {
        return new Response(JSON.stringify({ error: `Payment failed with status ${paymentIntent.status}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

    return new Response(
      JSON.stringify({
        success: true,
        previousBalance: company.credit_balance || 0,
        amountAdded: creditAmount,
        chargeAmount,
        chargedPaymentIntentId,
        newBalance,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
