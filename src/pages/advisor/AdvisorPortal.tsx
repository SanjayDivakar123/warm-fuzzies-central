import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, LogOut, RefreshCw } from "lucide-react";
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

type AdvisorPortalData = {
  advisor?: {
    name?: string | null;
    stripe_connect_status?: string | null;
    payouts_enabled?: boolean | null;
  } | null;
  pages: PortalPage[];
  submissions: PortalSubmission[];
  stats?: {
    pages?: number;
    submissions?: number;
    completed?: number;
    commissionMinor?: number;
  };
};

export default function AdvisorPortal() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portal, setPortal] = useState<AdvisorPortalData | null>(null);

  const loadPortal = useCallback(async () => {
    if (!user) return;
    setPortalLoading(true);
    const { data, error } = await supabase.functions.invoke("advisor-portal-summary");
    if (error) {
      toast({ title: "Could not load advisor portal", description: error.message, variant: "destructive" });
      setPortal(null);
    } else {
      setPortal(data);
    }
    setPortalLoading(false);
  }, [toast, user]);

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
            <p className="mt-2 text-slate-600">View submissions, result links, commissions, and Stripe Connect status.</p>
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Landing Pages</p><p className="mt-2 text-3xl font-semibold">{portal?.stats?.pages || 0}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Submissions</p><p className="mt-2 text-3xl font-semibold">{portal?.stats?.submissions || 0}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Completed</p><p className="mt-2 text-3xl font-semibold">{portal?.stats?.completed || 0}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Commission</p><p className="mt-2 text-3xl font-semibold">{formatMinorCurrency(portal?.stats?.commissionMinor || 0)}</p></CardContent></Card>
            </div>

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
              <CardHeader><CardTitle>Landing Pages</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>URL</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(portal?.pages || []).map((page) => (
                      <TableRow key={page.id}>
                        <TableCell>{page.title}</TableCell>
                        <TableCell className="capitalize">{page.assessment_type}</TableCell>
                        <TableCell><Badge variant={page.is_active ? "default" : "outline"}>{page.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                        <TableCell><Button variant="link" className="px-0" onClick={() => window.open(`/advisor/${page.slug}`, "_blank")}><ExternalLink className="mr-2 h-4 w-4" />/advisor/{page.slug}</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
          </>
        )}
      </div>
    </div>
  );
}
