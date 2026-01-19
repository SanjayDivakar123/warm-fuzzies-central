import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== VERIFY ADD SEATS PAYMENT FUNCTION STARTED ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    console.log("Verifying session:", sessionId);

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET");
    if (!stripeSecret) {
      throw new Error("Stripe configuration error");
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("Session status:", session.payment_status);
    console.log("Session metadata:", session.metadata);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Extract details from metadata
    const {
      company_id,
      new_total,
    } = session.metadata || {};

    if (!company_id || !new_total) {
      throw new Error("Invalid session metadata");
    }

    // Initialize Supabase with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration error");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Update the company's seat count
    const { error: updateError } = await supabase
      .from("companies")
      .update({ seats_purchased: parseInt(new_total) })
      .eq("id", company_id);

    if (updateError) {
      console.error("Seat update error:", updateError);
      throw new Error(`Failed to update seats: ${updateError.message}`);
    }

    console.log(`Successfully updated company ${company_id} to ${new_total} seats`);

    return new Response(JSON.stringify({
      success: true,
      newTotal: parseInt(new_total),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error verifying add seats payment:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});