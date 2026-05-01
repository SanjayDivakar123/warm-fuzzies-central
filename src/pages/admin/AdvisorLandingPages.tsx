import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, ExternalLink, Loader2, Plus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatMinorCurrency, slugify } from "@/lib/advisorLanding";

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

type AdvisorPageRow = {
  id: string;
  title: string;
  slug: string;
  assessment_type: "premium" | "pro";
  discount_percent: number;
  is_active: boolean;
  hero_headline?: string | null;
  hero_subheadline?: string | null;
  advisor?: {
    id: string;
    name: string;
    email: string;
    company_name?: string | null;
    stripe_connect_status?: string | null;
    payouts_enabled?: boolean | null;
  };
  submissions?: {
    id: string;
    status: string;
    discounted_amount_minor: number;
    commission?: { id: string; status: string; commission_amount_minor: number } | { id: string; status: string; commission_amount_minor: number }[] | null;
  }[];
};

const initialForm = {
  advisorName: "",
  advisorEmail: "",
  companyName: "",
  title: "",
  slug: "",
  assessmentType: "premium" as "premium" | "pro",
  heroHeadline: "",
  heroSubheadline: "",
  isActive: false,
};

export default function AdvisorLandingPages() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pages, setPages] = useState<AdvisorPageRow[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const publicUrl = useMemo(() => `${window.location.origin}/advisor/${form.slug || "advisor-name"}`, [form.slug]);

  const loadPages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-advisor-landing-pages", {
      body: { action: "list" },
    });
    if (error) {
      toast({ title: "Could not load landing pages", description: error.message, variant: "destructive" });
    } else {
      setPages(data?.pages || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const updateForm = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "title" && !editingPageId) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  };

  const savePage = async () => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("manage-advisor-landing-pages", {
      body: {
        action: "create_or_update",
        landingPageId: editingPageId,
        ...form,
      },
    });
    setSaving(false);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }

    setPages(data?.pages || []);
    setForm(initialForm);
    setEditingPageId(null);
    toast({ title: "Landing page saved", description: "The advisor landing page is ready to share." });
  };

  const editPage = (page: AdvisorPageRow) => {
    setEditingPageId(page.id);
    setForm({
      advisorName: page.advisor?.name || "",
      advisorEmail: page.advisor?.email || "",
      companyName: page.advisor?.company_name || "",
      title: page.title,
      slug: page.slug,
      assessmentType: page.assessment_type,
      heroHeadline: page.hero_headline || "",
      heroSubheadline: page.hero_subheadline || "",
      isActive: page.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = async (page: AdvisorPageRow) => {
    const { data, error } = await supabase.functions.invoke("manage-advisor-landing-pages", {
      body: { action: "set_active", pageId: page.id, isActive: !page.is_active },
    });
    if (error) {
      toast({ title: "Status update failed", description: error.message, variant: "destructive" });
    } else {
      setPages(data?.pages || []);
    }
  };

  const createConnectLink = async (advisorId?: string) => {
    if (!advisorId) return;
    const { data, error } = await supabase.functions.invoke("create-advisor-connect-link", {
      body: {
        advisorId,
        returnUrl: `https://qbuxoetprodjxpagfkoi.supabase.co/functions/v1/stripe-connect-oauth-callback`,
        refreshUrl: `${window.location.origin}/admin/advisor-landing-pages?connect=refresh`,
      },
    });
    if (error || !data?.url) {
      toast({
        title: "Connect link failed",
        description: error ? await getFunctionErrorMessage(error, data?.error || "Unable to create Connect link.") : data?.error,
        variant: "destructive",
      });
    } else {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  };

  const inviteAdvisor = async (advisorId?: string) => {
    if (!advisorId) return;
    const { error } = await supabase.functions.invoke("manage-advisor-landing-pages", {
      body: {
        action: "invite_advisor",
        advisorId,
        redirectTo: `${window.location.origin}/advisor-portal`,
      },
    });
    toast({
      title: error ? "Invite failed" : "Advisor invited",
      description: error ? await getFunctionErrorMessage(error, "Unable to invite advisor.") : "The advisor will receive an email to create their login.",
      variant: error ? "destructive" : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button variant="ghost" className="mb-3 px-0" onClick={() => navigate("/admin/rcf-b2b")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Super Admin
            </Button>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Advisor Landing Pages</h1>
            <p className="mt-2 text-slate-600">Create advisor pages, manage Connect onboarding, and monitor discounted assessment submissions.</p>
          </div>
          <Button variant="outline" onClick={loadPages} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>{editingPageId ? "Edit landing page" : "Create landing page"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Advisor name</Label>
                  <Input value={form.advisorName} onChange={(event) => updateForm("advisorName", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Advisor email</Label>
                  <Input type="email" value={form.advisorEmail} onChange={(event) => updateForm("advisorEmail", event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Company or practice name</Label>
                <Input value={form.companyName} onChange={(event) => updateForm("companyName", event.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Landing page name</Label>
                  <Input value={form.title} onChange={(event) => updateForm("title", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Assessment</Label>
                  <Select value={form.assessmentType} onValueChange={(value) => updateForm("assessmentType", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Public slug</Label>
                <Input value={form.slug} onChange={(event) => updateForm("slug", slugify(event.target.value))} />
                <p className="text-xs text-muted-foreground">{publicUrl}</p>
              </div>
              <div className="space-y-2">
                <Label>Hero headline</Label>
                <Input value={form.heroHeadline} onChange={(event) => updateForm("heroHeadline", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hero subheadline</Label>
                <Textarea value={form.heroSubheadline} onChange={(event) => updateForm("heroSubheadline", event.target.value)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Publicly active</Label>
                  <p className="text-xs text-muted-foreground">Inactive pages cannot be purchased from.</p>
                </div>
                <Switch checked={form.isActive} onCheckedChange={(checked) => updateForm("isActive", checked)} />
              </div>
              <div className="flex gap-3">
                <Button onClick={savePage} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  {editingPageId ? "Save Changes" : "Create Landing Page"}
                </Button>
                {editingPageId ? (
                  <Button variant="outline" onClick={() => { setEditingPageId(null); setForm(initialForm); }}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-white">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-3xl border bg-slate-50 p-6">
                <Badge>{form.assessmentType === "pro" ? "Pro Assessment" : "Premium Assessment"} - 30% off</Badge>
                <h2 className="mt-6 text-3xl font-bold">{form.heroHeadline || form.title || "Advisor landing page headline"}</h2>
                <p className="mt-3 text-slate-600">
                  {form.heroSubheadline || `A simple discounted assessment page for ${form.advisorName || "your advisor"}.`}
                </p>
                <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground">Advisor</p>
                  <p className="font-semibold">{form.advisorName || "Advisor Name"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Existing Landing Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Advisor</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Commissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => {
                    const commissionTotal = (page.submissions || []).reduce((sum, submission) => {
                      const commission = Array.isArray(submission.commission)
                        ? submission.commission[0]
                        : submission.commission;
                      return sum + (commission?.commission_amount_minor || 0);
                    }, 0);
                    return (
                      <TableRow key={page.id}>
                        <TableCell>
                          <div className="font-medium">{page.title}</div>
                          <div className="text-xs text-muted-foreground">/advisor/{page.slug}</div>
                        </TableCell>
                        <TableCell>
                          <div>{page.advisor?.name}</div>
                          <div className="text-xs text-muted-foreground">{page.advisor?.email}</div>
                        </TableCell>
                        <TableCell className="capitalize">{page.assessment_type}</TableCell>
                        <TableCell>{page.submissions?.length || 0}</TableCell>
                        <TableCell>{formatMinorCurrency(commissionTotal)}</TableCell>
                        <TableCell>
                          <Badge variant={page.is_active ? "default" : "outline"}>{page.is_active ? "Active" : "Inactive"}</Badge>
                          <div className="mt-1 text-xs text-muted-foreground">{page.advisor?.stripe_connect_status || "not_started"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => editPage(page)}>Edit</Button>
                            <Button size="sm" variant="outline" onClick={() => toggleActive(page)}>{page.is_active ? "Disable" : "Activate"}</Button>
                            <Button size="sm" variant="outline" onClick={() => createConnectLink(page.advisor?.id)}>Connect</Button>
                            <Button size="sm" variant="outline" onClick={() => inviteAdvisor(page.advisor?.id)}>Invite</Button>
                            <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/advisor/${page.slug}`)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => window.open(`/advisor/${page.slug}`, "_blank")}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
