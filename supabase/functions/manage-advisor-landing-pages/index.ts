import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requireSuperAdmin, logAdminAction } from "../_shared/admin.ts";
import {
  advisorCorsHeaders,
  jsonResponse,
  normalizeEmail,
  normalizeSlug,
  calculateAdvisorPrice,
  getOrigin,
  sendMailgunEmail,
  type AssessmentType,
} from "../_shared/advisorLanding.ts";

const pageSelect = `
  *,
  advisor:advisors(*),
  submissions:advisor_landing_submissions(
    id,
    status,
    discounted_amount_minor,
    created_at,
    completed_at,
    commission:advisor_commissions(id,status,commission_amount_minor)
  )
`;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildAdvisorInviteEmailHtml = ({
  heading,
  intro,
  ctaLabel,
  ctaHref,
}: {
  heading: string;
  intro: string;
  ctaLabel: string;
  ctaHref: string;
}) => {
  const safeHeading = escapeHtml(heading);
  const safeIntro = escapeHtml(intro);
  const safeCtaLabel = escapeHtml(ctaLabel);
  const safeCtaHref = escapeHtml(ctaHref);
  const logoUrl = "https://rolecolorfinder.com/uploads/2842bc15-73da-4523-b9c9-228cb076346e.png";

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 640px; margin: 0 auto; background: #f8fafc; padding: 24px;">
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden;">
        <div style="padding: 26px 28px; text-align: center; background: linear-gradient(135deg,#0f172a 0%,#1e293b 100%);">
          <img src="${logoUrl}" alt="RoleColorFinder" style="max-width: 200px; height: auto;" />
        </div>
        <div style="padding: 30px 28px;">
          <h2 style="margin: 0 0 14px; font-size: 30px; line-height: 1.2; color: #0f172a;">${safeHeading}</h2>
          <p style="margin: 0 0 20px; color: #334155; font-size: 16px;">${safeIntro}</p>
          <p style="margin: 0 0 24px;">
            <a href="${safeCtaHref}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 999px; font-weight: 700;">
              ${safeCtaLabel}
            </a>
          </p>
          <p style="margin: 0; color: #64748b; font-size: 13px;">
            If the button does not work, open this link: <a href="${safeCtaHref}" style="color: #0f172a; word-break: break-all;">${safeCtaHref}</a>
          </p>
        </div>
      </div>
      <div style="margin-top: 14px; color: #64748b; font-size: 12px; line-height: 1.5; text-align: center;">
        <p style="margin: 0;">Sent by RoleColorFinder LLC</p>
        <p style="margin: 2px 0 0;">43 Hunting Ridge Rd, Greenwich, 06831, Connecticut, United States</p>
      </div>
    </div>
  `;
};

const listPages = async (supabase: any) => {
  const { data, error } = await supabase
    .from("advisor_landing_pages")
    .select(pageSelect)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: advisorCorsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const { user, supabase } = await requireSuperAdmin(req);
    const body = await req.json();
    const action = body.action || "list";

    if (action === "list") {
      return jsonResponse(200, { pages: await listPages(supabase) });
    }

    if (action === "create_or_update") {
      const advisorName = String(body.advisorName || "").trim();
      const advisorEmail = normalizeEmail(body.advisorEmail);
      const companyName = String(body.companyName || "").trim() || null;
      const title = String(body.title || "").trim();
      const assessmentType = body.assessmentType as AssessmentType;
      const discountPercentRaw = Number(body.discountPercent);
      const commissionPercentRaw = Number(body.commissionPercent);
      const discountPercent = Number.isFinite(discountPercentRaw) ? discountPercentRaw : undefined;
      const commissionPercent = Number.isFinite(commissionPercentRaw) ? commissionPercentRaw : undefined;
      const slug = normalizeSlug(String(body.slug || title || advisorName));
      const isActive = Boolean(body.isActive);
      const landingPageId = body.landingPageId ? String(body.landingPageId) : null;

      if (!advisorName || !advisorEmail || !title || !slug) {
        return jsonResponse(400, { error: "Advisor name, advisor email, title, and slug are required" });
      }

      if (!["premium", "pro"].includes(assessmentType)) {
        return jsonResponse(400, { error: "Assessment type must be premium or pro" });
      }

      const { data: existingAdvisor, error: advisorLookupError } = await supabase
        .from("advisors")
        .select("*")
        .eq("email", advisorEmail)
        .maybeSingle();

      if (advisorLookupError) throw advisorLookupError;

      const advisorPayload = {
        name: advisorName,
        email: advisorEmail,
        company_name: companyName,
        created_by: user.id,
        created_by_email: user.email,
      };

      const { data: advisor, error: advisorError } = existingAdvisor
        ? await supabase.from("advisors").update(advisorPayload).eq("id", existingAdvisor.id).select("*").single()
        : await supabase.from("advisors").insert(advisorPayload).select("*").single();

      if (advisorError) throw advisorError;

      const price = calculateAdvisorPrice(assessmentType, discountPercent, commissionPercent);
      const pagePayload = {
        advisor_id: advisor.id,
        title,
        slug,
        assessment_type: assessmentType,
        discount_percent: price.discountPercent,
        commission_percent: price.commissionPercent,
        is_active: isActive,
        hero_headline: String(body.heroHeadline || `Take the ${price.product.name} with ${advisorName}`).trim(),
        hero_subheadline: String(body.heroSubheadline || `Save ${price.discountPercent}% through ${advisorName}'s advisor link.`).trim(),
        created_by: user.id,
        created_by_email: user.email,
      };

      const { data: page, error: pageError } = landingPageId
        ? await supabase.from("advisor_landing_pages").update(pagePayload).eq("id", landingPageId).select("*").single()
        : await supabase.from("advisor_landing_pages").insert(pagePayload).select("*").single();

      if (pageError) throw pageError;

      await logAdminAction({
        supabase,
        actorId: user.id,
        actorEmail: user.email,
        actionType: landingPageId ? "advisor_landing_page_updated" : "advisor_landing_page_created",
        targetType: "advisor_landing_page",
        targetId: page.id,
        targetLabel: page.title,
        metadata: { advisor_id: advisor.id, slug, assessment_type: assessmentType },
      });

      return jsonResponse(200, { page, advisor, pages: await listPages(supabase) });
    }

    if (action === "set_active") {
      const pageId = String(body.pageId || "");
      const isActive = Boolean(body.isActive);
      if (!pageId) return jsonResponse(400, { error: "pageId is required" });

      const { data: page, error } = await supabase
        .from("advisor_landing_pages")
        .update({ is_active: isActive })
        .eq("id", pageId)
        .select("*")
        .single();

      if (error) throw error;

      await logAdminAction({
        supabase,
        actorId: user.id,
        actorEmail: user.email,
        actionType: isActive ? "advisor_landing_page_activated" : "advisor_landing_page_deactivated",
        targetType: "advisor_landing_page",
        targetId: page.id,
        targetLabel: page.title,
        metadata: { slug: page.slug },
      });

      return jsonResponse(200, { page, pages: await listPages(supabase) });
    }

    if (action === "invite_advisor") {
      const advisorId = String(body.advisorId || "");
      const origin = getOrigin(req);
      const redirectTo = String(body.redirectTo || `${origin}/advisor-portal`).trim();
      if (!advisorId) return jsonResponse(400, { error: "advisorId is required" });

      const { data: advisor, error: advisorError } = await supabase
        .from("advisors")
        .select("*")
        .eq("id", advisorId)
        .single();

      if (advisorError) throw advisorError;

      const { data: existingUserId, error: existingUserError } = await supabase.rpc("resolve_auth_user_id_by_email", {
        _email: advisor.email,
      });

      if (existingUserError) {
        console.warn("Could not resolve existing auth user by email:", existingUserError.message);
      }

      if (existingUserId) {
        await supabase.from("advisors").update({ user_id: existingUserId }).eq("id", advisor.id);

        await sendMailgunEmail({
          to: advisor.email,
          subject: "Your Role Color Finder advisor portal access is ready",
          html: buildAdvisorInviteEmailHtml({
            heading: "Your advisor portal is ready",
            intro: `${user.email} gave your existing Role Color Finder account advisor portal access.`,
            ctaLabel: "Open your advisor portal",
            ctaHref: redirectTo,
          }),
        });

        await logAdminAction({
          supabase,
          actorId: user.id,
          actorEmail: user.email,
          actionType: "advisor_existing_user_linked",
          targetType: "advisor",
          targetId: advisor.id,
          targetLabel: advisor.email,
        });

        return jsonResponse(200, {
          advisorId: advisor.id,
          invited: true,
          existingUser: true,
          userId: existingUserId,
        });
      }

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "invite",
        email: advisor.email,
        options: {
          data: {
            role: "advisor",
            advisor_id: advisor.id,
            full_name: advisor.name,
          },
          redirectTo,
        },
      });

      if (linkError) throw linkError;

      if (linkData.user?.id) {
        await supabase.from("advisors").update({ user_id: linkData.user.id }).eq("id", advisor.id);
      }

      const inviteUrl = linkData.properties?.action_link;
      if (!inviteUrl) {
        return jsonResponse(500, { error: "Supabase did not return an invite link." });
      }

      await sendMailgunEmail({
        to: advisor.email,
        subject: "Your Role Color Finder advisor portal invite",
        html: buildAdvisorInviteEmailHtml({
          heading: "You have been invited to Role Color Finder",
          intro: `${user.email} invited you to access your advisor portal.`,
          ctaLabel: "Create your advisor portal login",
          ctaHref: inviteUrl,
        }),
      });

      await logAdminAction({
        supabase,
        actorId: user.id,
        actorEmail: user.email,
        actionType: "advisor_invited",
        targetType: "advisor",
        targetId: advisor.id,
        targetLabel: advisor.email,
      });

      return jsonResponse(200, { advisorId: advisor.id, invited: true, userId: linkData.user?.id ?? null });
    }

    return jsonResponse(400, { error: `Unsupported action: ${action}` });
  } catch (error) {
    console.error("manage-advisor-landing-pages error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse(status, { error: message });
  }
});
