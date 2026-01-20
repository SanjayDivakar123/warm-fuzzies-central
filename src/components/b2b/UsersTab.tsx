import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Mail,
  Trash2,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  CreditCard,
} from "lucide-react";

import EmailTemplateCustomizer from './EmailTemplateCustomizer';

interface UsersTabProps {
  company: any;
  onCompanyUpdate?: () => void;
}

const MAX_INVITES = 3;

const DEFAULT_JOB_ROLES = [
  "Engineer",
  "Designer",
  "PM",
  "Sales",
  "Support",
  "Analyst",
  "Marketing",
  "Founder",
  "Intern",
  "Operations",
  "QA",
  "Writer",
  "Researcher",
];

const PREDEFINED_SKILLS = [
  "UI Design",
  "Data Analysis",
  "Coding",
  "Writing",
  "Research",
  "QA",
  "Operations",
  "Client Communication",
  "Branding",
  "Marketing",
  "Project Management",
  "Sales",
  "Strategy",
  "Content Creation",
  "Technical Support",
];

export default function UsersTab({ company, onCompanyUpdate }: UsersTabProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [newJobRoleInput, setNewJobRoleInput] = useState("");
  const [customJobRoles, setCustomJobRoles] = useState<string[]>([]);
  const [showSeatPrompt, setShowSeatPrompt] = useState(false);
  const { toast } = useToast();

  // Combine default and custom job roles
  const allJobRoles = [...DEFAULT_JOB_ROLES, ...customJobRoles].sort();

  useEffect(() => {
    fetchUsers();
  }, [company.id]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("company_users")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setShowSeatPrompt(false);

    try {
      const { data, error } = await supabase.functions.invoke("invite-company-user", {
        body: {
          company_id: company.id,
          email: newUserEmail,
        },
      });

      if (error) throw error;

      // Check if the response contains an error message
      if (data?.error) {
        // Check if it's a "no seats" error
        if (data.error.toLowerCase().includes("no seats") || data.errorCode === "NO_SEATS") {
          setShowSeatPrompt(true);
          return;
        }
        // Check if they need to add a payment method
        if (data.errorCode === "NEEDS_PAYMENT_METHOD" || data.needsPaymentMethod) {
          toast({
            title: "Payment method required",
            description: "Please add a payment method in Settings before inviting users.",
            variant: "destructive",
          });
          return;
        }
        // Check for charge failure
        if (data.errorCode === "CHARGE_FAILED") {
          toast({
            title: "Payment failed",
            description: data.error || "Failed to charge for this seat. Please check your payment method.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error);
      }

      // Show billing info if charged
      const billingMsg = data.billing?.charged 
        ? " (Card charged $20)" 
        : data.billing?.usedCredits 
          ? " (Used $20 billing credit)" 
          : "";

      toast({
        title: "User invited!",
        description: `Invitation sent to ${newUserEmail}${billingMsg}`,
      });

      setNewUserEmail("");
      fetchUsers();
      if (onCompanyUpdate) onCompanyUpdate(); // Refresh company data to update credit balance
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred";
      // Check if it's a "no seats" error from the error message
      if (errorMessage.toLowerCase().includes("no seats")) {
        setShowSeatPrompt(true);
        return;
      }
      toast({
        title: "Error inviting user",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const isUnlimitedCompany = company.name === "RoleColorFinder LLC";
  
  const getAvailableSeats = () => {
    if (isUnlimitedCompany) return Infinity;
    const activeUsers = users.filter((u: any) => u.status !== "revoked").length;
    return company.seats_purchased - activeUsers;
  };

  const handleResendInvite = async (userId: string) => {
    setResendingId(userId);

    try {
      const { data, error } = await supabase.functions.invoke("resend-invite", {
        body: { user_id: userId },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Invite resent!",
        description: `${data.remaining} resends remaining`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error resending invite",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    try {
      const { error } = await supabase.from("company_users").update({ status: "revoked" }).eq("id", userId);

      if (error) throw error;

      toast({
        title: "Access revoked",
        description: "User access has been revoked",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error revoking access",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // First, clear any task assignments that reference this user
      const { error: primaryError } = await supabase
        .from("task_assignments")
        .update({ primary_assignee_id: null })
        .eq("primary_assignee_id", userId);

      if (primaryError) {
        console.error("Error clearing primary assignments:", primaryError);
      }

      const { error: secondaryError } = await supabase
        .from("task_assignments")
        .update({ secondary_assignee_id: null })
        .eq("secondary_assignee_id", userId);

      if (secondaryError) {
        console.error("Error clearing secondary assignments:", secondaryError);
      }

      // Now delete the user
      const { error } = await supabase.from("company_users").delete().eq("id", userId).eq("status", "revoked"); // Only allow deleting revoked users

      if (error) throw error;

      toast({
        title: "User deleted",
        description: "User has been permanently removed",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateJobRole = async (userId: string, jobRole: string) => {
    setSavingUserId(userId);
    try {
      const { error } = await supabase.from("company_users").update({ job_role: jobRole }).eq("id", userId);

      if (error) throw error;

      setUsers(users.map((u) => (u.id === userId ? { ...u, job_role: jobRole } : u)));

      toast({
        title: "Job role updated",
        description: `Job role set to ${jobRole}`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating job role",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingUserId(null);
    }
  };

  const handleAddSkill = async (userId: string, skill: string) => {
    const user = users.find((u) => u.id === userId);
    const currentSkills = user?.skills || [];

    if (currentSkills.includes(skill)) {
      toast({
        title: "Skill already exists",
        description: `${skill} is already in the skill list`,
        variant: "destructive",
      });
      return;
    }

    const newSkills = [...currentSkills, skill];

    setSavingUserId(userId);
    try {
      const { error } = await supabase.from("company_users").update({ skills: newSkills }).eq("id", userId);

      if (error) throw error;

      setUsers(users.map((u) => (u.id === userId ? { ...u, skills: newSkills } : u)));
      setNewSkillInput("");

      toast({
        title: "Skill added",
        description: `Added ${skill}`,
      });
    } catch (error: any) {
      toast({
        title: "Error adding skill",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingUserId(null);
    }
  };

  const handleRemoveSkill = async (userId: string, skillToRemove: string) => {
    const user = users.find((u) => u.id === userId);
    const newSkills = (user?.skills || []).filter((s: string) => s !== skillToRemove);

    setSavingUserId(userId);
    try {
      const { error } = await supabase.from("company_users").update({ skills: newSkills }).eq("id", userId);

      if (error) throw error;

      setUsers(users.map((u) => (u.id === userId ? { ...u, skills: newSkills } : u)));

      toast({
        title: "Skill removed",
        description: `Removed ${skillToRemove}`,
      });
    } catch (error: any) {
      toast({
        title: "Error removing skill",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingUserId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      invited: "secondary",
      active: "default",
      revoked: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getInviteCount = (user: any) => {
    return user.invite_count || 1;
  };

  const canResend = (user: any) => {
    return user.status === "invited" && getInviteCount(user) < MAX_INVITES;
  };

  const getResendTooltip = (user: any) => {
    const count = getInviteCount(user);
    const remaining = MAX_INVITES - count;

    if (remaining <= 0) {
      return "Maximum invites sent (3/3)";
    }
    return `Resend invite (${remaining} remaining)`;
  };

  const handleCopyCode = async (userId: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(userId);
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpanded = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
    setNewSkillInput("");
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invite New User</CardTitle>
              {isUnlimitedCompany && (
                <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
                  ∞ Unlimited
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showSeatPrompt ? (
              <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-400">You've run out of seats</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  <p className="mb-3">
                    All {company.seats_purchased} seats are currently in use. Would you like to add more seats to your
                    plan?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={() => {
                        // TODO: Navigate to billing/settings or open billing modal
                        toast({
                          title: "Contact us",
                          description: "Please contact support@rolecolorfinder.com to add more seats.",
                        });
                      }}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add More Seats
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowSeatPrompt(false)}>
                      Cancel
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <form onSubmit={handleInviteUser} className="flex gap-4">
                  <Input
                    type="email"
                    placeholder="user@company.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                    disabled={!isUnlimitedCompany && getAvailableSeats() <= 0}
                  />
                  <Button type="submit" disabled={inviting || (!isUnlimitedCompany && getAvailableSeats() <= 0)}>
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Invite
                  </Button>
                </form>
                {isUnlimitedCompany ? (
                  <p className="text-sm text-muted-foreground">
                    Active users: {users.filter((u: any) => u.status !== "revoked").length} (unlimited seats)
                  </p>
                ) : (
                  <p
                    className={`text-sm ${getAvailableSeats() <= 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}
                  >
                    Seats available: {getAvailableSeats()} / {company.seats_purchased}
                    {getAvailableSeats() <= 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="ml-2 h-auto p-0 text-amber-600 hover:text-amber-700"
                        onClick={() => setShowSeatPrompt(true)}
                      >
                        Add more seats
                      </Button>
                    )}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Email Template Customizer */}
        <EmailTemplateCustomizer company={company} onUpdate={onCompanyUpdate || (() => {})} />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono">
                  {window.location.origin}/company/{company.subdomain}
                </code>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const url = `${window.location.origin}/company/${company.subdomain}/login`;
                        await navigator.clipboard.writeText(url);
                        toast({
                          title: "Link copied!",
                          description: "Employee login URL copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy employee login URL</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Job Role</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invite Code</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <>
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {user.job_role || <span className="text-muted-foreground">Not set</span>}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{user.skills?.length || 0} skills</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.invite_code ? (
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{user.invite_code}</code>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleCopyCode(user.id, user.invite_code)}
                                >
                                  {copiedId === user.id ? (
                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy invite code</TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(user.invited_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => toggleExpanded(user.id)}>
                                {expandedUserId === user.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit job role & skills</TooltipContent>
                          </Tooltip>
                          {user.status === "invited" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (!canResend(user)) {
                                      toast({
                                        title: "Resend limit reached",
                                        description: "This invite has already been resent the maximum number of times (3).",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    handleResendInvite(user.id);
                                  }}
                                  disabled={resendingId === user.id}
                                >
                                  {resendingId === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Mail className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{getResendTooltip(user)}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {user.role !== "admin" && user.status !== "revoked" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="destructive" size="sm" onClick={() => handleRevokeAccess(user.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Revoke access</TooltipContent>
                            </Tooltip>
                          )}
                          {user.role !== "admin" && user.status === "revoked" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete permanently</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedUserId === user.id && (
                      <TableRow key={`${user.id}-expanded`}>
                        <TableCell colSpan={8}>
                          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                              {/* Job Role Section */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Job Role</label>
                                <Select
                                  value={user.job_role || ""}
                                  onValueChange={(value) => handleUpdateJobRole(user.id, value)}
                                  disabled={savingUserId === user.id}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a job role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allJobRoles.map((role) => (
                                      <SelectItem key={role} value={role}>
                                        {role}
                                        {!DEFAULT_JOB_ROLES.includes(role) && (
                                          <span className="ml-2 text-xs text-muted-foreground">(custom)</span>
                                        )}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2 mt-2">
                                  <Input
                                    placeholder="Or add custom role..."
                                    value={newJobRoleInput}
                                    onChange={(e) => setNewJobRoleInput(e.target.value)}
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && newJobRoleInput.trim()) {
                                        e.preventDefault();
                                        const newRole = newJobRoleInput.trim();
                                        if (!allJobRoles.includes(newRole)) {
                                          setCustomJobRoles((prev) => [...prev, newRole]);
                                        }
                                        handleUpdateJobRole(user.id, newRole);
                                        setNewJobRoleInput("");
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (newJobRoleInput.trim()) {
                                        const newRole = newJobRoleInput.trim();
                                        if (!allJobRoles.includes(newRole)) {
                                          setCustomJobRoles((prev) => [...prev, newRole]);
                                        }
                                        handleUpdateJobRole(user.id, newRole);
                                        setNewJobRoleInput("");
                                      }
                                    }}
                                    disabled={!newJobRoleInput.trim() || savingUserId === user.id}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Skills Section */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Skills</label>
                                <div className="flex gap-2">
                                  <Select
                                    value=""
                                    onValueChange={(value) => handleAddSkill(user.id, value)}
                                    disabled={savingUserId === user.id}
                                  >
                                    <SelectTrigger className="flex-1">
                                      <SelectValue placeholder="Add a skill" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PREDEFINED_SKILLS.filter((skill) => !(user.skills || []).includes(skill)).map(
                                        (skill) => (
                                          <SelectItem key={skill} value={skill}>
                                            {skill}
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Input
                                    placeholder="Or add custom skill..."
                                    value={newSkillInput}
                                    onChange={(e) => setNewSkillInput(e.target.value)}
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && newSkillInput.trim()) {
                                        e.preventDefault();
                                        handleAddSkill(user.id, newSkillInput.trim());
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (newSkillInput.trim()) {
                                        handleAddSkill(user.id, newSkillInput.trim());
                                      }
                                    }}
                                    disabled={!newSkillInput.trim() || savingUserId === user.id}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Current Skills Display */}
                            {user.skills?.length > 0 && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Current Skills</label>
                                <div className="flex flex-wrap gap-2">
                                  {user.skills.map((skill: string) => (
                                    <Badge key={skill} variant="secondary" className="flex items-center gap-1 pr-1">
                                      {skill}
                                      <button
                                        onClick={() => handleRemoveSkill(user.id, skill)}
                                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                        disabled={savingUserId === user.id}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {savingUserId === user.id && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
