import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_SUPER_ADMIN_EMAILS = [
  "sanjay@rolecolorfinder.com",
  "tristan@rolecolorfinder.com",
];

serve(async (req) => {
  console.log("=== SUPER ADMIN TOGGLE HIRING FUNCTION STARTED ===");

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

    // Verify user is a super admin
    const userEmail = user.email?.toLowerCase() || "";
    if (!ALLOWED_SUPER_ADMIN_EMAILS.includes(userEmail)) {
      throw new Error("Unauthorized: Only super admins can perform this action");
    }

    const body = await req.json();
    const { companyId, enable } = body;

    if (!companyId) throw new Error("companyId is required");
    if (typeof enable !== "boolean") throw new Error("enable must be a boolean");

    console.log(`Super admin ${userEmail} attempting to ${enable ? 'enable' : 'disable'} hiring for company ${companyId}`);

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, hiring_subscription_id, hiring_subscription_enabled, hiring_subscription_status")
      .eq("id", companyId)
      .single();

    if (companyError || !company) throw new Error("Company not found");

    const stripeSecret = Deno.env.get("STRIPE_SECRET");
    if (!stripeSecret) throw new Error("Stripe configuration error");

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    if (enable) {
      // ENABLE hiring platform access
      // If they have a subscription that was cancelled, reactivate it
      if (company.hiring_subscription_id) {
        try {
          const subscription = await stripe.subscriptions.retrieve(company.hiring_subscription_id);
          
          // If subscription exists and is cancelling, remove the cancellation
          if (subscription.cancel_at_period_end) {
            await stripe.subscriptions.update(company.hiring_subscription_id, {
              cancel_at_period_end: false,
            });
            console.log("Reactivated existing subscription:", company.hiring_subscription_id);
          }

          // Update company to enable hiring
          await supabase
            .from("companies")
            .update({
              hiring_subscription_enabled: true,
              hiring_subscription_status: subscription.status,
              hiring_subscription_cancel_at_period_end: false,
            })
            .eq("id", companyId);

          return new Response(JSON.stringify({ 
            success: true,
            action: "enabled",
            message: `Hiring platform access enabled for ${company.name}`,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } catch (stripeError) {
          console.error("Error with existing subscription:", stripeError);
          // If subscription doesn't exist in Stripe, just enable the flag
          await supabase
            .from("companies")
            .update({
              hiring_subscription_enabled: true,
              hiring_subscription_status: "active",
              hiring_subscription_cancel_at_period_end: false,
            })
            .eq("id", companyId);

          return new Response(JSON.stringify({ 
            success: true,
            action: "enabled",
            message: `Hiring platform access enabled for ${company.name}`,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      } else {
        // No subscription exists, just enable the flag
        await supabase
          .from("companies")
          .update({
            hiring_subscription_enabled: true,
            hiring_subscription_status: "active",
            hiring_subscription_cancel_at_period_end: false,
          })
          .eq("id", companyId);

        return new Response(JSON.stringify({ 
          success: true,
          action: "enabled",
          message: `Hiring platform access enabled for ${company.name}`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } else {
      // DISABLE hiring platform access
      if (company.hiring_subscription_id) {
        try {
          // Cancel the subscription immediately in Stripe
          await stripe.subscriptions.cancel(company.hiring_subscription_id);
          console.log("Cancelled Stripe subscription:", company.hiring_subscription_id);
        } catch (stripeError) {
          console.error("Error cancelling Stripe subscription:", stripeError);
          // Continue even if Stripe cancellation fails
        }
      }

      // Update company to disable hiring immediately
      // Set hiring_ever_subscribed to true so they see the resubscribe flow
      await supabase
        .from("companies")
        .update({
          hiring_subscription_enabled: false,
          hiring_subscription_status: "cancelled",
          hiring_subscription_cancel_at_period_end: false,
          hiring_ever_subscribed: true, // Show resubscribe flow instead of full paywall
        })
        .eq("id", companyId);

      console.log("Hiring platform disabled for company:", companyId);

      return new Response(JSON.stringify({ 
        success: true,
        action: "disabled",
        message: `Hiring platform access disabled for ${company.name}`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    console.error("Error toggling hiring access:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
