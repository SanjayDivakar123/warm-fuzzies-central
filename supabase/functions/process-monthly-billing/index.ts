import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MONTHLY_RATE_CENTS = 2000; // $20.00 per user per month

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MONTHLY-BILLING] ${step}${detailsStr}`);
};

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
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get all active companies
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, name, admin_email, credit_balance, stripe_customer_id")
      .neq("name", "RoleColorFinderLLC"); // Exclude unlimited company

    if (companiesError) throw new Error(`Failed to fetch companies: ${companiesError.message}`);

    logStep("Found companies to process", { count: companies?.length || 0 });

    const results: Array<{
      companyId: string;
      companyName: string;
      activeUsers: number;
      totalCharge: number;
      creditsUsed: number;
      cardCharged: number;
      success: boolean;
      error?: string;
    }> = [];

    for (const company of companies || []) {
      try {
        logStep("Processing company", { companyId: company.id, name: company.name });

        // Count active users (excluding admins who don't get charged)
        const { count: activeUserCount, error: countError } = await supabase
          .from("company_users")
          .select("*", { count: "exact", head: true })
          .eq("company_id", company.id)
          .eq("status", "active")
          .eq("role", "employee");

        if (countError) {
          logStep("Error counting users", { error: countError.message });
          results.push({
            companyId: company.id,
            companyName: company.name,
            activeUsers: 0,
            totalCharge: 0,
            creditsUsed: 0,
            cardCharged: 0,
            success: false,
            error: countError.message
          });
          continue;
        }

        const activeUsers = activeUserCount || 0;
        if (activeUsers === 0) {
          logStep("No active employees, skipping", { companyId: company.id });
          results.push({
            companyId: company.id,
            companyName: company.name,
            activeUsers: 0,
            totalCharge: 0,
            creditsUsed: 0,
            cardCharged: 0,
            success: true
          });
          continue;
        }

        const totalCharge = activeUsers * MONTHLY_RATE_CENTS;
        const creditBalance = company.credit_balance || 0;
        
        let creditsUsed = 0;
        let cardCharged = 0;

        logStep("Calculating charges", { 
          activeUsers, 
          totalCharge, 
          creditBalance 
        });

        // Use credits first
        if (creditBalance >= totalCharge) {
          // Fully covered by credits
          creditsUsed = totalCharge;
          const newBalance = creditBalance - totalCharge;
          
          await supabase
            .from("companies")
            .update({ credit_balance: newBalance })
            .eq("id", company.id);

          await supabase.from("billing_transactions").insert({
            company_id: company.id,
            type: "monthly_billing_credits",
            amount: -totalCharge,
            description: `Monthly billing for ${activeUsers} users - used credits`
          });

          logStep("Charged via credits", { creditsUsed, newBalance });
        } else {
          // Partial credits + card charge
          if (creditBalance > 0) {
            creditsUsed = creditBalance;
            await supabase
              .from("companies")
              .update({ credit_balance: 0 })
              .eq("id", company.id);

            await supabase.from("billing_transactions").insert({
              company_id: company.id,
              type: "monthly_billing_credits",
              amount: -creditBalance,
              description: `Monthly billing partial - used remaining credits`
            });
          }

          cardCharged = totalCharge - creditsUsed;

          // Charge card for remainder
          if (cardCharged > 0 && company.stripe_customer_id) {
            const paymentMethods = await stripe.paymentMethods.list({
              customer: company.stripe_customer_id,
              type: "card",
            });

            if (paymentMethods.data.length > 0) {
              const paymentIntent = await stripe.paymentIntents.create({
                amount: cardCharged,
                currency: "usd",
                customer: company.stripe_customer_id,
                payment_method: paymentMethods.data[0].id,
                off_session: true,
                confirm: true,
                description: `Monthly billing for ${activeUsers} users - ${company.name}`,
                metadata: {
                  company_id: company.id,
                  type: "monthly_billing",
                  active_users: activeUsers.toString()
                }
              });

              if (paymentIntent.status !== "succeeded") {
                throw new Error(`Payment failed: ${paymentIntent.status}`);
              }

              await supabase.from("billing_transactions").insert({
                company_id: company.id,
                type: "monthly_billing_card",
                amount: cardCharged,
                stripe_payment_intent_id: paymentIntent.id,
                description: `Monthly billing for ${activeUsers} users - card charge`
              });

              logStep("Charged via card", { cardCharged, paymentIntentId: paymentIntent.id });
            } else {
              logStep("No payment method on file", { companyId: company.id });
              // Log the failed billing attempt
              await supabase.from("billing_transactions").insert({
                company_id: company.id,
                type: "monthly_billing_failed",
                amount: cardCharged,
                description: `Monthly billing failed - no payment method on file`
              });
              
              results.push({
                companyId: company.id,
                companyName: company.name,
                activeUsers,
                totalCharge,
                creditsUsed,
                cardCharged: 0,
                success: false,
                error: "No payment method on file"
              });
              continue;
            }
          }
        }

        results.push({
          companyId: company.id,
          companyName: company.name,
          activeUsers,
          totalCharge,
          creditsUsed,
          cardCharged,
          success: true
        });

      } catch (companyError) {
        const errorMessage = companyError instanceof Error ? companyError.message : String(companyError);
        logStep("Error processing company", { companyId: company.id, error: errorMessage });
        
        results.push({
          companyId: company.id,
          companyName: company.name,
          activeUsers: 0,
          totalCharge: 0,
          creditsUsed: 0,
          cardCharged: 0,
          success: false,
          error: errorMessage
        });
      }
    }

    logStep("Processing complete", { 
      totalCompanies: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return new Response(JSON.stringify({ 
      success: true, 
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

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