import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import type { Proposal, ProposalPricing } from "@/pages/admin/ProposalManager";

function interpolate(text: string, companyName: string): string {
  return text.replace(/\{\{companyName\}\}/g, companyName);
}

export default function ClientProposal() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [alreadyPaid, setAlreadyPaid] = useState(false);

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
      if (proposalRes.error || !proposalRes.data) {
        setNotFound(true);
        return;
      }
      const p: Proposal = {
        ...proposalRes.data,
        pricing: proposalRes.data.pricing as unknown as ProposalPricing,
        status: (proposalRes.data.status ?? "active") as "active" | "draft",
      };
      setProposal(p);
      document.title = `${p.proposal_title} | RoleColorFinder`;
      if (!paidRes.error && (paidRes.data ?? []).length > 0) {
        setAlreadyPaid(true);
      }
    });
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-5xl font-bold text-slate-300 mb-4">404</p>
          <h1 className="text-xl font-semibold text-slate-700 mb-2">Proposal not found</h1>
          <p className="text-slate-500 text-sm">This proposal link may be expired or incorrect.</p>
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

  const { pricing, company_name: companyName } = proposal;
  const closingParagraphs = interpolate(proposal.closing_text, companyName)
    .split(/\n\n+/)
    .filter(Boolean);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#e0f2fe,_transparent_45%),radial-gradient(circle_at_90%_10%,_#dcfce7,_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff_45%,_#f8fafc)]">
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
      <div className="pointer-events-none absolute top-[28rem] -left-24 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl" />

      <main className="relative z-10 w-full">
        <Card className="w-full min-h-screen overflow-hidden rounded-none border-0 bg-transparent shadow-none">

          {/* ---------------------------------------------------------------- */}
          {/*                          Hero Header                             */}
          {/* ---------------------------------------------------------------- */}
          <div className="relative h-[22rem] md:h-[32rem]">
            <img
              src={proposal.background_image_url}
              alt={`${companyName} header`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-slate-900/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end">
              <img
                src="/uploads/2842bc15-73da-4523-b9c9-228cb076346e.png"
                alt="RoleColorFinder logo"
                className="mb-4 h-10 w-auto object-contain md:h-12"
              />
              <Badge className="mb-4 w-fit border-emerald-300/40 bg-emerald-500/25 px-3 py-1 text-emerald-50">
                Client Proposal
              </Badge>
              <h1 className="mt-3 text-4xl md:text-6xl font-bold text-white leading-tight">
                {proposal.proposal_title}
              </h1>
              <p className="mt-3 max-w-2xl text-slate-100 text-lg md:text-xl">RoleColorFinder (RCF)</p>
            </div>
          </div>

          <CardContent className="mx-auto -mt-10 w-full max-w-6xl p-6 md:-mt-14 md:p-10 space-y-10">

            {/* ---- Meta strip ---- */}
            <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50/95 to-cyan-50/95 p-5 md:p-7 shadow-lg shadow-emerald-100/50 backdrop-blur">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Proposal ID</p>
                  <p className="text-base font-semibold text-slate-900">{proposal.proposal_id}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Proposed to</p>
                  <p className="text-base font-semibold text-slate-900">{companyName}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Submitted by</p>
                  <p className="text-base font-semibold text-slate-900">{proposal.submittedBy}</p>
                </div>
              </div>
            </section>

            {/* ---- Proposal intro ---- */}
            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/60 backdrop-blur">
              <h2 className="mb-4 border-l-4 border-emerald-500 pl-4 text-3xl font-bold tracking-tight text-slate-900">PROPOSAL</h2>
              <p className="text-slate-700"><span className="font-semibold text-slate-900">Proposed to:</span> {companyName}</p>
              <p className="text-slate-700"><span className="font-semibold text-slate-900">Submitted by:</span> {proposal.submitted_by}</p>
            </section>

            {/* ---- RCF Overview ---- */}
            <section className="grid gap-6 md:grid-cols-2 items-stretch">
              <Card className="rounded-3xl border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/50">
                <CardContent className="p-6">
                  <h2 className="mb-3 border-l-4 border-cyan-500 pl-4 text-2xl font-semibold text-slate-900">ROLECOLORFINDER (RCF) OVERVIEW</h2>
                  <p className="text-slate-700 leading-relaxed">
                    RoleColorFinder (RCF) is a role intelligence and execution system designed to help organizations
                    improve how teams operate, hire, and scale performance.
                  </p>
                  <p className="text-slate-700 leading-relaxed mt-3">
                    RCF focuses on your most critical asset, your people, by identifying how individuals naturally contribute
                    within a team and ensuring alignment between roles, execution, and outcomes.
                  </p>
                </CardContent>
              </Card>
              <img
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80"
                alt="Business strategy planning"
                className="h-full min-h-64 w-full rounded-3xl object-cover shadow-lg shadow-slate-300/40"
              />
            </section>

            {/* ---- RoleColor System ---- */}
            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/50">
              <h2 className="mb-3 border-l-4 border-violet-500 pl-4 text-2xl font-semibold text-slate-900">THE ROLECOLOR SYSTEM</h2>
              <p className="text-slate-700 leading-relaxed">
                RCF provides a structured system that strengthens execution, improves hiring decisions, and creates alignment across teams.
              </p>
              <p className="text-slate-700 leading-relaxed mt-3">
                Rather than a one-time assessment or training, RCF is a scalable system that integrates into daily operations.
              </p>
              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900">Core Framework</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-slate-700 shadow-sm flex flex-col">
                  <span className="font-semibold text-slate-900 mb-1">Motivator (Red)</span>
                  <span className="text-sm leading-relaxed">Drives energy, momentum, and people engagement. Motivators energize teams and create the culture that moves organizations forward.</span>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-slate-700 shadow-sm flex flex-col">
                  <span className="font-semibold text-slate-900 mb-1">Executor (Yellow)</span>
                  <span className="text-sm leading-relaxed">Delivers results and ensures execution. Executors are the implementation force that turns strategy into action and meets critical deadlines.</span>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-slate-700 shadow-sm flex flex-col">
                  <span className="font-semibold text-slate-900 mb-1">Architect (Green)</span>
                  <span className="text-sm leading-relaxed">Builds systems, structure, and strategy. Architects design the frameworks and processes that allow organizations to scale with clarity.</span>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-slate-700 shadow-sm flex flex-col">
                  <span className="font-semibold text-slate-900 mb-1">Visionary (Blue)</span>
                  <span className="text-sm leading-relaxed">Guides direction, innovation, and long-term thinking. Visionaries identify opportunities and chart the course for sustainable growth.</span>
                </div>
              </div>
            </section>

            {/* ---- System Capabilities ---- */}
            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/50">
              <h2 className="mb-2 border-l-4 border-amber-500 pl-4 text-2xl font-semibold text-slate-900">SYSTEM CAPABILITIES</h2>
              <p className="mb-6 text-slate-600 pl-5">Four integrated modules that work together to align people, performance, and growth.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="group rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 transition-shadow hover:shadow-md">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-white text-lg font-bold shadow-sm">RI</div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">Role Intelligence</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">Understand how individuals naturally operate and contribute within a team. Surface each person's innate strengths and working style.</p>
                </div>
                <div className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 transition-shadow hover:shadow-md">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white text-lg font-bold shadow-sm">TA</div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">Team Alignment</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">Identify gaps, overlaps, and inefficiencies across teams and departments. Build cohesive units that complement each other's strengths.</p>
                </div>
                <div className="group rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-6 transition-shadow hover:shadow-md">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500 text-white text-lg font-bold shadow-sm">EO</div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">Execution Optimization</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">Improve how teams collaborate, communicate, and perform. Reduce friction and drive measurable improvements in day-to-day execution.</p>
                </div>
                <div className="group rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-6 transition-shadow hover:shadow-md">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white text-lg font-bold shadow-sm">HI</div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">Hiring Intelligence</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">Evaluate candidates based on role fit and long-term performance potential. Make hiring decisions backed by data, not guesswork.</p>
                </div>
              </div>
            </section>

            {/* ---- Organizational Impact ---- */}
            <section className="grid gap-6 md:grid-cols-2 items-start rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/50">
              <div>
                <h2 className="mb-3 border-l-4 border-rose-500 pl-4 text-2xl font-semibold text-slate-900">ORGANIZATIONAL IMPACT</h2>
                <p className="mb-3 text-slate-700">RCF is designed to address key organizational challenges:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-700">
                  <li>Inconsistent execution across locations</li>
                  <li>Misalignment between roles and responsibilities</li>
                  <li>High-volume hiring without structured role-fit validation</li>
                  <li>Communication gaps across teams and leadership levels</li>
                </ul>
                <p className="mt-4 text-slate-700">
                  By addressing these areas, RCF enables stronger performance, improved hiring outcomes, and scalable team alignment.
                </p>
              </div>
              <img
                src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80"
                alt="Team operations"
                className="h-full min-h-64 w-full rounded-3xl object-cover shadow-lg shadow-slate-300/40"
              />
            </section>

            {/* ---- Implementation Model ---- */}
            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-10 shadow-lg shadow-slate-200/50">
              <h2 className="mb-2 border-l-4 border-indigo-500 pl-4 text-2xl font-semibold text-slate-900">IMPLEMENTATION MODEL</h2>
              <p className="mb-8 text-slate-600 pl-5">RCF is implemented as an ongoing system across the organization.</p>
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  { num: "1.", title: "Deployment", items: ["Platform setup and system configuration", "Employee onboarding and role mapping", "Initial team assessments and RoleColor profiling"] },
                  { num: "2.", title: "Integration", items: ["Full integration into existing hiring workflows", "Department-level team insights and reporting", "Manager training and role alignment sessions"] },
                  { num: "3.", title: "Scale", items: ["Expansion across properties and departments", "Continuous optimization and performance tracking", "Ongoing analytics and leadership reporting"] },
                ].map((step) => (
                  <Card key={step.num} className="rounded-2xl border-slate-200/90 bg-slate-50/60 shadow-sm">
                    <CardContent className="p-7 flex flex-col h-full">
                      <p className="text-6xl font-bold text-indigo-600/20 leading-none mb-2">{step.num}</p>
                      <h3 className="text-2xl font-bold mb-4 text-slate-900">{step.title}</h3>
                      <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm leading-relaxed">
                        {step.items.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* ---- Pricing ---- */}
            <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-6 md:p-8 shadow-lg shadow-slate-200/50">
              <h2 className="mb-3 border-l-4 border-emerald-600 pl-4 text-2xl font-semibold text-slate-900">PRICING</h2>
              <p className="text-slate-700 mb-6">Proposal pricing is valid for one year.</p>

              <div className="grid gap-4 md:grid-cols-2 mb-5">
                <Card className="rounded-2xl border-emerald-200 bg-emerald-50/50">
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold mb-2 text-slate-900">One-Time Investment</h3>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>Platform Deployment: <span className="font-semibold text-slate-900">{pricing.platformDeployment}</span></li>
                      <li>Employee Onboarding: <span className="font-semibold text-slate-900">{pricing.employeeOnboarding}</span></li>
                    </ul>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-blue-200 bg-blue-50/50">
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold mb-2 text-slate-900">Monthly Investment</h3>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>Core Platform Access: <span className="font-semibold text-slate-900">{pricing.corePlatformMonthly}</span></li>
                      <li>Hiring Intelligence Platform: <span className="font-semibold text-slate-900">{pricing.hiringIntelligenceMonthly}</span></li>
                      <li>Includes up to {pricing.includedJobRoles} active job roles</li>
                      <li>Up to {pricing.applicantsPerRole} applicants per role</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-2xl border-amber-200 bg-amber-50/40 mb-4">
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">Scaling</h3>
                  <p className="text-slate-700"><span className="font-semibold text-slate-900">{pricing.scalingPrice} {pricing.scalingNote}</span></p>
                  <p className="text-slate-700 mt-2">This allows the system to scale predictably with hiring demand across locations.</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-violet-200 bg-violet-50/40">
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">Outcome-Based Pricing</h3>
                  <p className="text-slate-700"><span className="font-semibold text-slate-900">{pricing.outcomePrice}</span></p>
                  <p className="text-slate-700 mt-2">{pricing.outcomeNote}</p>
                </CardContent>
              </Card>
            </section>

            {/* ---- Benefits ---- */}
            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/50">
              <h2 className="mb-3 border-l-4 border-teal-500 pl-4 text-2xl font-semibold text-slate-900">BENEFITS</h2>
              <ul className="list-disc pl-6 space-y-1 text-slate-700">
                <li>Improved role clarity across teams</li>
                <li>Increased consistency in execution</li>
                <li>Higher-quality hiring decisions</li>
                <li>Stronger alignment between leadership and operations</li>
                <li>Reduced communication friction across teams</li>
              </ul>
            </section>

            {/* ---- Next Steps ---- */}
            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/50">
              <h2 className="mb-3 border-l-4 border-orange-500 pl-4 text-2xl font-semibold text-slate-900">NEXT STEPS</h2>
              <p className="text-slate-700 mb-3">When you are ready to move forward, we will provide a formal agreement and onboarding plan.</p>
              <p className="text-slate-700 mb-2">Following confirmation:</p>
              <ol className="list-decimal pl-6 space-y-1 text-slate-700">
                <li>RCF team will align on goals and rollout structure</li>
                <li>Platform deployment and onboarding will begin</li>
                <li>Hiring and team systems will be integrated into operations</li>
              </ol>
            </section>

            {/* ---- Closing ---- */}
            <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-10 shadow-xl shadow-slate-400/40">
              <h2 className="text-2xl font-semibold mb-4 text-white border-l-4 border-emerald-400 pl-4">CLOSING</h2>
              {closingParagraphs.map((para, i) => (
                <p key={i} className={`${i === 0 ? "text-slate-200" : "text-slate-300"} leading-relaxed ${i > 0 ? "mt-4" : ""}`}>
                  {para}
                </p>
              ))}
              <div className="mt-8 border-t border-slate-700 pt-6">
                <p className="text-emerald-300 font-semibold">Ready to move forward?</p>
              <p className="text-slate-400 text-sm mt-1">
                Reach out to {proposal.submitted_by} to confirm next steps and begin onboarding planning.
              </p>
              </div>
            </section>

            {/* ---- Accept CTA ---- */}
            {alreadyPaid ? (
              <section className="rounded-3xl border border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800 p-8 md:p-12 shadow-xl text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white">Proposal Already Accepted</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                  This proposal has been accepted and the platform deployment payment has been completed.
                  A member of the RoleColorFinder team will be in touch shortly to begin onboarding.
                </p>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/40 bg-emerald-900/30 px-5 py-2 text-sm text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" /> Payment Received · Account Setup In Progress
                </div>
              </section>
            ) : (
              <section className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-900 to-slate-900 p-8 md:p-12 shadow-xl text-center space-y-5">
                <div className="flex justify-center">
                  <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Ready to Move Forward?
                </h2>
                <p className="text-slate-300 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                  Accept this proposal to review and sign your Letter of Intent and Letter of Engagement,
                  then complete the $5,000 platform deployment payment to begin onboarding.
                </p>
                <Button
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-10 h-13 text-base gap-2 shadow-lg shadow-emerald-900/40"
                  onClick={() => navigate(`/client/${slug}/loi`)}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Accept Proposal &amp; Sign Agreement
                </Button>
                <p className="text-slate-500 text-xs">
                  You will be asked to sign a Letter of Intent and Letter of Engagement before payment.
                </p>
              </section>
            )}

            {/* ---- Footer ---- */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/50">
              <img
                src="/uploads/2842bc15-73da-4523-b9c9-228cb076346e.png"
                alt="RoleColorFinder logo"
                className="mb-4 h-9 w-auto object-contain"
              />
              <p className="text-xs uppercase tracking-wide text-slate-500">Proposed by</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{proposal.submitted_by.split(",")[0]}</p>
              <p className="text-slate-600">{proposal.submitted_by.split(",").slice(1).join(",").trim()}{proposal.submitted_by.includes(",") ? ", RoleColorFinder" : ""}</p>
            </div>

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
