import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
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
  Upload,
  Bell,
  Shield,
  ShieldPlus,
  Settings,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
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

import EmailTemplateCustomizer from './EmailTemplateCustomizer';
import BulkImportModal from './BulkImportModal';
import ScheduleReminderModal from './ScheduleReminderModal';
import GoogleWorkspaceImportModal from './GoogleWorkspaceImportModal';
import InviteAdminModal from './InviteAdminModal';
import PromoteToAdminModal from './PromoteToAdminModal';
import ManageAdminModal from './ManageAdminModal';
import InviteUserModal from './InviteUserModal';

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

type UserFilter = 'all' | 'pending_reminders' | 'completed';

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
  const [fullNameInput, setFullNameInput] = useState<Record<string, string>>({});
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showGoogleImport, setShowGoogleImport] = useState(false);
  const [showGoogleSync, setShowGoogleSync] = useState(false);
  const [showInviteAdmin, setShowInviteAdmin] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [promoteUser, setPromoteUser] = useState<{ id: string; email: string; full_name?: string } | null>(null);
  const [manageAdmin, setManageAdmin] = useState<{ id: string; email: string; full_name?: string; status: string; role: string } | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [cancelledReminders, setCancelledReminders] = useState<Record<string, number>>({});
  const [pendingReminders, setPendingReminders] = useState<Set<string>>(new Set());
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [retakeRequestUser, setRetakeRequestUser] = useState<{ id: string; email: string; full_name?: string } | null>(null);
  const [requestingRetake, setRequestingRetake] = useState(false);
  const { toast } = useToast();

  // Identify the super admin (first admin created for the company)
  const superAdminId = users
    .filter(u => u.role === 'admin')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]?.id;

  // Check if current user is the super admin
  const isSuperAdmin = currentUserId ? users.some(u => u.id === superAdminId && u.user_id === currentUserId) : false;

  // Combine default and custom job roles
  const allJobRoles = [...DEFAULT_JOB_ROLES, ...customJobRoles].sort();

  useEffect(() => {
    fetchUsers();
    fetchCancelledReminders();
    fetchPendingReminders();
    fetchCurrentUser();
  }, [company.id]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

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

  const fetchCancelledReminders = async () => {
    const { data } = await supabase
      .from("scheduled_reminders")
      .select("company_user_id")
      .eq("company_id", company.id)
      .eq("status", "cancelled");

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((r) => {
        counts[r.company_user_id] = (counts[r.company_user_id] || 0) + 1;
      });
      setCancelledReminders(counts);
    }
  };

  const fetchPendingReminders = async () => {
    const { data } = await supabase
      .from("scheduled_reminders")
      .select("company_user_id")
      .eq("company_id", company.id)
      .eq("status", "pending");

    if (data) {
      const userIds = new Set(data.map((r) => r.company_user_id));
      setPendingReminders(userIds);
    }
  };

  // Filter users based on selected filter
  const filteredUsers = users.filter((user) => {
    switch (userFilter) {
      case 'pending_reminders':
        return pendingReminders.has(user.id);
      case 'completed':
        return user.assessment_completed_at !== null;
      default:
        return true;
    }
  });

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

      // Show billing info if charged (now pro-rated)
      const proRatedAmount = data.billing?.proRatedAmount;
      let billingMsg = "";
      if (data.billing?.charged) {
        billingMsg = proRatedAmount 
          ? ` (Card charged $${(proRatedAmount / 100).toFixed(2)} pro-rated)` 
          : " (Card charged)";
      } else if (data.billing?.usedCredits) {
        billingMsg = proRatedAmount 
          ? ` (Used $${(proRatedAmount / 100).toFixed(2)} credit pro-rated)` 
          : " (Used billing credit)";
      }

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
      // Get the user being revoked
      const userToRevoke = users.find(u => u.id === userId);
      
      // Revoke access first
      const { error } = await supabase.from("company_users").update({ status: "revoked" }).eq("id", userId);

      if (error) throw error;

      // Calculate and apply pro-rated refund for active employees
      if (userToRevoke?.role === 'employee' && userToRevoke?.status === 'active') {
        try {
          const { data: refundData } = await supabase.functions.invoke("calculate-user-refund", {
            body: {
              company_id: company.id,
              company_user_id: userId,
            },
          });

          if (refundData?.refunded) {
            toast({
              title: "Access revoked",
              description: `User access has been revoked. $${(refundData.refundAmount / 100).toFixed(2)} credit added to your balance.`,
            });
            if (onCompanyUpdate) onCompanyUpdate();
            fetchUsers();
            return;
          }
        } catch (refundError) {
          console.error("Error calculating refund:", refundError);
          // Continue even if refund fails
        }
      }

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

  const handleRestoreAccess = async (userId: string) => {
    try {
      // Check if there are available seats before restoring
      if (!isUnlimitedCompany && getAvailableSeats() <= 0) {
        toast({
          title: "No available seats",
          description: "Please add more seats before restoring this user's access.",
          variant: "destructive",
        });
        return;
      }

      // Get the user being restored
      const userToRestore = users.find(u => u.id === userId);
      
      // Determine the appropriate status based on whether they completed assessment
      const newStatus = userToRestore?.assessment_completed_at ? 'active' : 'invited';

      const { error } = await supabase
        .from("company_users")
        .update({ status: newStatus })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Access restored",
        description: `User access has been restored (status: ${newStatus})`,
      });

      fetchUsers();
      if (onCompanyUpdate) onCompanyUpdate();
    } catch (error: any) {
      toast({
        title: "Error restoring access",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRequestRetake = async (userId: string) => {
    setRequestingRetake(true);
    try {
      // Reset the assessment fields to allow retake
      const { error } = await supabase
        .from("company_users")
        .update({ 
          assessment_completed_at: null,
          assessment_result_id: null,
          status: 'invited'
        })
        .eq("id", userId);

      if (error) throw error;

      // Send a notification email to the employee
      const user = users.find(u => u.id === userId);
      if (user) {
        try {
          await supabase.functions.invoke("resend-invite", {
            body: { user_id: userId }
          });
        } catch (emailError) {
          console.error("Error sending retake email:", emailError);
          // Continue even if email fails - the reset was still successful
        }
      }

      toast({
        title: "Retake requested",
        description: `${user?.email || 'User'} has been notified to retake the assessment.`,
      });

      setRetakeRequestUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error requesting retake",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRequestingRetake(false);
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

  const handleUpdateFullName = async (userId: string, fullName: string) => {
    setSavingUserId(userId);
    try {
      const { error } = await supabase.from("company_users").update({ full_name: fullName }).eq("id", userId);

      if (error) throw error;

      setUsers(users.map((u) => (u.id === userId ? { ...u, full_name: fullName } : u)));

      toast({
        title: "Full name updated",
        description: `Name set to ${fullName}`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating full name",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingUserId(null);
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

  const handleUpdateAssessmentConfig = async (userId: string, field: 'category' | 'type', value: string) => {
    setSavingUserId(userId);
    try {
      const updateData = field === 'category' 
        ? { assessment_category: value }
        : { assessment_type: value };
      
      const { error } = await supabase.from("company_users").update(updateData).eq("id", userId);

      if (error) throw error;

      setUsers(users.map((u) => (u.id === userId ? { ...u, ...updateData } : u)));

      toast({
        title: "Assessment configuration updated",
        description: field === 'category' 
          ? `Category set to ${value}` 
          : `Length set to ${value === '25q' ? '25' : '50'} questions`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating assessment config",
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
      <div className="space-y-4">
        <Card className="border-0 shadow-sm" data-tour="invite-section">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Invite New User</CardTitle>
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
                <div className="flex gap-4" data-tour="bulk-actions">
                  <Button 
                    onClick={() => setShowInviteUser(true)} 
                    disabled={!isUnlimitedCompany && getAvailableSeats() <= 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowInviteAdmin(true)}
                    disabled={!isUnlimitedCompany && getAvailableSeats() <= 0}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Invite Admin
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowBulkImport(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Import
                  </Button>
                  {company.google_sso_enabled && (
                    <>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowGoogleImport(true)}
                      >
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Google Import
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowGoogleSync(true)}
                      >
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Sync Users
                      </Button>
                    </>
                  )}
                </div>
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

        <Card className="border-0 shadow-sm" data-tour="users-table">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Team Members</CardTitle>
              <div className="flex items-center gap-2">
                {/* Filter Dropdown */}
                <Select value={userFilter} onValueChange={(value) => setUserFilter(value as UserFilter)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="pending_reminders">Pending Reminders</SelectItem>
                    <SelectItem value="completed">Completed Assessment</SelectItem>
                  </SelectContent>
                </Select>
                {/* Schedule Reminder Button */}
                {selectedUsers.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReminderModal(true)}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Schedule Reminder ({selectedUsers.size})
                  </Button>
                )}
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
                  <TableHead className="w-10">
                    <Checkbox
                      checked={users.filter(u => u.status === 'invited' && !u.assessment_completed_at).length > 0 &&
                        users.filter(u => u.status === 'invited' && !u.assessment_completed_at).every(u => selectedUsers.has(u.id))}
                      onCheckedChange={(checked) => {
                        const incompleteUsers = users.filter(u => u.status === 'invited' && !u.assessment_completed_at);
                        if (checked) {
                          setSelectedUsers(new Set(incompleteUsers.map(u => u.id)));
                        } else {
                          setSelectedUsers(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Job Role</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invite Code</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <>
                    <TableRow key={user.id} className="transition-colors hover:bg-muted/50">
                      <TableCell>
                        {user.status === 'invited' && !user.assessment_completed_at ? (
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedUsers);
                              if (checked) {
                                newSelected.add(user.id);
                              } else {
                                newSelected.delete(user.id);
                              }
                              setSelectedUsers(newSelected);
                            }}
                          />
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {user.full_name || <span className="text-muted-foreground">Not set</span>}
                        </span>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={user.role === 'employee' ? 'secondary' : 'default'}
                            className={
                              user.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' :
                              user.role === 'hr' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                              user.role === 'partner' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                              ''
                            }
                          >
                            {user.role === 'admin' ? 'Admin' :
                             user.role === 'hr' ? 'HR' :
                             user.role === 'partner' ? 'Partner' :
                             'Employee'}
                          </Badge>
                          {user.role === "admin" && user.id === superAdminId && (
                            <Badge variant="outline" className="text-xs">Owner</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {user.job_role || <span className="text-muted-foreground">Not set</span>}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{user.skills?.length || 0} skills</span>
                      </TableCell>
                      <TableCell>
                        {user.assessment_category && user.assessment_type ? (
                          <Badge variant="outline" className="text-xs capitalize">
                            {user.assessment_category} • {user.assessment_type.toUpperCase()}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(user.status)}
                          {cancelledReminders[user.id] && user.assessment_completed_at && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="gap-1 text-xs border-primary/30 text-primary">
                                  <Bell className="h-3 w-3" />
                                  Auto-cancelled
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                {cancelledReminders[user.id]} reminder(s) auto-cancelled when assessment was completed
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
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
                          {user.role !== "admin" && user.status === "active" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setPromoteUser({ id: user.id, email: user.email, full_name: user.full_name })}
                                >
                                  <ShieldPlus className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Promote to Admin</TooltipContent>
                            </Tooltip>
                          )}
                          {/* Super Admin can manage other admins/hr/partners */}
                          {user.role !== "employee" && isSuperAdmin && user.id !== superAdminId && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                onClick={() => setManageAdmin({ 
                                    id: user.id, 
                                    email: user.email, 
                                    full_name: user.full_name,
                                    status: user.status,
                                    role: user.role
                                  })}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Manage {user.role === 'admin' ? 'Admin' : user.role === 'hr' ? 'HR' : 'Partner'}</TooltipContent>
                            </Tooltip>
                          )}
                          {/* Request Retake - only for employees with completed assessments */}
                          {user.role === "employee" && user.status === "active" && user.assessment_completed_at && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-amber-600 hover:bg-amber-600 hover:text-white"
                                  onClick={() => setRetakeRequestUser({ id: user.id, email: user.email, full_name: user.full_name })}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Request retake</TooltipContent>
                            </Tooltip>
                          )}
                          {user.role === "employee" && user.status !== "revoked" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="destructive" size="sm" onClick={() => handleRevokeAccess(user.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Revoke access</TooltipContent>
                            </Tooltip>
                          )}
                          {user.status === "revoked" && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 hover:bg-green-600 hover:text-white"
                                    onClick={() => handleRestoreAccess(user.id)}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Restore access</TooltipContent>
                              </Tooltip>
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
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedUserId === user.id && (
                      <TableRow key={`${user.id}-expanded`}>
                      <TableCell colSpan={11}>
                          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                            <div className="grid grid-cols-3 gap-6">
                              {/* Full Name Section */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="Enter full name..."
                                    value={fullNameInput[user.id] ?? user.full_name ?? ""}
                                    onChange={(e) => setFullNameInput(prev => ({ ...prev, [user.id]: e.target.value }))}
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        const name = fullNameInput[user.id]?.trim() || "";
                                        if (name) {
                                          handleUpdateFullName(user.id, name);
                                        }
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const name = fullNameInput[user.id]?.trim() || "";
                                      if (name) {
                                        handleUpdateFullName(user.id, name);
                                      }
                                    }}
                                    disabled={!(fullNameInput[user.id]?.trim()) || savingUserId === user.id}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

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

                              {/* Assessment Type Section */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Assessment Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <Select
                                    value={user.assessment_category || ""}
                                    onValueChange={(value) => handleUpdateAssessmentConfig(user.id, 'category', value)}
                                    disabled={savingUserId === user.id || user.assessment_completed_at}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="professional">Professional</SelectItem>
                                      <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                                      <SelectItem value="executive">Executive</SelectItem>
                                      <SelectItem value="manager">Manager</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Select
                                    value={user.assessment_type || ""}
                                    onValueChange={(value) => handleUpdateAssessmentConfig(user.id, 'type', value)}
                                    disabled={savingUserId === user.id || user.assessment_completed_at}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select length" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="25q">25 Questions</SelectItem>
                                      <SelectItem value="50q">50 Questions</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {user.assessment_completed_at && (
                                  <p className="text-xs text-muted-foreground">Assessment already completed - cannot change type</p>
                                )}
                                {!user.assessment_category && !user.assessment_type && !user.assessment_completed_at && (
                                  <p className="text-xs text-amber-600">⚠️ No assessment assigned - user cannot take assessment</p>
                                )}
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
        {/* Bulk Import Modal */}
        <BulkImportModal
          open={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          companyId={company.id}
          onImportComplete={() => {
            fetchUsers();
            if (onCompanyUpdate) onCompanyUpdate();
          }}
        />
        {/* Schedule Reminder Modal */}
        <ScheduleReminderModal
          open={showReminderModal}
          onClose={() => setShowReminderModal(false)}
          companyId={company.id}
          selectedUsers={users
            .filter(u => selectedUsers.has(u.id))
            .map(u => ({ id: u.id, email: u.email, full_name: u.full_name }))}
          onScheduled={() => {
            setSelectedUsers(new Set());
          }}
        />
        {/* Google Workspace Import Modal */}
        <GoogleWorkspaceImportModal
          open={showGoogleImport}
          onOpenChange={setShowGoogleImport}
          companyId={company.id}
          companyDomain={company.google_workspace_domain}
          existingEmails={users.map(u => u.email.toLowerCase())}
          onImportComplete={() => {
            fetchUsers();
            if (onCompanyUpdate) onCompanyUpdate();
          }}
          mode="import"
        />
        {/* Google Workspace Sync Modal */}
        <GoogleWorkspaceImportModal
          open={showGoogleSync}
          onOpenChange={setShowGoogleSync}
          companyId={company.id}
          companyDomain={company.google_workspace_domain}
          existingEmails={users.map(u => u.email.toLowerCase())}
          onImportComplete={() => {
            fetchUsers();
            if (onCompanyUpdate) onCompanyUpdate();
          }}
          mode="sync"
        />
        {/* Invite Admin Modal */}
        <InviteAdminModal
          open={showInviteAdmin}
          onClose={() => setShowInviteAdmin(false)}
          companyId={company.id}
          onInviteComplete={() => {
            fetchUsers();
            if (onCompanyUpdate) onCompanyUpdate();
          }}
        />
        {/* Promote to Admin Modal */}
        <PromoteToAdminModal
          open={!!promoteUser}
          onClose={() => setPromoteUser(null)}
          user={promoteUser}
          onPromoteComplete={() => {
            fetchUsers();
            if (onCompanyUpdate) onCompanyUpdate();
          }}
        />
        {/* Manage Admin Modal (Super Admin only) */}
        <ManageAdminModal
          open={!!manageAdmin}
          onClose={() => setManageAdmin(null)}
          admin={manageAdmin}
          onActionComplete={() => {
            fetchUsers();
            if (onCompanyUpdate) onCompanyUpdate();
          }}
        />
        {/* Invite User Modal */}
        <InviteUserModal
          open={showInviteUser}
          onClose={() => setShowInviteUser(false)}
          companyId={company.id}
          onInviteComplete={fetchUsers}
          onCompanyUpdate={onCompanyUpdate}
          availableSeats={getAvailableSeats()}
          isUnlimitedCompany={isUnlimitedCompany}
        />
        {/* Request Retake Confirmation Dialog */}
        <AlertDialog open={!!retakeRequestUser} onOpenChange={(open) => !open && setRetakeRequestUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Request Assessment Retake</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to request <span className="font-medium">{retakeRequestUser?.full_name || retakeRequestUser?.email}</span> to retake their assessment? 
                <br /><br />
                This will clear their existing results and send them a new invitation email.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={requestingRetake}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => retakeRequestUser && handleRequestRetake(retakeRequestUser.id)}
                disabled={requestingRetake}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {requestingRetake ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  "Request Retake"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
