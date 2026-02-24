const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SendOfferEmailRequest {
  to: string;
  candidateName: string;
  companyName: string;
  jobTitle: string;
  salary?: number | null;
  currency: string;
  bonus?: number | null;
  equity?: string | null;
  startDate?: string | null;
  offerExpires?: string | null;
  probationPeriod?: string | null;
  notes?: string | null;
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(amount);

const buildOfferEmailHtml = (payload: SendOfferEmailRequest) => {
  const candidateName = escapeHtml(payload.candidateName || "Candidate");
  const companyName = escapeHtml(payload.companyName || "Our Company");
  const jobTitle = escapeHtml(payload.jobTitle || "the position");
  const hasSalary = typeof payload.salary === "number" && payload.salary > 0;
  const salary = hasSalary ? escapeHtml(formatMoney(payload.salary as number, payload.currency)) : null;
  const bonus = payload.bonus ? escapeHtml(formatMoney(payload.bonus, payload.currency)) : null;
  const equity = payload.equity ? escapeHtml(payload.equity) : null;
  const startDate = payload.startDate ? escapeHtml(payload.startDate) : null;
  const offerExpires = payload.offerExpires ? escapeHtml(payload.offerExpires) : null;
  const probationPeriod = payload.probationPeriod ? escapeHtml(payload.probationPeriod) : null;
  const notes = payload.notes ? escapeHtml(payload.notes) : null;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Offer Letter</title>
  </head>
  <body style="margin:0; padding:0; background:#f4f6fb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
            <tr>
              <td style="background:linear-gradient(135deg,#064e3b 0%,#0f766e 100%); padding:28px 30px;">
                <p style="margin:0; color:#d1fae5; font-size:12px; letter-spacing:.08em; text-transform:uppercase;">Official Offer</p>
                <h1 style="margin:8px 0 0; color:#ffffff; font-size:24px; line-height:1.3;">We are excited to extend an offer</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;">
                <p style="margin:0 0 14px; font-size:16px;">Dear ${candidateName},</p>
                <p style="margin:0 0 20px; font-size:15px; line-height:1.7; color:#374151;">
                  On behalf of <strong>${companyName}</strong>, we are pleased to offer you the role of
                  <strong>${jobTitle}</strong>. Please review your offer details below.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb; border-radius:10px; margin:0 0 20px;">
                  ${salary ? `<tr>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; width:40%; color:#6b7280; font-size:13px;">Base Salary</td>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; font-size:14px; font-weight:600;">${salary} ${escapeHtml(payload.currency)}</td>
                  </tr>` : `<tr>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; width:40%; color:#6b7280; font-size:13px;">Compensation</td>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; font-size:14px; font-weight:600;">Equity-only / unpaid role</td>
                  </tr>`}
                  ${bonus ? `<tr>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:13px;">Signing Bonus</td>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; font-size:14px;">${bonus} ${escapeHtml(payload.currency)}</td>
                  </tr>` : ""}
                  ${equity ? `<tr>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:13px;">Equity</td>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; font-size:14px;">${equity}</td>
                  </tr>` : ""}
                  ${probationPeriod ? `<tr>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:13px;">Probationary Period</td>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; font-size:14px;">${probationPeriod}</td>
                  </tr>` : ""}
                  ${startDate ? `<tr>
                    <td style="padding:14px 16px; ${offerExpires ? "border-bottom:1px solid #e5e7eb;" : ""} color:#6b7280; font-size:13px;">Proposed Start Date</td>
                    <td style="padding:14px 16px; ${offerExpires ? "border-bottom:1px solid #e5e7eb;" : ""} font-size:14px;">${startDate}</td>
                  </tr>` : ""}
                  ${offerExpires ? `<tr>
                    <td style="padding:14px 16px; color:#6b7280; font-size:13px;">Offer Expiration</td>
                    <td style="padding:14px 16px; font-size:14px;">${offerExpires}</td>
                  </tr>` : ""}
                </table>

                ${notes ? `<div style="padding:14px 16px; border:1px solid #e5e7eb; border-radius:10px; margin-bottom:20px;">
                  <p style="margin:0 0 8px; font-size:13px; color:#6b7280;">Additional Notes</p>
                  <p style="margin:0; font-size:14px; line-height:1.6; color:#374151; white-space:pre-wrap;">${notes}</p>
                </div>` : ""}

                <p style="margin:0 0 8px; font-size:14px; color:#374151;">
                  To proceed, please reply to this email with any questions or confirmation details.
                </p>
                <p style="margin:0; font-size:14px; color:#374151;">Sincerely,<br/><strong>${companyName} Hiring Team</strong></p>
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
    const payload = (await req.json()) as SendOfferEmailRequest;

    if (!payload.to || !payload.candidateName || !payload.companyName || !payload.currency) {
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

    const subject = `${payload.companyName}: Offer for ${payload.jobTitle || "the role"}`;
    const html = buildOfferEmailHtml(payload);

    const formData = new FormData();
    formData.append("from", `${payload.companyName} Hiring Team <hiring@${mailgunDomain}>`);
    formData.append("to", payload.to);
    formData.append("subject", subject);
    formData.append("html", html);

    const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mailgun error sending offer email:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to send offer email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-offer-email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
