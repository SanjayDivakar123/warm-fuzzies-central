import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  console.log("=== RESUBSCRIBE HIRING FUNCTION STARTED ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { companyId } = body;

    if (!companyId) throw new Error("companyId is required");

    // Verify user is admin or HR
    const { data: companyUser, error: cuError } = await supabase
      .from("company_users")
      .select("role, status")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .single();

    if (cuError || !companyUser || !["admin", "hr"].includes(companyUser.role) || companyUser.status !== "active") {
      throw new Error("User is not authorized for this company");
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, hiring_subscription_id, hiring_ever_subscribed, hiring_subscription_cancel_at_period_end")
      .eq("id", companyId)
      .single();

    if (companyError || !company) throw new Error("Company not found");

    // Only allow resubscribe for companies that have subscribed before
    if (!company.hiring_ever_subscribed) {
      throw new Error("This company has never subscribed. Please use the regular subscription flow.");
    }

    // Check if they have an active subscription that's set to cancel
    if (company.hiring_subscription_id && company.hiring_subscription_cancel_at_period_end) {
      // Reactivate by removing cancellation
      const stripeSecret = Deno.env.get("STRIPE_SECRET");
      if (!stripeSecret) throw new Error("Stripe configuration error");

      const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

      // Update Stripe subscription to not cancel at period end
      const subscription = await stripe.subscriptions.update(
        company.hiring_subscription_id,
        { cancel_at_period_end: false }
      );

      // Update company
      await supabase
        .from("companies")
        .update({
          hiring_subscription_cancel_at_period_end: false,
          hiring_subscription_enabled: true,
          hiring_subscription_status: subscription.status,
        })
        .eq("id", companyId);

      console.log("Reactivated existing subscription:", company.hiring_subscription_id);

      return new Response(JSON.stringify({ 
        success: true,
        reactivated: true,
        subscriptionId: company.hiring_subscription_id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If no active subscription, they need to go through the regular subscribe flow
    // to create a new subscription (this will use their existing payment method)
    throw new Error("No active subscription found. Please use the regular subscription flow to create a new subscription.");

  } catch (error) {
    console.error("Error resubscribing to hiring:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
