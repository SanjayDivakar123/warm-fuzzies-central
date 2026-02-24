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

    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id, company_id, email, full_name, status, converted_to_employee_id")
      .eq("id", candidateId)
      .maybeSingle();

    if (candidateError || !candidate) {
      return new Response(
        JSON.stringify({ error: "Candidate not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (candidate.status !== "hired") {
      return new Response(
        JSON.stringify({ error: "Only hired candidates can be unhired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const employeeId = candidate.converted_to_employee_id;

    const { error: resetCandidateError } = await supabase
      .from("candidates")
      .update({
        status: "assessment_completed",
        converted_to_employee_id: null,
      })
      .eq("id", candidate.id);

    if (resetCandidateError) {
      return new Response(
        JSON.stringify({ error: "Failed to restore candidate to active pipeline" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (employeeId) {
      const { error: deleteByIdError } = await supabase
        .from("company_users")
        .delete()
        .eq("id", employeeId)
        .eq("company_id", candidate.company_id)
        .eq("role", "employee");

      if (deleteByIdError) {
        return new Response(
          JSON.stringify({ error: "Candidate was restored, but removing linked employee failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Defensive cleanup for legacy rows: remove any employee user with same company+email.
    const { error: deleteByEmailError } = await supabase
      .from("company_users")
      .delete()
      .eq("company_id", candidate.company_id)
      .eq("email", candidate.email)
      .eq("role", "employee");

    if (deleteByEmailError) {
      return new Response(
        JSON.stringify({ error: "Candidate was restored, but removing employee user entry failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: remainingEmployees, error: remainingEmployeesError } = await supabase
      .from("company_users")
      .select("id")
      .eq("company_id", candidate.company_id)
      .eq("email", candidate.email)
      .eq("role", "employee")
      .limit(1);

    if (remainingEmployeesError || (remainingEmployees && remainingEmployees.length > 0)) {
      return new Response(
        JSON.stringify({ error: "Candidate was restored, but user still appears in company users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${candidate.full_name || candidate.email} was unhired and returned to candidates`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
