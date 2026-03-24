import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TruncatedText } from "@/components/ui/truncated-text";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";
import {
  Plus,
  Mail,
  Trash2,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
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
  Sparkles,
  Eye,
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

import { FunctionsHttpError } from '@supabase/supabase-js';
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/auditLogger';
import EmailTemplateCustomizer from './EmailTemplateCustomizer';
import BulkImportModal from './BulkImportModal';
import ScheduleReminderModal from './ScheduleReminderModal';
import GoogleWorkspaceImportModal from './GoogleWorkspaceImportModal';
import InviteAdminModal from './InviteAdminModal';
import PromoteToAdminModal from './PromoteToAdminModal';
import ManageAdminModal from './ManageAdminModal';
import InviteUserModal from './InviteUserModal';
import UserDetailModal from './UserDetailModal';
import UserProfileSheet from './UserProfileSheet';
import { invalidateAssessmentsCache } from './AssessmentsTab';

interface UsersTabProps {
  company: any;
  onCompanyUpdate?: () => void;
  readOnly?: boolean; // For partners: view-only mode, no editing/inviting
  selectedUserId?: string | null; // Open profile for this user
  onClearSelectedUser?: () => void; // Clear the selected user
}

const MAX_INVITES = 3;
const RCF_SUPER_ADMIN_EMAILS = [
  'sanjay@rolecolorfinder.com',
  'tristan@rolecolorfinder.com',
  'aaron@rolecolor.com',
  'kody@rolecolor.com',
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

const getFriendlyCardDeclineMessage = (declineCode?: string, fallbackMessage?: string) => {
  const code = (declineCode || '').toLowerCase();

  if (code === 'transaction_not_allowed') {
    return 'This card cannot be used for this type of purchase. Please try another card or contact your bank.';
  }
  if (code === 'insufficient_funds') {
    return 'Your bank reported insufficient funds. Please use a different card or try again later.';
  }
  if (code === 'do_not_honor' || code === 'card_declined') {
    return 'Your bank declined the charge. Please try another card or contact your bank.';
  }
  if (code === 'expired_card') {
    return 'This card is expired. Please update your payment method.';
  }
  if (code === 'incorrect_cvc' || code === 'invalid_cvc') {
    return 'Your card security code could not be verified. Please update your payment method.';
  }
  if (code === 'processing_error') {
    return 'Your bank could not process this charge right now. Please try again in a moment.';
  }

  return fallbackMessage || 'Your card could not be charged. Please try another card or contact your bank.';
};

type UserFilter = 'all' | 'pending_reminders' | 'completed';

export default function UsersTab({ company, onCompanyUpdate, readOnly = false, selectedUserId, onClearSelectedUser }: UsersTabProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [allJobRoles, setAllJobRoles] = useState<string[]>([]);
  
  const [fullNameInput, setFullNameInput] = useState<Record<string, string>>({});
  const [emailInput, setEmailInput] = useState<Record<string, string>>({});
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
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [retakeRequestUser, setRetakeRequestUser] = useState<{ id: string; email: string; full_name?: string } | null>(null);
  const [requestingRetake, setRequestingRetake] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<{
    id: string;
    email: string;
    full_name?: string;
  } | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [adminDeleteTarget, setAdminDeleteTarget] = useState<{
    id: string;
    email: string;
    full_name?: string;
    role: string;
    user_id?: string | null;
  } | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState(false);
  const [suggestingSkillsFor, setSuggestingSkillsFor] = useState<string | null>(null);
  const [suggestedSkills, setSuggestedSkills] = useState<Record<string, string[]>>({});
  const [mobileSelectedUser, setMobileSelectedUser] = useState<any | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [pendingEmailChange, setPendingEmailChange] = useState<{
    id: string;
    currentEmail: string;
    newEmail: string;
    full_name?: string;
  } | null>(null);
  const [changingEmail, setChangingEmail] = useState(false);
  const [jobRoleInput, setJobRoleInput] = useState<Record<string, string>>({});
  const [showJobChangeConfirmed, setShowJobChangeConfirmed] = useState(false);
  const [paymentError, setPaymentError] = useState<{ title: string; message: string } | null>(null);
  const jobChangeConfirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamMembersCardRef = useRef<HTMLDivElement | null>(null);
  const usersTableScrollRef = useRef<HTMLDivElement | null>(null);
  const [hasScrolledFromTop, setHasScrolledFromTop] = useState(false);
  const [isTeamMembersVisible, setIsTeamMembersVisible] = useState(false);
  const { toast } = useToast();
  const { permissions } = useCompany();

  // Handle external selectedUserId prop
  useEffect(() => {
    if (selectedUserId) {
      setProfileUserId(selectedUserId);
      setShowProfileSheet(true);
    }
  }, [selectedUserId]);

  useEffect(() => {
    return () => {
      if (jobChangeConfirmTimerRef.current) {
        clearTimeout(jobChangeConfirmTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const updateFloatingScrollerVisibility = () => {
      const cardElement = teamMembersCardRef.current;
      if (!cardElement) return;

      const rect = cardElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const isVisible = rect.top < viewportHeight - 40 && rect.bottom > 120;
      const pageScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const movedDownFromTop = pageScrollY > 40;

      setIsTeamMembersVisible(isVisible);
      setHasScrolledFromTop(movedDownFromTop);
    };

    updateFloatingScrollerVisibility();
    window.addEventListener('resize', updateFloatingScrollerVisibility);
    document.addEventListener('scroll', updateFloatingScrollerVisibility, true);

    return () => {
      window.removeEventListener('resize', updateFloatingScrollerVisibility);
      document.removeEventListener('scroll', updateFloatingScrollerVisibility, true);
    };
  }, []);

  // Identify the super admin (first admin created for the company)
  const superAdminId = users
    .filter(u => u.role === 'admin')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]?.id;

  // Check if current user is the super admin
  const isSuperAdmin = currentUserId ? users.some(u => u.id === superAdminId && u.user_id === currentUserId) : false;

  useEffect(() => {
    fetchUsers();
    fetchCompanyRoles();
    fetchCancelledReminders();
    fetchPendingReminders();
    fetchCurrentUser();
  }, [company.id]);

  const fetchCompanyRoles = async () => {
    const { data, error } = await supabase
      .from('company_roles')
      .select('name')
      .eq('company_id', company.id)
      .order('name');

    if (error) {
      console.error('Error fetching company roles:', error);
      setAllJobRoles([]);
      return;
    }

    setAllJobRoles((data || []).map((role) => role.name).filter(Boolean));
  };

  const syncJobRoleToCompanyRoles = async (jobRole: string) => {
    const normalizedRole = jobRole.trim();
    if (!normalizedRole) return;

    const roleAlreadyInState = allJobRoles.some(
      (existingRole) => existingRole.toLowerCase() === normalizedRole.toLowerCase()
    );

    if (roleAlreadyInState) return;

    try {
      const { data: existingRole, error: existingRoleError } = await supabase
        .from('company_roles')
        .select('name')
        .eq('company_id', company.id)
        .ilike('name', normalizedRole)
        .limit(1)
        .maybeSingle();

      if (existingRoleError) throw existingRoleError;

      if (existingRole?.name) {
        setAllJobRoles((prev) => [...new Set([...prev, existingRole.name])].sort());
        return;
      }

      const { data: insertedRole, error: insertError } = await supabase
        .from('company_roles')
        .insert({
          company_id: company.id,
          name: normalizedRole,
          description: null,
          skills: [],
        })
        .select('name')
        .single();

      if (insertError) throw insertError;

      if (insertedRole?.name) {
        setAllJobRoles((prev) => [...new Set([...prev, insertedRole.name])].sort());
      }
    } catch (error) {
      console.error('Error syncing job role to company roles:', error);
    }
  };

  const fetchRoleSkillsForJobRole = async (jobRole: string): Promise<string[] | null> => {
    const normalizedRole = jobRole.trim();
    if (!normalizedRole) return null;

    try {
      const { data: role, error } = await supabase
        .from('company_roles')
        .select('skills')
        .eq('company_id', company.id)
        .ilike('name', normalizedRole)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return Array.isArray(role?.skills) ? role.skills : [];
    } catch (error) {
      console.error('Error fetching role skills for job role sync:', error);
      return null;
    }
  };

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      setCurrentUserEmail(user.email?.toLowerCase() || null);
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

    try {
      const { data, error } = await supabase.functions.invoke("invite-company-user", {
        body: {
          company_id: company.id,
          email: newUserEmail,
        },
      });

      if (error) {
        // Extract structured body from non-2xx edge function responses
        let payload: Record<string, any> | null = null;
        if (error instanceof FunctionsHttpError) {
          payload = await error.context.json().catch(() => null);
        }
        const errData = payload ?? data;
        if (errData?.errorCode === "NEEDS_PAYMENT_METHOD" || errData?.needsPaymentMethod) {
          setPaymentError({
            title: "Payment method required",
            message: "No payment method is on file. Add one in Settings to invite users beyond the 2-user minimum.",
          });
          return;
        }
        if (errData?.errorCode === "CARD_DECLINED") {
          const userMessage = getFriendlyCardDeclineMessage(errData?.declineCode, errData?.error);
          setPaymentError({
            title: "Card charge failed",
            message: `${userMessage}${errData?.declineCode ? ` (Reference: ${errData.declineCode})` : ''}`,
          });
          return;
        }
        if (errData?.errorCode === "REQUIRES_AUTHENTICATION") {
          setPaymentError({
            title: "Card authentication required",
            message: `${errData?.error || "Your bank requires authentication for this card. Please update your payment method in Settings and try again."}${errData?.declineCode ? ` (Code: ${errData.declineCode})` : ''}`,
          });
          return;
        }
        if (errData?.errorCode === "CHARGE_FAILED") {
          setPaymentError({
            title: "Payment failed",
            message: `${errData?.error || "There was an issue charging your card. Please check your payment method in Settings."}${errData?.errorCode ? ` (Code: ${errData.errorCode})` : ''}`,
          });
          return;
        }
        throw new Error(payload?.error || error.message);
      }

      // Check if the response contains an error message
      if (data?.error) {
        if (data.errorCode === "NEEDS_PAYMENT_METHOD" || data.needsPaymentMethod) {
          setPaymentError({
            title: "Payment method required",
            message: "No payment method is on file. Add one in Settings to invite users beyond the 2-user minimum.",
          });
          return;
        }
        if (data.errorCode === "CARD_DECLINED") {
          const userMessage = getFriendlyCardDeclineMessage(data.declineCode, data.error);
          setPaymentError({
            title: "Card charge failed",
            message: `${userMessage}${data.declineCode ? ` (Reference: ${data.declineCode})` : ''}`,
          });
          return;
        }
        if (data.errorCode === "REQUIRES_AUTHENTICATION") {
          setPaymentError({
            title: "Card authentication required",
            message: `${data.error || "Your bank requires authentication for this card. Please update your payment method in Settings and try again."}${data.declineCode ? ` (Code: ${data.declineCode})` : ''}`,
          });
          return;
        }
        if (data.errorCode === "CHARGE_FAILED") {
          setPaymentError({
            title: "Payment failed",
            message: `${data.error || "There was an issue charging your card. Please check your payment method in Settings."}${data.errorCode ? ` (Code: ${data.errorCode})` : ''}`,
          });
          return;
        }
        throw new Error(data.error);
      }

      // Show billing info in success toast
      const billing = data.billing;
      const proRatedAmount = billing?.proRatedAmount;
      let billingMsg = "";
      if (billing?.charged) {
        billingMsg = proRatedAmount 
          ? ` (Card charged $${(proRatedAmount / 100).toFixed(2)} pro-rated)` 
          : " (Card charged)";
      } else if (billing?.usedCredits) {
        billingMsg = proRatedAmount 
          ? ` (Used $${(proRatedAmount / 100).toFixed(2)} billing credit)` 
          : " (Used billing credit)";
      } else if (billing?.withinBaselineUsers || billing?.withinPrePaidSeats) {
        const used = (billing.seatsUsed ?? 0) + 1;
        const total = billing.baselineUsers ?? billing.seatsPurchased ?? '?';
        billingMsg = ` (Included user ${used}/${total} — charges start after user ${total})`;
      }

      toast({
        title: "User invited!",
        description: `Invitation sent to ${newUserEmail}${billingMsg}`,
      });

      logAuditEvent({
        companyId: company.id,
        action: AUDIT_ACTIONS.USER_INVITED,
        entityType: AUDIT_ENTITIES.USER,
        details: { email: newUserEmail },
      });

      setNewUserEmail("");
      fetchUsers();
      if (onCompanyUpdate) onCompanyUpdate(); // Refresh company data to update credit balance
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred";
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

      logAuditEvent({
        companyId: company.id,
        action: AUDIT_ACTIONS.USER_REVOKED,
        entityType: AUDIT_ENTITIES.USER,
        entityId: userId,
        details: { email: userToRevoke?.email, full_name: userToRevoke?.full_name },
      });

      toast({
        title: "Access revoked",
        description: "User access has been revoked. The current month remains fully billed with no refund or credit; only future charges stop.",
      });

      invalidateAssessmentsCache(company.id);
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

      invalidateAssessmentsCache(company.id);
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

  const handleRestoreAndPromote = async (user: { id: string; email: string; full_name?: string }) => {
    try {
      const userToRestore = users.find(u => u.id === user.id);
      const newStatus = userToRestore?.assessment_completed_at ? 'active' : 'invited';

      const { error } = await supabase
        .from("company_users")
        .update({ status: newStatus })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Access restored",
        description: `User access restored. Choose a role to promote them again.`,
      });

      invalidateAssessmentsCache(company.id);
      await fetchUsers();
      if (onCompanyUpdate) onCompanyUpdate();
      setPromoteUser(user);
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
      invalidateAssessmentsCache(company.id);
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
    const userToDelete = users.find((u) => u.id === userId);
    if (!userToDelete) return;

    setDeleteUserTarget({
      id: userToDelete.id,
      email: userToDelete.email,
      full_name: userToDelete.full_name,
    });
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteUserTarget) return;

    setDeletingUser(true);
    try {
      // First, clear any task assignments that reference this user
      const { error: primaryError } = await supabase
        .from("task_assignments")
        .update({ primary_assignee_id: null })
        .eq("primary_assignee_id", deleteUserTarget.id);

      if (primaryError) {
        console.error("Error clearing primary assignments:", primaryError);
      }

      const { error: secondaryError } = await supabase
        .from("task_assignments")
        .update({ secondary_assignee_id: null })
        .eq("secondary_assignee_id", deleteUserTarget.id);

      if (secondaryError) {
        console.error("Error clearing secondary assignments:", secondaryError);
      }

      // Now delete the user
      const { error } = await supabase
        .from("company_users")
        .delete()
        .eq("id", deleteUserTarget.id)
        .eq("status", "revoked"); // Only allow deleting revoked users

      if (error) throw error;

      toast({
        title: "User deleted",
        description: "User has been permanently removed. This month’s charge remains and the user will not be billed next month.",
      });

      setDeleteUserTarget(null);
      invalidateAssessmentsCache(company.id);
      fetchUsers();
      if (onCompanyUpdate) onCompanyUpdate();
    } catch (error: any) {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingUser(false);
    }
  };

  const isCurrentUserRecord = (user: any) => {
    const rowEmail = (user?.email || '').toLowerCase();
    return (currentUserId && user?.user_id === currentUserId) || (currentUserEmail && rowEmail === currentUserEmail);
  };

  const isRcfSuperAdminAccount = (user: any) => {
    const rowEmail = (user?.email || '').toLowerCase();
    return RCF_SUPER_ADMIN_EMAILS.includes(rowEmail);
  };

  const canManageAdminLevelUser = (user: any) => {
    if (!permissions.canManageAllRoles) return false;
    if (user?.role === 'employee') return false;
    if (isCurrentUserRecord(user)) return false;
    if (user?.id === superAdminId) return false;
    if (isRcfSuperAdminAccount(user)) return false;

    // Admins keep all permissions except managing/removing admin or super-admin accounts.
    if (user?.role === 'admin' && !isSuperAdmin) return false;

    return true;
  };

  const handleDeleteAdmin = async () => {
    if (!adminDeleteTarget) return;

    if (isRcfSuperAdminAccount(adminDeleteTarget)) {
      toast({
        title: "Action blocked",
        description: "You cannot remove an RCF super-admin account.",
        variant: "destructive",
      });
      return;
    }

    if (adminDeleteTarget.role === 'admin' && !isSuperAdmin) {
      toast({
        title: "Action blocked",
        description: "Only the company owner can remove admin accounts.",
        variant: "destructive",
      });
      return;
    }

    if (isCurrentUserRecord(adminDeleteTarget)) {
      toast({
        title: "Action blocked",
        description: "You cannot delete your own admin account.",
        variant: "destructive",
      });
      return;
    }

    setDeletingAdmin(true);
    try {
      const { error: primaryError } = await supabase
        .from("task_assignments")
        .update({ primary_assignee_id: null })
        .eq("primary_assignee_id", adminDeleteTarget.id);

      if (primaryError) {
        console.error("Error clearing primary assignments:", primaryError);
      }

      const { error: secondaryError } = await supabase
        .from("task_assignments")
        .update({ secondary_assignee_id: null })
        .eq("secondary_assignee_id", adminDeleteTarget.id);

      if (secondaryError) {
        console.error("Error clearing secondary assignments:", secondaryError);
      }

      const { error: deleteError } = await supabase
        .from("company_users")
        .delete()
        .eq("id", adminDeleteTarget.id);

      if (deleteError) throw deleteError;

      toast({
        title: "Admin deleted",
        description: `${adminDeleteTarget.full_name || adminDeleteTarget.email} has been removed.`,
      });

      setAdminDeleteTarget(null);
      invalidateAssessmentsCache(company.id);
      fetchUsers();
      if (onCompanyUpdate) onCompanyUpdate();
    } catch (error: any) {
      toast({
        title: "Error deleting admin",
        description: error?.message || "Unable to delete this admin right now.",
        variant: "destructive",
      });
    } finally {
      setDeletingAdmin(false);
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

  const isValidEmail = (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  };

  const generateFallbackInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const requestEmailChange = (user: any) => {
    const draftEmail = (emailInput[user.id] ?? user.email ?? '').trim().toLowerCase();
    const currentEmail = (user.email ?? '').trim().toLowerCase();

    if (!draftEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address.',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidEmail(draftEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    if (draftEmail === currentEmail) {
      toast({
        title: 'No change detected',
        description: 'Enter a different email to update this user.',
      });
      return;
    }

    const duplicateUser = users.find(
      (existingUser) =>
        existingUser.id !== user.id &&
        (existingUser.email || '').toLowerCase() === draftEmail,
    );

    if (duplicateUser) {
      toast({
        title: 'Email already in use',
        description: 'Another user in this company already uses this email.',
        variant: 'destructive',
      });
      return;
    }

    setPendingEmailChange({
      id: user.id,
      currentEmail,
      newEmail: draftEmail,
      full_name: user.full_name,
    });
  };

  const handleConfirmEmailChange = async () => {
    if (!pendingEmailChange) return;

    setChangingEmail(true);
    setSavingUserId(pendingEmailChange.id);

    try {
      const { data: existingMatch, error: lookupError } = await supabase
        .from('company_users')
        .select('id')
        .eq('company_id', company.id)
        .ilike('email', pendingEmailChange.newEmail)
        .neq('id', pendingEmailChange.id)
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (existingMatch) {
        toast({
          title: 'Email already in use',
          description: 'Another user in this company already uses this email.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('update-company-user-email', {
        body: {
          company_user_id: pendingEmailChange.id,
          new_email: pendingEmailChange.newEmail,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const updatedUser = data?.user;

      setUsers((prevUsers) =>
        prevUsers.map((existingUser) =>
          existingUser.id === pendingEmailChange.id
            ? {
                ...existingUser,
                ...(updatedUser || {}),
              }
            : existingUser,
        ),
      );

      setEmailInput((prev) => ({ ...prev, [pendingEmailChange.id]: pendingEmailChange.newEmail }));

      const requiresRelogin = Boolean(data?.authEmailUpdated && currentUserId && updatedUser?.user_id === currentUserId);

      toast({
        title: 'Email updated',
        description: requiresRelogin
          ? 'Email updated and access reassigned. Please sign out and sign back in with the new email.'
          : 'Email updated and access reassigned to the new email account.',
      });

      setPendingEmailChange(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error updating email',
        description: error?.message || 'Unable to update email at this time.',
        variant: 'destructive',
      });
    } finally {
      setChangingEmail(false);
      setSavingUserId(null);
    }
  };

  const handleUpdateJobRole = async (userId: string, jobRole: string): Promise<boolean> => {
    const normalizedRole = jobRole.trim();
    setSavingUserId(userId);
    try {
      await syncJobRoleToCompanyRoles(normalizedRole);
      const roleSkills = await fetchRoleSkillsForJobRole(normalizedRole);
      const syncedSkills = roleSkills ?? [];

      const { error } = await supabase
        .from("company_users")
        .update({ job_role: normalizedRole, skills: syncedSkills })
        .eq("id", userId);

      if (error) throw error;

      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, job_role: normalizedRole, skills: syncedSkills } : u)),
      );

      toast({
        title: "Job change confirmed",
        description: `Job role set to ${normalizedRole}. Synced ${syncedSkills.length} role skill${syncedSkills.length === 1 ? "" : "s"}.`,
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Error updating job role",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSavingUserId(null);
    }
  };

  const handleConfirmJobRoleChange = async (user: any) => {
    const selectedRole = (jobRoleInput[user.id] ?? user.job_role ?? "").trim();
    const currentRole = (user.job_role ?? "").trim();

    if (!selectedRole) {
      toast({
        title: "Job role required",
        description: "Please select a job role before confirming.",
        variant: "destructive",
      });
      return;
    }

    if (selectedRole === currentRole) return;

    const updated = await handleUpdateJobRole(user.id, selectedRole);
    if (!updated) return;

    if (jobChangeConfirmTimerRef.current) {
      clearTimeout(jobChangeConfirmTimerRef.current);
    }
    setShowJobChangeConfirmed(true);
    jobChangeConfirmTimerRef.current = setTimeout(() => {
      setShowJobChangeConfirmed(false);
      jobChangeConfirmTimerRef.current = null;
    }, 2500);
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

  const handleSuggestSkills = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user?.job_role) {
      toast({
        title: "Job role required",
        description: "Please set a job role first to get AI skill suggestions",
        variant: "destructive",
      });
      return;
    }

    setSuggestingSkillsFor(userId);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-skills", {
        body: {
          jobRole: user.job_role,
          existingSkills: user.skills || [],
        },
      });

      if (error) throw error;

      if (data?.skills?.length > 0) {
        setSuggestedSkills((prev) => ({ ...prev, [userId]: data.skills }));
        toast({
          title: "Skills suggested",
          description: `AI suggested ${data.skills.length} skills based on the job role`,
        });
      } else {
        toast({
          title: "No suggestions",
          description: "AI couldn't generate skill suggestions for this role",
        });
      }
    } catch (error: any) {
      console.error("Error suggesting skills:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get AI skill suggestions",
        variant: "destructive",
      });
    } finally {
      setSuggestingSkillsFor(null);
    }
  };

  const handleAddSuggestedSkill = async (userId: string, skill: string) => {
    await handleAddSkill(userId, skill);
    // Remove the added skill from suggestions
    setSuggestedSkills((prev) => ({
      ...prev,
      [userId]: (prev[userId] || []).filter((s) => s !== skill),
    }));
  };

  const handleDismissSuggestedSkill = (userId: string, skill: string) => {
    setSuggestedSkills((prev) => ({
      ...prev,
      [userId]: (prev[userId] || []).filter((s) => s !== skill),
    }));
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

  const scrollUsersTable = (direction: 'left' | 'right') => {
    const outerContainer = usersTableScrollRef.current;
    if (!outerContainer) {
      console.warn('[UsersTabScroller] Missing users table container ref.');
      return;
    }

    const innerScroller = outerContainer.querySelector('div.relative.w-full.overflow-auto') as HTMLDivElement | null;
    const tableContainer = innerScroller ?? outerContainer;
    const maxScrollLeft = tableContainer.scrollWidth - tableContainer.clientWidth;
    const beforeScrollLeft = tableContainer.scrollLeft;

    const scrollAmount = Math.max(320, Math.floor(tableContainer.clientWidth * 0.6));
    console.info('[UsersTabScroller] Click', {
      direction,
      usingInnerScroller: Boolean(innerScroller),
      clientWidth: tableContainer.clientWidth,
      scrollWidth: tableContainer.scrollWidth,
      maxScrollLeft,
      beforeScrollLeft,
      scrollAmount,
    });

    if (maxScrollLeft <= 0) {
      console.warn('[UsersTabScroller] No horizontal overflow detected. Nothing to scroll.');
      return;
    }

    tableContainer.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });

    window.setTimeout(() => {
      console.info('[UsersTabScroller] After click', {
        direction,
        afterScrollLeft: tableContainer.scrollLeft,
      });
    }, 220);
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
              {isUnlimitedCompany ? (
                <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
                  ∞ Unlimited
                </Badge>
              ) : (() => {
                const seatsPurchased = 2;
                const activeCount = users.filter((u: any) => u.status !== 'revoked').length;
                if (seatsPurchased > 0) {
                  const withinBaseline = activeCount < seatsPurchased;
                  return (
                    <Badge variant={withinBaseline ? 'secondary' : 'outline'} className={withinBaseline ? '' : 'border-amber-400 text-amber-700 bg-amber-50'}>
                      {withinBaseline
                        ? `${activeCount}/${seatsPurchased} included users used`
                        : `${activeCount} users — charges apply`}
                    </Badge>
                  );
                }
                return null;
              })()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!readOnly && (
            <div className="flex flex-wrap gap-2" data-tour="bulk-actions">
              <Button onClick={() => setShowInviteUser(true)} className="flex-1 sm:flex-none min-w-[120px]">
                <Plus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
              {permissions.canInviteAdmins && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowInviteAdmin(true)}
                  className="flex-1 sm:flex-none min-w-[120px]"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Invite Admin
                </Button>
              )}
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowBulkImport(true)}
                className="hidden sm:flex"
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
            )}
            <p className="text-sm text-muted-foreground">
              Active users: {users.filter((u: any) => u.status !== "revoked").length}
            </p>
          </CardContent>
        </Card>

        {/* Email Template Customizer */}
        <EmailTemplateCustomizer company={company} onUpdate={onCompanyUpdate || (() => {})} />

        <Card ref={teamMembersCardRef} className="border-0 shadow-sm" data-tour="users-table">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-lg font-medium">Team Members</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Dropdown */}
                <Select value={userFilter} onValueChange={(value) => setUserFilter(value as UserFilter)}>
                  <SelectTrigger className="w-[140px] sm:w-[180px]">
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
                      <Copy className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Copy URL</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy employee login URL</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setMobileSelectedUser(user)}
                  className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {user.full_name || <span className="text-muted-foreground">No name</span>}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(user.status)}
                    </div>
                  </div>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              )}
            </div>

            {/* Desktop Table View */}
            <div ref={usersTableScrollRef} className="hidden sm:block overflow-x-scroll users-table-scroll">
            <Table className="min-w-[1400px]">
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
                  <TableHead className="hidden sm:table-cell">Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Job Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Skills</TableHead>
                  <TableHead className="hidden md:table-cell">Assessment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Invite Code</TableHead>
                  <TableHead className="hidden lg:table-cell">Invited</TableHead>
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
                      <TableCell className="max-w-[140px]">
                        <TruncatedText 
                          text={user.full_name} 
                          fallback={<span className="text-muted-foreground">Not set</span>}
                          maxWidth="140px"
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <TruncatedText 
                          text={user.email} 
                          maxWidth="180px"
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
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
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm">
                          {user.job_role || <span className="text-muted-foreground">Not set</span>}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">{user.skills?.length || 0} skills</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
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
                      <TableCell className="hidden md:table-cell">
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
                      <TableCell className="hidden lg:table-cell">{new Date(user.invited_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setProfileUserId(user.id);
                                  setShowProfileSheet(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View profile</TooltipContent>
                          </Tooltip>
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
                          {user.role !== "admin" && user.status === "active" && permissions.canPromoteUsers && (
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
                          {canManageAdminLevelUser(user) && (
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
                              {user.role === "employee" && permissions.canPromoteUsers && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRestoreAndPromote({ id: user.id, email: user.email, full_name: user.full_name })}
                                    >
                                      <ShieldPlus className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Restore and promote</TooltipContent>
                                </Tooltip>
                              )}
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

                              {/* Email Section */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="email"
                                    placeholder="Enter email..."
                                    value={emailInput[user.id] ?? user.email ?? ''}
                                    onChange={(e) => setEmailInput(prev => ({ ...prev, [user.id]: e.target.value }))}
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        requestEmailChange(user);
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => requestEmailChange(user)}
                                    disabled={
                                      !(emailInput[user.id] ?? user.email ?? '').trim() ||
                                      (emailInput[user.id] ?? user.email ?? '').trim().toLowerCase() === (user.email ?? '').toLowerCase() ||
                                      savingUserId === user.id
                                    }
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Changing email removes access for the old email and links this account to the new one.
                                </p>
                              </div>

                              {/* Job Role Section */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Job Role</label>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={jobRoleInput[user.id] ?? user.job_role ?? ""}
                                    onValueChange={(value) =>
                                      setJobRoleInput((prev) => ({ ...prev, [user.id]: value }))
                                    }
                                    disabled={savingUserId === user.id || allJobRoles.length === 0}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select a job role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {allJobRoles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                          {role}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleConfirmJobRoleChange(user)}
                                    disabled={
                                      savingUserId === user.id ||
                                      allJobRoles.length === 0 ||
                                      !(jobRoleInput[user.id] ?? user.job_role ?? "").trim() ||
                                      (jobRoleInput[user.id] ?? user.job_role ?? "").trim() ===
                                        (user.job_role ?? "").trim()
                                    }
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </div>
                                {allJobRoles.length === 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    No roles available. Create roles in the Roles tab first.
                                  </p>
                                )}
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
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium">Skills</label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs gap-1 text-primary hover:text-primary"
                                    onClick={() => handleSuggestSkills(user.id)}
                                    disabled={!user.job_role || suggestingSkillsFor === user.id || savingUserId === user.id}
                                  >
                                    {suggestingSkillsFor === user.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Sparkles className="h-3 w-3" />
                                    )}
                                    AI Suggest
                                  </Button>
                                </div>
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

                                {/* AI Suggested Skills */}
                                {suggestedSkills[user.id]?.length > 0 && (
                                  <div className="space-y-2 mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                    <label className="text-sm font-medium text-primary flex items-center gap-1">
                                      <Sparkles className="h-3 w-3" />
                                      AI Suggested Skills
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                      {suggestedSkills[user.id].map((skill: string) => (
                                        <Badge 
                                          key={skill} 
                                          variant="outline" 
                                          className="flex items-center gap-1 pr-1 border-primary/30 bg-background cursor-pointer hover:bg-primary/10"
                                        >
                                          <button
                                            onClick={() => handleAddSuggestedSkill(user.id, skill)}
                                            className="flex items-center gap-1"
                                            disabled={savingUserId === user.id}
                                          >
                                            <Plus className="h-3 w-3 text-primary" />
                                            {skill}
                                          </button>
                                          <button
                                            onClick={() => handleDismissSuggestedSkill(user.id, skill)}
                                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Click + to add or × to dismiss</p>
                                  </div>
                                )}
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
            </div>
          </CardContent>
        </Card>

        <div
          className={`hidden sm:flex fixed bottom-5 left-1/2 -translate-x-1/2 z-50 items-center gap-1 rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-all duration-300 ${
            hasScrolledFromTop && isTeamMembersVisible
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => scrollUsersTable('left')}
            aria-label="Scroll users table left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => scrollUsersTable('right')}
            aria-label="Scroll users table right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile User Detail Modal */}
        <UserDetailModal
          user={mobileSelectedUser}
          open={!!mobileSelectedUser}
          onOpenChange={(open) => !open && setMobileSelectedUser(null)}
          superAdminId={superAdminId}
          isSuperAdmin={isSuperAdmin}
          currentUserId={currentUserId}
          currentUserEmail={currentUserEmail}
          allJobRoles={allJobRoles}
          predefinedSkills={PREDEFINED_SKILLS}
          copiedId={copiedId}
          resendingId={resendingId}
          savingUserId={savingUserId}
          suggestingSkillsFor={suggestingSkillsFor}
          suggestedSkills={suggestedSkills}
          onCopyCode={handleCopyCode}
          onResendInvite={handleResendInvite}
          onPromoteUser={setPromoteUser}
          onManageAdmin={setManageAdmin}
          onRevokeAccess={handleRevokeAccess}
          onRestoreAccess={handleRestoreAccess}
          onRestoreAndPromote={handleRestoreAndPromote}
          onDeleteUser={handleDeleteUser}
          onRequestRetake={setRetakeRequestUser}
          onSaveUserDetails={async (userId, fullName, jobRole, skills) => {
            setSavingUserId(userId);
            try {
              const normalizedRole = jobRole.trim();
              if (normalizedRole) {
                await syncJobRoleToCompanyRoles(normalizedRole);
              }
              const roleSkills = normalizedRole ? await fetchRoleSkillsForJobRole(normalizedRole) : null;
              const syncedSkills = normalizedRole ? (roleSkills ?? []) : skills;

              const { error } = await supabase
                .from('company_users')
                .update({ full_name: fullName, job_role: normalizedRole || null, skills: syncedSkills })
                .eq('id', userId);
              if (error) throw error;
              toast({ title: 'User updated', description: 'Changes saved successfully.' });
              fetchUsers();
              setMobileSelectedUser(null);
            } catch (err: any) {
              toast({ title: 'Error', description: err.message, variant: 'destructive' });
            } finally {
              setSavingUserId(null);
            }
          }}
          onSuggestSkills={handleSuggestSkills}
          canResend={canResend}
          getResendTooltip={getResendTooltip}
          getStatusBadge={getStatusBadge}
          cancelledReminders={cancelledReminders}
          canPromoteUsers={permissions.canPromoteUsers}
          canManageAllRoles={permissions.canManageAllRoles}
        />

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
          defaultAssessmentType={company.assessment_type}
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
        {/* Manage Admin Modal */}
        <ManageAdminModal
          open={!!manageAdmin}
          onClose={() => setManageAdmin(null)}
          admin={manageAdmin}
          onActionComplete={() => {
            invalidateAssessmentsCache(company.id);
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
          availableSeats={Infinity}
          isUnlimitedCompany={true}
        />
        {/* Change Email Confirmation Dialog */}
        <AlertDialog
          open={!!pendingEmailChange}
          onOpenChange={(open) => {
            if (!open && !changingEmail) {
              setPendingEmailChange(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Email Change</AlertDialogTitle>
              <AlertDialogDescription>
                You are changing <span className="font-medium">{pendingEmailChange?.full_name || 'this user'}</span> from{' '}
                <span className="font-medium">{pendingEmailChange?.currentEmail}</span> to{' '}
                <span className="font-medium">{pendingEmailChange?.newEmail}</span>.
                <br /><br />
                This will revoke access tied to the old email and associate this account with the new email.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={changingEmail}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmEmailChange}
                disabled={changingEmail}
              >
                {changingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Confirm Change'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

        {/* Delete User Confirmation Dialog */}
        <AlertDialog
          open={!!deleteUserTarget}
          onOpenChange={(open) => {
            if (!open && !deletingUser) {
              setDeleteUserTarget(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User Permanently</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete{' '}
                <span className="font-medium">{deleteUserTarget?.full_name || deleteUserTarget?.email}</span>?
                <br /><br />
                You have already paid for this user for the current month. Deleting them now will not remove or refund this month&apos;s charge.
                <br /><br />
                They will simply not be included in next month&apos;s billing.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingUser}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteUser}
                disabled={deletingUser}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {deletingUser ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete User'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Admin Confirmation Dialog */}
        <AlertDialog
          open={!!adminDeleteTarget}
          onOpenChange={(open) => {
            if (!open && !deletingAdmin) {
              setAdminDeleteTarget(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Admin Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete{" "}
                <span className="font-medium">{adminDeleteTarget?.full_name || adminDeleteTarget?.email}</span>?
                <br /><br />
                This removes their {adminDeleteTarget?.role === 'admin' ? 'admin' : adminDeleteTarget?.role === 'hr' ? 'HR' : 'partner'} access and deletes their company user record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingAdmin}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAdmin}
                disabled={deletingAdmin}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {deletingAdmin ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Admin"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* User Profile Sheet */}
        <UserProfileSheet
          userId={profileUserId}
          companyId={company.id}
          open={showProfileSheet}
          onOpenChange={(open) => {
            setShowProfileSheet(open);
            if (!open) {
              setProfileUserId(null);
              onClearSelectedUser?.();
            }
          }}
          readOnly={readOnly || !permissions?.canManageUsers}
          onUserUpdate={fetchUsers}
        />
        {showJobChangeConfirmed && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
            <Alert className="border-primary/40 bg-background shadow-lg">
              <Check className="h-4 w-4 text-primary" />
              <AlertTitle>Job change confirmed</AlertTitle>
              <AlertDescription>Role skills synced successfully.</AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {/* Payment error modal */}
      <AlertDialog open={!!paymentError} onOpenChange={(open) => { if (!open) setPaymentError(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {paymentError?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {paymentError?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPaymentError(null)}>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setPaymentError(null);
                window.dispatchEvent(new CustomEvent('rcf:b2b-guide-tab-change', { detail: { tab: 'settings' } }));
                setTimeout(() => {
                  document.getElementById('payment-method-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 400);
              }}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Go to Payment Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
