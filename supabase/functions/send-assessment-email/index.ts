const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SendAssessmentEmailRequest {
  to: string;
  candidateName: string;
  companyName: string;
  jobTitle?: string;
  assessmentCategory: string;
  assessmentType: "25q" | "50q";
  idealRoleColor?: string | null;
  inviteCode: string;
  assessmentUrl: string;
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const toCategoryLabel = (category: string) => {
  if (!category) return "Professional";
  return category.charAt(0).toUpperCase() + category.slice(1);
};

const toDurationLabel = (type: "25q" | "50q") => (type === "25q" ? "10-15 minutes" : "20-30 minutes");
const toQuestionCountLabel = (type: "25q" | "50q") => (type === "25q" ? "25 questions" : "50 questions");

const buildAssessmentEmailHtml = (payload: SendAssessmentEmailRequest) => {
  const candidateName = escapeHtml(payload.candidateName || "Candidate");
  const companyName = escapeHtml(payload.companyName || "Hiring Team");
  const jobTitle = payload.jobTitle ? escapeHtml(payload.jobTitle) : null;
  const category = escapeHtml(toCategoryLabel(payload.assessmentCategory));
  const questionCount = escapeHtml(toQuestionCountLabel(payload.assessmentType));
  const duration = escapeHtml(toDurationLabel(payload.assessmentType));
  const roleColor = payload.idealRoleColor ? escapeHtml(payload.idealRoleColor.toUpperCase()) : null;
  const inviteCode = escapeHtml(payload.inviteCode);
  const assessmentUrl = escapeHtml(payload.assessmentUrl);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RoleColor Assessment Invitation</title>
  </head>
  <body style="margin:0; padding:0; background:#f4f6fb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
            <tr>
              <td style="background:linear-gradient(135deg,#111827 0%,#1f2937 100%); padding:26px 30px;">
                <p style="margin:0; color:#d1d5db; font-size:12px; letter-spacing:.08em; text-transform:uppercase;">Assessment Invitation</p>
                <h1 style="margin:8px 0 0; color:#ffffff; font-size:24px; line-height:1.3;">Complete your RoleColor assessment</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;">
                <p style="margin:0 0 14px; font-size:16px;">Hello ${candidateName},</p>
                <p style="margin:0 0 20px; font-size:15px; line-height:1.7; color:#374151;">
                  ${companyName} has invited you to complete a RoleColor assessment${jobTitle ? ` for the <strong>${jobTitle}</strong> position` : ""}.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb; border-radius:10px; margin:0 0 20px;">
                  <tr>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; width:42%; color:#6b7280; font-size:13px;">Assessment Category</td>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; font-size:14px;">${category}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:13px;">Number of Questions</td>
                    <td style="padding:14px 16px; border-bottom:1px solid #e5e7eb; font-size:14px;">${questionCount}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px; ${roleColor ? "border-bottom:1px solid #e5e7eb;" : ""} color:#6b7280; font-size:13px;">Estimated Duration</td>
                    <td style="padding:14px 16px; ${roleColor ? "border-bottom:1px solid #e5e7eb;" : ""} font-size:14px;">${duration}</td>
                  </tr>
                  ${roleColor ? `<tr>
                    <td style="padding:14px 16px; color:#6b7280; font-size:13px;">Ideal RoleColor</td>
                    <td style="padding:14px 16px; font-size:14px;">${roleColor}</td>
                  </tr>` : ""}
                </table>

                <div style="text-align:center; margin:28px 0 22px;">
                  <a href="${assessmentUrl}" style="display:inline-block; background:#16a34a; color:#ffffff; text-decoration:none; font-weight:600; padding:12px 24px; border-radius:8px;">
                    Start Assessment
                  </a>
                </div>

                <p style="margin:0 0 4px; font-size:13px; color:#6b7280;">If the button does not work, use this code:</p>
                <p style="margin:0 0 20px; font-size:18px; font-weight:700; letter-spacing:0.08em;">${inviteCode}</p>

                <p style="margin:0; font-size:14px; line-height:1.7; color:#374151;">
                  Thank you,<br /><strong>${companyName} Hiring Team</strong>
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
    const payload = (await req.json()) as SendAssessmentEmailRequest;
    if (!payload.to || !payload.assessmentUrl || !payload.inviteCode || !payload.companyName) {
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

    const subject = `${payload.companyName}: RoleColor Assessment Invitation`;
    const formData = new FormData();
    formData.append("from", `${payload.companyName} Hiring Team <hiring@${mailgunDomain}>`);
    formData.append("to", payload.to);
    formData.append("subject", subject);
    formData.append("html", buildAssessmentEmailHtml(payload));

    const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mailgun error sending assessment email:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to send assessment email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-assessment-email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
