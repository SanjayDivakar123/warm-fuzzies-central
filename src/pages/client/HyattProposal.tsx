import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function HyattProposal() {
  useEffect(() => {
    document.title = "Hyatt Proposal | RoleColorFinder";

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "Hyatt proposal for RoleColorFinder including implementation model and pricing details.",
    );
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#e0f2fe,_transparent_45%),radial-gradient(circle_at_90%_10%,_#dcfce7,_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff_45%,_#f8fafc)]">
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
      <div className="pointer-events-none absolute top-[28rem] -left-24 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl" />

      <main className="relative z-10 w-full">
        <Card className="w-full min-h-screen overflow-hidden rounded-none border-0 bg-transparent shadow-none">
          <div className="relative h-[22rem] md:h-[32rem]">
            <img
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80"
              alt="Luxury hotel lobby"
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
              <Badge className="mb-4 w-fit border-emerald-300/40 bg-emerald-500/25 px-3 py-1 text-emerald-50">Client Proposal</Badge>
              <h1 className="mt-3 text-4xl md:text-6xl font-bold text-white leading-tight">Hyatt Proposal</h1>
              <p className="mt-3 max-w-2xl text-slate-100 text-lg md:text-xl">RoleColorFinder (RCF)</p>
            </div>
          </div>

          <CardContent className="mx-auto -mt-10 w-full max-w-6xl p-6 md:-mt-14 md:p-10 space-y-10">
            <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50/95 to-cyan-50/95 p-5 md:p-7 shadow-lg shadow-emerald-100/50 backdrop-blur">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Proposal ID</p>
                  <p className="text-base font-semibold text-slate-900">RCF-HYATT-2026-03-001</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Proposed to</p>
                  <p className="text-base font-semibold text-slate-900">Hyatt Hotels Corporation</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Submitted by</p>
                  <p className="text-base font-semibold text-slate-900">Jessicah Fowler, Head of Revsales</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/60 backdrop-blur">
              <h2 className="mb-4 border-l-4 border-emerald-500 pl-4 text-3xl font-bold tracking-tight text-slate-900">PROPOSAL</h2>
              <p className="text-slate-700"><span className="font-semibold text-slate-900">Proposed to:</span> Hyatt Hotels Corporation</p>
              <p className="text-slate-700"><span className="font-semibold text-slate-900">Submitted by:</span> Jessicah Fowler, Head of Revsales</p>
            </section>

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

            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/50">
              <h2 className="mb-3 border-l-4 border-violet-500 pl-4 text-2xl font-semibold text-slate-900">THE ROLECOLOR SYSTEM</h2>
              <p className="text-slate-700 leading-relaxed">
                RCF provides a structured system that strengthens execution, improves hiring decisions, and creates
                alignment across teams.
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

            <section className="grid gap-6 md:grid-cols-2 items-start rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/50">
              <div>
                <h2 className="mb-3 border-l-4 border-rose-500 pl-4 text-2xl font-semibold text-slate-900">ORGANIZATIONAL IMPACT</h2>
                <p className="mb-3 text-slate-700">RCF is designed to address key challenges in hospitality environments:</p>
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
                alt="Hotel operations teamwork"
                className="h-full min-h-64 w-full rounded-3xl object-cover shadow-lg shadow-slate-300/40"
              />
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-10 shadow-lg shadow-slate-200/50">
              <h2 className="mb-2 border-l-4 border-indigo-500 pl-4 text-2xl font-semibold text-slate-900">IMPLEMENTATION MODEL</h2>
              <p className="mb-8 text-slate-600 pl-5">RCF is implemented as an ongoing system across the organization.</p>
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="rounded-2xl border-slate-200/90 bg-slate-50/60 shadow-sm">
                  <CardContent className="p-7 flex flex-col h-full">
                    <p className="text-6xl font-bold text-indigo-600/20 leading-none mb-2">1.</p>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900">Deployment</h3>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm leading-relaxed">
                      <li>Platform setup and system configuration</li>
                      <li>Employee onboarding and role mapping</li>
                      <li>Initial team assessments and RoleColor profiling</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-slate-200/90 bg-slate-50/60 shadow-sm">
                  <CardContent className="p-7 flex flex-col h-full">
                    <p className="text-6xl font-bold text-indigo-600/20 leading-none mb-2">2.</p>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900">Integration</h3>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm leading-relaxed">
                      <li>Full integration into existing hiring workflows</li>
                      <li>Department-level team insights and reporting</li>
                      <li>Manager training and role alignment sessions</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-slate-200/90 bg-slate-50/60 shadow-sm">
                  <CardContent className="p-7 flex flex-col h-full">
                    <p className="text-6xl font-bold text-indigo-600/20 leading-none mb-2">3.</p>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900">Scale</h3>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm leading-relaxed">
                      <li>Expansion across properties and departments</li>
                      <li>Continuous optimization and performance tracking</li>
                      <li>Ongoing analytics and leadership reporting</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-6 md:p-8 shadow-lg shadow-slate-200/50">
              <h2 className="mb-3 border-l-4 border-emerald-600 pl-4 text-2xl font-semibold text-slate-900">PRICING</h2>
              <p className="text-slate-700 mb-6">Proposal pricing is valid for one year.</p>

              <div className="grid gap-4 md:grid-cols-2 mb-5">
                <Card className="rounded-2xl border-emerald-200 bg-emerald-50/50"><CardContent className="p-5"><h3 className="text-lg font-semibold mb-2 text-slate-900">One-Time Investment</h3><ul className="list-disc pl-5 space-y-1 text-slate-700"><li>Platform Deployment: <span className="font-semibold text-slate-900">$5,000</span></li><li>Employee Onboarding: <span className="font-semibold text-slate-900">$20 per employee (one-time)</span></li></ul></CardContent></Card>
                <Card className="rounded-2xl border-blue-200 bg-blue-50/50"><CardContent className="p-5"><h3 className="text-lg font-semibold mb-2 text-slate-900">Monthly Investment</h3><ul className="list-disc pl-5 space-y-1 text-slate-700"><li>Core Platform Access: <span className="font-semibold text-slate-900">$500/month</span></li><li>Hiring Intelligence Platform: <span className="font-semibold text-slate-900">$1,000/month</span></li><li>Includes up to 10 active job roles</li><li>Up to 1,000 applicants per role</li></ul></CardContent></Card>
              </div>

              <Card className="rounded-2xl border-amber-200 bg-amber-50/40 mb-4"><CardContent className="p-5"><h3 className="text-lg font-semibold mb-2 text-slate-900">Scaling</h3><p className="text-slate-700"><span className="font-semibold text-slate-900">+$1,000/month per additional 10 active job roles</span></p><p className="text-slate-700 mt-2">This allows the system to scale predictably with hiring demand across locations.</p></CardContent></Card>
              <Card className="rounded-2xl border-violet-200 bg-violet-50/40"><CardContent className="p-5"><h3 className="text-lg font-semibold mb-2 text-slate-900">Outcome-Based Pricing</h3><p className="text-slate-700"><span className="font-semibold text-slate-900">$20 per successful hire</span></p><p className="text-slate-700 mt-2">This aligns investment directly with hiring outcomes and organizational growth.</p></CardContent></Card>
            </section>

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

            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/50">
              <h2 className="mb-3 border-l-4 border-orange-500 pl-4 text-2xl font-semibold text-slate-900">NEXT STEPS</h2>
              <p className="text-slate-700 mb-3">
                When you are ready to move forward, we will provide a formal agreement and onboarding plan.
              </p>
              <p className="text-slate-700 mb-2">Following confirmation:</p>
              <ol className="list-decimal pl-6 space-y-1 text-slate-700">
                <li>RCF team will align on goals and rollout structure</li>
                <li>Platform deployment and onboarding will begin</li>
                <li>Hiring and team systems will be integrated into operations</li>
              </ol>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-10 shadow-xl shadow-slate-400/40">
              <h2 className="text-2xl font-semibold mb-4 text-white border-l-4 border-emerald-400 pl-4">CLOSING</h2>
              <p className="text-slate-200 leading-relaxed">
                RoleColorFinder is designed to become a foundational system for how organizations structure teams,
                hire effectively, and scale performance across every property and department.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                The hospitality industry demands consistent execution, strong team alignment, and high-quality hiring at scale.
                RCF addresses all three with a single integrated platform built for long-term operational impact — not a one-time
                workshop or assessment, but a living system embedded into how Hyatt operates every day.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                We look forward to partnering with Hyatt to build a high-performing team culture — one that is measurable,
                scalable, and aligned with the world-class guest experience Hyatt is known for delivering.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                This proposal is the starting point. Our team is ready to move quickly, work closely with your leadership,
                and deliver results from day one. We are confident this partnership will set a new standard for how Hyatt
                develops and deploys talent across its portfolio.
              </p>
              <div className="mt-8 border-t border-slate-700 pt-6">
                <p className="text-emerald-300 font-semibold">Ready to move forward?</p>
                <p className="text-slate-400 text-sm mt-1">Reach out to Jessicah Fowler, Head of Revsales, to confirm next steps and begin onboarding planning.</p>
              </div>
            </section>

            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/50">
              <img
                src="/uploads/2842bc15-73da-4523-b9c9-228cb076346e.png"
                alt="RoleColorFinder logo"
                className="mb-4 h-9 w-auto object-contain"
              />
              <p className="text-xs uppercase tracking-wide text-slate-500">Proposed by</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">Jessicah Fowler</p>
              <p className="text-slate-600">Head of Revsales, RoleColorFinder</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
