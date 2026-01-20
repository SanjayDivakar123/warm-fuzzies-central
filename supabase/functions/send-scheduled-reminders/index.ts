import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendReminderEmail(
  email: string,
  fullName: string | null,
  inviteCode: string,
  companyName: string,
  subdomain: string
) {
  const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
  const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN") || "rolecolorfinder.com";

  if (!mailgunApiKey || !mailgunDomain) {
    console.error("MAILGUN_API_KEY or MAILGUN_DOMAIN not configured");
    return false;
  }

  const portalUrl = `https://rolecolorfinder.lovable.app/company/${subdomain}/login`;
  const greeting = fullName ? `Hi ${fullName},` : "Hi there,";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reminder: Complete Your Assessment</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700;">⏰ Friendly Reminder</h1>
                </td>
              </tr>
              <tr>
                <td style="background: #ffffff; padding: 40px 30px;">
                  <p style="color: #555; margin: 0 0 8px 0;">${greeting}</p>
                  
                  <p style="color: #555; margin: 0 0 30px 0;">
                    This is a friendly reminder that you haven't completed your Role Color Assessment for <strong>${companyName}</strong> yet.
                    The assessment takes only about 10-15 minutes and will help your team understand your work style better.
                  </p>
                  
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #fafafa; border: 1px solid #e8e8e8; border-radius: 12px; margin: 0 0 30px 0;">
                    <tr>
                      <td style="padding: 28px; text-align: center;">
                        <p style="margin: 0 0 12px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Invite Code</p>
                        <p style="margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 6px; color: #f59e0b; font-family: 'Courier New', monospace;">${inviteCode}</p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #666; font-size: 14px; margin: 0 0 24px 0; text-align: center;">Log in with your email: <strong>${email}</strong></p>
                  
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="text-align: center; padding: 0 0 30px 0;">
                        <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 600; font-size: 16px;">Take Assessment Now</a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #888; font-size: 13px; margin: 0; text-align: center;">
                    Or go directly to: <a href="${portalUrl}" style="color: #f59e0b; word-break: break-all;">${portalUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background: #f0f0f0; padding: 24px 30px; text-align: center;">
                  <span style="color: #666; font-size: 13px;">Powered by <a href="https://rolecolorfinder.com" style="color: #f59e0b; text-decoration: none; font-weight: 600;">RoleColorFinder</a></span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const formData = new FormData();
    formData.append("from", `RoleColorFinder <no-reply@rolecolorfinder.com>`);
    formData.append("to", email);
    formData.append("subject", `Reminder: Complete your Role Color Assessment for ${companyName}`);
    formData.append("html", htmlContent);

    const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`api:${mailgunApiKey}`),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mailgun error:", response.status, errorText);
      return false;
    }

    console.log("Reminder email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all pending reminders that are due
    const now = new Date().toISOString();
    const { data: dueReminders, error: fetchError } = await supabase
      .from("scheduled_reminders")
      .select(`
        id,
        company_id,
        company_user_id,
        scheduled_for,
        company_users!inner (
          email,
          full_name,
          invite_code,
          status,
          assessment_completed_at
        ),
        companies!inner (
          name,
          subdomain
        )
      `)
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .limit(50);

    if (fetchError) {
      console.error("Error fetching reminders:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${dueReminders?.length || 0} due reminders`);

    const results = { sent: 0, skipped: 0, failed: 0 };

    for (const reminder of dueReminders || []) {
      const user = reminder.company_users as any;
      const company = reminder.companies as any;

      // Skip if user already completed assessment or is no longer invited
      if (user.assessment_completed_at || user.status !== "invited") {
        console.log(`Skipping reminder for ${user.email} - already completed or status changed`);
        
        await supabase
          .from("scheduled_reminders")
          .update({ status: "cancelled" })
          .eq("id", reminder.id);
        
        results.skipped++;
        continue;
      }

      // Send the reminder email
      const sent = await sendReminderEmail(
        user.email,
        user.full_name,
        user.invite_code,
        company.name,
        company.subdomain
      );

      if (sent) {
        await supabase
          .from("scheduled_reminders")
          .update({ 
            status: "sent",
            sent_at: new Date().toISOString()
          })
          .eq("id", reminder.id);
        
        results.sent++;
      } else {
        results.failed++;
      }
    }

    console.log("Reminder processing complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        processed: dueReminders?.length || 0,
        ...results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
