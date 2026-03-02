import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  console.log("=== CANCEL HIRING SUBSCRIPTION FUNCTION STARTED ===");

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
    const { companyId, cancelImmediately = false } = body;

    if (!companyId) throw new Error("companyId is required");

    // Verify user is admin
    const { data: companyUser, error: cuError } = await supabase
      .from("company_users")
      .select("role, status")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .single();

    if (cuError || !companyUser || companyUser.role !== "admin" || companyUser.status !== "active") {
      throw new Error("User is not an admin for this company");
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, hiring_subscription_id, hiring_subscription_enabled, hiring_subscription_current_period_end")
      .eq("id", companyId)
      .single();

    if (companyError || !company) throw new Error("Company not found");

    // Check if hiring is enabled
    if (!company.hiring_subscription_enabled) {
      throw new Error("Hiring platform is not currently enabled for this company");
    }

    // If no Stripe subscription exists (e.g., enabled by super admin)
    if (!company.hiring_subscription_id) {
      // Only super admin (cancelImmediately=true) can instantly disable
      // Regular users should still have access until end of month
      if (cancelImmediately) {
        await supabase
          .from("companies")
          .update({
            hiring_subscription_enabled: false,
            hiring_subscription_status: "cancelled",
            hiring_subscription_cancel_at_period_end: false,
            hiring_subscription_current_period_end: null,
          })
          .eq("id", companyId);

        console.log("Hiring platform disabled immediately by super admin (no Stripe subscription):", companyId);

        return new Response(JSON.stringify({ 
          success: true,
          cancelledImmediately: true,
          message: "Hiring platform access has been removed",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        // Regular user cancellation - keep access until end of current billing period
        const now = new Date();
        const existingPeriodEnd = company.hiring_subscription_current_period_end
          ? new Date(company.hiring_subscription_current_period_end)
          : null;
        const hasFuturePeriodEnd = !!existingPeriodEnd && !Number.isNaN(existingPeriodEnd.getTime()) && existingPeriodEnd.getTime() > now.getTime();
        const periodEnd = hasFuturePeriodEnd
          ? existingPeriodEnd
          : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        await supabase
          .from("companies")
          .update({
            hiring_subscription_cancel_at_period_end: true,
            hiring_subscription_current_period_end: periodEnd.toISOString(),
          })
          .eq("id", companyId);

        console.log("Hiring platform set to cancel at end of billing period (no Stripe subscription):", companyId);

        return new Response(JSON.stringify({ 
          success: true,
          cancelAtPeriodEnd: true,
          periodEnd: periodEnd.toISOString(),
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET");
    if (!stripeSecret) throw new Error("Stripe configuration error");

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    // Cancel or schedule cancellation
    if (cancelImmediately) {
      // Cancel immediately
      await stripe.subscriptions.cancel(company.hiring_subscription_id);

      // Update company - disable immediately
      await supabase
        .from("companies")
        .update({
          hiring_subscription_enabled: false,
          hiring_subscription_status: "cancelled",
          hiring_subscription_cancel_at_period_end: false,
        })
        .eq("id", companyId);

      console.log("Hiring subscription cancelled immediately:", companyId);

      return new Response(JSON.stringify({ 
        success: true,
        cancelledImmediately: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Cancel at period end
      const subscription = await stripe.subscriptions.update(
        company.hiring_subscription_id,
        { cancel_at_period_end: true }
      );

      // Update company - mark for cancellation but keep enabled until period end
      await supabase
        .from("companies")
        .update({
          hiring_subscription_cancel_at_period_end: true,
          hiring_subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq("id", companyId);

      console.log("Hiring subscription set to cancel at period end:", companyId);

      return new Response(JSON.stringify({ 
        success: true,
        cancelAtPeriodEnd: true,
        periodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    console.error("Error cancelling hiring subscription:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const isClientError = errorMessage.includes("not an admin") || 
                         errorMessage.includes("not currently enabled") ||
                         errorMessage.includes("required");
    
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isClientError ? 400 : 500,
    });
  }
});
