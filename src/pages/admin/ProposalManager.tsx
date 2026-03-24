import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ALLOWED_SUPER_ADMIN_EMAILS = [
  "sanjay@rolecolorfinder.com",
  "tristan@rolecolorfinder.com",
];
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, ExternalLink, Trash2, Edit, Copy, FileText, ArrowLeft, Link } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface ProposalPricing {
  platformDeployment: string;
  employeeOnboarding: string;
  corePlatformMonthly: string;
  hiringIntelligenceMonthly: string;
  includedJobRoles: string;
  applicantsPerRole: string;
  scalingPrice: string;
  scalingNote: string;
  outcomePrice: string;
  outcomeNote: string;
}

export interface Proposal {
  id: string;
  proposal_id: string;
  slug: string;
  proposal_title: string;
  company_name: string;
  submitted_by: string;
  background_image_url: string;
  pricing: ProposalPricing;
  closing_text: string;
  created_at: string;
  status: "active" | "draft";
}

type ProposalForm = Omit<Proposal, "id" | "created_at">;

/* -------------------------------------------------------------------------- */
/*                                 Defaults                                   */
/* -------------------------------------------------------------------------- */

const defaultPricing: ProposalPricing = {
  platformDeployment: "$5,000",
  employeeOnboarding: "$20 per employee (one-time)",
  corePlatformMonthly: "$500/month",
  hiringIntelligenceMonthly: "$1,000/month",
  includedJobRoles: "10",
  applicantsPerRole: "1,000",
  scalingPrice: "+$1,000/month",
  scalingNote: "per additional 10 active job roles",
  outcomePrice: "$20 per successful hire",
  outcomeNote: "This aligns investment directly with hiring outcomes and organizational growth.",
};

const defaultClosing =
  `RoleColorFinder is designed to become a foundational system for how organizations structure teams, hire effectively, and scale performance across every property and department.

The industry demands consistent execution, strong team alignment, and high-quality hiring at scale. RCF addresses all three with a single integrated platform built for long-term operational impact — not a one-time workshop or assessment, but a living system embedded into how {{companyName}} operates every day.

We look forward to partnering with {{companyName}} to build a high-performing team culture — one that is measurable, scalable, and aligned with the world-class experience {{companyName}} is known for delivering.

This proposal is the starting point. Our team is ready to move quickly, work closely with your leadership, and deliver results from day one. We are confident this partnership will set a new standard for how {{companyName}} develops and deploys talent across its portfolio.`;

const blankForm = (): ProposalForm => ({
  proposal_title: "",
  company_name: "",
  submitted_by: "Kody Krueger, Head of Sales",
  slug: "",
  proposal_id: "",
  background_image_url:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
  status: "active",
  pricing: { ...defaultPricing },
  closing_text: defaultClosing,
});

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function autoSlug(name: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const abbr = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.slice(0, 6))
    .join("-");
  return `RCF-${abbr}-${year}-${month}-001`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/*                              Main Component                                */
/* -------------------------------------------------------------------------- */

export default function ProposalManager() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProposalForm>(blankForm());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /*                           Auth + data load                          */
  /* ------------------------------------------------------------------ */

  const loadProposals = useCallback(async () => {
    const { data, error } = await supabase
      .from("client_proposals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Failed to load proposals", variant: "destructive" });
    } else {
      setProposals(
        (data ?? []).map((row) => ({
          ...row,
          pricing: row.pricing as unknown as ProposalPricing,
          status: (row.status ?? "active") as "active" | "draft",
        }))
      );
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading) return;

    (async () => {
      try {
        if (!user) { navigate("/auth"); return; }

        // Super admins via email allowlist
        if (ALLOWED_SUPER_ADMIN_EMAILS.includes((user.email ?? "").toLowerCase())) {
          setIsAdmin(true);
          await loadProposals();
          setLoading(false);
          return;
        }

        // Fallback: user_roles table check
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();

        if (error || !roleData) { navigate("/"); return; }

        setIsAdmin(true);
        await loadProposals();
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user, navigate, loadProposals]);

  /* ------------------------------------------------------------------ */
  /*                         Form helpers                                */
  /* ------------------------------------------------------------------ */

  function openNew() {
    setEditingId(null);
    setFormData(blankForm());
    setSheetOpen(true);
  }

  function openEdit(p: Proposal) {
    setEditingId(p.id);
    setFormData({
      proposal_title: p.proposal_title,
      company_name: p.company_name,
      submitted_by: p.submitted_by,
      slug: p.slug,
      proposal_id: p.proposal_id,
      background_image_url: p.background_image_url,
      status: p.status,
      pricing: { ...p.pricing },
      closing_text: p.closing_text,
    });
    setSheetOpen(true);
  }

  function handleCompanyNameChange(value: string) {
    const slug = autoSlug(value);
    setFormData((f) => ({
      ...f,
      company_name: value,
      slug: f.slug === autoSlug(f.company_name) || f.slug === "" ? slug : f.slug,
      proposal_id: f.proposal_id === autoSlug(f.company_name) || f.proposal_id === "" ? slug : f.proposal_id,
    }));
  }

  function handleChange(field: keyof Omit<ProposalForm, "pricing">, value: string) {
    setFormData((f) => ({ ...f, [field]: value }));
  }

  function handlePricingChange(field: keyof ProposalPricing, value: string) {
    setFormData((f) => ({ ...f, pricing: { ...f.pricing, [field]: value } }));
  }

  async function handleSave() {
    if (!formData.company_name.trim() || !formData.proposal_title.trim()) {
      toast({ title: "Missing fields", description: "Company name and proposal title are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        proposal_id: formData.proposal_id,
        slug: formData.slug,
        proposal_title: formData.proposal_title,
        company_name: formData.company_name,
        submitted_by: formData.submitted_by,
        background_image_url: formData.background_image_url,
        pricing: formData.pricing as unknown as Record<string, unknown>,
        closing_text: formData.closing_text,
        status: formData.status,
      };

      if (editingId) {
        const { error } = await supabase
          .from("client_proposals")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("client_proposals")
          .insert(payload);
        if (error) throw error;
      }

      await loadProposals();
      setSheetOpen(false);
      toast({ title: editingId ? "Proposal updated" : "Proposal created", description: `Live at /client/${formData.slug}` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("client_proposals").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      await loadProposals();
      setDeleteConfirm(null);
      toast({ title: "Proposal deleted" });
    }
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/client/${slug}`);
    toast({ title: "Link copied!" });
  }

  /* ------------------------------------------------------------------ */
  /*                       Loading / Auth guards                         */
  /* ------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  if (!isAdmin) return null;

  /* ------------------------------------------------------------------ */
  /*                              Render                                 */
  /* ------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Client Proposals</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Create and manage shareable client proposal pages</p>
            </div>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> New Proposal
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total</p>
              <p className="text-2xl font-bold">{proposals.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Active</p>
              <p className="text-2xl font-bold">{proposals.filter((p) => p.status === "active").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Draft</p>
              <p className="text-2xl font-bold">{proposals.filter((p) => p.status === "draft").length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Proposals grid */}
        {proposals.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No proposals yet</h3>
              <p className="text-muted-foreground text-sm mb-6">Create your first client proposal to get a shareable link.</p>
              <Button onClick={openNew} className="gap-2">
                <Plus className="h-4 w-4" /> New Proposal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {proposals.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-lg truncate">{p.proposal_title}</CardTitle>
                      <CardDescription className="mt-0.5 truncate">{p.company_name}</CardDescription>
                    </div>
                    <Badge variant={p.status === "active" ? "default" : "secondary"} className="shrink-0 capitalize">
                      {p.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 mb-4">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">ID:</span> {p.proposal_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">By:</span> {p.submitted_by}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Created:</span> {formatDate(p.created_at)}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Link className="h-3 w-3" />
                      /client/{p.slug}
                    </p>
                  </div>

                  {deleteConfirm === p.id ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDelete(p.id)}>
                        Confirm Delete
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openEdit(p)}>
                        <Edit className="h-3 w-3" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => copyLink(p.slug)} title="Copy link">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => window.open(`/client/${p.slug}`, "_blank")} title="Preview">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(p.id)} title="Delete">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/*                        Create / Edit Sheet                       */}
      {/* ---------------------------------------------------------------- */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingId ? "Edit Proposal" : "New Proposal"}</SheetTitle>
          </SheetHeader>

          <div className="space-y-8 pb-8">
            {/* ---- Proposal Identity ---- */}
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Proposal Identity</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Company Name *</Label>
                  <Input
                    placeholder="e.g. Hyatt Hotels Corporation"
                    value={formData.company_name}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Proposal Title *</Label>
                  <Input
                    placeholder="e.g. Hyatt Proposal"
                    value={formData.proposal_title}
                    onChange={(e) => handleChange("proposal_title", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Submitted By</Label>
                  <Input
                    value={formData.submitted_by}
                    onChange={(e) => handleChange("submitted_by", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator />

            {/* ---- URL & ID ---- */}
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">URL & Identifier</h3>
              <p className="text-xs text-muted-foreground mb-4">Auto-generated from company name. Edit if needed.</p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Route Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">/client/</span>
                    <Input
                      value={formData.slug}
                      onChange={(e) => handleChange("slug", e.target.value)}
                      placeholder="RCF-COMPANY-2026-03-001"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Proposal ID</Label>
                  <Input
                    value={formData.proposal_id}
                    onChange={(e) => handleChange("proposal_id", e.target.value)}
                    placeholder="RCF-COMPANY-2026-03-001"
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* ---- Background Image ---- */}
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Header Background Image</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Image URL</Label>
                  <Input
                    placeholder="https://..."
                    value={formData.background_image_url}
                    onChange={(e) => handleChange("background_image_url", e.target.value)}
                  />
                </div>
                {formData.background_image_url && (
                  <div className="rounded-xl overflow-hidden h-32 bg-muted">
                    <img
                      src={formData.background_image_url}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* ---- Pricing ---- */}
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Pricing</h3>
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">One-Time Investment</p>
                  <div className="space-y-3 pl-3 border-l-2 border-emerald-200">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Platform Deployment</Label>
                      <Input value={formData.pricing.platformDeployment} onChange={(e) => handlePricingChange("platformDeployment", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Employee Onboarding</Label>
                      <Input value={formData.pricing.employeeOnboarding} onChange={(e) => handlePricingChange("employeeOnboarding", e.target.value)} />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Monthly Investment</p>
                  <div className="space-y-3 pl-3 border-l-2 border-blue-200">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Core Platform Access</Label>
                      <Input value={formData.pricing.corePlatformMonthly} onChange={(e) => handlePricingChange("corePlatformMonthly", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Hiring Intelligence Platform</Label>
                      <Input value={formData.pricing.hiringIntelligenceMonthly} onChange={(e) => handlePricingChange("hiringIntelligenceMonthly", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Included Job Roles</Label>
                        <Input value={formData.pricing.includedJobRoles} onChange={(e) => handlePricingChange("includedJobRoles", e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Applicants Per Role</Label>
                        <Input value={formData.pricing.applicantsPerRole} onChange={(e) => handlePricingChange("applicantsPerRole", e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Scaling</p>
                  <div className="space-y-3 pl-3 border-l-2 border-amber-200">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Scaling Price</Label>
                      <Input value={formData.pricing.scalingPrice} onChange={(e) => handlePricingChange("scalingPrice", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Scaling Note</Label>
                      <Input value={formData.pricing.scalingNote} onChange={(e) => handlePricingChange("scalingNote", e.target.value)} />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Outcome-Based Pricing</p>
                  <div className="space-y-3 pl-3 border-l-2 border-violet-200">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Outcome Price</Label>
                      <Input value={formData.pricing.outcomePrice} onChange={(e) => handlePricingChange("outcomePrice", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Outcome Note</Label>
                      <Input value={formData.pricing.outcomeNote} onChange={(e) => handlePricingChange("outcomeNote", e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* ---- Closing ---- */}
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">Closing Remarks</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Use <code className="bg-muted px-1 rounded">{"{{companyName}}"}</code> to auto-insert the company name. Separate paragraphs with a blank line.
              </p>
              <Textarea
                rows={10}
                value={formData.closing_text}
                onChange={(e) => handleChange("closing_text", e.target.value)}
                className="resize-y font-mono text-sm"
              />
            </section>

            {/* ---- Save ---- */}
            <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Proposal"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
