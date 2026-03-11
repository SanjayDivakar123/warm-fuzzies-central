import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const isFutureDate = (value: string | null | undefined) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > Date.now();
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
      .select("id, hiring_subscription_id, hiring_subscription_cancel_at_period_end, hiring_subscription_enabled, hiring_subscription_status, hiring_subscription_current_period_end")
      .eq("id", companyId)
      .single();

    if (companyError || !company) throw new Error("Company not found");

    console.log("Company state:", {
      id: company.id,
      has_subscription_id: !!company.hiring_subscription_id,
      cancel_at_period_end: company.hiring_subscription_cancel_at_period_end,
      enabled: company.hiring_subscription_enabled,
      status: company.hiring_subscription_status,
      current_period_end: company.hiring_subscription_current_period_end,
    });

    if (!company.hiring_subscription_cancel_at_period_end) {
      if (
        company.hiring_subscription_enabled &&
        (company.hiring_subscription_status === "active" || company.hiring_subscription_status === "trialing")
      ) {
        return new Response(JSON.stringify({
          success: true,
          reactivated: false,
          alreadyActive: true,
          message: "Subscription is already active.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      throw new Error("No cancellation is currently scheduled for this subscription.");
    }

    // Case 1: Stripe-backed subscription set to cancel at period end
    if (company.hiring_subscription_id) {
      // Reactivate by removing cancellation
      const stripeSecret = Deno.env.get("STRIPE_SECRET");
      if (!stripeSecret) throw new Error("Stripe configuration error");

      const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

      try {
        // Update Stripe subscription to not cancel at period end
        const subscription = await stripe.subscriptions.update(
          company.hiring_subscription_id,
          { cancel_at_period_end: false }
        );

        const isPayingStatus = subscription.status === "active" || subscription.status === "trialing";
        if (!isPayingStatus) {
          await supabase
            .from("companies")
            .update({
              hiring_subscription_cancel_at_period_end: false,
              hiring_subscription_enabled: false,
              hiring_subscription_status: subscription.status,
            })
            .eq("id", companyId);

          throw new Error(`Subscription cannot be reactivated from status ${subscription.status}. Please start a new subscription.`);
        }

        console.log("Reactivated subscription in Stripe:", company.hiring_subscription_id);

        // Update company
        await supabase
          .from("companies")
          .update({
            hiring_subscription_cancel_at_period_end: false,
            hiring_subscription_enabled: isPayingStatus,
            hiring_subscription_status: subscription.status,
          })
          .eq("id", companyId);

        console.log("Updated company record for reactivation");

        return new Response(JSON.stringify({ 
          success: true,
          reactivated: true,
          subscriptionId: company.hiring_subscription_id,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } catch (stripeError: any) {
        console.error("Stripe error during reactivation:", stripeError);
        throw stripeError;
      }
    }

    // Case 2: No Stripe subscription id (credits/local access path)
    // If still inside the current paid period, simply remove cancel_at_period_end.
    if (isFutureDate(company.hiring_subscription_current_period_end)) {
      await supabase
        .from("companies")
        .update({
          hiring_subscription_cancel_at_period_end: false,
          hiring_subscription_enabled: true,
          hiring_subscription_status: company.hiring_subscription_status === "trialing" ? "trialing" : "active",
        })
        .eq("id", companyId);

      return new Response(JSON.stringify({
        success: true,
        reactivated: true,
        noImmediateCharge: true,
        nextRenewalDate: company.hiring_subscription_current_period_end,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If no active subscription, they need to go through the regular subscribe flow
    // to create a new subscription (this may charge card/credits immediately)
    console.log("Cannot resubscribe - no valid subscription state. Company state:", {
      has_subscription_id: !!company.hiring_subscription_id,
      cancel_at_period_end: company.hiring_subscription_cancel_at_period_end,
      current_period_end: company.hiring_subscription_current_period_end,
    });
    throw new Error("Current billing period has ended. Please use the regular subscription flow to create a new subscription.");

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
