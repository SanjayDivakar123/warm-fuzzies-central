import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SendEmailRequest {
  to: string;
  subject: string;
  body?: string | null;
  customHtml?: string | null;
  taskId: string;
  assigneeId: string;
  companyName: string;
  senderEmail?: string;
  senderName?: string;
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
  </div>
`;

async function sendEmailViaMailgun(
  to: string,
  subject: string,
  htmlContent: string,
  companyName: string,
  replyTo?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
  const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN") || "rolecolorfinder.com";

  if (!mailgunApiKey) {
    console.error("MAILGUN_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  console.log("Sending email via Mailgun to:", to);

  const formData = new FormData();
  formData.append("from", `${companyName} <noreply@${mailgunDomain}>`);
  formData.append("to", to);
  formData.append("subject", subject);
  formData.append("html", htmlContent);
  
  if (replyTo) {
    formData.append("h:Reply-To", replyTo);
  }

  try {
    const response = await fetch(
      `https://api.mailgun.net/v3/${mailgunDomain}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
        },
        body: formData,
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      console.error("Mailgun error:", result);
      return { success: false, error: result.message || "Failed to send email" };
    }

    console.log("Email sent successfully:", result);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error("Mailgun request error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight first
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { to, subject, body, customHtml, taskId, assigneeId, companyName, senderEmail, senderName, design } = await req.json() as SendEmailRequest;

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to or subject" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body && !customHtml) {
      return new Response(
        JSON.stringify({ error: "Either body or customHtml must be provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const headerColor = design?.headerColor || '#6366f1';
    const accentColor = design?.accentColor || '#8b5cf6';

    let emailContent: string;

    if (customHtml) {
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

    // Send the email via Mailgun
    const emailResult = await sendEmailViaMailgun(
      to,
      subject,
      emailContent,
      companyName,
      senderEmail
    );

    if (!emailResult.success) {
      return new Response(
        JSON.stringify({ error: emailResult.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the email send to the database
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase
        .from("task_assignments")
        .update({ 
          outcome_notes: `Email sent to assignee at ${new Date().toISOString()}`,
          assigner_email: senderEmail || null,
        })
        .eq("task_id", taskId)
        .eq("primary_assignee_id", assigneeId);
    } catch (dbError) {
      console.error("Failed to log email send:", dbError);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: emailResult.messageId }),
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
