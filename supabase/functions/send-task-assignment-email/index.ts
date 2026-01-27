import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  taskId: string;
  assigneeId: string;
  companyName: string;
  design?: {
    headerColor: string;
    accentColor: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, body, taskId, assigneeId, companyName, design } = await req.json() as SendEmailRequest;

    if (!to || !subject || !body) {
      throw new Error("Missing required fields: to, subject, or body");
    }

    const headerColor = design?.headerColor || '#6366f1';
    const accentColor = design?.accentColor || '#8b5cf6';

    // Create HTML email with proper formatting
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${companyName}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Task Assignment</p>
          </div>
          <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
            ${body.split('\n').map(line => 
              line.trim() ? `<p style="margin: 0 0 15px 0;">${line}</p>` : ''
            ).join('')}
          </div>
          <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p>This email was sent via ${companyName}'s task management system.</p>
            <p style="margin-top: 10px;">Powered by Role Color Finder</p>
          </div>
        </body>
      </html>
    `;

    // Send the email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${companyName} <onboarding@resend.dev>`,
      to: [to],
      subject: subject,
      html: htmlBody,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      throw new Error(emailError.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    // Log the email send to the database (optional - for audit trail)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Update the task_assignments table to note that email was sent
      await supabase
        .from("task_assignments")
        .update({ 
          outcome_notes: `Email sent to assignee at ${new Date().toISOString()}` 
        })
        .eq("task_id", taskId)
        .eq("primary_assignee_id", assigneeId);
    } catch (dbError) {
      // Don't fail the request if logging fails
      console.error("Failed to log email send:", dbError);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: emailData?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-task-assignment-email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
