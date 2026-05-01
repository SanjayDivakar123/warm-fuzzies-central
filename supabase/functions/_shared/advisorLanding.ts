import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

export const advisorCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export type AssessmentType = "premium" | "pro";

export const ADVISOR_DISCOUNT_PERCENT = 30;
export const ADVISOR_COMMISSION_RATE = 0.15;

export const ASSESSMENT_PRODUCTS: Record<AssessmentType, {
  name: string;
  amountMinor: number;
  description: string;
  totalQuestions: number;
}> = {
  premium: {
    name: "Premium Leadership Assessment",
    amountMinor: 12499,
    description: "Complete 25-question assessment with detailed insights",
    totalQuestions: 25,
  },
  pro: {
    name: "Pro Deep Dive Assessment",
    amountMinor: 19999,
    description: "Ultimate 50-question assessment with comprehensive report",
    totalQuestions: 50,
  },
};

export const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...advisorCorsHeaders, "Content-Type": "application/json" },
  });

export const normalizeEmail = (email: string | null | undefined) =>
  (email || "").trim().toLowerCase();

export const normalizeSlug = (slug: string) =>
  slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const formatMoney = (amountMinor: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountMinor / 100);

export const createServiceClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

export const getStripe = () => {
  const stripeSecret =
    Deno.env.get("ADVISOR_STRIPE_SECRET") ||
    Deno.env.get("STRIPE_SECRET") ||
    Deno.env.get("STRIPE_SECRET_KEY");

  if (!stripeSecret) {
    throw new Error("Missing Stripe secret. Set ADVISOR_STRIPE_SECRET or STRIPE_SECRET.");
  }

  return new Stripe(stripeSecret, {
    apiVersion: "2023-10-16",
  });
};

export const calculateAdvisorPrice = (assessmentType: AssessmentType, discountPercent = ADVISOR_DISCOUNT_PERCENT) => {
  const product = ASSESSMENT_PRODUCTS[assessmentType];
  if (!product) {
    throw new Error("Invalid assessment type");
  }

  const safeDiscount = Math.min(100, Math.max(0, Math.round(discountPercent)));
  const discountedAmountMinor = Math.round(product.amountMinor * ((100 - safeDiscount) / 100));
  const commissionAmountMinor = Math.round(discountedAmountMinor * ADVISOR_COMMISSION_RATE);

  return {
    product,
    currency: "usd",
    originalAmountMinor: product.amountMinor,
    discountedAmountMinor,
    discountPercent: safeDiscount,
    commissionAmountMinor,
  };
};

export const buildResultSummary = (results: Record<string, unknown>) => ({
  dominantColor: results.dominantColor ?? null,
  secondaryColor: results.secondaryColor ?? null,
  tertiaryColor: results.tertiaryColor ?? null,
  scores: results.scores ?? null,
  totalQuestions: results.totalQuestions ?? null,
  completedAt: new Date().toISOString(),
});

export const getOrigin = (req: Request, fallback = "https://rolecolorfinder.com") =>
  req.headers.get("origin") || Deno.env.get("PUBLIC_SITE_URL") || fallback;

export const sendMailgunEmail = async (params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) => {
  const apiKey = Deno.env.get("MAILGUN_API_KEY");
  const domain = Deno.env.get("MAILGUN_DOMAIN");
  const fromEmail = Deno.env.get("MAILGUN_FROM_EMAIL") || `Role Color Finder <noreply@${domain}>`;
  const baseUrl = Deno.env.get("MAILGUN_BASE_URL") || "https://api.mailgun.net/v3";

  if (!apiKey || !domain) {
    throw new Error("Missing MAILGUN_API_KEY or MAILGUN_DOMAIN, so the email could not be sent.");
  }

  const formData = new FormData();
  formData.append("from", fromEmail);
  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  recipients.forEach((recipient) => formData.append("to", recipient));
  formData.append("subject", params.subject);
  formData.append("html", params.html);
  if (params.text) {
    formData.append("text", params.text);
  }

  const response = await fetch(`${baseUrl}/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Mailgun email failed: ${errorBody}`);
  }
};

export const getAdvisorForAuthUser = async (
  req: Request,
  supabase: ReturnType<typeof createServiceClient>,
) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Unauthorized");
  }

  const authClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: authData, error: authError } = await authClient.auth.getUser();
  if (authError || !authData.user) {
    throw new Error("Unauthorized");
  }

  const { data: advisor, error } = await supabase
    .from("advisors")
    .select("*")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!advisor) {
    throw new Error("Advisor profile not found");
  }

  return { advisor, user: authData.user };
};
