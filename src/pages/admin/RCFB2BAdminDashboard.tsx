import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpRight,
  Building2,
  Calendar,
  Check,
  ChevronsUpDown,
  CreditCard,
  FileText,
  Globe2,
  Loader2,
  Mail,
  MessageSquareText,
  MoreVertical,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  UserCog,
  XCircle,
} from "lucide-react";
import AdminCompanyStatementModal from "@/components/b2b/admin/AdminCompanyStatementModal";

interface CompanySummary {
  id: string;
  name: string;
  subdomain: string;
  memberCount: number;
  ownerCount: number;
  adminLevelCount: number;
  credit_balance: number;
  hiring_subscription_enabled: boolean;
  hiring_subscription_status: string | null;
  hiring_subscription_cancel_at_period_end: boolean;
  b2b_trial_enabled: boolean;
  b2b_trial_starts_at: string | null;
  b2b_trial_ends_at: string | null;
  b2b_trial_user_limit: number;
  b2b_trial_converted_at: string | null;
  requires_post_setup_deployment_fee: boolean;
  deployment_fee_waived: boolean;
  deployment_fee_waived_at: string | null;
  deployment_fee_charged_at: string | null;
}

interface CompanyUserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  job_role: string | null;
}

interface PlatformUserRow {
  id: string;
  email: string | null;
  full_name?: string | null;
  is_b2b_owner: boolean;
  is_b2b_admin_level: boolean;
  b2b_company_count: number;
}

interface ContactQueryRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  source_page: string;
  status: string;
  created_at: string;
  submitted_by_user_id: string | null;
}

interface SuperAdminRow {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  added_by: string | null;
  added_by_email: string | null;
  created_at: string;
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Unexpected error";
};

const getEdgeErrorMessage = async (error: unknown): Promise<string> => {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json();
      if (payload?.error && typeof payload.error === "string") {
        return payload.error;
      }
    } catch {
      // Ignore parse errors and fall back to default message.
    }
  }
  return getErrorMessage(error);
};

const formatUsdFromCents = (amountCents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((amountCents || 0) / 100);

const formatUsd = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);

const formatShortDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

interface SearchableOption {
  value: string;
  label: string;
  keywords?: string;
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between border-input bg-background font-normal"
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={[option.label, option.keywords ?? "", option.value].join(" ")}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check className={`mr-2 h-4 w-4 ${value === option.value ? "opacity-100" : "opacity-0"}`} />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function RCFB2BAdminDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("companies");
  const [isAllowed, setIsAllowed] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [companyUsers, setCompanyUsers] = useState<CompanyUserRow[]>([]);
  const [companyUsersLoading, setCompanyUsersLoading] = useState(false);

  const [platformUsers, setPlatformUsers] = useState<PlatformUserRow[]>([]);
  const [platformUsersLoading, setPlatformUsersLoading] = useState(false);
  const [superAdminCandidates, setSuperAdminCandidates] = useState<PlatformUserRow[]>([]);
  const [superAdminCandidatesLoading, setSuperAdminCandidatesLoading] = useState(false);
  const [platformSearch, setPlatformSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | "owners" | "admin_level" | "non_b2b">("all");
  const [contactQueries, setContactQueries] = useState<ContactQueryRow[]>([]);
  const [contactQueriesLoading, setContactQueriesLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [contactStatusFilter, setContactStatusFilter] = useState<"all" | "new" | "reviewed" | "resolved">("all");
  const [updatingContactId, setUpdatingContactId] = useState<string | null>(null);
  const [sendingResetTo, setSendingResetTo] = useState<string | null>(null);
  const [billingCompanyId, setBillingCompanyId] = useState<string>("");
  const [billingAmountUsd, setBillingAmountUsd] = useState<string>("");
  const [billingDescription, setBillingDescription] = useState<string>("");
  const [billingLoadingAction, setBillingLoadingAction] = useState<"charge_card" | "add_free_credits" | "remove_credits" | null>(null);
  const [trialLoadingAction, setTrialLoadingAction] = useState(false);
  const [pendingBillingAction, setPendingBillingAction] = useState<"charge_card" | "add_free_credits" | "remove_credits" | null>(null);
  const [selectedBillingAction, setSelectedBillingAction] = useState<"charge_card" | "add_free_credits" | "remove_credits">("add_free_credits");
  const [trialCompanyId, setTrialCompanyId] = useState<string>("");
  const [trialEndsAt, setTrialEndsAt] = useState<string>("");
  const [trialUserLimit, setTrialUserLimit] = useState<string>("10");
  const [createCompanyName, setCreateCompanyName] = useState("");
  const [createCompanySubdomain, setCreateCompanySubdomain] = useState("");
  const [createCompanyAdminUserId, setCreateCompanyAdminUserId] = useState("");
  const [createCompanyWaiveDeploymentFee, setCreateCompanyWaiveDeploymentFee] = useState(false);
  const [createCompanyLoading, setCreateCompanyLoading] = useState(false);
  const [assignAdminCompanyId, setAssignAdminCompanyId] = useState("");
  const [assignAdminUserId, setAssignAdminUserId] = useState("");
  const [assignAdminLoading, setAssignAdminLoading] = useState(false);
  const [deploymentFeeCompanyId, setDeploymentFeeCompanyId] = useState("");
  const [deploymentFeeWaived, setDeploymentFeeWaived] = useState(true);
  const [deploymentFeeLoading, setDeploymentFeeLoading] = useState(false);
  const [statementModalCompany, setStatementModalCompany] = useState<{ id: string; name: string; initialView?: 'statement' | 'renewal' } | null>(null);
  const [togglingHiringFor, setTogglingHiringFor] = useState<string | null>(null);
  const [superAdmins, setSuperAdmins] = useState<SuperAdminRow[]>([]);
  const [superAdminsLoading, setSuperAdminsLoading] = useState(false);
  const [selectedSuperAdminUserId, setSelectedSuperAdminUserId] = useState("");
  const [addingSuperAdmin, setAddingSuperAdmin] = useState(false);
  const [pendingHiringToggle, setPendingHiringToggle] = useState<{ 
    companyId: string; 
    companyName: string; 
    action: 'enable' | 'cancel_subscription' | 'remove_access';
  } | null>(null);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) || null,
    [companies, selectedCompanyId],
  );

  const selectablePlatformUsers = useMemo(
    () => platformUsers.filter((platformUser) => !!platformUser.email),
    [platformUsers],
  );

  const selectableSuperAdminCandidates = useMemo(
    () => superAdminCandidates.filter((platformUser) => !!platformUser.email),
    [superAdminCandidates],
  );

  const companyOptions = useMemo(
    () =>
      companies.map((company) => ({
        value: company.id,
        label: company.name,
        keywords: `${company.subdomain} ${company.hiring_subscription_status ?? ""}`,
      })),
    [companies],
  );

  const platformUserOptions = useMemo(
    () =>
      selectablePlatformUsers.map((platformUser) => ({
        value: platformUser.id,
        label: platformUser.full_name
          ? `${platformUser.full_name} (${platformUser.email})`
          : platformUser.email ?? "Unnamed user",
        keywords: `${platformUser.email ?? ""} ${platformUser.full_name ?? ""}`,
      })),
    [selectablePlatformUsers],
  );

  const superAdminCandidateOptions = useMemo(
    () =>
      selectableSuperAdminCandidates.map((platformUser) => ({
        value: platformUser.id,
        label: platformUser.full_name
          ? `${platformUser.full_name} (${platformUser.email})`
          : platformUser.email ?? "Unnamed user",
        keywords: `${platformUser.email ?? ""} ${platformUser.full_name ?? ""}`,
      })),
    [selectableSuperAdminCandidates],
  );

  const availableSuperAdminOptions = useMemo(() => {
    const existingEmails = new Set(superAdmins.map((admin) => admin.email.toLowerCase()));
    return superAdminCandidateOptions.filter((option) => {
      const matchedUser = selectableSuperAdminCandidates.find((user) => user.id === option.value);
      return matchedUser?.email ? !existingEmails.has(matchedUser.email.toLowerCase()) : false;
    });
  }, [selectableSuperAdminCandidates, superAdminCandidateOptions, superAdmins]);

  const filteredCompanies = useMemo(() => {
    const query = companySearch.trim().toLowerCase();
    if (!query) return companies;

    return companies.filter((company) => {
      const searchable = [
        company.name,
        company.subdomain,
        company.hiring_subscription_status || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [companies, companySearch]);

  const companyStats = useMemo(() => {
    const trialCount = companies.filter((company) => company.b2b_trial_enabled).length;
    const hiringEnabledCount = companies.filter((company) => company.hiring_subscription_enabled).length;
    const deploymentPendingCount = companies.filter(
      (company) =>
        company.requires_post_setup_deployment_fee &&
        !company.deployment_fee_charged_at &&
        !company.deployment_fee_waived,
    ).length;

    return {
      totalCompanies: companies.length,
      trialCount,
      hiringEnabledCount,
      deploymentPendingCount,
    };
  }, [companies]);

  const platformStats = useMemo(() => {
    const ownerCount = platformUsers.filter((platformUser) => platformUser.is_b2b_owner).length;
    const adminLevelCount = platformUsers.filter((platformUser) => platformUser.is_b2b_admin_level).length;
    const nonB2BCount = platformUsers.filter((platformUser) => !platformUser.is_b2b_admin_level).length;

    return {
      total: platformUsers.length,
      ownerCount,
      adminLevelCount,
      nonB2BCount,
    };
  }, [platformUsers]);

  const contactStats = useMemo(() => {
    const newCount = contactQueries.filter((query) => query.status === "new").length;
    const reviewedCount = contactQueries.filter((query) => query.status === "reviewed").length;
    const resolvedCount = contactQueries.filter((query) => query.status === "resolved").length;

    return {
      total: contactQueries.length,
      newCount,
      reviewedCount,
      resolvedCount,
    };
  }, [contactQueries]);

  const tabItems = useMemo(
    () => [
      { value: "companies", label: "Companies", description: "Billing, trials, access", icon: Building2 },
      { value: "company-users", label: "Company Users", description: "Inspect a workspace roster", icon: Users },
      { value: "platform-users", label: "Platform Users", description: "Reset access and filter users", icon: UserCog },
      { value: "contact-queries", label: "Contact Queries", description: "Triage inbound requests", icon: MessageSquareText },
      { value: "proposals", label: "Proposals", description: "Client proposal management", icon: FileText, href: "/admin/proposals" },
    ],
    [],
  );

  const currentTabMeta = useMemo(
    () => tabItems.find((tab) => tab.value === activeTab) ?? tabItems[0],
    [activeTab, tabItems],
  );

  const applyCompanyContext = useCallback((companyId: string) => {
    setSelectedCompanyId(companyId);
    setBillingCompanyId(companyId);
    setTrialCompanyId(companyId);
    setAssignAdminCompanyId(companyId);
    setDeploymentFeeCompanyId(companyId);
  }, []);

  const fetchSuperAdmins = useCallback(async () => {
    setSuperAdminsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-super-admins", {
        body: { action: "list" },
      });

      if (error) throw error;
      setSuperAdmins((data?.super_admins || []) as SuperAdminRow[]);
      setIsAllowed(true);
    } catch (error: unknown) {
      setIsAllowed(false);
      toast({
        title: "Access denied",
        description: "You do not have super admin access to this dashboard.",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setSuperAdminsLoading(false);
      setAccessChecked(true);
    }
  }, [navigate, toast]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    void fetchSuperAdmins();
  }, [fetchSuperAdmins, loading, navigate, user]);

  const fetchCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("list-rcf-b2b-companies");
      if (error) throw error;
      setCompanies(data?.companies || []);
    } catch (error: unknown) {
      toast({
        title: "Error loading companies",
        description: getErrorMessage(error) || "Unable to load companies right now.",
        variant: "destructive",
      });
    } finally {
      setCompaniesLoading(false);
    }
  }, [toast]);

  const fetchCompanyUsers = useCallback(async (companyId: string) => {
    if (!companyId) {
      setCompanyUsers([]);
      return;
    }

    setCompanyUsersLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("list-rcf-company-users", {
        body: { company_id: companyId },
      });
      if (error) throw error;
      setCompanyUsers(data?.users || []);
    } catch (error: unknown) {
      toast({
        title: "Error loading company users",
        description: getErrorMessage(error) || "Unable to load company users.",
        variant: "destructive",
      });
    } finally {
      setCompanyUsersLoading(false);
    }
  }, [toast]);

  const fetchPlatformUsers = useCallback(async () => {
    setPlatformUsersLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("list-rcf-platform-users", {
        body: {
          search: platformSearch,
          owners_only: platformFilter === "owners",
          admin_level_only: platformFilter === "admin_level",
          non_b2b_only: platformFilter === "non_b2b",
        },
      });
      if (error) throw error;
      setPlatformUsers(data?.users || []);
    } catch (error: unknown) {
      toast({
        title: "Error loading platform users",
        description: getErrorMessage(error) || "Unable to load platform users.",
        variant: "destructive",
      });
    } finally {
      setPlatformUsersLoading(false);
    }
  }, [platformFilter, platformSearch, toast]);

  const fetchSuperAdminCandidates = useCallback(async () => {
    setSuperAdminCandidatesLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("list-rcf-platform-users", {
        body: {
          search: "",
          owners_only: false,
          admin_level_only: false,
          non_b2b_only: false,
        },
      });
      if (error) throw error;
      setSuperAdminCandidates(data?.users || []);
    } catch (error: unknown) {
      toast({
        title: "Error loading eligible users",
        description: getErrorMessage(error) || "Unable to load platform users for super admin access.",
        variant: "destructive",
      });
    } finally {
      setSuperAdminCandidatesLoading(false);
    }
  }, [toast]);

  const handleAddSuperAdmin = async () => {
    if (!selectedSuperAdminUserId) {
      toast({
        title: "Select a user",
        description: "Choose a platform user to promote to super admin.",
        variant: "destructive",
      });
      return;
    }

    setAddingSuperAdmin(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-super-admins", {
        body: {
          action: "add",
          user_id: selectedSuperAdminUserId,
        },
      });

      if (error) throw error;

      setSuperAdmins((data?.super_admins || []) as SuperAdminRow[]);
      setSelectedSuperAdminUserId("");
      await fetchSuperAdminCandidates();
      toast({
        title: "Super admin added",
        description: `${data?.added_email || "Selected user"} can now access the super admin dashboard.`,
      });
    } catch (error: unknown) {
      toast({
        title: "Failed to add super admin",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setAddingSuperAdmin(false);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    setSendingResetTo(email);
    try {
      const { data, error } = await supabase.functions.invoke("send-rcf-password-reset", {
        body: { email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Password reset sent",
        description: `Reset email sent to ${email}.`,
      });
    } catch (error: unknown) {
      toast({
        title: "Failed to send reset",
        description: getErrorMessage(error) || "Could not send password reset email.",
        variant: "destructive",
      });
    } finally {
      setSendingResetTo(null);
    }
  };

  const fetchContactQueries = useCallback(async () => {
    setContactQueriesLoading(true);
    try {
      let query = supabase
        .from("contact_queries")
        .select("id, name, email, phone, message, source_page, status, created_at, submitted_by_user_id")
        .order("created_at", { ascending: false })
        .limit(200);

      if (contactStatusFilter !== "all") {
        query = query.eq("status", contactStatusFilter);
      }

      if (contactSearch.trim()) {
        const escapedSearch = contactSearch.trim().replace(/,/g, " ");
        query = query.or(`name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%,message.ilike.%${escapedSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setContactQueries((data || []) as ContactQueryRow[]);
    } catch (error: unknown) {
      toast({
        title: "Error loading contact queries",
        description: getErrorMessage(error) || "Unable to load contact queries right now.",
        variant: "destructive",
      });
    } finally {
      setContactQueriesLoading(false);
    }
  }, [contactSearch, contactStatusFilter, toast]);

  const updateContactQueryStatus = async (id: string, status: "new" | "reviewed" | "resolved") => {
    setUpdatingContactId(id);
    try {
      const { error } = await supabase
        .from("contact_queries")
        .update({ status })
        .eq("id", id);
      if (error) throw error;

      setContactQueries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } catch (error: unknown) {
      toast({
        title: "Could not update status",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setUpdatingContactId(null);
    }
  };

  const handleCompanyBillingAction = async (action: "charge_card" | "add_free_credits" | "remove_credits") => {
    const selectedId = billingCompanyId || selectedCompanyId;
    const amountUsd = Number(billingAmountUsd);
    const amountCents = Math.round(amountUsd * 100);

    if (!selectedId) {
      toast({
        title: "Select a company",
        description: "Please select a company before running a billing action.",
        variant: "destructive",
      });
      return;
    }

    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a positive dollar amount.",
        variant: "destructive",
      });
      return;
    }

    setBillingLoadingAction(action);
    try {
      const { data, error } = await supabase.functions.invoke("rcf-company-billing-admin", {
        body: {
          company_id: selectedId,
          action,
          amount_cents: amountCents,
          description: billingDescription.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: action === "charge_card" ? "Card charged + credits added" : action === "remove_credits" ? "Credits removed" : "Free credits added",
        description: `${formatUsdFromCents(amountCents)} ${action === "remove_credits" ? "removed from" : "applied to"} wallet successfully.`,
      });

      setBillingAmountUsd("");
      setBillingDescription("");
      await fetchCompanies();
    } catch (error: unknown) {
      toast({
        title: action === "charge_card" ? "Charge failed" : action === "remove_credits" ? "Credit removal failed" : "Credit update failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setBillingLoadingAction(null);
    }
  };

  const toggleHiring = async (companyId: string, companyName: string, action: 'enable' | 'cancel_subscription' | 'remove_access') => {
    setTogglingHiringFor(companyId);
    try {
      const { data, error } = await supabase.functions.invoke("super-admin-toggle-hiring", {
        body: {
          companyId,
          action,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Hiring Platform Updated",
        description: data?.message || "Hiring platform updated successfully",
      });

      await fetchCompanies();
    } catch (error: unknown) {
      toast({
        title: "Failed to update hiring",
        description: getErrorMessage(error) || "Could not update hiring platform access.",
        variant: "destructive",
      });
    } finally {
      setTogglingHiringFor(null);
    }
  };

  const handleSetTrial = async () => {
    const selectedId = trialCompanyId || selectedCompanyId;
    const limit = Number(trialUserLimit || "10");

    if (!selectedId) {
      toast({
        title: "Select a company",
        description: "Choose a company before setting a trial period.",
        variant: "destructive",
      });
      return;
    }

    if (!trialEndsAt) {
      toast({
        title: "Trial end date required",
        description: "Set a valid trial end date/time.",
        variant: "destructive",
      });
      return;
    }

    if (!Number.isFinite(limit) || limit < 1) {
      toast({
        title: "Invalid trial user limit",
        description: "Trial user limit must be at least 1.",
        variant: "destructive",
      });
      return;
    }

    setTrialLoadingAction(true);
    try {
      const { data, error } = await supabase.functions.invoke("rcf-company-billing-admin", {
        body: {
          company_id: selectedId,
          action: "set_trial",
          trial_ends_at: new Date(trialEndsAt).toISOString(),
          trial_user_limit: Math.floor(limit),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Trial configured",
        description: `Trial active until ${new Date(data.trial_ends_at).toLocaleString()} with ${data.trial_user_limit} users.`,
      });

      await fetchCompanies();
    } catch (error: unknown) {
      toast({
        title: "Failed to set trial",
        description: await getEdgeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setTrialLoadingAction(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!createCompanyName.trim()) {
      toast({
        title: "Company name required",
        description: "Enter a company name.",
        variant: "destructive",
      });
      return;
    }

    if (!createCompanySubdomain.trim()) {
      toast({
        title: "Subdomain required",
        description: "Enter a subdomain for this company.",
        variant: "destructive",
      });
      return;
    }

    if (!createCompanyAdminUserId) {
      toast({
        title: "Admin user required",
        description: "Select an RCF user to assign as admin.",
        variant: "destructive",
      });
      return;
    }

    setCreateCompanyLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("rcf-company-billing-admin", {
        body: {
          action: "create_company",
          company_name: createCompanyName.trim(),
          subdomain: createCompanySubdomain.trim(),
          admin_user_id: createCompanyAdminUserId,
          waive_deployment_fee: createCompanyWaiveDeploymentFee,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Company created",
        description: `${data?.company?.name || createCompanyName.trim()} was created and admin assigned.`,
      });

      setCreateCompanyName("");
      setCreateCompanySubdomain("");
      setCreateCompanyAdminUserId("");
      setCreateCompanyWaiveDeploymentFee(false);
      await Promise.all([fetchCompanies(), fetchPlatformUsers()]);
    } catch (error: unknown) {
      toast({
        title: "Failed to create company",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setCreateCompanyLoading(false);
    }
  };

  const handleAssignAdmin = async () => {
    const targetCompanyId = assignAdminCompanyId || selectedCompanyId;
    if (!targetCompanyId) {
      toast({
        title: "Select a company",
        description: "Choose a company to assign an admin.",
        variant: "destructive",
      });
      return;
    }

    if (!assignAdminUserId) {
      toast({
        title: "Select a user",
        description: "Choose an RCF user to promote to admin.",
        variant: "destructive",
      });
      return;
    }

    setAssignAdminLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("rcf-company-billing-admin", {
        body: {
          action: "assign_admin",
          company_id: targetCompanyId,
          admin_user_id: assignAdminUserId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Admin assigned",
        description: `${data?.admin_email || "Selected user"} now has admin access.`,
      });

      setAssignAdminUserId("");
      await Promise.all([
        fetchCompanies(),
        fetchCompanyUsers(targetCompanyId),
        fetchPlatformUsers(),
      ]);
    } catch (error: unknown) {
      toast({
        title: "Failed to assign admin",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setAssignAdminLoading(false);
    }
  };

  const handleSetDeploymentFeeWaiver = async () => {
    const selectedId = deploymentFeeCompanyId || selectedCompanyId;

    if (!selectedId) {
      toast({
        title: "Select a company",
        description: "Choose a company before updating deployment fee waiver.",
        variant: "destructive",
      });
      return;
    }

    setDeploymentFeeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("rcf-company-billing-admin", {
        body: {
          action: "set_deployment_fee_waived",
          company_id: selectedId,
          deployment_fee_waived: deploymentFeeWaived,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: deploymentFeeWaived ? "Deployment fee waived" : "Deployment fee restored",
        description: deploymentFeeWaived
          ? "This company will not be charged the $5,000 deployment fee."
          : "This company will be charged the $5,000 deployment fee after payment setup.",
      });

      await fetchCompanies();
    } catch (error: unknown) {
      toast({
        title: "Failed to update deployment fee",
        description: await getEdgeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setDeploymentFeeLoading(false);
    }
  };

  useEffect(() => {
    if (accessChecked && isAllowed) {
      fetchCompanies();
      fetchPlatformUsers();
      fetchSuperAdminCandidates();
    }
  }, [accessChecked, fetchCompanies, fetchPlatformUsers, fetchSuperAdminCandidates, isAllowed]);

  useEffect(() => {
    fetchCompanyUsers(selectedCompanyId);
  }, [fetchCompanyUsers, selectedCompanyId]);

  useEffect(() => {
    if (!accessChecked || !isAllowed) return;
    const timeoutId = setTimeout(() => {
      fetchPlatformUsers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [accessChecked, fetchPlatformUsers, isAllowed, platformFilter, platformSearch]);

  useEffect(() => {
    if (!accessChecked || !isAllowed || activeTab !== "contact-queries") return;
    const timeoutId = setTimeout(() => {
      fetchContactQueries();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [accessChecked, activeTab, contactSearch, contactStatusFilter, fetchContactQueries, isAllowed]);

  if (loading || !accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!isAllowed) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="relative border-b border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,1)_0%,rgba(255,255,255,1)_55%,rgba(241,245,249,0.95)_100%)] px-6 py-8 sm:px-8">
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <Badge className="w-fit rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700 hover:bg-slate-100">
                  Business Platform Admin
                </Badge>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    Super admin workspace for B2B operations.
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Manage companies, access, billing rules, and support workflows in a layout that matches the main Business Platform.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant="outline" className="rounded-full border-slate-300 bg-white text-slate-700">
                      Now viewing: {currentTabMeta.label}
                    </Badge>
                    <span className="text-sm text-slate-500">{currentTabMeta.description}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-slate-200 bg-white/80"
                  onClick={() => navigate("/admin/proposals")}
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Proposals
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-200 bg-white/80"
                  onClick={() => navigate("/dashboard")}
                >
                  Back 2 Dashboard
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 xl:grid-cols-4 sm:px-8">
            <Card className="border-slate-200 bg-slate-50 shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Companies</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">{companyStats.totalCompanies}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-slate-50 shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Active Trials</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">{companyStats.trialCount}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-slate-50 shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Hiring Enabled</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">{companyStats.hiringEnabledCount}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                    <Shield className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-slate-50 shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Deployment Pending</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">{companyStats.deploymentPendingCount}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid h-auto grid-cols-1 gap-3 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-2 xl:grid-cols-5">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const isLink = "href" in tab;

              if (isLink) {
                return (
                  <Button
                    key={tab.value}
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(tab.href)}
                    className="h-auto rounded-2xl border border-transparent px-4 py-4 text-left justify-start hover:bg-slate-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-xs text-slate-500">{tab.description}</div>
                      </div>
                    </div>
                  </Button>
                );
              }

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="h-auto rounded-2xl border border-transparent px-4 py-4 text-left data-[state=active]:border-slate-300 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-950"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-slate-500">{tab.description}</div>
                    </div>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="companies">
            <div className="space-y-6">
              <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle>Primary Company Context</CardTitle>
                  <CardDescription>
                    Pick one company here to prefill the Operations Desk and Company Users areas, so you do not need to keep selecting the same workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <SearchableSelect
                      value={selectedCompanyId}
                      onChange={applyCompanyContext}
                      options={companyOptions}
                      placeholder="Choose a company once"
                      searchPlaceholder="Search companies..."
                      emptyText="No companies found."
                    />
                    <Button
                      variant="outline"
                      onClick={() => selectedCompanyId && setActiveTab("company-users")}
                      disabled={!selectedCompanyId}
                    >
                      View Users
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => selectedCompanyId && applyCompanyContext(selectedCompanyId)}
                      disabled={!selectedCompanyId}
                    >
                      Use Across Actions
                    </Button>
                  </div>
                  {selectedCompany ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{selectedCompany.name}</p>
                          <p className="text-sm text-slate-500">{selectedCompany.subdomain}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">{selectedCompany.memberCount} members</Badge>
                          <Badge variant="outline">{selectedCompany.ownerCount} owners</Badge>
                          <Badge variant="outline">{selectedCompany.adminLevelCount} admin-level</Badge>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle>Operations Desk</CardTitle>
                  <CardDescription>
                    Run billing, trial, onboarding, and access updates from a single panel. Open only the task you need so the page stays easy to scan.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible defaultValue="billing" className="w-full">
                    <AccordionItem value="billing" className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4">
                      <AccordionTrigger className="py-4 text-left hover:no-underline">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-white p-2 text-slate-700">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Billing Actions</div>
                            <div className="text-xs text-slate-500">Add credits, charge a card, or remove wallet balance.</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid gap-3">
                      <SearchableSelect
                        value={billingCompanyId}
                        onChange={setBillingCompanyId}
                        options={companyOptions}
                        placeholder="Select company"
                        searchPlaceholder="Search companies..."
                        emptyText="No companies found."
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount in USD"
                        value={billingAmountUsd}
                        onChange={(event) => setBillingAmountUsd(event.target.value)}
                      />
                      <Input
                        placeholder="Optional description"
                        value={billingDescription}
                        onChange={(event) => setBillingDescription(event.target.value)}
                      />
                      <Select
                        value={selectedBillingAction}
                        onValueChange={(v) => setSelectedBillingAction(v as typeof selectedBillingAction)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="add_free_credits">Add Free Credits</SelectItem>
                          <SelectItem value="charge_card">Charge Card</SelectItem>
                          <SelectItem value="remove_credits">Remove Credits</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant={selectedBillingAction === "remove_credits" ? "destructive" : "default"}
                        disabled={billingLoadingAction !== null}
                        onClick={() => setPendingBillingAction(selectedBillingAction)}
                      >
                        {billingLoadingAction !== null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Execute
                      </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="trial" className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4">
                      <AccordionTrigger className="py-4 text-left hover:no-underline">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-white p-2 text-slate-700">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Trial Configuration</div>
                            <div className="text-xs text-slate-500">Set a trial deadline and user cap for a company.</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid gap-3">
                      <SearchableSelect
                        value={trialCompanyId}
                        onChange={setTrialCompanyId}
                        options={companyOptions}
                        placeholder="Trial company"
                        searchPlaceholder="Search companies..."
                        emptyText="No companies found."
                      />
                      <Input
                        type="datetime-local"
                        value={trialEndsAt}
                        onChange={(event) => setTrialEndsAt(event.target.value)}
                      />
                      <Input
                        type="number"
                        min="1"
                        placeholder="Trial user limit"
                        value={trialUserLimit}
                        onChange={(event) => setTrialUserLimit(event.target.value)}
                      />
                      <Button variant="secondary" disabled={trialLoadingAction} onClick={handleSetTrial} className="w-full">
                        {trialLoadingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Set Trial (Custom)
                      </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="create-company" className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4">
                      <AccordionTrigger className="py-4 text-left hover:no-underline">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-white p-2 text-slate-700">
                            <Globe2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Create Company</div>
                            <div className="text-xs text-slate-500">Create a new business workspace and assign its first admin.</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid gap-3">
                      <Input
                        placeholder="New company name"
                        value={createCompanyName}
                        onChange={(event) => setCreateCompanyName(event.target.value)}
                      />
                      <Input
                        placeholder="Subdomain (e.g. acme-team)"
                        value={createCompanySubdomain}
                        onChange={(event) => setCreateCompanySubdomain(event.target.value)}
                      />
                      <SearchableSelect
                        value={createCompanyAdminUserId}
                        onChange={setCreateCompanyAdminUserId}
                        options={platformUserOptions}
                        placeholder="Select admin user"
                        searchPlaceholder="Search users..."
                        emptyText="No users found."
                      />
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                        <Switch
                          checked={createCompanyWaiveDeploymentFee}
                          onCheckedChange={setCreateCompanyWaiveDeploymentFee}
                        />
                        <span className="text-sm text-slate-700">Waive one-time $5,000 deployment fee</span>
                      </div>
                      <Button disabled={createCompanyLoading} onClick={handleCreateCompany} className="w-full">
                        {createCompanyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create Business
                      </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="assign-admin" className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4">
                      <AccordionTrigger className="py-4 text-left hover:no-underline">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-white p-2 text-slate-700">
                            <UserCog className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Assign Company Admin</div>
                            <div className="text-xs text-slate-500">Promote an existing platform user into a company admin role.</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid gap-3">
                      <SearchableSelect
                        value={assignAdminCompanyId}
                        onChange={setAssignAdminCompanyId}
                        options={companyOptions}
                        placeholder="Company for admin assignment"
                        searchPlaceholder="Search companies..."
                        emptyText="No companies found."
                      />
                      <SearchableSelect
                        value={assignAdminUserId}
                        onChange={setAssignAdminUserId}
                        options={platformUserOptions}
                        placeholder="Select RCF user to make admin"
                        searchPlaceholder="Search users..."
                        emptyText="No users found."
                      />
                      <Button variant="secondary" disabled={assignAdminLoading} onClick={handleAssignAdmin} className="w-full">
                        {assignAdminLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Assign Selected User as Company Admin
                      </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="deployment-fee" className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4">
                      <AccordionTrigger className="py-4 text-left hover:no-underline">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-white p-2 text-slate-700">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Deployment Fee Rule</div>
                            <div className="text-xs text-slate-500">Waive or restore the one-time deployment fee for a company.</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid gap-3">
                      <SearchableSelect
                        value={deploymentFeeCompanyId}
                        onChange={setDeploymentFeeCompanyId}
                        options={companyOptions}
                        placeholder="Company for deployment fee"
                        searchPlaceholder="Search companies..."
                        emptyText="No companies found."
                      />
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                        <Switch checked={deploymentFeeWaived} onCheckedChange={setDeploymentFeeWaived} />
                        <span className="text-sm text-slate-700">Waive $5,000 deployment fee</span>
                      </div>
                      <Button
                        variant="secondary"
                        disabled={deploymentFeeLoading}
                        onClick={handleSetDeploymentFeeWaiver}
                        className="w-full"
                      >
                        {deploymentFeeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Deployment Fee Rule
                      </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Company Portfolio</CardTitle>
                    <CardDescription>Search by workspace name or subdomain, then jump into statements and user access.</CardDescription>
                  </div>
                  <div className="flex w-full flex-col gap-3 sm:max-w-sm">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        className="border-slate-200 bg-white pl-9"
                        placeholder="Search companies or subdomains"
                        value={companySearch}
                        onChange={(event) => setCompanySearch(event.target.value)}
                      />
                    </div>
                    <Button variant="outline" onClick={fetchCompanies} disabled={companiesLoading} className="border-slate-200">
                      {companiesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      <span className="ml-2">Refresh companies</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Visible companies</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">{filteredCompanies.length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Hiring enabled</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">{companyStats.hiringEnabledCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Trial workspaces</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">{companyStats.trialCount}</p>
                    </div>
                  </div>
                  {companiesLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading companies...</div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Company</TableHead>
                              <TableHead>Subdomain</TableHead>
                              <TableHead>Members</TableHead>
                              <TableHead>Owners</TableHead>
                              <TableHead>Admin-Level</TableHead>
                              <TableHead>Credits</TableHead>
                              <TableHead>Trial</TableHead>
                              <TableHead>Deployment Fee</TableHead>
                              <TableHead>Hiring Platform</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCompanies.map((company) => (
                              <TableRow key={company.id}>
                                <TableCell className="font-medium">{company.name}</TableCell>
                                <TableCell>{company.subdomain}</TableCell>
                                <TableCell>{company.memberCount}</TableCell>
                                <TableCell>{company.ownerCount}</TableCell>
                                <TableCell>{company.adminLevelCount}</TableCell>
                                <TableCell>{formatUsd(company.credit_balance)}</TableCell>
                                <TableCell>
                                  {company.b2b_trial_enabled ? (
                                    <div className="space-y-1">
                                      <Badge className="bg-blue-600 text-white">Active</Badge>
                                      <p className="text-xs text-muted-foreground">Ends {formatShortDate(company.b2b_trial_ends_at)}</p>
                                      <p className="text-xs text-muted-foreground">Limit {company.b2b_trial_user_limit} users</p>
                                    </div>
                                  ) : company.b2b_trial_converted_at ? (
                                    <div className="space-y-1">
                                      <Badge variant="outline">Converted</Badge>
                                      <p className="text-xs text-muted-foreground">{formatShortDate(company.b2b_trial_converted_at)}</p>
                                    </div>
                                  ) : (
                                    <Badge variant="outline">None</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {company.deployment_fee_charged_at ? (
                                    <div className="space-y-1">
                                      <Badge className="bg-emerald-600 text-white">Charged</Badge>
                                      <p className="text-xs text-muted-foreground">{formatShortDate(company.deployment_fee_charged_at)}</p>
                                    </div>
                                  ) : company.deployment_fee_waived ? (
                                    <Badge variant="outline">Waived</Badge>
                                  ) : company.requires_post_setup_deployment_fee ? (
                                    <Badge className="bg-amber-600 text-white">Pending $5,000</Badge>
                                  ) : (
                                    <Badge variant="outline">Not required</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {company.hiring_subscription_enabled ? (
                                      <>
                                        <Badge
                                          variant={
                                            company.hiring_subscription_cancel_at_period_end
                                              ? "outline"
                                              : company.hiring_subscription_status === "active"
                                                ? "default"
                                                : "secondary"
                                          }
                                          className="text-xs"
                                        >
                                          {company.hiring_subscription_cancel_at_period_end
                                            ? "cancelling"
                                            : company.hiring_subscription_status || "active"}
                                        </Badge>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7"
                                              disabled={togglingHiringFor === company.id}
                                            >
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {company.hiring_subscription_cancel_at_period_end ? (
                                              <>
                                                <DropdownMenuItem
                                                  onClick={() =>
                                                    setPendingHiringToggle({
                                                      companyId: company.id,
                                                      companyName: company.name,
                                                      action: "enable",
                                                    })
                                                  }
                                                >
                                                  <RefreshCw className="mr-2 h-4 w-4" />
                                                  Renew Subscription
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                  onClick={() =>
                                                    setPendingHiringToggle({
                                                      companyId: company.id,
                                                      companyName: company.name,
                                                      action: "remove_access",
                                                    })
                                                  }
                                                  className="text-destructive focus:text-destructive"
                                                >
                                                  <XCircle className="mr-2 h-4 w-4" />
                                                  Revoke Access Now
                                                </DropdownMenuItem>
                                              </>
                                            ) : (
                                              <>
                                                <DropdownMenuItem
                                                  onClick={() =>
                                                    setPendingHiringToggle({
                                                      companyId: company.id,
                                                      companyName: company.name,
                                                      action: "cancel_subscription",
                                                    })
                                                  }
                                                >
                                                  <Calendar className="mr-2 h-4 w-4" />
                                                  Cancel at Period End
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                  onClick={() =>
                                                    setPendingHiringToggle({
                                                      companyId: company.id,
                                                      companyName: company.name,
                                                      action: "remove_access",
                                                    })
                                                  }
                                                  className="text-destructive focus:text-destructive"
                                                >
                                                  <XCircle className="mr-2 h-4 w-4" />
                                                  Remove Access Now
                                                </DropdownMenuItem>
                                              </>
                                            )}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          setPendingHiringToggle({
                                            companyId: company.id,
                                            companyName: company.name,
                                            action: "enable",
                                          })
                                        }
                                        disabled={togglingHiringFor === company.id}
                                      >
                                        <Shield className="mr-1 h-3.5 w-3.5" />
                                        Grant Access
                                      </Button>
                                    )}
                                    {togglingHiringFor === company.id && <Loader2 className="h-3 w-3 animate-spin" />}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setStatementModalCompany({
                                          id: company.id,
                                          name: company.name,
                                          initialView: "statement",
                                        })
                                      }
                                      className="gap-1"
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                      View Statement
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        applyCompanyContext(company.id);
                                        setActiveTab("company-users");
                                      }}
                                    >
                                      View Users
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                            {filteredCompanies.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                                  No companies matched this search.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="company-users">
            <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
              <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle>Select Company</CardTitle>
                  <CardDescription>Pick a workspace to inspect its user list and role distribution.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SearchableSelect
                    value={selectedCompanyId}
                    onChange={applyCompanyContext}
                    options={companyOptions}
                    placeholder="Choose a company to view its users"
                    searchPlaceholder="Search companies..."
                    emptyText="No companies found."
                  />
                  {selectedCompany ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{selectedCompany.name}</p>
                          <p className="text-sm text-slate-500">{selectedCompany.subdomain}</p>
                        </div>
                        <Badge variant="outline" className="rounded-full">
                          {selectedCompany.memberCount} members
                        </Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Owners</p>
                          <p className="mt-1 text-xl font-semibold text-slate-950">{selectedCompany.ownerCount}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Admin-level</p>
                          <p className="mt-1 text-xl font-semibold text-slate-950">{selectedCompany.adminLevelCount}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                      Select a company to load its users and related details.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{selectedCompany ? `${selectedCompany.name} Users` : "Company Users"}</CardTitle>
                  {selectedCompanyId && (
                    <Button
                      variant="outline"
                      onClick={() => fetchCompanyUsers(selectedCompanyId)}
                      disabled={companyUsersLoading}
                    >
                      {companyUsersLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {!selectedCompanyId ? (
                    <div className="py-8 text-center text-muted-foreground">Select a company to view users.</div>
                  ) : companyUsersLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading users...</div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Job Role</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {companyUsers.map((member) => (
                              <TableRow key={member.id}>
                                <TableCell>{member.full_name || "—"}</TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{member.role}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={member.status === "active" ? "default" : "secondary"}>
                                    {member.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{member.job_role || "—"}</TableCell>
                              </TableRow>
                            ))}
                            {companyUsers.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                  No users found for this company.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="platform-users">
            <div className="grid gap-6">
              <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Super Admin Access</CardTitle>
                    <CardDescription>
                      Add more people who should have access to this dashboard and the protected super-admin actions behind it.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchSuperAdminCandidates} disabled={superAdminCandidatesLoading}>
                      {superAdminCandidatesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" onClick={fetchSuperAdmins} disabled={superAdminsLoading}>
                      {superAdminsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{availableSuperAdminOptions.length} eligible users ready to add</span>
                    <span className="text-slate-300">•</span>
                    <span>{superAdmins.length} current super admins</span>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <SearchableSelect
                      value={selectedSuperAdminUserId}
                      onChange={setSelectedSuperAdminUserId}
                      options={availableSuperAdminOptions}
                      placeholder="Select a platform user to make super admin"
                      searchPlaceholder="Search users..."
                      emptyText="No eligible users found."
                    />
                    <Button onClick={handleAddSuperAdmin} disabled={addingSuperAdmin || superAdminCandidatesLoading || availableSuperAdminOptions.length === 0}>
                      {addingSuperAdmin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                      Add Super Admin
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {superAdmins.map((admin) => (
                      <div key={admin.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">{admin.full_name || admin.email}</p>
                            <p className="text-sm text-slate-500">{admin.email}</p>
                          </div>
                          <Badge variant="outline" className="rounded-full">Super Admin</Badge>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                          Added {formatShortDate(admin.created_at)}
                          {admin.added_by_email ? ` by ${admin.added_by_email}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Loaded users</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{platformStats.total}</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Owners</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{platformStats.ownerCount}</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Admin-level</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{platformStats.adminLevelCount}</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Non-B2B</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{platformStats.nonB2BCount}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle>Platform User Filters</CardTitle>
                  <CardDescription>Search the platform user base, narrow to access tiers, and send password resets.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search by email"
                        value={platformSearch}
                        onChange={(event) => setPlatformSearch(event.target.value)}
                      />
                    </div>
                    <Select
                      value={platformFilter}
                      onValueChange={(value) => setPlatformFilter(value as "all" | "owners" | "admin_level" | "non_b2b")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All users</SelectItem>
                        <SelectItem value="owners">B2B owners only</SelectItem>
                        <SelectItem value="admin_level">B2B admin-level only</SelectItem>
                        <SelectItem value="non_b2b">Non-B2B users only</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={fetchPlatformUsers} disabled={platformUsersLoading}>
                      {platformUsersLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle>All Platform Users</CardTitle>
                </CardHeader>
                <CardContent>
                  {platformUsersLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading platform users...</div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Email</TableHead>
                              <TableHead>B2B Flags</TableHead>
                              <TableHead>Company Count</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {platformUsers.map((platformUser) => (
                              <TableRow key={platformUser.id}>
                                <TableCell>{platformUser.email}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-2">
                                    {platformUser.is_b2b_owner && <Badge>B2B Owner</Badge>}
                                    {platformUser.is_b2b_admin_level && <Badge variant="secondary">Admin-Level</Badge>}
                                    {!platformUser.is_b2b_admin_level && <Badge variant="outline">No B2B Admin Access</Badge>}
                                  </div>
                                </TableCell>
                                <TableCell>{platformUser.b2b_company_count}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!platformUser.email || sendingResetTo === platformUser.email}
                                    onClick={() => handleSendPasswordReset(platformUser.email)}
                                  >
                                    {sendingResetTo === platformUser.email ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Mail className="mr-2 h-4 w-4" />
                                    )}
                                    Send Reset
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {platformUsers.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                                  No platform users matched this filter.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contact-queries">
            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Visible queries</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{contactStats.total}</p>
                  </CardContent>
                </Card>
                <Card className="border-rose-100 bg-rose-50/80 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-rose-700">New</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{contactStats.newCount}</p>
                  </CardContent>
                </Card>
                <Card className="border-amber-100 bg-amber-50/80 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-700">Reviewed</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{contactStats.reviewedCount}</p>
                  </CardContent>
                </Card>
                <Card className="border-emerald-100 bg-emerald-50/80 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">Resolved</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{contactStats.resolvedCount}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle>Contact Queue Filters</CardTitle>
                  <CardDescription>Search recent inbound messages and keep the status queue tidy.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search name, email, or message"
                        value={contactSearch}
                        onChange={(event) => setContactSearch(event.target.value)}
                      />
                    </div>
                    <Select
                      value={contactStatusFilter}
                      onValueChange={(value) => setContactStatusFilter(value as typeof contactStatusFilter)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={fetchContactQueries} disabled={contactQueriesLoading}>
                      {contactQueriesLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle>Contact Form Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {contactQueriesLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading contact queries...</div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Submitted</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Message</TableHead>
                              <TableHead>Source</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contactQueries.map((query) => (
                              <TableRow key={query.id}>
                                <TableCell>{new Date(query.created_at).toLocaleString()}</TableCell>
                                <TableCell>{query.name}</TableCell>
                                <TableCell>{query.email}</TableCell>
                                <TableCell>{query.phone || "-"}</TableCell>
                                <TableCell className="max-w-sm whitespace-normal break-words">{query.message}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{query.source_page}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      query.status === "new"
                                        ? "destructive"
                                        : query.status === "reviewed"
                                          ? "secondary"
                                          : "default"
                                    }
                                  >
                                    {query.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={query.status}
                                    onValueChange={(value) =>
                                      updateContactQueryStatus(query.id, value as "new" | "reviewed" | "resolved")
                                    }
                                    disabled={updatingContactId === query.id}
                                  >
                                    <SelectTrigger className="w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="new">New</SelectItem>
                                      <SelectItem value="reviewed">Reviewed</SelectItem>
                                      <SelectItem value="resolved">Resolved</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            ))}
                            {contactQueries.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                  No contact queries yet.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <AdminCompanyStatementModal
          companyId={statementModalCompany?.id ?? ""}
          companyName={statementModalCompany?.name ?? ""}
          initialView={statementModalCompany?.initialView ?? 'statement'}
          open={!!statementModalCompany}
          onClose={() => setStatementModalCompany(null)}
        />

        <AlertDialog
          open={pendingBillingAction !== null}
          onOpenChange={(open) => {
            if (!open && !billingLoadingAction) setPendingBillingAction(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {pendingBillingAction === "charge_card" ? "Confirm Card Charge" : pendingBillingAction === "remove_credits" ? "Confirm Credit Removal" : "Confirm Free Credit Addition"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                You are about to{" "}
                <span className="font-medium">
                  {pendingBillingAction === "charge_card" ? "charge the card on file and add credits" : pendingBillingAction === "remove_credits" ? "remove credits from the wallet" : "add free credits"}
                </span>{" "}
                for{" "}
                <span className="font-medium">
                  {(companies.find((company) => company.id === (billingCompanyId || selectedCompanyId))?.name) || "selected company"}
                </span>
                .
                <br />
                <br />
                Amount:{" "}
                <span className="font-medium">
                  {formatUsdFromCents(Math.round(Number(billingAmountUsd || 0) * 100))}
                </span>
                {billingDescription.trim() ? (
                  <>
                    <br />
                    Description: <span className="font-medium">{billingDescription.trim()}</span>
                  </>
                ) : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={billingLoadingAction !== null}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={pendingBillingAction === null || billingLoadingAction !== null}
                onClick={async () => {
                  if (!pendingBillingAction) return;
                  await handleCompanyBillingAction(pendingBillingAction);
                  setPendingBillingAction(null);
                }}
              >
                {billingLoadingAction !== null ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : pendingBillingAction === "charge_card" ? (
                  "Confirm Charge"
                ) : pendingBillingAction === "remove_credits" ? (
                  "Confirm Remove Credits"
                ) : (
                  "Confirm Add Credits"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={pendingHiringToggle !== null}
          onOpenChange={(open) => {
            if (!open && !togglingHiringFor) setPendingHiringToggle(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {pendingHiringToggle?.action === 'enable' && "Grant Hiring Platform Access"}
                {pendingHiringToggle?.action === 'cancel_subscription' && "Cancel Subscription"}
                {pendingHiringToggle?.action === 'remove_access' && "Remove Access Immediately"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                <span className="font-semibold">{pendingHiringToggle?.companyName}</span>
                <br />
                <br />
                {pendingHiringToggle?.action === 'enable' && (
                  <span>
                    This will grant access to the Hiring Platform and all ATS features for this company.
                  </span>
                )}
                {pendingHiringToggle?.action === 'cancel_subscription' && (
                  <span>
                    This will schedule the subscription to cancel at the end of the current billing period. The company will retain access until then.
                  </span>
                )}
                {pendingHiringToggle?.action === 'remove_access' && (
                  <span className="text-destructive">
                    This will immediately cancel their subscription and revoke access to all hiring features including job postings, applications, and the ATS pipeline.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={togglingHiringFor !== null}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={!pendingHiringToggle || togglingHiringFor !== null}
                onClick={async () => {
                  if (!pendingHiringToggle) return;
                  await toggleHiring(pendingHiringToggle.companyId, pendingHiringToggle.companyName, pendingHiringToggle.action);
                  setPendingHiringToggle(null);
                }}
                className={pendingHiringToggle?.action === 'remove_access' ? "bg-destructive hover:bg-destructive/90" : ""}
              >
                {togglingHiringFor !== null ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {pendingHiringToggle?.action === 'enable' && "Confirm Grant Access"}
                    {pendingHiringToggle?.action === 'cancel_subscription' && "Confirm Cancel"}
                    {pendingHiringToggle?.action === 'remove_access' && "Confirm Remove Access"}
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
