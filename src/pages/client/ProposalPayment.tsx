import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import type { Proposal } from "@/pages/admin/ProposalManager";
import { fetchLatestProposalBySlug } from "@/lib/clientProposals";
import { parseProposalFeeToCents, formatDeploymentFeeLabel } from "@/lib/proposalPricing";

async function getFunctionErrorMessage(error: unknown, fallback: string) {
  const context = (error as { context?: Response } | null)?.context;
  if (context) {
    try {
      const body = await context.clone().json();
      if (typeof body?.error === "string") return body.error;
    } catch {
      // Fall back to the SDK error below if the body is not JSON.
    }
  }

  return error instanceof Error ? error.message : fallback;
}

export default function ProposalPayment() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const acceptanceId = searchParams.get("acceptance_id");
  const isPreview = searchParams.get("preview") === "1";

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); return; }
    // If no acceptance id, go back to agreement
    if (!acceptanceId) { navigate(`/client/${slug}/agreement`); return; }

    fetchLatestProposalBySlug(slug).then(({ data, error }) => {
        if (error || !data) { setNotFound(true); return; }
        setProposal(data);
        document.title = `Payment — ${data.proposal_title} | RoleColorFinder`;
      });
  }, [slug, acceptanceId, navigate]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-5xl font-bold text-slate-300 mb-4">404</p>
          <p className="text-slate-600">Proposal not found.</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-400" />
      </div>
    );
  }

  const setupFeeCents = parseProposalFeeToCents(proposal.pricing.platformDeployment);
  const setupFeeLabel = formatDeploymentFeeLabel(proposal.pricing.platformDeployment);
  const canPay = setupFeeCents !== null;
  const isDeploymentWaived = setupFeeCents === 0;

  async function handlePay() {
    if (loading || !canPay) return;
    setLoading(true);
    try {
      const origin = window.location.origin;
      if (isPreview) {
        navigate(`/client/${slug}/success?session_id=preview&acceptance_id=preview&preview=1`);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-proposal-payment", {
        body: {
          proposalSlug: slug,
          proposalId: proposal!.proposal_id,
          companyName: proposal!.company_name,
          acceptanceId,
          successUrl: `${origin}/client/${slug}/success`,
          cancelUrl: `${origin}/client/${slug}/payment?acceptance_id=${acceptanceId}`,
        },
      });

      if (error || !data?.url) {
        throw new Error(await getFunctionErrorMessage(error, "Failed to create payment session"));
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Payment Error", description: msg, variant: "destructive" });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#e0f2fe,_transparent_45%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff_45%,_#f8fafc)]">
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <img
            src="/uploads/2842bc15-73da-4523-b9c9-228cb076346e.png"
            alt="RoleColorFinder"
            className="h-10 mx-auto object-contain"
          />
          <Badge className="border-emerald-300/40 bg-emerald-500/20 text-emerald-700">
            {isPreview ? "Preview Payment" : "Secure Payment"}
          </Badge>
          <h1 className="text-3xl font-bold text-slate-900">Complete Your Deployment</h1>
          <p className="text-slate-500 text-sm">
            {isPreview
              ? "Preview mode shows this payment step without opening Stripe or charging a card."
              : isDeploymentWaived
                ? "Your agreement has been signed. One final step — save a card for future monthly billing to begin onboarding."
                : "Your agreement has been signed. One final step — pay the platform deployment fee to begin onboarding."}
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-0">
          {[
            { label: "Review Proposal", done: true },
            { label: "Sign Agreement", done: true },
            { label: "Payment", done: false, active: true },
            { label: "Onboarding", done: false },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className={`flex flex-col items-center gap-1 w-28 ${step.active ? "opacity-100" : step.done ? "opacity-70" : "opacity-40"}`}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? "bg-emerald-500 text-white" : step.active ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>
                  {step.done ? "✓" : i + 1}
                </div>
                <span className="text-[11px] text-center text-slate-600 leading-tight">{step.label}</span>
              </div>
              {i < 3 && <div className="h-px w-8 bg-slate-300 mb-4" />}
            </div>
          ))}
        </div>

        {/* Invoice summary */}
        <Card className="rounded-3xl border-slate-200 bg-white shadow-lg">
          <CardContent className="p-7 md:p-10 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-l-4 border-emerald-500 pl-4">
              Payment Summary
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                <p className="font-medium text-slate-900">{isDeploymentWaived ? "Platform Deployment Fee Waived" : "Platform Deployment Fee"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">One-time fee · {proposal.company_name}</p>
                </div>
                <p className="text-lg font-bold text-slate-900">{setupFeeLabel}</p>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-slate-500">Proposal ID</p>
                </div>
                <p className="text-sm font-mono text-slate-700">{proposal.proposal_id}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm text-slate-600">
                <p className="font-semibold text-slate-800 mb-1">What's included:</p>
                <ul className="space-y-1 pl-1">
                  <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Full platform setup &amp; configuration</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Dedicated onboarding specialist</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Account provisioned within 1–2 business days</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Access to all platform modules from day one</li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <p className="font-bold text-slate-900 text-lg">Total Due Today</p>
                <p className="text-2xl font-bold text-slate-900">{setupFeeLabel}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full h-12 text-base gap-2 bg-slate-900 hover:bg-slate-800"
                onClick={handlePay}
                disabled={loading || !canPay}
              >
                {loading ? (
                  <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Redirecting to Stripe…</>
                ) : !canPay ? (
                  "Payment amount unavailable"
                ) : isPreview ? (
                  <><CreditCard className="h-5 w-5" /> Preview Payment Success</>
                ) : isDeploymentWaived ? (
                  <><CreditCard className="h-5 w-5" /> Save Card for Future Billing</>
                ) : (
                  <><CreditCard className="h-5 w-5" /> Pay {setupFeeLabel} Securely</>
                )}
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> SSL Encrypted</span>
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Powered by Stripe</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 max-w-sm mx-auto">
          You will be redirected to Stripe's secure checkout. After payment, you will be asked to provide
          your contact details so our team can begin account setup.
        </p>
      </div>
    </div>
  );
}
