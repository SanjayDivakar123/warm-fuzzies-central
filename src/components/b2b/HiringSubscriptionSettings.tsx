import { useEffect, useState } from 'react';
import { useHiringSubscribeInFlight } from '@/lib/hiringSubscribeLock';
import { subscribeHiring } from '@/lib/subscribeHiring';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Briefcase, 
  Check, 
  X, 
  AlertTriangle, 
  Calendar,
  CreditCard,
  Sparkles,
  ArrowDown,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import HiringUnlockedModal from './HiringUnlockedModal';

interface HiringSubscriptionSettingsProps {
  company: {
    id: string;
    name: string;
    created_at?: string;
    seats_purchased?: number;
    credit_balance?: number;
    hiring_subscription_enabled?: boolean;
    hiring_subscription_status?: string;
    hiring_subscription_cancel_at_period_end?: boolean;
    hiring_subscription_current_period_end?: string;
    hiring_ever_subscribed?: boolean;
  };
  onSubscriptionUpdated?: () => void;
}

export default function HiringSubscriptionSettings({ 
  company, 
  onSubscriptionUpdated 
}: HiringSubscriptionSettingsProps) {
  const PORTAL_COST_PER_USER = 20;

  type StatementRow = {
    id: string;
    created_at: string;
    category: 'subscription' | 'charge' | 'extra_insight' | 'credit' | 'portal_cost';
    description: string;
    amount: number;
    source: 'transaction' | 'credit';
    user_email?: string;
    user_name?: string;
  };

  const hiringCost = 500;
  const creditBalance = typeof company.credit_balance === 'number' ? company.credit_balance : parseFloat((company.credit_balance as unknown as string) ?? '0');
  const creditContribution = Math.min(creditBalance, hiringCost);
  const cardCharge = hiringCost - creditContribution;

  const subscribing = useHiringSubscribeInFlight(company.id);
  const [noPaymentMethod, setNoPaymentMethod] = useState(false);
  const [subscribeError, setSubscribeError] = useState<{
    title: string;
    description: string;
    actionUrl?: string;
    type: 'auth_required' | 'card_declined' | 'generic';
  } | null>(null);
  const [showUnlockedModal, setShowUnlockedModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showStatementDialog, setShowStatementDialog] = useState(false);
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [showChargeDetailDialog, setShowChargeDetailDialog] = useState(false);
  const [selectedStatementRow, setSelectedStatementRow] = useState<StatementRow | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementRows, setStatementRows] = useState<StatementRow[]>([]);
  const [statementLastUpdated, setStatementLastUpdated] = useState<Date | null>(null);
  const [renewalEstimateLoading, setRenewalEstimateLoading] = useState(false);
  const [renewalEstimate, setRenewalEstimate] = useState<{
    activeUsers: number;
    seatsPurchased: number;
    billableUsers: number;
    hiringCharge: number;
    portalCharge: number;
    totalCharge: number;
  } | null>(null);
  const [statementStartDate, setStatementStartDate] = useState<Date | null>(null);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<Date | null>(null);
  const [renewalDateLoading, setRenewalDateLoading] = useState(false);
  const [statementTotals, setStatementTotals] = useState({
    charges: 0,
    subscriptions: 0,
    extraInsights: 0,
    portalCost: 0,
    creditsApplied: 0,
    net: 0,
  });
  const { toast } = useToast();
  const normalizedName = company.name?.trim().toLowerCase().replace(/\s+/g, '') ?? '';
  const isInternalAdminCompany = normalizedName === 'rolecolorfinderllc' || normalizedName === 'rolecolorfinder';

  const hasActiveSubscription = company.hiring_subscription_enabled && 
    (company.hiring_subscription_status === 'active' || company.hiring_subscription_status === 'trialing');
  
  const isCancelling = company.hiring_subscription_cancel_at_period_end;
  const periodEnd = company.hiring_subscription_current_period_end 
    ? new Date(company.hiring_subscription_current_period_end)
    : null;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const addOneMonthAnchored = (current: Date, anchorDay: number) => {
    const year = current.getFullYear();
    const month = current.getMonth();
    const targetMonthDate = new Date(year, month + 1, 1);
    const lastDayOfTargetMonth = new Date(
      targetMonthDate.getFullYear(),
      targetMonthDate.getMonth() + 1,
      0
    ).getDate();
    const day = Math.min(anchorDay, lastDayOfTargetMonth);

    return new Date(
      targetMonthDate.getFullYear(),
      targetMonthDate.getMonth(),
      day,
      current.getHours(),
      current.getMinutes(),
      current.getSeconds(),
      current.getMilliseconds()
    );
  };

  const getNextRenewalFromStart = (startDate: Date) => {
    const now = new Date();
    const anchorDay = startDate.getDate();
    let cursor = new Date(startDate);

    while (cursor <= now) {
      cursor = addOneMonthAnchored(cursor, anchorDay);
    }
    return cursor;
  };

  const displayedRenewalDate = subscriptionStartDate
    ? getNextRenewalFromStart(subscriptionStartDate)
    : periodEnd;

  const getStatementCategory = (type: string, description?: string | null): StatementRow['category'] => {
    const normalizedType = (type || '').toLowerCase();
    const normalizedDescription = (description || '').toLowerCase();

    if (normalizedType.includes('insight') || normalizedDescription.includes('insight')) {
      return 'extra_insight';
    }
    if (normalizedDescription.includes('hiring tab subscription')) {
      return 'subscription';
    }
    if (normalizedType.includes('user_addition')) {
      if (normalizedType.includes('credit')) {
        return 'credit';
      }
      if (normalizedType.includes('failed')) {
        return 'charge';
      }
      return 'charge';
    }
    if (normalizedType.includes('monthly_billing')) {
      if (normalizedType.includes('credit')) {
        return 'credit';
      }
      if (normalizedType.includes('failed')) {
        return 'charge';
      }
      return 'portal_cost';
    }
    if (normalizedType.includes('credit')) {
      return 'credit';
    }
    return 'charge';
  };

  const getCategoryLabel = (category: StatementRow['category']) => {
    if (category === 'subscription') return 'Subscription';
    if (category === 'extra_insight') return 'Extra Insights';
    if (category === 'portal_cost') return 'Portal Cost';
    if (category === 'credit') return 'Credits';
    return 'Charges';
  };

  const openChargeDetail = (row: StatementRow) => {
    setSelectedStatementRow(row);
    setShowChargeDetailDialog(true);
  };

  const loadRenewalEstimate = async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setRenewalEstimateLoading(true);

    try {
      const { count, error } = await supabase
        .from('company_users')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .neq('status', 'revoked');

      if (error) throw error;

      const activeUsers = Math.max(0, count || 0);
      const seatsPurchased = Math.max(2, company.seats_purchased || 2);
      const billableUsers = Math.max(activeUsers, seatsPurchased);

      const hiringCharge = hasActiveSubscription && !isCancelling
        ? (isInternalAdminCompany ? 0 : 500)
        : 0;
      const portalCharge = isInternalAdminCompany ? 0 : billableUsers * PORTAL_COST_PER_USER;
      const totalCharge = hiringCharge + portalCharge;

      setRenewalEstimate({
        activeUsers,
        seatsPurchased,
        billableUsers,
        hiringCharge,
        portalCharge,
        totalCharge,
      });
    } catch (error: unknown) {
      console.error('Error loading renewal estimate:', error);
      const message = error instanceof Error ? error.message : 'Unable to load renewal estimate right now.';
      toast({
        title: 'Failed to load renewal estimate',
        description: message,
        variant: 'destructive',
      });
    } finally {
      if (!silent) setRenewalEstimateLoading(false);
    }
  };

  const loadMonthlyStatement = async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setStatementLoading(true);
    try {
      const [txRes, creditRes, userChargesRes] = await Promise.all([
        supabase
          .from('billing_transactions')
          .select('id, created_at, type, amount, description')
          .eq('company_id', company.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('billing_credits')
          .select('id, created_at, amount, description, type')
          .eq('company_id', company.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('company_users')
          .select('id, email, full_name, charged_at, charge_amount')
          .eq('company_id', company.id)
          .not('charged_at', 'is', null)
          .gt('charge_amount', 0)
          .order('charged_at', { ascending: true }),
      ]);

      if (txRes.error) throw txRes.error;
      if (creditRes.error) throw creditRes.error;
      if (userChargesRes.error) throw userChargesRes.error;

      const transactions = txRes.data || [];
      const credits = creditRes.data || [];
      const chargedUsers = userChargesRes.data || [];

      const derivedStartDate = company.created_at
        ? new Date(company.created_at)
        : company.hiring_subscription_current_period_end
          ? new Date(new Date(company.hiring_subscription_current_period_end).setMonth(new Date(company.hiring_subscription_current_period_end).getMonth() - 1))
          : null;

      setStatementStartDate(derivedStartDate);

      const allTxRows: StatementRow[] = transactions
        .filter((row) => !derivedStartDate || new Date(row.created_at) >= derivedStartDate)
        .map((row) => {
          const category = getStatementCategory(row.type, row.description);
          
          // Try to find associated user from chargedUsers for invite charges
          let matchedUser = null;
          if (category === 'charge' || category === 'credit') {
            matchedUser = chargedUsers.find(user => {
              if (!user.charged_at) return false;
              const txMs = new Date(row.created_at).getTime();
              const chargedAtMs = new Date(user.charged_at).getTime();
              const closeInTime = Math.abs(txMs - chargedAtMs) <= 5 * 60 * 1000;
              const sameAmount = Math.abs(Math.abs(row.amount || 0) - Number(user.charge_amount || 0)) < 0.01;
              return closeInTime && sameAmount;
            });
          }
          
          return {
            id: `tx-${row.id}`,
            created_at: row.created_at,
            category,
            description: row.description || row.type,
            amount: row.amount || 0,
            source: 'transaction' as const,
            user_email: matchedUser?.email,
            user_name: matchedUser?.full_name || undefined,
          };
        });

      // Deduplicate hiring tab subscription rows — only show the most recent successful payment
      const subRows = allTxRows.filter((r) => r.category === 'subscription');
      const nonSubRows = allTxRows.filter((r) => r.category !== 'subscription');
      const dedupedSubRows = subRows.length > 0
        ? [subRows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]]
        : [];
      const txRows = [...nonSubRows, ...dedupedSubRows];

      const inviteChargeFallbackRows: StatementRow[] = chargedUsers
        .filter((row) => !!row.charged_at && (!derivedStartDate || new Date(row.charged_at as string) >= derivedStartDate))
        .filter((row) => {
          const chargedAtMs = new Date(row.charged_at as string).getTime();
          const chargeAmount = Number(row.charge_amount || 0);
          return !txRows.some((txRow) => {
            const txMs = new Date(txRow.created_at).getTime();
            const closeInTime = Math.abs(txMs - chargedAtMs) <= 5 * 60 * 1000;
            const sameAmount = Math.abs(Number(txRow.amount || 0) - chargeAmount) < 0.01;
            const txDesc = (txRow.description || '').toLowerCase();
            const looksLikeInviteCharge = txDesc.includes('pro-rated user') || txDesc.includes('user seat charge') || txDesc.includes('user charge');
            return closeInTime && sameAmount && looksLikeInviteCharge;
          });
        })
        .map((row) => ({
          id: `user-charge-${row.id}-${row.charged_at}`,
          created_at: row.charged_at as string,
          category: 'charge' as const,
          description: `Pro-rated user seat charge${row.full_name ? ` (${row.full_name})` : row.email ? ` (${row.email})` : ''}`,
          amount: Number(row.charge_amount || 0),
          source: 'transaction' as const,
          user_email: row.email,
          user_name: row.full_name || undefined,
        }));

      // Only show credits when they're USED to cover charges, not when granted by super-admin
      // Super-admin credit grants (super_admin_free_credit, super_admin_paid_credit) should not appear on the statement
      // They're essentially prepayments that only show up when consumed
      const creditRows: StatementRow[] = isInternalAdminCompany ? [] : credits
        .filter((row) => {
          if (!derivedStartDate || new Date(row.created_at) < derivedStartDate) return false;
          if (row.amount <= 0) return false;
          // Filter out super-admin credit grants - they're prepayments, not statement line items
          const isSuperAdminGrant = row.type === 'super_admin_free_credit' || row.type === 'super_admin_paid_credit';
          return !isSuperAdminGrant;
        })
        .map((row) => ({
          id: `credit-${row.id}`,
          created_at: row.created_at,
          category: 'credit' as const,
          description: row.description || row.type || 'Credit adjustment',
          amount: -(row.amount || 0), // credits are deductions — they reduce what the company owes
          source: 'credit' as const,
        }));

      const hasMonthlyBillingRow = txRows.some((row) => row.description.toLowerCase().includes('monthly billing'));
      const baseSeatsPurchased = Math.max(2, company.seats_purchased || 2);
      const basePortalMonthlyCost = isInternalAdminCompany ? 0 : baseSeatsPurchased * 20;
      const periodAnchorDate = (derivedStartDate || new Date()).toISOString();
      const basePortalCostRow: StatementRow | null = hasMonthlyBillingRow
        ? null
        : {
            id: `portal-base-${company.id}-${periodAnchorDate}`,
            created_at: periodAnchorDate,
            category: 'portal_cost',
            description: isInternalAdminCompany
              ? 'Base Portal Cost (Internal Admin Company - No Charge)'
              : `Base Portal Cost (${baseSeatsPurchased} seat${baseSeatsPurchased !== 1 ? 's' : ''} × $20/month)`,
            amount: basePortalMonthlyCost,
            source: 'transaction',
          };

      const rowsToInclude = [
        ...txRows,
        ...inviteChargeFallbackRows,
        ...creditRows,
        ...(basePortalCostRow ? [basePortalCostRow] : []),
      ];
      const allRows = (isInternalAdminCompany
        ? rowsToInclude.filter((row) => row.category !== 'credit')
        : rowsToInclude
      ).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const totals = allRows.reduce(
        (acc, row) => {
          if (row.category === 'subscription') acc.subscriptions += row.amount;
          if (row.category === 'extra_insight') acc.extraInsights += row.amount;
          if (row.category === 'portal_cost') acc.portalCost += row.amount;
          if (row.category === 'charge') acc.charges += row.amount;
          if (row.category === 'credit') acc.creditsApplied += row.amount;
          acc.net += row.amount;
          return acc;
        },
        { charges: 0, subscriptions: 0, extraInsights: 0, portalCost: 0, creditsApplied: 0, net: 0 }
      );

      setStatementRows(allRows);
      setStatementTotals(totals);
      setStatementLastUpdated(new Date());
    } catch (error: unknown) {
      console.error('Error loading monthly statement:', error);
      const message = error instanceof Error ? error.message : 'Unable to load billing statement right now.';
      toast({
        title: 'Failed to load statement',
        description: message,
        variant: 'destructive',
      });
    } finally {
      if (!silent) setStatementLoading(false);
    }
  };

  useEffect(() => {
    if (!showStatementDialog) return;

    loadMonthlyStatement();

    const intervalId = window.setInterval(() => {
      loadMonthlyStatement({ silent: true });
    }, 30000);

    const handleFocus = () => {
      loadMonthlyStatement({ silent: true });
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [showStatementDialog]);

  useEffect(() => {
    if (!showRenewalDialog) return;

    loadRenewalEstimate();

    const intervalId = window.setInterval(() => {
      loadRenewalEstimate({ silent: true });
    }, 30000);

    const handleFocus = () => {
      loadRenewalEstimate({ silent: true });
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [showRenewalDialog]);

  useEffect(() => {
    const loadSubscriptionStartDate = async () => {
      const storageKey = `rcf_hiring_subscription_start_date_${company.id}`;
      const cachedStartDate = sessionStorage.getItem(storageKey);
      if (cachedStartDate) {
        if (cachedStartDate === "__NONE__") {
          setSubscriptionStartDate(null);
        } else {
          setSubscriptionStartDate(new Date(cachedStartDate));
        }
        setRenewalDateLoading(false);
        return;
      }

      setRenewalDateLoading(true);
      if (company.created_at) {
        const start = new Date(company.created_at);
        setSubscriptionStartDate(start);
        sessionStorage.setItem(storageKey, start.toISOString());
      } else if (company.hiring_subscription_current_period_end) {
        const start = new Date(
          new Date(company.hiring_subscription_current_period_end).setMonth(
            new Date(company.hiring_subscription_current_period_end).getMonth() - 1
          )
        );
        setSubscriptionStartDate(start);
        sessionStorage.setItem(storageKey, start.toISOString());
      } else {
        setSubscriptionStartDate(null);
        sessionStorage.setItem(storageKey, "__NONE__");
      }

      setRenewalDateLoading(false);
    };

    loadSubscriptionStartDate();
  }, [company.id, company.hiring_subscription_current_period_end]);

  // Translate raw Stripe / edge-function messages into clean user-facing errors
  const classifyError = (msg: string, step?: string): NonNullable<typeof subscribeError> => {
    const m = (msg || '').toLowerCase();
    if (step === 'no_default_payment_method' || m.includes('no payment method') || m.includes('no default payment')) {
      return {
        type: 'card_declined',
        title: 'No Payment Method on File',
        description: 'No card is on file for this account. Please add a payment method below before subscribing.',
      };
    }
    if (step === 'already_processing' || m.includes('already being processed')) {
      return {
        type: 'generic',
        title: 'Subscription Already Processing',
        description: 'A subscription request is already in progress. Please wait a few seconds and try again.',
      };
    }
    if (m.includes('idempotent requests')) {
      return {
        type: 'generic',
        title: 'Subscription Already Processing',
        description: 'A subscription request is already in progress. Please wait a few seconds and try again.',
      };
    }
    if (
      m.includes('requires additional user action') ||
      m.includes('requires_action') ||
      m.includes('paymentintent') ||
      m.includes('requires authentication') ||
      m.includes('3d secure') ||
      step === 'requires_authentication'
    ) {
      return {
        type: 'auth_required',
        title: 'Card Requires Verification',
        description: 'Your bank requires additional verification before this payment can go through. Please update your payment method or contact your bank to allow this charge.',
      };
    }
    if (step === 'card_declined' || m.includes('declined') || m.includes('insufficient funds') || m.includes('do_not_honor') || m.includes('frozen')) {
      return {
        type: 'card_declined',
        title: 'Transaction Declined',
        description: 'Your card was declined. This may be due to insufficient funds, a frozen card, or your bank blocking the $500 charge. Please update your payment method and try again.',
      };
    }
    return {
      type: 'generic',
      title: 'Subscription Failed',
      description: msg || 'Something went wrong processing your subscription. Please try again or contact support if the issue persists.',
    };
  };

  const handleSubscribe = async () => {
    setNoPaymentMethod(false);
    setSubscribeError(null);
    try {
      const data = await subscribeHiring(company.id);

      if (data?.requiresAction) {
        setSubscribeError({
          type: 'auth_required',
          title: 'Card Requires Verification',
          description: 'Your bank requires additional verification before this payment can go through. Click below to complete the authentication step, then return here.',
          actionUrl: data.actionUrl,
        });
        return;
      }

      if (data?.error) {
        if (data.step === 'no_default_payment_method') {
          setNoPaymentMethod(true);
        }
        setSubscribeError(classifyError(data.error, data.step));
        return;
      }

      if (data?.success) {
        // Show congratulations modal instead of just refreshing
        setShowUnlockedModal(true);
      } else {
        setSubscribeError({
          type: 'generic',
          title: 'Subscription Failed',
          description: 'Something went wrong processing your subscription. Please try again or contact support.',
        });
      }
    } catch (error: unknown) {
      console.error('Error subscribing:', error);
      const message = error instanceof Error ? error.message : '';
      setSubscribeError(classifyError(message));
    }
  };

  const handleReactivateSubscription = async () => {
    setReactivating(true);
    try {
      const { data, error } = await supabase.functions.invoke('resubscribe-hiring', {
        body: { companyId: company.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Subscription Reactivated',
        description: 'Your subscription has been renewed and will continue at the next billing period.',
      });

      if (onSubscriptionUpdated) {
        onSubscriptionUpdated();
      }
    } catch (error: unknown) {
      console.error('Error reactivating subscription:', error);
      const message = error instanceof Error ? error.message : 'Failed to reactivate subscription';
      toast({
        title: 'Reactivation failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setReactivating(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    setShowCancelDialog(false);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-hiring-subscription', {
        body: { 
          companyId: company.id,
          cancelImmediately: false, // Cancel at period end
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.cancelledImmediately) {
        toast({
          title: 'Hiring platform disabled',
          description: data.message || 'Hiring platform access has been removed.',
        });
      } else if (data?.cancelAtPeriodEnd) {
        const periodEndDate = data?.periodEnd ? new Date(data.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'the end of the billing period';
        toast({
          title: 'Subscription will be cancelled',
          description: `Your Hiring tab access will continue until ${periodEndDate}. You can reactivate it anytime before then.`,
        });
      } else {
        toast({
          title: 'Subscription cancelled',
          description: 'Your subscription has been cancelled.',
        });
      }

      if (onSubscriptionUpdated) {
        onSubscriptionUpdated();
      }
    } catch (error: unknown) {
      console.error('Error cancelling subscription:', error);
      const message = error instanceof Error ? error.message : 'Failed to cancel subscription';
      toast({
        title: 'Cancellation failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = () => {
    if (!hasActiveSubscription) {
      return <Badge variant="outline">Not Subscribed</Badge>;
    }
    if (isCancelling) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Cancelling</Badge>;
    }
    if (company.hiring_subscription_status === 'active') {
      return <Badge className="bg-green-500">Active</Badge>;
    }
    if (company.hiring_subscription_status === 'trialing') {
      return <Badge className="bg-blue-500">Trial</Badge>;
    }
    if (company.hiring_subscription_status === 'past_due') {
      return <Badge className="bg-red-500">Past Due</Badge>;
    }
    return <Badge variant="outline">{company.hiring_subscription_status}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Monthly Statement
          </CardTitle>
          <CardDescription className="mt-1">
            Open your monthly statement with charges, subscriptions, and extra insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowStatementDialog(true);
                loadMonthlyStatement();
              }}
            >
              View Current Statement
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                loadRenewalEstimate();
                setShowRenewalDialog(true);
              }}
            >
              What&apos;s Charged at Renewal
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card id="hiring-subscription" className="scroll-mt-20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Hiring Tab Subscription
              </CardTitle>
              <CardDescription className="mt-1">
                Manage your premium Hiring & ATS features subscription
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasActiveSubscription ? (
            <>
              {/* Active Subscription Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Monthly Subscription</span>
                  </div>
                  <span className="font-semibold">{isInternalAdminCompany ? '$0/month (Internal)' : '$500/month'}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {isCancelling ? 'Ends on' : 'Renewal date'}
                    </span>
                  </div>
                  <span className="text-sm">
                    {renewalDateLoading ? (
                      <span className="inline-block h-4 w-24 animate-pulse rounded bg-muted-foreground/20 align-middle" />
                    ) : displayedRenewalDate ? (
                      displayedRenewalDate.toLocaleDateString()
                    ) : (
                      'Not available'
                    )}
                  </span>
                </div>

                {isCancelling && (
                  <div className="space-y-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-600">Subscription Cancelling</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          You will lose access to the Hiring tab after {periodEnd?.toLocaleDateString()}.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleReactivateSubscription}
                      disabled={reactivating}
                      size="sm"
                      className="w-full"
                      variant="outline"
                    >
                      {reactivating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Reactivating...
                        </>
                      ) : (
                        'Renew Subscription'
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Features Included */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Features Included:</p>
                <div className="grid gap-2">
                  {[
                    'Job Posting Management',
                    'Visual Pipeline Tracking',
                    'Candidate Database',
                    'Interview Scheduling',
                    'Offer Management',
                    'Email Templates',
                    'Hiring Analytics',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancel Button */}
              {!isCancelling && (
                <div className="border-t pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={cancelling}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {cancelling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel Subscription
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    You'll retain access until the end of your current billing period
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Not Subscribed */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Unlock Premium Hiring Features</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Get access to our complete ATS with job postings, pipeline tracking, 
                        interview scheduling, and advanced hiring analytics.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-semibold">{isInternalAdminCompany ? '$0 per month (Internal Admin)' : '$500 per month'}</p>
                    <p className="text-xs text-muted-foreground">
                      {isInternalAdminCompany ? 'No charge for internal admin company' : 'Cancel anytime'}
                    </p>
                  </div>
                  <Button onClick={handleSubscribe} disabled={subscribing}>
                    {subscribing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Subscribe Now'
                    )}
                  </Button>
                </div>

                {noPaymentMethod && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">No payment method on file</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add a payment method in the <strong>Payment Method</strong> section below, then try subscribing again.
                      </p>
                      <button
                        type="button"
                        onClick={() => document.getElementById('payment-method-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-destructive underline-offset-2 hover:underline"
                      >
                        <ArrowDown className="h-3 w-3" />
                        Go to Payment Method
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {isInternalAdminCompany
                    ? 'Internal admin company billing is free and no credit charges are applied.'
                    : creditContribution > 0
                      ? `$${creditContribution.toFixed(2)} in billing credits will be applied. Your card will be charged $${cardCharge.toFixed(2)}.`
                      : 'Payment will be processed via Stripe. Billing credits will be applied first if available.'}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={subscribing} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-sm [&>button]:hidden"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Processing Subscription</DialogTitle>
            <DialogDescription>
              Please wait while we process your subscription. Do not close this window.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription Error Modal */}
      <Dialog open={!!subscribeError} onOpenChange={(open) => { if (!open) setSubscribeError(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              {subscribeError?.type === 'auth_required' ? (
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              )}
              <DialogTitle className="text-left">{subscribeError?.title}</DialogTitle>
            </div>
            <DialogDescription className="text-left text-sm leading-relaxed">
              {subscribeError?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 pt-2">
            {subscribeError?.type === 'auth_required' && subscribeError.actionUrl && (
              <Button
                className="w-full"
                onClick={() => { window.location.href = subscribeError.actionUrl!; }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Complete Bank Authentication
              </Button>
            )}
            {subscribeError?.type === 'card_declined' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSubscribeError(null);
                  setTimeout(() => {
                    document.getElementById('payment-method-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Update Payment Method
              </Button>
            )}
            <Button
              variant={subscribeError?.type === 'auth_required' ? 'outline' : 'default'}
              className="w-full"
              onClick={() => setSubscribeError(null)}
            >
              {subscribeError?.type === 'auth_required' ? 'Dismiss' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Hiring Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your Hiring tab subscription? You will lose access 
              to all premium hiring features at the end of your current billing period 
              ({periodEnd?.toLocaleDateString()}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelSubscription}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showStatementDialog} onOpenChange={setShowStatementDialog}>
        <DialogContent className="max-w-6xl max-h-[88vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Monthly Statement</DialogTitle>
            <DialogDescription>
              Statement period starts from your company creation date in the B2B portal. Updates automatically every 30 seconds while open.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-3 pb-1">
            <p className="text-xs text-muted-foreground">
              Last updated: {statementLastUpdated ? statementLastUpdated.toLocaleTimeString() : 'Not loaded yet'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMonthlyStatement()}
              disabled={statementLoading}
            >
              {statementLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>

          <div className="flex-1 overflow-auto space-y-4 pr-1">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Billing Cycle Started</p>
                <p className="text-sm font-medium">
                  {statementStartDate ? statementStartDate.toLocaleDateString() : 'Not available yet'}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Renewal Date</p>
                <p className="text-sm font-medium">
                  {displayedRenewalDate ? displayedRenewalDate.toLocaleDateString() : 'Not available yet'}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Net Activity</p>
                <p className={`text-lg font-semibold ${statementTotals.net < 0 ? 'text-green-600' : 'text-foreground'}`}>{formatCurrency(statementTotals.net)}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Gross Activity</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(statementTotals.subscriptions + statementTotals.charges + statementTotals.extraInsights + statementTotals.portalCost)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Total Credits Applied</p>
                <p className="text-sm font-semibold text-green-600">{formatCurrency(statementTotals.creditsApplied)}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Statement Entries</p>
                <p className="text-sm font-semibold">{statementRows.length}</p>
              </div>
            </div>

            <div className={`grid gap-3 sm:grid-cols-2 ${isInternalAdminCompany ? 'lg:grid-cols-4' : 'lg:grid-cols-5'}`}>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Subscriptions</p>
                <p className="text-sm font-semibold">{formatCurrency(statementTotals.subscriptions)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Charges</p>
                <p className="text-sm font-semibold">{formatCurrency(statementTotals.charges)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Extra Insights</p>
                <p className="text-sm font-semibold">{formatCurrency(statementTotals.extraInsights)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Portal Cost</p>
                <p className="text-sm font-semibold">{formatCurrency(statementTotals.portalCost)}</p>
              </div>
              {!isInternalAdminCompany && (
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Credits</p>
                  <p className="text-sm font-semibold">{formatCurrency(statementTotals.creditsApplied)}</p>
                </div>
              )}
            </div>

            <div className="rounded-lg border">
              <div className="grid grid-cols-12 gap-2 border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-3">Date</div>
                <div className="col-span-3">Category</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              {statementLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : statementRows.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No statement activity yet.
                </div>
              ) : (
                <div className="max-h-[52vh] overflow-auto">
                  {statementRows.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => openChargeDetail(row)}
                      className="grid w-full grid-cols-12 gap-2 border-b px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
                    >
                      <div className="col-span-3">{new Date(row.created_at).toLocaleDateString()}</div>
                      <div className="col-span-3">{getCategoryLabel(row.category)}</div>
                      <div className="col-span-4 truncate" title={row.description}>{row.description}</div>
                      <div className="col-span-2 text-right font-medium">{formatCurrency(row.amount)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
        <DialogContent className="max-w-4xl max-h-[88vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>What&apos;s Charged at Renewal</DialogTitle>
            <DialogDescription>
              Full-month billing applies. Any users added before renewal are charged the full monthly seat amount at renewal.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-3 pb-1">
            <p className="text-xs text-muted-foreground">
              Renewal date: {displayedRenewalDate ? displayedRenewalDate.toLocaleDateString() : 'Not available yet'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadRenewalEstimate()}
              disabled={renewalEstimateLoading}
            >
              {renewalEstimateLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>

          <div className="flex-1 overflow-auto space-y-4 pr-1">
            {renewalEstimate && !renewalEstimateLoading && (() => {
              const availableCredits = Number(company.credit_balance || 0);
              const netChargeAfterCredits = Math.max(0, renewalEstimate.totalCharge - availableCredits);
              
              return (
                <div className="space-y-6">
                  {/* Charges Section */}
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Renewal Charges</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-muted/30 p-4">
                        <p className="text-xs text-muted-foreground mb-1">Hiring Subscription</p>
                        <p className="text-2xl font-bold">{formatCurrency(renewalEstimate.hiringCharge)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Monthly subscription</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-4">
                        <p className="text-xs text-muted-foreground mb-1">Portal Seats</p>
                        <p className="text-2xl font-bold">{formatCurrency(renewalEstimate.portalCharge)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {renewalEstimate.billableUsers} seat{renewalEstimate.billableUsers !== 1 ? 's' : ''} × ${PORTAL_COST_PER_USER}/month
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Total & Credits Section */}
                  <div className="border-t pt-4">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Payment Summary</h4>
                    <div className="space-y-3">
                      <div className="rounded-lg bg-muted border border-border p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Subtotal</p>
                          <p className="text-xl font-bold">{formatCurrency(renewalEstimate.totalCharge)}</p>
                        </div>
                      </div>
                      
                      {availableCredits > 0 && (
                        <>
                          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Available Credits</p>
                                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Will be applied automatically</p>
                              </div>
                              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">-{formatCurrency(availableCredits)}</p>
                            </div>
                          </div>
                          
                          <div className="rounded-lg bg-green-600 dark:bg-green-700 border-2 border-green-600 dark:border-green-700 p-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-white">Amount to Charge</p>
                              <p className="text-2xl font-bold text-white">{formatCurrency(netChargeAfterCredits)}</p>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {availableCredits === 0 && (
                        <div className="rounded-lg bg-primary border-2 border-primary p-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-primary-foreground">Amount to Charge</p>
                            <p className="text-2xl font-bold text-primary-foreground">{formatCurrency(renewalEstimate.totalCharge)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Details Section */}
                  <div className="border-t pt-4">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Account Details</h4>
                    <div className="grid gap-3 grid-cols-3">
                      <div className="rounded-md bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground">Active Users</p>
                        <p className="text-lg font-semibold">{renewalEstimate.activeUsers}</p>
                      </div>
                      <div className="rounded-md bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground">Seats Purchased</p>
                        <p className="text-lg font-semibold">{renewalEstimate.seatsPurchased}</p>
                      </div>
                      <div className="rounded-md bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground">Billable Seats</p>
                        <p className="text-lg font-semibold">{renewalEstimate.billableUsers}</p>
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
                    <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                      <strong>Note:</strong> Billable seats = max(active users, seats purchased). Users added mid-cycle are prorated until renewal, then charged the full monthly rate.
                    </p>
                  </div>
                </div>
              );
            })()}

            {renewalEstimateLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChargeDetailDialog} onOpenChange={setShowChargeDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Charge Details</DialogTitle>
            <DialogDescription>
              Detailed information for this statement item.
            </DialogDescription>
          </DialogHeader>

          {selectedStatementRow ? (
            <div className="space-y-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">
                  {new Date(selectedStatementRow.created_at).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm font-medium">{getCategoryLabel(selectedStatementRow.category)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm font-medium">{selectedStatementRow.description}</p>
              </div>
              {(selectedStatementRow.user_email || selectedStatementRow.user_name) && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Charged For</p>
                  <p className="text-sm font-medium">{selectedStatementRow.user_name || 'Unknown'}</p>
                  {selectedStatementRow.user_email && (
                    <p className="text-xs text-muted-foreground mt-1">{selectedStatementRow.user_email}</p>
                  )}
                </div>
              )}
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="text-sm font-semibold">{formatCurrency(selectedStatementRow.amount)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="text-sm font-medium capitalize">{selectedStatementRow.source}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No charge selected.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Hiring Unlocked Success Modal */}
      <HiringUnlockedModal
        open={showUnlockedModal}
        onClose={() => {
          setShowUnlockedModal(false);
          if (onSubscriptionUpdated) onSubscriptionUpdated();
        }}
        onStartTutorial={() => {
          setShowUnlockedModal(false);
          if (onSubscriptionUpdated) onSubscriptionUpdated();
          // Navigate to hiring tab using custom event
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('rcf:b2b-guide-tab-change', { detail: { tab: 'hiring' } }));
            // Set flag to start tutorial after navigation
            localStorage.setItem('rcf_start_hiring_tutorial', 'true');
          }, 100);
        }}
      />
    </>
  );
}
