const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SendCandidateEmailRequest {
  to: string;
  subject: string;
  message: string;
  candidateName: string;
  companyName: string;
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const buildEmailHtml = (payload: SendCandidateEmailRequest) => {
  const candidateName = escapeHtml(payload.candidateName || "Candidate");
  const companyName = escapeHtml(payload.companyName || "Hiring Team");
  const subject = escapeHtml(payload.subject);
  const message = escapeHtml(payload.message).replaceAll("\n", "<br />");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin:0; padding:0; background:#f4f6fb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
            <tr>
              <td style="background:linear-gradient(135deg,#111827 0%,#1f2937 100%); padding:24px 28px;">
                <p style="margin:0; color:#d1d5db; font-size:12px; letter-spacing:.08em; text-transform:uppercase;">Candidate Communication</p>
                <h1 style="margin:8px 0 0; color:#ffffff; font-size:22px; line-height:1.3;">${subject}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 14px; font-size:16px;">Hello ${candidateName},</p>
                <p style="margin:0; font-size:15px; line-height:1.7; color:#374151;">${message}</p>
                <p style="margin:22px 0 0; font-size:14px; line-height:1.7; color:#374151;">
                  Best regards,<br/><strong>${companyName} Hiring Team</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px; border-top:1px solid #e5e7eb; background:#f9fafb;">
                <p style="margin:0; font-size:12px; color:#6b7280;">Powered by RoleColorFinder</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = (await req.json()) as SendCandidateEmailRequest;
    if (!payload.to || !payload.subject || !payload.message || !payload.companyName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
    const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN") || "rolecolorfinder.com";

    if (!mailgunApiKey) {
      return new Response(JSON.stringify({ error: "Mailgun is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = new FormData();
    formData.append("from", `${payload.companyName} Hiring Team <hiring@${mailgunDomain}>`);
    formData.append("to", payload.to);
    formData.append("subject", payload.subject);
    formData.append("html", buildEmailHtml(payload));

    const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mailgun error sending candidate email:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-candidate-email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
