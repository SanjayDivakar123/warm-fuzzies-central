import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof str === "string" && uuidRegex.test(str);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Verify user's JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { company_id, amount, description } = body;

    // Validate inputs
    if (!company_id || !isValidUUID(company_id)) {
      return new Response(JSON.stringify({ error: "Invalid company ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Adding credits:", { company_id, amount, user_id: user.id });

    // Create service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is a company admin
    const { data: adminCheck, error: adminError } = await supabase
      .from("company_users")
      .select("role")
      .eq("company_id", company_id)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .eq("status", "active")
      .maybeSingle();

    if (adminError || !adminCheck) {
      return new Response(JSON.stringify({ error: "Forbidden: You must be a company admin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current balance
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("credit_balance")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newBalance = (company.credit_balance || 0) + amount;

    // Update company credit balance
    const { error: updateError } = await supabase
      .from("companies")
      .update({ credit_balance: newBalance })
      .eq("id", company_id);

    if (updateError) {
      console.error("Error updating balance:", updateError);
      throw updateError;
    }

    // Log the credit addition in billing_credits (using service role to bypass RLS)
    const { error: creditLogError } = await supabase
      .from("billing_credits")
      .insert({
        company_id,
        amount,
        type: "manual_addition",
        description: description || `Manual credit addition of $${amount}`,
        created_by: user.id,
      });

    if (creditLogError) {
      console.error("Error logging credit:", creditLogError);
      // Don't throw - the credit was added, logging failed
    }

    console.log("Credits added successfully. New balance:", newBalance);

    return new Response(
      JSON.stringify({
        success: true,
        previousBalance: company.credit_balance || 0,
        amountAdded: amount,
        newBalance,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
