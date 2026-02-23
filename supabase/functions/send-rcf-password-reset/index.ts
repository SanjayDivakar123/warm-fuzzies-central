import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_SUPER_ADMINS = new Set([
  "sanjay@rolecolorfinder.com",
  "tristan@rolecolorfinder.com",
]);

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && email.length <= 255 && emailRegex.test(email);
}

async function sendResetEmail(params: { email: string; resetLink: string }): Promise<boolean> {
  const { email, resetLink } = params;

  const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
  const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN") || "rolecolorfinder.com";

  if (!mailgunApiKey || !mailgunDomain) {
    console.error("MAILGUN_API_KEY or MAILGUN_DOMAIN not configured");
    return false;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your Role Color Finder password</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <tr>
                <td style="background: linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%); padding: 36px 28px; text-align: center;">
                  <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 700;">Role Color Finder</h1>
                </td>
              </tr>
              <tr>
                <td style="background: #fff; padding: 32px 28px;">
                  <h2 style="margin: 0 0 14px 0; color: #111827; font-size: 22px;">Reset your password</h2>
                  <p style="margin: 0 0 22px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                    A Role Color Finder administrator requested a password reset for this account.
                  </p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="text-align: center; padding: 0 0 18px 0;">
                        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px;">Reset Password</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 0; color: #6b7280; font-size: 13px; text-align: center;">
                    If the button doesn't work, use this link:<br />
                    <a href="${resetLink}" style="color: #7E69AB; word-break: break-all;">${resetLink}</a>
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
    formData.append("from", "RoleColorFinder <no-reply@rolecolorfinder.com>");
    formData.append("to", email);
    formData.append("subject", "Reset your Role Color Finder password");
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
      console.error("Mailgun error sending reset email:", response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending reset email:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerEmail = (user.email || "").toLowerCase();
    if (!ALLOWED_SUPER_ADMINS.has(callerEmail)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const targetEmail = (body?.email || "").toString().trim().toLowerCase();

    if (!isValidEmail(targetEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: targetEmail,
      options: {
        redirectTo: "https://rolecolorfinder.com/reset-password",
      },
    });

    if (linkError) {
      throw linkError;
    }

    const resetLink = linkData?.properties?.action_link;
    if (!resetLink) {
      throw new Error("Unable to generate reset link");
    }

    const emailSent = await sendResetEmail({ email: targetEmail, resetLink });

    return new Response(
      JSON.stringify({
        success: true,
        email_sent: emailSent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in send-rcf-password-reset:", error);
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || "Unexpected error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
