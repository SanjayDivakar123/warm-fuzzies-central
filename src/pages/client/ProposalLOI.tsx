import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateLOIPdf } from "@/lib/proposalPdfExport";
import { Download, FileText, PenLine, CheckCircle2, ChevronDown } from "lucide-react";
import type { Proposal, ProposalPricing } from "@/pages/admin/ProposalManager";

export default function ProposalLOI() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [acceptanceId, setAcceptanceId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  useEffect(() => {
    if (!slug) { setNotFound(true); return; }

    Promise.all([
      supabase.from("client_proposals").select("*").eq("slug", slug).maybeSingle(),
      supabase.from("proposal_acceptances")
        .select("id")
        .eq("proposal_slug", slug)
        .eq("payment_status", "paid")
        .limit(1),
    ]).then(([proposalRes, paidRes]) => {
      if (proposalRes.error || !proposalRes.data) { setNotFound(true); return; }

      // Already paid — send back to the proposal page
      if (!paidRes.error && (paidRes.data ?? []).length > 0) {
        navigate(`/client/${slug}`, { replace: true });
        return;
      }

      setProposal({
        ...proposalRes.data,
        pricing: proposalRes.data.pricing as unknown as ProposalPricing,
        status: (proposalRes.data.status ?? "active") as "active" | "draft",
      });
      document.title = `Letter of Intent — ${proposalRes.data.proposal_title} | RoleColorFinder`;
    });
  }, [slug, navigate]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Proposal not found.</p>
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

  const { pricing, company_name: company } = proposal;
  const canSign = agreed && signedName.trim().length >= 2;

  async function handleSign() {
    if (!canSign || submitting) return;
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("proposal_acceptances")
        .insert({
          proposal_slug: slug!,
          loi_signed_name: signedName.trim(),
          loi_signed_at: now,
          status: "loe_pending",
        })
        .select("id").single();

      if (error || !data) throw error ?? new Error("Failed to record signature");
      setAcceptanceId(data.id);
      setSigned(true);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Please try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload() {
    if (!proposal) return;
    setGenerating(true);
    try {
      const signedAt = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
      generateLOIPdf(company, proposal.proposal_id, pricing, signedName.trim(), signedAt);
    } catch {
      toast({ title: "PDF generation failed", description: "Please try again", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  function handleContinue() {
    navigate(`/client/${slug}/loe?acceptance_id=${acceptanceId}`);
  }

  /* ─── Signed state ─── */
  if (signed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full rounded-3xl border-emerald-200 shadow-2xl">
          <CardContent className="p-10 text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Letter of Intent Signed</h2>
              <p className="text-slate-500 text-sm mt-2">
                Your signature has been recorded. Download your copy of the LOI, then proceed to sign the Letter of Engagement.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left space-y-2 text-sm">
              <p className="text-slate-500">Signed by</p>
              <p className="font-serif text-xl italic text-slate-900">{signedName}</p>
              <p className="text-slate-500 text-xs">{company} · {today}</p>
            </div>
            <div className="space-y-3">
              <Button className="w-full gap-2 h-11 bg-slate-900 hover:bg-slate-800" onClick={handleDownload} disabled={generating}>
                {generating
                  ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Generating PDF…</>
                  : <><Download className="h-4 w-4" /> Download LOI as PDF</>}
              </Button>
              <Button className="w-full gap-2 h-11" variant="outline" onClick={handleContinue}>
                Continue to Letter of Engagement →
              </Button>
            </div>
            <p className="text-xs text-slate-400">Next: Review and sign the Letter of Engagement, then complete payment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ─── Main document view ─── */
  return (
    <div className="min-h-screen bg-slate-100">

      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/uploads/2842bc15-73da-4523-b9c9-228cb076346e.png" alt="RCF" className="h-7 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">{proposal.proposal_id}</p>
              <p className="text-sm font-semibold text-slate-900 leading-tight truncate">{company}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Step pills */}
            {[
              { n: 1, label: "LOI", active: true, done: false },
              { n: 2, label: "LOE", active: false, done: false },
              { n: 3, label: "Payment", active: false, done: false },
            ].map((s) => (
              <div key={s.n} className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${s.active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200"}`}>
                <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${s.active ? "bg-white text-slate-900" : "bg-slate-100 text-slate-400"}`}>{s.n}</span>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-0">

        {/* Document shell */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Document hero header */}
          <div className="bg-slate-950 px-8 py-10 md:px-14 md:py-14">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge className="mb-4 border-emerald-400/30 bg-emerald-500/20 text-emerald-300 text-xs tracking-widest">
                  DOCUMENT 1 OF 2
                </Badge>
                <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                  Letter of<br />Intent
                </h1>
                <p className="mt-4 text-slate-400 text-sm md:text-base max-w-lg leading-relaxed">
                  This document expresses {company}'s intent to engage RoleColorFinder as a strategic
                  partner for role intelligence, team alignment, and hiring performance services.
                </p>
              </div>
              <FileText className="h-12 w-12 text-slate-700 shrink-0 hidden md:block mt-2" />
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-xs">
              {[
                { label: "PROPOSAL ID", value: proposal.proposal_id },
                { label: "DATE", value: today },
                { label: "PARTIES", value: `${company} & RoleColorFinder LLC` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                  <p className="text-slate-500 uppercase tracking-widest text-[10px] mb-0.5">{item.label}</p>
                  <p className="text-white font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll hint */}
          <div className="flex items-center justify-center gap-2 border-b border-slate-100 bg-blue-50 py-2.5 text-xs text-blue-700">
            <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
            Scroll down to read the full document, then sign at the bottom
          </div>

          {/* Document body */}
          <div className="px-8 py-10 md:px-14 md:py-12 space-y-10 max-w-4xl">

            {/* Recitals */}
            <Section title="RECITALS">
              <P>
                This Letter of Intent ("<strong>LOI</strong>") is submitted by <strong>{company}</strong> ("<strong>Client</strong>") to
                RoleColorFinder LLC ("<strong>RCF</strong>"), a Florida-based role intelligence and talent management
                technology company. This document reflects the Client's sincere and good-faith intent to enter
                into a formal engagement with RCF for the deployment of the RoleColorFinder platform as described
                in Proposal <strong>{proposal.proposal_id}</strong>.
              </P>
              <P>
                RCF has developed a proprietary platform that enables organisations to identify individual work styles,
                align teams for optimal performance, make data-driven hiring decisions, and build scalable execution
                cultures. The Client recognises the strategic value of this platform and its relevance to current
                organisational objectives.
              </P>
              <P>
                Both parties acknowledge that this LOI is intended to initiate formal engagement proceedings and does
                not, except where expressly stated herein, create binding legal obligations on either party.
              </P>
            </Section>

            <Divider />

            <Section title="ARTICLE 1 — STATEMENT OF INTENT">
              <ArticleItem n="1.1">
                {company} hereby expresses its clear and unconditional intent to engage RoleColorFinder LLC as
                its strategic partner for the implementation, deployment, and ongoing operation of the
                RoleColorFinder platform across its organisation.
              </ArticleItem>
              <ArticleItem n="1.2">
                This intent encompasses the full scope of services described in Proposal {proposal.proposal_id},
                including platform deployment, employee onboarding and assessment, team intelligence reporting,
                hiring intelligence tools, and ongoing platform access.
              </ArticleItem>
              <ArticleItem n="1.3">
                The Client confirms that the appropriate internal approvals and stakeholder authorisations have
                been obtained, or are in the process of being obtained, to enter into a formal engagement with RCF.
              </ArticleItem>
              <ArticleItem n="1.4">
                The Client further confirms that it is not party to any agreement or obligation that would
                prevent, limit, or restrict its ability to engage RCF for the services described herein.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 2 — SCOPE OF INTENDED ENGAGEMENT">
              <P>The intended scope of engagement includes the following core service areas:</P>
              <BulletList items={[
                { title: "Role Intelligence & Team Assessment", body: `Deployment of the RoleColorFinder assessment platform to all enrolled employees, generating individual RoleColor profiles that identify each person's natural work style, contribution mode, and team compatibility.` },
                { title: "Team Alignment & Performance Optimisation", body: `Organisation-wide team mapping and gap analysis to identify structural misalignments, communication inefficiencies, and execution blockers across departments and management levels.` },
                { title: "Hiring Intelligence", body: `Integration of RCF's hiring intelligence module into the Client's recruitment workflows, including role-fit scoring, candidate profiling, interview question generation, and post-hire outcome tracking.` },
                { title: "Platform Administration & Reporting", body: `Access to the RCF administrative dashboard, including real-time team insights, analytics reporting, individual development plans, and leadership performance metrics.` },
                { title: "Dedicated Onboarding & Implementation Support", body: `A dedicated RCF implementation specialist will oversee platform configuration, employee onboarding sessions, manager training, and initial performance benchmarking.` },
              ]} />
              <ArticleItem n="2.2">
                The precise scope, deliverable schedule, and integration requirements will be formally defined
                in the Letter of Engagement to be executed by both parties following payment of the platform
                deployment fee.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 3 — KEY FINANCIAL TERMS">
              <ArticleItem n="3.1">
                The Client acknowledges and accepts the investment structure outlined in Proposal {proposal.proposal_id}.
                The following summary represents the agreed financial framework and is valid for twelve (12) months
                from the date of this Letter of Intent.
              </ArticleItem>
              <PricingTable pricing={pricing} />
              <ArticleItem n="3.2">
                The Platform Deployment Fee of <strong>{pricing.platformDeployment}</strong> is a one-time, non-refundable
                investment payable in full upon execution of the Letter of Engagement.
              </ArticleItem>
              <ArticleItem n="3.3">
                Monthly recurring fees will be invoiced on the first business day of each calendar month,
                commencing thirty (30) days after the completion of platform deployment. All invoices are
                payable within fifteen (15) days of issuance.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 4 — PROPOSED IMPLEMENTATION TIMELINE">
              <ArticleItem n="4.1">
                Subject to timely completion of the platform deployment payment and execution of the Letter of
                Engagement, both parties intend to adhere to the following implementation timeline:
              </ArticleItem>
              <TimelineList items={[
                { period: "Day 1–2", desc: "Platform deployment fee received; account provisioning initiated by RCF team." },
                { period: "Day 3–7", desc: "Platform fully configured; administrative access granted to Client's designated contact." },
                { period: "Week 2–3", desc: "Employee assessment invitations deployed; initial RoleColor profiling completed." },
                { period: "Week 4–5", desc: "Team intelligence reports generated; first team alignment sessions conducted." },
                { period: "Month 2", desc: "Hiring Intelligence module activated; platform operational across all departments." },
                { period: "Month 3", desc: "Quarterly performance review and optimisation session conducted." },
              ]} />
            </Section>

            <Divider />

            <Section title="ARTICLE 5 — EXCLUSIVITY AND RESERVATION">
              <ArticleItem n="5.1">
                Upon signing this LOI and completing the platform deployment payment, RCF will reserve an
                exclusive onboarding slot for {company} and will not offer the same deployment window to a
                competing organisation in the same industry sector and geographical market.
              </ArticleItem>
              <ArticleItem n="5.2">
                In the event that the Client does not complete the platform deployment payment within
                fourteen (14) days of signing this LOI, the reserved onboarding slot will be released and
                this exclusivity commitment will be void.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 6 — NON-BINDING NATURE">
              <ArticleItem n="6.1">
                Except for the provisions of Article 7 (Confidentiality), this Letter of Intent is non-binding
                and does not obligate either party to complete the contemplated engagement. Binding obligations
                arise only upon the execution of the Letter of Engagement and payment of the platform deployment fee.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 7 — CONFIDENTIALITY">
              <ArticleItem n="7.1">
                Both parties agree to maintain strict confidentiality regarding the existence and terms of this LOI
                and all related proposal documentation. Neither party shall disclose the contents of this LOI to
                any third party without prior written consent of the other party.
              </ArticleItem>
              <ArticleItem n="7.2">
                The confidentiality obligations contained in this Article 7 are binding and shall survive the
                termination or expiration of this LOI for a period of three (3) years.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 8 — GOVERNING LAW & EXPIRATION">
              <ArticleItem n="8.1">
                This Letter of Intent shall be governed by the laws of the State of Florida, United States.
                Any disputes shall be submitted to binding arbitration in Miami, Florida.
              </ArticleItem>
              <ArticleItem n="8.2">
                This LOI shall remain open for acceptance for thirty (30) calendar days from the date of
                issuance. After this period, the terms contained herein may be revised by RCF.
              </ArticleItem>
              <ArticleItem n="8.3">
                This LOI may be executed electronically. An electronic signature shall be deemed legally
                valid and binding under applicable law.
              </ArticleItem>
            </Section>

          </div>

          {/* Signature section */}
          <div className="border-t-2 border-dashed border-slate-200 bg-slate-50 px-8 py-10 md:px-14">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                  <PenLine className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Sign — Letter of Intent</h3>
                  <p className="text-sm text-slate-500">Step 1 of 2 signatures required</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <Checkbox id="loi-agree" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
                  <Label htmlFor="loi-agree" className="text-sm text-slate-700 cursor-pointer leading-relaxed">
                    I have read the entire Letter of Intent, I understand its contents, and I confirm I am
                    authorised to sign on behalf of <strong>{company}</strong>.
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loi-name" className="text-sm font-medium">
                    Full Legal Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="loi-name"
                    placeholder="Type your full legal name to sign"
                    value={signedName}
                    onChange={(e) => setSignedName(e.target.value)}
                    className="h-12 text-base bg-white"
                  />
                </div>

                {signedName.trim().length >= 2 && (
                  <div className="rounded-2xl border border-violet-200 bg-white px-5 py-4">
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Signature Preview</p>
                    <p className="font-serif text-3xl italic text-slate-900">{signedName}</p>
                    <p className="text-xs text-slate-400 mt-2">{today} · {company}</p>
                  </div>
                )}

                <Button
                  className="w-full h-12 text-base gap-2 bg-slate-900 hover:bg-slate-800"
                  disabled={!canSign || submitting}
                  onClick={handleSign}
                >
                  {submitting
                    ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Recording Signature…</>
                    : <><PenLine className="h-5 w-5" /> Sign Letter of Intent</>}
                </Button>

                <p className="text-center text-xs text-slate-400">
                  After signing, you will be able to download the signed LOI as a PDF before proceeding to the Letter of Engagement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-0.5 w-5 bg-indigo-500 shrink-0" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600">{title}</h2>
      </div>
      <div className="pl-0 space-y-3">{children}</div>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-700 text-sm leading-7">{children}</p>;
}

function ArticleItem({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs font-bold text-slate-400 pt-0.5 w-8 shrink-0">{n}</span>
      <p className="text-slate-700 text-sm leading-7 flex-1">{children}</p>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-slate-100" />;
}

function BulletList({ items }: { items: { title: string; body: string }[] }) {
  return (
    <div className="space-y-3 my-2">
      {items.map((item) => (
        <div key={item.title} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-0.5">{item.title}</p>
            <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineList({ items }: { items: { period: string; desc: string }[] }) {
  return (
    <div className="relative pl-6 space-y-4 my-2 border-l-2 border-slate-200">
      {items.map((item, i) => (
        <div key={i} className="relative">
          <div className="absolute -left-[1.45rem] top-1 h-3 w-3 rounded-full bg-slate-300 border-2 border-white" />
          <p className="text-xs font-bold text-indigo-600 mb-0.5">{item.period}</p>
          <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

function PricingTable({ pricing }: { pricing: ProposalPricing }) {
  const rows = [
    { category: "One-Time", label: "Platform Deployment Fee", value: pricing.platformDeployment },
    { category: "One-Time", label: "Employee Onboarding (per employee)", value: pricing.employeeOnboarding },
    { category: "Monthly", label: "Core Platform Access", value: pricing.corePlatformMonthly },
    { category: "Monthly", label: "Hiring Intelligence Platform", value: pricing.hiringIntelligenceMonthly },
    { category: "Monthly", label: `Included: ${pricing.includedJobRoles} roles · ${pricing.applicantsPerRole} applicants/role`, value: "Included" },
    { category: "Scaling", label: pricing.scalingNote, value: pricing.scalingPrice },
    { category: "Outcome", label: "Per successful hire", value: pricing.outcomePrice },
  ];

  const colorMap: Record<string, string> = {
    "One-Time": "bg-emerald-100 text-emerald-700",
    "Monthly": "bg-blue-100 text-blue-700",
    "Scaling": "bg-amber-100 text-amber-700",
    "Outcome": "bg-violet-100 text-violet-700",
  };

  return (
    <div className="my-4 rounded-2xl border border-emerald-200 overflow-hidden">
      <div className="bg-emerald-600 px-5 py-3 flex items-center justify-between">
        <p className="text-white font-semibold text-sm">Investment Summary</p>
        <p className="text-emerald-100 text-xs">Valid 12 months from signing</p>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((row, i) => (
          <div key={i} className={`flex items-center justify-between px-5 py-3 ${i % 2 === 1 ? "bg-slate-50" : "bg-white"}`}>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${colorMap[row.category]}`}>{row.category}</span>
              <span className="text-sm text-slate-700">{row.label}</span>
            </div>
            <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
