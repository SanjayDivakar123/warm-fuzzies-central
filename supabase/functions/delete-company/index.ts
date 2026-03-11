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

    const toHex = (buffer: ArrayBuffer) =>
      [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

    const sha256 = async (value: string) => {
      const bytes = new TextEncoder().encode(value);
      const hash = await crypto.subtle.digest("SHA-256", bytes);
      return toHex(hash);
    };

    const sendDeleteApprovalEmail = async (to: string, companyName: string, link: string) => {
      const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
      const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN") || "rolecolorfinder.com";

      if (!mailgunApiKey) {
        throw new Error("Email service is not configured");
      }

      const formData = new FormData();
      formData.append("from", `RoleColorFinder <support@${mailgunDomain}>`);
      formData.append("to", to);
      formData.append("subject", `Delete confirmation requested for ${companyName}`);
      formData.append(
        "html",
        `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #111827;">
    <p>A request was made to permanently delete <strong>${companyName}</strong>.</p>
    <p>To continue, open the secure link below. You will be asked to type the company name again before deletion.</p>
    <p><a href="${link}">Confirm Company Deletion</a></p>
    <p>This link expires in 24 hours.</p>
    <p>If you did not request this, you can ignore this email.</p>
  </body>
</html>`
      );

      const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send deletion email (${response.status}): ${errorText}`);
      }
    };

    const hardDeleteCompany = async (supabase: ReturnType<typeof createClient>, companyId: string) => {
      // Delete in order to respect foreign key constraints:
      const { error: taskAssignmentsError } = await supabase
        .from("task_assignments")
        .delete()
        .eq("company_id", companyId);

      if (taskAssignmentsError) throw new Error("Failed to delete task assignments");

      const { error: workTasksError } = await supabase
        .from("work_tasks")
        .delete()
        .eq("company_id", companyId);

      if (workTasksError) throw new Error("Failed to delete work tasks");

      const { error: companyUsersError } = await supabase
        .from("company_users")
        .delete()
        .eq("company_id", companyId);

      if (companyUsersError) throw new Error("Failed to delete company users");

      const { error: companyError } = await supabase
        .from("companies")
        .delete()
        .eq("id", companyId);

      if (companyError) throw new Error("Failed to delete company");
    };

    // Parse request body and require an explicit action so legacy payloads cannot alter flow.
    const body = await req.json();
    const action = typeof body?.action === "string" ? body.action : "";
    const company_id = typeof body?.company_id === "string" ? body.company_id : "";
    const token = typeof body?.token === "string" ? body.token : "";
    const company_name_confirmation = typeof body?.company_name_confirmation === "string"
      ? body.company_name_confirmation
      : "";

    if (action !== "request" && action !== "confirm") {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'request' or 'confirm'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "request" && !company_id) {
      return new Response(
        JSON.stringify({ error: "Missing company_id in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (action === "request") {
      const { data: companyUser, error: companyUserError } = await supabase
        .from("company_users")
        .select("id, role")
        .eq("company_id", company_id)
        .eq("user_id", user.id)
        .eq("role", "admin")
        .eq("status", "active")
        .single();

      if (companyUserError || !companyUser) {
        return new Response(
          JSON.stringify({ error: "You are not authorized to request deletion for this company" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, name, admin_email")
        .eq("id", company_id)
        .single();

      if (companyError || !company) {
        return new Response(
          JSON.stringify({ error: "Company not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const rawToken = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
      const tokenHash = await sha256(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error: insertError } = await supabase
        .from("company_deletion_requests")
        .insert({
          company_id: company.id,
          requested_by: user.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
        });

      if (insertError) {
        throw new Error("Failed to create deletion request");
      }

      const appUrl = Deno.env.get("APP_BASE_URL") || Deno.env.get("PUBLIC_APP_URL") || "https://rolecolorfinder.com";
      const confirmationLink = `${appUrl.replace(/\/$/, "")}/b2b/confirm-delete-company?token=${encodeURIComponent(rawToken)}`;

      await sendDeleteApprovalEmail(company.admin_email, company.name, confirmationLink);

      return new Response(
        JSON.stringify({ success: true, message: "Deletion confirmation email sent to owner" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "confirm") {
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Missing deletion token" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenHash = await sha256(token);
      const { data: requestRow, error: requestError } = await supabase
        .from("company_deletion_requests")
        .select("id, company_id, expires_at, consumed_at")
        .eq("token_hash", tokenHash)
        .maybeSingle();

      if (requestError || !requestRow) {
        return new Response(
          JSON.stringify({ error: "Invalid deletion link" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (requestRow.consumed_at) {
        return new Response(
          JSON.stringify({ error: "This deletion link has already been used" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (new Date(requestRow.expires_at).getTime() <= Date.now()) {
        return new Response(
          JSON.stringify({ error: "This deletion link has expired" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, name, admin_email")
        .eq("id", requestRow.company_id)
        .single();

      if (companyError || !company) {
        return new Response(
          JSON.stringify({ error: "Company not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: companyUser, error: companyUserError } = await supabase
        .from("company_users")
        .select("id")
        .eq("company_id", company.id)
        .eq("user_id", user.id)
        .eq("role", "admin")
        .eq("status", "active")
        .single();

      if (companyUserError || !companyUser || user.email?.toLowerCase() !== company.admin_email.toLowerCase()) {
        return new Response(
          JSON.stringify({ error: "Only the company owner can complete deletion" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!company_name_confirmation || company_name_confirmation !== company.name) {
        return new Response(
          JSON.stringify({ error: "Company name confirmation does not match" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await hardDeleteCompany(supabase, company.id);

      await supabase
        .from("company_deletion_requests")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", requestRow.id);

      return new Response(
        JSON.stringify({ success: true, message: "Company and all associated data deleted successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
