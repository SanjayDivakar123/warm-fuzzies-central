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
  body?: string | null;
  customHtml?: string | null;
  taskId: string;
  assigneeId: string;
  companyName: string;
  senderEmail?: string; // Admin's email for reply-to
  senderName?: string;  // Admin's name
  design?: {
    headerColor: string;
    accentColor: string;
  };
}

// RCF footer that always appears at the bottom
const getRcfFooter = (companyName: string) => `
  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px; border-top: 1px solid #e0e0e0; margin-top: 20px;">
    <p style="margin: 0 0 10px 0;">This email was sent via ${companyName}'s task management system.</p>
    <p style="margin: 0;">
      Powered by 
      <a href="https://rolecolorfinder.com" style="color: #6366f1; text-decoration: none; font-weight: 600;">
        RoleColorFinder
      </a>
    </p>
    <img src="https://rolecolorfinder.lovable.app/rcf-logo.png" alt="RoleColorFinder" width="80" style="margin-top: 10px; opacity: 0.8;">
  </div>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, body, customHtml, taskId, assigneeId, companyName, senderEmail, senderName, design } = await req.json() as SendEmailRequest;

    if (!to || !subject) {
      throw new Error("Missing required fields: to or subject");
    }

    if (!body && !customHtml) {
      throw new Error("Either body or customHtml must be provided");
    }

    const headerColor = design?.headerColor || '#6366f1';
    const accentColor = design?.accentColor || '#8b5cf6';

    let emailContent: string;

    if (customHtml) {
      // Custom HTML mode - user provides their own HTML, we just add the RCF footer
      emailContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="padding: 30px;">
                ${customHtml}
              </div>
              ${getRcfFooter(companyName)}
            </div>
          </body>
        </html>
      `;
    } else {
      // Text mode - standard template with the user's text
      emailContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%); padding: 20px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">${companyName}</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Task Assignment</p>
              </div>
              <div style="padding: 30px;">
                ${body!.split('\n').map(line => 
                  line.trim() ? `<p style="margin: 0 0 15px 0;">${line}</p>` : ''
                ).join('')}
              </div>
              ${getRcfFooter(companyName)}
            </div>
          </body>
        </html>
      `;
    }

    // Send the email with reply-to if sender email provided
    const emailOptions: any = {
      from: `${companyName} <onboarding@resend.dev>`,
      to: [to],
      subject: subject,
      html: emailContent,
    };

    // Add reply-to header so employee can reply to the admin
    if (senderEmail) {
      emailOptions.reply_to = senderEmail;
    }

    const { data: emailData, error: emailError } = await resend.emails.send(emailOptions);

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

      // Update the task_assignments table to note that email was sent and store assigner email
      await supabase
        .from("task_assignments")
        .update({ 
          outcome_notes: `Email sent to assignee at ${new Date().toISOString()}`,
          assigner_email: senderEmail || null,
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
