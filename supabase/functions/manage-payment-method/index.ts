import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-PAYMENT-METHOD] ${step}${detailsStr}`);
};

const MANAGEMENT_ROLES = ["admin", "hr", "partner"] as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const { company_id, action, success_url, cancel_url } = body;

    if (!company_id) throw new Error("company_id is required");

    // Verify user has management access for this company
    const { data: companyUser, error: cuError } = await supabase
      .from("company_users")
      .select("role, status")
      .eq("company_id", company_id)
      .eq("user_id", user.id)
      .single();

    if (cuError || !companyUser || companyUser.status !== "active" || !MANAGEMENT_ROLES.includes(companyUser.role)) {
      throw new Error("User is not authorized to manage billing for this company");
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, admin_email, stripe_customer_id")
      .eq("id", company_id)
      .single();

    if (companyError || !company) throw new Error("Company not found");

    logStep("Company found", { companyId: company.id, name: company.name });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get or create Stripe customer
    let customerId = company.stripe_customer_id;

    if (!customerId) {
      // Check if customer exists by email
      const customers = await stripe.customers.list({ email: company.admin_email, limit: 1 });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId });
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: company.admin_email,
          name: company.name,
          metadata: { company_id: company.id }
        });
        customerId = customer.id;
        logStep("Created new Stripe customer", { customerId });
      }

      // Save customer ID to company
      await supabase
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", company_id);
    }

    // Handle different actions
    if (action === "get_payment_method") {
      // Get current payment method
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      if (paymentMethods.data.length === 0) {
        return new Response(JSON.stringify({ 
          hasPaymentMethod: false 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      let defaultPaymentMethodId: string | null = null;
      try {
        const customerObj = await stripe.customers.retrieve(customerId) as any;
        const invoiceDefault = customerObj?.invoice_settings?.default_payment_method;
        const invoiceDefaultId = typeof invoiceDefault === "string" ? invoiceDefault : invoiceDefault?.id;
        if (typeof invoiceDefaultId === "string" && invoiceDefaultId.startsWith("pm_")) {
          defaultPaymentMethodId = invoiceDefaultId;
        }
      } catch (customerRetrieveError) {
        logStep("Failed to retrieve customer invoice default", { customerId, error: customerRetrieveError });
      }

      const pm = defaultPaymentMethodId
        ? (paymentMethods.data.find((method) => method.id === defaultPaymentMethodId) || paymentMethods.data[0])
        : paymentMethods.data[0];

      logStep("Payment method found", { brand: pm.card?.brand, last4: pm.card?.last4 });

      return new Response(JSON.stringify({ 
        hasPaymentMethod: true,
        paymentMethod: {
          id: pm.id,
          brand: pm.card?.brand,
          last4: pm.card?.last4,
          expMonth: pm.card?.exp_month,
          expYear: pm.card?.exp_year,
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "setup_payment_method") {
      // Create a Checkout Session in setup mode
      const origin = req.headers.get("origin") || success_url?.split('/').slice(0, 3).join('/') || "https://rolecolorfinder.com";
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "setup",
        payment_method_types: ["card"],
        success_url: success_url || `${origin}/b2b/dashboard?payment_setup=success`,
        cancel_url: cancel_url || `${origin}/b2b/dashboard?payment_setup=cancelled`,
        metadata: {
          company_id: company.id,
          type: "payment_method_setup"
        }
      });

      logStep("Checkout session created", { sessionId: session.id, url: session.url });

      return new Response(JSON.stringify({ 
        success: true,
        url: session.url,
        sessionId: session.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action. Use 'get_payment_method' or 'setup_payment_method'");

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
