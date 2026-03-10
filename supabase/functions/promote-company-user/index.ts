import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_ROLES = ["admin", "hr", "partner"] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof value === "string" && uuidRegex.test(value);
}

async function findAuthUserIdByEmail(supabase: any, email: string): Promise<string | null> {
  const normalizedEmail = email.toLowerCase();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) throw error;

    const users = data?.users || [];
    const match = users.find((user: any) => (user.email || "").toLowerCase() === normalizedEmail);
    if (match?.id) return match.id;

    if (users.length < 1000) break;
    page += 1;
  }

  return null;
}

async function sendAdminPromotionEmail(params: {
  email: string;
  companyName: string;
  subdomain: string;
  role: AllowedRole;
  setupLink?: string | null;
}): Promise<boolean> {
  const { email, companyName, subdomain, role, setupLink } = params;
  const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
  const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN") || "rolecolorfinder.com";

  if (!mailgunApiKey || !mailgunDomain) {
    console.error("MAILGUN_API_KEY or MAILGUN_DOMAIN not configured");
    return false;
  }

  const roleLabel = role === "hr" ? "HR Admin" : role === "partner" ? "Partner Admin" : "Admin";
  const adminPortalUrl = subdomain
    ? `https://rolecolorfinder.com/company/${subdomain}/admin`
    : "https://rolecolorfinder.com";

  const setupSection = setupLink
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; margin: 0 0 24px 0;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 8px 0; color: #111827; font-weight: 600;">Create your password and account</p>
            <p style="margin: 0; color: #4b5563; font-size: 14px;">Use the button below to finish account setup. This link lets you create your password and activate your Role Color Finder account.</p>
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="text-align: center; padding: 0 0 28px 0;">
            <a href="${setupLink}" style="display: inline-block; background: linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px;">Create Password & Account</a>
          </td>
        </tr>
      </table>
    `
    : "";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You've been upgraded to ${roleLabel}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <tr>
                <td style="background: linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%); padding: 36px 28px; text-align: center;">
                  <h1 style="margin: 0; color: #fff; font-size: 26px; font-weight: 700;">${companyName}</h1>
                </td>
              </tr>
              <tr>
                <td style="background: #fff; padding: 32px 28px;">
                  <h2 style="margin: 0 0 14px 0; color: #111827; font-size: 22px;">You're now a ${roleLabel}</h2>
                  <p style="margin: 0 0 22px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                    Your access has been upgraded for <strong>${companyName}</strong>. You can now sign in to the company dashboard with admin-level permissions.
                  </p>
                  ${setupSection}
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="text-align: center; padding: 0 0 18px 0;">
                        <a href="${adminPortalUrl}" style="display: inline-block; background: linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px;">Open Admin Dashboard</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 0; color: #6b7280; font-size: 13px; text-align: center;">
                    Admin sign-in URL:<br />
                    <a href="${adminPortalUrl}" style="color: #7E69AB; word-break: break-all;">${adminPortalUrl}</a>
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
    formData.append("subject", `You've been upgraded to ${roleLabel} at ${companyName}`);
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
      console.error("Mailgun error sending admin promotion email:", response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending admin promotion email:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
      error: callerError,
    } = await authClient.auth.getUser();

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const companyUserId = (body?.company_user_id || body?.companyUserId || "").toString();
    const role = (body?.role || "").toString().toLowerCase() as AllowedRole;

    if (!isValidUUID(companyUserId)) {
      return new Response(JSON.stringify({ error: "Invalid company user id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role supplied" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: targetUser, error: targetUserError } = await supabase
      .from("company_users")
      .select("id, company_id, email, user_id, role, status, full_name, companies(name, subdomain)")
      .eq("id", companyUserId)
      .maybeSingle();

    if (targetUserError || !targetUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminCheck } = await supabase
      .from("company_users")
      .select("id")
      .eq("company_id", targetUser.company_id)
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .eq("status", "active")
      .maybeSingle();

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: "Forbidden: admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = (targetUser.email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      return new Response(JSON.stringify({ error: "Target user email is missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let resolvedUserId: string | null = targetUser.user_id || null;
    let createdAuthInvite = false;
    let setupLink: string | null = null;

    if (!resolvedUserId) {
      resolvedUserId = await findAuthUserIdByEmail(supabase, normalizedEmail);
    }

    if (!resolvedUserId) {
      const companySubdomain = targetUser.companies?.subdomain || "";
      const redirectTo = companySubdomain
        ? `https://rolecolorfinder.com/company/${companySubdomain}/admin`
        : "https://rolecolorfinder.com";

      const { data: inviteData, error: inviteError } = await supabase.auth.admin.generateLink({
        type: "invite",
        email: normalizedEmail,
        options: {
          redirectTo,
          data: targetUser.full_name ? { full_name: targetUser.full_name } : undefined,
        },
      });

      if (inviteError) {
        throw inviteError;
      }

      resolvedUserId = inviteData?.user?.id || null;
      setupLink = inviteData?.properties?.action_link || null;
      createdAuthInvite = true;

      if (!resolvedUserId) {
        resolvedUserId = await findAuthUserIdByEmail(supabase, normalizedEmail);
      }
    }

    if (!resolvedUserId) {
      return new Response(
        JSON.stringify({
          error: "Unable to link the promoted user to a Role Color Finder account. Promotion was not applied.",
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const updatePayload: Record<string, unknown> = {
      role,
      user_id: resolvedUserId,
    };

    const { data: updatedUser, error: updateError } = await supabase
      .from("company_users")
      .update(updatePayload)
      .eq("id", companyUserId)
      .select("*")
      .single();

    if (updateError) throw updateError;

    const companyName = targetUser.companies?.name || "Your Company";
    const companySubdomain = targetUser.companies?.subdomain || "";
    const emailSent = await sendAdminPromotionEmail({
      email: normalizedEmail,
      companyName,
      subdomain: companySubdomain,
      role,
      setupLink,
    });

    return new Response(
      JSON.stringify({
        user: updatedUser,
        createdAuthInvite,
        hasLinkedAuthUser: Boolean(resolvedUserId),
        emailSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in promote-company-user:", error);
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || "Unexpected error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
