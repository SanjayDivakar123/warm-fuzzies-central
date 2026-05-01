import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  advisorCorsHeaders,
  createServiceClient,
  getAdvisorForAuthUser,
  getStripe,
  jsonResponse,
} from "../_shared/advisorLanding.ts";

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

    let currentAdvisor = advisor;
    if (advisor.stripe_connect_account_id) {
      try {
        const account = await getStripe().accounts.retrieve(advisor.stripe_connect_account_id);
        const status = account.details_submitted
          ? account.charges_enabled && account.payouts_enabled
            ? "ready"
            : "restricted"
          : "onboarding_started";

        const { data } = await supabase
          .from("advisors")
          .update({
            stripe_connect_status: status,
            charges_enabled: Boolean(account.charges_enabled),
            payouts_enabled: Boolean(account.payouts_enabled),
            details_submitted: Boolean(account.details_submitted),
          })
          .eq("id", advisor.id)
          .select("*")
          .single();

        currentAdvisor = data ?? advisor;
      } catch (error) {
        console.warn("Unable to refresh Stripe Connect account:", error);
      }
    }

    const [{ data: pages, error: pagesError }, { data: submissions, error: submissionsError }, { data: commissions, error: commissionsError }] =
      await Promise.all([
        supabase
          .from("advisor_landing_pages")
          .select("*")
          .eq("advisor_id", advisor.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("advisor_landing_submissions")
          .select("id,landing_page_id,guest_name,guest_email,assessment_type,status,discounted_amount_minor,currency,result_summary,completed_at,created_at")
          .eq("advisor_id", advisor.id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("advisor_commissions")
          .select("*")
          .eq("advisor_id", advisor.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

    if (pagesError) throw pagesError;
    if (submissionsError) throw submissionsError;
    if (commissionsError) throw commissionsError;

    return jsonResponse(200, {
      advisor: currentAdvisor,
      pages: pages ?? [],
      submissions: submissions ?? [],
      commissions: commissions ?? [],
      stats: {
        pages: pages?.length ?? 0,
        submissions: submissions?.length ?? 0,
        completed: (submissions ?? []).filter((submission: any) => submission.status === "completed").length,
        revenueMinor: (submissions ?? []).reduce((sum: number, submission: any) => sum + (submission.discounted_amount_minor || 0), 0),
        commissionMinor: (commissions ?? []).reduce((sum: number, commission: any) => sum + (commission.commission_amount_minor || 0), 0),
      },
    });
  } catch (error) {
    console.error("advisor-portal-summary error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return jsonResponse(status, { error: message });
  }
});
