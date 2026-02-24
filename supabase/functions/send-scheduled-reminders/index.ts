import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MailgunResponse {
  id?: string;
  message?: string;
}

async function sendProbationReminderEmail(args: {
  email: string;
  adminName: string | null;
  companyName: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  probationPeriod: string;
  reminderDate: string;
}): Promise<{ sent: boolean; delivered: boolean }> {
  const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
  const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN") || "rolecolorfinder.com";

  if (!mailgunApiKey || !mailgunDomain) {
    console.error("MAILGUN_API_KEY or MAILGUN_DOMAIN not configured");
    return { sent: false, delivered: false };
  }

  const greeting = args.adminName ? `Hi ${args.adminName},` : "Hi,";
  const timestamp = Date.now();
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Probation Reminder</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 640px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-radius: 12px; overflow: hidden; background: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <tr>
                <td style="background: #064e3b; padding: 24px;">
                  <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600;">Probation Period Reminder</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px;">
                  <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;">${greeting}</p>
                  <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 15px;">
                    This is your reminder that the probation period has completed for the candidate below.
                  </p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e5e7eb; border-radius:8px;">
                    <tr>
                      <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; width:38%; color:#6b7280; font-size:13px;">Company</td>
                      <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; font-size:14px; color:#111827;">${args.companyName}</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:13px;">Candidate</td>
                      <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; font-size:14px; color:#111827;">${args.candidateName} (${args.candidateEmail})</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:13px;">Role</td>
                      <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; font-size:14px; color:#111827;">${args.jobTitle}</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:13px;">Probationary Period</td>
                      <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; font-size:14px; color:#111827;">${args.probationPeriod}</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 14px; color:#6b7280; font-size:13px;">Reminder Date</td>
                      <td style="padding:12px 14px; font-size:14px; color:#111827;">${args.reminderDate}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <p style="margin:10px 0 0; color:#9ca3af; font-size:12px; text-align:center;">
              Powered by RoleColorFinder <span style="display:none; color:transparent; font-size:1px;">${timestamp}</span>
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const formData = new FormData();
    formData.append("from", `RoleColorFinder <no-reply@${mailgunDomain}>`);
    formData.append("to", args.email);
    formData.append("subject", `Probation period complete: ${args.candidateName} (${args.jobTitle})`);
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
      console.error("Mailgun error (probation reminder):", response.status, errorText);
      return { sent: false, delivered: false };
    }

    const result: MailgunResponse = await response.json();
    return { sent: true, delivered: !!result.id };
  } catch (error) {
    console.error("Error sending probation reminder:", error);
    return { sent: false, delivered: false };
  }
}

async function sendReminderEmail(
  email: string,
  fullName: string | null,
  inviteCode: string,
  companyName: string,
  subdomain: string
): Promise<{ sent: boolean; delivered: boolean }> {
  const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
  const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN") || "rolecolorfinder.com";

  if (!mailgunApiKey || !mailgunDomain) {
    console.error("MAILGUN_API_KEY or MAILGUN_DOMAIN not configured");
    return { sent: false, delivered: false };
  }

  // Always use path-based URL
  const portalUrl = `https://rolecolorfinder.com/company/${subdomain}/login`;
  const greeting = fullName ? `Hi ${fullName},` : "Hi there,";
  const timestamp = Date.now();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reminder: Complete Your Assessment</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-radius: 12px; overflow: hidden; background: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <tr>
                <td style="background: #1a1a2e; padding: 32px 24px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600;">Assessment Reminder</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 24px;">
                  <p style="color: #374151; margin: 0 0 8px 0; font-size: 15px;">${greeting}</p>
                  
                  <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 15px;">
                    This is a friendly reminder to complete your Role Color Assessment for <strong style="color: #374151;">${companyName}</strong>. 
                    It only takes about 10-15 minutes.
                  </p>
                  
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 0 0 24px 0;">
                    <tr>
                      <td style="padding: 20px; text-align: center;">
                        <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Your Invite Code</p>
                        <p style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #1a1a2e; font-family: 'Courier New', monospace;">${inviteCode}</p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #9ca3af; font-size: 13px; margin: 0 0 20px 0; text-align: center;">Email: <strong style="color: #6b7280;">${email}</strong></p>
                  
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="text-align: center; padding: 0 0 24px 0;">
                        <a href="${portalUrl}" style="display: inline-block; background: #1a1a2e; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 14px;">Take Assessment</a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                    <a href="${portalUrl}" style="color: #6b7280;">${portalUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <span style="color: #9ca3af; font-size: 12px;">Powered by <a href="https://rolecolorfinder.com" style="color: #6b7280; text-decoration: none;">RoleColorFinder</a></span>
                  <span style="display: none; color: transparent; font-size: 1px;">${timestamp}</span>
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
    formData.append("subject", `Reminder: Complete your Role Color Assessment for ${companyName} [${timestamp}]`);
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
      return { sent: false, delivered: false };
    }

    const result: MailgunResponse = await response.json();
    console.log("Reminder email sent successfully to:", email, "Message ID:", result.id);
    
    // If we got a message ID, consider it delivered
    return { sent: true, delivered: !!result.id };
  } catch (error) {
    console.error("Error sending email:", error);
    return { sent: false, delivered: false };
  }
}

function getNextOccurrence(scheduledFor: string, recurrence: string): string | null {
  if (recurrence === 'once') return null;
  
  const date = new Date(scheduledFor);
  
  if (recurrence === 'daily') {
    date.setDate(date.getDate() + 1);
  } else if (recurrence === 'weekly') {
    date.setDate(date.getDate() + 7);
  }
  
  return date.toISOString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    const { data: dueReminders, error: fetchError } = await supabase
      .from("scheduled_reminders")
      .select(`
        id,
        company_id,
        company_user_id,
        scheduled_for,
        recurrence,
        company_users!inner (
          email,
          full_name,
          invite_code,
          status,
          assessment_completed_at
        ),
        companies!inner (
          name,
          subdomain,
          subdomain_enabled
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

    const results = {
      sent: 0,
      skipped: 0,
      failed: 0,
      recurring_created: 0,
      probation_sent: 0,
      probation_failed: 0,
    };

    for (const reminder of dueReminders || []) {
      const user = reminder.company_users as any;
      const company = reminder.companies as any;

      // Skip if user already completed assessment or is no longer invited
      if (user.assessment_completed_at || user.status !== "invited") {
        console.log(`Skipping reminder for ${user.email} - already completed or status changed`);
        
        await supabase
          .from("scheduled_reminders")
          .update({ status: "skipped" })
          .eq("id", reminder.id);
        
        results.skipped++;
        continue;
      }

      // Send the reminder email
      const { sent, delivered } = await sendReminderEmail(
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
            sent_at: new Date().toISOString(),
            delivery_status: delivered ? "delivered" : "failed"
          })
          .eq("id", reminder.id);
        
        results.sent++;

        // Create next occurrence for recurring reminders
        const nextOccurrence = getNextOccurrence(reminder.scheduled_for, reminder.recurrence);
        if (nextOccurrence) {
          const { error: insertError } = await supabase
            .from("scheduled_reminders")
            .insert({
              company_id: reminder.company_id,
              company_user_id: reminder.company_user_id,
              scheduled_for: nextOccurrence,
              recurrence: reminder.recurrence,
              status: "pending",
              created_by: null, // System created
            });

          if (insertError) {
            console.error("Error creating next recurring reminder:", insertError);
          } else {
            console.log(`Created next ${reminder.recurrence} reminder for ${user.email}`);
            results.recurring_created++;
          }
        }
      } else {
        await supabase
          .from("scheduled_reminders")
          .update({ 
            status: "sent",
            sent_at: new Date().toISOString(),
            delivery_status: "failed"
          })
          .eq("id", reminder.id);
        
        results.failed++;
      }
    }

    // Process due probation reminders (admin-specific reminder emails).
    const { data: dueProbationReminders, error: probationFetchError } = await supabase
      .from("offer_probation_reminders")
      .select("id, offer_id, company_id, admin_company_user_id, probation_period, reminder_at")
      .eq("status", "pending")
      .lte("reminder_at", now)
      .limit(50);

    if (probationFetchError) {
      console.error("Error fetching probation reminders:", probationFetchError);
      throw probationFetchError;
    }

    for (const reminder of dueProbationReminders || []) {
      const [adminResult, companyResult, offerResult] = await Promise.all([
        supabase
          .from("company_users")
          .select("email, full_name, status")
          .eq("id", reminder.admin_company_user_id)
          .single(),
        supabase
          .from("companies")
          .select("name")
          .eq("id", reminder.company_id)
          .single(),
        supabase
          .from("offers")
          .select(`
            id,
            job_title,
            candidate_application:candidate_applications (
              candidate:candidates (
                full_name,
                email
              )
            )
          `)
          .eq("id", reminder.offer_id)
          .single(),
      ]);

      const admin = adminResult.data as { email: string; full_name: string | null; status: string } | null;
      const company = companyResult.data as { name: string } | null;
      const offer = offerResult.data as {
        job_title: string | null;
        candidate_application?: { candidate?: { full_name?: string | null; email?: string | null } | null } | null;
      } | null;

      if (!admin?.email || admin.status !== "active") {
        await supabase
          .from("offer_probation_reminders")
          .update({ status: "failed", failure_reason: "Admin email not found or inactive" })
          .eq("id", reminder.id);
        results.probation_failed++;
        continue;
      }

      const candidateName = offer?.candidate_application?.candidate?.full_name || "Candidate";
      const candidateEmail = offer?.candidate_application?.candidate?.email || "N/A";
      const companyName = company?.name || "Your Company";
      const jobTitle = offer?.job_title || "the role";

      const reminderDate = new Date(reminder.reminder_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const { sent, delivered } = await sendProbationReminderEmail({
        email: admin.email,
        adminName: admin.full_name || null,
        companyName,
        candidateName,
        candidateEmail,
        jobTitle,
        probationPeriod: reminder.probation_period,
        reminderDate,
      });

      if (sent) {
        await supabase
          .from("offer_probation_reminders")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            failure_reason: delivered ? null : "Mail provider did not confirm delivery",
          })
          .eq("id", reminder.id);
        results.probation_sent++;
      } else {
        await supabase
          .from("offer_probation_reminders")
          .update({
            status: "failed",
            failure_reason: "Mailgun send failed",
          })
          .eq("id", reminder.id);
        results.probation_failed++;
      }
    }

    console.log("Reminder processing complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        processed: (dueReminders?.length || 0) + (dueProbationReminders?.length || 0),
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
