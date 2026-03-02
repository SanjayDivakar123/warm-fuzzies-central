import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  is_b2b_owner: boolean;
  is_b2b_admin_level: boolean;
  b2b_company_count: number;
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Unexpected error";
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
  const [sendingResetTo, setSendingResetTo] = useState<string | null>(null);
  const [billingCompanyId, setBillingCompanyId] = useState<string>("");
  const [billingAmountUsd, setBillingAmountUsd] = useState<string>("");
  const [billingDescription, setBillingDescription] = useState<string>("");
  const [billingLoadingAction, setBillingLoadingAction] = useState<"charge_card" | "add_free_credits" | "remove_credits" | null>(null);
  const [pendingBillingAction, setPendingBillingAction] = useState<"charge_card" | "add_free_credits" | "remove_credits" | null>(null);
  const [selectedBillingAction, setSelectedBillingAction] = useState<"charge_card" | "add_free_credits" | "remove_credits">("add_free_credits");
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
          <TabsList className="grid grid-cols-2 md:grid-cols-3 gap-2 h-auto p-1">
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
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
