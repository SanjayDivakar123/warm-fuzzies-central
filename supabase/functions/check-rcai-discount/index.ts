import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  RCAI_DISCOUNT_PCT,
  checkRcaiDiscount,
  createServiceClient,
  getUserFromAuthHeader,
  isRcaiDiscountEligibleProduct,
} from "../_shared/rcaiDiscount.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createServiceClient();
    const user = await getUserFromAuthHeader(supabase, req.headers.get("Authorization"));
    const url = new URL(req.url);
    let productType: string | null = url.searchParams.get("productType");
    if (!productType && req.method !== "GET") {
      try {
        const body = await req.json();
        productType = body?.productType ?? null;
      } catch (_) { /* ignore empty body */ }
    }
    console.log("[check-rcai-discount] user:", user?.id, "email:", user?.email, "productType:", productType);

    if (!user) {
      return new Response(JSON.stringify({ eligible: false, reason: "no_user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (productType && !isRcaiDiscountEligibleProduct(productType)) {
      return new Response(JSON.stringify({ eligible: false, reason: "ineligible_product" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const status = await checkRcaiDiscount(supabase, user.id, user.email);
    return new Response(
      JSON.stringify({ ...status, discountPct: status.eligible ? RCAI_DISCOUNT_PCT : 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    console.error("check-rcai-discount error:", err);
    return new Response(JSON.stringify({ eligible: false, error: (err as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});