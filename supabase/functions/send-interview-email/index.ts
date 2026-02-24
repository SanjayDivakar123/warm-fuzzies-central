const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SendInterviewEmailRequest {
  to: string;
  candidateName: string;
  companyName: string;
  jobTitle: string;
  interviewTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  durationMinutes: number;
  interviewType: "video" | "phone" | "onsite";
  location?: string | null;
  notes?: string | null;
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const toDisplayInterviewType = (type: SendInterviewEmailRequest["interviewType"]) => {
  if (type === "video") return "Video Interview";
  if (type === "phone") return "Phone Interview";
  return "In-Person Interview";
};

const buildEmailHtml = (payload: SendInterviewEmailRequest) => {
  const safeCandidateName = escapeHtml(payload.candidateName || "Candidate");
  const safeCompanyName = escapeHtml(payload.companyName || "Hiring Team");
  const safeJobTitle = escapeHtml(payload.jobTitle || "this role");
  const safeInterviewTitle = escapeHtml(payload.interviewTitle || "Interview");
  const safeDate = escapeHtml(payload.scheduledDate);
  const safeTime = escapeHtml(payload.scheduledTime);
  const safeTz = escapeHtml(payload.timezone || "local time");
  const safeType = escapeHtml(toDisplayInterviewType(payload.interviewType));
  const safeDuration = escapeHtml(String(payload.durationMinutes));
  const safeLocation = payload.location ? escapeHtml(payload.location) : null;
  const safeNotes = payload.notes ? escapeHtml(payload.notes) : null;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Interview Scheduled</title>
  </head>
  <body style="margin:0; padding:0; background:#f4f6fb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
            <tr>
              <td style="background:linear-gradient(135deg,#111827 0%,#1f2937 100%); padding:26px 28px;">
                <p style="margin:0; color:#d1d5db; font-size:12px; letter-spacing:.08em; text-transform:uppercase;">Interview Confirmation</p>
                <h1 style="margin:8px 0 0; color:#ffffff; font-size:24px; line-height:1.3;">Your interview has been scheduled</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 14px; font-size:16px;">Hi ${safeCandidateName},</p>
                <p style="margin:0 0 20px; font-size:15px; line-height:1.7; color:#374151;">
                  Thank you for your interest in <strong>${safeJobTitle}</strong> at <strong>${safeCompanyName}</strong>.
                  We are pleased to confirm your interview details below.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb; border-radius:10px; margin:0 0 22px;">
                  <tr>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; width:38%; color:#6b7280; font-size:13px;">Interview Title</td>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; font-size:14px; font-weight:600;">${safeInterviewTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:13px;">Date</td>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; font-size:14px;">${safeDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:13px;">Time</td>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; font-size:14px;">${safeTime} (${safeTz})</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:13px;">Duration</td>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; font-size:14px;">${safeDuration} minutes</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px; ${safeLocation ? "border-bottom:1px solid #e5e7eb;" : ""} color:#6b7280; font-size:13px;">Interview Type</td>
                    <td style="padding:14px 16px; ${safeLocation ? "border-bottom:1px solid #e5e7eb;" : ""} font-size:14px;">${safeType}</td>
                  </tr>
                  ${
                    safeLocation
                      ? `<tr>
                    <td style="padding:14px 16px; color:#6b7280; font-size:13px;">Location / Link</td>
                    <td style="padding:14px 16px; font-size:14px; word-break:break-word;">${safeLocation}</td>
                  </tr>`
                      : ""
                  }
                </table>

                ${
                  safeNotes
                    ? `<div style="padding:14px 16px; border:1px solid #e5e7eb; border-radius:10px; margin-bottom:22px;">
                  <p style="margin:0 0 8px; font-size:13px; color:#6b7280;">Additional Notes</p>
                  <p style="margin:0; font-size:14px; line-height:1.6; color:#374151; white-space:pre-wrap;">${safeNotes}</p>
                </div>`
                    : ""
                }

                <p style="margin:0 0 8px; font-size:14px; color:#374151;">If you have any questions, simply reply to this email.</p>
                <p style="margin:0; font-size:14px; color:#374151;">Best regards,<br/><strong>${safeCompanyName} Hiring Team</strong></p>
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
    const payload = (await req.json()) as SendInterviewEmailRequest;
    if (!payload.to || !payload.candidateName || !payload.companyName || !payload.scheduledDate || !payload.scheduledTime) {
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

    const subject = `${payload.companyName}: Interview Scheduled for ${payload.jobTitle || "your role"}`;
    const html = buildEmailHtml(payload);
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
      console.error("Mailgun error sending interview email:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to send interview email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-interview-email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
