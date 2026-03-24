import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Palette,
  ShieldCheckIcon,
  Star,
  UserCheck,
} from "lucide-react";

import { Navbar } from "@/components/navigation/Navbar";
import { Badge } from "@/components/ui/badge";
import { BorderTrail } from "@/components/ui/border-trail";
import { Button } from "@/components/ui/button";
import { PaymentButton } from "@/components/payment/PaymentButton";
import { cn } from "@/lib/utils";
import { detectCountryCode, getLocalizedPrice } from "@/lib/countryPricing";

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
    <div className="relative flex-1 overflow-hidden rounded-xl bg-muted/40 p-6 text-left transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:bg-muted/60">
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
  const [countryCode, setCountryCode] = useState("US");

  useEffect(() => {
    let mounted = true;
    detectCountryCode()
      .then((code) => {
        if (mounted) setCountryCode(code);
      })
      .catch(() => {
        if (mounted) setCountryCode("US");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const premiumPrice = useMemo(() => getLocalizedPrice("premium", countryCode), [countryCode]);
  const proPrice = useMemo(() => getLocalizedPrice("pro", countryCode), [countryCode]);
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

          <div className="relative max-w-5xl mx-auto">
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
          <section className="mx-auto w-full max-w-[1200px] rounded-2xl border border-slate-700/70 bg-[#0B0F14] px-5 py-10 sm:px-8 sm:py-14 text-white">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-[7fr_3fr] md:gap-8 lg:gap-10">
              <div className="order-1">
                <h2 className="text-[40px] leading-[1.06] sm:text-[48px] lg:text-[54px] font-extrabold tracking-tight text-white">
                  Build High-Performance Teams
                </h2>
                <p className="mt-4 text-[18px] leading-relaxed text-slate-300">
                  Role clarity. Execution. Hiring that actually works.
                </p>

                <div className="mt-10 max-w-2xl rounded-2xl border border-slate-600/80 bg-[#11161D] p-6 sm:p-8">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Monthly Platform</p>

                  <div className="mt-5 space-y-6">
                    <div>
                      <p className="text-[40px] sm:text-[46px] leading-none font-extrabold text-white">$500/mo</p>
                      <p className="mt-2 text-[15px] text-slate-400">Core Platform</p>
                    </div>
                    <div>
                      <p className="text-[40px] sm:text-[46px] leading-none font-extrabold text-white">$1,000/mo</p>
                      <p className="mt-2 text-[15px] text-slate-400">Hiring Intelligence</p>
                    </div>
                  </div>

                  <div className="mt-7 h-px w-full bg-slate-700/70" />

                  <ul className="mt-5 space-y-2 text-[15px] text-slate-300">
                    <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-sky-400" />Up to 10 active roles</li>
                    <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-sky-400" />Up to 1,000 applicants per role</li>
                  </ul>

                  <p className="mt-4 text-[14px] text-slate-400">+ $1,000/mo per additional 10 roles</p>
                </div>

                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <Button className="h-12 rounded-xl bg-white px-6 text-base font-semibold text-black hover:bg-slate-100" asChild>
                    <a href="https://app.apollo.io/#/meet/sales/b2bdemo" target="_blank" rel="noopener noreferrer">Book Demo</a>
                  </Button>
                </div>
              </div>

              <div className="order-2 flex flex-col gap-4 sm:gap-5 md:pt-6">
                <article className="order-2 md:order-1 rounded-xl border border-slate-600/80 bg-[#11161D] p-5 sm:p-6">
                  <h3 className="text-[19px] font-semibold text-white">One-Time Setup</h3>
                  <div className="mt-4 space-y-2 text-[16px] leading-relaxed text-slate-200">
                    <p><span className="font-semibold text-white">$5,000</span> - Platform deployment</p>
                    <p><span className="font-semibold text-white">$20</span> - per employee onboarding</p>
                  </div>
                </article>

                <article className="order-1 md:order-2 rounded-xl border border-sky-500/35 bg-[#141C28] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(56,189,248,0.14),0_6px_18px_rgba(0,0,0,0.24)]">
                  <h3 className="text-[19px] font-semibold text-white">Pay for Results</h3>
                  <div className="mt-4">
                    <p className="text-[34px] leading-none font-extrabold text-white">$20</p>
                    <p className="mt-2 text-[15px] text-slate-300">per successful hire</p>
                    <p className="mt-3 text-[14px] text-slate-200">You only pay when it works</p>
                  </div>
                </article>
              </div>
            </div>

            <div className="mt-10 space-y-2 text-center md:text-left">
              <p className="text-sm font-medium text-slate-200">Most teams recover cost within 1-2 hires</p>
              <p className="text-sm text-slate-400">Used by growing teams across hiring, sales, and leadership</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
