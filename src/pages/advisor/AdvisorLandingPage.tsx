import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, Sparkles, Zap, Wallet, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { AdvisorLandingPage as AdvisorLandingPageData } from "@/lib/advisorLanding";
import { motion } from "framer-motion";

export default function AdvisorLandingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage] = useState<AdvisorLandingPageData | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const getCheckoutErrorMessage = async (error: unknown, fallback: string) => {
    const context = (error as { context?: { json?: () => Promise<{ error?: string }> } })?.context;
    if (context?.json) {
      try {
        const body = await context.json();
        const raw = body?.error || fallback;
        if (
          raw.toLowerCase().includes("access code") ||
          raw.toLowerCase().includes("no longer active") ||
          raw.toLowerCase().includes("already used") ||
          raw.toLowerCase().includes("code not active")
        ) {
          return "Code not active or already used, please speak to your advisor for a new code.";
        }
        return raw;
      } catch {
        return fallback;
      }
    }
    return (error as { message?: string })?.message || fallback;
  };

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("get-advisor-landing-page", {
        body: { slug },
      });

      if (error || !data?.page) {
        toast({
          title: "Landing page unavailable",
          description: error?.message || data?.error || "This advisor page is not active.",
          variant: "destructive",
        });
        setPage(null);
      } else {
        setPage(data.page);
      }
      setLoading(false);
    };

    if (slug) {
      loadPage();
    }
  }, [slug, toast]);

  const startCheckout = async () => {
    if (!guestName.trim() || !guestEmail.trim() || !guestPassword.trim()) {
      toast({
        title: "Sign-up details required",
        description: "Enter your full name, email, and password to create your account.",
        variant: "destructive",
      });
      return;
    }
    if (guestPassword.trim().length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    if (!accessCode.trim()) {
      toast({
        title: "Access code required",
        description: "Enter the advisor code provided to you before continuing.",
        variant: "destructive",
      });
      return;
    }

    setCheckoutLoading(true);
    const { data, error } = await supabase.functions.invoke("create-advisor-assessment-checkout", {
      body: {
        slug,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPassword: guestPassword.trim(),
        accessCode: accessCode.trim(),
      },
    });
    setCheckoutLoading(false);

    if (error || !data?.url) {
      const description = error
        ? await getCheckoutErrorMessage(error, data?.error || "Unable to create checkout.")
        : data?.error || "Unable to create checkout.";
      toast({
        title: "Checkout failed",
        description,
        variant: "destructive",
      });
      return;
    }

    window.location.href = data.url;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md text-center">
          <CardContent className="space-y-4 p-6">
            <h1 className="text-2xl font-semibold">Advisor page unavailable</h1>
            <p className="text-muted-foreground">This page may be inactive or the link may be incorrect.</p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_32%),linear-gradient(180deg,#f8fafc,#ffffff)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex flex-col justify-center space-y-6"
        >
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm">
            <Sparkles className="h-4 w-4" />
            {page.discountPercent}% advisor discount
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              {page.heroHeadline || page.title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              {page.heroSubheadline ||
                `You were invited by ${page.advisorName}. Take your ${page.productName} and receive your results after completion.`}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Advisor</p>
              <p className="mt-2 font-semibold text-slate-900">{page.advisorName}</p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assessment</p>
              <p className="mt-2 font-semibold text-slate-900">{page.productName}</p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your price</p>
              <p className="mt-2 font-semibold text-slate-900">
                <span className="mr-2 text-muted-foreground line-through">{page.originalPriceFormatted}</span>
                {page.discountedPriceFormatted}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-white/90 p-3 shadow-sm">
              <div className="mb-2 inline-flex rounded-lg bg-emerald-50 p-2 text-emerald-600"><Wallet className="h-4 w-4" /></div>
              <p className="text-xs text-muted-foreground">Discount Applied</p>
              <p className="text-sm font-semibold text-slate-900">{page.discountPercent}% off at checkout</p>
            </div>
            <div className="rounded-xl border bg-white/90 p-3 shadow-sm">
              <div className="mb-2 inline-flex rounded-lg bg-blue-50 p-2 text-blue-600"><UserCheck className="h-4 w-4" /></div>
              <p className="text-xs text-muted-foreground">Account Ready</p>
              <p className="text-sm font-semibold text-slate-900">RoleColorFinder account created instantly</p>
            </div>
            <div className="rounded-xl border bg-white/90 p-3 shadow-sm">
              <div className="mb-2 inline-flex rounded-lg bg-amber-50 p-2 text-amber-600"><Zap className="h-4 w-4" /></div>
              <p className="text-xs text-muted-foreground">Fast Start</p>
              <p className="text-sm font-semibold text-slate-900">Begin assessment right after payment</p>
            </div>
          </div>
        </motion.div>

        <Card className="border-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle>Create your account and start your discounted assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
              Create your RoleColorFinder account first. Your results will be sent to you and shared with {page.advisorName} so they can follow up with guidance.
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-name">Full name</Label>
              <Input id="guest-name" value={guestName} onChange={(event) => setGuestName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-email">Email</Label>
              <Input id="guest-email" type="email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-password">Password</Label>
              <div className="relative">
                <Input
                  id="guest-password"
                  type={showPassword ? "text" : "password"}
                  value={guestPassword}
                  onChange={(event) => setGuestPassword(event.target.value)}
                  placeholder="Create a password (min 8 characters)"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="advisor-access-code">Advisor access code</Label>
              <Input
                id="advisor-access-code"
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value)}
                placeholder="Enter code from your advisor"
              />
            </div>
            <Button
              className="w-full"
              size="lg"
              style={{
                background: `linear-gradient(135deg, ${page.primaryColor || "#0f172a"} 0%, ${page.secondaryColor || "#1e293b"} 100%)`,
                color: "#ffffff",
              }}
              onClick={startCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Continue to secure checkout
            </Button>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
              Payments are handled by Stripe. No account is required to complete this advisor assessment.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
