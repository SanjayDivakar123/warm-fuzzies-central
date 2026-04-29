import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, exportToJSON } from "@/lib/adminExport";
import { generateTempPassword, getPasswordStrength } from "@/lib/adminPasswords";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Archive,
  ArchiveRestore,
  Bell,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronsUpDown,
  ClipboardCopy,
  CreditCard,
  Eye,
  FileText,
  Globe2,
  Loader2,
  Mail,
  MessageSquareText,
  MoreVertical,
  Pencil,
  RefreshCw,
  Reply,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  UserPlus,
  Users,
  UserCog,
  XCircle,
} from "lucide-react";
import AdminCompanyStatementModal from "@/components/b2b/admin/AdminCompanyStatementModal";

interface CompanySummary {
  id: string;
  name: string;
  subdomain: string;
  admin_email?: string | null;
  created_at?: string | null;
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
  plan_tier?: string;
  archived_at?: string | null;
  require_2fa?: boolean;
  notes?: string;
}

interface CompanyUserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  job_role: string | null;
  invited_at?: string | null;
  joined_at?: string | null;
  invite_count?: number;
}

interface PlatformUserRow {
  id: string;
  email: string | null;
  full_name?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  is_b2b_owner: boolean;
  is_b2b_admin_level: boolean;
  b2b_company_count: number;
  b2b_companies?: string[];
}

interface UserSessionRow {
  id: string;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
  ip?: string | null;
  user_agent?: string | null;
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
  assigned_to?: string | null;
  reply_status?: string | null;
  replied_at?: string | null;
}

interface FreeAssessmentSubmissionRow {
  id: string;
  email: string;
  dominant_color: string;
  scores: {
    yellow?: number;
    red?: number;
    green?: number;
    blue?: number;
  } | null;
  result_payload: Record<string, unknown>;
  email_sent_at: string | null;
  email_error: string | null;
  created_at: string;
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

interface AdminActionLogRow {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  total_count?: number;
}

interface AnnouncementRow {
  id: string;
  title: string;
  body: string | null;
  audience: string;
  company_id: string | null;
  scheduled_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface PlatformErrorRow {
  id: string;
  message: string;
  context: Record<string, unknown>;
  severity: number;
  resolved_at: string | null;
  created_at: string;
}

interface IncidentRow {
  id: string;
  code: number;
  description: string;
  status: string;
  created_at: string;
}

interface SessionManagerResponse {
  sessions?: UserSessionRow[];
  success?: boolean;
  unavailable?: boolean;
  error?: string;
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

const formatScores = (scores: FreeAssessmentSubmissionRow["scores"]) =>
  scores
    ? `Y ${scores.yellow ?? 0} / R ${scores.red ?? 0} / G ${scores.green ?? 0} / B ${scores.blue ?? 0}`
    : "N/A";

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
  const [freeAssessmentSubmissions, setFreeAssessmentSubmissions] = useState<FreeAssessmentSubmissionRow[]>([]);
  const [freeAssessmentSubmissionsLoading, setFreeAssessmentSubmissionsLoading] = useState(false);
  const [freeAssessmentSearch, setFreeAssessmentSearch] = useState("");
  const [freeAssessmentColorFilter, setFreeAssessmentColorFilter] = useState<"all" | "yellow" | "red" | "green" | "blue">("all");
  const [selectedFreeAssessmentSubmission, setSelectedFreeAssessmentSubmission] = useState<FreeAssessmentSubmissionRow | null>(null);
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
  const [includeArchivedCompanies, setIncludeArchivedCompanies] = useState(false);
  const [companyEditOpen, setCompanyEditOpen] = useState(false);
  const [companyEditLoading, setCompanyEditLoading] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editCompanySubdomain, setEditCompanySubdomain] = useState("");
  const [editCompanyPlanTier, setEditCompanyPlanTier] = useState("free");
  const [companyNotesDraft, setCompanyNotesDraft] = useState("");
  const [companyNotesSaving, setCompanyNotesSaving] = useState(false);
  const [adminActionLogs, setAdminActionLogs] = useState<AdminActionLogRow[]>([]);
  const [adminActionLogsLoading, setAdminActionLogsLoading] = useState(false);
  const [adminActionTypeFilter, setAdminActionTypeFilter] = useState("all");
  const [adminActionActorFilter, setAdminActionActorFilter] = useState("all");
  const [adminActionDateFrom, setAdminActionDateFrom] = useState("");
  const [adminActionDateTo, setAdminActionDateTo] = useState("");
  const [adminActionPage, setAdminActionPage] = useState(1);
  const [adminActionTotalCount, setAdminActionTotalCount] = useState(0);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [announcementAudience, setAnnouncementAudience] = useState("all");
  const [announcementCompanyId, setAnnouncementCompanyId] = useState("");
  const [announcementScheduledAt, setAnnouncementScheduledAt] = useState("");
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [platformErrors, setPlatformErrors] = useState<PlatformErrorRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [platformHealthLoading, setPlatformHealthLoading] = useState(false);
  const [onCallEngineerEmail, setOnCallEngineerEmail] = useState("");
  const [incidentCode, setIncidentCode] = useState("1");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentSaving, setIncidentSaving] = useState(false);
  const [contactAssigneeFilter, setContactAssigneeFilter] = useState("all");
  const [replyingContactId, setReplyingContactId] = useState<string | null>(null);
  const [replyDraftById, setReplyDraftById] = useState<Record<string, string>>({});
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);
  const [impersonationTarget, setImpersonationTarget] = useState<{ email: string; link: string } | null>(null);
  const [impersonationLoadingFor, setImpersonationLoadingFor] = useState<string | null>(null);
  const [expandedPlatformUserId, setExpandedPlatformUserId] = useState<string | null>(null);
  const [userSessionsByUserId, setUserSessionsByUserId] = useState<Record<string, UserSessionRow[]>>({});
  const [sessionUnavailableByUserId, setSessionUnavailableByUserId] = useState<Record<string, boolean>>({});
  const [loadingSessionsFor, setLoadingSessionsFor] = useState<string | null>(null);
  const [signingOutSessionFor, setSigningOutSessionFor] = useState<string | null>(null);
  const [permissionAuditFilter, setPermissionAuditFilter] = useState<"all" | "super_admin" | "company_admin" | "owner">("all");
  const [revokingAccessId, setRevokingAccessId] = useState<string | null>(null);
  const [inviteActionUserId, setInviteActionUserId] = useState<string | null>(null);
  const [requireSuperAdmin2fa, setRequireSuperAdmin2fa] = useState(false);
  const [savingSuperAdmin2fa, setSavingSuperAdmin2fa] = useState(false);
  const [createUserFullName, setCreateUserFullName] = useState("");
  const [createUserEmail, setCreateUserEmail] = useState("");
  const [createUserCompanyId, setCreateUserCompanyId] = useState("");
  const [createUserCompanyRole, setCreateUserCompanyRole] = useState("employee");
  const [createUserRoleColor, setCreateUserRoleColor] = useState("");
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);
  const [manualPassword, setManualPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState(generateTempPassword());
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createdUserSummary, setCreatedUserSummary] = useState<Record<string, string | null> | null>(null);
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

  const assignableSuperAdmins = useMemo(
    () => superAdmins.filter((admin) => !!admin.user_id),
    [superAdmins],
  );

  const filteredCompanies = useMemo(() => {
    const query = companySearch.trim().toLowerCase();
    const visibleCompanies = includeArchivedCompanies
      ? companies
      : companies.filter((company) => !company.archived_at);

    if (!query) return visibleCompanies;

    return visibleCompanies.filter((company) => {
      const searchable = [
        company.name,
        company.subdomain,
        company.hiring_subscription_status || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [companies, companySearch, includeArchivedCompanies]);

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

  const freeAssessmentStats = useMemo(() => {
    const emailedCount = freeAssessmentSubmissions.filter((submission) => submission.email_sent_at).length;
    const failedEmailCount = freeAssessmentSubmissions.filter((submission) => submission.email_error).length;

    return {
      total: freeAssessmentSubmissions.length,
      emailedCount,
      failedEmailCount,
      uniqueEmails: new Set(freeAssessmentSubmissions.map((submission) => submission.email.toLowerCase())).size,
    };
  }, [freeAssessmentSubmissions]);

  const pendingInvites = useMemo(
    () => companyUsers.filter((member) => !!member.invited_at && !member.joined_at),
    [companyUsers],
  );

  const permissionAuditRows = useMemo(() => {
    const rows = [
      ...superAdmins.map((admin) => ({
        id: `super-${admin.id}`,
        email: admin.email,
        roleType: "super_admin" as const,
        company: "Platform",
        grantedAt: admin.created_at,
        grantedBy: admin.added_by_email || "—",
        userId: admin.user_id,
        companyId: null as string | null,
      })),
      ...platformUsers
        .filter((entry) => entry.is_b2b_admin_level)
        .map((entry) => ({
          id: `company-${entry.id}`,
          email: entry.email || "—",
          roleType: (entry.is_b2b_owner ? "owner" : "company_admin") as const,
          company: entry.b2b_companies?.join(", ") || "—",
          grantedAt: entry.created_at || "",
          grantedBy: "—",
          userId: entry.id,
          companyId: null as string | null,
        })),
    ];

    if (permissionAuditFilter === "all") return rows;
    return rows.filter((row) => row.roleType === permissionAuditFilter);
  }, [permissionAuditFilter, platformUsers, superAdmins]);

  const adminActorOptions = useMemo(
    () =>
      Array.from(new Set(adminActionLogs.map((item) => item.actor_email).filter(Boolean) as string[])).map((email) => ({
        value: email,
        label: email,
      })),
    [adminActionLogs],
  );

  const tabItems = useMemo(
    () => [
      { value: "companies", label: "Companies", description: "Billing, trials, access", icon: Building2 },
      { value: "company-users", label: "Company Users", description: "Inspect a workspace roster", icon: Users },
      { value: "platform-users", label: "Platform Users", description: "Reset access and filter users", icon: UserCog },
      { value: "contact-queries", label: "Contact Queries", description: "Triage inbound requests", icon: MessageSquareText },
      { value: "free-assessments", label: "Free Assessments", description: "Captured preview results", icon: Sparkles },
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

  const fetchAdminActionLogs = useCallback(async () => {
    setAdminActionLogsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_admin_action_logs", {
        p_action_type: adminActionTypeFilter === "all" ? null : adminActionTypeFilter,
        p_actor_email: adminActionActorFilter === "all" ? null : adminActionActorFilter,
        p_date_from: adminActionDateFrom || null,
        p_date_to: adminActionDateTo || null,
        p_page: adminActionPage,
        p_page_size: 25,
      });

      if (error) throw error;
      const rows = (data || []) as AdminActionLogRow[];
      setAdminActionLogs(rows);
      setAdminActionTotalCount(rows[0]?.total_count || 0);
    } catch (error: unknown) {
      toast({
        title: "Failed to load action logs",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setAdminActionLogsLoading(false);
    }
  }, [adminActionActorFilter, adminActionDateFrom, adminActionDateTo, adminActionPage, adminActionTypeFilter, toast]);

  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, body, audience, company_id, scheduled_at, is_active, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAnnouncements((data || []) as AnnouncementRow[]);
    } catch (error: unknown) {
      toast({
        title: "Failed to load announcements",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setAnnouncementsLoading(false);
    }
  }, [toast]);

  const fetchPlatformHealth = useCallback(async () => {
    setPlatformHealthLoading(true);
    try {
      const [{ data: errors, error: errorsError }, { data: incidentsData, error: incidentsError }, { data: settingsData, error: settingsError }] = await Promise.all([
        supabase.from("platform_errors").select("id, message, context, severity, resolved_at, created_at").order("created_at", { ascending: false }).limit(20),
        supabase.from("incidents").select("id, code, description, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("platform_settings").select("key, value"),
      ]);
      if (errorsError) throw errorsError;
      if (incidentsError) throw incidentsError;
      if (settingsError) throw settingsError;
      setPlatformErrors((errors || []) as PlatformErrorRow[]);
      setIncidents((incidentsData || []) as IncidentRow[]);
      const onCall = (settingsData || []).find((row) => row.key === "on_call_engineer");
      setOnCallEngineerEmail(typeof onCall?.value === "string" ? onCall.value : (onCall?.value as { email?: string } | null)?.email || "");
      const superAdmin2fa = (settingsData || []).find((row) => row.key === "require_2fa_super_admins");
      setRequireSuperAdmin2fa(Boolean(typeof superAdmin2fa?.value === "boolean" ? superAdmin2fa.value : (superAdmin2fa?.value as { enabled?: boolean } | null)?.enabled));
    } catch (error: unknown) {
      toast({
        title: "Failed to load platform health",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setPlatformHealthLoading(false);
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
        .select("id, name, email, phone, message, source_page, status, created_at, submitted_by_user_id, assigned_to, reply_status, replied_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (contactStatusFilter !== "all") {
        query = query.eq("status", contactStatusFilter);
      }

      if (contactSearch.trim()) {
        const escapedSearch = contactSearch.trim().replace(/,/g, " ");
        query = query.or(`name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%,message.ilike.%${escapedSearch}%`);
      }

      if (contactAssigneeFilter !== "all") {
        query = query.eq("assigned_to", contactAssigneeFilter);
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
  }, [contactAssigneeFilter, contactSearch, contactStatusFilter, toast]);

  const fetchFreeAssessmentSubmissions = useCallback(async () => {
    setFreeAssessmentSubmissionsLoading(true);
    try {
      let query = supabase
        .from("free_assessment_submissions")
        .select("id, email, dominant_color, scores, result_payload, email_sent_at, email_error, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (freeAssessmentColorFilter !== "all") {
        query = query.eq("dominant_color", freeAssessmentColorFilter);
      }

      if (freeAssessmentSearch.trim()) {
        const escapedSearch = freeAssessmentSearch.trim().replace(/,/g, " ");
        query = query.ilike("email", `%${escapedSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFreeAssessmentSubmissions((data || []).map((submission) => ({
        ...submission,
        scores: submission.scores as FreeAssessmentSubmissionRow["scores"],
        result_payload: (submission.result_payload || {}) as Record<string, unknown>,
      })));
    } catch (error: unknown) {
      toast({
        title: "Error loading free assessments",
        description: getErrorMessage(error) || "Unable to load free assessment submissions right now.",
        variant: "destructive",
      });
    } finally {
      setFreeAssessmentSubmissionsLoading(false);
    }
  }, [freeAssessmentColorFilter, freeAssessmentSearch, toast]);

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

  const handleSaveCompanyEdits = async (archiveMode?: "archive" | "unarchive") => {
    if (!selectedCompany) return;
    setCompanyEditLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-company", {
        body: {
          company_id: selectedCompany.id,
          name: editCompanyName.trim(),
          subdomain: editCompanySubdomain.trim(),
          plan_tier: editCompanyPlanTier,
          archive: archiveMode === "archive",
          unarchive: archiveMode === "unarchive",
        },
      });
      if (error) throw error;
      toast({
        title: "Company updated",
        description: `${data?.company?.name || selectedCompany.name} was updated.`,
      });
      setCompanyEditOpen(false);
      await fetchCompanies();
    } catch (error: unknown) {
      toast({
        title: "Failed to update company",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setCompanyEditLoading(false);
    }
  };

  const saveCompanyNotes = useCallback(async () => {
    if (!selectedCompany) return;
    setCompanyNotesSaving(true);
    try {
      const { error } = await supabase.functions.invoke("update-company", {
        body: {
          company_id: selectedCompany.id,
          notes: companyNotesDraft,
        },
      });
      if (error) throw error;
    } catch (error) {
      toast({
        title: "Notes save failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setCompanyNotesSaving(false);
    }
  }, [companyNotesDraft, selectedCompany, toast]);

  const handleExport = (format: "csv" | "json", tab: string) => {
    const exportFn = format === "csv" ? exportToCSV : exportToJSON;
    if (tab === "companies") {
      exportFn(filteredCompanies.map((company) => ({
        name: company.name,
        subdomain: company.subdomain,
        plan: company.plan_tier || "free",
        trial_status: company.b2b_trial_enabled ? "trial" : "off",
        hiring_enabled: company.hiring_subscription_enabled,
        deployment_fee_status: company.deployment_fee_waived ? "waived" : company.deployment_fee_charged_at ? "charged" : "pending",
        member_count: company.memberCount,
        created_at: company.created_at || "",
      })), `companies-export.${format}`);
      return;
    }
    if (tab === "company-users") {
      exportFn(companyUsers.map((member) => ({
        name: member.full_name,
        email: member.email,
        role: member.role,
        status: member.status,
        job_role: member.job_role,
      })), `company-users-export.${format}`);
      return;
    }
    if (tab === "platform-users") {
      const superAdminSet = new Set(superAdmins.map((admin) => admin.email.toLowerCase()));
      exportFn(platformUsers.map((member) => ({
        name: member.full_name,
        email: member.email,
        is_super_admin: member.email ? superAdminSet.has(member.email.toLowerCase()) : false,
        created_at: member.created_at || "",
        last_sign_in: member.last_sign_in_at || "",
      })), `platform-users-export.${format}`);
      return;
    }
    if (tab === "contact-queries") {
      exportFn(contactQueries.map((query) => ({
        submitter: query.name,
        email: query.email,
        status: query.status,
        created_at: query.created_at,
        message_preview: query.message.slice(0, 140),
      })), `contact-queries-export.${format}`);
      return;
    }
    if (tab === "free-assessments") {
      exportFn(freeAssessmentSubmissions.map((submission) => ({
        submitted_at: submission.created_at,
        email: submission.email,
        dominant_color: submission.dominant_color,
        scores: formatScores(submission.scores),
        email_sent_at: submission.email_sent_at || "",
        email_error: submission.email_error || "",
        result_payload: submission.result_payload,
      })), `free-assessments-export.${format}`);
      return;
    }
    if (tab === "admin-action-logs") {
      exportFn(adminActionLogs.map((row) => ({
        created_at: row.created_at,
        actor_email: row.actor_email,
        action_type: row.action_type,
        target_type: row.target_type,
        target_label: row.target_label,
        metadata: JSON.stringify(row.metadata || {}),
      })), `admin-action-logs.${format}`);
    }
  };

  const handleSaveAnnouncement = async () => {
    setAnnouncementSaving(true);
    try {
      const { error } = await supabase.from("announcements").insert({
        title: announcementTitle,
        body: announcementBody,
        audience: announcementAudience,
        company_id: announcementAudience === "company" ? announcementCompanyId || null : null,
        scheduled_at: announcementScheduledAt || null,
        is_active: announcementActive,
        created_by: user?.id || null,
      });
      if (error) throw error;
      toast({ title: "Announcement created" });
      setAnnouncementTitle("");
      setAnnouncementBody("");
      setAnnouncementAudience("all");
      setAnnouncementCompanyId("");
      setAnnouncementScheduledAt("");
      setAnnouncementActive(true);
      await fetchAnnouncements();
    } catch (error) {
      toast({
        title: "Announcement failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const handleGenerateImpersonationLink = async (email: string) => {
    setImpersonationLoadingFor(email);
    try {
      const { data, error } = await supabase.functions.invoke("generate-impersonation-link", { body: { email } });
      if (error) throw error;
      setImpersonationTarget({ email, link: data.link });
    } catch (error) {
      toast({
        title: "Impersonation failed",
        description: await getEdgeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setImpersonationLoadingFor(null);
    }
  };

  const handleAssignContact = async (contactId: string, assignedTo: string) => {
    try {
      const { error } = await supabase
        .from("contact_queries")
        .update({ assigned_to: assignedTo || null })
        .eq("id", contactId);
      if (error) throw error;
      await fetchContactQueries();
    } catch (error) {
      toast({
        title: "Assignment failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleSendContactReply = async (contactId: string) => {
    const body = replyDraftById[contactId]?.trim();
    if (!body) return;
    setSendingReplyId(contactId);
    try {
      const { error } = await supabase.functions.invoke("send-contact-reply", {
        body: {
          contact_query_id: contactId,
          body,
        },
      });
      if (error) throw error;
      setReplyingContactId(null);
      await fetchContactQueries();
      toast({ title: "Reply recorded" });
    } catch (error) {
      toast({
        title: "Reply failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSendingReplyId(null);
    }
  };

  const handleSaveOnCall = async () => {
    try {
      const { error } = await supabase
        .from("platform_settings")
        .upsert({ key: "on_call_engineer", value: onCallEngineerEmail, updated_at: new Date().toISOString() });
      if (error) throw error;
      toast({ title: "On-call engineer updated" });
    } catch (error) {
      toast({
        title: "Update failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleSaveSuperAdmin2fa = async (checked: boolean) => {
    setRequireSuperAdmin2fa(checked);
    setSavingSuperAdmin2fa(true);
    try {
      const [{ error }, { error: logError }] = await Promise.all([
        supabase.from("platform_settings").upsert({
          key: "require_2fa_super_admins",
          value: checked,
          updated_at: new Date().toISOString(),
        }),
        supabase.rpc("log_admin_action", {
          p_action_type: "super_admin_2fa_toggle",
          p_target_type: "platform",
          p_target_id: null,
          p_target_label: "require_2fa_super_admins",
          p_metadata: { enabled: checked },
        }),
      ]);
      if (error) throw error;
      if (logError) throw logError;
      toast({ title: "Super admin 2FA updated" });
    } catch (error) {
      setRequireSuperAdmin2fa(!checked);
      toast({
        title: "2FA update failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSavingSuperAdmin2fa(false);
    }
  };

  const handleCreateIncident = async () => {
    setIncidentSaving(true);
    try {
      const { error } = await supabase.from("incidents").insert({
        code: Number(incidentCode),
        description: incidentDescription,
        status: "open",
        created_by: user?.id || null,
      });
      if (error) throw error;
      setIncidentCode("1");
      setIncidentDescription("");
      await fetchPlatformHealth();
      toast({ title: "Incident created" });
    } catch (error) {
      toast({
        title: "Incident failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIncidentSaving(false);
    }
  };

  const handleInviteAction = async (companyUserId: string, action: "resend" | "revoke") => {
    setInviteActionUserId(companyUserId);
    try {
      if (action === "resend") {
        const { data, error } = await supabase.functions.invoke("resend-invite", {
          body: { user_id: companyUserId },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      } else {
        const { error } = await supabase.from("company_users").update({ status: "revoked" }).eq("id", companyUserId);
        if (error) throw error;
        await supabase.rpc("log_admin_action", {
          p_action_type: "invite_revoke",
          p_target_type: "user",
          p_target_id: companyUserId,
          p_target_label: companyUserId,
          p_metadata: {},
        });
      }

      await fetchCompanyUsers(selectedCompanyId);
      toast({ title: action === "resend" ? "Invite resent" : "Invite revoked" });
    } catch (error) {
      toast({
        title: action === "resend" ? "Resend failed" : "Revoke failed",
        description: action === "resend" ? await getEdgeErrorMessage(error) : getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setInviteActionUserId(null);
    }
  };

  const handleTogglePlatformUserExpansion = async (userId: string) => {
    if (expandedPlatformUserId === userId) {
      setExpandedPlatformUserId(null);
      return;
    }

    setExpandedPlatformUserId(userId);
    if (userSessionsByUserId[userId]) return;

    setLoadingSessionsFor(userId);
    try {
      const { data, error } = await supabase.functions.invoke("manage-user-sessions", {
        body: { action: "list", user_id: userId },
      });
      if (error) throw error;
      const payload = (data || {}) as SessionManagerResponse;
      setUserSessionsByUserId((current) => ({ ...current, [userId]: payload.sessions || [] }));
      setSessionUnavailableByUserId((current) => ({ ...current, [userId]: !!payload.unavailable }));

      if (payload.unavailable) {
        toast({
          title: "Session access unavailable",
          description: "This environment cannot inspect auth sessions directly right now.",
        });
      }
    } catch (error) {
      setUserSessionsByUserId((current) => ({ ...current, [userId]: [] }));
      setSessionUnavailableByUserId((current) => ({ ...current, [userId]: true }));
      toast({
        title: "Session lookup failed",
        description: await getEdgeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoadingSessionsFor(null);
    }
  };

  const handleForceSignOut = async (userId: string, sessionId?: string) => {
    setSigningOutSessionFor(sessionId || userId);
    try {
      const { data, error } = await supabase.functions.invoke("manage-user-sessions", {
        body: {
          action: "force_sign_out",
          user_id: userId,
          session_id: sessionId || null,
        },
      });
      if (error) throw error;
      const signOutPayload = (data || {}) as SessionManagerResponse;
      if (signOutPayload.unavailable || signOutPayload.success === false) {
        setSessionUnavailableByUserId((current) => ({ ...current, [userId]: true }));
        toast({
          title: "Sign out unavailable",
          description: signOutPayload.error || "Session management is unavailable in this environment.",
          variant: "destructive",
        });
        return;
      }
      const { data: refreshedSessionsData } = await supabase.functions.invoke("manage-user-sessions", {
        body: { action: "list", user_id: userId },
      });
      const payload = (refreshedSessionsData || {}) as SessionManagerResponse;
      setUserSessionsByUserId((current) => ({ ...current, [userId]: payload.sessions || [] }));
      setSessionUnavailableByUserId((current) => ({ ...current, [userId]: !!payload.unavailable }));
      toast({ title: sessionId ? "Session signed out" : "All sessions signed out" });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: await getEdgeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSigningOutSessionFor(null);
    }
  };

  const handleRevokeElevatedAccess = async (row: { id: string; roleType: "super_admin" | "company_admin" | "owner"; email: string; userId?: string | null; companyId?: string | null }) => {
    setRevokingAccessId(row.id);
    try {
      const { error } = await supabase.functions.invoke("revoke-elevated-access", {
        body: {
          access_type: row.roleType,
          user_id: row.userId || null,
          email: row.email,
          company_id: row.companyId || null,
        },
      });
      if (error) throw error;
      await Promise.all([fetchSuperAdmins(), fetchPlatformUsers()]);
      toast({ title: "Access revoked" });
    } catch (error) {
      toast({
        title: "Revoke failed",
        description: await getEdgeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setRevokingAccessId(null);
    }
  };

  const handleCreateUser = async () => {
    setCreateUserLoading(true);
    const passwordToUse = autoGeneratePassword ? generatedPassword : manualPassword;
    try {
      const { data, error } = await supabase.functions.invoke("create-rcf-user", {
        body: {
          full_name: createUserFullName,
          email: createUserEmail,
          password: passwordToUse,
          company_id: createUserCompanyId || null,
          company_role: createUserCompanyId ? createUserCompanyRole : null,
          role_color: createUserRoleColor || null,
        },
      });
      if (error) throw error;
      setCreatedUserSummary({
        full_name: createUserFullName,
        email: createUserEmail,
        company_name: companies.find((company) => company.id === createUserCompanyId)?.name || "None",
        role: createUserCompanyId ? createUserCompanyRole : "—",
        password: passwordToUse,
      });
      setCreateUserFullName("");
      setCreateUserEmail("");
      setCreateUserCompanyId("");
      setCreateUserCompanyRole("employee");
      setCreateUserRoleColor("");
      setManualPassword("");
      setGeneratedPassword(generateTempPassword());
      await Promise.all([fetchPlatformUsers(), fetchSuperAdminCandidates()]);
      toast({ title: "User created", description: `${data?.user?.email || createUserEmail} is ready.` });
    } catch (error) {
      toast({
        title: "Create user failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setCreateUserLoading(false);
    }
  };

  useEffect(() => {
    if (accessChecked && isAllowed) {
      fetchCompanies();
      fetchPlatformUsers();
      fetchSuperAdminCandidates();
      fetchAdminActionLogs();
      fetchAnnouncements();
      fetchPlatformHealth();
    }
  }, [accessChecked, fetchAdminActionLogs, fetchAnnouncements, fetchCompanies, fetchPlatformHealth, fetchPlatformUsers, fetchSuperAdminCandidates, isAllowed]);

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
  }, [accessChecked, activeTab, contactSearch, contactStatusFilter, fetchContactQueries, isAllowed, contactAssigneeFilter]);

  useEffect(() => {
    if (!accessChecked || !isAllowed || activeTab !== "free-assessments") return;
    const timeoutId = setTimeout(() => {
      fetchFreeAssessmentSubmissions();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [accessChecked, activeTab, fetchFreeAssessmentSubmissions, freeAssessmentColorFilter, freeAssessmentSearch, isAllowed]);

  useEffect(() => {
    if (!selectedCompany) return;
    setEditCompanyName(selectedCompany.name);
    setEditCompanySubdomain(selectedCompany.subdomain);
    setEditCompanyPlanTier(selectedCompany.plan_tier || "free");
    setCompanyNotesDraft(selectedCompany.notes || "");
  }, [selectedCompany]);

  useEffect(() => {
    if (companies.length === 0 || selectedCompanyId) return;
    const storedCompanyId = localStorage.getItem("rcf_super_admin_company_context");
    const storedTab = localStorage.getItem("rcf_super_admin_active_tab");
    if (storedCompanyId && companies.some((company) => company.id === storedCompanyId)) {
      applyCompanyContext(storedCompanyId);
    }
    if (storedTab && tabItems.some((tab) => tab.value === storedTab && !("href" in tab))) {
      setActiveTab(storedTab);
    }
    localStorage.removeItem("rcf_super_admin_company_context");
    localStorage.removeItem("rcf_super_admin_active_tab");
  }, [applyCompanyContext, companies, selectedCompanyId, tabItems]);

  useEffect(() => {
    if (!selectedCompany) return;
    const timeout = setTimeout(() => {
      if (companyNotesDraft !== (selectedCompany.notes || "")) {
        void saveCompanyNotes();
      }
    }, 800);
    return () => clearTimeout(timeout);
  }, [companyNotesDraft, saveCompanyNotes, selectedCompany]);

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
              <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                <Button
                  variant="outline"
                  className="justify-center whitespace-nowrap border-slate-200 bg-white/80"
                  onClick={() => setActiveTab("free-assessments")}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Free Assessments
                </Button>
                <Button
                  variant="outline"
                  className="justify-center whitespace-nowrap border-slate-200 bg-white/80"
                  onClick={() => navigate("/admin/proposals")}
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Proposals
                </Button>
                <Button
                  variant="outline"
                  className="justify-center whitespace-nowrap border-slate-200 bg-white/80"
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
          <div className="flex flex-col gap-4">
            <TabsList className="grid h-auto grid-cols-1 gap-3 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
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
                    className="h-auto min-w-0 rounded-2xl border border-transparent px-4 py-4 text-left justify-start hover:bg-slate-100"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="truncate font-medium">{tab.label}</div>
                        <div className="truncate text-xs text-slate-500">{tab.description}</div>
                      </div>
                    </div>
                  </Button>
                );
              }

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="h-auto min-w-0 rounded-2xl border border-transparent px-4 py-4 text-left data-[state=active]:border-slate-300 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-950"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="truncate font-medium">{tab.label}</div>
                      <div className="truncate text-xs text-slate-500">{tab.description}</div>
                    </div>
                  </div>
                </TabsTrigger>
              );
            })}
            </TabsList>
          </div>

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
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950">{selectedCompany.name}</p>
                            <Badge variant="outline">{selectedCompany.plan_tier || "free"}</Badge>
                            {selectedCompany.archived_at ? <Badge variant="destructive">Archived</Badge> : null}
                            {selectedCompany.require_2fa ? <Badge variant="secondary">2FA Required</Badge> : null}
                          </div>
                          <p className="text-sm text-slate-500">{selectedCompany.subdomain}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">{selectedCompany.memberCount} members</Badge>
                          <Badge variant="outline">{selectedCompany.ownerCount} owners</Badge>
                          <Badge variant="outline">{selectedCompany.adminLevelCount} admin-level</Badge>
                          <Button variant="outline" size="sm" onClick={() => setCompanyEditOpen((current) => !current)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleSaveCompanyEdits(selectedCompany.archived_at ? "unarchive" : "archive")}
                            disabled={companyEditLoading}
                          >
                            {selectedCompany.archived_at ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
                            {selectedCompany.archived_at ? "Unarchive" : "Archive"}
                          </Button>
                        </div>
                      </div>
                      {companyEditOpen ? (
                        <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
                          <Input value={editCompanyName} onChange={(event) => setEditCompanyName(event.target.value)} placeholder="Company name" />
                          <Input value={editCompanySubdomain} onChange={(event) => setEditCompanySubdomain(event.target.value)} placeholder="Subdomain" />
                          <Select value={editCompanyPlanTier} onValueChange={setEditCompanyPlanTier}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="trial">Trial</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="md:col-span-3 flex justify-end">
                            <Button onClick={() => void handleSaveCompanyEdits()} disabled={companyEditLoading}>
                              {companyEditLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                              Save Company
                            </Button>
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">Require 2FA for all company users</p>
                            <p className="text-xs text-slate-500">Enforce MFA enrollment before workspace access.</p>
                          </div>
                          <Switch
                            checked={Boolean(selectedCompany.require_2fa)}
                            disabled={companyEditLoading}
                            onCheckedChange={async (checked) => {
                              setCompanyEditLoading(true);
                              try {
                                const { error } = await supabase.functions.invoke("update-company", {
                                  body: {
                                    company_id: selectedCompany.id,
                                    require_2fa: checked,
                                  },
                                });
                                if (error) throw error;
                                await fetchCompanies();
                                toast({ title: "Company 2FA updated" });
                              } catch (error) {
                                toast({
                                  title: "2FA update failed",
                                  description: getErrorMessage(error),
                                  variant: "destructive",
                                });
                              } finally {
                                setCompanyEditLoading(false);
                              }
                            }}
                          />
                        </div>
                        <Label htmlFor="company-notes">Internal notes (super admin only)</Label>
                        <Textarea
                          id="company-notes"
                          value={companyNotesDraft}
                          onChange={(event) => setCompanyNotesDraft(event.target.value)}
                          placeholder="Add internal CRM notes for this company"
                          className="min-h-[120px] bg-white"
                        />
                        <div className="text-xs text-slate-500">{companyNotesSaving ? "Saving..." : "Auto-saves after you stop typing."}</div>
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

                    <AccordionItem value="create-user" className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4">
                      <AccordionTrigger className="py-4 text-left hover:no-underline">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-white p-2 text-slate-700">
                            <UserPlus className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Create User</div>
                            <div className="text-xs text-slate-500">Create a regular platform user with a temporary password.</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid gap-3">
                          <Input placeholder="Full name" value={createUserFullName} onChange={(event) => setCreateUserFullName(event.target.value)} />
                          <Input placeholder="Email" type="email" value={createUserEmail} onChange={(event) => setCreateUserEmail(event.target.value)} />
                          <SearchableSelect
                            value={createUserCompanyId}
                            onChange={setCreateUserCompanyId}
                            options={[{ value: "", label: "No company" }, ...companyOptions]}
                            placeholder="Optional company"
                            searchPlaceholder="Search companies..."
                            emptyText="No companies found."
                          />
                          {createUserCompanyId ? (
                            <Select value={createUserCompanyRole} onValueChange={setCreateUserCompanyRole}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="employee">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="partner">Owner</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : null}
                          <Select value={createUserRoleColor} onValueChange={setCreateUserRoleColor}>
                            <SelectTrigger><SelectValue placeholder="Optional RoleColor" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="red">Red - Motivator</SelectItem>
                              <SelectItem value="yellow">Yellow - Executor</SelectItem>
                              <SelectItem value="green">Green - Architect</SelectItem>
                              <SelectItem value="blue">Blue - Visionary</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                            <Switch checked={autoGeneratePassword} onCheckedChange={setAutoGeneratePassword} />
                            <span className="text-sm text-slate-700">Generate temp password</span>
                          </div>
                          {autoGeneratePassword ? (
                            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                              <div className="flex items-center gap-2">
                                <Input readOnly value={generatedPassword} />
                                <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(generatedPassword)}>
                                  <ClipboardCopy className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-4 gap-1">
                                {Array.from({ length: 4 }).map((_, index) => (
                                  <div key={index} className={`h-1 rounded-full ${index < getPasswordStrength(generatedPassword) ? "bg-emerald-500" : "bg-slate-200"}`} />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <Input type="password" placeholder="Manual password" value={manualPassword} onChange={(event) => setManualPassword(event.target.value)} />
                          )}
                          <Button disabled={createUserLoading} onClick={handleCreateUser}>
                            {createUserLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Create User
                          </Button>
                          {createdUserSummary ? (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-700">
                              <p className="font-semibold text-emerald-700">User created successfully</p>
                              <p className="mt-2">Name: {createdUserSummary.full_name}</p>
                              <p>Email: {createdUserSummary.email}</p>
                              <p>Company: {createdUserSummary.company_name}</p>
                              <p>Role: {createdUserSummary.role}</p>
                              <div className="mt-2 flex items-center gap-2">
                                <Input readOnly value={createdUserSummary.password || ""} />
                                <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(createdUserSummary.password || "")}>
                                  <ClipboardCopy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="announcements" className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4">
                      <AccordionTrigger className="py-4 text-left hover:no-underline">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-white p-2 text-slate-700">
                            <Bell className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Announcements</div>
                            <div className="text-xs text-slate-500">Publish in-app messages to users, companies, or super admins.</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid gap-3">
                          <Input placeholder="Announcement title" value={announcementTitle} onChange={(event) => setAnnouncementTitle(event.target.value)} />
                          <Textarea placeholder="Announcement body (markdown supported)" value={announcementBody} onChange={(event) => setAnnouncementBody(event.target.value)} />
                          <Select value={announcementAudience} onValueChange={setAnnouncementAudience}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All users</SelectItem>
                              <SelectItem value="company">Specific company</SelectItem>
                              <SelectItem value="admins">Super admins only</SelectItem>
                            </SelectContent>
                          </Select>
                          {announcementAudience === "company" ? (
                            <SearchableSelect
                              value={announcementCompanyId}
                              onChange={setAnnouncementCompanyId}
                              options={companyOptions}
                              placeholder="Select company audience"
                              searchPlaceholder="Search companies..."
                              emptyText="No companies found."
                            />
                          ) : null}
                          <Input type="datetime-local" value={announcementScheduledAt} onChange={(event) => setAnnouncementScheduledAt(event.target.value)} />
                          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                            <Switch checked={announcementActive} onCheckedChange={setAnnouncementActive} />
                            <span className="text-sm text-slate-700">Active</span>
                          </div>
                          <Button disabled={announcementSaving} onClick={handleSaveAnnouncement}>
                            {announcementSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                            Publish Announcement
                          </Button>
                          <div className="space-y-2">
                            {announcements.slice(0, 5).map((announcement) => (
                              <div key={announcement.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium text-slate-900">{announcement.title}</span>
                                  <Badge variant={announcement.is_active ? "default" : "secondary"}>{announcement.is_active ? "Active" : "Inactive"}</Badge>
                                </div>
                                <p className="mt-1 text-slate-500">{announcement.audience}</p>
                                <div className="mt-3 flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      const { error } = await supabase.from("announcements").update({ is_active: !announcement.is_active }).eq("id", announcement.id);
                                      if (!error) void fetchAnnouncements();
                                    }}
                                  >
                                    {announcement.is_active ? "Deactivate" : "Activate"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      const { error } = await supabase.from("announcements").delete().eq("id", announcement.id);
                                      if (!error) void fetchAnnouncements();
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="platform-health" className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4">
                      <AccordionTrigger className="py-4 text-left hover:no-underline">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-white p-2 text-slate-700">
                            <ShieldAlert className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Platform Health</div>
                            <div className="text-xs text-slate-500">Track on-call ownership, recent errors, and incident logging.</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid gap-4">
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">On-call engineer</p>
                            <div className="mt-3 flex flex-col gap-3 md:flex-row">
                              <Select value={onCallEngineerEmail} onValueChange={setOnCallEngineerEmail}>
                                <SelectTrigger><SelectValue placeholder="Select super admin" /></SelectTrigger>
                                <SelectContent>
                                  {superAdmins.map((admin) => (
                                    <SelectItem key={admin.id} value={admin.email}>{admin.email}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button variant="outline" onClick={handleSaveOnCall}>Save On-call</Button>
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Super admin security</p>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-slate-900">Require 2FA for all super admins</p>
                                <p className="text-xs text-slate-500">Blocks dashboard access until MFA is enrolled.</p>
                              </div>
                              <Switch checked={requireSuperAdmin2fa} disabled={savingSuperAdmin2fa} onCheckedChange={(checked) => void handleSaveSuperAdmin2fa(checked)} />
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recent errors</p>
                            <div className="mt-3 space-y-2">
                              {platformErrors.map((errorRow) => (
                                <div key={errorRow.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-slate-900">{errorRow.message}</span>
                                    <Badge variant={errorRow.resolved_at ? "secondary" : "destructive"}>sev {errorRow.severity}</Badge>
                                  </div>
                                  <p className="mt-1 text-slate-500">{formatShortDate(errorRow.created_at)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Create incident</p>
                            <div className="mt-3 grid gap-3">
                              <Select value={incidentCode} onValueChange={setIncidentCode}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">Code 0</SelectItem>
                                  <SelectItem value="1">Code 1</SelectItem>
                                  <SelectItem value="2">Code 2</SelectItem>
                                  <SelectItem value="3">Code 3</SelectItem>
                                  <SelectItem value="4">Code 4</SelectItem>
                                </SelectContent>
                              </Select>
                              <Textarea placeholder="Incident description" value={incidentDescription} onChange={(event) => setIncidentDescription(event.target.value)} />
                              <Button onClick={handleCreateIncident} disabled={incidentSaving}>
                                {incidentSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Log Incident
                              </Button>
                            </div>
                            <div className="mt-4 space-y-2">
                              {incidents.map((incident) => (
                                <div key={incident.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-slate-900">{incident.description}</span>
                                    <Badge variant="outline">{incident.status}</Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="admin-logs" className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4">
                      <AccordionTrigger className="py-4 text-left hover:no-underline">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-white p-2 text-slate-700">
                            <Eye className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Admin Action Log</div>
                            <div className="text-xs text-slate-500">Review mutation history across billing, access, replies, and impersonation.</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid gap-3 md:grid-cols-4">
                          <Select value={adminActionTypeFilter} onValueChange={setAdminActionTypeFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All actions</SelectItem>
                              <SelectItem value="billing_change">Billing</SelectItem>
                              <SelectItem value="trial_set">Trial</SelectItem>
                              <SelectItem value="admin_assign">Admin Assign</SelectItem>
                              <SelectItem value="user_create">User Create</SelectItem>
                              <SelectItem value="password_reset">Password Reset</SelectItem>
                              <SelectItem value="fee_waiver">Fee Waiver</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={adminActionActorFilter} onValueChange={setAdminActionActorFilter}>
                            <SelectTrigger><SelectValue placeholder="Actor" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All actors</SelectItem>
                              {adminActorOptions.map((actor) => (
                                <SelectItem key={actor.value} value={actor.value}>{actor.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input type="date" value={adminActionDateFrom} onChange={(event) => setAdminActionDateFrom(event.target.value)} />
                          <Input type="date" value={adminActionDateTo} onChange={(event) => setAdminActionDateTo(event.target.value)} />
                          <div className="md:col-span-4 flex items-center justify-between">
                            <div className="text-sm text-slate-500">{adminActionTotalCount} log entries</div>
                            <div className="flex gap-2">
                              <Button variant="outline" onClick={() => handleExport("csv", "admin-action-logs")}>Quick CSV</Button>
                              <Button variant="outline" onClick={fetchAdminActionLogs}>Refresh Logs</Button>
                            </div>
                          </div>
                          <div className="md:col-span-4 rounded-xl border border-slate-200 bg-white">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>When</TableHead>
                                  <TableHead>Actor</TableHead>
                                  <TableHead>Action</TableHead>
                                  <TableHead>Target</TableHead>
                                  <TableHead>Metadata</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {adminActionLogs.map((log) => (
                                  <TableRow key={log.id}>
                                    <TableCell>{formatShortDate(log.created_at)}</TableCell>
                                    <TableCell>{log.actor_email || "Unknown"}</TableCell>
                                    <TableCell><Badge variant="outline">{log.action_type}</Badge></TableCell>
                                    <TableCell>{log.target_label || "—"}</TableCell>
                                    <TableCell className="max-w-[280px] truncate text-xs text-slate-500">{JSON.stringify(log.metadata)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
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
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                      <Switch checked={includeArchivedCompanies} onCheckedChange={setIncludeArchivedCompanies} />
                      <span className="text-sm text-slate-700">Include archived</span>
                    </div>
                    <Button variant="outline" onClick={fetchCompanies} disabled={companiesLoading} className="border-slate-200">
                      {companiesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      <span className="ml-2">Refresh companies</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-4">
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
                <CardContent className="space-y-4">
                  {!selectedCompanyId ? (
                    <div className="py-8 text-center text-muted-foreground">Select a company to view users.</div>
                  ) : companyUsersLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading users...</div>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Pending Invites</p>
                            <p className="text-xs text-slate-500">Invited users who have not joined yet.</p>
                          </div>
                          <Badge variant="outline">{pendingInvites.length}</Badge>
                        </div>
                        <div className="mt-3 space-y-2">
                          {pendingInvites.slice(0, 5).map((invite) => (
                            <div key={invite.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-sm font-medium text-slate-900">{invite.email}</p>
                                <p className="text-xs text-slate-500">Invited {formatShortDate(invite.invited_at || null)}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={inviteActionUserId === invite.id} onClick={() => void handleInviteAction(invite.id, "resend")}>
                                  {inviteActionUserId === invite.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Resend
                                </Button>
                                <Button variant="outline" size="sm" disabled={inviteActionUserId === invite.id} onClick={() => void handleInviteAction(invite.id, "revoke")}>
                                  {inviteActionUserId === invite.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Revoke
                                </Button>
                              </div>
                            </div>
                          ))}
                          {pendingInvites.length === 0 ? <p className="text-sm text-slate-500">No pending invites for this company.</p> : null}
                        </div>
                      </div>
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
                    </>
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
                <CardContent className="space-y-4">
                  {impersonationTarget ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-800">Impersonation link — opens a session as this user. Link expires in 1 hour.</p>
                      <p className="mt-1 text-xs text-amber-700">You are generating an impersonation link. This action is logged.</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Input readOnly value={impersonationTarget.link} />
                        <Button variant="outline" onClick={() => navigator.clipboard.writeText(impersonationTarget.link)}>
                          <ClipboardCopy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {platformUsersLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading platform users...</div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>B2B Flags</TableHead>
                              <TableHead>Company Count</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {platformUsers.map((platformUser) => {
                              const isExpanded = expandedPlatformUserId === platformUser.id;
                              const sessions = userSessionsByUserId[platformUser.id] || [];
                              const sessionAccessUnavailable = sessionUnavailableByUserId[platformUser.id];
                              const isSuperAdminTarget = superAdmins.some((admin) => admin.email.toLowerCase() === (platformUser.email || "").toLowerCase());

                              return (
                                <Fragment key={platformUser.id}>
                                  <TableRow key={platformUser.id}>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium text-slate-900">{platformUser.full_name || "Unnamed user"}</p>
                                        <p className="text-sm text-slate-500">{platformUser.email}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-2">
                                        {platformUser.is_b2b_owner && <Badge>B2B Owner</Badge>}
                                        {platformUser.is_b2b_admin_level && <Badge variant="secondary">Admin-Level</Badge>}
                                        {!platformUser.is_b2b_admin_level && <Badge variant="outline">No B2B Admin Access</Badge>}
                                      </div>
                                    </TableCell>
                                    <TableCell>{platformUser.b2b_company_count}</TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => void handleTogglePlatformUserExpansion(platformUser.id)}
                                          disabled={loadingSessionsFor === platformUser.id}
                                        >
                                          {loadingSessionsFor === platformUser.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                                          Sessions
                                        </Button>
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
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={!platformUser.email || isSuperAdminTarget || impersonationLoadingFor === platformUser.email}
                                          onClick={() => platformUser.email && handleGenerateImpersonationLink(platformUser.email)}
                                        >
                                          {impersonationLoadingFor === platformUser.email ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                                          View As
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  {isExpanded ? (
                                    <TableRow key={`${platformUser.id}-sessions`}>
                                      <TableCell colSpan={4} className="bg-slate-50">
                                        <div className="space-y-3 p-2">
                                          <div className="flex items-center justify-between gap-3">
                                            <div>
                                              <p className="text-sm font-semibold text-slate-900">Active sessions</p>
                                              <p className="text-xs text-slate-500">Review recent devices and force sign-out when needed.</p>
                                            </div>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              disabled={signingOutSessionFor === platformUser.id || sessionAccessUnavailable}
                                              onClick={() => void handleForceSignOut(platformUser.id)}
                                            >
                                              {signingOutSessionFor === platformUser.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldOff className="mr-2 h-4 w-4" />}
                                              Sign Out All Sessions
                                            </Button>
                                          </div>
                                          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                            {sessionAccessUnavailable ? (
                                              <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                                Session inspection is temporarily unavailable in this environment, so sign-out controls are disabled.
                                              </div>
                                            ) : null}
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead>Device</TableHead>
                                                  <TableHead>IP</TableHead>
                                                  <TableHead>Created</TableHead>
                                                  <TableHead>Last Active</TableHead>
                                                  <TableHead>Action</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {sessions.map((session) => (
                                                  <TableRow key={session.id}>
                                                    <TableCell className="max-w-[320px] truncate">{session.user_agent || "Unknown device"}</TableCell>
                                                    <TableCell>{session.ip || "—"}</TableCell>
                                                    <TableCell>{formatShortDate(session.created_at)}</TableCell>
                                                    <TableCell>{formatShortDate(session.updated_at)}</TableCell>
                                                    <TableCell>
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={signingOutSessionFor === session.id || sessionAccessUnavailable}
                                                        onClick={() => void handleForceSignOut(platformUser.id, session.id)}
                                                      >
                                                        {signingOutSessionFor === session.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldOff className="mr-2 h-4 w-4" />}
                                                        Force Sign Out
                                                      </Button>
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                                {sessions.length === 0 ? (
                                                  <TableRow>
                                                    <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                                                      No active sessions found for this user.
                                                    </TableCell>
                                                  </TableRow>
                                                ) : null}
                                              </TableBody>
                                            </Table>
                                          </div>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ) : null}
                                </Fragment>
                              );
                            })}
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
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Permission Audit View</p>
                        <p className="text-xs text-slate-500">Elevated access across super admins and company-level admins.</p>
                      </div>
                      <Select value={permissionAuditFilter} onValueChange={(value) => setPermissionAuditFilter(value as typeof permissionAuditFilter)}>
                        <SelectTrigger className="w-[180px] bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All elevated users</SelectItem>
                          <SelectItem value="super_admin">Super admins</SelectItem>
                          <SelectItem value="company_admin">Company admins</SelectItem>
                          <SelectItem value="owner">Owners</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role Type</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Granted At</TableHead>
                            <TableHead>Granted By</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {permissionAuditRows.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>{row.email}</TableCell>
                              <TableCell><Badge variant={row.roleType === "super_admin" ? "default" : "secondary"}>{row.roleType}</Badge></TableCell>
                              <TableCell>{row.company}</TableCell>
                              <TableCell>{formatShortDate(row.grantedAt || null)}</TableCell>
                              <TableCell>{row.grantedBy}</TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={revokingAccessId === row.id}
                                  onClick={() => void handleRevokeElevatedAccess(row)}
                                >
                                  {revokingAccessId === row.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldOff className="mr-2 h-4 w-4" />}
                                  Revoke
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {permissionAuditRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="py-6 text-center text-sm text-slate-500">
                                No elevated users match this filter.
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="free-assessments">
            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Visible submissions</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{freeAssessmentStats.total}</p>
                  </CardContent>
                </Card>
                <Card className="border-emerald-100 bg-emerald-50/80 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">Emails sent</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{freeAssessmentStats.emailedCount}</p>
                  </CardContent>
                </Card>
                <Card className="border-rose-100 bg-rose-50/80 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-rose-700">Email errors</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{freeAssessmentStats.failedEmailCount}</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Unique emails</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{freeAssessmentStats.uniqueEmails}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle>Free Assessment Filters</CardTitle>
                  <CardDescription>Search captured preview results by email or color.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto_auto]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search email"
                        value={freeAssessmentSearch}
                        onChange={(event) => setFreeAssessmentSearch(event.target.value)}
                      />
                    </div>
                    <Select
                      value={freeAssessmentColorFilter}
                      onValueChange={(value) => setFreeAssessmentColorFilter(value as typeof freeAssessmentColorFilter)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All colors</SelectItem>
                        <SelectItem value="yellow">Yellow</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={fetchFreeAssessmentSubmissions} disabled={freeAssessmentSubmissionsLoading}>
                      {freeAssessmentSubmissionsLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Refresh
                    </Button>
                    <Button variant="outline" onClick={() => handleExport("csv", "free-assessments")}>CSV</Button>
                    <Button variant="outline" onClick={() => handleExport("json", "free-assessments")}>JSON</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle>Free Assessment Submissions</CardTitle>
                  <CardDescription>Email-gated results from the public free assessment.</CardDescription>
                </CardHeader>
                <CardContent>
                  {freeAssessmentSubmissionsLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading free assessment submissions...</div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Submitted</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Result</TableHead>
                              <TableHead>Scores</TableHead>
                              <TableHead>Email status</TableHead>
                              <TableHead>Error</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {freeAssessmentSubmissions.map((submission) => (
                              <TableRow key={submission.id}>
                                <TableCell>{new Date(submission.created_at).toLocaleString()}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="link"
                                    className="h-auto p-0 text-left font-medium text-slate-900 underline-offset-4 hover:underline"
                                    onClick={() => setSelectedFreeAssessmentSubmission(submission)}
                                  >
                                    {submission.email}
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize">{submission.dominant_color}</Badge>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{formatScores(submission.scores)}</TableCell>
                                <TableCell>
                                  <Badge variant={submission.email_error ? "destructive" : submission.email_sent_at ? "default" : "secondary"}>
                                    {submission.email_error ? "Failed" : submission.email_sent_at ? "Sent" : "Pending"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-xs whitespace-normal break-words text-sm text-muted-foreground">
                                  {submission.email_error || "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                            {freeAssessmentSubmissions.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                  No free assessment submissions matched this filter.
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
                    <Select value={contactAssigneeFilter} onValueChange={setContactAssigneeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All assignees</SelectItem>
                        {assignableSuperAdmins.map((admin) => (
                          <SelectItem key={admin.id} value={admin.user_id as string}>{admin.email}</SelectItem>
                        ))}
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
                              <TableHead>Source</TableHead>
                              <TableHead>Assigned</TableHead>
                              <TableHead>Message</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Reply</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contactQueries.map((query) => (
                              <Fragment key={query.id}>
                                <TableRow>
                                  <TableCell>{new Date(query.created_at).toLocaleString()}</TableCell>
                                  <TableCell>{query.name}</TableCell>
                                  <TableCell>{query.email}</TableCell>
                                  <TableCell>{query.phone || "-"}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{query.source_page}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={query.assigned_to || "unassigned"}
                                      onValueChange={(value) => void handleAssignContact(query.id, value === "unassigned" ? "" : value)}
                                    >
                                      <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {assignableSuperAdmins.map((admin) => (
                                          <SelectItem key={admin.id} value={admin.user_id as string}>{admin.email}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell className="max-w-sm whitespace-normal break-words">{query.message}</TableCell>
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
                                  <TableCell>
                                    <Badge variant={query.reply_status === "replied" ? "default" : "secondary"}>
                                      {query.reply_status || "pending"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setReplyingContactId(replyingContactId === query.id ? null : query.id);
                                        if (!replyDraftById[query.id]) {
                                          setReplyDraftById((current) => ({
                                            ...current,
                                            [query.id]: `Hi ${query.name},\n\nThanks for reaching out to RoleColorFinder.\n\n[your reply here]\n\nBest,\nRCF Team`,
                                          }));
                                        }
                                      }}
                                    >
                                      <Reply className="mr-2 h-4 w-4" />
                                      Reply
                                    </Button>
                                  </TableCell>
                                </TableRow>
                                {replyingContactId === query.id ? (
                                  <TableRow>
                                    <TableCell colSpan={9} className="bg-slate-50">
                                      <div className="space-y-3 p-2">
                                        <Label htmlFor={`reply-${query.id}`}>Reply to {query.email}</Label>
                                        <Textarea
                                          id={`reply-${query.id}`}
                                          value={replyDraftById[query.id] || ""}
                                          onChange={(event) =>
                                            setReplyDraftById((current) => ({
                                              ...current,
                                              [query.id]: event.target.value,
                                            }))
                                          }
                                          className="min-h-[160px] bg-white"
                                        />
                                        <div className="flex justify-end gap-2">
                                          <Button variant="outline" onClick={() => setReplyingContactId(null)}>Cancel</Button>
                                          <Button disabled={sendingReplyId === query.id} onClick={() => void handleSendContactReply(query.id)}>
                                            {sendingReplyId === query.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Reply className="mr-2 h-4 w-4" />}
                                            Send Reply
                                          </Button>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : null}
                              </Fragment>
                            ))}
                            {contactQueries.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
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

        <Dialog
          open={!!selectedFreeAssessmentSubmission}
          onOpenChange={(open) => {
            if (!open) setSelectedFreeAssessmentSubmission(null);
          }}
        >
          <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Free Assessment Entry</DialogTitle>
              <DialogDescription>
                Full captured details for this email-gated free assessment result.
              </DialogDescription>
            </DialogHeader>
            {selectedFreeAssessmentSubmission ? (
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Email</p>
                    <p className="mt-2 break-all text-sm font-semibold text-slate-950">{selectedFreeAssessmentSubmission.email}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Submitted</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {new Date(selectedFreeAssessmentSubmission.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Result</p>
                    <Badge variant="outline" className="mt-2 capitalize">{selectedFreeAssessmentSubmission.dominant_color}</Badge>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Scores</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{formatScores(selectedFreeAssessmentSubmission.scores)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Email Sent</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {selectedFreeAssessmentSubmission.email_sent_at
                        ? new Date(selectedFreeAssessmentSubmission.email_sent_at).toLocaleString()
                        : "Not sent"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Email Status</p>
                    <Badge
                      className="mt-2"
                      variant={selectedFreeAssessmentSubmission.email_error ? "destructive" : selectedFreeAssessmentSubmission.email_sent_at ? "default" : "secondary"}
                    >
                      {selectedFreeAssessmentSubmission.email_error ? "Failed" : selectedFreeAssessmentSubmission.email_sent_at ? "Sent" : "Pending"}
                    </Badge>
                  </div>
                </div>

                {selectedFreeAssessmentSubmission.email_error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-rose-700">Email Error</p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-rose-900">{selectedFreeAssessmentSubmission.email_error}</p>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-300">Raw Result Payload</p>
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-100">
                    {JSON.stringify(selectedFreeAssessmentSubmission.result_payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

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
