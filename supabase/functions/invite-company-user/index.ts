import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation helpers
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && email.length <= 255 && emailRegex.test(email);
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof str === "string" && uuidRegex.test(str);
}

interface EmailTemplateSettings {
  subject?: string | null;
  greeting?: string | null;
  body?: string | null;
  ctaText?: string | null;
  showLogo?: boolean;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

function replaceVariables(text: string, vars: { companyName: string; email: string; inviteCode: string }) {
  return text
    .replace(/\{\{company_name\}\}/g, vars.companyName)
    .replace(/\{\{email\}\}/g, vars.email)
    .replace(/\{\{invite_code\}\}/g, vars.inviteCode);
}

async function sendInviteEmail(
  email: string, 
  inviteCode: string, 
  companyName: string, 
  subdomain: string,
  template?: EmailTemplateSettings
) {
  const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
  const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN") || "rolecolorfinder.com";

  if (!mailgunApiKey || !mailgunDomain) {
    console.error("MAILGUN_API_KEY or MAILGUN_DOMAIN not configured");
    return false;
  }

  console.log("Sending email via Mailgun domain:", mailgunDomain);

  // Always use path-based URL
  const portalUrl = `https://rolecolorfinder.com/company/${subdomain}/login`;
  const timestamp = new Date().getTime();
  
  // Template defaults
  const defaultSubject = `You're invited to take the Role Color Assessment for ${companyName}`;
  const defaultGreeting = "Hi there,";
  const defaultBody = `<strong style="color: #333;">${companyName}</strong> has invited you to take the Role Color Assessment. This assessment will help identify your work style and how you collaborate best with your team.`;
  const defaultCta = "Start Assessment";
  
  // Apply custom template or defaults
  const vars = { companyName, email, inviteCode };
  const subject = template?.subject 
    ? replaceVariables(template.subject, vars) 
    : defaultSubject;
  const greeting = template?.greeting 
    ? replaceVariables(template.greeting, vars) 
    : defaultGreeting;
  const bodyText = template?.body 
    ? replaceVariables(template.body, vars) 
    : defaultBody;
  const ctaText = template?.ctaText || defaultCta;
  const showLogo = template?.showLogo !== false;
  const logoUrl = template?.logoUrl;
  
  // Company colors with fallbacks
  const primaryColor = template?.primaryColor || "#9b87f5";
  const secondaryColor = template?.secondaryColor || "#7E69AB";

  // Build company logo section if applicable
  const logoSection = showLogo && logoUrl ? `
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="${logoUrl}" alt="${companyName}" style="max-height: 48px; max-width: 150px; object-fit: contain;">
    </div>
  ` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <title>You've been invited to Role Color Finder - ${timestamp}</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap" rel="stylesheet">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <tr>
                <td style="background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;">${companyName}</h1>
                </td>
              </tr>
              <tr>
                <td style="background: #ffffff; padding: 40px 30px;">
                  ${logoSection}
                  <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">You've been invited!</h2>
                  
                  <p style="color: #555; margin: 0 0 8px 0;">${greeting}</p>
                  
                  <p style="color: #555; margin: 0 0 30px 0;">${bodyText}</p>
                  
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #fafafa; border: 1px solid #e8e8e8; border-radius: 12px; margin: 0 0 30px 0;">
                    <tr>
                      <td style="padding: 28px; text-align: center;">
                        <p style="margin: 0 0 12px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Invite Code</p>
                        <p style="margin: 0 0 8px; font-size: 36px; font-weight: 700; letter-spacing: 6px; color: ${primaryColor}; font-family: 'Courier New', monospace;">${inviteCode}</p>
                        <p style="margin: 0; font-size: 12px; color: #e74c3c;">⏰ This code expires in 7 days</p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #666; font-size: 14px; margin: 0 0 24px 0; text-align: center;">Log in with your email: <strong>${email}</strong></p>
                  
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="text-align: center; padding: 0 0 30px 0;">
                        <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 600; font-size: 16px;">${ctaText}</a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #888; font-size: 13px; margin: 0; text-align: center;">
                    Or go directly to: <a href="${portalUrl}" style="color: ${primaryColor}; word-break: break-all;">${portalUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background: #f0f0f0; padding: 24px 30px; text-align: center;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                    <tr>
                      <td style="vertical-align: middle; padding-right: 8px;">
                        <a href="https://rolecolorfinder.com" style="text-decoration: none;">
                          <img src="https://rolecolorfinder.com/rcf-logo.png" alt="RoleColorFinder" width="80" height="24" style="display: block;">
                        </a>
                      </td>
                      <td style="vertical-align: middle;">
                        <span style="color: #666; font-size: 13px;">Powered by <a href="https://rolecolorfinder.com" style="color: ${primaryColor}; text-decoration: none; font-weight: 600;">RoleColorFinder</a></span>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #aaa; font-size: 11px; margin: 12px 0 0 0;">
                    Invitation from ${companyName} · <span style="color: transparent; font-size: 1px;">${timestamp}</span>
                  </p>
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
    formData.append("subject", subject);
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

    console.log("Invite email sent successfully to:", email);
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
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Verify user's JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      console.log("Invalid token:", authError?.message);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { company_id, email, full_name, job_role, role: requestedRole, assessment_category, assessment_type, skills } = body;

    // Input validation
    if (!company_id || !email) {
      return new Response(JSON.stringify({ error: "Company ID and email are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isValidUUID(company_id)) {
      return new Response(JSON.stringify({ error: "Invalid company ID format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Inviting user:", { company_id, email });

    // Create service role client for data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is a company admin
    const { data: adminCheck, error: adminError } = await supabase
      .from("company_users")
      .select("role")
      .eq("company_id", company_id)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .eq("status", "active")
      .maybeSingle();

    if (adminError || !adminCheck) {
      console.log("User is not a company admin for this company. User ID:", user.id, "Company ID:", company_id);
      return new Response(
        JSON.stringify({
          error:
            "Forbidden: You must be a company admin for this company. Please ensure you are logged into the correct account.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("company_users")
      .select("id, status")
      .eq("company_id", company_id)
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    // Get company details including email template settings
    const { data: company } = await supabase
      .from("companies")
      .select("seats_purchased, name, subdomain, subdomain_enabled, logo_url, email_template_subject, email_template_greeting, email_template_body, email_template_cta_text, email_show_logo, primary_color, secondary_color")
      .eq("id", company_id)
      .single();

    if (!company) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If user exists and is not revoked, return error
    if (existingUser && existingUser.status !== "revoked") {
      return new Response(JSON.stringify({ error: "User already invited" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check seats available
    const { data: activeUsers } = await supabase
      .from("company_users")
      .select("id")
      .eq("company_id", company_id)
      .neq("status", "revoked");

    // Special case: RoleColorFinder LLC has unlimited users
    // All other companies are capped at 20,000 users max
    const isUnlimitedCompany = company.name === "RoleColorFinder LLC";
    const maxSeatsAllowed = 20000;
    const effectiveSeats = isUnlimitedCompany ? Infinity : Math.min(company.seats_purchased, maxSeatsAllowed);

    if (activeUsers && activeUsers.length >= effectiveSeats) {
      return new Response(
        JSON.stringify({
          error: isUnlimitedCompany ? "No seats available" : "No seats available (maximum 20,000 users per company)",
          errorCode: "NO_SEATS",
          seatsUsed: activeUsers.length,
          seatsPurchased: company.seats_purchased,
          maxAllowed: isUnlimitedCompany ? null : maxSeatsAllowed,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ============ CHARGE FOR INVITE ============
    // Call charge-invite function to handle billing
    console.log("Attempting to charge for invite...");
    
    const chargeResponse = await fetch(`${supabaseUrl}/functions/v1/charge-invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({ company_id }),
    });

    const chargeResult = await chargeResponse.json();
    console.log("Charge result:", chargeResult);

    if (!chargeResult.success) {
      // Check if they need to add a payment method
      if (chargeResult.needsPaymentMethod) {
        return new Response(
          JSON.stringify({
            error: "Please add a payment method before inviting users",
            errorCode: "NEEDS_PAYMENT_METHOD",
            needsPaymentMethod: true,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({
          error: chargeResult.error || "Failed to process payment for invite",
          errorCode: "CHARGE_FAILED",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Charge successful - proceeding with invite");

    // Generate invite code
    const { data: inviteCodeData } = await supabase.rpc("generate_invite_code");
    const inviteCode = inviteCodeData;

    let invitedUser;

    // Determine charge info from result
    const chargeAmount = chargeResult.charged ? 2000 : (chargeResult.usedCredits ? chargeResult.creditsUsed : 0);
    const chargedAt = (chargeResult.charged || chargeResult.usedCredits) ? new Date().toISOString() : null;

    // If user was revoked, update their record
    if (existingUser && existingUser.status === "revoked") {
      const { data: updatedUser, error: updateError } = await supabase
        .from("company_users")
        .update({
          status: "invited",
          invite_code: inviteCode,
          invited_at: new Date().toISOString(),
          joined_at: null,
          assessment_completed_at: null,
          assessment_result_id: null,
          charge_amount: chargeAmount,
          charged_at: chargedAt,
        })
        .eq("id", existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error re-inviting user:", updateError);
        throw updateError;
      }
      invitedUser = updatedUser;
      console.log("User re-invited:", invitedUser.id);
    } else {
      // Create new user invite
      // Validate role - allow admin-level roles and employee
      const allowedRoles = ['admin', 'hr', 'partner', 'employee'];
      const userRole = allowedRoles.includes(requestedRole) ? requestedRole : 'employee';
      
      const { data: newUser, error: userError } = await supabase
        .from("company_users")
        .insert({
          company_id,
          email: email.toLowerCase().trim(),
          full_name: full_name || null,
          job_role: job_role || null,
          role: userRole,
          status: "invited",
          invite_code: inviteCode,
          charge_amount: chargeAmount,
          charged_at: chargedAt,
          assessment_category: assessment_category || null,
          assessment_type: assessment_type || null,
          skills: skills || [],
        })
        .select()
        .single();

      if (userError) {
        console.error("Error creating user invite:", userError);
        throw userError;
      }
      invitedUser = newUser;
      console.log("User invited:", invitedUser.id);
    }

    // Send invitation email with custom template if available
    const templateSettings: EmailTemplateSettings = {
      subject: company.email_template_subject,
      greeting: company.email_template_greeting,
      body: company.email_template_body,
      ctaText: company.email_template_cta_text,
      showLogo: company.email_show_logo !== false,
      logoUrl: company.logo_url,
      primaryColor: company.primary_color,
      secondaryColor: company.secondary_color,
    };
    const emailSent = await sendInviteEmail(email.toLowerCase().trim(), inviteCode, company.name, company.subdomain, templateSettings);

    // === SLACK DM INVITE ===
    // Send Slack DM invite if Slack is enabled for this company
    let slackDmSent = false;
    try {
      // Check if company has Slack enabled
      const { data: companySlack } = await supabase
        .from('companies')
        .select('slack_notifications_enabled, slack_bot_token')
        .eq('id', company_id)
        .single();

      if (companySlack?.slack_notifications_enabled && companySlack?.slack_bot_token) {
        console.log('Attempting to send Slack DM invite...');
        
        const slackResponse = await fetch(`${supabaseUrl}/functions/v1/send-slack-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            company_id: company_id,
            event_type: 'dm_invite',
            data: {
              email: email.toLowerCase().trim(),
              invite_code: inviteCode,
              full_name: full_name || null,
            }
          })
        });

        const slackResult = await slackResponse.json();
        slackDmSent = slackResult.success === true;
        console.log('Slack DM result:', slackResult);
      }
    } catch (slackError) {
      console.error('Slack DM error (non-fatal):', slackError);
    }

    // Log the invite action to audit_logs (fire-and-forget)
    supabase.from('audit_logs').insert({
      company_id,
      user_id: user.id,
      user_email: user.email,
      action: 'invite',
      entity_type: 'user',
      entity_id: invitedUser.id,
      details: {
        email: email.toLowerCase().trim(),
        full_name: full_name || null,
        role: invitedUser.role,
      },
    }).then(({ error }) => {
      if (error) console.error('Audit log insert failed (non-fatal):', error.message);
    });

    return new Response(JSON.stringify({ 
      user: invitedUser, 
      emailSent,
      slackDmSent,
      billing: {
        charged: chargeResult.charged || false,
        usedCredits: chargeResult.usedCredits || false,
        amount: chargeAmount,
        proRatedAmount: chargeResult.proRatedAmount || chargeAmount,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
