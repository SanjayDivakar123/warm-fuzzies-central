import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Color = "yellow" | "red" | "green" | "blue";

type FreeAssessmentPayload = {
  email?: string;
  result?: {
    dominantColor?: string;
    scores?: Partial<Record<Color, number>>;
    totalQuestions?: number;
    isPreview?: boolean;
  };
};

type FreeAssessmentResult = NonNullable<FreeAssessmentPayload["result"]>;

const colorLabels: Record<Color, string> = {
  yellow: "Fast Executor",
  red: "Creative Motivator",
  green: "Logical Systems Thinker",
  blue: "Empathetic Connector",
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const isColor = (value: string | undefined): value is Color =>
  value === "yellow" || value === "red" || value === "green" || value === "blue";

const normalizeEmail = (email: string | undefined) => email?.trim().toLowerCase() ?? "";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const sanitizeScores = (scores: FreeAssessmentResult["scores"]) => {
  const nextScores: Record<Color, number> = {
    yellow: 0,
    red: 0,
    green: 0,
    blue: 0,
  };

  (Object.keys(nextScores) as Color[]).forEach((color) => {
    const value = scores?.[color];
    nextScores[color] = typeof value === "number" && Number.isFinite(value) ? value : 0;
  });

  return nextScores;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sendMailgunEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) => {
  const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
  const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN") || "rolecolorfinder.com";

  if (!mailgunApiKey) {
    throw new Error("Mailgun is not configured");
  }

  const formData = new FormData();
  formData.append("from", Deno.env.get("MAILGUN_FROM_EMAIL") || `RoleColorFinder <support@${mailgunDomain}>`);
  formData.append("to", to);
  formData.append("subject", subject);
  formData.append("html", html);
  formData.append("text", text);

  const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Mailgun error sending free assessment email:", response.status, errorText);
    throw new Error("Failed to send result email");
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  let submissionId: string | null = null;

  try {
    const body = (await req.json()) as FreeAssessmentPayload;
    const email = normalizeEmail(body.email);
    const dominantColor = body.result?.dominantColor;

    if (!isValidEmail(email)) {
      return jsonResponse(400, { error: "Please enter a valid email address." });
    }

    if (!isColor(dominantColor)) {
      return jsonResponse(400, { error: "Missing or invalid assessment result." });
    }

    const scores = sanitizeScores(body.result?.scores);
    const totalQuestions = typeof body.result?.totalQuestions === "number" ? body.result.totalQuestions : 3;
    const resultPayload = {
      dominantColor,
      scores,
      totalQuestions,
      isPreview: body.result?.isPreview ?? true,
    };

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(500, { error: "Missing Supabase service configuration." });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data, error: insertError } = await supabase
      .from("free_assessment_submissions")
      .insert({
        email,
        dominant_color: dominantColor,
        scores,
        result_payload: resultPayload,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;
    submissionId = data.id;

    const siteUrl = Deno.env.get("SITE_URL") || "https://rolecolorfinder.com";
    const baseUrl = siteUrl.replace(/\/$/, "");
    const authUrl = `${baseUrl}/auth`;
    const logoUrl =
      Deno.env.get("ROLECOLORFINDER_LOGO_URL") ||
      "https://rolecolorfinder.com/uploads/2842bc15-73da-4523-b9c9-228cb076346e.png";
    const resultLabel = colorLabels[dominantColor];
    const escapedResultLabel = escapeHtml(resultLabel);
    const escapedAuthUrl = escapeHtml(authUrl);
    const escapedLogoUrl = escapeHtml(logoUrl);

    const html = `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 640px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="${escapedLogoUrl}" alt="RoleColorFinder" style="max-width: 180px; height: auto;" />
        </div>
        <h1 style="font-size: 28px; margin-bottom: 12px;">Congrats on taking your assessment!</h1>
        <p>Your free RoleColorFinder preview result is:</p>
        <div style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin: 20px 0; background: #f8fafc;">
          <p style="font-size: 22px; font-weight: 700; margin: 0;">${escapedResultLabel}</p>
          <p style="margin: 8px 0 0;">Create an account to keep exploring your RoleColor profile and unlock more tools.</p>
        </div>
        <div style="border: 1px solid #bbf7d0; border-radius: 16px; padding: 18px 20px; margin: 20px 0; background: #f0fdf4;">
          <p style="font-size: 16px; font-weight: 700; margin: 0 0 6px; color: #166534;">Special offer</p>
          <p style="margin: 0; color: #14532d;">Use code <strong>FREE499</strong> to get <strong>$4.99 off</strong> your first order.</p>
        </div>
        <p>
          <a href="${escapedAuthUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 12px 18px; border-radius: 999px; text-decoration: none; font-weight: 700;">
            Set up your account
          </a>
        </p>
        <p style="font-size: 13px; color: #64748b;">If the button does not work, open this link: ${escapedAuthUrl}</p>
        <div style="border-top: 1px solid #e2e8f0; margin-top: 28px; padding-top: 18px; font-size: 12px; line-height: 1.5; color: #64748b;">
          <p style="margin: 0 0 4px;">Sent by RoleColorFinder LLC</p>
          <p style="margin: 0;">43 Hunting Ridge Rd, Greenwich, 06831, Connecticut, United States</p>
        </div>
      </div>
    `;

    const text = `Congrats on taking your assessment!\n\nYour free RoleColorFinder preview result is: ${resultLabel}.\n\nUse code FREE499 to get $4.99 off your first order.\n\nSet up your account here: ${authUrl}\n\nSent by RoleColorFinder LLC\n43 Hunting Ridge Rd, Greenwich, 06831, Connecticut, United States`;

    try {
      await sendMailgunEmail({
        to: email,
        subject: "Your RoleColorFinder assessment result",
        html,
        text,
      });
    } catch (emailError) {
      const emailErrorMessage = emailError instanceof Error ? emailError.message : "Failed to send email";
      await supabase
        .from("free_assessment_submissions")
        .update({ email_error: emailErrorMessage })
        .eq("id", submissionId);
      return jsonResponse(500, { error: emailErrorMessage });
    }

    await supabase
      .from("free_assessment_submissions")
      .update({ email_sent_at: new Date().toISOString(), email_error: null })
      .eq("id", submissionId);

    return jsonResponse(200, { success: true, submission_id: submissionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("submit-free-assessment error:", error);
    return jsonResponse(500, { error: message });
  }
});
