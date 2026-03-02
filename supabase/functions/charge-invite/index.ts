import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MONTHLY_RATE_CENTS = 2000; // $20.00 per user per month

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHARGE-INVITE] ${step}${detailsStr}`);
};

// Calculate pro-rated amount based on days remaining in the month
function calculateProRatedAmount(): number {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysRemaining = endOfMonth.getDate() - now.getDate() + 1; // +1 to include today
  const daysInMonth = endOfMonth.getDate();
  
  const proRatedAmount = Math.round((daysRemaining / daysInMonth) * MONTHLY_RATE_CENTS);
  logStep("Pro-rated calculation", { daysRemaining, daysInMonth, proRatedAmount });
  
  return proRatedAmount;
}

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
      .select("id, name, admin_email, credit_balance, stripe_customer_id, seats_purchased")
      .eq("id", company_id)
      .single();

    if (companyError || !company) throw new Error("Company not found");

    logStep("Company found", { companyId: company.id, name: company.name, creditBalance: company.credit_balance, seatsPurchased: company.seats_purchased });

    // Check if company is unlimited (RoleColorFinderLLC)
    if (company.name === "RoleColorFinderLLC" || company.name === "RoleColorFinder LLC") {
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

    // Count current non-revoked users to see if we're still within pre-paid seats
    const { count: activeUserCount, error: countError } = await supabase
      .from("company_users")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company_id)
      .neq("status", "revoked");

    if (countError) throw new Error("Failed to count active users");

    const seatsPurchased = company.seats_purchased || 0;
    logStep("Seat check", { activeUserCount, seatsPurchased });

    // If the next user still fits within the pre-paid seat allocation, no charge needed.
    // seatsPurchased = 0 means no pre-paid seats configured; every invite proceeds to billing.
    if (seatsPurchased > 0 && (activeUserCount ?? 0) < seatsPurchased) {
      logStep("Within pre-paid seats - no charge required", { activeUserCount, seatsPurchased });
      return new Response(JSON.stringify({
        success: true,
        charged: false,
        usedCredits: false,
        withinPrePaidSeats: true,
        seatsUsed: activeUserCount ?? 0,
        seatsPurchased,
        message: `Within pre-paid seat allocation (${activeUserCount}/${seatsPurchased} seats used)`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Beyond pre-paid seats — will attempt charge", { activeUserCount, seatsPurchased });

    // Calculate pro-rated charge amount for new user (beyond pre-paid seats)
    const chargeAmount = calculateProRatedAmount(); // in cents, e.g. 2000 = $20.00
    // credit_balance is stored as dollars in the DB (e.g. 20.00 = $20.00)
    const creditBalanceDollars = typeof company.credit_balance === "number"
      ? company.credit_balance
      : parseFloat((company.credit_balance as unknown as string) ?? "0");
    const creditBalanceCents = Math.round(creditBalanceDollars * 100);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    logStep("Charge amount calculated", { chargeAmountCents: chargeAmount, creditBalanceDollars, creditBalanceCents });

    // Check if we can use credits (compare cents to cents)
    if (creditBalanceCents >= chargeAmount) {
      logStep("Using credit balance", { creditBalanceCents, chargeAmount });

      // Deduct from credit balance (stored as dollars)
      const newBalanceDollars = creditBalanceDollars - chargeAmount / 100;
      const { error: updateError } = await supabase
        .from("companies")
        .update({ credit_balance: newBalanceDollars })
        .eq("id", company_id);

      if (updateError) throw new Error("Failed to deduct credits");

      // Record transaction (amount in cents for consistency with other charge-invite transactions)
      await supabase.from("billing_transactions").insert({
        company_id: company_id,
        type: "user_addition_credits",
        amount: -chargeAmount,
        description: `Pro-rated user charge ($${(chargeAmount / 100).toFixed(2)}) - used billing credits`
      });

      logStep("Credits used successfully", { newBalanceDollars });

      return new Response(JSON.stringify({ 
        success: true, 
        charged: false, 
        usedCredits: true,
        creditsUsed: chargeAmount,
        newBalance: newBalanceDollars,
        proRatedAmount: chargeAmount
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Need to charge via Stripe (partial credits + card)
    logStep("Charging via Stripe");

    let creditsUsedCents = 0;
    let cardCharged = chargeAmount;

    // Use any available credits first (partial offset)
    if (creditBalanceCents > 0) {
      creditsUsedCents = creditBalanceCents;
      cardCharged = chargeAmount - creditBalanceCents;

      await supabase
        .from("companies")
        .update({ credit_balance: 0 })
        .eq("id", company_id);

      await supabase.from("billing_transactions").insert({
        company_id: company_id,
        type: "user_addition_credits",
        amount: -creditsUsedCents,
        description: `Pro-rated user charge - used remaining credits ($${(creditBalanceDollars).toFixed(2)})`
      });

      logStep("Used partial credits", { creditsUsedCents, cardCharged });
    }

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
        errorCode: "NEEDS_PAYMENT_METHOD",
        needsPaymentMethod: true,
        error: "No payment method on file. Please add a payment method in Settings before inviting users.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const defaultPaymentMethod = paymentMethods.data[0].id;
    logStep("Payment method found", { paymentMethodId: defaultPaymentMethod });

    // Create and confirm payment intent for remaining amount
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: cardCharged,
        currency: "usd",
        customer: customerId,
        payment_method: defaultPaymentMethod,
        off_session: true,
        confirm: true,
        description: `Pro-rated user charge for ${company.name}`,
        metadata: {
          company_id: company.id,
          type: "user_addition",
          pro_rated_amount: cardCharged.toString()
        }
      });
    } catch (stripeError: any) {
      // Stripe throws for card declines when off_session + confirm
      const declineCode = stripeError?.decline_code || stripeError?.code || "card_declined";
      logStep("Card declined by Stripe", { declineCode, message: stripeError?.message });
      return new Response(JSON.stringify({
        success: false,
        errorCode: "CARD_DECLINED",
        error: "Your card was declined. Please check your payment method in Settings.",
        declineCode,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Payment intent created", { paymentIntentId: paymentIntent.id, status: paymentIntent.status });

    if (paymentIntent.status !== "succeeded") {
      logStep("Payment not succeeded", { status: paymentIntent.status });
      return new Response(JSON.stringify({
        success: false,
        errorCode: "CARD_DECLINED",
        error: `Your card was declined. Please check your payment method in Settings.`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Record transaction
    await supabase.from("billing_transactions").insert({
      company_id: company_id,
      type: "user_addition_card",
      amount: cardCharged,
      stripe_payment_intent_id: paymentIntent.id,
      description: `Pro-rated user charge ($${(cardCharged / 100).toFixed(2)}) - card payment`
    });

    logStep("Charge successful");

    return new Response(JSON.stringify({ 
      success: true, 
      charged: true, 
      usedCredits: creditsUsedCents > 0,
      creditsUsed: creditsUsedCents,
      amountCharged: cardCharged,
      totalAmount: chargeAmount,
      proRatedAmount: chargeAmount,
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