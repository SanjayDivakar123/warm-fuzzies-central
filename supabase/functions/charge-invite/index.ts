import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHARGE_AMOUNT = 2000; // $20.00 in cents

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHARGE-INVITE] ${step}${detailsStr}`);
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

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const { company_id } = body;

    if (!company_id) throw new Error("company_id is required");

    // Verify user is admin for this company
    const { data: companyUser, error: cuError } = await supabase
      .from("company_users")
      .select("role, status")
      .eq("company_id", company_id)
      .eq("user_id", user.id)
      .single();

    if (cuError || !companyUser || companyUser.role !== "admin" || companyUser.status !== "active") {
      throw new Error("User is not an admin for this company");
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, admin_email, credit_balance, stripe_customer_id")
      .eq("id", company_id)
      .single();

    if (companyError || !company) throw new Error("Company not found");

    logStep("Company found", { companyId: company.id, name: company.name, creditBalance: company.credit_balance });

    // Check if company is unlimited (RoleColorFinderLLC)
    if (company.name === "RoleColorFinderLLC") {
      logStep("Unlimited company - no charge required");
      return new Response(JSON.stringify({ 
        success: true, 
        charged: false, 
        usedCredits: false,
        message: "Unlimited company - no charge" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const creditBalance = company.credit_balance || 0;
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if we can use credits
    if (creditBalance >= CHARGE_AMOUNT) {
      logStep("Using credit balance", { creditBalance, chargeAmount: CHARGE_AMOUNT });

      // Deduct from credit balance
      const newBalance = creditBalance - CHARGE_AMOUNT;
      const { error: updateError } = await supabase
        .from("companies")
        .update({ credit_balance: newBalance })
        .eq("id", company_id);

      if (updateError) throw new Error("Failed to deduct credits");

      // Record transaction
      await supabase.from("billing_transactions").insert({
        company_id: company_id,
        type: "credit_usage",
        amount: -CHARGE_AMOUNT,
        description: "Seat charge - used billing credits"
      });

      logStep("Credits used successfully", { newBalance });

      return new Response(JSON.stringify({ 
        success: true, 
        charged: false, 
        usedCredits: true,
        creditsUsed: CHARGE_AMOUNT,
        newBalance 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Need to charge via Stripe
    logStep("Charging via Stripe");

    // Get or create Stripe customer
    let customerId = company.stripe_customer_id;

    if (!customerId) {
      // Check if customer exists by email
      const customers = await stripe.customers.list({ email: company.admin_email, limit: 1 });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId });
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: company.admin_email,
          name: company.name,
          metadata: { company_id: company.id }
        });
        customerId = customer.id;
        logStep("Created new Stripe customer", { customerId });
      }

      // Save customer ID to company
      await supabase
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", company_id);
    }

    // Check if customer has a payment method
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    if (paymentMethods.data.length === 0) {
      logStep("No payment method on file");
      return new Response(JSON.stringify({ 
        success: false, 
        needsPaymentMethod: true,
        message: "No payment method on file. Please add a payment method first." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const defaultPaymentMethod = paymentMethods.data[0].id;
    logStep("Payment method found", { paymentMethodId: defaultPaymentMethod });

    // Create and confirm payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: CHARGE_AMOUNT,
      currency: "usd",
      customer: customerId,
      payment_method: defaultPaymentMethod,
      off_session: true,
      confirm: true,
      description: `Seat charge for ${company.name}`,
      metadata: {
        company_id: company.id,
        type: "seat_charge"
      }
    });

    logStep("Payment intent created", { paymentIntentId: paymentIntent.id, status: paymentIntent.status });

    if (paymentIntent.status !== "succeeded") {
      throw new Error(`Payment failed with status: ${paymentIntent.status}`);
    }

    // Record transaction
    await supabase.from("billing_transactions").insert({
      company_id: company_id,
      type: "seat_charge",
      amount: CHARGE_AMOUNT,
      stripe_payment_intent_id: paymentIntent.id,
      description: "Seat charge - card payment"
    });

    logStep("Charge successful");

    return new Response(JSON.stringify({ 
      success: true, 
      charged: true, 
      usedCredits: false,
      amountCharged: CHARGE_AMOUNT,
      paymentIntentId: paymentIntent.id 
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
