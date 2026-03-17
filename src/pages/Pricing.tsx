import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Building2,
  Check,
  Palette,
  ShieldCheckIcon,
  Star,
  UserCheck,
  Users,
  Zap,
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
  const b2bPrice = useMemo(() => getLocalizedPrice("b2b", countryCode), [countryCode]);

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

        <div id="for-teams" className="mb-12 sm:mb-16 scroll-mt-24">
          <div className="text-center mb-8">
            <p className="text-muted-foreground mb-2">For Teams</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Empower Your Entire Organization</h2>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <BorderTrail
              className={cn("bg-gradient-to-l from-secondary via-secondary/80 to-secondary/20")}
              size={80}
              transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
            />
            <div className="bg-muted/40 rounded-xl p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-6 w-6 text-primary" />
                    <h3 className="text-2xl font-bold text-foreground">RoleColor for Teams</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start gap-3"><Users className="h-5 w-5 text-primary mt-0.5" /><p className="text-sm">Team Assessments</p></div>
                    <div className="flex items-start gap-3"><BarChart3 className="h-5 w-5 text-primary mt-0.5" /><p className="text-sm">Team Analytics</p></div>
                    <div className="flex items-start gap-3"><Zap className="h-5 w-5 text-primary mt-0.5" /><p className="text-sm">AI Work Assignment</p></div>
                    <div className="flex items-start gap-3"><Palette className="h-5 w-5 text-primary mt-0.5" /><p className="text-sm">Custom Branding</p></div>
                  </div>
                </div>

                <div className="lg:min-w-72 flex flex-col justify-center">
                  <div className="bg-background/50 rounded-lg p-6 text-center border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Starting at</p>
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                      <span className="text-4xl font-bold tracking-tight text-foreground">{b2bPrice.displayFormatted}</span>
                      <span className="text-muted-foreground">/user/month</span>
                    </div>
                    <Button className="w-full rounded-full mb-3" asChild>
                      <Link to="/b2b">Get Started</Link>
                    </Button>
                    <Button variant="outline" className="w-full rounded-full" asChild>
                      <Link to="/contact">Contact Sales</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
