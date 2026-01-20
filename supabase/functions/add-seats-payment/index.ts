import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== ADD SEATS PAYMENT FUNCTION STARTED ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request body:", body);
    
    const { 
      companyId,
      companyName,
      additionalSeats,
      currentSeats,
      successUrl, 
      cancelUrl 
    } = body;

    // Validate required fields
    if (!companyId || !additionalSeats || additionalSeats < 1) {
      throw new Error("Invalid request: companyId and additionalSeats are required");
    }

    // Enforce 20,000 seat maximum for non-unlimited companies
    const MAX_SEATS_ALLOWED = 20000;
    const isUnlimitedCompany = companyName === "RoleColorFinderLLC";
    const newTotal = (currentSeats || 0) + additionalSeats;

    if (!isUnlimitedCompany && newTotal > MAX_SEATS_ALLOWED) {
      throw new Error(`Maximum ${MAX_SEATS_ALLOWED.toLocaleString()} seats allowed per company. You can add up to ${MAX_SEATS_ALLOWED - (currentSeats || 0)} more seats.`);
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
    const totalAmount = pricePerSeat * additionalSeats;

    console.log(`Creating checkout for ${additionalSeats} additional seats at $${totalAmount / 100}`);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "RoleColorFinder B2B - Additional Seats",
              description: `${additionalSeats} additional employee assessment seat${additionalSeats > 1 ? 's' : ''} for ${companyName || 'your company'}`,
            },
            unit_amount: pricePerSeat,
          },
          quantity: additionalSeats,
        },
      ],
      mode: "payment",
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        company_id: companyId,
        additional_seats: additionalSeats.toString(),
        current_seats: (currentSeats || 0).toString(),
        new_total: newTotal.toString(),
        type: "b2b_add_seats",
      },
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
    console.error("Error creating add seats payment:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});