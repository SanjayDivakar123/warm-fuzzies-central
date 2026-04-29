import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildAnchoredDate } from "../_shared/companyPortalBilling.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPER_ADMIN_EMAILS = new Set([
  "sanjay@rolecolorfinder.com",
  "tristan@rolecolorfinder.com",
]);

const MIN_BILLABLE_SEATS = 2;

function isValidSubdomain(subdomain: string) {
  const reserved = ["www", "api", "admin", "app", "dashboard", "mail", "ftp", "localhost", "supabase"];
  return /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(subdomain) && !reserved.includes(subdomain);
}

function parseMoneyDollars(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const match = value.match(/\$?\s*([\d,]+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const amount = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function parseOptionalInteger(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "∞") return null;
  const normalized = trimmed.replace(/,/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  return Number(normalized);
}

function parseScalingBlockSize(note: string | null | undefined) {
  const match = (note ?? "").match(/per additional\s+([\d,]+)/i);
  return match ? Number(match[1].replace(/,/g, "")) : 10;
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { acceptanceId, companyName, subdomain, assessmentType = "25q" } = await req.json();
    if (!acceptanceId || !companyName || !subdomain) {
      throw new Error("Acceptance ID, company name, and subdomain are required");
    }

    const normalizedSubdomain = String(subdomain).trim().toLowerCase();
    if (!isValidSubdomain(normalizedSubdomain)) {
      throw new Error("Subdomain must be 3-63 chars and contain only lowercase letters, numbers, and hyphens");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecret = Deno.env.get("STRIPE_SECRET");
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !stripeSecret) {
      throw new Error("Server configuration error");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const callerEmail = normalizeEmail(user.email);
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole && !SUPER_ADMIN_EMAILS.has(callerEmail)) {
      throw new Error("Forbidden");
    }

    const { data: existingCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("subdomain", normalizedSubdomain)
      .maybeSingle();

    if (existingCompany) throw new Error("Subdomain already taken");

    const { data: acceptance, error: acceptanceError } = await supabase
      .from("proposal_acceptances")
      .select("*")
      .eq("id", acceptanceId)
      .maybeSingle();

    if (acceptanceError || !acceptance) throw new Error("Acceptance not found");
    if (acceptance.linked_company_id) throw new Error("This acceptance already has a company");
    if (acceptance.payment_status !== "paid") throw new Error("Proposal payment must be verified first");
    if (!acceptance.email) throw new Error("Acceptance contact email is required");
    if (!acceptance.stripe_customer_id) throw new Error("No saved Stripe customer was found for this acceptance");

    const { data: proposal, error: proposalError } = await supabase
      .from("client_proposals")
      .select("id, proposal_id, slug, pricing")
      .eq("slug", acceptance.proposal_slug)
      .order("version", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (proposalError || !proposal) throw new Error("Proposal not found");

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
    const paymentMethods = await stripe.paymentMethods.list({
      customer: acceptance.stripe_customer_id,
      type: "card",
      limit: 1,
    });
    if (paymentMethods.data.length === 0) {
      throw new Error("The saved Stripe customer does not have a card on file");
    }

    const pricing = proposal.pricing as Record<string, string>;
    const coreMonthly = parseMoneyDollars(pricing.corePlatformMonthly) ?? 500;
    const hiringMonthly = parseMoneyDollars(pricing.hiringIntelligenceMonthly) ?? 0;
    const scalingMonthly = parseMoneyDollars(pricing.scalingPrice);
    const outcomePrice = parseMoneyDollars(pricing.outcomePrice);
    const deploymentFee = parseMoneyDollars(pricing.platformDeployment) ?? 0;
    const now = new Date();
    const nextRenewalAt = buildAnchoredDate(now, 1);

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: String(companyName).trim(),
        subdomain: normalizedSubdomain,
        admin_email: normalizeEmail(acceptance.email),
        seats_purchased: MIN_BILLABLE_SEATS,
        assessment_type: ["25q", "50q"].includes(assessmentType) ? assessmentType : "25q",
        subdomain_enabled: true,
        subdomain_status: "active",
        stripe_customer_id: acceptance.stripe_customer_id,
        portal_billing_anchor_at: now.toISOString(),
        portal_billing_next_renewal_at: nextRenewalAt.toISOString(),
        portal_core_monthly_dollars: coreMonthly,
        portal_hiring_monthly_dollars: hiringMonthly,
        portal_included_active_job_roles: parseOptionalInteger(pricing.includedJobRoles),
        portal_applicants_per_role: parseOptionalInteger(pricing.applicantsPerRole),
        portal_active_role_scale_block_size: parseScalingBlockSize(pricing.scalingNote),
        portal_active_role_scale_block_monthly_dollars: scalingMonthly ?? 0,
        portal_outcome_price_per_hire_dollars: outcomePrice ?? 0,
        hiring_subscription_enabled: hiringMonthly > 0,
        hiring_subscription_status: hiringMonthly > 0 ? "admin_override" : null,
      })
      .select("id, name, subdomain")
      .single();

    if (companyError || !company) throw companyError ?? new Error("Failed to create company");

    const { data: inviteCode } = await supabase.rpc("generate_invite_code");
    let invitedUserId: string | null = null;
    let setupLink: string | null = null;

    const redirectTo = `https://rolecolorfinder.com/company/${company.subdomain}/admin`;
    const { data: sentInviteData, error: sentInviteError } = await supabase.auth.admin.inviteUserByEmail(
      normalizeEmail(acceptance.email),
      {
        redirectTo,
        data: {
          full_name: `${acceptance.first_name ?? ""} ${acceptance.last_name ?? ""}`.trim(),
        },
      },
    );

    if (!sentInviteError) {
      invitedUserId = sentInviteData?.user?.id ?? null;
    }

    const { data: inviteData, error: inviteError } = await supabase.auth.admin.generateLink({
      type: "invite",
      email: normalizeEmail(acceptance.email),
      options: {
        redirectTo,
        data: {
          full_name: `${acceptance.first_name ?? ""} ${acceptance.last_name ?? ""}`.trim(),
        },
      },
    });

    if (!inviteError) {
      invitedUserId = invitedUserId ?? inviteData?.user?.id ?? null;
      setupLink = inviteData?.properties?.action_link ?? null;
    }

    const { error: adminUserError } = await supabase
      .from("company_users")
      .insert({
        company_id: company.id,
        email: normalizeEmail(acceptance.email),
        full_name: `${acceptance.first_name ?? ""} ${acceptance.last_name ?? ""}`.trim() || null,
        job_role: acceptance.designation ?? null,
        user_id: invitedUserId,
        role: "admin",
        status: "invited",
        invite_code: inviteCode ?? null,
        invited_at: now.toISOString(),
        joined_at: null,
      });

    if (adminUserError) throw adminUserError;

    await supabase.from("billing_transactions").insert({
      company_id: company.id,
      type: "proposal_deployment_paid",
      amount: 0,
      description: `Deployment fee ${deploymentFee > 0 ? `$${deploymentFee.toFixed(2)} ` : ""}paid via proposal ${proposal.proposal_id}; first monthly renewal scheduled for ${nextRenewalAt.toISOString()}.`,
    });

    const { error: acceptanceUpdateError } = await supabase
      .from("proposal_acceptances")
      .update({
        linked_company_id: company.id,
        company_created_at: now.toISOString(),
      })
      .eq("id", acceptance.id);
    if (acceptanceUpdateError) throw acceptanceUpdateError;

    await supabase
      .from("client_proposals")
      .update({ linked_company_id: company.id })
      .eq("id", proposal.id);

    await supabase.rpc("log_admin_action", {
      p_actor_id: user.id,
      p_actor_email: callerEmail,
      p_action_type: "proposal_company_create",
      p_target_type: "company",
      p_target_id: company.id,
      p_target_label: company.name,
      p_metadata: {
        acceptance_id: acceptance.id,
        proposal_slug: acceptance.proposal_slug,
        next_renewal_at: nextRenewalAt.toISOString(),
      },
    });

    return new Response(JSON.stringify({
      success: true,
      company,
      setupLink,
      nextRenewalAt: nextRenewalAt.toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-company-from-proposal error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error.message === "Forbidden" || error.message === "Unauthorized" ? 403 : 400,
    });
  }
});
