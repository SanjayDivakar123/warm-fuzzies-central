import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    const { assignmentId } = await req.json();

    if (!assignmentId) {
      throw new Error("Missing assignmentId");
    }

    // Fetch assignment with task and assignee details
    const { data: assignment, error: assignmentError } = await supabase
      .from("task_assignments")
      .select(`
        id,
        assigner_email,
        notification_sent_at,
        employee_completed_at,
        primary_assignee_id,
        notify_on_completion,
        task:work_tasks (
          id,
          title,
          description,
          company_id
        ),
        assignee:company_users!task_assignments_primary_assignee_id_fkey (
          email,
          full_name
        )
      `)
      .eq("id", assignmentId)
      .single();

    if (assignmentError || !assignment) {
      console.error("Assignment not found:", assignmentError);
      throw new Error("Assignment not found");
    }

    // Don't send duplicate notifications
    if (assignment.notification_sent_at) {
      return new Response(
        JSON.stringify({ success: true, message: "Notification already sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const task = assignment.task as any;
    const assignee = assignment.assignee as any;

    // Check per-assignment notification preference first
    if (assignment.notify_on_completion === false) {
      console.log("Per-assignment notifications disabled for this task");
      return new Response(
        JSON.stringify({ success: true, message: "Per-assignment notifications disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!assignment.assigner_email) {
      console.log("No assigner email found, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "No assigner email configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  // Check if the assigner has opted in to completion notifications
  const { data: assignerUser } = await supabase
    .from("company_users")
    .select("notify_task_completion")
    .eq("email", assignment.assigner_email)
    .eq("company_id", (assignment.task as any).company_id)
    .single();

  // Default to true if not set, but respect explicit opt-out
  if (assignerUser && assignerUser.notify_task_completion === false) {
    console.log("Assigner has opted out of completion notifications");
    return new Response(
      JSON.stringify({ success: true, message: "Assigner opted out of notifications" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get company info
  const { data: company } = await supabase
    .from("companies")
      .select("name, primary_color, secondary_color")
      .eq("id", task.company_id)
      .single();

    const companyName = company?.name || "RoleColorFinder";
    const primaryColor = company?.primary_color || "#6366f1";
    const secondaryColor = company?.secondary_color || "#8b5cf6";
    const assigneeName = assignee?.full_name || assignee?.email?.split("@")[0] || "Team member";
    const completedAt = assignment.employee_completed_at 
      ? new Date(assignment.employee_completed_at).toLocaleString()
      : new Date().toLocaleString();

    // Send email to assigner
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Task Completed</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">✓ Task Completed</h1>
            </div>
            <div style="padding: 30px;">
              <p style="margin: 0 0 15px 0;">Great news! A task you assigned has been completed.</p>
              
              <div style="background: #f8f9fa; border-left: 4px solid ${primaryColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 10px 0; color: ${primaryColor};">${task.title}</h3>
                ${task.description ? `<p style="margin: 0; color: #666; font-size: 14px;">${task.description}</p>` : ''}
              </div>
              
              <table style="width: 100%; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Completed by:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${assigneeName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Completed at:</td>
                  <td style="padding: 8px 0;">${completedAt}</td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">
                You can view more details in your admin dashboard.
              </p>
            </div>
            <div style="text-align: center; padding: 20px; color: #888; font-size: 12px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0;">Powered by <a href="https://rolecolorfinder.com" style="color: ${primaryColor}; text-decoration: none; font-weight: 600;">RoleColorFinder</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${companyName} <onboarding@resend.dev>`,
      to: [assignment.assigner_email],
      subject: `✓ Task Completed: ${task.title}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      throw new Error(emailError.message || "Failed to send email");
    }

    console.log("Completion notification sent:", emailData);

    // Mark notification as sent
    await supabase
      .from("task_assignments")
      .update({ notification_sent_at: new Date().toISOString() })
      .eq("id", assignmentId);

    return new Response(
      JSON.stringify({ success: true, messageId: emailData?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-task-completion:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
