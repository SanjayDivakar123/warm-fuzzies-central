import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart2,
  BrainCircuit,
  Check,
  ClipboardList,
  Palette,
  ShieldCheckIcon,
  Sparkles,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Navbar } from "@/components/navigation/Navbar";
import { Badge } from "@/components/ui/badge";
import { BorderTrail } from "@/components/ui/border-trail";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/ui/grid-feature-cards";
import { PaymentButton } from "@/components/payment/PaymentButton";
import { cn } from "@/lib/utils";
import { getLocalizedPrice } from "@/lib/countryPricing";

interface PlanCardProps {
  name: string;
  price: string;
  priceNote?: string;
  target: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  icon: React.ElementType;
  ctaAction: "free" | "premium" | "pro";
}

function DecorativeCross({ className }: { className?: string }) {
  return (
    <svg
      className={cn("absolute h-8 w-8 text-foreground/10", className)}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <line x1="16" y1="2" x2="16" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="2" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlanCard({
  name,
  price,
  priceNote,
  target,
  description,
  features,
  cta,
  popular,
  icon: Icon,
  ctaAction,
}: PlanCardProps) {
  return (
    <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-muted/50 p-6 text-left transition-all duration-300 ease-in-out hover:bg-muted/80 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30">
      {/* Green top accent */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-primary rounded-t-xl" />

      {/* Decorative crosses */}
      <DecorativeCross className="top-3 right-3" />
      <DecorativeCross className="bottom-3 left-3" />
      <DecorativeCross className="bottom-3 right-3 opacity-60" />

      <div className="relative z-10">
        <div className="mb-2 flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <p className="font-semibold text-foreground">{name}</p>
          {popular ? <Badge variant="secondary">Popular</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">{target}</p>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>

        <div className="mt-6 flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-tight text-foreground">{price}</span>
          {priceNote ? <span className="text-muted-foreground">/{priceNote}</span> : null}
        </div>

        <ul className="mt-6 space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {ctaAction === "free" ? (
            <Button className="w-full rounded-full" variant={popular ? "default" : "outline"} asChild>
              <Link to="/free-assessment">{cta}</Link>
            </Button>
          ) : ctaAction === "premium" ? (
            <PaymentButton productType="premium" className="w-full rounded-full" variant={popular ? "default" : "outline"}>
              {cta}
            </PaymentButton>
          ) : (
            <PaymentButton productType="pro" className="w-full rounded-full" variant={popular ? "default" : "outline"}>
              {cta}
            </PaymentButton>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const premiumPrice = useMemo(() => getLocalizedPrice("premium"), []);
  const proPrice = useMemo(() => getLocalizedPrice("pro"), []);
  const individualPlans: PlanCardProps[] = [
    {
      name: "Free Assessment",
      price: "Free",
      target: "Quick Preview",
      description: "Get a taste of what we can do with a mini assessment",
      features: ["3-question mini quiz", "Basic color preview", "See sample insights", "Understand your potential"],
      cta: "Try Free Preview",
      popular: false,
      icon: Palette,
      ctaAction: "free",
    },
    {
      name: "Premium Assessment",
      price: premiumPrice.displayFormatted,
      priceNote: "one-time",
      target: "Complete Analysis",
      description: "Full 25-question assessment with detailed insights",
      features: [
        "Complete 25-question quiz",
        "Full color profile analysis",
        "Role recommendations with salaries",
        "Leadership potential assessment",
        "Downloadable PDF report",
      ],
      cta: "Get Premium Assessment",
      popular: true,
      icon: Star,
      ctaAction: "premium",
    },
    {
      name: "Pro Deep Dive",
      price: proPrice.displayFormatted,
      priceNote: "one-time",
      target: "Master Analysis",
      description: "Ultimate 50-question assessment with comprehensive 3-page report",
      features: [
        "Extended 50-question deep assessment",
        "Advanced color blending analysis",
        "3-page comprehensive report",
        "Career transition roadmap",
        "Leadership development plan",
      ],
      cta: "Get Pro Analysis",
      popular: false,
      icon: UserCheck,
      ctaAction: "pro",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pb-12 pt-40 sm:pb-16 sm:pt-56">
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Find your RoleColor.</h2>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground">Choose the plan that fits you or your team.</p>
          </div>

          <div className="relative max-w-5xl mx-auto rounded-2xl p-1">
            <BorderTrail
              className={cn("bg-gradient-to-l from-primary via-primary/80 to-primary/20")}
              size={80}
              transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
            />
            <div className="flex flex-col lg:flex-row gap-4">
              {individualPlans.map((plan) => (
                <PlanCard key={plan.name} {...plan} />
              ))}
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ShieldCheckIcon className="h-4 w-4" />
              All features included with no hidden fees
            </div>
          </div>
        </div>

        <div id="for-teams" className="scroll-mt-24 pt-20 sm:pt-24">
          <TeamsSection />
        </div>
      </div>
    </div>
  );
}

const TEAM_FEATURES_GRID: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  bullets: string[];
}[] = [
  {
    icon: ClipboardList,
    title: "Team Intelligence + Insights",
    bullets: [
      "Understand why your team isn't performing at its best",
      "Identify hidden role gaps across your organization",
      "See how individuals actually work, not how they think they work",
      "Get a clear, unified view of how your entire organization operates",
    ],
  },
  {
    icon: BarChart2,
    title: "Performance Diagnostics",
    bullets: [
      "Spot inefficiencies before they slow your team down",
      "Detect imbalances that lead to bottlenecks and misalignment",
      "Understand where collaboration is breaking down",
      "Track how team structure impacts performance over time",
    ],
  },
  {
    icon: Sparkles,
    title: "Custom Enterprie Deployment",
    bullets: [
      "Launch a fully branded experience for your entire team",
      "Seamlessly integrate with your existing workflows",
      "Scale across departments without friction",
      "Onboard hundreds of employees with a single import",
    ],
  },
  {
    icon: BrainCircuit,
    title: "The Excecution Engine",
    bullets: [
      "Assign work based on strengths, not assumptions",
      "Match tasks to the people best suited to execute them",
      "Build teams with complementary strengths automatically",
      "Increase output quality without increasing headcount",
    ],
  },
];


function TeamsSection() {
  return (
    <>
      <div className="text-center mb-8">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">For Teams</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Empower Your Entire Organization
        </h2>
        <p className="mt-3 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground">
          Unlock team dynamics, improve collaboration, and build high-performing teams with our B2B platform.
        </p>
      </div>

      <div className="relative mx-auto max-w-5xl rounded-2xl border border-border bg-muted/50 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
          {/* Left — features */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">RoleColor™ for Teams</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Most teams don't fail from lack of talent. They fail from how they work together.
            </p>

            <TeamsFeaturesAnimated />
          </div>

          {/* Right — price + CTAs */}
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <div className="rounded-2xl border border-border bg-background p-6 text-center shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Starting at</p>
              <p className="text-5xl font-extrabold text-foreground leading-none">$12</p>
              <p className="mt-1 text-sm text-muted-foreground">USD / platform member</p>
              <p className="mt-1 text-xs text-muted-foreground">billed monthly</p>

              <div className="mt-6 flex flex-col gap-3">
                <Button className="w-full rounded-full" asChild>
                  <a href="https://app.apollo.io/#/meet/sales/b2bdemo" target="_blank" rel="noopener noreferrer">
                    Book a Demo
                  </a>
                </Button>
                <Button className="w-full rounded-full" variant="outline" asChild>
                  <Link to="/pricing/teams">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}

function TeamsFeaturesAnimated() {
  return (
    <AnimatedContainer delay={0.2}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {TEAM_FEATURES_GRID.map(({ icon: Icon, title, bullets }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">{title}</p>
              <ul className="space-y-1">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </AnimatedContainer>
  );
}

function AnimatedContainer({
  className,
  delay = 0.1,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) return <>{children}</>;
  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
