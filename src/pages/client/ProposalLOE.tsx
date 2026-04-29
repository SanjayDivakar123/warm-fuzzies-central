import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateLOEPdf } from "@/lib/proposalPdfExport";
import { Download, ShieldCheck, PenLine, CheckCircle2, ChevronDown } from "lucide-react";
import type { Proposal } from "@/pages/admin/ProposalManager";
import { fetchLatestProposalBySlug } from "@/lib/clientProposals";
import { parseProposalFeeToCents, formatDeploymentFeeLabel } from "@/lib/proposalPricing";

export default function ProposalLOE() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const acceptanceId = searchParams.get("acceptance_id");
  const isPreview = searchParams.get("preview") === "1";

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [generating, setGenerating] = useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  useEffect(() => {
    if (!slug) { setNotFound(true); return; }
    if (!acceptanceId) { navigate(`/client/${slug}/loi`); return; }

    Promise.all([
      fetchLatestProposalBySlug(slug),
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

      setProposal(proposalRes.data);
      document.title = `Letter of Engagement — ${proposalRes.data.proposal_title} | RoleColorFinder`;
    });
  }, [slug, acceptanceId, navigate]);

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
  const setupFee = parseProposalFeeToCents(pricing.platformDeployment);
  const setupFeeLabel = formatDeploymentFeeLabel(pricing.platformDeployment);
  const canSign = agreed && signedName.trim().length >= 2;

  async function handleSign() {
    if (!canSign || submitting || !acceptanceId) return;
    setSubmitting(true);
    try {
      if (isPreview) {
        setSigned(true);
        return;
      }

      const { data, error } = await supabase.functions.invoke("sign-proposal-loe", {
        body: {
          proposalSlug: slug,
          acceptanceId,
          signedName: signedName.trim(),
        },
      });

      if (error || data?.success === false) throw new Error(error?.message ?? data?.error ?? "Failed to record signature");
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
      generateLOEPdf(company, proposal.proposal_id, pricing, signedName.trim(), signedAt);
    } catch {
      toast({ title: "PDF generation failed", description: "Please try again", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  function handleContinue() {
    navigate(`/client/${slug}/payment?acceptance_id=${acceptanceId}${isPreview ? "&preview=1" : ""}`);
  }

  /* ─── Signed state ─── */
  if (signed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full rounded-3xl border-emerald-200 shadow-2xl">
          <CardContent className="p-10 text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{isPreview ? "Letter of Engagement Preview Signed" : "Letter of Engagement Signed"}</h2>
              <p className="text-slate-500 text-sm mt-2">
                {isPreview
                  ? "Preview mode is showing the payment step without recording this signature."
                  : "Both documents are now signed. Download your copy of the LOE, then proceed to complete the platform deployment payment."}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left space-y-2 text-sm">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-semibold">LOI — Signed</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-semibold">LOE — Signed</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="text-slate-500">Signed by</p>
                <p className="font-serif text-xl italic text-slate-900">{signedName}</p>
                <p className="text-slate-500 text-xs">{company} · {today}</p>
              </div>
            </div>
            <div className="space-y-3">
              <Button className="w-full gap-2 h-11 bg-slate-900 hover:bg-slate-800" onClick={handleDownload} disabled={generating}>
                {generating
                  ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Generating PDF…</>
                  : <><Download className="h-4 w-4" /> Download LOE as PDF</>}
              </Button>
              <Button className="w-full gap-2 h-11 bg-emerald-600 hover:bg-emerald-500 text-white" onClick={handleContinue}>
                {setupFee === 0 ? "Proceed to Save Card →" : `Proceed to Payment — ${setupFeeLabel} →`}
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              {setupFee === 0 ? "Final step: save a card for future monthly billing to begin onboarding." : "Final step: pay the platform deployment fee to begin onboarding."}
            </p>
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
            {[
              { n: 1, label: "LOI", active: false, done: true },
              { n: 2, label: "LOE", active: true, done: false },
              { n: 3, label: "Payment", active: false, done: false },
            ].map((s) => (
              <div key={s.n} className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${s.done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : s.active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200"}`}>
                <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${s.done ? "bg-emerald-500 text-white" : s.active ? "bg-white text-slate-900" : "bg-slate-100 text-slate-400"}`}>
                  {s.done ? "✓" : s.n}
                </span>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-0">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Hero header */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-8 py-10 md:px-14 md:py-14">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge className="mb-4 border-emerald-400/30 bg-emerald-500/20 text-emerald-300 text-xs tracking-widest">
                  DOCUMENT 2 OF 2
                </Badge>
                <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                  Letter of<br />Engagement
                </h1>
                <p className="mt-4 text-slate-400 text-sm md:text-base max-w-lg leading-relaxed">
                  This binding agreement governs the scope of services, payment terms, deliverables,
                  and mutual obligations between RoleColorFinder LLC and {company}.
                </p>
              </div>
              <ShieldCheck className="h-12 w-12 text-emerald-700/50 shrink-0 hidden md:block mt-2" />
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-xs">
              {[
                { label: "AGREEMENT DATE", value: today },
                { label: "PROPOSAL ID", value: proposal.proposal_id },
                { label: "SERVICE PROVIDER", value: "RoleColorFinder LLC" },
                { label: "CLIENT", value: company },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <p className="text-slate-500 uppercase tracking-widest text-[10px] mb-0.5">{item.label}</p>
                  <p className="text-white font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll hint */}
          <div className="flex items-center justify-center gap-2 border-b border-slate-100 bg-emerald-50 py-2.5 text-xs text-emerald-700">
            <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
            This is a binding agreement — read every section carefully before signing
          </div>

          {/* Document body */}
          <div className="px-8 py-10 md:px-14 md:py-12 space-y-10 max-w-4xl">

            <Section title="PREAMBLE">
              <P>
                This Letter of Engagement ("<strong>Agreement</strong>") is entered into as of {today} by and
                between <strong>RoleColorFinder LLC</strong>, a limited liability company incorporated in the State
                of Florida, USA ("<strong>RCF</strong>" or "<strong>Service Provider</strong>"), and{" "}
                <strong>{company}</strong> ("<strong>Client</strong>").
              </P>
              <P>
                This Agreement governs the terms under which RCF will provide its role intelligence and talent
                performance platform services to the Client. This Agreement, together with Proposal{" "}
                {proposal.proposal_id}, constitutes the entire understanding between the parties with respect to
                the services described herein, and supersedes all prior negotiations, representations, and
                letters of intent.
              </P>
            </Section>

            <Divider />

            <Section title="ARTICLE 1 — DEFINITIONS">
              <DefinitionList items={[
                { term: '"Platform"', def: 'means the RoleColorFinder software platform, including all modules, tools, dashboards, assessment engines, reporting systems, and related intellectual property owned by RCF.' },
                { term: '"Services"', def: 'means the full scope of services to be provided by RCF as described in Article 2, including Platform Deployment, Employee Onboarding, Core Platform Access, and Hiring Intelligence.' },
                { term: '"Authorised Users"', def: "means the Client's employees, contractors, and designated personnel who are granted access to the Platform under this Agreement." },
                { term: '"Client Data"', def: 'means all data, information, and content uploaded to or generated through the Platform by the Client or its Authorised Users.' },
                { term: '"Confidential Information"', def: 'means all non-public information disclosed by either party that is marked confidential or that a reasonable person would consider confidential given its nature.' },
                { term: '"Deployment Date"', def: "means the date on which the Platform is fully configured and access is granted to the Client's administrators, as confirmed in writing by RCF." },
                { term: '"Subscription Term"', def: 'means the initial twelve (12) month period commencing on the Deployment Date, and each subsequent renewal term unless terminated per Article 12.' },
              ]} />
            </Section>

            <Divider />

            <Section title="ARTICLE 2 — SCOPE OF SERVICES">
              <ArticleItem n="2.1">
                <strong>Platform Deployment.</strong> RCF will configure the Platform for the Client's organisation,
                including custom branding, organisational structure setup, role mapping, and system integration
                with the Client's existing HR tools (where applicable). Deployment will be completed within
                five (5) to seven (7) business days of payment confirmation.
              </ArticleItem>
              <ArticleItem n="2.2">
                <strong>Employee Onboarding.</strong> RCF will provide a structured onboarding process for all enrolled
                employees, including digital assessment invitations, guided completion workflows, and automated
                RoleColor profile generation. Onboarding is charged per employee at the rate specified in Article 4.
              </ArticleItem>
              <ArticleItem n="2.3">
                <strong>Core Platform Access.</strong> The Client will receive full access to the RCF Core Platform, including:
                (a) individual and team RoleColor dashboards; (b) team alignment and gap analysis reports;
                (c) execution optimisation tools; (d) manager and leadership development modules;
                (e) cross-team collaboration insights; and (f) export and PDF reporting tools.
              </ArticleItem>
              <ArticleItem n="2.4">
                <strong>Hiring Intelligence.</strong> The Client will receive access to the Hiring Intelligence module,
                including: (a) role-fit assessment for candidates; (b) automated interview question generation
                aligned to role requirements; (c) candidate RoleColor profiling and fit scoring;
                (d) comparative analysis of candidates against existing team profiles; and
                (e) post-hire outcome tracking. This module supports up to <strong>{pricing.includedJobRoles}</strong> active
                job roles and up to <strong>{pricing.applicantsPerRole}</strong> applicants per role.
              </ArticleItem>
              <ArticleItem n="2.5">
                <strong>Account Support.</strong> RCF will provide dedicated account support via email during business
                hours (Monday to Friday, 9:00 AM – 5:00 PM EST), with a committed response time of one (1)
                business day. Critical platform issues will be escalated within four (4) hours.
              </ArticleItem>
              <ArticleItem n="2.6">
                <strong>Platform Updates.</strong> RCF will provide ongoing platform updates, feature releases, and
                security patches at no additional cost during the Subscription Term.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 3 — DELIVERABLES AND MILESTONES">
              <ArticleItem n="3.1">RCF commits to delivering the following milestones:</ArticleItem>
              <MilestoneList items={[
                { id: "M1", label: "Account Provisioned", desc: "Administrative access granted within 1–2 business days of payment confirmation." },
                { id: "M2", label: "Platform Configured", desc: "Full setup with Client branding and organisational structure within 7 business days." },
                { id: "M3", label: "Assessments Deployed", desc: "Employee assessment invitations deployed within 10 business days of provisioning." },
                { id: "M4", label: "Profiles Generated", desc: "Initial RoleColor profiles generated for all assessed employees within 3 days of completion." },
                { id: "M5", label: "First Report", desc: "Team alignment report and insights dashboard delivered within 21 days of Deployment Date." },
                { id: "M6", label: "Hiring Module Live", desc: "Hiring Intelligence module activated and integrated within 30 days of Deployment Date." },
                { id: "M7", label: "First Review", desc: "Quarterly performance and optimisation review conducted within 90 days of Deployment Date." },
              ]} />
              <ArticleItem n="3.2">
                Delays caused by the Client's failure to provide required information, access, or approvals will
                not constitute a breach by RCF and will result in milestone dates being adjusted accordingly.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 4 — FEES, PAYMENT TERMS & INVESTMENT STRUCTURE">
              <ArticleItem n="4.1">
                The full investment structure applicable to this engagement is set forth below and is valid
                for twelve (12) months from the date of this Agreement:
              </ArticleItem>
              <PricingTable pricing={pricing} />
              <ArticleItem n="4.2">
                <strong>Platform Deployment Fee.</strong>{" "}
                {setupFee === 0 ? (
                  "The Platform Deployment Fee is waived for this engagement."
                ) : (
                  <>The one-time fee of <strong>{pricing.platformDeployment}</strong> is payable in full prior to commencement of any services. This fee is non-refundable once deployment has commenced and covers full platform setup, configuration, and implementation support.</>
                )}
              </ArticleItem>
              <ArticleItem n="4.3">
                <strong>Employee Onboarding Fee.</strong> The per-employee fee of <strong>{pricing.employeeOnboarding}</strong> will
                be invoiced as employees are onboarded. RCF will provide a detailed schedule at least five (5)
                business days prior to each onboarding cohort.
              </ArticleItem>
              <ArticleItem n="4.4">
                <strong>Monthly Subscription Fees.</strong> Monthly fees will be invoiced on the first business day of
                each calendar month, commencing thirty (30) days following the Deployment Date. Invoices are
                payable within fifteen (15) calendar days. Late payments accrue interest at 1.5% per month.
              </ArticleItem>
              {pricing.scalingPrice || pricing.scalingNote ? (
                <ArticleItem n="4.5">
                  <strong>Scaling Fees.</strong> Additional active job roles beyond the included{" "}
                  <strong>{pricing.includedJobRoles}</strong> will incur a scaling fee of{" "}
                  <strong>{pricing.scalingPrice} {pricing.scalingNote}</strong>, invoiced monthly.
                </ArticleItem>
              ) : null}
              {pricing.outcomePrice || pricing.outcomeNote ? (
                <ArticleItem n="4.6">
                  <strong>Outcome-Based Fees.</strong>{" "}
                  {pricing.outcomePrice ? <>A fee of <strong>{pricing.outcomePrice}</strong> will be invoiced for each verified successful hire made through the Hiring Intelligence module. </> : null}
                  {pricing.outcomeNote}
                </ArticleItem>
              ) : null}
              <ArticleItem n="4.7">
                All fees are denominated in United States Dollars (USD) and are exclusive of applicable taxes,
                levies, or duties, which are the sole responsibility of the Client.
              </ArticleItem>
              <ArticleItem n="4.8">
                RCF reserves the right to review and adjust fees at annual renewal with sixty (60) days'
                written notice. The Client may terminate within this notice period without penalty if
                adjustments are not acceptable.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 5 — CLIENT OBLIGATIONS">
              <ArticleItem n="5.1">To enable RCF to deliver the Services effectively, the Client agrees to:</ArticleItem>
              <BulletList items={[
                { title: "Designate a Client Administrator", body: "who will liaise with RCF throughout the engagement and have authority to make operational decisions." },
                { title: "Provide timely access", body: "to all organisational information, HR data, and system credentials reasonably required by RCF to configure the Platform." },
                { title: "Ensure employee participation", body: "in onboarding and assessment sessions in accordance with the agreed schedule." },
                { title: "Promptly review and approve", body: "Platform configurations, reports, and deliverables within five (5) business days of receipt." },
                { title: "Not resell or sublicense", body: "or otherwise grant access to the Platform to any third party without RCF's prior written consent." },
                { title: "Ensure compliance", body: "by all Authorised Users with RCF's acceptable use policy and applicable law." },
              ]} />
            </Section>

            <Divider />

            <Section title="ARTICLE 6 — INTELLECTUAL PROPERTY">
              <ArticleItem n="6.1">
                <strong>RCF IP.</strong> All rights, title, and interest in and to the Platform, including all software,
                algorithms, methodologies, frameworks, content, and documentation remain the exclusive property
                of RoleColorFinder LLC. Nothing in this Agreement transfers any ownership rights in RCF's
                intellectual property to the Client.
              </ArticleItem>
              <ArticleItem n="6.2">
                <strong>Client Data.</strong> All Client Data remains the exclusive property of the Client. RCF is
                granted a limited, non-exclusive licence to process Client Data solely for the purpose of
                delivering the Services.
              </ArticleItem>
              <ArticleItem n="6.3">
                <strong>Output Rights.</strong> Reports and analyses generated through the Platform are owned by the
                Client. RCF retains the right to use anonymised, aggregated data for platform improvement and
                research purposes.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 7 — DATA PROTECTION AND PRIVACY">
              <ArticleItem n="7.1">
                Both parties agree to comply with all applicable data protection laws, including GDPR (where
                applicable), CCPA, and applicable US federal and state privacy laws.
              </ArticleItem>
              <ArticleItem n="7.2">
                RCF will implement and maintain appropriate technical and organisational measures to protect
                Client Data, including encryption at rest and in transit, role-based access controls, and
                regular security audits.
              </ArticleItem>
              <ArticleItem n="7.3">
                RCF will notify the Client within seventy-two (72) hours of becoming aware of any confirmed
                data breach affecting Client Data.
              </ArticleItem>
              <ArticleItem n="7.4">
                Upon termination, RCF will make all Client Data available for export for thirty (30) days,
                after which it will be securely deleted from RCF's systems.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 8 — CONFIDENTIALITY AND NON-DISCLOSURE">
              <ArticleItem n="8.1">
                Each party agrees to maintain the confidentiality of the other party's Confidential Information
                and not disclose it to any third party without prior written consent, except as required by law.
              </ArticleItem>
              <ArticleItem n="8.2">
                Confidentiality obligations survive termination of this Agreement for three (3) years.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 9 — WARRANTIES">
              <ArticleItem n="9.1">
                <strong>RCF warrants</strong> that: (a) it has full legal authority to enter into this Agreement;
                (b) the Platform will perform materially in accordance with its documentation;
                (c) Services will be performed in a professional manner consistent with industry standards;
                (d) the Platform does not infringe any third-party intellectual property rights known to RCF.
              </ArticleItem>
              <ArticleItem n="9.2">
                <strong>Client warrants</strong> that: (a) it has full legal authority to enter into this Agreement;
                (b) it has obtained all necessary consents for RCF to process employee data;
                (c) its use of the Platform will comply with all applicable laws.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 10 — LIMITATION OF LIABILITY">
              <ArticleItem n="10.1">
                Neither party shall be liable for indirect, incidental, special, consequential, or punitive
                damages, including loss of profits or business interruption, arising from this Agreement.
              </ArticleItem>
              <ArticleItem n="10.2">
                RCF's total cumulative liability shall not exceed the total fees paid by the Client to RCF
                in the three (3) calendar months preceding the event giving rise to the claim.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 11 — INDEMNIFICATION">
              <ArticleItem n="11.1">
                <strong>Client Indemnification.</strong> The Client agrees to indemnify and hold harmless RCF from claims
                arising out of: (a) Client's breach of this Agreement; (b) use of the Platform in violation
                of applicable law; or (c) failure to obtain required consents for employee data processing.
              </ArticleItem>
              <ArticleItem n="11.2">
                <strong>RCF Indemnification.</strong> RCF agrees to indemnify the Client from third-party claims alleging
                that the Platform infringes a third party's intellectual property rights, provided that the
                Client promptly notifies RCF and cooperates in the defence.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 12 — TERM AND TERMINATION">
              <ArticleItem n="12.1">
                <strong>Term.</strong> This Agreement commences on the Deployment Date and continues for twelve (12) months.
                It auto-renews for successive twelve (12) month periods unless either party gives thirty (30)
                days' notice of non-renewal prior to the end of the then-current term.
              </ArticleItem>
              <ArticleItem n="12.2">
                <strong>Termination for Convenience.</strong> Either party may terminate monthly Services with thirty (30) days'
                written notice.{setupFee === 0 ? " No Platform Deployment Fee is due for this engagement." : " The one-time Platform Deployment Fee is non-refundable."}
              </ArticleItem>
              <ArticleItem n="12.3">
                <strong>Termination for Cause.</strong> Either party may terminate immediately if the other party materially
                breaches this Agreement and fails to remedy within fifteen (15) days of written notice, or
                becomes insolvent or enters bankruptcy proceedings.
              </ArticleItem>
              <ArticleItem n="12.4">
                <strong>Effects of Termination.</strong> Upon termination: (a) all licences cease; (b) Client access is
                deactivated; (c) Client Data is available for export for thirty (30) days; (d) accrued
                payment obligations remain due.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 13 — FORCE MAJEURE">
              <ArticleItem n="13.1">
                Neither party shall be liable for delays caused by Force Majeure Events including acts of God,
                natural disasters, war, pandemic, or infrastructure failure. If such an event continues beyond
                sixty (60) days, either party may terminate without penalty.
              </ArticleItem>
            </Section>

            <Divider />

            <Section title="ARTICLE 14 — GENERAL PROVISIONS">
              <ArticleItem n="14.1"><strong>Governing Law.</strong> Florida law governs this Agreement, without conflict of law principles.</ArticleItem>
              <ArticleItem n="14.2"><strong>Dispute Resolution.</strong> Disputes shall be resolved by binding arbitration (AAA) in Miami, FL. The prevailing party may recover reasonable legal fees.</ArticleItem>
              <ArticleItem n="14.3"><strong>Amendments.</strong> Only valid if in writing and signed by authorised representatives of both parties.</ArticleItem>
              <ArticleItem n="14.4"><strong>Severability.</strong> Unenforceable provisions are modified to the minimum extent necessary; remaining provisions continue in effect.</ArticleItem>
              <ArticleItem n="14.5"><strong>Waiver.</strong> Failure to exercise any right shall not be deemed a waiver of that right.</ArticleItem>
              <ArticleItem n="14.6"><strong>Assignment.</strong> Client may not assign this Agreement without RCF's written consent. RCF may assign in connection with a merger or acquisition.</ArticleItem>
              <ArticleItem n="14.7"><strong>Entire Agreement.</strong> This Agreement and Proposal {proposal.proposal_id} constitute the entire agreement and supersede all prior representations.</ArticleItem>
              <ArticleItem n="14.8"><strong>Electronic Execution.</strong> Electronic signatures are legally valid and binding.</ArticleItem>
            </Section>

          </div>

          {/* Signature section */}
          <div className="border-t-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-emerald-50/30 px-8 py-10 md:px-14">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <PenLine className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Sign — Letter of Engagement</h3>
                  <p className="text-sm text-slate-500">Step 2 of 2 signatures required</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <Checkbox id="loe-agree" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
                  <Label htmlFor="loe-agree" className="text-sm text-slate-700 cursor-pointer leading-relaxed">
                    I have read the entire Letter of Engagement, I understand and agree to all terms and
                    conditions contained herein, and I confirm I am authorised to legally bind{" "}
                    <strong>{company}</strong> to this Agreement.
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loe-name" className="text-sm font-medium">
                    Full Legal Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="loe-name"
                    placeholder="Type your full legal name to sign"
                    value={signedName}
                    onChange={(e) => setSignedName(e.target.value)}
                    className="h-12 text-base bg-white"
                  />
                </div>

                {signedName.trim().length >= 2 && (
                  <div className="rounded-2xl border border-emerald-200 bg-white px-5 py-4">
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Signature Preview</p>
                    <p className="font-serif text-3xl italic text-slate-900">{signedName}</p>
                    <p className="text-xs text-slate-400 mt-2">{today} · {company}</p>
                  </div>
                )}

                <Button
                  className="w-full h-12 text-base gap-2 bg-emerald-600 hover:bg-emerald-500"
                  disabled={!canSign || submitting}
                  onClick={handleSign}
                >
                  {submitting
                    ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Recording Signature…</>
                    : <><PenLine className="h-5 w-5" /> Sign Letter of Engagement</>}
                </Button>

                <p className="text-center text-xs text-slate-400">
                  After signing, you will download the signed LOE as a PDF, then proceed to {setupFee === 0 ? "save a card for future monthly billing." : `the ${setupFeeLabel} platform deployment payment.`}
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
        <div className="h-0.5 w-5 bg-emerald-500 shrink-0" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
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

function DefinitionList({ items }: { items: { term: string; def: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.term} className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <span className="text-sm font-mono font-bold text-emerald-700 whitespace-nowrap pt-0.5 min-w-[140px]">{item.term}</span>
          <span className="text-sm text-slate-600 leading-relaxed">{item.def}</span>
        </div>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: { title: string; body: string }[] }) {
  return (
    <div className="space-y-3 my-2 pl-10">
      {items.map((item) => (
        <div key={item.title} className="flex gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2.5 shrink-0" />
          <p className="text-sm text-slate-700 leading-relaxed">
            <strong>{item.title}</strong> {item.body}
          </p>
        </div>
      ))}
    </div>
  );
}

function MilestoneList({ items }: { items: { id: string; label: string; desc: string }[] }) {
  return (
    <div className="my-3 grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex gap-3">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 rounded-lg px-2 py-1 self-start shrink-0">{item.id}</span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{item.label}</p>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PricingTable({ pricing }: { pricing: ProposalPricing }) {
  const rows = [
    { category: "One-Time", label: "Platform Deployment Fee", value: formatDeploymentFeeLabel(pricing.platformDeployment) },
    { category: "One-Time", label: "Employee Onboarding (per employee)", value: pricing.employeeOnboarding },
    { category: "Monthly", label: "Core Platform Access", value: pricing.corePlatformMonthly },
    { category: "Monthly", label: "Hiring Intelligence Platform", value: pricing.hiringIntelligenceMonthly },
    { category: "Monthly", label: `Includes ${pricing.includedJobRoles} roles · ${pricing.applicantsPerRole} applicants/role`, value: "Included" },
    pricing.scalingPrice || pricing.scalingNote ? { category: "Scaling", label: pricing.scalingNote, value: pricing.scalingPrice } : null,
    pricing.outcomePrice ? { category: "Outcome", label: pricing.outcomeNote || "Per successful hire", value: pricing.outcomePrice } : null,
  ].filter((row): row is { category: string; label: string; value: string } => Boolean(row));

  const colorMap: Record<string, string> = {
    "One-Time": "bg-emerald-100 text-emerald-700",
    "Monthly": "bg-blue-100 text-blue-700",
    "Scaling": "bg-amber-100 text-amber-700",
    "Outcome": "bg-violet-100 text-violet-700",
  };

  return (
    <div className="my-4 rounded-2xl border border-emerald-200 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3 flex items-center justify-between">
        <p className="text-white font-semibold text-sm">Complete Investment Structure</p>
        <p className="text-emerald-100 text-xs">Valid 12 months from date of signing</p>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((row, i) => (
          <div key={i} className={`flex items-center justify-between px-5 py-3.5 ${i % 2 === 1 ? "bg-slate-50" : "bg-white"}`}>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${colorMap[row.category]}`}>{row.category}</span>
              <span className="text-sm text-slate-700">{row.label}</span>
            </div>
            <span className="text-sm font-bold text-slate-900 whitespace-nowrap ml-4">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
