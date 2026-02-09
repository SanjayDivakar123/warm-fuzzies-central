import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_INVITES = 3;

// Input validation helpers
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return typeof str === 'string' && uuidRegex.test(str)
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
  const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY');
  const mailgunDomain = Deno.env.get('MAILGUN_DOMAIN') || 'rolecolorfinder.com';
  
  if (!mailgunApiKey || !mailgunDomain) {
    console.error('MAILGUN_API_KEY or MAILGUN_DOMAIN not configured');
    return false;
  }
  
  console.log('Sending email via Mailgun domain:', mailgunDomain);

  // Always use path-based URL
  const portalUrl = `https://rolecolorfinder.com/company/${subdomain}/login`;
  const timestamp = new Date().getTime();
  
  // Template defaults for reminder email
  const defaultSubject = `Reminder: Take your Role Color Assessment for ${companyName}`;
  const defaultGreeting = "Hi there,";
  const defaultBody = `This is a reminder that <strong style="color: #333;">${companyName}</strong> has invited you to take the Role Color Assessment. Don't miss out on discovering your work style!`;
  const defaultCta = "Start Assessment";
  
  // Apply custom template or defaults
  const vars = { companyName, email, inviteCode };
  const subject = template?.subject 
    ? `Reminder: ${replaceVariables(template.subject, vars)}` 
    : defaultSubject;
  const greeting = template?.greeting 
    ? replaceVariables(template.greeting, vars) 
    : defaultGreeting;
  const bodyText = template?.body 
    ? `This is a reminder: ${replaceVariables(template.body, vars)}` 
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
      <title>Reminder: Complete your Role Color Assessment - ${timestamp}</title>
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
                  <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">Reminder: Complete your assessment</h2>
                  
                  <p style="color: #555; margin: 0 0 8px 0;">${greeting}</p>
                  
                  <p style="color: #555; margin: 0 0 30px 0;">${bodyText}</p>
                  
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #fafafa; border: 1px solid #e8e8e8; border-radius: 12px; margin: 0 0 30px 0;">
                    <tr>
                      <td style="padding: 28px; text-align: center;">
                        <p style="margin: 0 0 12px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Invite Code</p>
                        <p style="margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 6px; color: ${primaryColor}; font-family: 'Courier New', monospace;">${inviteCode}</p>
                      </td>
                    </tr>
                  </table>
                  
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
                          <img src="https://rolecolorfinder.lovable.app/rcf-logo.png" alt="RoleColorFinder" width="100" height="24" style="display: block;">
                        </a>
                      </td>
                      <td style="vertical-align: middle;">
                        <span style="color: #666; font-size: 13px;">Powered by <a href="https://rolecolorfinder.com" style="color: ${primaryColor}; text-decoration: none; font-weight: 600;">RoleColorFinder</a></span>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #aaa; font-size: 11px; margin: 12px 0 0 0;">
                    Reminder from ${companyName} · <span style="color: transparent; font-size: 1px;">${timestamp}</span>
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
    formData.append('from', `RoleColorFinder <no-reply@rolecolorfinder.com>`);
    formData.append('to', email);
    formData.append('subject', subject);
    formData.append('html', htmlContent);

    const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`api:${mailgunApiKey}`),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mailgun error:', response.status, errorText);
      return false;
    }

    console.log('Resend invite email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Verify user's JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.log('Invalid token:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { user_id } = body;

    // Input validation
    if (!user_id || !isValidUUID(user_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Resending invite for user:', user_id);

    // Create service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user details
    const { data: targetUser, error: userError } = await supabase
      .from('company_users')
      .select('*, companies(name, subdomain, subdomain_enabled, logo_url, email_template_subject, email_template_greeting, email_template_body, email_template_cta_text, email_show_logo, primary_color, secondary_color)')
      .eq('id', user_id)
      .single();

    if (userError || !targetUser) {
      console.error('User not found:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller is an admin for this company
    const { data: adminCheck } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', targetUser.company_id)
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('status', 'active')
      .maybeSingle();

    if (!adminCheck) {
      console.log('User is not a company admin');
      return new Response(
        JSON.stringify({ error: 'Forbidden: You must be a company admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (targetUser.status !== 'invited') {
      console.log('User status is not invited:', targetUser.status);
      return new Response(
        JSON.stringify({ error: `User is not in invited status (current: ${targetUser.status})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentCount = targetUser.invite_count || 1;
    
    if (currentCount >= MAX_INVITES) {
      console.log('Max invites reached:', currentCount);
      return new Response(
        JSON.stringify({ error: `Maximum invite limit reached (${currentCount}/${MAX_INVITES})`, invite_count: currentCount }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new invite code
    const { data: inviteCodeData } = await supabase.rpc('generate_invite_code');
    const inviteCode = inviteCodeData;

    // Update user with new invite code
    const { error: updateError } = await supabase
      .from('company_users')
      .update({
        invite_code: inviteCode,
        invite_count: currentCount + 1,
        invited_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      throw updateError;
    }

    // Send email with custom template if available
    const company = targetUser.companies as { name: string; subdomain: string; subdomain_enabled?: boolean; logo_url?: string; email_template_subject?: string; email_template_greeting?: string; email_template_body?: string; email_template_cta_text?: string; email_show_logo?: boolean; primary_color?: string; secondary_color?: string } | null;
    const templateSettings: EmailTemplateSettings = {
      subject: company?.email_template_subject,
      greeting: company?.email_template_greeting,
      body: company?.email_template_body,
      ctaText: company?.email_template_cta_text,
      showLogo: company?.email_show_logo !== false,
      logoUrl: company?.logo_url,
      primaryColor: company?.primary_color,
      secondaryColor: company?.secondary_color,
    };
    const emailSent = await sendInviteEmail(
      targetUser.email,
      inviteCode,
      company?.name || 'Your Company',
      company?.subdomain || '',
      templateSettings
    );

    console.log('Invite resent, email sent:', emailSent, 'new count:', currentCount + 1);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailSent, 
        invite_count: currentCount + 1,
        remaining: MAX_INVITES - (currentCount + 1)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
