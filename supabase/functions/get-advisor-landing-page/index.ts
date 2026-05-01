import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  advisorCorsHeaders,
  calculateAdvisorPrice,
  createServiceClient,
  formatMoney,
  jsonResponse,
  normalizeSlug,
  type AssessmentType,
} from "../_shared/advisorLanding.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: advisorCorsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const { slug } = await req.json();
    const safeSlug = normalizeSlug(String(slug || ""));
    if (!safeSlug) {
      return jsonResponse(400, { error: "Landing page slug is required" });
    }

    const supabase = createServiceClient();
    const { data: page, error } = await supabase
      .from("advisor_landing_pages")
      .select("id,title,slug,assessment_type,discount_percent,is_active,hero_headline,hero_subheadline,advisor:advisors(id,name,email,company_name)")
      .eq("slug", safeSlug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    if (!page) {
      return jsonResponse(404, { error: "Advisor landing page not found" });
    }

    const price = calculateAdvisorPrice(page.assessment_type as AssessmentType, page.discount_percent);

    return jsonResponse(200, {
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        assessmentType: page.assessment_type,
        heroHeadline: page.hero_headline,
        heroSubheadline: page.hero_subheadline,
        advisorName: page.advisor?.name,
        advisorCompanyName: page.advisor?.company_name,
        discountPercent: price.discountPercent,
        originalAmountMinor: price.originalAmountMinor,
        discountedAmountMinor: price.discountedAmountMinor,
        originalPriceFormatted: formatMoney(price.originalAmountMinor),
        discountedPriceFormatted: formatMoney(price.discountedAmountMinor),
        productName: price.product.name,
        productDescription: price.product.description,
      },
    });
  } catch (error) {
    console.error("get-advisor-landing-page error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
});
