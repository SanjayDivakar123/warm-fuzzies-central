import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { exportToCSV, exportToJSON } from "@/lib/adminExport";
import { getErrorMessage, hydrateClientProposal } from "@/lib/clientProposals";

interface ProposalAcceptance {
  id: string;
  proposal_slug: string;
  loi_signed_name: string | null;
  loi_signed_at: string | null;
  loe_signed_name: string | null;
  loe_signed_at: string | null;
  payment_status: string;
  paid_at: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  designation: string | null;
  status: string;
  created_at: string;
  stripe_customer_id?: string | null;
  linked_company_id?: string | null;
  company_created_at?: string | null;
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { generateLOIPdf, generateLOEPdf } from "@/lib/proposalPdfExport";
import { parseProposalFeeToCents, formatCentsAsUsd, ensureDollarSignForAmount, formatDeploymentFeeLabel } from "@/lib/proposalPricing";
import { Plus, ExternalLink, Trash2, Edit, Copy, FileText, ArrowLeft, Download, CheckCircle2, Clock, Search, X, ChevronDown, Upload } from "lucide-react";

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
  updated_at?: string;
  version?: number;
  parent_proposal_id?: string | null;
  linked_company_id?: string | null;
  viewed_at?: string | null;
  accepted_at?: string | null;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected";
}

type ProposalForm = Omit<Proposal, "id" | "created_at">;
type BackgroundSource = "url" | "upload";

interface CreateCompanyForm {
  companyName: string;
  subdomain: string;
  assessmentType: "25q" | "50q";
}

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
  submitted_by: "Jessicah Fowler, Head of RevSales",
  slug: "",
  proposal_id: "",
  background_image_url:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
  status: "draft",
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

const proposalStages: Proposal["status"][] = ["draft", "sent", "viewed", "accepted", "rejected"];
const unlimitedSymbol = "∞";
const proposalBackgroundBucket = "proposal-backgrounds";
const maxBackgroundImageBytes = 5 * 1024 * 1024;
const currencyPricingFields: (keyof ProposalPricing)[] = [
  "platformDeployment",
  "employeeOnboarding",
  "corePlatformMonthly",
  "hiringIntelligenceMonthly",
  "scalingPrice",
  "outcomePrice",
];

const stageBadgeClass: Record<Proposal["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-violet-100 text-violet-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

function normalizeCurrencyPricing(pricing: ProposalPricing): ProposalPricing {
  return currencyPricingFields.reduce(
    (normalized, field) => ({
      ...normalized,
      [field]: ensureDollarSignForAmount(normalized[field]),
    }),
    { ...pricing },
  );
}

function inferBackgroundSource(url: string): BackgroundSource {
  return url.includes(`/storage/v1/object/public/${proposalBackgroundBucket}/`) ? "upload" : "url";
}

function generateCompanySubdomain(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50)
    .replace(/^-|-$/g, "");
}

function parseDisplayDollars(value: string) {
  const cents = parseProposalFeeToCents(value);
  return cents === null ? value || "Removed" : formatCentsAsUsd(cents);
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
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [acceptances, setAcceptances] = useState<ProposalAcceptance[]>([]);
  const [expandedAcceptances, setExpandedAcceptances] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProposalForm>(blankForm());
  const [backgroundSource, setBackgroundSource] = useState<BackgroundSource>("url");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteAcceptanceConfirm, setDeleteAcceptanceConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewAcceptance, setReviewAcceptance] = useState<{ proposal: Proposal; acceptance: ProposalAcceptance } | null>(null);
  const [createCompanyTarget, setCreateCompanyTarget] = useState<{ proposal: Proposal; acceptance: ProposalAcceptance } | null>(null);
  const [createCompanyForm, setCreateCompanyForm] = useState<CreateCompanyForm>({
    companyName: "",
    subdomain: "",
    assessmentType: "25q",
  });
  const [creatingCompany, setCreatingCompany] = useState(false);

  /* ------------------------------------------------------------------ */
  /*                           Auth + data load                          */
  /* ------------------------------------------------------------------ */

  const loadProposals = useCallback(async () => {
    const [proposalsRes, acceptancesRes] = await Promise.all([
      supabase.from("client_proposals").select("*").order("created_at", { ascending: false }),
      supabase.from("proposal_acceptances").select("*").order("created_at", { ascending: false }),
    ]);

    if (proposalsRes.error) {
      toast({ title: "Failed to load proposals", variant: "destructive" });
    } else {
      setProposals((proposalsRes.data ?? []).map((row) => hydrateClientProposal(row)));
    }

    if (!acceptancesRes.error) {
      setAcceptances((acceptancesRes.data ?? []) as ProposalAcceptance[]);
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading) return;

    (async () => {
      try {
        if (!user) { navigate("/auth"); return; }

        const { error: superAdminError } = await supabase.functions.invoke("manage-super-admins", {
          body: { action: "list" },
        });

        if (!superAdminError) {
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
    setBackgroundSource("url");
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
    setBackgroundSource(inferBackgroundSource(p.background_image_url));
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

  function handleBackgroundSourceChange(source: BackgroundSource) {
    setBackgroundSource(source);
    setFormData((f) => ({ ...f, background_image_url: "" }));
  }

  async function handleBackgroundUpload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > maxBackgroundImageBytes) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
      return;
    }

    setUploadingBackground(true);
    try {
      const fileExt = file.name.split(".").pop() || "jpg";
      const safeSlug = formData.slug || autoSlug(formData.company_name || "proposal");
      const filePath = `${safeSlug}/background-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(proposalBackgroundBucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(proposalBackgroundBucket).getPublicUrl(filePath);
      setFormData((f) => ({ ...f, background_image_url: data.publicUrl }));
      toast({ title: "Background uploaded" });
    } catch (error: unknown) {
      toast({
        title: "Upload failed",
        description: getErrorMessage(error, "Unable to upload background image."),
        variant: "destructive",
      });
    } finally {
      setUploadingBackground(false);
    }
  }

  function handlePricingChange(field: keyof ProposalPricing, value: string) {
    setFormData((f) => {
      const pricing = { ...f.pricing, [field]: value };
      if ((field === "includedJobRoles" || field === "applicantsPerRole") && value === unlimitedSymbol) {
        pricing.scalingPrice = "";
        pricing.scalingNote = "";
      }
      return { ...f, pricing };
    });
  }

  function setPricingUnlimited(field: "includedJobRoles" | "applicantsPerRole") {
    handlePricingChange(field, unlimitedSymbol);
  }

  function restoreScalingPricing() {
    setFormData((f) => ({
      ...f,
      pricing: {
        ...f.pricing,
        scalingPrice: f.pricing.scalingPrice || defaultPricing.scalingPrice,
        scalingNote: f.pricing.scalingNote || defaultPricing.scalingNote,
      },
    }));
  }

  function removeScalingPricing() {
    setFormData((f) => ({ ...f, pricing: { ...f.pricing, scalingPrice: "", scalingNote: "" } }));
  }

  function restoreOutcomePricing() {
    setFormData((f) => ({
      ...f,
      pricing: {
        ...f.pricing,
        outcomePrice: f.pricing.outcomePrice || defaultPricing.outcomePrice,
        outcomeNote: f.pricing.outcomeNote || defaultPricing.outcomeNote,
      },
    }));
  }

  function removeOutcomePricing() {
    setFormData((f) => ({ ...f, pricing: { ...f.pricing, outcomePrice: "", outcomeNote: "" } }));
  }

  async function handleSave() {
    if (!formData.company_name.trim() || !formData.proposal_title.trim()) {
      toast({ title: "Missing fields", description: "Company name and proposal title are required.", variant: "destructive" });
      return;
    }

    const normalizedSlug = formData.slug.trim().toLowerCase();
    const normalizedProposalId = formData.proposal_id.trim().toLowerCase();
    const duplicateProposal = proposals.find((proposal) => {
      if (proposal.id === editingId) return false;
      return (
        proposal.slug.trim().toLowerCase() === normalizedSlug ||
        proposal.proposal_id.trim().toLowerCase() === normalizedProposalId
      );
    });

    if (duplicateProposal) {
      const duplicateField = duplicateProposal.slug.trim().toLowerCase() === normalizedSlug ? "route slug" : "proposal ID";
      toast({
        title: "Duplicate proposal identifier",
        description: `Another proposal already uses this ${duplicateField}. Please change it before saving.`,
        variant: "destructive",
      });
      return;
    }

    if (!formData.background_image_url.trim()) {
      toast({
        title: "Missing background image",
        description: backgroundSource === "upload" ? "Upload a background image or switch to image URL." : "Enter an image URL or switch to upload.",
        variant: "destructive",
      });
      return;
    }

    if (parseProposalFeeToCents(formData.pricing.platformDeployment) === null) {
      toast({
        title: "Invalid platform deployment fee",
        description: "Enter a valid USD amount, such as $5,000 or 5000.00.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const normalizedPricing = normalizeCurrencyPricing(formData.pricing);

      const payload = {
        proposal_id: formData.proposal_id,
        slug: formData.slug,
        proposal_title: formData.proposal_title,
        company_name: formData.company_name,
        submitted_by: formData.submitted_by,
        background_image_url: formData.background_image_url,
        pricing: normalizedPricing as unknown as Record<string, unknown>,
        closing_text: formData.closing_text,
        status: formData.status,
      };

      if (editingId) {
        const previousProposal = proposals.find((proposal) => proposal.id === editingId);
        if (!previousProposal) {
          throw new Error("Proposal not found.");
        }
        const { error } = await supabase
          .from("client_proposals")
          .update({
            ...payload,
            version: previousProposal.version || 1,
            parent_proposal_id: previousProposal.parent_proposal_id || previousProposal.id,
            linked_company_id: previousProposal.linked_company_id || null,
            viewed_at: previousProposal.viewed_at || null,
            accepted_at: previousProposal.accepted_at || null,
          })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const linkedCompany = proposals.find((proposal) => proposal.company_name === formData.company_name);
        const { error } = await supabase
          .from("client_proposals")
          .insert({
            ...payload,
            version: 1,
            parent_proposal_id: null,
            linked_company_id: linkedCompany?.linked_company_id || null,
          });
        if (error) throw error;
      }

      await loadProposals();
      setSheetOpen(false);
      setEditingId(null);
      toast({ title: editingId ? "Proposal updated" : "Proposal created", description: `Live at /client/${formData.slug}` });
    } catch (err: unknown) {
      toast({ title: "Save failed", description: getErrorMessage(err), variant: "destructive" });
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

  async function handleDeleteAcceptance(id: string) {
    const { data, error } = await supabase.functions.invoke("delete-proposal-acceptance", {
      body: { acceptanceId: id },
    });

    if (error || data?.success === false) {
      toast({
        title: "Delete failed",
        description: error?.message ?? data?.error ?? "Unable to delete acceptance.",
        variant: "destructive",
      });
      return;
    }

    await loadProposals();
    setDeleteAcceptanceConfirm(null);
    setReviewAcceptance((current) => current?.acceptance.id === id ? null : current);
    toast({ title: "Acceptance deleted" });
  }

  async function handleStatusChange(proposal: Proposal, status: Proposal["status"]) {
    const payload: Partial<Proposal> = {
      status,
      viewed_at: status === "viewed" ? new Date().toISOString() : proposal.viewed_at || null,
      accepted_at: status === "accepted" ? new Date().toISOString() : status === "rejected" ? null : proposal.accepted_at || null,
    };

    const { error } = await supabase.from("client_proposals").update(payload).eq("id", proposal.id);
    if (error) {
      toast({ title: "Status update failed", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.rpc("log_admin_action", {
      p_action_type: "proposal_stage_change",
      p_target_type: "platform",
      p_target_id: proposal.id,
      p_target_label: proposal.proposal_title,
      p_metadata: { from: proposal.status, to: status },
    });
    await loadProposals();
  }

  function openLinkedCompany(companyId: string | null | undefined) {
    if (!companyId) return;
    localStorage.setItem("rcf_super_admin_company_context", companyId);
    localStorage.setItem("rcf_super_admin_active_tab", "companies");
    navigate("/admin/rcf-b2b");
  }

  function openCreateCompany(proposal: Proposal, acceptance: ProposalAcceptance) {
    const subdomain = generateCompanySubdomain(proposal.company_name);
    setCreateCompanyTarget({ proposal, acceptance });
    setCreateCompanyForm({
      companyName: proposal.company_name,
      subdomain,
      assessmentType: "25q",
    });
  }

  async function handleCreateCompanyFromProposal() {
    if (!createCompanyTarget || creatingCompany) return;
    setCreatingCompany(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-company-from-proposal", {
        body: {
          acceptanceId: createCompanyTarget.acceptance.id,
          companyName: createCompanyForm.companyName,
          subdomain: createCompanyForm.subdomain,
          assessmentType: createCompanyForm.assessmentType,
        },
      });

      if (error || data?.success === false) {
        throw new Error(error?.message ?? data?.error ?? "Unable to create company");
      }

      await loadProposals();
      setCreateCompanyTarget(null);
      setReviewAcceptance(null);
      toast({
        title: "Company created",
        description: `${data.company?.name ?? createCompanyForm.companyName} is ready. Admin invite has been created.`,
      });
    } catch (error: unknown) {
      toast({
        title: "Company creation failed",
        description: getErrorMessage(error, "Unable to create company."),
        variant: "destructive",
      });
    } finally {
      setCreatingCompany(false);
    }
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/client/${slug}`);
    toast({ title: "Link copied!" });
  }

  function toggleAcceptances(proposalId: string) {
    setExpandedAcceptances((prev) => {
      const next = new Set(prev);
      if (next.has(proposalId)) { next.delete(proposalId); } else { next.add(proposalId); }
      return next;
    });
  }

  function acceptanceStatusBadge(status: string) {
    const map: Record<string, string> = {
      loi_pending: "bg-blue-100 text-blue-700",
      loe_pending: "bg-violet-100 text-violet-700",
      agreement_pending: "bg-slate-100 text-slate-600",
      payment_pending: "bg-amber-100 text-amber-700",
      contact_pending: "bg-blue-100 text-blue-700",
      completed: "bg-emerald-100 text-emerald-700",
    };
    return map[status] ?? "bg-slate-100 text-slate-600";
  }

  const filteredProposals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return proposals;

    return proposals.filter((proposal) => {
      const proposalAcceptances = acceptances.filter((acceptance) => acceptance.proposal_slug === proposal.slug);
      const acceptanceTerms = proposalAcceptances.flatMap((acceptance) => [
        acceptance.first_name ?? "",
        acceptance.last_name ?? "",
        acceptance.email ?? "",
        acceptance.phone ?? "",
        acceptance.loi_signed_name ?? "",
        acceptance.loe_signed_name ?? "",
        acceptance.designation ?? "",
        acceptance.status ?? "",
      ]);

      const searchableText = [
        proposal.proposal_title,
        proposal.company_name,
        proposal.proposal_id,
        proposal.slug,
        proposal.submitted_by,
        proposal.status,
        ...acceptanceTerms,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [acceptances, proposals, searchQuery]);

  const proposalHistoryByFamily = useMemo(() => {
    return proposals.reduce<Record<string, Proposal[]>>((accumulator, proposal) => {
      const key = proposal.parent_proposal_id || proposal.id;
      accumulator[key] = [...(accumulator[key] || []), proposal].sort((a, b) => (b.version || 1) - (a.version || 1));
      return accumulator;
    }, {});
  }, [proposals]);

  function handleExport(format: "csv" | "json") {
    const exporter = format === "csv" ? exportToCSV : exportToJSON;
    exporter(
      filteredProposals.map((proposal) => ({
        title: proposal.proposal_title,
        company: proposal.company_name,
        status: proposal.status,
        created_at: proposal.created_at,
        accepted_at: proposal.accepted_at || "",
      })),
      `proposals-export.${format}`,
    );
  }

  function downloadLOI(p: Proposal, acc: ProposalAcceptance) {
    if (!acc.loi_signed_name) return;
    try {
      const signedAt = acc.loi_signed_at
        ? new Date(acc.loi_signed_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : new Date().toLocaleDateString("en-US");
      generateLOIPdf(p.company_name, p.proposal_id, p.pricing, acc.loi_signed_name, signedAt);
    } catch (err) {
      toast({ title: "PDF download failed", variant: "destructive" });
    }
  }

  function downloadLOE(p: Proposal, acc: ProposalAcceptance) {
    if (!acc.loe_signed_name) return;
    try {
      const signedAt = acc.loe_signed_at
        ? new Date(acc.loe_signed_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : new Date().toLocaleDateString("en-US");
      generateLOEPdf(p.company_name, p.proposal_id, p.pricing, acc.loe_signed_name, signedAt);
    } catch (err) {
      toast({ title: "PDF download failed", variant: "destructive" });
    }
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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-10 px-6 max-w-6xl">
        {/* Clean Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-9 w-9 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Button>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Proposals</h1>
              <p className="text-gray-600 text-sm mt-1">Create and manage client proposals</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleExport("csv")}>Export CSV</Button>
            <Button variant="outline" onClick={() => handleExport("json")}>Export JSON</Button>
            <Button
              onClick={openNew}
              className="gap-2 h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" /> New Proposal
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Total</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{filteredProposals.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Sent</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{filteredProposals.filter((p) => p.status === "sent").length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Accepted</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{filteredProposals.filter((p) => p.status === "accepted").length}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
            <p className="text-blue-700 text-sm font-medium">Paid Clients</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">
              {acceptances.filter((a) => a.payment_status === "paid" && filteredProposals.some((p) => p.slug === a.proposal_slug)).length}
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Search proposals</h2>
              <p className="text-sm text-gray-600">
                Find by proposal title, company, proposal ID, slug, or client contact details.
              </p>
            </div>
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search proposals..."
                className="bg-white pl-9 pr-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-900">Proposal pipeline</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
            {proposalStages.map((stage) => (
              <Badge key={stage} className={stageBadgeClass[stage]}>
                {stage}
              </Badge>
            ))}
          </div>
        </div>

        {/* Proposals Table */}
        {proposals.length === 0 ? (
          <div className="text-center py-16 border border-gray-200 rounded-lg bg-gray-50">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No proposals yet</h3>
            <p className="text-gray-600 text-sm mb-6">Create your first proposal to get started</p>
            <Button onClick={openNew} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4" /> New Proposal
            </Button>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="text-center py-16 border border-gray-200 rounded-lg bg-gray-50">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No proposals match your search</h3>
            <p className="text-gray-600 text-sm mb-6">Try a company name, proposal ID, slug, or client contact detail.</p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProposals.map((p) => {
              const propAcceptances = acceptances.filter((a) => a.proposal_slug === p.slug);
              const completedAcceptances = propAcceptances.filter((a) => a.status === "completed");
              const isExpanded = expandedAcceptances.has(p.id);
              const historyRows = proposalHistoryByFamily[p.parent_proposal_id || p.id] || [p];
              const setupFeeLabel = formatDeploymentFeeLabel(p.pricing.platformDeployment);

              return (
                <div key={p.id} className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <button
                    onClick={() => toggleAcceptances(p.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-gray-900 truncate">{p.proposal_title}</h3>
                          <Select value={p.status} onValueChange={(value) => void handleStatusChange(p, value as Proposal["status"])}>
                            <SelectTrigger className={`h-8 w-[150px] border-0 px-2 text-xs font-semibold ${stageBadgeClass[p.status]}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {proposalStages.map((stage) => (
                                <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Badge variant="outline">v{p.version || 1}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <button
                            type="button"
                            className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                            onClick={() => openLinkedCompany(p.linked_company_id)}
                          >
                            {p.company_name}
                          </button>
                          <span className="text-gray-400">•</span>
                          <code className="font-mono text-gray-700 font-medium">{p.proposal_id}</code>
                          <span className="text-gray-400">•</span>
                          <span>{formatDate(p.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{propAcceptances.length}</div>
                        <div className="text-xs text-gray-600">acceptances</div>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {/* Expandable Acceptances */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-5 space-y-4">
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Proposal history</p>
                            <p className="text-xs text-gray-600">Current edits update the existing proposal row.</p>
                          </div>
                          <Badge variant="outline">{historyRows.length} versions</Badge>
                        </div>
                        <div className="mt-3 space-y-2">
                          {historyRows.map((historyRow) => (
                            <div key={historyRow.id} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm">
                              <div>
                                <p className="font-medium text-gray-900">Version {historyRow.version || 1}</p>
                                <p className="text-xs text-gray-500">{formatDate(historyRow.created_at)} • {historyRow.status}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => copyLink(historyRow.slug)}>Copy Link</Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {propAcceptances.map((acc) => (
                        <div key={acc.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {acc.first_name && acc.last_name ? `${acc.first_name} ${acc.last_name}` : acc.loi_signed_name ?? "Anonymous"}
                              </p>
                              {acc.designation && <p className="text-xs text-gray-600">{acc.designation}</p>}
                            </div>
                            <Badge className={`text-xs font-semibold ${
                              acc.status === "completed" ? "bg-green-100 text-green-800" :
                              acc.status === "contact_pending" ? "bg-blue-100 text-blue-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {acc.status.replace(/_/g, " ")}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              {acc.email && <a href={`mailto:${acc.email}`} className="text-sm text-blue-600 hover:underline">{acc.email}</a>}
                              {acc.phone && <p className="text-sm text-gray-600 mt-1">{acc.phone}</p>}
                            </div>
                            <div className="text-right">
                              {acc.payment_status === "paid" && (
                                <p className="text-sm font-semibold text-green-700">
                                  {setupFeeLabel} paid
                                </p>
                              )}
                              {acc.paid_at && <p className="text-xs text-gray-600">{formatDate(acc.paid_at)}</p>}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className={`p-3 rounded border ${acc.loi_signed_name ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                              <div className="flex items-center gap-2 mb-1">
                                {acc.loi_signed_name ? <CheckCircle2 className="h-4 w-4 text-blue-600" /> : <Clock className="h-4 w-4 text-gray-400" />}
                                <span className="text-xs font-semibold text-gray-900">LOI</span>
                              </div>
                              {acc.loi_signed_name && <p className="text-xs text-gray-600">{acc.loi_signed_at ? formatDate(acc.loi_signed_at) : "Signed"}</p>}
                            </div>
                            <div className={`p-3 rounded border ${acc.loe_signed_name ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-200"}`}>
                              <div className="flex items-center gap-2 mb-1">
                                {acc.loe_signed_name ? <CheckCircle2 className="h-4 w-4 text-purple-600" /> : <Clock className="h-4 w-4 text-gray-400" />}
                                <span className="text-xs font-semibold text-gray-900">LOE</span>
                              </div>
                              {acc.loe_signed_name && <p className="text-xs text-gray-600">{acc.loe_signed_at ? formatDate(acc.loe_signed_at) : "Signed"}</p>}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {deleteAcceptanceConfirm === acc.id ? (
                              <>
                                <Button
                                  size="sm"
                                  className="flex-1 h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() => void handleDeleteAcceptance(acc.id)}
                                >
                                  Confirm Delete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs"
                                  onClick={() => setDeleteAcceptanceConfirm(null)}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-8 text-xs"
                                  onClick={() => downloadLOI(p, acc)}
                                  disabled={!acc.loi_signed_name}
                                >
                                  <Download className="h-3 w-3 mr-1" /> LOI PDF
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-8 text-xs"
                                  onClick={() => downloadLOE(p, acc)}
                                  disabled={!acc.loe_signed_name}
                                >
                                  <Download className="h-3 w-3 mr-1" /> LOE PDF
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white"
                                  onClick={() => setReviewAcceptance({ proposal: p, acceptance: acc })}
                                >
                                  Review
                                </Button>
                                {acc.linked_company_id ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 h-8 text-xs"
                                    onClick={() => openLinkedCompany(acc.linked_company_id)}
                                  >
                                    Open Company
                                  </Button>
                                ) : acc.payment_status === "paid" && acc.status === "completed" ? (
                                  <Button
                                    size="sm"
                                    className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => openCreateCompany(p, acc)}
                                  >
                                    Create Company
                                  </Button>
                                ) : null}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleteAcceptanceConfirm(acc.id)}
                                  title="Delete acceptance"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      {propAcceptances.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                          No acceptances yet for this proposal.
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="px-5 py-4 border-t border-gray-200 flex items-center gap-2 bg-gray-50">
                    {deleteConfirm === p.id ? (
                      <>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => handleDelete(p.id)}
                        >
                          Confirm Delete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1"
                          onClick={() => openEdit(p)}
                        >
                          <Edit className="h-3 w-3" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => copyLink(p.slug)}
                          title="Copy shareable link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => window.open(`/client/${p.slug}?preview=1`, "_blank")}
                          title="Preview proposal flow"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteConfirm(p.id)}
                          title="Delete proposal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!reviewAcceptance} onOpenChange={(open) => !open && setReviewAcceptance(null)}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Acceptance Review</DialogTitle>
            <DialogDescription>
              Review signer, payment, contact, and timeline details for this proposal acceptance.
            </DialogDescription>
          </DialogHeader>

          {reviewAcceptance ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Proposal</p>
                <p className="mt-1 font-semibold text-gray-900">{reviewAcceptance.proposal.proposal_title}</p>
                <p className="text-sm text-gray-600">{reviewAcceptance.proposal.company_name} · {reviewAcceptance.proposal.proposal_id}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Acceptance Status</p>
                  <Badge className={`mt-2 ${acceptanceStatusBadge(reviewAcceptance.acceptance.status)}`}>
                    {reviewAcceptance.acceptance.status.replace(/_/g, " ")}
                  </Badge>
                  <p className="mt-3 text-sm text-gray-600">Created {formatDate(reviewAcceptance.acceptance.created_at)}</p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payment</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {reviewAcceptance.acceptance.payment_status === "paid" ? "Paid" : "Not paid"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {reviewAcceptance.acceptance.paid_at ? formatDate(reviewAcceptance.acceptance.paid_at) : "No payment date recorded"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">LOI Signature</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{reviewAcceptance.acceptance.loi_signed_name || "Not signed"}</p>
                  <p className="text-sm text-gray-600">
                    {reviewAcceptance.acceptance.loi_signed_at ? formatDate(reviewAcceptance.acceptance.loi_signed_at) : "No LOI signature date"}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">LOE Signature</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{reviewAcceptance.acceptance.loe_signed_name || "Not signed"}</p>
                  <p className="text-sm text-gray-600">
                    {reviewAcceptance.acceptance.loe_signed_at ? formatDate(reviewAcceptance.acceptance.loe_signed_at) : "No LOE signature date"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Onboarding Contact</p>
                <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                  <p><span className="text-gray-500">Name:</span> {reviewAcceptance.acceptance.first_name || reviewAcceptance.acceptance.last_name ? `${reviewAcceptance.acceptance.first_name ?? ""} ${reviewAcceptance.acceptance.last_name ?? ""}`.trim() : "Not provided"}</p>
                  <p><span className="text-gray-500">Title:</span> {reviewAcceptance.acceptance.designation || "Not provided"}</p>
                  <p><span className="text-gray-500">Email:</span> {reviewAcceptance.acceptance.email || "Not provided"}</p>
                  <p><span className="text-gray-500">Phone:</span> {reviewAcceptance.acceptance.phone || "Not provided"}</p>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">B2B company</p>
                    <p className="text-xs text-emerald-700">
                      {reviewAcceptance.acceptance.linked_company_id
                        ? "This acceptance is already linked to a company."
                        : reviewAcceptance.acceptance.payment_status === "paid" && reviewAcceptance.acceptance.status === "completed"
                          ? "Create a new company from this paid proposal acceptance."
                          : "Company creation appears after payment and contact details are completed."}
                    </p>
                  </div>
                  {reviewAcceptance.acceptance.linked_company_id ? (
                    <Button size="sm" variant="outline" onClick={() => openLinkedCompany(reviewAcceptance.acceptance.linked_company_id)}>
                      Open Company
                    </Button>
                  ) : reviewAcceptance.acceptance.payment_status === "paid" && reviewAcceptance.acceptance.status === "completed" ? (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => openCreateCompany(reviewAcceptance.proposal, reviewAcceptance.acceptance)}
                    >
                      Create Company
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-900">Delete acceptance</p>
                    <p className="text-xs text-red-700">This removes the acceptance record, signatures, payment marker, and contact details from admin review.</p>
                  </div>
                  {deleteAcceptanceConfirm === reviewAcceptance.acceptance.id ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => void handleDeleteAcceptance(reviewAcceptance.acceptance.id)}
                      >
                        Confirm Delete
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDeleteAcceptanceConfirm(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-100"
                      onClick={() => setDeleteAcceptanceConfirm(reviewAcceptance.acceptance.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!createCompanyTarget} onOpenChange={(open) => !open && setCreateCompanyTarget(null)}>
        <DialogContent className="max-w-3xl bg-white">
          <DialogHeader>
            <DialogTitle>Create Company From Proposal</DialogTitle>
            <DialogDescription>
              Confirm the company setup, saved card, and proposal billing values before creating the B2B portal.
            </DialogDescription>
          </DialogHeader>

          {createCompanyTarget ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Company Name</Label>
                  <Input
                    value={createCompanyForm.companyName}
                    onChange={(event) => setCreateCompanyForm((form) => ({ ...form, companyName: event.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Subdomain</Label>
                  <Input
                    value={createCompanyForm.subdomain}
                    onChange={(event) => setCreateCompanyForm((form) => ({ ...form, subdomain: event.target.value.toLowerCase() }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Admin Email</Label>
                  <Input value={createCompanyTarget.acceptance.email ?? ""} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label>Assessment Type</Label>
                  <Select
                    value={createCompanyForm.assessmentType}
                    onValueChange={(value) => setCreateCompanyForm((form) => ({ ...form, assessmentType: value as "25q" | "50q" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25q">25 Question</SelectItem>
                      <SelectItem value="50q">50 Question</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Billing setup</p>
                    <p className="text-xs text-gray-600">The deployment fee covers month one. First renewal is scheduled one month after company creation.</p>
                  </div>
                  <Badge variant="outline">
                    Card {createCompanyTarget.acceptance.stripe_customer_id ? "saved" : "missing"}
                  </Badge>
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <p><span className="text-gray-500">Core monthly:</span> <strong>{parseDisplayDollars(createCompanyTarget.proposal.pricing.corePlatformMonthly)}</strong></p>
                  <p><span className="text-gray-500">Hiring monthly:</span> <strong>{parseDisplayDollars(createCompanyTarget.proposal.pricing.hiringIntelligenceMonthly)}</strong></p>
                  <p><span className="text-gray-500">Included roles:</span> <strong>{createCompanyTarget.proposal.pricing.includedJobRoles}</strong></p>
                  <p><span className="text-gray-500">Applicants / role:</span> <strong>{createCompanyTarget.proposal.pricing.applicantsPerRole}</strong></p>
                  <p><span className="text-gray-500">Scaling:</span> <strong>{createCompanyTarget.proposal.pricing.scalingPrice ? `${createCompanyTarget.proposal.pricing.scalingPrice} ${createCompanyTarget.proposal.pricing.scalingNote}` : "Removed"}</strong></p>
                  <p><span className="text-gray-500">Outcome fee:</span> <strong>{createCompanyTarget.proposal.pricing.outcomePrice || "Removed"}</strong></p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateCompanyTarget(null)} disabled={creatingCompany}>
                  Cancel
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => void handleCreateCompanyFromProposal()}
                  disabled={creatingCompany || !createCompanyForm.companyName.trim() || !createCompanyForm.subdomain.trim() || !createCompanyTarget.acceptance.stripe_customer_id}
                >
                  {creatingCompany ? "Creating..." : "Create Company"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------------------- */}
      {/*                        Create / Edit Modal                       */}
      {/* ---------------------------------------------------------------- */}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="max-h-[90vh] w-[94vw] max-w-5xl overflow-y-auto bg-white p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {editingId ? "Edit Proposal" : "New Proposal"}
            </DialogTitle>
            <DialogDescription>
              Build the proposal content, pricing, and public client link details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 pb-8">
            {/* ---- Proposal Identity ---- */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide text-gray-700">Proposal Identity</h3>
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
                      {proposalStages.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator className="my-6" />

            {/* ---- URL & ID ---- */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-1 uppercase tracking-wide text-gray-700">URL & Identifier</h3>
              <p className="text-xs text-gray-600 mb-4">Auto-generated from company name. Edit if needed.</p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Route Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 whitespace-nowrap">/client/</span>
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

            <Separator className="my-6" />

            {/* ---- Background Image ---- */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide text-gray-700">Header Background Image</h3>
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleBackgroundSourceChange("url")}
                    className={`rounded-xl border p-4 text-left transition-colors ${backgroundSource === "url" ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                  >
                    <p className="text-sm font-semibold text-gray-900">Use Image URL</p>
                    <p className="mt-1 text-xs text-gray-600">Paste a public image link for the proposal header.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBackgroundSourceChange("upload")}
                    className={`rounded-xl border p-4 text-left transition-colors ${backgroundSource === "upload" ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                  >
                    <p className="text-sm font-semibold text-gray-900">Upload Image</p>
                    <p className="mt-1 text-xs text-gray-600">Upload a JPG, PNG, WebP, or GIF up to 5MB.</p>
                  </button>
                </div>

                {backgroundSource === "url" ? (
                  <div className="space-y-1.5">
                    <Label>Image URL</Label>
                    <Input
                      placeholder="https://..."
                      value={formData.background_image_url}
                      onChange={(e) => handleChange("background_image_url", e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                    <Label className="text-sm font-semibold">Upload Background Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploadingBackground}
                      onChange={(event) => void handleBackgroundUpload(event.target.files?.[0])}
                    />
                    <p className="text-xs text-gray-500">
                      {uploadingBackground ? "Uploading..." : formData.background_image_url ? "Uploaded image selected." : "Upload an image to use this source."}
                    </p>
                  </div>
                )}

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

            <Separator className="my-6" />

            {/* ---- Pricing ---- */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide text-gray-700">Pricing</h3>
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">One-Time Investment</p>
                  <div className="space-y-3 pl-3 border-l-2 border-gray-300">
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
                  <p className="text-xs font-semibold text-gray-700 mb-2">Monthly Investment</p>
                  <div className="space-y-3 pl-3 border-l-2 border-gray-300">
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
                        <div className="flex gap-2">
                          <Input value={formData.pricing.includedJobRoles} onChange={(e) => handlePricingChange("includedJobRoles", e.target.value)} />
                          <Button type="button" variant="outline" className="px-3" onClick={() => setPricingUnlimited("includedJobRoles")}>
                            ∞
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Applicants Per Role</Label>
                        <div className="flex gap-2">
                          <Input value={formData.pricing.applicantsPerRole} onChange={(e) => handlePricingChange("applicantsPerRole", e.target.value)} />
                          <Button type="button" variant="outline" className="px-3" onClick={() => setPricingUnlimited("applicantsPerRole")}>
                            ∞
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-gray-700">Scaling</p>
                    {formData.pricing.scalingPrice || formData.pricing.scalingNote ? (
                      <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={removeScalingPricing}>
                        Remove scaling
                      </Button>
                    ) : (
                      <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={restoreScalingPricing}>
                        Add scaling
                      </Button>
                    )}
                  </div>
                  {formData.pricing.scalingPrice || formData.pricing.scalingNote ? (
                    <div className="space-y-3 pl-3 border-l-2 border-gray-300">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Scaling Price</Label>
                        <Input value={formData.pricing.scalingPrice} onChange={(e) => handlePricingChange("scalingPrice", e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Scaling Note</Label>
                        <Input value={formData.pricing.scalingNote} onChange={(e) => handlePricingChange("scalingNote", e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-500">
                      Scaling pricing is removed. Selecting ∞ for job roles or applicants removes scaling automatically.
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-gray-700">Outcome-Based Pricing</p>
                    {formData.pricing.outcomePrice || formData.pricing.outcomeNote ? (
                      <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={removeOutcomePricing}>
                        Remove outcome
                      </Button>
                    ) : (
                      <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={restoreOutcomePricing}>
                        Add outcome
                      </Button>
                    )}
                  </div>
                  {formData.pricing.outcomePrice || formData.pricing.outcomeNote ? (
                    <div className="space-y-3 pl-3 border-l-2 border-gray-300">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Outcome Price</Label>
                        <Input value={formData.pricing.outcomePrice} onChange={(e) => handlePricingChange("outcomePrice", e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Outcome Note</Label>
                        <Input value={formData.pricing.outcomeNote} onChange={(e) => handlePricingChange("outcomeNote", e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-500">
                      Outcome-based pricing is removed from this proposal.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <Separator className="my-6" />

            {/* ---- Closing ---- */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-1 uppercase tracking-wide text-gray-700">Closing Remarks</h3>
              <p className="text-xs text-gray-600 mb-4">
                Use <code className="bg-gray-100 text-gray-900 px-2 py-0.5 rounded border border-gray-300">{"{{companyName}}"}</code> to auto-insert the company name.
              </p>
              <Textarea
                rows={10}
                value={formData.closing_text}
                onChange={(e) => handleChange("closing_text", e.target.value)}
                className="resize-y font-mono text-sm"
              />
            </section>

            {/* ---- Save ---- */}
            <Button
              className="w-full mt-6 h-10 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSave}
              disabled={saving || uploadingBackground}
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Proposal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
