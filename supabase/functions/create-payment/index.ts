import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import {
  RCAI_DISCOUNT_PCT,
  checkRcaiDiscount,
  createServiceClient,
  getUserFromAuthHeader,
  isRcaiDiscountEligibleProduct,
} from "../_shared/rcaiDiscount.ts";

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

serve(async (req) => {
  console.log("=== CREATE PAYMENT FUNCTION STARTED ===");
  console.log("Request method:", req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting payment creation process...");
    
    const body = await req.json();
    console.log("Request body:", body);
    
    const {
      productType,
      successUrl,
      cancelUrl,
      customAmount,
      customDescription,
      countryCode,
      stripeCurrency,
      stripeAmountMinor,
      displayCurrency,
      displayAmount,
      billingCountry,
    } = body;
    console.log("Extracted data:", {
      productType,
      successUrl,
      cancelUrl,
      customAmount,
      customDescription,
      countryCode,
      stripeCurrency,
      stripeAmountMinor,
      displayCurrency,
      displayAmount,
      billingCountry,
    });

    if (!productType) {
      throw new Error("Product type is required");
    }

    // Check if Stripe secret is available
    const stripeSecret = Deno.env.get("STRIPE_SECRET");
    if (!stripeSecret) {
      console.error("STRIPE_SECRET environment variable is not set");
      throw new Error("Stripe configuration error");
    }
    
    console.log("Stripe secret found, initializing Stripe...");

    // Initialize Stripe
    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
    });

    // Define pricing based on product type
    const pricing = {
      premium: {
        name: "Premium Leadership Assessment",
        amount: 12499, // $124.99
        description: "Complete 25-question assessment with detailed insights"
      },
      pro: {
        name: "Pro Deep Dive Assessment", 
        amount: 19999, // $199.99
        description: "Ultimate 50-question assessment with comprehensive 3-page report"
      },
      team: {
        name: "Team Composition & Role Design Program",
        amount: customAmount || 100000, // Use custom amount or default to $1000
        description: customDescription || "12-week program to map capabilities, identify gaps, and design roles"
      },
      career: {
        name: "RCF Career Finder Report",
        amount: 1900, // $19.00
        description: "Personalized career recommendations based on your RoleColor profile"
      }
    };

    const productConfig = pricing[productType as keyof typeof pricing];
    if (!productConfig) {
      throw new Error("Invalid product type. Use 'premium', 'pro', 'team', or 'career'");
    }

    const requestedCurrency = typeof stripeCurrency === "string" ? stripeCurrency.toLowerCase() : "usd";
    const checkoutCurrency = STRIPE_ALLOWED_CURRENCIES.has(requestedCurrency) ? requestedCurrency : "usd";
    const checkoutAmount = typeof stripeAmountMinor === "number" && stripeAmountMinor > 0
      ? Math.round(stripeAmountMinor)
      : productConfig.amount;
    const safeCheckoutAmount = Number.isFinite(checkoutAmount) && checkoutAmount > 0 ? checkoutAmount : productConfig.amount;

    console.log("Creating payment for:", productConfig.name, "Amount:", safeCheckoutAmount, "Currency:", checkoutCurrency);

    // ---- RoleColorAI member discount (server-side check, never trust client) ----
    let rcaiDiscountApplied = false;
    let rcaiRedemptionId: string | null = null;
    let rcaiUserId: string | null = null;
    let finalAmount = safeCheckoutAmount;
    let productName = productConfig.name;
    let productDescription = productConfig.description;

    if (isRcaiDiscountEligibleProduct(productType)) {
      const supabaseService = createServiceClient();
      const user = await getUserFromAuthHeader(supabaseService, req.headers.get("Authorization"));
      if (user) {
        rcaiUserId = user.id;
        const status = await checkRcaiDiscount(supabaseService, user.id);
        if (status.eligible) {
          rcaiDiscountApplied = true;
          rcaiRedemptionId = status.redemptionId;
          finalAmount = Math.round(safeCheckoutAmount * (100 - RCAI_DISCOUNT_PCT) / 100);
          productName = `${productConfig.name} (RoleColorAI member, ${RCAI_DISCOUNT_PCT}% off)`;
          productDescription = `${productConfig.description} — RoleColorAI member discount applied`;
          console.log("RCAI discount applied. Redemption:", status.redemptionId, "→", finalAmount);
        }
      }
    }

    // Create a one-time payment session (no authentication required)
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: checkoutCurrency,
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: finalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl || `${req.headers.get("origin")}/${productType}-assessment`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/pricing`,
      // Disable Stripe promo codes when our member discount is applied (no stacking).
      allow_promotion_codes: !rcaiDiscountApplied,
      metadata: {
        product_type: productType,
        country_code: countryCode || "US",
        billing_country: billingCountry || "United States",
        display_currency: displayCurrency || "USD",
        display_amount: typeof displayAmount === "number" ? displayAmount.toString() : "",
        rcai_discount_applied: rcaiDiscountApplied ? "true" : "false",
        rcai_redemption_id: rcaiRedemptionId ?? "",
        rcai_user_id: rcaiUserId ?? "",
        rcai_original_amount_minor: safeCheckoutAmount.toString(),
        rcai_final_amount_minor: finalAmount.toString(),
      },
    });

    console.log("Payment session created successfully:", session.id);
    console.log("Session URL:", session.url);

    return new Response(JSON.stringify({
      url: session.url,
      sessionId: session.id,
      discount: rcaiDiscountApplied
        ? {
            kind: "rcai_member",
            pct: RCAI_DISCOUNT_PCT,
            originalAmountMinor: safeCheckoutAmount,
            finalAmountMinor: finalAmount,
          }
        : null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("=== PAYMENT CREATION ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Check function logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});