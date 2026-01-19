import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      seats, 
      assessmentType, 
      userId,
      subdomain,
      successUrl, 
      cancelUrl 
    } = body;

    // Validate required fields
    if (!companyName || !adminEmail || !seats || !userId || !subdomain) {
      throw new Error("Missing required fields");
    }

    const seatCount = parseInt(seats);
    if (seatCount < 2) {
      throw new Error("Minimum 2 seats required");
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET");
    if (!stripeSecret) {
      console.error("STRIPE_SECRET not configured");
      throw new Error("Stripe configuration error");
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
    });

    const pricePerSeat = 2000; // $20.00 in cents
    const totalAmount = pricePerSeat * seatCount;

    console.log(`Creating checkout for ${seatCount} seats at $${totalAmount / 100}`);

    // Create Stripe checkout session with company details in metadata
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "RoleColorFinder B2B - Team Seats",
              description: `${seatCount} employee assessment seats for ${companyName}`,
            },
            unit_amount: pricePerSeat,
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