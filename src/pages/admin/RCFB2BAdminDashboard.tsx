import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import { Building2, Calendar, FileText, Loader2, Mail, MoreVertical, RefreshCw, Search, Shield, Users, XCircle } from "lucide-react";
import AdminCompanyStatementModal from "@/components/b2b/admin/AdminCompanyStatementModal";

const ALLOWED_SUPER_ADMIN_EMAILS = [
  "sanjay@rolecolorfinder.com",
  "tristan@rolecolorfinder.com",
  "aaron@rolecolor.com",
  "kody@rolecolor.com",
];

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

export default function RCFB2BAdminDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("companies");

  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [companyUsers, setCompanyUsers] = useState<CompanyUserRow[]>([]);
  const [companyUsersLoading, setCompanyUsersLoading] = useState(false);

  const [platformUsers, setPlatformUsers] = useState<PlatformUserRow[]>([]);
  const [platformUsersLoading, setPlatformUsersLoading] = useState(false);
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
  const [createCompanyAdminSearch, setCreateCompanyAdminSearch] = useState("");
  const [createCompanyWaiveDeploymentFee, setCreateCompanyWaiveDeploymentFee] = useState(false);
  const [createCompanyLoading, setCreateCompanyLoading] = useState(false);
  const [assignAdminCompanyId, setAssignAdminCompanyId] = useState("");
  const [assignAdminUserId, setAssignAdminUserId] = useState("");
  const [assignAdminSearch, setAssignAdminSearch] = useState("");
  const [assignAdminLoading, setAssignAdminLoading] = useState(false);
  const [deploymentFeeCompanyId, setDeploymentFeeCompanyId] = useState("");
  const [deploymentFeeWaived, setDeploymentFeeWaived] = useState(true);
  const [deploymentFeeLoading, setDeploymentFeeLoading] = useState(false);
  const [statementModalCompany, setStatementModalCompany] = useState<{ id: string; name: string; initialView?: 'statement' | 'renewal' } | null>(null);
  const [togglingHiringFor, setTogglingHiringFor] = useState<string | null>(null);
  const [pendingHiringToggle, setPendingHiringToggle] = useState<{ 
    companyId: string; 
    companyName: string; 
    action: 'enable' | 'cancel_subscription' | 'remove_access';
  } | null>(null);

  const isAllowed = ALLOWED_SUPER_ADMIN_EMAILS.includes((user?.email || "").toLowerCase());

  useEffect(() => {
    if (!loading && !isAllowed) {
      navigate("/dashboard");
    }
  }, [isAllowed, loading, navigate]);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) || null,
    [companies, selectedCompanyId],
  );

  const selectablePlatformUsers = useMemo(
    () => platformUsers.filter((platformUser) => !!platformUser.email),
    [platformUsers],
  );

  const filteredCreateAdminUsers = useMemo(() => {
    const query = createCompanyAdminSearch.trim().toLowerCase();
    if (!query) return selectablePlatformUsers;
    return selectablePlatformUsers.filter((platformUser) => {
      const email = (platformUser.email || "").toLowerCase();
      const fullName = (platformUser.full_name || "").toLowerCase();
      return email.includes(query) || fullName.includes(query);
    });
  }, [createCompanyAdminSearch, selectablePlatformUsers]);

  const filteredAssignAdminUsers = useMemo(() => {
    const query = assignAdminSearch.trim().toLowerCase();
    if (!query) return selectablePlatformUsers;
    return selectablePlatformUsers.filter((platformUser) => {
      const email = (platformUser.email || "").toLowerCase();
      const fullName = (platformUser.full_name || "").toLowerCase();
      return email.includes(query) || fullName.includes(query);
    });
  }, [assignAdminSearch, selectablePlatformUsers]);

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
      setCreateCompanyAdminSearch("");
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
      setAssignAdminSearch("");
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
    if (!loading && isAllowed) {
      fetchCompanies();
      fetchPlatformUsers();
    }
  }, [fetchCompanies, fetchPlatformUsers, isAllowed, loading]);

  useEffect(() => {
    fetchCompanyUsers(selectedCompanyId);
  }, [fetchCompanyUsers, selectedCompanyId]);

  useEffect(() => {
    if (loading || !isAllowed) return;
    const timeoutId = setTimeout(() => {
      fetchPlatformUsers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchPlatformUsers, isAllowed, loading, platformFilter, platformSearch]);

  useEffect(() => {
    if (loading || !isAllowed || activeTab !== "contact-queries") return;
    const timeoutId = setTimeout(() => {
      fetchContactQueries();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [activeTab, contactSearch, contactStatusFilter, fetchContactQueries, isAllowed, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!isAllowed) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              RCF Super-Admin B2B
            </h1>
            <p className="text-muted-foreground">
              Global visibility across B2B companies and platform user accounts.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 h-auto p-1">
            <TabsTrigger value="companies" className="gap-2">
              <Building2 className="h-4 w-4" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="company-users" className="gap-2">
              <Users className="h-4 w-4" />
              Company Users
            </TabsTrigger>
            <TabsTrigger value="platform-users" className="gap-2">
              <Mail className="h-4 w-4" />
              Platform Users
            </TabsTrigger>
            <TabsTrigger value="contact-queries" className="gap-2">
              <FileText className="h-4 w-4" />
              Contact Queries
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Billing Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                  <Select value={billingCompanyId} onValueChange={setBillingCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    {billingLoadingAction !== null ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Execute
                  </Button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5 border-t pt-4">
                  <Select value={trialCompanyId} onValueChange={setTrialCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Trial company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <div className="lg:col-span-2">
                    <Button
                      variant="secondary"
                      disabled={trialLoadingAction}
                      onClick={handleSetTrial}
                      className="w-full"
                    >
                      {trialLoadingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Set Trial (Custom)
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5 border-t pt-4">
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
                  <Input
                    placeholder="Search admin by name or email"
                    value={createCompanyAdminSearch}
                    onChange={(event) => setCreateCompanyAdminSearch(event.target.value)}
                  />
                  <Select value={createCompanyAdminUserId} onValueChange={setCreateCompanyAdminUserId}>
                    <SelectTrigger className="md:col-span-2">
                      <SelectValue placeholder="Select admin user" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCreateAdminUsers.map((platformUser) => (
                        <SelectItem key={platformUser.id} value={platformUser.id}>
                          {platformUser.full_name
                            ? `${platformUser.full_name} (${platformUser.email})`
                            : platformUser.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <Switch
                      checked={createCompanyWaiveDeploymentFee}
                      onCheckedChange={setCreateCompanyWaiveDeploymentFee}
                    />
                    <span className="text-sm">Waive one-time $5,000 deployment fee</span>
                  </div>
                  <div className="lg:col-span-4">
                    <Button
                      disabled={createCompanyLoading}
                      onClick={handleCreateCompany}
                      className="w-full"
                    >
                      {createCompanyLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Create Business
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5 border-t pt-4">
                  <Select value={assignAdminCompanyId} onValueChange={setAssignAdminCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Company for admin assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Search user by name or email"
                    value={assignAdminSearch}
                    onChange={(event) => setAssignAdminSearch(event.target.value)}
                  />
                  <Select value={assignAdminUserId} onValueChange={setAssignAdminUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select RCF user to make admin" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAssignAdminUsers.map((platformUser) => (
                        <SelectItem key={platformUser.id} value={platformUser.id}>
                          {platformUser.full_name
                            ? `${platformUser.full_name} (${platformUser.email})`
                            : platformUser.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="lg:col-span-2">
                    <Button
                      variant="secondary"
                      disabled={assignAdminLoading}
                      onClick={handleAssignAdmin}
                      className="w-full"
                    >
                      {assignAdminLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Assign Selected User as Company Admin
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5 border-t pt-4">
                  <Select value={deploymentFeeCompanyId} onValueChange={setDeploymentFeeCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Company for deployment fee" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <Switch checked={deploymentFeeWaived} onCheckedChange={setDeploymentFeeWaived} />
                    <span className="text-sm">Waive $5,000 deployment fee</span>
                  </div>
                  <div className="lg:col-span-3">
                    <Button
                      variant="secondary"
                      disabled={deploymentFeeLoading}
                      onClick={handleSetDeploymentFeeWaiver}
                      className="w-full"
                    >
                      {deploymentFeeLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Save Deployment Fee Rule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All B2B Companies</CardTitle>
                <Button variant="outline" onClick={fetchCompanies} disabled={companiesLoading}>
                  {companiesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                {companiesLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading companies...</div>
                ) : (
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
                        {companies.map((company) => (
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
                                  <p className="text-xs text-muted-foreground">
                                    Ends {company.b2b_trial_ends_at ? new Date(company.b2b_trial_ends_at).toLocaleDateString() : 'N/A'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Limit {company.b2b_trial_user_limit} users</p>
                                </div>
                              ) : company.b2b_trial_converted_at ? (
                                <div className="space-y-1">
                                  <Badge variant="outline">Converted</Badge>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(company.b2b_trial_converted_at).toLocaleDateString()}
                                  </p>
                                </div>
                              ) : (
                                <Badge variant="outline">None</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {company.deployment_fee_charged_at ? (
                                <div className="space-y-1">
                                  <Badge className="bg-emerald-600 text-white">Charged</Badge>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(company.deployment_fee_charged_at).toLocaleDateString()}
                                  </p>
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
                                          ? 'outline' 
                                          : company.hiring_subscription_status === 'active' ? 'default' : 'secondary'
                                      } 
                                      className="text-xs"
                                    >
                                      {company.hiring_subscription_cancel_at_period_end 
                                        ? 'cancelling' 
                                        : company.hiring_subscription_status || 'active'}
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
                                              onClick={() => setPendingHiringToggle({ 
                                                companyId: company.id, 
                                                companyName: company.name, 
                                                action: 'enable'
                                              })}
                                            >
                                              <RefreshCw className="h-4 w-4 mr-2" />
                                              Renew Subscription
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={() => setPendingHiringToggle({ 
                                                companyId: company.id, 
                                                companyName: company.name, 
                                                action: 'remove_access'
                                              })}
                                              className="text-destructive focus:text-destructive"
                                            >
                                              <XCircle className="h-4 w-4 mr-2" />
                                              Revoke Access Now
                                            </DropdownMenuItem>
                                          </>
                                        ) : (
                                          <>
                                            <DropdownMenuItem
                                              onClick={() => setPendingHiringToggle({ 
                                                companyId: company.id, 
                                                companyName: company.name, 
                                                action: 'cancel_subscription'
                                              })}
                                            >
                                              <Calendar className="h-4 w-4 mr-2" />
                                              Cancel at Period End
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={() => setPendingHiringToggle({ 
                                                companyId: company.id, 
                                                companyName: company.name, 
                                                action: 'remove_access'
                                              })}
                                              className="text-destructive focus:text-destructive"
                                            >
                                              <XCircle className="h-4 w-4 mr-2" />
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
                                    onClick={() => setPendingHiringToggle({ 
                                      companyId: company.id, 
                                      companyName: company.name, 
                                      action: 'enable'
                                    })}
                                    disabled={togglingHiringFor === company.id}
                                  >
                                    <Shield className="h-3.5 w-3.5 mr-1" />
                                    Grant Access
                                  </Button>
                                )}
                                {togglingHiringFor === company.id && (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setStatementModalCompany({ id: company.id, name: company.name, initialView: 'statement' })}
                                  className="gap-1"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  View Statement
                                </Button>
                                {/* <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setStatementModalCompany({ id: company.id, name: company.name, initialView: 'renewal' })}
                                >
                                  View Renewal Statement
                                </Button> */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCompanyId(company.id);
                                    setBillingCompanyId(company.id);
                                    setActiveTab("company-users");
                                  }}
                                >
                                  View Users
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {companies.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                              No companies found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company-users">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Select Company</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger className="max-w-lg">
                    <SelectValue placeholder="Choose a company to view its users" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {selectedCompany ? `${selectedCompany.name} Users` : "Company Users"}
                </CardTitle>
                {selectedCompanyId && (
                  <Button
                    variant="outline"
                    onClick={() => fetchCompanyUsers(selectedCompanyId)}
                    disabled={companyUsersLoading}
                  >
                    {companyUsersLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!selectedCompanyId ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Select a company to view users.
                  </div>
                ) : companyUsersLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading users...</div>
                ) : (
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
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No users found for this company.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="platform-users">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Platform Users</CardTitle>
              </CardHeader>
              <CardContent>
                {platformUsersLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading platform users...</div>
                ) : (
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
                                {platformUser.is_b2b_admin_level && (
                                  <Badge variant="secondary">Admin-Level</Badge>
                                )}
                                {!platformUser.is_b2b_admin_level && (
                                  <Badge variant="outline">No B2B Admin Access</Badge>
                                )}
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
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4 mr-2" />
                                )}
                                Send Reset
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {platformUsers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              No platform users matched this filter.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact-queries">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Form Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {contactQueriesLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading contact queries...</div>
                ) : (
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
                                  updateContactQueryStatus(
                                    query.id,
                                    value as "new" | "reviewed" | "resolved"
                                  )
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
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              No contact queries yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
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
