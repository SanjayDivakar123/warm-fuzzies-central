import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  advisorCorsHeaders,
  createServiceClient,
  getAdvisorForAuthUser,
  jsonResponse,
} from "../_shared/advisorLanding.ts";

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{6})$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: advisorCorsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const supabase = createServiceClient();
    const { advisor } = await getAdvisorForAuthUser(req, supabase);
    const body = await req.json().catch(() => ({}));
    const primaryColor = String(body?.primaryColor || "").trim();
    const secondaryColor = String(body?.secondaryColor || "").trim();

    if (!HEX_COLOR_REGEX.test(primaryColor) || !HEX_COLOR_REGEX.test(secondaryColor)) {
      return jsonResponse(400, { error: "Colors must be valid hex values like #0f172a." });
    }

    const { data: page, error: pageError } = await supabase
      .from("advisor_landing_pages")
      .select("id")
      .eq("advisor_id", advisor.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pageError) throw pageError;
    if (!page) return jsonResponse(404, { error: "No landing page found for this advisor." });

    const { data: updatedPage, error: updateError } = await supabase
      .from("advisor_landing_pages")
      .update({
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      })
      .eq("id", page.id)
      .select("id, primary_color, secondary_color")
      .single();
    if (updateError) throw updateError;

    return jsonResponse(200, { page: updatedPage });
  } catch (error) {
    console.error("advisor-update-landing-page-style error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return jsonResponse(status, { error: message });
  }
});
