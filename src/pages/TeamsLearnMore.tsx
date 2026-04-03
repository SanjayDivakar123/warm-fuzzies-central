import { Link } from "react-router-dom";
import {
  BarChart2,
  BrainCircuit,
  Briefcase,
  Check,
  ClipboardList,
  Layers,
  ShieldCheckIcon,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { Navbar } from "@/components/navigation/Navbar";
import { Button } from "@/components/ui/button";

// ─── Story sections ────────────────────────────────────────────────────────────

const STORY_SECTIONS = [
  {
    icon: Target,
    label: "The Problem",
    heading: "Most teams are flying blind.",
    body: "Role misalignment costs organizations thousands of hours every year. People are placed in positions that don't match how they think, work, or lead — not because of bad intentions, but because there's no system to see it clearly. Turnover climbs. Hiring repeats mistakes. Leadership guesses. RoleColor changes that.",
  },
  {
    icon: Layers,
    label: "Full Team Ownership",
    heading: "See your entire team — at once.",
    body: "With RoleColor for Teams, you get a live map of your organization's color distribution. You can see at a glance where your team is heavy in execution, where you're short on vision, and where collaboration friction is coming from. It's not a report you run once — it's a living view of your team's identity that updates as your people do.",
  },
  {
    icon: BrainCircuit,
    label: "The Work Matrix",
    heading: "Stop guessing who should own what.",
    body: "Our AI-powered Work Assignment Matrix matches tasks, projects, and initiatives to the team members whose color profile is built for that kind of work. Blues lead. Greens execute. Reds drive. Yellows connect. When the right work lands with the right person, output accelerates and burnout drops. The matrix learns your team over time — getting sharper as more data comes in.",
  },
  {
    icon: Briefcase,
    label: "The Hiring Platform",
    heading: "Hire with your team in mind, not just the role.",
    body: "RoleColor's hiring intelligence layer doesn't just score candidates — it shows you how each candidate would fit into your existing team color map. You'll know before you hire whether this person fills a gap, creates a redundancy, or unlocks a collaboration dynamic you've been missing. Pair it with our candidate portal for a fully branded, streamlined assessment experience that respects your applicants' time.",
  },
  {
    icon: BarChart2,
    label: "Ongoing Optimization",
    heading: "Your team is never finished growing.",
    body: "As your team evolves, RoleColor evolves with it. Track changes in team composition over time, identify high-potential team members for leadership paths, and use color-aware performance planning to develop people in ways that align with how they're actually wired. Leadership development plans, role transition roadmaps, and scheduled re-assessments keep your organization sharp.",
  },
];

// ─── Feature checklist ─────────────────────────────────────────────────────────

const INCLUDED = [
  "Private branded company portal (your domain, logo, colors)",
  "Admin dashboard with full team visibility and controls",
  "25 or 50 question assessments per employee",
  "Live team color distribution analytics",
  "AI-powered Work Assignment Matrix",
  "Hiring intelligence — fit scoring against your team map",
  "Candidate portal with branded assessment experience",
  "Bulk import & Google Workspace sync",
  "Role clarity & leadership development reports per member",
  "Email customization & scheduled re-assessment reminders",
  "Exportable team composition reports",
  "Dedicated onboarding and ongoing support",
];

// ─── Capability cards ──────────────────────────────────────────────────────────

const CAPABILITY_CARDS = [
  {
    icon: ClipboardList,
    title: "Team Assessments",
    description: "Invite via email or Google SSO. Choose 25 or 50 questions per employee.",
  },
  {
    icon: Layers,
    title: "Team Color Map",
    description: "A live view of your organization's full color distribution.",
  },
  {
    icon: BrainCircuit,
    title: "Work Matrix",
    description: "AI matches tasks and initiatives to the right color profiles automatically.",
  },
  {
    icon: Briefcase,
    title: "Hiring Platform",
    description: "Score candidates against your existing team's color composition.",
  },
  {
    icon: Users,
    title: "Admin Controls",
    description: "Full user management, role assignment, and assessment access controls.",
  },
  {
    icon: Sparkles,
    title: "Custom Branding",
    description: "Your logo, domain, and color palette — feels like your product.",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TeamsLearnMore() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pb-24 pt-40 sm:pt-52 max-w-3xl">

        {/* Header */}
        <div className="mb-16 text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">For Teams</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Transform your team<br className="hidden sm:block" /> with RoleColor™
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop managing people and start understanding them. RoleColor gives leadership a system — not just a snapshot — to build, assign, hire, and grow with clarity.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="rounded-full px-8" asChild>
              <a href="https://app.apollo.io/#/meet/sales/b2bdemo" target="_blank" rel="noopener noreferrer">
                Book a Demo
              </a>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
              <Link to="/pricing#for-teams">Back to Pricing</Link>
            </Button>
          </div>
        </div>

        {/* Story sections */}
        <div className="space-y-10 mb-16">
          {STORY_SECTIONS.map(({ icon: Icon, label, heading, body }) => (
            <div key={label} className="rounded-2xl border border-border bg-muted/50 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">{label}</p>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3">{heading}</h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Capability cards */}
        <h2 className="text-xl font-bold text-foreground mb-5">What's inside the platform</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
          {CAPABILITY_CARDS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-muted/50 p-5 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md hover:shadow-primary/10 hover:border-primary/30"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        {/* Everything included checklist */}
        <div className="rounded-2xl border border-border bg-muted/50 p-6 sm:p-8 mb-10">
          <h2 className="text-xl font-bold text-foreground mb-5">Everything included</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {INCLUDED.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing note */}
        <div className="rounded-xl border border-border bg-muted/40 p-5 mb-12 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Fully customizable pricing</p>
          Platform deployment, core platform access, and hiring intelligence tiers are all scoped to your team's size and needs — making it{" "}
          <span className="font-semibold text-foreground">as low as $12 USD per platform member</span>. Talk to us and we'll build the right plan together.
        </div>

        {/* Bottom CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <Button size="lg" className="w-full sm:w-auto rounded-full px-8" asChild>
            <a href="https://app.apollo.io/#/meet/sales/b2bdemo" target="_blank" rel="noopener noreferrer">
              Book a Demo
            </a>
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8" asChild>
            <Link to="/pricing#for-teams">Back to Pricing</Link>
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ShieldCheckIcon className="h-4 w-4" />
          No hidden fees. Pricing is scoped to your team's actual needs.
        </div>

      </div>
    </div>
  );
}
