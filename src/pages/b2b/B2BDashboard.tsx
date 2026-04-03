import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Building2, Users, ClipboardList, Settings as SettingsIcon, Loader2, LogOut, Brain, CalendarClock, Moon, Sun, Monitor, UserSearch, BarChart3, Target, Shield, Search, ChevronDown, Plus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import OverviewTab from '@/components/b2b/OverviewTab';
import UsersTab from '@/components/b2b/UsersTab';
import AssessmentsTab from '@/components/b2b/AssessmentsTab';
import SettingsTab from '@/components/b2b/SettingsTab';
import { WorkAssigningMatrixTab } from '@/components/b2b/WorkAssigningMatrixTab';
import RemindersHistoryTab from '@/components/b2b/RemindersHistoryTab';
import CandidatesTab from '@/components/b2b/CandidatesTab';
import HiringSection from '@/components/b2b/hiring/HiringSection';
import AdvancedAnalyticsDashboard from '@/components/b2b/analytics/AdvancedAnalyticsDashboard';
import RolesTab from '@/components/b2b/RolesTab';
import EmployeeTasksView from '@/components/b2b/EmployeeTasksView';
import KeyboardShortcutsModal from '@/components/b2b/KeyboardShortcutsModal';
import CreditNotificationModal from '@/components/b2b/CreditNotificationModal';
import TeamFrictionMapTab from '@/components/b2b/TeamFrictionMapTab';
import { useKeyboardShortcuts, B2B_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { B2BThemeProvider, useB2BTheme } from '@/contexts/B2BThemeContext';
import { HelpButton, useAutoStartTour } from '@/components/help';
import MobileBottomNav from '@/components/b2b/MobileBottomNav';
import GlobalSearch from '@/components/b2b/GlobalSearch';
import UserProfileSheet from '@/components/b2b/UserProfileSheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const GUIDE_TABS = new Set(['overview', 'users', 'hiring', 'assessments', 'reminders', 'matrix', 'roles', 'analytics', 'friction-map', 'settings']);

const getEdgeErrorMessage = async (error: unknown): Promise<string> => {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json();
      if (payload?.error && typeof payload.error === 'string') {
        return payload.error;
      }
      if (payload?.message && typeof payload.message === 'string') {
        return payload.message;
      }
    } catch {
      // Ignore parse errors and fall through.
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unexpected error';
};

// Inner component that uses the B2B theme
function B2BDashboardContent() {
  const { company, companyUser, loading, isAdmin, permissions, refreshCompany, allCompanies, switchCompany } = useCompany();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useB2BTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [scrollToSection, setScrollToSection] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [savingBeforeLeave, setSavingBeforeLeave] = useState(false);
  const [settingsSaveHandler, setSettingsSaveHandler] = useState<(() => Promise<boolean>) | null>(null);
  const [creditNotifications, setCreditNotifications] = useState<{ id: string; amount: number; description: string | null }[]>([]);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [resolvingBillingLock, setResolvingBillingLock] = useState(false);
  const [paymentGateLoading, setPaymentGateLoading] = useState(false);
  const [paymentMethodRequired, setPaymentMethodRequired] = useState(false);
  const [paymentGateReason, setPaymentGateReason] = useState<'missing_payment_method' | 'trial_ended_no_payment_method'>('missing_payment_method');
  const [openingPaymentSetup, setOpeningPaymentSetup] = useState(false);
  const [deploymentFeeRequired, setDeploymentFeeRequired] = useState(false);
  const [deploymentFeeLoading, setDeploymentFeeLoading] = useState(false);
  const [deploymentFeeError, setDeploymentFeeError] = useState<string | null>(null);
  const [deploymentFeeActionUrl, setDeploymentFeeActionUrl] = useState<string | null>(null);
  const deploymentFeeAttemptRef = useRef<string | null>(null);
  const deploymentFeeAutoAttemptRef = useRef<string | null>(null);
  const deploymentFeeGateProbeRef = useRef<string | null>(null);
  const switchingCompanyIdRef = useRef<string | null>(null);
  const autoResolveKeyRef = useRef<string | null>(null);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    enabled: true,
    shortcuts: [
      { ...B2B_SHORTCUTS.NAVIGATE_OVERVIEW, action: () => setActiveTab('overview') },
      { ...B2B_SHORTCUTS.NAVIGATE_USERS, action: () => setActiveTab('users') },
      { ...B2B_SHORTCUTS.NAVIGATE_CANDIDATES, action: () => setActiveTab('hiring') },
      { ...B2B_SHORTCUTS.NAVIGATE_ASSESSMENTS, action: () => setActiveTab('assessments') },
      { ...B2B_SHORTCUTS.NAVIGATE_REMINDERS, action: () => setActiveTab('reminders') },
      { ...B2B_SHORTCUTS.NAVIGATE_MATRIX, action: () => setActiveTab('matrix') },
      { ...B2B_SHORTCUTS.NAVIGATE_SETTINGS, action: () => setActiveTab('settings') },
      { ...B2B_SHORTCUTS.HELP, action: () => setShowShortcuts(prev => !prev) },
      { ...B2B_SHORTCUTS.TOGGLE_THEME, action: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark') },
      { key: 'k', ctrl: true, description: 'Open search', action: () => setShowSearch(true) },
      { key: '/', description: 'Open search', action: () => setShowSearch(true) },
    ],
  });

  // Auto-start dashboard tour for first-time admins (hook must be called unconditionally)
  useAutoStartTour('admin-dashboard-overview', 1500, !loading && !!company && isAdmin);

  // Clear the switching overlay once the new company has fully loaded into context
  useEffect(() => {
    if (switching && switchingCompanyIdRef.current && company?.id === switchingCompanyIdRef.current) {
      switchingCompanyIdRef.current = null;
      setSwitching(false);
    }
  }, [company?.id, switching]);

  // When arriving with ?company=<id>, switch to the correct company then clean up the URL.
  // This runs before the dashboard content renders to avoid flashing the wrong company.
  useEffect(() => {
    const companyParam = searchParams.get('company');
    if (!companyParam) return;

    if (loading) return; // wait for context to finish loading

    const found = allCompanies.find((c) => c.company.id === companyParam);
    if (found) {
      if (found.company.id !== company?.id) {
        switchCompany(companyParam);
        // Don't clean URL yet — wait until company.id matches (next render)
        return;
      }
      // Company is now correct — clean up the URL
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('company');
      setSearchParams(nextParams, { replace: true });
    } else {
      // Company not in list yet (e.g. just created) — refresh to fetch it
      refreshCompany();
    }
  }, [loading, searchParams, company?.id, allCompanies]);

  // Check for unseen super-admin credit additions and show celebration modal.
  // Runs whenever the active company changes (including dropdown switches).
  useEffect(() => {
    if (!company?.id) return;

    let cancelled = false;

    const checkUnseenCredits = async () => {
      try {
        const storageKey = `rcf_seen_credit_ids_${company.id}`;
        const seenIds: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');

        const { data, error } = await supabase
          .from('billing_credits')
          .select('id, amount, description, type')
          .eq('company_id', company.id)
          .in('type', ['super_admin_free_credit', 'super_admin_paid_credit'])
          .gt('amount', 0)
          .order('created_at', { ascending: true });

        if (cancelled || error || !data?.length) return;

        const unseen = data.filter((c) => !seenIds.includes(c.id));
        if (!unseen.length) return;

        setCreditNotifications(unseen.map((c) => ({
          id: c.id,
          amount: c.amount,
          description: c.description ?? null,
        })));
        setShowCreditModal(true);
      } catch {
        // non-critical — silently ignore
      }
    };

    checkUnseenCredits();
    return () => { cancelled = true; };
  }, [company?.id]);

  const handleCreditModalClose = () => {
    setShowCreditModal(false);
    if (!company?.id) return;
    const storageKey = `rcf_seen_credit_ids_${company.id}`;
    const seenIds: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const allSeen = [...new Set([...seenIds, ...creditNotifications.map((n) => n.id)])];
    localStorage.setItem(storageKey, JSON.stringify(allSeen));
  };

  // Get role display label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'hr': return 'HR';
      case 'partner': return 'Partner';
      default: return role;
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/b2b';
  };

  const activateTab = (nextTab: string) => {
    setActiveTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    setSearchParams(nextParams, { replace: true });
  };

  const handleTabChange = (nextTab: string) => {
    if (nextTab === activeTab) return;
    if (activeTab === 'settings' && settingsDirty) {
      setPendingTab(nextTab);
      setShowUnsavedDialog(true);
      return;
    }
    activateTab(nextTab);
  };

  const handleDiscardAndLeave = () => {
    setSettingsDirty(false);
    setShowUnsavedDialog(false);
    if (pendingTab) {
      activateTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleSaveAndLeave = async () => {
    if (!settingsSaveHandler) {
      handleDiscardAndLeave();
      return;
    }

    setSavingBeforeLeave(true);
    const success = await settingsSaveHandler();
    setSavingBeforeLeave(false);

    if (!success) return;

    setSettingsDirty(false);
    setShowUnsavedDialog(false);
    if (pendingTab) {
      activateTab(pendingTab);
      setPendingTab(null);
    }
  };

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && GUIDE_TABS.has(requestedTab)) {
      setActiveTab(prev => (prev === requestedTab ? prev : requestedTab));
    }
  }, [searchParams]);

  const outstandingPortalBalance = Number(company?.portal_access_outstanding_balance || 0);
  const isPortalBillingLocked = Boolean(company?.portal_access_locked && outstandingPortalBalance > 0);

  const resolvePortalBillingLock = async (options?: { silent?: boolean }) => {
    if (!company?.id) return false;
    const silent = options?.silent === true;

    setResolvingBillingLock(true);
    try {
      const { data, error } = await supabase.functions.invoke('retry-company-renewal-payment', {
        body: { company_id: company.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await refreshCompany();

      if (!silent) {
        const creditsApplied = Number(data?.creditsApplied || 0);
        const cardCharged = Number(data?.cardCharged || 0);
        const detailParts = [];
        if (creditsApplied > 0) detailParts.push(`$${creditsApplied.toFixed(2)} in credits applied`);
        if (cardCharged > 0) detailParts.push(`$${cardCharged.toFixed(2)} charged to card`);

        toast({
          title: 'Portal access restored',
          description: detailParts.length > 0 ? detailParts.join(' • ') : 'Your renewal balance has been settled.',
        });
      }

      return true;
    } catch (error: any) {
      if (!silent) {
        toast({
          title: 'Renewal payment still outstanding',
          description: error?.message || 'Update the card on file or add more credits, then try again.',
          variant: 'destructive',
        });
      }
      return false;
    } finally {
      setResolvingBillingLock(false);
    }
  };

  useEffect(() => {
    if (!isPortalBillingLocked) {
      autoResolveKeyRef.current = null;
      return;
    }

    if (activeTab !== 'settings') {
      activateTab('settings');
    }
  }, [isPortalBillingLocked, activeTab]);

  useEffect(() => {
    if (!company?.id || !isPortalBillingLocked) return;

    const creditBalance = Number(company.credit_balance || 0);
    if (creditBalance < outstandingPortalBalance || outstandingPortalBalance <= 0) return;

    const resolveKey = `${company.id}:${outstandingPortalBalance}:${creditBalance}`;
    if (autoResolveKeyRef.current === resolveKey || resolvingBillingLock) return;

    autoResolveKeyRef.current = resolveKey;
    void resolvePortalBillingLock({ silent: true });
  }, [company?.id, company?.credit_balance, isPortalBillingLocked, outstandingPortalBalance, resolvingBillingLock]);

  useEffect(() => {
    const onGuideTabChange = (event: Event) => {
      const tab = (event as CustomEvent<{ tab?: string }>).detail?.tab;
      if (!tab || !GUIDE_TABS.has(tab)) return;
      handleTabChange(tab);
    };

    window.addEventListener('rcf:b2b-guide-tab-change', onGuideTabChange as EventListener);
    return () => {
      window.removeEventListener('rcf:b2b-guide-tab-change', onGuideTabChange as EventListener);
    };
  }, [handleTabChange]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const hiringSubscribed = searchParams.get('hiring_subscribed');

    if (hiringSubscribed === 'true' && sessionId) {
      const verifySubscription = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('verify-hiring-subscription', {
            body: { sessionId },
          });

          if (error || !data?.success) {
            console.error('Hiring subscription verification failed:', error || data?.error);
          } else {
            toast({
              title: 'Hiring Tab Activated!',
              description: 'You now have access to premium hiring features.',
            });
            // Refresh company data
            refreshCompany();
          }
        } catch (err) {
          console.error('Error verifying subscription:', err);
        } finally {
          // Clean up URL
          searchParams.delete('hiring_subscribed');
          searchParams.delete('session_id');
          setSearchParams(searchParams, { replace: true });
        }
      };
      verifySubscription();
    }
  }, [searchParams, setSearchParams, toast, refreshCompany]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (activeTab === 'settings' && settingsDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [activeTab, settingsDirty]);

  useEffect(() => {
    const checkPaymentGate = async () => {
      if (!company?.id || !companyUser || company.name === 'RoleColorFinderLLC') {
        setPaymentMethodRequired(false);
        setPaymentGateReason('missing_payment_method');
        return;
      }

      const trialEndTs = company.b2b_trial_ends_at ? new Date(company.b2b_trial_ends_at).getTime() : NaN;
      const trialActive = Boolean(
        company.b2b_trial_enabled &&
        Number.isFinite(trialEndTs) &&
        trialEndTs > Date.now()
      );

      if (trialActive) {
        // Trial is active, so we allow portal access without requiring a card on file yet.
        setPaymentMethodRequired(false);
        setPaymentGateReason('missing_payment_method');
        setDeploymentFeeRequired(false);
        setDeploymentFeeError(null);
        return;
      }

      setPaymentGateLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('manage-payment-method', {
          body: {
            company_id: company.id,
            action: 'get_payment_method',
          },
        });

        if (error) throw error;
        const missingPaymentMethod = !Boolean(data?.hasPaymentMethod);
        setPaymentMethodRequired(missingPaymentMethod);

        if (missingPaymentMethod) {
          setDeploymentFeeRequired(false);
          setDeploymentFeeError(null);
          const trialEnded = Boolean(
            company.b2b_trial_enabled &&
            Number.isFinite(trialEndTs) &&
            trialEndTs <= Date.now()
          );
          setPaymentGateReason(trialEnded ? 'trial_ended_no_payment_method' : 'missing_payment_method');
          return;
        }

        const canManageBilling = ['admin', 'hr', 'partner'].includes(companyUser.role);
        if (canManageBilling) {
          const probeKey = `${company.id}:has-payment-method`;

          if (deploymentFeeGateProbeRef.current !== probeKey) {
            deploymentFeeGateProbeRef.current = probeKey;

            try {
              const { data: deploymentData, error: deploymentError } = await supabase.functions.invoke('manage-payment-method', {
                body: {
                  company_id: company.id,
                  action: 'charge_deployment_fee_if_needed',
                },
              });

              if (deploymentError) throw deploymentError;
              if (deploymentData?.requiresAction || deploymentData?.status === 'requires_action') {
                setDeploymentFeeRequired(true);
                setDeploymentFeeActionUrl(deploymentData?.actionUrl || null);
                setDeploymentFeeError('Card requires verification before the deployment fee can be charged.');
                return;
              }
              if (deploymentData?.error) throw new Error(deploymentData.error);

              const status = deploymentData?.status;
              const isResolved = ['not_required', 'waived', 'already_charged', 'charged'].includes(status);

              setDeploymentFeeRequired(!isResolved);
              if (isResolved) {
                setDeploymentFeeError(null);
              }

              if (status === 'charged') {
                await refreshCompany();
              }
            } catch (deploymentChargeError: any) {
              setDeploymentFeeRequired(true);
              setDeploymentFeeError(
                deploymentChargeError?.message ||
                  'We could not process the one-time $5,000 deployment fee. Please verify the payment method and retry.'
              );
            }
          }
        } else {
          const requiresDeploymentFee = Boolean(
            company.requires_post_setup_deployment_fee &&
            !company.deployment_fee_waived &&
            !company.deployment_fee_charged_at
          );

          setDeploymentFeeRequired(requiresDeploymentFee);
          if (!requiresDeploymentFee) {
            setDeploymentFeeError(null);
          }
        }
      } catch (error) {
        console.error('Failed to verify payment method gate', error);
        // Fail closed to enforce required billing setup before portal usage.
        setPaymentMethodRequired(true);
        setDeploymentFeeRequired(false);
        const trialEnded = Boolean(
          company.b2b_trial_enabled &&
          Number.isFinite(trialEndTs) &&
          trialEndTs <= Date.now()
        );
        setPaymentGateReason(trialEnded ? 'trial_ended_no_payment_method' : 'missing_payment_method');
      } finally {
        setPaymentGateLoading(false);
      }
    };

    void checkPaymentGate();
  }, [company?.id, company?.name, companyUser?.id, companyUser?.role]);

  const chargeDeploymentFeeIfNeeded = async (options?: { silent?: boolean }) => {
    if (!company?.id) return false;
    const silent = options?.silent === true;

    setDeploymentFeeLoading(true);
    setDeploymentFeeError(null);
    setDeploymentFeeActionUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke('manage-payment-method', {
        body: {
          company_id: company.id,
          action: 'charge_deployment_fee_if_needed',
        },
      });

      if (error) throw error;

      if (data?.requiresAction || data?.status === 'requires_action') {
        setDeploymentFeeRequired(true);
        setDeploymentFeeActionUrl(data?.actionUrl || null);
        setDeploymentFeeError('Card requires verification before the deployment fee can be charged.');

        if (!silent) {
          toast({
            title: 'Card Requires Verification',
            description: data?.actionUrl
              ? 'Complete bank authentication, then return and retry.'
              : 'Your bank requires verification. Open Billing Settings to update/verify your payment method.',
            variant: 'destructive',
          });
        }
        return false;
      }

      if (data?.error) throw new Error(data.error);

      setDeploymentFeeRequired(false);
      setDeploymentFeeActionUrl(null);
      await refreshCompany();

      if (!silent && data?.charged) {
        toast({
          title: 'Deployment fee paid',
          description: 'The one-time $5,000 deployment fee was successfully charged.',
        });
      }

      return true;
    } catch (error: unknown) {
      const parsedMessage = await getEdgeErrorMessage(error);
      const message =
        parsedMessage ||
        'We could not process the one-time $5,000 deployment fee. Please verify the payment method and try again.';
      setDeploymentFeeRequired(true);
      setDeploymentFeeError(message);

      if (!silent) {
        toast({
          title: 'Deployment fee charge failed',
          description: message,
          variant: 'destructive',
        });
      }

      return false;
    } finally {
      setDeploymentFeeLoading(false);
    }
  };

  useEffect(() => {
    const paymentSetup = searchParams.get('payment_setup');
    if (paymentSetup !== 'success' || !company?.id || !companyUser) return;

    const requiresDeploymentFee = Boolean(
      company.requires_post_setup_deployment_fee &&
      !company.deployment_fee_waived &&
      !company.deployment_fee_charged_at
    );

    if (!requiresDeploymentFee) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('payment_setup');
      setSearchParams(nextParams, { replace: true });
      return;
    }

    const canManageBilling = ['admin', 'hr', 'partner'].includes(companyUser.role);
    if (!canManageBilling) return;

    const attemptKey = `${company.id}:${paymentSetup}`;
    if (deploymentFeeAttemptRef.current === attemptKey) return;
    deploymentFeeAttemptRef.current = attemptKey;

    void (async () => {
      await chargeDeploymentFeeIfNeeded({ silent: false });
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('payment_setup');
      setSearchParams(nextParams, { replace: true });
    })();
  }, [company?.id, company?.requires_post_setup_deployment_fee, company?.deployment_fee_waived, company?.deployment_fee_charged_at, companyUser?.role, searchParams]);

  useEffect(() => {
    if (!company?.id) {
      deploymentFeeAutoAttemptRef.current = null;
      return;
    }

    // Reset auto-attempt key once fee is no longer pending.
    if (!deploymentFeeRequired) {
      deploymentFeeAutoAttemptRef.current = null;
      return;
    }

    if (paymentMethodRequired || paymentGateLoading || deploymentFeeLoading) return;

    const canManageBilling = ['admin', 'hr', 'partner'].includes(companyUser?.role || '');
    if (!canManageBilling) return;

    const attemptKey = `${company.id}:auto`;
    if (deploymentFeeAutoAttemptRef.current === attemptKey) return;
    deploymentFeeAutoAttemptRef.current = attemptKey;

    // Catch scenarios where card setup happened in another flow and no payment_setup query param is present.
    void chargeDeploymentFeeIfNeeded({ silent: true });
  }, [company?.id, companyUser?.role, deploymentFeeRequired, paymentMethodRequired, paymentGateLoading, deploymentFeeLoading]);

  const openPaymentMethodSetup = async () => {
    if (!company?.id) return;
    setOpeningPaymentSetup(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-payment-method', {
        body: {
          company_id: company.id,
          action: 'setup_payment_method',
          success_url: `${window.location.origin}/b2b/company-portal?company=${company.id}&tab=settings&payment_setup=success`,
          cancel_url: `${window.location.origin}/b2b/company-portal?company=${company.id}&tab=settings&payment_setup=cancelled`,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('Unable to open payment setup.');
      window.location.href = data.url;
    } catch (error: unknown) {
      const message = await getEdgeErrorMessage(error);
      toast({
        title: 'Unable to start payment setup',
        description: message || 'Please try again.',
        variant: 'destructive',
      });
      setOpeningPaymentSetup(false);
    }
  };

  // Keep showing spinner if we're still waiting for the requested company to resolve
  const requestedCompanyId = searchParams.get('company');
  const awaitingSwitch = !loading && requestedCompanyId && company?.id !== requestedCompanyId;

  if (loading || awaitingSwitch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company || !companyUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">No Company Access</CardTitle>
            <CardDescription>
              You don't have access to any company portal yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => window.location.href = '/b2b'} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New Company
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/b2b/signin'} className="w-full">
              <Building2 className="h-4 w-4 mr-2" />
              Sign in to Existing Company
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentGateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (paymentMethodRequired) {
    const canManageBilling = ['admin', 'hr', 'partner'].includes(companyUser.role);
    const title = paymentGateReason === 'trial_ended_no_payment_method'
      ? 'Trial Ended - Portal Access Paused'
      : 'Payment Method Required';
    const description = paymentGateReason === 'trial_ended_no_payment_method'
      ? 'Your trial has ended. Add a card or bank account to restore portal access.'
      : 'Super-admin access has been granted, but a valid payment method must be added before this B2B portal can be used.';

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg border-0 shadow-lg">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {canManageBilling ? (
              <Button className="w-full" onClick={openPaymentMethodSetup} disabled={openingPaymentSetup}>
                {openingPaymentSetup ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Add Card / Bank via Stripe
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                A company admin or HR manager must add the Stripe payment method first.
              </p>
            )}
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (deploymentFeeRequired) {
    const canManageBilling = ['admin', 'hr', 'partner'].includes(companyUser.role);

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Deployment Fee Required</CardTitle>
            <CardDescription>
              A one-time $5,000 deployment fee is required before portal access is enabled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {deploymentFeeError ? (
              <p className="text-sm text-destructive">{deploymentFeeError}</p>
            ) : null}
            {canManageBilling && deploymentFeeActionUrl ? (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => { window.location.href = deploymentFeeActionUrl; }}
              >
                Complete Bank Authentication
              </Button>
            ) : null}
            {canManageBilling ? (
              <Button
                className="w-full"
                onClick={() => void chargeDeploymentFeeIfNeeded({ silent: false })}
                disabled={deploymentFeeLoading}
              >
                {deploymentFeeLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Retry $5,000 Deployment Fee Charge
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                A company admin or HR manager must complete the deployment fee payment.
              </p>
            )}
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    const assessmentPath = company.assessment_type === '25q' 
      ? '/b2b/assessment-25q' 
      : '/b2b/assessment-50q';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome to {company.name}</CardTitle>
            <CardDescription>
              Complete your professional assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = assessmentPath} className="w-full">
              Take Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get company colors for styling
  const primaryColor = company.primary_color || '#22c55e';
  const secondaryColor = company.secondary_color || '#16a34a';
  const hasHiringAccess = Boolean(
    company.hiring_subscription_enabled &&
    (company.hiring_subscription_status === 'active' || company.hiring_subscription_status === 'trialing' || company.hiring_subscription_status === 'admin_override')
  );

  return (
    <div className="min-h-screen bg-muted/30 relative">
      {/* Seamless company-switch overlay */}
      {switching && (
        <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Switching company…</p>
          </div>
        </div>
      )}

      {/* Clean header with company color accent */}
      <header 
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50" 
        data-tour="dashboard-header"
        style={{ borderBottomColor: `${primaryColor}30` }}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="w-full flex items-center justify-between sm:w-auto sm:justify-start sm:gap-1">
            {/* Logo - always links back to main site */}
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0">
              {(() => {
                const logoToShow = resolvedTheme === 'dark' && company.logo_url_dark ? company.logo_url_dark : company.logo_url;
                if (logoToShow) {
                  return (
                    <img
                      src={logoToShow}
                      alt={`${company.name} logo`}
                      className="h-8 w-auto object-contain"
                    />
                  );
                }
                return (
                  <div className="h-8 w-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-foreground/60" />
                  </div>
                );
              })()}
            </Link>

            <span className="text-border mx-1 hidden sm:inline">|</span>

            {/* Company switcher dropdown (desktop) */}
            <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1.5 px-2 hover:bg-muted/50 h-auto py-1.5 text-muted-foreground">
                  <span className="text-sm font-medium max-w-[180px] truncate">{company.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {allCompanies.map((item) => (
                  <DropdownMenuItem
                    key={item.company.id}
                    onClick={() => {
                      if (item.company.id !== company.id) {
                        switchingCompanyIdRef.current = item.company.id;
                        setSwitching(true);
                        switchCompany(item.company.id);
                        activateTab('overview');
                      }
                    }}
                    className="flex items-center gap-3 py-2.5 cursor-pointer"
                  >
                    <div className="h-7 w-7 rounded-lg bg-foreground/5 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-3.5 w-3.5 text-foreground/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.company.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.companyUser.role}</p>
                    </div>
                    {item.company.id === company.id && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/b2b')}
                  className="flex items-center gap-3 py-2.5 cursor-pointer text-primary"
                >
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Plus className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Create New Company</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
          <div className="w-full sm:w-auto flex items-center justify-end gap-1 sm:gap-2">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(true)}
              className="text-muted-foreground hover:text-foreground"
              title="Search (Ctrl+K or /)"
            >
              <Search className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="ml-2 hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            {/* Help Button */}
            <HelpButton 
              tourFilter={(tour) => {
                if (!tour.id.startsWith('admin-')) return false;
                if (tour.id === 'admin-hiring-locked') return !hasHiringAccess;
                if (tour.id === 'admin-hiring-unlocked') return hasHiringAccess;
                return true;
              }}
              size="sm"
              iconOnly
            />
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50" data-tour="theme-toggle">
              <Button
                variant={theme === 'light' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme('light')}
                title="Light mode"
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button
                variant={theme === 'dark' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme('dark')}
                title="Dark mode"
              >
                <Moon className="h-4 w-4" />
              </Button>
              <Button
                variant={theme === 'system' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme('system')}
                title="System theme"
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout} 
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>

          {/* Company switcher dropdown (mobile) */}
          <div className="sm:hidden w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between text-muted-foreground"
                >
                  <span className="truncate">{company.name}</span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[calc(100vw-1.5rem)] max-w-sm">
                {allCompanies.map((item) => (
                  <DropdownMenuItem
                    key={item.company.id}
                    onClick={() => {
                      if (item.company.id !== company.id) {
                        switchingCompanyIdRef.current = item.company.id;
                        setSwitching(true);
                        switchCompany(item.company.id);
                        activateTab('overview');
                      }
                    }}
                    className="flex items-center gap-3 py-2.5 cursor-pointer"
                  >
                    <div className="h-7 w-7 rounded-lg bg-foreground/5 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-3.5 w-3.5 text-foreground/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.company.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.companyUser.role}</p>
                    </div>
                    {item.company.id === company.id && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/b2b')}
                  className="flex items-center gap-3 py-2.5 cursor-pointer text-primary"
                >
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Plus className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Create New Company</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8 pb-24 sm:pb-8">
        {/* Employee-specific view: show tasks instead of admin tabs */}
        {companyUser?.role === 'employee' ? (
          <EmployeeTasksView />
        ) : isPortalBillingLocked ? (
          <SettingsTab
            company={company}
            onSettingsSaved={refreshCompany}
            billingOnly
            billingLock={{
              outstandingBalance: outstandingPortalBalance,
              reason: company.portal_access_lock_reason || null,
              lockedAt: company.portal_access_locked_at || null,
            }}
            onResolveBillingLock={resolvePortalBillingLock}
          />
        ) : (
          <>
        {/* Inject dynamic styles for active tabs using company colors */}
        <style>{`
          .b2b-tab {
            transition: none !important;
            border-width: 2px !important;
            border-style: solid !important;
            border-color: transparent !important;
            border-image: none !important;
            box-shadow: none !important;
          }
          .b2b-tab[data-state=active] {
            background: linear-gradient(135deg, var(--b2b-primary, #22c55e), var(--b2b-secondary, #16a34a)) !important;
            color: white !important;
            box-shadow: none !important;
          }
          .b2b-tab:hover:not([data-state=active]) {
            background-color: hsl(var(--b2b-secondary-hsl, 142 76% 36%) / 0.1) !important;
          }
        `}</style>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <TabsList className="bg-background border p-1 h-auto hidden sm:inline-flex gap-1 sticky top-16 z-40 justify-start" data-tour="dashboard-tabs">
              {permissions.canViewOverview && (
                <TabsTrigger 
                  value="overview" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-none flex-shrink-0"
                >
                  Overview
                </TabsTrigger>
              )}
              {(permissions.canManageUsers || permissions.canViewUsers) && (
                <TabsTrigger 
                  value="users" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-none flex-shrink-0"
                >
                  Users
                </TabsTrigger>
              )}
              {(permissions.canManageCandidates || permissions.canViewCandidates) && (
                <TabsTrigger 
                  value="hiring" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-none flex-shrink-0"
                >
                  Hiring
                </TabsTrigger>
              )}
              {permissions.canViewAssessments && (
                <TabsTrigger 
                  value="assessments" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-none flex-shrink-0"
                >
                  Assessments
                </TabsTrigger>
              )}
              {permissions.canUseWorkMatrix && (
                <TabsTrigger 
                  value="matrix" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-none flex-shrink-0"
                >
                  Work Matrix
                </TabsTrigger>
              )}
              {permissions.canManageSettings && (
                <TabsTrigger 
                  value="roles" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-none flex-shrink-0"
                >
                  Roles
                </TabsTrigger>
              )}
              {permissions.canManageReminders && (
                <TabsTrigger 
                  value="reminders" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-none flex-shrink-0"
                >
                  Reminders
                </TabsTrigger>
              )}
              {permissions.canViewOverview && (
                <TabsTrigger 
                  value="analytics" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-none flex-shrink-0"
                >
                  Analytics
                </TabsTrigger>
              )}
              {permissions.canViewOverview && (
                <TabsTrigger 
                  value="friction-map" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-none flex-shrink-0"
                >
                  Friction Map
                </TabsTrigger>
              )}
              {permissions.canManageSettings && (
                <TabsTrigger 
                  value="settings" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-none flex-shrink-0"
                >
                  Settings
                </TabsTrigger>
              )}
            </TabsList>
            {/* Role badge */}
            {companyUser && (
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {getRoleLabel(companyUser.role)}
              </span>
            )}
          </div>

          <TabsContent value="overview" forceMount className="mt-0 break-words data-[state=inactive]:hidden">
            <OverviewTab company={company} />
          </TabsContent>

          <TabsContent value="users" forceMount className="mt-0 break-words data-[state=inactive]:hidden">
            <UsersTab 
              company={company} 
              readOnly={!permissions.canManageUsers}
            />
          </TabsContent>

          <TabsContent value="hiring" forceMount className="mt-0 break-words data-[state=inactive]:hidden">
            <HiringSection 
              company={company}
              companyUser={companyUser}
              onSubscriptionUpdated={refreshCompany}
            />
          </TabsContent>

          <TabsContent value="assessments" forceMount className="mt-0 break-words data-[state=inactive]:hidden">
            <AssessmentsTab 
              company={company} 
              onSettingsSaved={refreshCompany}
              onNavigateToSettings={() => {
                handleTabChange('settings');
                setScrollToSection('assessment-config');
              }}
            />
          </TabsContent>

          <TabsContent value="matrix" forceMount className="mt-0 break-words data-[state=inactive]:hidden">
            <WorkAssigningMatrixTab />
          </TabsContent>

          <TabsContent value="roles" forceMount className="mt-0 break-words data-[state=inactive]:hidden">
            <RolesTab company={company} />
          </TabsContent>

          <TabsContent value="reminders" forceMount className="mt-0 break-words data-[state=inactive]:hidden">
            <RemindersHistoryTab company={company} />
          </TabsContent>

          <TabsContent value="settings" forceMount className="mt-0 break-words data-[state=inactive]:hidden">
            <SettingsTab 
              company={company} 
              onSettingsSaved={refreshCompany}
              scrollToSection={scrollToSection}
              onScrollComplete={() => setScrollToSection(null)}
              onDirtyChange={setSettingsDirty}
              registerSaveHandler={(handler) => setSettingsSaveHandler(() => handler)}
            />
          </TabsContent>

          <TabsContent value="analytics" forceMount className="mt-0 break-words data-[state=inactive]:hidden">
            <AdvancedAnalyticsDashboard companyId={company.id} />
          </TabsContent>

          <TabsContent value="friction-map" forceMount className="mt-0 break-words data-[state=inactive]:hidden">
            <TeamFrictionMapTab company={company} />
          </TabsContent>
        </Tabs>
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      {!isPortalBillingLocked && (
        <MobileBottomNav
          activeTab={activeTab}
          onChange={handleTabChange}
          permissions={permissions}
        />
      )}

      <AlertDialog
        open={showUnsavedDialog}
        onOpenChange={(open) => {
          setShowUnsavedDialog(open);
          if (!open) setPendingTab(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You have unsaved settings</AlertDialogTitle>
            <AlertDialogDescription>
              Save your settings before leaving this page, or discard your unsaved changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingBeforeLeave}>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardAndLeave}
              disabled={savingBeforeLeave}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard Changes
            </AlertDialogAction>
            <AlertDialogAction onClick={handleSaveAndLeave} disabled={savingBeforeLeave}>
              {savingBeforeLeave ? 'Saving...' : 'Save All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credit Notification Modal */}
      <CreditNotificationModal
        open={showCreditModal}
        onClose={handleCreditModalClose}
        notifications={creditNotifications}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />

      {/* Global Search Dialog */}
      {company && (
        <GlobalSearch
          companyId={company.id}
          open={showSearch}
          onOpenChange={setShowSearch}
          onSelectUser={(userId) => {
            setSelectedUserId(userId);
            setShowUserProfile(true);
          }}
          onSelectCandidate={(candidateId) => {
            setSelectedCandidateId(candidateId);
            handleTabChange('hiring');
          }}
          onSelectTask={() => {
            handleTabChange('overview');
          }}
        />
      )}

      {/* User Profile Sheet */}
      {company && (
        <UserProfileSheet
          userId={selectedUserId}
          companyId={company.id}
          open={showUserProfile}
          onOpenChange={setShowUserProfile}
          readOnly={!permissions?.canManageUsers}
          onUserUpdate={refreshCompany}
        />
      )}
    </div>
  );
}

// Wrapper component that provides the B2B-specific theme
export default function B2BDashboard() {
  return (
    <B2BThemeProvider>
      <B2BDashboardContent />
    </B2BThemeProvider>
  );
}
