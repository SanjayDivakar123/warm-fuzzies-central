import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Get authorization header to verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify identity
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { company_id } = await req.json();

    if (!company_id) {
      return new Response(
        JSON.stringify({ error: "Missing company_id in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify user is an admin of this company
    const { data: companyUser, error: companyUserError } = await supabase
      .from("company_users")
      .select("id, role")
      .eq("company_id", company_id)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .eq("status", "active")
      .single();

    if (companyUserError || !companyUser) {
      console.error("Company user verification failed:", companyUserError);
      return new Response(
        JSON.stringify({ error: "You are not authorized to delete this company" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${user.id} is deleting company ${company_id}`);

    // Delete in order to respect foreign key constraints:
    // 1. Delete task_assignments (references work_tasks and company_users)
    const { error: taskAssignmentsError } = await supabase
      .from("task_assignments")
      .delete()
      .eq("company_id", company_id);

    if (taskAssignmentsError) {
      console.error("Error deleting task_assignments:", taskAssignmentsError);
      throw new Error("Failed to delete task assignments");
    }
    console.log("Deleted task_assignments");

    // 2. Delete work_tasks
    const { error: workTasksError } = await supabase
      .from("work_tasks")
      .delete()
      .eq("company_id", company_id);

    if (workTasksError) {
      console.error("Error deleting work_tasks:", workTasksError);
      throw new Error("Failed to delete work tasks");
    }
    console.log("Deleted work_tasks");

    // 3. Delete company_users
    const { error: companyUsersError } = await supabase
      .from("company_users")
      .delete()
      .eq("company_id", company_id);

    if (companyUsersError) {
      console.error("Error deleting company_users:", companyUsersError);
      throw new Error("Failed to delete company users");
    }
    console.log("Deleted company_users");

    // 4. Delete the company itself
    const { error: companyError } = await supabase
      .from("companies")
      .delete()
      .eq("id", company_id);

    if (companyError) {
      console.error("Error deleting company:", companyError);
      throw new Error("Failed to delete company");
    }
    console.log("Deleted company");

    return new Response(
      JSON.stringify({ success: true, message: "Company and all associated data deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error in delete-company:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
