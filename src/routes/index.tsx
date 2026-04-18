import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Inbox,
  LineChart,
  Mail,
  Search,
  Sparkles,
  Workflow,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "OutreachOS — AI-powered B2B outreach on autopilot" },
      {
        name: "description",
        content:
          "Find your buyers, write the emails, send from your inbox, and book meetings — autonomously.",
      },
    ],
  }),
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <LogoStrip />
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">OutreachOS</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">
            Features
          </a>
          <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">
            How it works
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
            Pricing
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/40">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 50% 0%, hsl(var(--primary) / 0.18), transparent 70%)",
        }}
      />
      <div className="container mx-auto px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Outreach on autopilot — now in private beta
          </div>
          <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
            Your outbound team,{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              run by AI
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            OutreachOS finds your buyers, writes personalized emails, sends from your inbox,
            triages replies, and books meetings. You wake up to a calendar full of qualified calls.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#cta"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required · 14-day trial · Cancel anytime
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="rounded-xl border border-border bg-card p-2 shadow-2xl shadow-primary/5">
            <div className="rounded-lg bg-muted/30 p-8">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const stats = [
    { label: "Leads enriched", value: "1,284", trend: "+12%" },
    { label: "Emails sent", value: "3,941", trend: "+8%" },
    { label: "Reply rate", value: "14.2%", trend: "+2.1%" },
    { label: "Meetings booked", value: "47", trend: "+9" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-lg border border-border bg-card p-4 text-left"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {s.label}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-2xl font-semibold">{s.value}</div>
            <div className="text-xs font-medium text-primary">{s.trend}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LogoStrip() {
  return (
    <section className="border-b border-border/40 py-10">
      <div className="container mx-auto px-6">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          Trusted by founders shipping outbound at scale
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-60">
          {["Lattice", "Northwind", "Linear", "Acme.io", "Vercel", "Foundry"].map((n) => (
            <span key={n} className="text-sm font-semibold tracking-wide text-muted-foreground">
              {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: Search,
      title: "Lead discovery",
      desc: "GMB, LinkedIn, Crunchbase, job boards. Filtered to your ICP, deduped, enriched with verified emails.",
    },
    {
      icon: Sparkles,
      title: "AI copywriting",
      desc: "Personalized first lines and offers per lead. A/B tested variants the system learns from.",
    },
    {
      icon: Mail,
      title: "Inbox-native sending",
      desc: "Sends from your real Gmail with rotation, warmup, and human-like cadence.",
    },
    {
      icon: Inbox,
      title: "Reply triage",
      desc: "Classifies every reply: positive, objection, OOO, unsubscribe. Routes the hot ones to you.",
    },
    {
      icon: Workflow,
      title: "Multi-step sequences",
      desc: "Followups, reactivation, breakups — all running on your schedule with smart skip logic.",
    },
    {
      icon: LineChart,
      title: "Real reporting",
      desc: "Open rates, reply rates, meetings booked, by sequence and by variant. No vanity metrics.",
    },
  ];
  return (
    <section id="features" className="border-b border-border/40 py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl font-semibold tracking-tight">
            Everything outbound, in one system
          </h2>
          <p className="mt-4 text-muted-foreground">
            Stop stitching together 6 tools. OutreachOS replaces your scraper, enrichment vendor,
            sequencer, inbox rotator, reply parser, and reporting dashboard.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 transition hover:border-primary/40 hover:bg-card/80"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Describe your ICP",
      desc: "Tell Jax, your AI chief of staff, who you sell to. He builds the search queries.",
    },
    {
      n: "02",
      title: "Connect your inbox",
      desc: "One-click Gmail OAuth. We handle warmup, rotation, and deliverability.",
    },
    {
      n: "03",
      title: "Approve the first batch",
      desc: "Review the first 10 emails. Once you approve, the system runs continuously.",
    },
    {
      n: "04",
      title: "Take the meetings",
      desc: "Hot replies hit your inbox with context. Calendar bookings auto-sync.",
    },
  ];
  return (
    <section id="how" className="border-b border-border/40 py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl font-semibold tracking-tight">
            From zero to booked meetings in a day
          </h2>
          <p className="mt-4 text-muted-foreground">
            Setup takes 15 minutes. The system is running outbound by the end of the week.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-card p-6">
              <div className="text-sm font-mono text-primary">{s.n}</div>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="cta" className="py-24">
      <div className="container mx-auto px-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-12 text-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(40% 60% at 50% 50%, hsl(var(--primary) / 0.15), transparent 70%)",
            }}
          />
          <div className="relative">
            <Bot className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-6 text-balance text-4xl font-semibold tracking-tight">
              Hire Jax. Sleep through outbound.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Your AI chief of staff is waiting. Onboarding takes 15 minutes.
            </p>
            <a
              href="#"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Start your free trial
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 py-10">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} OutreachOS
          </span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground">
            Privacy
          </a>
          <a href="#" className="hover:text-foreground">
            Terms
          </a>
          <a href="#" className="hover:text-foreground">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
