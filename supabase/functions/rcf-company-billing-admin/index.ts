import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_SUPER_ADMINS = new Set([
  "sanjay@rolecolorfinder.com",
  "tristan@rolecolorfinder.com",
]);

function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof value === "string" && uuidRegex.test(value);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized");

    const callerEmail = (user.email || "").toLowerCase();
    if (!ALLOWED_SUPER_ADMINS.has(callerEmail)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const companyId = (body?.company_id || "").toString();
    const action = (body?.action || "").toString();
    const amountCents = Number(body?.amount_cents || 0);
    const description = (body?.description || "").toString().trim();

    if (!isValidUUID(companyId)) throw new Error("Invalid company_id");
    if (!["add_free_credits", "charge_card", "remove_credits"].includes(action)) {
      throw new Error("Invalid action");
    }
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      throw new Error("amount_cents must be a positive integer");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, admin_email, stripe_customer_id, credit_balance")
      .eq("id", companyId)
      .single();
    if (companyError || !company) throw new Error("Company not found");

    const currentBalance = company.credit_balance || 0;

    if (action === "add_free_credits") {
      const newBalance = currentBalance + amountCents / 100;

      const { error: updateError } = await supabase
        .from("companies")
        .update({ credit_balance: newBalance })
        .eq("id", companyId);
      if (updateError) throw updateError;

      await supabase.from("billing_credits").insert({
        company_id: companyId,
        amount: amountCents / 100,
        type: "super_admin_free_credit",
        description:
          description || `Super-admin free credit: $${(amountCents / 100).toFixed(2)}`,
        created_by: user.id,
      });

      // Audit log (fire-and-forget)
      supabase.from('audit_logs').insert({
        company_id: companyId,
        user_id: user.id,
        user_email: user.email,
        action: 'credits_added',
        entity_type: 'billing',
        details: {
          amount: (amountCents / 100).toFixed(2),
          type: 'free_credit',
          description: description || null,
        },
      }).then(({ error }) => { if (error) console.error('Audit log failed:', error.message); });

      return new Response(
        JSON.stringify({
          success: true,
          action,
          amount_cents: amountCents,
          previous_balance_cents: currentBalance,
          new_balance_cents: newBalance,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (action === "remove_credits") {
      const removeAmount = amountCents / 100;
      const newBalance = Math.max(0, currentBalance - removeAmount);

      const { error: updateError } = await supabase
        .from("companies")
        .update({ credit_balance: newBalance })
        .eq("id", companyId);
      if (updateError) throw updateError;

      await supabase.from("billing_credits").insert({
        company_id: companyId,
        amount: -removeAmount,
        type: "super_admin_credit_removal",
        description:
          description || `Super-admin credit removal: -$${removeAmount.toFixed(2)}`,
        created_by: user.id,
      });

      // Audit log (fire-and-forget)
      supabase.from('audit_logs').insert({
        company_id: companyId,
        user_id: user.id,
        user_email: user.email,
        action: 'credits_removed',
        entity_type: 'billing',
        details: {
          amount: (amountCents / 100).toFixed(2),
          description: description || null,
        },
      }).then(({ error }) => { if (error) console.error('Audit log failed:', error.message); });

      return new Response(
        JSON.stringify({
          success: true,
          action,
          amount_cents: amountCents,
          previous_balance_cents: currentBalance,
          new_balance_cents: newBalance,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let customerId = company.stripe_customer_id;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: company.admin_email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: company.admin_email,
          name: company.name,
          metadata: { company_id: company.id },
        });
        customerId = customer.id;
      }

      await supabase
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", companyId);
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });
    if (paymentMethods.data.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          needsPaymentMethod: true,
          error: "No payment method on file for this company",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethods.data[0].id,
      off_session: true,
      confirm: true,
      description:
        description || `Super-admin manual charge for ${company.name}: $${(amountCents / 100).toFixed(2)}`,
      metadata: {
        company_id: company.id,
        type: "super_admin_manual_charge",
      },
    });

    if (paymentIntent.status !== "succeeded") {
      throw new Error(`Payment failed with status: ${paymentIntent.status}`);
    }

    const newBalance = currentBalance + amountCents / 100;
    const { error: updateError } = await supabase
      .from("companies")
      .update({ credit_balance: newBalance })
      .eq("id", companyId);
    if (updateError) throw updateError;

    await supabase.from("billing_transactions").insert({
      company_id: companyId,
      type: "super_admin_manual_charge",
      amount: amountCents,
      stripe_payment_intent_id: paymentIntent.id,
      description:
        description || `Super-admin manual charge: $${(amountCents / 100).toFixed(2)}`,
    });

    await supabase.from("billing_credits").insert({
      company_id: companyId,
      amount: amountCents / 100,
      type: "super_admin_paid_credit",
      description:
        description || `Credits added from manual card charge: $${(amountCents / 100).toFixed(2)}`,
      created_by: user.id,
    });

    // Audit log (fire-and-forget)
    supabase.from('audit_logs').insert({
      company_id: companyId,
      user_id: user.id,
      user_email: user.email,
      action: 'payment',
      entity_type: 'billing',
      details: {
        amount: (amountCents / 100).toFixed(2),
        type: 'card_charge',
        description: description || null,
        payment_intent_id: paymentIntent.id,
      },
    }).then(({ error }) => { if (error) console.error('Audit log failed:', error.message); });

    return new Response(
      JSON.stringify({
        success: true,
        action,
        amount_cents: amountCents,
        payment_intent_id: paymentIntent.id,
        previous_balance_cents: currentBalance,
        new_balance_cents: newBalance,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in rcf-company-billing-admin:", error);
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || "Unexpected error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
