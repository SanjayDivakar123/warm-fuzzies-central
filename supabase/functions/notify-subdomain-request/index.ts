import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubdomainRequestPayload {
  companyName: string;
  companyId: string;
  subdomain: string;
  adminEmail: string;
  requestedAt: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: SubdomainRequestPayload = await req.json();
    const { companyName, companyId, subdomain, adminEmail, requestedAt } = payload;

    console.log('Subdomain activation request:', { companyName, subdomain, adminEmail });

    const MAILGUN_API_KEY = Deno.env.get('MAILGUN_API_KEY');
    const MAILGUN_DOMAIN = Deno.env.get('MAILGUN_DOMAIN') || 'rolecolorfinder.com';

    if (!MAILGUN_API_KEY) {
      throw new Error('MAILGUN_API_KEY not configured');
    }

    const recipients = ['tristan@rolecolorfinder.com', 'sanjay@rolecolorfinder.com'];

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🌐 New Subdomain Request
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                A company has enabled their custom subdomain and needs it added to Lovable's domain settings.
              </p>
              
              <!-- Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Company Name</span><br>
                          <strong style="color: #111827; font-size: 16px;">${companyName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Subdomain to Add</span><br>
                          <code style="background-color: #dbeafe; color: #1d4ed8; padding: 4px 8px; border-radius: 4px; font-size: 16px; font-weight: 600;">${subdomain}.rolecolorfinder.com</code>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Admin Email</span><br>
                          <a href="mailto:${adminEmail}" style="color: #6366f1; font-size: 16px;">${adminEmail}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Company ID</span><br>
                          <code style="color: #6b7280; font-size: 12px;">${companyId}</code>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Requested At</span><br>
                          <span style="color: #111827; font-size: 14px;">${requestedAt}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Action Required -->
              <div style="margin-top: 24px; padding: 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⚡ Action Required:</strong><br>
                  Add <code style="background-color: #fde68a; padding: 2px 6px; border-radius: 3px;">${subdomain}.rolecolorfinder.com</code> to the Lovable project's custom domains in the project settings.
                </p>
              </div>
              
              <!-- Steps -->
              <div style="margin-top: 24px;">
                <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 600;">Steps to complete:</p>
                <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                  <li>Go to Lovable project settings → Domains</li>
                  <li>Add custom domain: <strong>${subdomain}.rolecolorfinder.com</strong></li>
                  <li>The subdomain will start working immediately (DNS is already configured)</li>
                </ol>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                RoleColorFinder B2B Platform • Automated notification
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

    // Send email via Mailgun
    const formData = new FormData();
    formData.append('from', 'RoleColorFinder <notifications@rolecolorfinder.com>');
    formData.append('to', recipients.join(','));
    formData.append('subject', `🌐 Subdomain Request: ${subdomain}.rolecolorfinder.com (${companyName})`);
    formData.append('html', emailHtml);

    const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
      },
      body: formData,
    });

    const result = await response.json();
    console.log('Mailgun response:', result);

    if (!response.ok) {
      throw new Error(`Mailgun error: ${result.message || 'Failed to send email'}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending subdomain notification:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
