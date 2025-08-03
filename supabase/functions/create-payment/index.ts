import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    
    const { productType, successUrl, cancelUrl } = body;
    console.log("Extracted data:", { productType, successUrl, cancelUrl });

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
        amount: 1900, // $19.00
        description: "Complete 25-question assessment with detailed insights"
      },
      pro: {
        name: "Pro Deep Dive Assessment", 
        amount: 4900, // $49.00
        description: "Ultimate 50-question assessment with comprehensive 3-page report"
      }
    };

    const productConfig = pricing[productType as keyof typeof pricing];
    if (!productConfig) {
      throw new Error("Invalid product type. Use 'premium' or 'pro'");
    }

    console.log("Creating payment for:", productConfig.name, "Amount:", productConfig.amount);

    // Create a one-time payment session (no authentication required)
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productConfig.name,
              description: productConfig.description,
            },
            unit_amount: productConfig.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl || `${req.headers.get("origin")}/${productType}-assessment`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/pricing`,
      allow_promotion_codes: true,
      metadata: {
        product_type: productType,
      },
    });

    console.log("Payment session created successfully:", session.id);
    console.log("Session URL:", session.url);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
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