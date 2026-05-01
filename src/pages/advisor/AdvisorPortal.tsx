import { useCallback, useEffect, useState } from "react";
import { Loader2, LogOut, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { colorLabel, formatMinorCurrency } from "@/lib/advisorLanding";

const getFunctionErrorMessage = async (error: unknown, fallback: string) => {
  const context = (error as { context?: { json?: () => Promise<{ error?: string }> } })?.context;
  if (context?.json) {
    try {
      const body = await context.json();
      if (body?.error) return body.error;
    } catch {
      return fallback;
    }
  }
  return (error as { message?: string })?.message || fallback;
};

type PortalPage = {
  id: string;
  title: string;
  slug: string;
  assessment_type: string;
  is_active: boolean;
  primary_color?: string | null;
  secondary_color?: string | null;
};

type PortalSubmission = {
  id: string;
  guest_name: string;
  guest_email: string;
  assessment_type: string;
  status: string;
  discounted_amount_minor: number;
  result_summary?: {
    dominantColor?: string | null;
    secondaryColor?: string | null;
  } | null;
};

type PortalCommission = {
  id: string;
  submission_id: string;
  currency: string;
  payment_amount_minor: number;
  commission_rate: number;
  commission_amount_minor: number;
  status: string;
  created_at: string;
};

type AdvisorPortalData = {
  advisor?: {
    name?: string | null;
    stripe_connect_status?: string | null;
    payouts_enabled?: boolean | null;
    active_access_code?: string | null;
    access_code_status?: "inactive" | "active" | "used" | string | null;
    access_code_generated_at?: string | null;
    access_code_used_at?: string | null;
  } | null;
  pages: PortalPage[];
  landingPage?: PortalPage | null;
  submissions: PortalSubmission[];
  commissions?: PortalCommission[];
  stats?: {
    submissions?: number;
    completed?: number;
    commissionMinor?: number;
  };
  previewMode?: boolean;
  previewActorEmail?: string | null;
};

export default function AdvisorPortal() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portal, setPortal] = useState<AdvisorPortalData | null>(null);
  const [generatingAccessCode, setGeneratingAccessCode] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#0f172a");
  const [secondaryColor, setSecondaryColor] = useState("#1e293b");
  const [savingColors, setSavingColors] = useState(false);
  const previewAdvisorId = new URLSearchParams(window.location.search).get("previewAdvisorId") || "";

  const loadPortal = useCallback(async () => {
    if (!user) return;
    setPortalLoading(true);
    const { data, error } = await supabase.functions.invoke("advisor-portal-summary", {
      body: previewAdvisorId ? { previewAdvisorId } : {},
    });
    if (error) {
      toast({ title: "Could not load advisor portal", description: error.message, variant: "destructive" });
      setPortal(null);
    } else {
      setPortal(data);
      setPrimaryColor(data?.landingPage?.primary_color || "#0f172a");
      setSecondaryColor(data?.landingPage?.secondary_color || "#1e293b");
    }
    setPortalLoading(false);
  }, [previewAdvisorId, toast, user]);

  useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  const handleLogin = async () => {
    setLoginLoading(true);
    const { error } = await signIn(email, password);
    setLoginLoading(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    }
  };

  const openConnect = async () => {
    const { data, error } = await supabase.functions.invoke("create-advisor-connect-link", {
      body: {
        returnUrl: `https://qbuxoetprodjxpagfkoi.supabase.co/functions/v1/stripe-connect-oauth-callback`,
        refreshUrl: `${window.location.origin}/advisor-portal?connect=refresh`,
      },
    });
    if (error || !data?.url) {
      toast({
        title: "Connect link failed",
        description: error ? await getFunctionErrorMessage(error, data?.error || "Unable to create Connect link.") : data?.error,
        variant: "destructive",
      });
    } else {
      window.location.href = data.url;
    }
  };

  const generateAccessCode = async () => {
    setGeneratingAccessCode(true);
    const { data, error } = await supabase.functions.invoke("advisor-manage-access-code", {
      body: { action: "generate" },
    });
    setGeneratingAccessCode(false);
    if (error || !data?.advisor) {
      toast({
        title: "Code generation failed",
        description: error?.message || data?.error || "Unable to generate advisor code.",
        variant: "destructive",
      });
      return;
    }

    setPortal((current) =>
      current
        ? {
            ...current,
            advisor: {
              ...(current.advisor || {}),
              ...data.advisor,
            },
          }
        : current,
    );
    toast({
      title: "New access code generated",
      description: "Share this code with one user. It will deactivate after one successful submission.",
    });
  };

  const saveLandingPageColors = async () => {
    setSavingColors(true);
    const { data, error } = await supabase.functions.invoke("advisor-update-landing-page-style", {
      body: { primaryColor, secondaryColor },
    });
    setSavingColors(false);
    if (error || !data?.page) {
      toast({
        title: "Color update failed",
        description: error?.message || data?.error || "Unable to update landing page colors.",
        variant: "destructive",
      });
      return;
    }

    setPortal((current) =>
      current
        ? {
            ...current,
            landingPage: {
              ...(current.landingPage || {}),
              ...data.page,
            },
            pages: (current.pages || []).map((page) =>
              page.id === data.page.id ? { ...page, ...data.page } : page,
            ),
          }
        : current,
    );
    toast({
      title: "Landing page colors updated",
      description: "Your advisor frontend now uses the new primary and secondary colors.",
    });
  };

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Advisor Portal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <Button className="w-full" onClick={handleLogin} disabled={loginLoading}>
              {loginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Advisor Portal</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{portal?.advisor?.name || user.email}</h1>
            <p className="mt-2 text-slate-600">Manage access codes, monitor submissions, and control your landing page styling.</p>
            {portal?.previewMode ? (
              <p className="mt-2 text-xs text-amber-700">
                Preview mode as advisor (opened by super admin {portal?.previewActorEmail || "unknown"}).
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadPortal} disabled={portalLoading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            <Button variant="outline" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign Out</Button>
          </div>
        </div>

        {portalLoading && !portal ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Submissions</p><p className="mt-2 text-3xl font-semibold">{portal?.stats?.submissions || 0}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Completed</p><p className="mt-2 text-3xl font-semibold">{portal?.stats?.completed || 0}</p></CardContent></Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Commission</p>
                  <p className="mt-2 text-3xl font-semibold">{formatMinorCurrency(portal?.stats?.commissionMinor || 0)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">See breakdown and activity below.</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Access Code Generator</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Badge variant={portal?.advisor?.access_code_status === "active" ? "default" : "outline"}>
                    {portal?.advisor?.access_code_status || "inactive"}
                  </Badge>
                  <p className="mt-2 text-sm text-muted-foreground">Active code:</p>
                  <p className="mt-1">
                    <span className="font-mono text-2xl font-bold tracking-wider text-foreground">
                      {portal?.advisor?.active_access_code || "No active code"}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {portal?.advisor?.access_code_status === "used"
                      ? "This code has been used once. Generate a new code for the next user."
                      : "Code remains active until used once or replaced by a new generated code."}
                  </p>
                </div>
                <Button onClick={generateAccessCode} disabled={generatingAccessCode || portal?.previewMode}>
                  {generatingAccessCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Generate New Code
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stripe Connect</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Badge>{portal?.advisor?.stripe_connect_status || "not_started"}</Badge>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Payouts {portal?.advisor?.payouts_enabled ? "enabled" : "not enabled"}.
                  </p>
                </div>
                <Button onClick={openConnect}>Continue Stripe Connect</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Submissions</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Guest</TableHead><TableHead>Assessment</TableHead><TableHead>Status</TableHead><TableHead>Result</TableHead><TableHead>Paid</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(portal?.submissions || []).map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell><div>{submission.guest_name}</div><div className="text-xs text-muted-foreground">{submission.guest_email}</div></TableCell>
                        <TableCell className="capitalize">{submission.assessment_type}</TableCell>
                        <TableCell><Badge variant={submission.status === "completed" ? "default" : "outline"}>{submission.status}</Badge></TableCell>
                        <TableCell>{submission.result_summary ? `${colorLabel(submission.result_summary.dominantColor)} / ${colorLabel(submission.result_summary.secondaryColor)}` : "Pending"}</TableCell>
                        <TableCell>{formatMinorCurrency(submission.discounted_amount_minor || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Commission Breakdown & Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-medium">How commission is calculated</p>
                  <p className="mt-1">
                    Commission Amount = Paid Amount x Commission Rate
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Example: $169.99 paid with a 30% rate = $50.997 (rounded to $51.00).
                  </p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Submission</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(portal?.commissions || []).map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>{new Date(commission.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-xs">{commission.submission_id.slice(0, 8)}...</TableCell>
                        <TableCell>{formatMinorCurrency(commission.payment_amount_minor, commission.currency?.toUpperCase() || "USD")}</TableCell>
                        <TableCell>{Math.round((commission.commission_rate || 0) * 100)}%</TableCell>
                        <TableCell>{formatMinorCurrency(commission.commission_amount_minor, commission.currency?.toUpperCase() || "USD")}</TableCell>
                        <TableCell><Badge variant="outline">{commission.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {(portal?.commissions || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No commission activity yet.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Landing Page Colors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Update your advisor page primary and secondary colors.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary color</Label>
                    <div className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2">
                      <input
                        id="primary-color"
                        type="color"
                        value={primaryColor}
                        onChange={(event) => setPrimaryColor(event.target.value)}
                        className="h-9 w-14 cursor-pointer rounded border-0 bg-transparent p-0"
                      />
                      <div className="h-6 w-6 rounded border border-slate-300" style={{ backgroundColor: primaryColor }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary color</Label>
                    <div className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2">
                      <input
                        id="secondary-color"
                        type="color"
                        value={secondaryColor}
                        onChange={(event) => setSecondaryColor(event.target.value)}
                        className="h-9 w-14 cursor-pointer rounded border-0 bg-transparent p-0"
                      />
                      <div className="h-6 w-6 rounded border border-slate-300" style={{ backgroundColor: secondaryColor }} />
                    </div>
                  </div>
                </div>
                <Button onClick={saveLandingPageColors} disabled={savingColors || portal?.previewMode}>
                  {savingColors ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Colors
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
