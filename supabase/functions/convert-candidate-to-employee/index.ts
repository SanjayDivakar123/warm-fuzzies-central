import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { candidateId } = await req.json();

    if (!candidateId) {
      return new Response(
        JSON.stringify({ error: "candidateId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch candidate
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      console.error("Candidate not found:", candidateError);
      return new Response(
        JSON.stringify({ error: "Candidate not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (candidate.status !== "assessment_completed") {
      return new Response(
        JSON.stringify({ error: "Only candidates with completed assessments can be hired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already converted
    if (candidate.converted_to_employee_id) {
      return new Response(
        JSON.stringify({ error: "This candidate has already been hired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get assessment result for dominant color
    let dominantColor = null;
    if (candidate.assessment_result_id) {
      const { data: result } = await supabase
        .from("assessment_results")
        .select("results")
        .eq("id", candidate.assessment_result_id)
        .single();
      
      dominantColor = result?.results?.dominantColor || null;
    }

    // Create employee record
    const { data: employee, error: employeeError } = await supabase
      .from("company_users")
      .insert({
        company_id: candidate.company_id,
        email: candidate.email,
        full_name: candidate.full_name,
        job_role: candidate.position_title,
        role: "employee",
        status: "active",
        assessment_category: candidate.assessment_category,
        assessment_type: candidate.assessment_type,
        assessment_result_id: candidate.assessment_result_id,
        assessment_completed_at: candidate.assessment_completed_at,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (employeeError) {
      // Check if employee already exists
      if (employeeError.code === "23505") {
        return new Response(
          JSON.stringify({ error: "This person is already an employee" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("Failed to create employee:", employeeError);
      return new Response(
        JSON.stringify({ error: "Failed to create employee record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update candidate status
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        status: "hired",
        converted_to_employee_id: employee.id,
      })
      .eq("id", candidateId);

    if (updateError) {
      console.error("Failed to update candidate status:", updateError);
    }

    console.log(`Candidate ${candidate.email} converted to employee ${employee.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        employee,
        message: `${candidate.full_name || candidate.email} has been hired as an employee`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in convert-candidate-to-employee:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});