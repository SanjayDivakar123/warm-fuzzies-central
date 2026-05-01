import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { AdvisorLandingPage as AdvisorLandingPageData } from "@/lib/advisorLanding";

export default function AdvisorLandingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage] = useState<AdvisorLandingPageData | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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
    if (!guestName.trim() || !guestEmail.trim()) {
      toast({
        title: "Name and email required",
        description: "Enter your name and email so we can send your results.",
        variant: "destructive",
      });
      return;
    }

    setCheckoutLoading(true);
    const { data, error } = await supabase.functions.invoke("create-advisor-assessment-checkout", {
      body: { slug, guestName: guestName.trim(), guestEmail: guestEmail.trim() },
    });
    setCheckoutLoading(false);

    if (error || !data?.url) {
      toast({
        title: "Checkout failed",
        description: error?.message || data?.error || "Unable to create checkout.",
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_32%),linear-gradient(180deg,#f8fafc,#ffffff)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
        <div className="flex flex-col justify-center space-y-6">
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
        </div>

        <Card className="border-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle>Start your discounted assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
              Your results will be sent to you and shared with {page.advisorName} so they can follow up with guidance.
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-name">Full name</Label>
              <Input id="guest-name" value={guestName} onChange={(event) => setGuestName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-email">Email</Label>
              <Input id="guest-email" type="email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} />
            </div>
            <Button className="w-full" size="lg" onClick={startCheckout} disabled={checkoutLoading}>
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
