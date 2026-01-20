import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MONTHLY_RATE_CENTS = 2000; // $20.00 per user per month

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CALCULATE-REFUND] ${step}${detailsStr}`);
};

// Calculate pro-rated refund based on days remaining in the month
function calculateProRatedRefund(): number {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysRemaining = endOfMonth.getDate() - now.getDate(); // Don't include today (already used)
  const daysInMonth = endOfMonth.getDate();
  
  const refundAmount = Math.round((daysRemaining / daysInMonth) * MONTHLY_RATE_CENTS);
  logStep("Pro-rated refund calculation", { daysRemaining, daysInMonth, refundAmount });
  
  return refundAmount;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

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
    const { company_id, company_user_id } = body;

    if (!company_id || !company_user_id) throw new Error("company_id and company_user_id are required");

    // Verify user is admin for this company
    const { data: companyUser, error: cuError } = await supabase
      .from("company_users")
      .select("role, status")
      .eq("company_id", company_id)
      .eq("user_id", user.id)
      .single();

    if (cuError || !companyUser || companyUser.role !== "admin" || companyUser.status !== "active") {
      throw new Error("User is not an admin for this company");
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, credit_balance")
      .eq("id", company_id)
      .single();

    if (companyError || !company) throw new Error("Company not found");

    logStep("Company found", { companyId: company.id, name: company.name });

    // Check if company is unlimited (RoleColorFinderLLC)
    if (company.name === "RoleColorFinderLLC") {
      logStep("Unlimited company - no refund applicable");
      return new Response(JSON.stringify({ 
        success: true, 
        refunded: false, 
        message: "Unlimited company - no refund" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get the user being removed
    const { data: removedUser, error: removedUserError } = await supabase
      .from("company_users")
      .select("email, role, status")
      .eq("id", company_user_id)
      .eq("company_id", company_id)
      .single();

    if (removedUserError || !removedUser) throw new Error("User to remove not found");

    // Only refund for active employees
    if (removedUser.role !== "employee" || removedUser.status !== "active") {
      logStep("User is not an active employee, no refund", { role: removedUser.role, status: removedUser.status });
      return new Response(JSON.stringify({ 
        success: true, 
        refunded: false, 
        message: "Only active employees are eligible for pro-rated refunds" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Calculate pro-rated refund
    const refundAmount = calculateProRatedRefund();
    
    if (refundAmount <= 0) {
      logStep("No refund needed (end of month)");
      return new Response(JSON.stringify({ 
        success: true, 
        refunded: false, 
        refundAmount: 0,
        message: "No refund applicable at end of billing period" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Add refund to credit balance
    const newBalance = (company.credit_balance || 0) + refundAmount;
    
    const { error: updateError } = await supabase
      .from("companies")
      .update({ credit_balance: newBalance })
      .eq("id", company_id);

    if (updateError) throw new Error("Failed to add refund credits");

    // Record the refund as a billing credit
    await supabase.from("billing_credits").insert({
      company_id: company_id,
      type: "user_removal_refund",
      amount: refundAmount,
      description: `Pro-rated refund for removing user: ${removedUser.email} ($${(refundAmount / 100).toFixed(2)})`,
      created_by: user.id
    });

    // Also record in transactions
    await supabase.from("billing_transactions").insert({
      company_id: company_id,
      type: "user_removal_refund",
      amount: refundAmount,
      description: `Pro-rated refund for ${removedUser.email}`
    });

    logStep("Refund credited successfully", { refundAmount, newBalance });

    return new Response(JSON.stringify({ 
      success: true, 
      refunded: true, 
      refundAmount,
      newBalance,
      removedUserEmail: removedUser.email
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