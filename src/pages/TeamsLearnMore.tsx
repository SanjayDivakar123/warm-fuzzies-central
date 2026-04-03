import { Link } from "react-router-dom";
import {
  BrainCircuit,
  Briefcase,
  Check,
  ClipboardList,
  Fingerprint,
  Shield,
  ShieldCheckIcon,
  Sparkles,
  TrendingDown,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navigation/Navbar";
import { Button } from "@/components/ui/button";
import { TeamPerformanceChart } from "@/components/TeamPerformanceChart";
import { B2BInsightsDemoPreview } from "@/components/marketing/B2BInsightsDemoPreview";

function BentoCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm transition-shadow hover:shadow-md hover:border-primary/20",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionBlock({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      className="scroll-mt-28 py-14 sm:py-20 border-b border-border/60 last:border-0"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="container mx-auto max-w-6xl px-4">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{eyebrow}</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-8">{title}</h2>
        {children}
      </div>
    </motion.section>
  );
}

// ─── Feature boxes (platform) ─────────────────────────────────────────────────

const PORTAL_FEATURES = [
  {
    icon: ClipboardList,
    title: "Team Intelligence Portal",
    description:
      "Private branded company portal with full admin controls, live color distribution analytics, and individual assessment management for your entire organization.",
    bullets: [
      "Custom domain, logo, and colors",
      "Admin dashboard and user management",
      "25 or 50 question assessments per employee",
      "Bulk import and Google Workspace sync",
    ],
  },
  {
    icon: Briefcase,
    title: "Hiring Intelligence",
    description:
      "Score candidates against your existing team's color composition. Know before you hire whether this person fills a gap, creates friction, or unlocks new dynamics.",
    bullets: [
      "Candidate fit scoring against team map",
      "Branded candidate portal experience",
      "Identify hiring gaps across roles",
      "Reduce repeat hiring mistakes",
    ],
  },
  {
    icon: BrainCircuit,
    title: "AI Work Matrix",
    description:
      "Automatically match tasks, projects, and leadership opportunities to the team members whose color profile is built for that kind of work. Gets sharper over time.",
    bullets: [
      "Task-to-profile matching engine",
      "Project team composition builder",
      "Leadership path recommendations",
      "Exportable role clarity reports",
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamsLearnMore() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-6xl px-4 pt-36 sm:pt-44 pb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">RoleColor™ for Teams</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Transform your team with clarity.
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
          Scroll through four ideas, then see everything the B2B portal includes.
        </p>
      </div>

      {/* 1 — Guesswork */}
      <SectionBlock id="guesswork" eyebrow="01" title="Guesswork">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <BentoCard className="flex flex-col items-center justify-center text-center min-h-[160px]">
            <p className="text-5xl sm:text-6xl font-black text-foreground tabular-nums">78%</p>
            <p className="mt-2 text-sm font-semibold text-foreground">Leader-reported engagement</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-[12rem]">Often assumed, rarely validated with data.</p>
          </BentoCard>
          <BentoCard>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-3">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Secure in feeling, not in fact</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Most teams operate on gut instinct about who is engaged, who collaborates well, and who fits their role. None of it is measured until something breaks.
            </p>
          </BentoCard>
          <BentoCard>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-3">Other assumptions</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="font-bold text-foreground">82%</span> think communication is working
              </li>
              <li>
                <span className="font-bold text-foreground">70%</span> assume people are in the right roles
              </li>
            </ul>
            <p className="mt-3 text-xs italic text-muted-foreground">None of these are measured. All of them are guessed.</p>
          </BentoCard>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BentoCard className="p-0 overflow-hidden">
            <TeamPerformanceChart />
          </BentoCard>
          <BentoCard>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-3">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">The gap in one chart</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Perceived performance stays high while actual performance falls as work gets harder. Optimized performance is what becomes possible when you align people to how they actually work.
            </p>
            <div className="rounded-xl bg-muted/50 border border-border p-4 text-xs text-muted-foreground space-y-2">
              <p>
                <span className="font-semibold text-foreground">Leaders believe </span>~78% average engagement.
              </p>
              <p>
                <span className="font-semibold text-foreground">Reality: </span>21% engagement and 86% collaboration pain are common benchmarks in the literature.
              </p>
              <p>
                <span className="font-semibold text-foreground">With RoleColor™ </span>teams can close that gap with visibility, not hope.
              </p>
            </div>
          </BentoCard>
        </div>
      </SectionBlock>

      {/* 2 — Insight */}
      <SectionBlock id="insight" eyebrow="02" title="Insight">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <BentoCard>
            <p className="text-4xl font-black text-red-500 tabular-nums">21%</p>
            <p className="mt-2 text-sm font-medium text-foreground">Average engagement</p>
            <p className="mt-1 text-xs text-muted-foreground">Across many organizations, real engagement is far below what leaders assume.</p>
          </BentoCard>
          <BentoCard>
            <p className="text-4xl font-black text-orange-500 tabular-nums">86%</p>
            <p className="mt-2 text-sm font-medium text-foreground">Collaboration friction</p>
            <p className="mt-1 text-xs text-muted-foreground">Teams cite working together as a top pain when roles and strengths are unclear.</p>
          </BentoCard>
          <BentoCard>
            <p className="text-4xl font-black text-red-500 tabular-nums">50%</p>
            <p className="mt-2 text-sm font-medium text-foreground">Performance drop</p>
            <p className="mt-1 text-xs text-muted-foreground">From early onboarding to peak complexity, output often falls without clear cause.</p>
          </BentoCard>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          <div className="space-y-4 min-w-0">
            <BentoCard>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-3">
                <Fingerprint className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Why it happens</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "No shared framework for role clarity",
                  "Tasks go to whoever is available, not whoever is wired for the work",
                  "Leaders optimize for throughput instead of alignment",
                  "Hiring repeats the same composition mistakes",
                  "Reviews reward activity, not fit",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </BentoCard>
            <BentoCard>
              <p className="text-lg font-semibold text-foreground leading-snug">
                Performance does not drop from lack of effort. It drops from misalignment.
              </p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                On the Assessments tab, admins open <span className="font-medium text-foreground">Insights</span> to read
                AI team leadership analysis: team overview, each person&apos;s fit, and recommendations. The preview on
                the right mirrors that experience with sample data.
              </p>
            </BentoCard>
          </div>
          <B2BInsightsDemoPreview />
        </div>
      </SectionBlock>

      {/* 3 — Alignment */}
      <SectionBlock id="alignment" eyebrow="03" title="Alignment">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <BentoCard>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_0_3px_rgba(96,165,250,0.25)]" />
              <span className="font-semibold text-foreground">Blues</span>
            </div>
            <p className="text-sm text-muted-foreground">Strategy, vision, and direction under pressure.</p>
          </BentoCard>
          <BentoCard>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-3 w-3 rounded-full bg-green-400 shadow-[0_0_0_3px_rgba(74,222,128,0.25)]" />
              <span className="font-semibold text-foreground">Greens</span>
            </div>
            <p className="text-sm text-muted-foreground">Execution, reliability, and follow-through.</p>
          </BentoCard>
          <BentoCard>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-3 w-3 rounded-full bg-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.25)]" />
              <span className="font-semibold text-foreground">Reds</span>
            </div>
            <p className="text-sm text-muted-foreground">Urgency, results, and driving hard problems.</p>
          </BentoCard>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BentoCard>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-3">The full color map</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Yellows connect people and culture. Together, the four colors describe how work really gets done on your team.
            </p>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]" />
              <span className="font-semibold text-foreground">Yellows</span>
              <span className="text-sm text-muted-foreground">— relationships and team glue.</span>
            </div>
            <p className="text-sm font-semibold text-primary">Match the work to the wiring.</p>
          </BentoCard>
          <BentoCard>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
              <BrainCircuit className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">AI Work Matrix</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tasks and projects route to the people whose profiles fit the work. The system learns your team over time.
            </p>
            <div className="space-y-2 text-sm">
              {[
                { from: "Available person", to: "Right-color person" },
                { from: "Gut-feel assignment", to: "Profile-matched task" },
                { from: "Random project teams", to: "Complementary strengths" },
              ].map(({ from, to }) => (
                <div key={to} className="flex flex-col border-l-2 border-primary/30 pl-3">
                  <span className="text-xs text-muted-foreground line-through">{from}</span>
                  <span className="font-medium text-foreground">{to}</span>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>
      </SectionBlock>

      {/* 4 — Performance */}
      <SectionBlock id="performance" eyebrow="04" title="Performance">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <BentoCard>
            <p className="text-4xl font-black text-primary tabular-nums">5x</p>
            <p className="mt-2 text-sm font-medium text-foreground">Target likelihood</p>
            <p className="mt-1 text-xs text-muted-foreground">When people land in roles that fit how they work.</p>
          </BentoCard>
          <BentoCard>
            <p className="text-4xl font-black text-primary tabular-nums">40%</p>
            <p className="mt-2 text-sm font-medium text-foreground">Faster projects</p>
            <p className="mt-1 text-xs text-muted-foreground">With teams composed for complementary strengths.</p>
          </BentoCard>
          <BentoCard>
            <p className="text-4xl font-black text-primary tabular-nums">60%</p>
            <p className="mt-2 text-sm font-medium text-foreground">Lower turnover</p>
            <p className="mt-1 text-xs text-muted-foreground">When hiring closes real gaps in team composition.</p>
          </BentoCard>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BentoCard>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-3">From guesswork to system</h3>
            <div className="space-y-2 text-sm">
              {[
                { before: "Guessing who's engaged", after: "Live color distribution map" },
                { before: "Tasks by availability", after: "AI-matched by strength" },
                { before: "Hiring by resume alone", after: "Hiring to fill team gaps" },
                { before: "Reviews by gut feel", after: "Reports by color profile" },
              ].map(({ before, after }) => (
                <div key={after} className="flex flex-col border-l-2 border-border pl-3">
                  <span className="text-xs text-muted-foreground line-through">{before}</span>
                  <span className="font-medium text-foreground">{after}</span>
                </div>
              ))}
            </div>
          </BentoCard>
          <BentoCard className="bg-muted/40">
            <h3 className="font-semibold text-foreground mb-2">With RoleColor™</h3>
            <p className="text-3xl font-black text-foreground">$12 USD</p>
            <p className="text-sm text-muted-foreground">per platform member, billed monthly. Deployment and hiring tiers are customizable.</p>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Clarity creates performance. Performance creates growth.
            </p>
          </BentoCard>
        </div>
      </SectionBlock>

      {/* Platform features */}
      <motion.div
        className="container mx-auto px-4 py-16 sm:py-24 max-w-6xl border-t border-border"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">What's inside the platform</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Everything you need to run a high-performance team.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            One platform. Full visibility. From hiring to execution to growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {PORTAL_FEATURES.map(({ icon: Icon, title, description, bullets }) => (
            <BentoCard key={title}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{description}</p>
              <ul className="space-y-1.5">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    {b}
                  </li>
                ))}
              </ul>
            </BentoCard>
          ))}
        </div>

        <BentoCard className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Also included</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              "Email customization and reminders",
              "Role clarity reports per member",
              "Leadership development plans",
              "Exportable team composition reports",
              "Scheduled re-assessment reminders",
              "Candidate portal branding",
              "Onboarding and dedicated support",
              "Volume discounts for 50+ seats",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                {f}
              </div>
            ))}
          </div>
        </BentoCard>

        <div className="rounded-2xl border border-border bg-muted/40 p-5 mb-10 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Fully customizable pricing</p>
          Platform deployment, core platform access, and hiring intelligence tiers are all scoped to your team's size and needs, making it{" "}
          <span className="font-semibold text-foreground">as low as $12 USD per platform member</span>. Talk to us and we'll build the right plan together.
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <Button size="lg" className="w-full sm:w-auto rounded-full px-10" asChild>
            <a href="https://app.apollo.io/#/meet/sales/b2bdemo" target="_blank" rel="noopener noreferrer">
              Book a Demo
            </a>
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-10" asChild>
            <Link to="/pricing#for-teams">Back to Pricing</Link>
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ShieldCheckIcon className="h-4 w-4" />
          No hidden fees. Pricing is scoped to your team's actual needs.
        </div>
      </motion.div>
    </div>
  );
}
