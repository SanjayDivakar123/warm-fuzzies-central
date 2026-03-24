import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRIPE_ALLOWED_CURRENCIES = new Set([
  "aed", "aud", "bam", "bbd", "bdt", "bgn", "bnd", "bob", "brl", "bwp", "cad", "chf", "clp", "cny", "cop", "crc", "czk",
  "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "gbp", "gel", "ghs", "gtq", "gyd", "hkd", "hnl", "hrk", "huf", "idr",
  "ils", "inr", "isk", "jmd", "jpy", "kes", "krw", "kzt", "lak", "lkr", "mad", "mdl", "mnt", "mur", "mxn", "myr", "nad",
  "ngn", "nok", "npr", "nzd", "omr", "pen", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "sar", "scr", "sek",
  "sgd", "thb", "tnd", "try", "twd", "tzs", "uah", "ugx", "usd", "uyu", "vnd", "xaf", "xof", "zar", "zmw",
]);

const MIN_BILLABLE_SEATS = 2;
const DEPLOYMENT_FEE_CENTS = 500000;
const ONBOARDING_FEE_PER_EMPLOYEE_CENTS = 2000;
const CORE_PLATFORM_MONTHLY_DOLLARS = 500;
const HIRING_INTELLIGENCE_MONTHLY_DOLLARS = 1000;

serve(async (req) => {
  console.log("=== CREATE B2B PAYMENT FUNCTION STARTED ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request body:", body);
    
    const { 
      companyName, 
      adminEmail, 
      assessmentType, 
      userId,
      subdomain,
      successUrl, 
      cancelUrl,
    } = body;

    // Validate required fields
    if (!companyName || !adminEmail || !userId || !subdomain) {
      throw new Error("Missing required fields");
    }

    const seatCount = MIN_BILLABLE_SEATS;

    const stripeSecret = Deno.env.get("STRIPE_SECRET");
    if (!stripeSecret) {
      console.error("STRIPE_SECRET not configured");
      throw new Error("Stripe configuration error");
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
    });

    const checkoutCurrency = STRIPE_ALLOWED_CURRENCIES.has("usd") ? "usd" : "usd";
    const onboardingTotalCents = ONBOARDING_FEE_PER_EMPLOYEE_CENTS * seatCount;
    const totalAmount = DEPLOYMENT_FEE_CENTS + onboardingTotalCents;

    console.log(`Creating one-time checkout for deployment + ${seatCount} onboarding seats at ${totalAmount} ${checkoutCurrency}`);

    // Create Stripe checkout session with company details in metadata
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: checkoutCurrency,
            product_data: {
              name: "RoleColorFinder B2B - Platform Deployment",
              description: "One-time platform deployment investment",
            },
            unit_amount: DEPLOYMENT_FEE_CENTS,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: checkoutCurrency,
            product_data: {
              name: "RoleColorFinder B2B - Employee Onboarding",
              description: `${seatCount} employees at $20 one-time onboarding per employee`,
            },
            unit_amount: ONBOARDING_FEE_PER_EMPLOYEE_CENTS,
          },
          quantity: seatCount,
        },
      ],
      mode: "payment",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        company_name: companyName,
        admin_email: adminEmail,
        seats: seatCount.toString(),
        assessment_type: assessmentType,
        user_id: userId,
        subdomain: subdomain,
        type: "b2b_company_creation",
        currency: "USD",
        one_time_total_usd: (totalAmount / 100).toFixed(2),
        monthly_core_platform_usd: CORE_PLATFORM_MONTHLY_DOLLARS.toString(),
        monthly_hiring_intelligence_usd: HIRING_INTELLIGENCE_MONTHLY_DOLLARS.toString(),
      },
      customer_email: adminEmail,
    });

    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating B2B payment:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});