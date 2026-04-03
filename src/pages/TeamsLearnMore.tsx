import { useMemo } from "react";
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
import { ViewportFadeSections } from "@/components/marketing/ViewportFadeSections";

function BentoCard({
  className,
  children,
  tight,
}: {
  className?: string;
  children: React.ReactNode;
  /** Denser padding for one-screen slides */
  tight?: boolean;
}) {
  return (
    <div
      className={cn(
        tight
          ? "rounded-xl border border-border bg-card p-2.5 sm:p-3 shadow-sm"
          : "rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm transition-shadow hover:shadow-md hover:border-primary/20",
        className
      )}
    >
      {children}
    </div>
  );
}

function SlideChrome({
  eyebrow,
  title,
  children,
  maxWidthClassName = "max-w-6xl",
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  /** Wider slides (e.g. B2B story) use more of the viewport. */
  maxWidthClassName?: string;
}) {
  return (
    <div
      className={cn(
        "h-full min-h-0 flex flex-col px-3 sm:px-5 lg:px-8 mx-auto w-full pb-2 sm:pb-3 overflow-hidden",
        maxWidthClassName
      )}
    >
      {/* Center the whole slide (title + body) so every stage matches Guesswork optically */}
      <div className="flex-1 min-h-0 flex flex-col justify-center w-full overflow-hidden">
        <div className="w-full min-h-0 max-h-full overflow-hidden flex flex-col">
          <div className="shrink-0 mb-1 sm:mb-1.5">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary leading-none">
              {eyebrow}
            </p>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-foreground leading-tight mt-0.5">
              {title}
            </h2>
          </div>
          <div className="flex-1 min-h-0 w-full overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
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
  const viewportSlides = useMemo(
    () => [
      <SlideChrome key="guesswork" eyebrow="01" title="Guesswork" maxWidthClassName="max-w-[min(100%,86rem)]">
        <div className="grid min-h-0 flex-1 w-full grid-cols-1 gap-3 sm:gap-4 lg:h-full lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-5 lg:items-start content-stretch">
          {/* Left: three facts stacked and fully visible */}
          <div className="flex w-full min-w-0 flex-col gap-2 sm:gap-2.5 lg:self-start">
            <BentoCard tight className="flex min-h-0 flex-row items-center gap-2.5 px-2 py-2 text-left sm:gap-3">
              <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tabular-nums leading-none shrink-0">
                78%
              </p>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight">Leader-reported engagement</p>
                <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                  Often assumed, rarely validated with data.
                </p>
              </div>
            </BentoCard>
            <BentoCard tight className="min-h-0 py-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mb-1">
                <Shield className="h-3 w-3 text-primary" />
              </div>
              <h3 className="text-[11px] sm:text-xs font-semibold text-foreground mb-0.5 leading-tight">
                Secure in feeling, not in fact
              </h3>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                Most teams operate on gut instinct about who is engaged, who collaborates well, and who fits their role. None
                of it is measured until something breaks.
              </p>
            </BentoCard>
            <BentoCard tight className="min-h-0 py-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted mb-1">
                <TrendingDown className="h-3 w-3 text-muted-foreground" />
              </div>
              <h3 className="text-[11px] sm:text-xs font-semibold text-foreground mb-0.5">Other assumptions</h3>
              <ul className="space-y-0 text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                <li>
                  <span className="font-bold text-foreground">82%</span> think communication is working
                </li>
                <li>
                  <span className="font-bold text-foreground">70%</span> assume people are in the right roles
                </li>
              </ul>
              <p className="mt-0.5 text-[9px] italic text-muted-foreground leading-snug">
                None of these are measured. All of them are guessed.
              </p>
            </BentoCard>
          </div>

          {/* Right: single card — tall chart for a stronger visual gap */}
          <div className="flex min-h-0 w-full min-w-0 flex-col lg:h-full lg:self-stretch">
            <BentoCard tight className="flex h-full min-h-0 flex-col overflow-hidden p-0">
              <div className="shrink-0 border-b border-border/50 px-3 pt-2 pb-1 sm:px-4">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-primary">
                  The Performance Gap
                </p>
                <h3 className="text-[11px] sm:text-xs lg:text-sm font-bold text-foreground leading-snug mt-1 line-clamp-2">
                  The Gap Between How Teams Are Perceived, How They Operate, and How They Could Perform
                </h3>
              </div>
              <div className="flex min-h-[170px] flex-[1.15] flex-col border-b border-border/40 sm:min-h-[190px] lg:min-h-[210px]">
                <TeamPerformanceChart viewport />
              </div>
              <div className="shrink-0 px-3 py-1.5 sm:px-4 sm:py-2">
                <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-3 w-3 text-primary" />
                </div>
                <h3 className="text-[11px] sm:text-xs font-semibold text-foreground mb-0.5">The gap in one chart</h3>
                <p className="mb-1.5 text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                  Perceived performance stays high while actual performance falls as work gets harder. Optimized performance is
                  what becomes possible when you align people to how they actually work.
                </p>
                <div className="space-y-0.5 rounded-md border border-border bg-muted/50 p-1.5 text-[9px] sm:text-[10px] text-muted-foreground leading-snug">
                  <p>
                    <span className="font-semibold text-foreground">Leaders believe </span>~78% average engagement.
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Reality: </span>21% engagement and 86% collaboration pain
                    are common benchmarks in the literature.
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">With RoleColor™ </span>teams can close that gap with
                    visibility, not hope.
                  </p>
                </div>
              </div>
            </BentoCard>
          </div>
        </div>
      </SlideChrome>,

      <SlideChrome key="insight" eyebrow="02" title="Insight">
        <div className="flex flex-col gap-2 lg:gap-4 w-full min-h-0 h-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-4 lg:flex-1 lg:h-full">
            <BentoCard tight className="py-2 shrink-0">
              <p className="text-xl sm:text-2xl font-black text-red-500 tabular-nums leading-none">21%</p>
              <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-foreground">Average engagement</p>
              <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                Across many organizations, real engagement is far below what leaders assume.
              </p>
            </BentoCard>
            <BentoCard tight className="py-2 shrink-0">
              <p className="text-xl sm:text-2xl font-black text-orange-500 tabular-nums leading-none">86%</p>
              <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-foreground">Collaboration friction</p>
              <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                Teams cite working together as a top pain when roles and strengths are unclear.
              </p>
            </BentoCard>
            <BentoCard tight className="py-2 shrink-0">
              <p className="text-xl sm:text-2xl font-black text-red-500 tabular-nums leading-none">50%</p>
              <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-foreground">Performance drop</p>
              <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                From early onboarding to peak complexity, output often falls without clear cause.
              </p>
            </BentoCard>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4 items-stretch content-stretch lg:flex-1 lg:h-full">
            <BentoCard tight className="shrink-0 py-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mb-1">
                <Fingerprint className="h-3 w-3 text-primary" />
              </div>
              <h3 className="text-[11px] sm:text-xs font-semibold text-foreground mb-0.5">Why it happens</h3>
              <ul className="space-y-0.5 text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                {[
                  "No shared framework for role clarity",
                  "Tasks go to whoever is available, not whoever is wired for the work",
                  "Leaders optimize for throughput instead of alignment",
                  "Hiring repeats the same composition mistakes",
                  "Reviews reward activity, not fit",
                ].map((item) => (
                  <li key={item} className="flex gap-1">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </BentoCard>
            <BentoCard tight className="shrink-0 py-2">
              <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                Performance does not drop from lack of effort. It drops from misalignment.
              </p>
              <p className="mt-1.5 text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                Insight means seeing how your team actually thinks, works, and collaborates, not how you wish they did. That
                is the job RoleColor does at scale.
              </p>
            </BentoCard>
          </div>
        </div>
      </SlideChrome>,

      <SlideChrome key="alignment" eyebrow="03" title="Alignment">
        <div className="flex flex-col gap-2 lg:gap-4 w-full min-h-0 h-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-4 lg:flex-1 lg:h-full">
            <BentoCard tight className="py-2 shrink-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_0_2px_rgba(96,165,250,0.25)]" />
                <span className="text-[11px] sm:text-xs font-semibold text-foreground">Blues</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                Strategy, vision, and direction under pressure.
              </p>
            </BentoCard>
            <BentoCard tight className="py-2 shrink-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_0_2px_rgba(74,222,128,0.25)]" />
                <span className="text-[11px] sm:text-xs font-semibold text-foreground">Greens</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                Execution, reliability, and follow-through.
              </p>
            </BentoCard>
            <BentoCard tight className="py-2 shrink-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_0_2px_rgba(248,113,113,0.25)]" />
                <span className="text-[11px] sm:text-xs font-semibold text-foreground">Reds</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                Urgency, results, and driving hard problems.
              </p>
            </BentoCard>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4 items-stretch content-stretch lg:flex-1 lg:h-full">
            <BentoCard tight className="shrink-0 py-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mb-1">
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              <h3 className="text-[11px] sm:text-xs font-semibold text-foreground mb-0.5">The full color map</h3>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mb-1.5 leading-snug">
                Yellows connect people and culture. Together, the four colors describe how work really gets done on your team.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_0_2px_rgba(251,191,36,0.25)]" />
                <span className="text-[11px] font-semibold text-foreground">Yellows</span>
                <span className="text-[10px] text-muted-foreground">relationships and team glue.</span>
              </div>
              <p className="text-[11px] font-semibold text-primary">Match the work to the wiring.</p>
            </BentoCard>
            <BentoCard tight className="shrink-0 py-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted mb-1">
                <BrainCircuit className="h-3 w-3 text-foreground" />
              </div>
              <h3 className="text-[11px] sm:text-xs font-semibold text-foreground mb-0.5">AI Work Matrix</h3>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mb-1.5 leading-snug">
                Tasks and projects route to the people whose profiles fit the work. The system learns your team over time.
              </p>
              <div className="space-y-1 text-[10px] sm:text-[11px]">
                {[
                  { from: "Available person", to: "Right-color person" },
                  { from: "Gut-feel assignment", to: "Profile-matched task" },
                  { from: "Random project teams", to: "Complementary strengths" },
                ].map(({ from, to }) => (
                  <div key={to} className="flex flex-col border-l-2 border-primary/30 pl-1.5">
                    <span className="text-[9px] text-muted-foreground line-through leading-tight">{from}</span>
                    <span className="font-medium text-foreground leading-tight">{to}</span>
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>
        </div>
      </SlideChrome>,

      <SlideChrome key="performance" eyebrow="04" title="Performance">
        <div className="flex flex-col gap-2 lg:gap-4 w-full min-h-0 h-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-4 lg:flex-1 lg:h-full">
            <BentoCard tight className="py-2 shrink-0">
              <p className="text-xl sm:text-2xl font-black text-primary tabular-nums leading-none">5x</p>
              <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-foreground">Target likelihood</p>
              <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                When people land in roles that fit how they work.
              </p>
            </BentoCard>
            <BentoCard tight className="py-2 shrink-0">
              <p className="text-xl sm:text-2xl font-black text-primary tabular-nums leading-none">40%</p>
              <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-foreground">Faster projects</p>
              <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                With teams composed for complementary strengths.
              </p>
            </BentoCard>
            <BentoCard tight className="py-2 shrink-0">
              <p className="text-xl sm:text-2xl font-black text-primary tabular-nums leading-none">60%</p>
              <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-foreground">Lower turnover</p>
              <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                When hiring closes real gaps in team composition.
              </p>
            </BentoCard>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4 items-stretch content-stretch lg:flex-1 lg:h-full">
            <BentoCard tight className="shrink-0 py-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mb-1">
                <Users className="h-3 w-3 text-primary" />
              </div>
              <h3 className="text-[11px] sm:text-xs font-semibold text-foreground mb-1">From guesswork to system</h3>
              <div className="space-y-1 text-[10px] sm:text-[11px]">
                {[
                  { before: "Guessing who's engaged", after: "Live color distribution map" },
                  { before: "Tasks by availability", after: "AI-matched by strength" },
                  { before: "Hiring by resume alone", after: "Hiring to fill team gaps" },
                  { before: "Reviews by gut feel", after: "Reports by color profile" },
                ].map(({ before, after }) => (
                  <div key={after} className="flex flex-col border-l-2 border-border pl-1.5">
                    <span className="text-[9px] text-muted-foreground line-through leading-tight">{before}</span>
                    <span className="font-medium text-foreground leading-tight">{after}</span>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                <span className="font-semibold text-foreground">$12 USD</span> per platform member, billed monthly (see pricing
                below). Deployment and hiring tiers are customizable. Clarity creates performance; performance creates growth.
              </p>
            </BentoCard>
            <div className="w-full min-w-0 lg:h-full">
              <B2BInsightsDemoPreview dense />
            </div>
          </div>
        </div>
      </SlideChrome>,
    ],
    []
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-6xl px-4 pt-32 sm:pt-36 pb-6 sm:pb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">RoleColor™ for Teams</p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Transform your team with clarity.
        </h1>
        <p className="mt-2 sm:mt-3 text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
          Scroll slowly: each idea fills the screen, then fades into the next. After that, the full platform breakdown is below.
        </p>
      </div>

      <ViewportFadeSections sections={viewportSlides} />

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
