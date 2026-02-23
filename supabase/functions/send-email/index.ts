import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import React from "npm:react@18.3.1";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { ConfirmationEmail } from "./_templates/confirmation-email.tsx";
import { ResetPasswordEmail } from "./_templates/reset-password-email.tsx";

const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type DirectEmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const hasWebhookHeaders = (req: Request) =>
  Boolean(req.headers.get("webhook-id")) &&
  Boolean(req.headers.get("webhook-signature")) &&
  Boolean(req.headers.get("webhook-timestamp"));

const parseRecipients = (to: DirectEmailPayload["to"]): string[] => {
  const recipients = (Array.isArray(to) ? to : [to])
    .map((email) => email?.toString().trim())
    .filter(Boolean);
  return recipients;
};

const getResendClient = (): Resend => {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY configuration");
  }
  return new Resend(apiKey);
};

const getAuthorizedUser = async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await authClient.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    // Path 1: Supabase Auth webhook email customization.
    if (hasWebhookHeaders(req)) {
      if (!hookSecret) {
        return jsonResponse(500, { error: "Missing webhook secret configuration" });
      }

      const payload = await req.text();
      const headers = Object.fromEntries(req.headers);
      const wh = new Webhook(hookSecret);

      const {
        user,
        email_data: { token, token_hash, redirect_to, email_action_type },
      } = wh.verify(payload, headers) as {
        user: { email: string };
        email_data: {
          token: string;
          token_hash: string;
          redirect_to: string;
          email_action_type: string;
        };
      };

      let html: string;
      let subject: string;

      if (email_action_type === "signup" || email_action_type === "invite") {
        html = await renderAsync(
          React.createElement(ConfirmationEmail, {
            supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
            token,
            token_hash,
            redirect_to,
            email_action_type,
          }),
        );
        subject = "Confirm your email for Role Color Finder";
      } else if (email_action_type === "recovery") {
        html = await renderAsync(
          React.createElement(ResetPasswordEmail, {
            supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
            token,
            token_hash,
            redirect_to,
            email_action_type,
          }),
        );
        subject = "Reset your Role Color Finder password";
      } else {
        html = await renderAsync(
          React.createElement(ConfirmationEmail, {
            supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
            token,
            token_hash,
            redirect_to,
            email_action_type,
          }),
        );
        subject = "Action required for Role Color Finder";
      }

      const resend = getResendClient();
      const { error } = await resend.emails.send({
        from: "Role Color Finder <onboarding@resend.dev>",
        to: [user.email],
        subject,
        html,
      });

      if (error) {
        console.error("Auth webhook email send error:", error);
        return jsonResponse(500, { error: error.message || "Failed to send email" });
      }

      return jsonResponse(200, { success: true });
    }

    // Path 2: Direct app-triggered emails (Hiring tab, bulk email, etc.).
    const user = await getAuthorizedUser(req);

    const body = (await req.json()) as Partial<DirectEmailPayload>;
    const recipients = parseRecipients(body.to || []);
    const subject = body.subject?.trim() || "";
    const html = body.html?.trim() || "";
    const text = body.text?.trim() || undefined;

    if (recipients.length === 0 || !subject || !html) {
      return jsonResponse(400, {
        error: "Invalid payload. Required fields: to, subject, html",
      });
    }

    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: "Role Color Finder <onboarding@resend.dev>",
      to: recipients,
      subject,
      html,
      text,
      replyTo: user?.email || undefined,
    });

    if (error) {
      console.error("Direct email send error:", error);
      return jsonResponse(500, { error: error.message || "Failed to send email" });
    }

    return jsonResponse(200, { success: true, sent_to: recipients.length });
  } catch (error) {
    console.error("send-email function error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
});
