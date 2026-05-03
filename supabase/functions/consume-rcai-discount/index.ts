import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  createServiceClient,
  getUserFromAuthHeader,
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
    if (!user) {
      return new Response(JSON.stringify({ consumed: false, reason: "no_user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const body = await req.json().catch(() => ({}));
    const assessmentId: string | null = body.assessmentId ?? null;
    const orderId: string | null = body.orderId ?? body.stripeSessionId ?? null;

    // Atomic guard: only succeeds if consumed_at IS NULL.
    let { data, error } = await supabase
      .from("rolecolorai_assessment_discounts")
      .update({
        consumed_at: new Date().toISOString(),
        consumed_assessment_id: assessmentId,
        consumed_order_id: orderId,
      })
      .eq("user_id", user.id)
      .is("consumed_at", null)
      .select("id, consumed_at");

    if ((!data || data.length === 0) && user.email) {
      const byEmail = await supabase
        .from("rolecolorai_assessment_discounts")
        .update({
          consumed_at: new Date().toISOString(),
          consumed_assessment_id: assessmentId,
          consumed_order_id: orderId,
        })
        .eq("email", user.email.toLowerCase())
        .is("consumed_at", null)
        .select("id, consumed_at");
      if (!byEmail.error) {
        data = byEmail.data;
        error = byEmail.error;
      } else {
        console.warn("consume-rcai-discount email fallback skipped:", byEmail.error.message);
      }
    }

    if (error) {
      console.error("consume-rcai-discount db error:", error);
      return new Response(JSON.stringify({ consumed: false, error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!data || data.length === 0) {
      // Either no row, or already consumed by a concurrent request.
      return new Response(JSON.stringify({ consumed: false, reason: "no_eligible_redemption" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ consumed: true, redemption: data[0] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("consume-rcai-discount error:", err);
    return new Response(JSON.stringify({ consumed: false, error: (err as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});