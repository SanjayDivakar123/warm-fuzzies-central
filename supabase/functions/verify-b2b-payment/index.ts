import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIN_BILLABLE_SEATS = 2;

serve(async (req) => {
  console.log("=== VERIFY B2B PAYMENT FUNCTION STARTED ===");

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

    // Retrieve the checkout session (expand customer so we always have the ID)
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["customer"] });
    console.log("Session status:", session.payment_status);
    console.log("Session metadata:", session.metadata);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Extract company details from metadata
    const {
      company_name,
      admin_email,
      seats,
      assessment_type,
      user_id,
      subdomain,
    } = session.metadata || {};

    if (!company_name || !admin_email || !user_id || !subdomain) {
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

    // Check if company already exists (idempotency)
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("subdomain", subdomain)
      .maybeSingle();

    if (existingCompany) {
      console.log("Company already exists, returning success");
      return new Response(JSON.stringify({
        success: true,
        companyName: company_name,
        message: "Company already created",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Capture the Stripe customer ID from the session so future billing calls use the right customer
    const stripeCustomerId = typeof session.customer === "string"
      ? session.customer
      : (session.customer as any)?.id ?? null;

    const onboardingSeats = Math.max(MIN_BILLABLE_SEATS, Number(seats || MIN_BILLABLE_SEATS));

    // Create the company
    const { data: newCompany, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: company_name,
        subdomain: subdomain,
        admin_email: admin_email,
        seats_purchased: onboardingSeats,
        assessment_type: assessment_type || "25q",
        ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
      })
      .select()
      .single();

    if (companyError) {
      console.error("Company creation error:", companyError);
      throw new Error(`Failed to create company: ${companyError.message}`);
    }

    console.log("Company created:", newCompany.id);

    // Create admin user entry
    const { error: userError } = await supabase
      .from("company_users")
      .insert({
        company_id: newCompany.id,
        user_id: user_id,
        email: admin_email,
        role: "admin",
        status: "active",
        joined_at: new Date().toISOString(),
      });

    if (userError) {
      console.error("Admin user creation error:", userError);
      // Don't fail the whole operation, company is created
    }

    console.log("B2B company setup complete");

    return new Response(JSON.stringify({
      success: true,
      companyName: company_name,
      companyId: newCompany.id,
      subdomain: subdomain,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error verifying B2B payment:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});