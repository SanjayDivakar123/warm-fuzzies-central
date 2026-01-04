import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== CREATE PAYMENT INTENT FUNCTION STARTED ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request body:", body);
    
    const { productType, promoCode } = body;

    if (!productType) {
      throw new Error("Product type is required");
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET");
    if (!stripeSecret) {
      console.error("STRIPE_SECRET environment variable is not set");
      throw new Error("Stripe configuration error");
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
    });

    // Define pricing based on product type
    const pricing: Record<string, { name: string; amount: number; description: string }> = {
      premium: {
        name: "Premium Leadership Assessment",
        amount: 1900, // $19.00
        description: "Complete 25-question assessment with detailed insights"
      },
      pro: {
        name: "Pro Deep Dive Assessment", 
        amount: 4900, // $49.00
        description: "Ultimate 50-question assessment with comprehensive 3-page report"
      },
      team: {
        name: "Team Composition & Role Design Program",
        amount: 100000, // $1000
        description: "12-week program to map capabilities, identify gaps, and design roles"
      }
    };

    const productConfig = pricing[productType];
    if (!productConfig) {
      throw new Error("Invalid product type");
    }

    let finalAmount = productConfig.amount;
    let discountPercent = 0;
    let appliedPromoCode = null;

    // Validate and apply promo code if provided
    if (promoCode) {
      console.log("Validating promo code:", promoCode);
      try {
        const promotionCodes = await stripe.promotionCodes.list({
          code: promoCode,
          active: true,
          limit: 1,
        });
        
        if (promotionCodes.data.length > 0) {
          const promo = promotionCodes.data[0];
          const coupon = promo.coupon;
          
          if (coupon.percent_off) {
            discountPercent = coupon.percent_off;
            finalAmount = Math.round(productConfig.amount * (1 - discountPercent / 100));
            appliedPromoCode = promoCode;
            console.log(`Applied ${discountPercent}% discount, new amount: ${finalAmount}`);
          } else if (coupon.amount_off) {
            finalAmount = Math.max(0, productConfig.amount - coupon.amount_off);
            appliedPromoCode = promoCode;
            console.log(`Applied $${coupon.amount_off / 100} discount, new amount: ${finalAmount}`);
          }
        } else {
          console.log("Promo code not found or inactive");
        }
      } catch (promoError) {
        console.error("Error validating promo code:", promoError);
      }
    }

    console.log("Creating PaymentIntent for:", productConfig.name, "Amount:", finalAmount);

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        product_type: productType,
        product_name: productConfig.name,
        original_amount: productConfig.amount.toString(),
        promo_code: appliedPromoCode || "",
      },
    });

    console.log("PaymentIntent created:", paymentIntent.id);

    return new Response(JSON.stringify({ 
      clientSecret: paymentIntent.client_secret,
      amount: finalAmount,
      originalAmount: productConfig.amount,
      discountPercent,
      appliedPromoCode,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("=== PAYMENT INTENT ERROR ===", error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
