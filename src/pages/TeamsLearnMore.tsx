import { useMemo, useState } from "react";
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
          ? "rounded-xl border border-border bg-card p-3 sm:p-4 shadow-sm"
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
  maxWidthClassName = "max-w-[min(100%,92rem)]",
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
        "h-full min-h-0 flex flex-col px-4 sm:px-6 lg:px-8 mx-auto w-full pb-3 sm:pb-4 overflow-hidden",
        maxWidthClassName
      )}
    >
      {/* Center the whole slide (title + body) so every stage matches Guesswork optically */}
      <div className="flex-1 min-h-0 flex flex-col justify-center w-full overflow-hidden">
        <div className="w-full min-h-0 max-h-full overflow-hidden flex flex-col">
          <div className="shrink-0 mb-2 sm:mb-3">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary leading-none">
              {eyebrow}
            </p>
            <h2 className="text-xl sm:text-2xl lg:text-[2rem] font-extrabold tracking-tight text-foreground leading-tight mt-1">
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
  const [storyCtaProgress, setStoryCtaProgress] = useState(0);
  const persistentStoryHeader = (
    <div className="container mx-auto max-w-7xl px-4 pt-20 sm:pt-24 pb-3 sm:pb-4 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">RoleColor™ for Teams</p>
      <h1 className="text-2xl sm:text-3xl md:text-[3.25rem] font-extrabold tracking-tight text-foreground mb-4">
        Transform your team with clarity.
      </h1>
      <p className="mt-2 text-muted-foreground max-w-3xl mx-auto text-sm sm:text-base">
        Scroll slowly, and watch each idea fills the screen. After that, the full platform breakdown is below.
      </p>
    </div>
  );

  const viewportSlides = useMemo(
    () => [
      <SlideChrome key="guesswork" eyebrow="01" title="Guesswork" maxWidthClassName="max-w-[min(100%,96rem)]">
        <div className="grid min-h-0 flex-1 w-full grid-cols-1 gap-3 sm:gap-4 lg:h-full lg:grid-cols-2 lg:gap-4 lg:items-stretch content-stretch">
          {/* Left: three facts stacked and fully visible */}
          <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-4 lg:h-full lg:self-stretch lg:justify-between">
            <BentoCard tight className="flex min-h-0 flex-row items-center gap-3 px-3 py-3 text-left sm:gap-4">
              <p className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tabular-nums leading-none shrink-0">
                78%
              </p>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground leading-tight whitespace-nowrap">78% of leaders believe their teams are engaged</p>
                <p className="mt-1 text-sm sm:text-base text-muted-foreground leading-snug">
                  That confidence is usually based on perception, not measured behavior.
                </p>
              </div>
            </BentoCard>
            <BentoCard tight className="min-h-[140px] min-h-0 px-3 py-3 lg:flex lg:flex-1 lg:flex-col">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-base sm:text-lg lg:text-[1.45rem] font-semibold text-foreground leading-tight">
                  Confidence hides operating risk
                </h2>
              </div>
              <ul className="space-y-1.5 text-sm sm:text-base text-muted-foreground leading-snug">
                <li className="flex items-center gap-2">
                  <span className="text-primary leading-none">•</span>
                  <span>Engagement is inferred, not measured</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary leading-none">•</span>
                  <span>Collaboration issues go unnoticed until they slow execution</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary leading-none">•</span>
                  <span>Role misalignment only shows under pressure</span>
                </li>
              </ul>
            </BentoCard>
            <BentoCard tight className="min-h-[140px] min-h-0 px-3 py-3 lg:flex lg:flex-1 lg:flex-col">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-[1.45rem] font-semibold text-foreground mb-2">The rest of the story is guessed too</h3>
              <ul className="space-y-2 text-sm sm:text-base text-muted-foreground leading-snug">
                <li>
                  <span className="font-bold text-foreground text-lg sm:text-xl">82%</span> say communication is working, even when friction keeps slowing execution
                </li>
                <li>
                  <span className="font-bold text-foreground text-lg sm:text-xl">70%</span> assume people are in the right roles, without evidence of fit under pressure
                </li>
              </ul>
              <p className="mt-3 text-xs sm:text-sm italic text-muted-foreground leading-snug">
                Those assumptions compound into missed targets, slower teams, and avoidable turnover.
              </p>
            </BentoCard>
          </div>

          {/* Right: single card — tall chart for a stronger visual gap */}
          <div className="flex min-h-0 w-full min-w-0 flex-col lg:h-full lg:self-stretch">
            <BentoCard tight className="pointer-events-auto flex h-full min-h-0 flex-col overflow-hidden p-0">
              <div className="shrink-0 border-b border-border/50 px-4 pt-4 pb-2 sm:px-5">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-primary">
                  The Performance Gap
                </p>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground leading-snug mt-1">
                  What Leaders See vs What Teams Deliver vs What Better Fit Would Change
                </h3>
              </div>
              <div className="flex min-h-[280px] flex-[1.15] flex-col border-b border-border/40 sm:min-h-[320px] lg:min-h-[340px]">
                <TeamPerformanceChart viewport />
              </div>
              <div className="shrink-0 px-4 py-2.5 sm:px-5">
                <div className="mb-1.5 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-2">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-foreground leading-tight mt-2">
                    By the time the numbers show it, teams are already behind.
                  </p>
                </div>
                {/* <p className="mb-1.5 text-sm sm:text-base text-muted-foreground leading-snug">
                  Leaders keep rating performance high while actual execution drops as complexity rises. Better role fit changes
                  that curve before missed output turns into a people problem.
                </p> */}
                {/* <div className="space-y-1 rounded-xl border border-border bg-muted/50 p-3 text-xs sm:text-sm text-muted-foreground leading-snug">
                  <p>
                    <span className="font-semibold text-foreground">Perception stays high: </span>leaders keep seeing a healthy team.
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Reality falls fast: </span>engagement weakens and collaboration
                    friction rises as the work gets harder.
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">The result: </span>you are not just missing clarity, you are
                    losing performance that should already be on the floor.
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">With RoleColor™ </span>teams can close that gap with
                    visibility, not hope.
                  </p>
                </div> */}
              </div>
            </BentoCard>
          </div>
        </div>
      </SlideChrome>,

      <SlideChrome key="insight" eyebrow="02" title="What's Actually Happening" maxWidthClassName="max-w-[min(100%,96rem)]">
        <div className="relative -top-2 sm:-top-3 flex flex-col gap-2 lg:gap-4 w-full min-h-0 h-full">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-primary">
            What the data actually shows
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-5 lg:flex-1 lg:h-full">
            <BentoCard tight className="py-3 shrink-0">
              <p className="text-3xl sm:text-4xl font-black text-red-500 tabular-nums leading-none">21%</p>
              <p className="mt-1 text-sm sm:text-base font-medium text-foreground">Average engagement</p>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-snug">
                Most teams are running on far less real buy-in than leadership thinks.
              </p>
            </BentoCard>
            <BentoCard tight className="py-3 shrink-0">
              <p className="text-3xl sm:text-4xl font-black text-orange-500 tabular-nums leading-none">86%</p>
              <p className="mt-1 text-sm sm:text-base font-medium text-foreground">Collaboration friction</p>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-snug">
                When people do not know who should lead, decide, or execute, work slows down.
              </p>
            </BentoCard>
            <BentoCard tight className="py-3 shrink-0">
              <p className="text-3xl sm:text-4xl font-black text-red-500 tabular-nums leading-none">50%</p>
              <p className="mt-1 text-sm sm:text-base font-medium text-foreground">Performance drop</p>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-snug">
                Output drops when role fit is weak and leaders cannot see the problem early.
              </p>
            </BentoCard>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5 items-stretch content-stretch lg:flex-1 lg:h-full">
            <BentoCard tight className="shrink-0 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mb-2">
                <Fingerprint className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">Why it happens</h3>
              <ul className="space-y-1 text-xs sm:text-sm text-muted-foreground leading-snug">
                {[
                  "Roles are assigned loosely, so ownership stays blurry",
                  "Work goes to the nearest person, not the right fit",
                  "Teams scale headcount before they fix misalignment",
                  "Hiring fills seats without showing what the team is missing",
                  "Performance reviews track effort, not role fit",
                ].map((item) => (
                  <li key={item} className="flex gap-1">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </BentoCard>
            <BentoCard tight className="shrink-0 py-3 flex flex-col">
              <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground leading-snug">
                Performance does not drop from lack of effort. It drops from misalignment.
              </p>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Most teams do not need more effort. They need clearer role fit, visible gaps, and a shared view of how work
                actually gets done. RoleColor makes that visible across the team.
              </p>
              <div className="mt-auto flex justify-center pt-6">
                <p className="mb-5 inline-flex max-w-xl items-center justify-center rounded-full border border-primary/20 bg-primary/10 px-6 py-3 text-center font-heading text-xl sm:text-2xl lg:text-[2rem] font-semibold tracking-[-0.035em] text-foreground leading-[1.05] shadow-sm">
                  This is the gap RoleColor is built to fix.
                </p>
              </div>
            </BentoCard>
          </div>
        </div>
      </SlideChrome>,

      <SlideChrome key="alignment" eyebrow="03" title="How Alignment Works" maxWidthClassName="max-w-[min(100%,96rem)]">
        <div className="flex flex-col gap-2 lg:gap-4 w-full min-h-0 h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-5">
            <BentoCard tight className="py-3 shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_0_3px_rgba(96,165,250,0.25)]" />
                <span className="text-sm sm:text-base font-semibold text-foreground">Blue</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                Sets direction and sees the bigger picture.
              </p>
            </BentoCard>
            <BentoCard tight className="py-3 shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-3 w-3 rounded-full bg-green-400 shadow-[0_0_0_3px_rgba(74,222,128,0.25)]" />
                <span className="text-sm sm:text-base font-semibold text-foreground">Green</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                Brings structure, follow-through, and consistency.
              </p>
            </BentoCard>
            <BentoCard tight className="py-3 shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-3 w-3 rounded-full bg-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.25)]" />
                <span className="text-sm sm:text-base font-semibold text-foreground">Red</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                Pushes decisions, urgency, and forward motion.
              </p>
            </BentoCard>
            <BentoCard tight className="py-3 shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]" />
                <span className="text-sm sm:text-base font-semibold text-foreground">Yellow</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                Builds trust, cohesion, and team connection.
              </p>
            </BentoCard>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
            Every team has all four. Performance depends on whether they are balanced, missing, or stacked in the wrong places.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5 items-stretch content-stretch lg:flex-1 lg:h-full">
            <BentoCard tight className="shrink-0 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">See How The Work Is Wired</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 leading-snug">
                RoleColor shows how work actually gets done across the team, where coverage is strong, and where the structure breaks.
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground leading-snug">
                <li className="flex gap-1.5">
                  <span className="text-primary shrink-0 mt-0.5">•</span>
                  <span>Where critical strengths are missing</span>
                </li>
                <li className="flex gap-1.5">
                  <span className="text-primary shrink-0 mt-0.5">•</span>
                  <span>Where one style is overloaded</span>
                </li>
                <li className="flex gap-1.5">
                  <span className="text-primary shrink-0 mt-0.5">•</span>
                  <span>Where handoffs and decisions break down</span>
                </li>
              </ul>
              <p className="text-sm font-semibold text-primary">Match the work to the wiring.</p>
            </BentoCard>
            <BentoCard tight className="shrink-0 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted mb-2">
                <BrainCircuit className="h-4 w-4 text-foreground" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">Turn Alignment Into Action</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 leading-snug">
                The AI Work Matrix moves teams from instinct to structured execution.
              </p>
              <div className="space-y-2 text-xs sm:text-sm">
                {[
                  { oldWay: "Available person", newWay: "Best-fit profile" },
                  { oldWay: "Gut assignment", newWay: "Strength-based match" },
                  { oldWay: "Random team mix", newWay: "Balanced team design" },
                ].map(({ oldWay, newWay }) => (
                  <div key={newWay} className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
                    <p className="text-muted-foreground leading-tight">
                      <span className="font-semibold text-foreground">X </span>
                      {oldWay}
                      <span className="px-1.5 text-muted-foreground">to</span>
                      <span className="font-semibold text-foreground">✓ </span>
                      {newWay}
                    </p>
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>
        </div>
      </SlideChrome>,

      <SlideChrome key="performance" eyebrow="04" title="What This Changes">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-3 lg:gap-4 w-full min-h-0 h-full items-stretch content-stretch">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 min-h-0 content-start">
            <BentoCard tight className="py-2.5 shrink-0">
              <p className="text-3xl sm:text-4xl font-black text-primary tabular-nums leading-none">5x</p>
              <p className="mt-1 text-sm sm:text-base font-medium text-foreground">More likely to hit the target</p>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-snug">
                When the work matches how people actually operate.
              </p>
            </BentoCard>
            <BentoCard tight className="py-2.5 shrink-0">
              <p className="text-3xl sm:text-4xl font-black text-primary tabular-nums leading-none">40%</p>
              <p className="mt-1 text-sm sm:text-base font-medium text-foreground">Projects move faster</p>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-snug">
                Because fewer handoffs stall and fewer decisions bounce around.
              </p>
            </BentoCard>
            <BentoCard tight className="py-2.5 shrink-0">
              <p className="text-3xl sm:text-4xl font-black text-primary tabular-nums leading-none">60%</p>
              <p className="mt-1 text-sm sm:text-base font-medium text-foreground">Lower turnover</p>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-snug">
                When hiring fixes real gaps.
              </p>
            </BentoCard>
            <BentoCard tight className="py-2.5 shrink-0">
              <p className="text-3xl sm:text-4xl font-black text-primary tabular-nums leading-none">1 view</p>
              <p className="mt-1 text-sm sm:text-base font-medium text-foreground">Shared team picture</p>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-snug">
                So leaders can see where fit, friction, and gaps actually sit.
              </p>
            </BentoCard>
            <BentoCard tight className="sm:col-span-2 shrink-0 py-2">
              <div className="mb-1.5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm sm:text-[15px] font-semibold text-foreground">From guesswork to system</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] sm:text-xs">
                <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
                  <p className="font-semibold text-foreground">Old approach</p>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground leading-tight">
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary shrink-0">•</span>
                      <span>Assign work by availability</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary shrink-0">•</span>
                      <span>Judge fit by instinct</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary shrink-0">•</span>
                      <span>Hire without seeing gaps</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                  <p className="font-semibold text-foreground">New approach</p>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground leading-tight">
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary shrink-0">•</span>
                      <span>See patterns before drag starts</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary shrink-0">•</span>
                      <span>Match work to strengths</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary shrink-0">•</span>
                      <span>Hire to improve the system</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="hidden grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] sm:text-xs">
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="font-semibold text-foreground">❌ Old approach</p>
                  <ul className="mt-1.5 space-y-1 text-muted-foreground leading-snug">
                    <li>Assign work by availability</li>
                    <li>Judge fit by instinct</li>
                    <li>Hire without seeing the team gap</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="font-semibold text-foreground">✅ New approach</p>
                  <ul className="mt-1.5 space-y-1 text-muted-foreground leading-snug">
                    <li>See team patterns before they become drag</li>
                    <li>Match work to strengths with data</li>
                    <li>Hire to improve the system, not just fill a seat</li>
                  </ul>
                </div>
              </div>
              <p className="mt-2 text-[11px] sm:text-xs text-muted-foreground leading-snug">
                Clear teams make better calls, move faster, and perform with less drag.
              </p>
            </BentoCard>
          </div>
          <div className="w-full min-w-0 h-full lg:h-full lg:scale-[0.94] origin-top-right">
            <B2BInsightsDemoPreview dense />
          </div>
        </div>
      </SlideChrome>,
    ],
    []
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="hidden container mx-auto max-w-7xl px-4 pt-20 sm:pt-24 pb-3 sm:pb-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">RoleColor™ for Teams</p>

        <h1 className="mt-3 text-2xl sm:text-3xl md:text-[3.25rem] font-extrabold tracking-tight text-foreground">
          Transform your team with clarity.
        </h1>
        <p className="mt-3 text-muted-foreground max-w-3xl mx-auto text-sm sm:text-base">
          Scroll slowly: each idea fills the screen, then fades into the next. After that, the full platform breakdown is below.
        </p>
      </div>

      <ViewportFadeSections
        sections={viewportSlides}
        persistentHeader={persistentStoryHeader}
        onFloatingFooterOpacityChange={setStoryCtaProgress}
      />

      <div
        className="pointer-events-none fixed inset-x-0 bottom-6 sm:bottom-8 z-50 flex justify-center px-4"
        style={{
          opacity: storyCtaProgress > 0 ? 1 : 0,
          transform: `translateY(${(1 - storyCtaProgress) * 90}px)`,
          transition: storyCtaProgress === 0 ? "opacity 0.2s ease" : "none",
        }}
      >
        <div className="pointer-events-auto">
          <Button size="lg" className="rounded-full px-8 shadow-lg" asChild>
            <a href="https://app.apollo.io/#/meet/sales/b2bdemo" target="_blank" rel="noopener noreferrer">
              Book a Demo
            </a>
          </Button>
        </div>
      </div>

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
      </motion.div>
    </div>
  );
}
