// @ts-nocheck
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
  ChevronDown,
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
    portal_billing_anchor_at?: string | null;
    portal_billing_next_renewal_at?: string | null;
    hiring_ever_subscribed?: boolean;
    hiring_commitment_block_cancel_until?: string | null;
  };
  onSubscriptionUpdated?: () => void;
}

export default function HiringSubscriptionSettings({ 
  company, 
  onSubscriptionUpdated 
}: HiringSubscriptionSettingsProps) {
  const INTERNAL_COMPANY_ID = '0f03753c-ea99-4236-9f8c-16324b92f257';
  const PORTAL_COST_PER_USER = 20;
  const MIN_PORTAL_SEATS = 2;

  const isMissingBillingSchemaError = (error: { message?: string; code?: string } | null | undefined) => {
    if (!error) return false;
    const message = (error.message || '').toLowerCase();
    return (
      message.includes('company_portal_billing_periods') ||
      message.includes('billing_period_id') ||
      message.includes('does not exist') ||
      message.includes('could not find the table')
    );
  };

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

  type BillingPeriodRow = {
    id: string;
    period_start: string;
    period_end: string;
    renewal_at: string;
    status: string;
    total_amount: number;
    credits_applied: number;
    card_charged: number;
    outstanding_balance: number;
    failure_reason: string | null;
    created_at: string;
  };

  const hiringCost = 1000;
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
  const [showCommitmentBlockDialog, setShowCommitmentBlockDialog] = useState(false);
  const [showSubscribeConfirm, setShowSubscribeConfirm] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
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
    baselineUsers: number;
    billableUsers: number;
    hiringCharge: number;
    portalCharge: number;
    totalCharge: number;
  } | null>(null);
  const [statementStartDate, setStatementStartDate] = useState<Date | null>(null);
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
  const isInternalAdminCompany = company.id === INTERNAL_COMPANY_ID;

  const isAdminOverride = company.hiring_subscription_enabled && company.hiring_subscription_status === 'admin_override';
  const hasPaidSubscription = company.hiring_subscription_enabled && 
    (company.hiring_subscription_status === 'active' || company.hiring_subscription_status === 'trialing');
  const hasActiveSubscription = hasPaidSubscription || isAdminOverride;
  
  const isCancelling = company.hiring_subscription_cancel_at_period_end;
  const periodEnd = company.hiring_subscription_current_period_end 
    ? new Date(company.hiring_subscription_current_period_end)
    : null;
  const DAY_MS = 1000 * 60 * 60 * 24;
  const daysInMonthUtc = (year: number, monthIndex: number) =>
    new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const buildAnchoredDate = (anchorAt: Date, monthOffset: number) => {
    const anchorYear = anchorAt.getUTCFullYear();
    const anchorMonth = anchorAt.getUTCMonth();
    const anchorDay = anchorAt.getUTCDate();
    const anchorHour = anchorAt.getUTCHours();
    const anchorMinute = anchorAt.getUTCMinutes();
    const anchorSecond = anchorAt.getUTCSeconds();
    const anchorMillisecond = anchorAt.getUTCMilliseconds();

    const totalMonths = anchorMonth + monthOffset;
    const targetYear = anchorYear + Math.floor(totalMonths / 12);
    const normalizedMonth = ((totalMonths % 12) + 12) % 12;
    const targetDay = Math.min(anchorDay, daysInMonthUtc(targetYear, normalizedMonth));

    return new Date(Date.UTC(
      targetYear,
      normalizedMonth,
      targetDay,
      anchorHour,
      anchorMinute,
      anchorSecond,
      anchorMillisecond,
    ));
  };
  const getNextRenewalFromAnchor = (anchorAt: Date, reference: Date) => {
    let monthOffset = 1;
    let candidate = buildAnchoredDate(anchorAt, monthOffset);
    while (candidate.getTime() <= reference.getTime()) {
      monthOffset += 1;
      candidate = buildAnchoredDate(anchorAt, monthOffset);
    }
    return candidate;
  };
  const now = new Date();
  const normalizeFutureRenewal = (input: string | null | undefined) => {
    if (!input) return null;
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) return null;
    const next = new Date(parsed);
    while (next.getTime() <= now.getTime()) {
      next.setUTCMonth(next.getUTCMonth() + 1);
    }
    return next;
  };
  const portalRenewalDate = company.portal_billing_anchor_at
    ? (() => {
        const parsedAnchor = new Date(company.portal_billing_anchor_at);
        if (Number.isNaN(parsedAnchor.getTime())) return null;
        return getNextRenewalFromAnchor(parsedAnchor, now);
      })()
    : normalizeFutureRenewal(company.portal_billing_next_renewal_at);

  // Commitment block: cancellation is disabled until this date (short-window signup clause)
  const commitmentBlockUntil = company.hiring_commitment_block_cancel_until
    ? new Date(company.hiring_commitment_block_cancel_until)
    : null;
  const isInCommitmentPeriod =
    commitmentBlockUntil !== null &&
    !Number.isNaN(commitmentBlockUntil.getTime()) &&
    commitmentBlockUntil > new Date();

  // Proration for pre-purchase summary: whole-day proration against the next renewal date.
  const daysUntilPortalRenewal = portalRenewalDate
    ? Math.max(Math.floor((Date.UTC(portalRenewalDate.getUTCFullYear(), portalRenewalDate.getUTCMonth(), portalRenewalDate.getUTCDate()) - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) / DAY_MS), 0)
    : null;
  const isProrated = daysUntilPortalRenewal !== null && daysUntilPortalRenewal > 0 && daysUntilPortalRenewal < 30;
  // 7-day clause: lock cancellation when < 7 days remain until portal renewal
  const isShortWindow = isProrated && daysUntilPortalRenewal! < 7;
  const billableProrationDays = Math.min(daysUntilPortalRenewal ?? 0, 30);
  const proratedCost = isProrated
    ? Math.round((billableProrationDays / 30) * 1000 * 100) / 100
    : hiringCost;
  const effectiveCreditContribution = Math.min(creditBalance, proratedCost);
  const effectiveCardCharge = proratedCost - effectiveCreditContribution;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  // Portal renewal is the authoritative renewal date; never fall back to the hiring period end
  const displayedRenewalDate = isCancelling ? periodEnd : portalRenewalDate;

  const getStatementCategory = (type: string, description?: string | null): StatementRow['category'] => {
    const normalizedType = (type || '').toLowerCase();
    const normalizedDescription = (description || '').toLowerCase();

    if (normalizedType.includes('insight') || normalizedDescription.includes('insight')) {
      return 'extra_insight';
    }
    if (normalizedDescription.includes('hiring tab subscription') || normalizedType.includes('hiring_subscription')) {
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

      const includedUsers = Math.max(0, count || 0);
      const baselineUsers = MIN_PORTAL_SEATS;
      const billableUsers = Math.max(includedUsers, baselineUsers);

      const hiringCharge = hasPaidSubscription && !isCancelling
        ? (isInternalAdminCompany ? 0 : 500)
        : 0;
      const portalCharge = isInternalAdminCompany ? 0 : billableUsers * PORTAL_COST_PER_USER;
      const totalCharge = hiringCharge + portalCharge;

      setRenewalEstimate({
        activeUsers: includedUsers,
        baselineUsers,
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
      const [creditRes, userChargesRes, periodRes, txWithPeriodRes] = await Promise.all([
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
        supabase
          .from('company_portal_billing_periods')
          .select('id, period_start, period_end, renewal_at, status, total_amount, credits_applied, card_charged, outstanding_balance, failure_reason, created_at')
          .eq('company_id', company.id)
          .order('renewal_at', { ascending: true }),
        supabase
          .from('billing_transactions')
          .select('id, billing_period_id, created_at, type, amount, description')
          .eq('company_id', company.id)
          .order('created_at', { ascending: true }),
      ]);

      if (creditRes.error) throw creditRes.error;
      if (userChargesRes.error) throw userChargesRes.error;

      const billingPeriods = !periodRes.error
        ? (periodRes.data || []) as BillingPeriodRow[]
        : isMissingBillingSchemaError(periodRes.error)
          ? []
          : (() => { throw periodRes.error; })();

      const transactions = !txWithPeriodRes.error
        ? txWithPeriodRes.data || []
        : isMissingBillingSchemaError(txWithPeriodRes.error)
          ? await (async () => {
              const { data, error } = await supabase
                .from('billing_transactions')
                .select('id, created_at, type, amount, description')
                .eq('company_id', company.id)
                .order('created_at', { ascending: true });

              if (error) throw error;
              return (data || []).map((row) => ({
                ...row,
                billing_period_id: null,
              }));
            })()
          : (() => { throw txWithPeriodRes.error; })();

      const credits = creditRes.data || [];
      const chargedUsers = userChargesRes.data || [];

      const derivedStartDate = company.portal_billing_anchor_at
        ? new Date(company.portal_billing_anchor_at)
        : company.created_at
          ? new Date(company.created_at)
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
      const informationalSubRows = subRows.filter((row) => {
        const description = row.description.toLowerCase();
        return Math.abs(row.amount) < 0.01 && (description.includes('cancel') || description.includes('no refund'));
      });
      const billableSubRows = subRows.filter((row) => !informationalSubRows.includes(row));
      const dedupedSubRows = billableSubRows.length > 0
        ? [billableSubRows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0], ...informationalSubRows]
        : informationalSubRows;
      const txRows = [...nonSubRows, ...dedupedSubRows];
      const transactionPeriodIds = new Set(
        transactions
          .map((row) => row.billing_period_id)
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
      );

      const periodFallbackRows: StatementRow[] = billingPeriods
        .filter((period) => !derivedStartDate || new Date(period.renewal_at) >= derivedStartDate)
        .filter((period) => !transactionPeriodIds.has(period.id))
        .filter((period) => period.total_amount > 0 || period.outstanding_balance > 0)
        .map((period) => ({
          id: `period-${period.id}`,
          created_at: period.renewal_at,
          category: period.status === 'failed' ? 'charge' : 'portal_cost',
          description: period.status === 'failed'
            ? period.failure_reason || 'Portal renewal failed'
            : `Portal renewal for billing period ending ${new Date(period.period_end).toLocaleDateString()}`,
          amount: period.status === 'failed' ? period.outstanding_balance || period.total_amount : period.total_amount,
          source: 'transaction' as const,
        }));

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

      const rowsToInclude = [
        ...txRows,
        ...periodFallbackRows,
        ...inviteChargeFallbackRows,
        ...creditRows,
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

      if (isInternalAdminCompany) {
        totals.net = 0;
      }

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
    const shouldLockScroll = showStatementDialog || showRenewalDialog;
    if (!shouldLockScroll) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [showStatementDialog, showRenewalDialog]);

  useEffect(() => {
    setRenewalDateLoading(false);
  }, [company.id, company.portal_billing_next_renewal_at, company.hiring_subscription_current_period_end]);

  // Translate raw Stripe / edge-function messages into clean user-facing errors
  const classifyError = (msg: string, step?: string): NonNullable<typeof subscribeError> => {
    const m = (msg || '').toLowerCase();
    if (m.includes('no such customer')) {
      return {
        type: 'card_declined',
        title: 'Payment Method Needs to Be Updated',
        description: 'Your saved billing profile could not be found in our current payment system. Please update your payment method below and then try subscribing again.',
      };
    }
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
        description: 'Your card was declined. This may be due to insufficient funds, a frozen card, or your bank blocking the $1,000 charge. Please update your payment method and try again.',
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

      // Commitment block: backend returns a structured non-error so the UI can explain it
      if (data?.error === 'COMMITMENT_BLOCK') {
        setShowCommitmentBlockDialog(true);
        return;
      }

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
    if (isAdminOverride) {
      return <Badge variant="secondary">Admin Override</Badge>;
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
                    <span className="text-sm font-medium">{isAdminOverride ? 'Access Source' : 'Monthly Subscription'}</span>
                  </div>
                  <span className="font-semibold">{isAdminOverride ? 'Manual admin override' : isInternalAdminCompany ? '$0/month (Internal)' : '$1,000/month'}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {isAdminOverride ? 'Shared company renewal date' : isCancelling ? 'Ends on' : 'Renewal date'}
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

                {isAdminOverride && (
                  <div className="space-y-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm font-medium text-blue-700">Hiring access is being provided by an admin override.</p>
                    <p className="text-xs text-muted-foreground">
                      This company currently has access without a Stripe-backed paid hiring subscription.
                    </p>
                  </div>
                )}

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
              {!isCancelling && !isAdminOverride && (
                <div className="border-t pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (isInCommitmentPeriod) {
                        setShowCommitmentBlockDialog(true);
                      } else {
                        setShowCancelDialog(true);
                      }
                    }}
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
                    <p className="font-semibold">
                      {isInternalAdminCompany
                        ? '$0 per month (Internal Admin)'
                        : isProrated
                          ? `$${proratedCost.toFixed(2)} today`
                          : '$1,000 per month'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isInternalAdminCompany
                        ? 'No charge for internal admin company'
                        : isProrated
                          ? `Prorated for ${daysUntilPortalRenewal} day${daysUntilPortalRenewal === 1 ? '' : 's'} until renewal, then $1,000/month`
                          : 'Cancel anytime'}
                    </p>
                  </div>
                  <Button onClick={() => setShowSubscribeConfirm(true)} disabled={subscribing}>
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
                    : effectiveCreditContribution > 0
                      ? `$${effectiveCreditContribution.toFixed(2)} in billing credits will be applied. Your card will be charged $${effectiveCardCharge.toFixed(2)}.`
                      : `Payment will be processed via Stripe. ${isProrated ? `Today's charge is $${proratedCost.toFixed(2)}.` : '$1,000/month will be charged.'} Billing credits will be applied first if available.`}
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

      {/* Commitment Block Dialog — shown when user tries to cancel during the short-window period */}
      <AlertDialog open={showCommitmentBlockDialog} onOpenChange={setShowCommitmentBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancellation Unavailable</AlertDialogTitle>
            <AlertDialogDescription>
              Your Hiring subscription was started within 7 days of your portal renewal date. Cancellation is
              temporarily unavailable until{' '}
              <strong>
                {commitmentBlockUntil?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) ?? 'your next renewal'}
              </strong>
              , when the first full monthly billing cycle begins.
              <br /><br />
              After that date you'll be able to cancel anytime in the normal way.
              <br /><br />
              If you have any questions or concerns, reach out to support@rolecolorfinder.com.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowCommitmentBlockDialog(false)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pre-purchase Confirmation Dialog */}
      <Dialog open={showSubscribeConfirm} onOpenChange={(open) => { if (!open) { setShowSubscribeConfirm(false); setShowLearnMore(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subscribe to Hiring Tab</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1">
                {isProrated ? (
                  <p className="text-sm leading-relaxed">
                    Your portal renews on {portalRenewalDate!.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ({Math.ceil(daysUntilPortalRenewal!)} day{Math.ceil(daysUntilPortalRenewal!) !== 1 ? 's' : ''} away).
                    Today's charge is prorated to{' '}
                    <strong>${proratedCost.toFixed(2)}</strong>. Your first full <strong>$1,000/month</strong> renewal is on that date.
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed">
                    You'll be charged <strong>$1,000/month</strong> starting today. Billing credits are applied first.
                  </p>
                )}

                {effectiveCreditContribution > 0 && (
                  <div className="rounded-md bg-muted/60 p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Today's cost</span>
                      <span className="font-medium">${proratedCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span>Credits applied</span>
                      <span>−${effectiveCreditContribution.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-semibold">
                      <span>Card charge</span>
                      <span>${effectiveCardCharge.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {isShortWindow && (
                  <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-800">
                    <strong>Note: </strong>Cancellation is unavailable until{' '}
                    {portalRenewalDate!.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {' '}because your subscription starts within 7 days of your portal renewal.
                  </div>
                )}

                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowLearnMore((v) => !v)}
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showLearnMore ? 'rotate-180' : ''}`} />
                  {showLearnMore ? 'Hide details' : 'Learn more about billing'}
                </button>

                {showLearnMore && (
                  <div className="rounded-md border p-3 text-xs text-muted-foreground space-y-2">
                    {isProrated ? (
                      <>
                        <p><strong>Why am I charged a partial amount?</strong> Your first payment is prorated to cover only the days remaining until your portal renewal on {portalRenewalDate!.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
                        <p><strong>When is the next $1,000 charge?</strong> On {portalRenewalDate!.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, when your portal renews. A standard $1,000/month Hiring cycle begins from that date.</p>
                        {isShortWindow && <p><strong>Why can't I cancel right away?</strong> With fewer than 7 days until renewal, you're committing through that renewal date so you get at least one full monthly cycle.</p>}
                        <p><strong>How do credits work?</strong> Billing credits are applied to today's prorated charge. Future renewals use the normal credit-first flow.</p>
                      </>
                    ) : (
                      <>
                        <p><strong>When am I billed?</strong> $1,000 is charged today and every month on the same date. Billing credits are applied before your card is charged.</p>
                        <p><strong>Can I cancel?</strong> Yes, at any time. You'll retain access through the end of your current billing period.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full"
              onClick={() => { setShowSubscribeConfirm(false); setShowLearnMore(false); handleSubscribe(); }}
              disabled={subscribing}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isProrated
                ? `Confirm — $${proratedCost.toFixed(2)} today`
                : `Confirm — $${effectiveCardCharge > 0 ? effectiveCardCharge.toFixed(2) : '0.00'} card${effectiveCreditContribution > 0 ? ` + $${effectiveCreditContribution.toFixed(2)} credits` : ''}`}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => { setShowSubscribeConfirm(false); setShowLearnMore(false); }}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

          <div className="flex-1 overflow-auto space-y-4 pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/20 hover:[&::-webkit-scrollbar-thumb]:bg-black/30 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
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
                <div className="max-h-[52vh] overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/20 hover:[&::-webkit-scrollbar-thumb]:bg-black/30 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
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

          <div
            className="-mr-6 flex-1 space-y-4 overflow-y-auto pr-6 sm:-mr-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/15"
            style={{ scrollbarColor: 'rgba(255,255,255,0.14) transparent' }}
          >
            {renewalEstimate && !renewalEstimateLoading && (() => {
              const availableCredits = Number(company.credit_balance || 0);
              const creditsApplied = Math.min(Math.max(availableCredits, 0), renewalEstimate.totalCharge);
              const netChargeAfterCredits = isInternalAdminCompany
                ? 0
                : Math.max(0, renewalEstimate.totalCharge - creditsApplied);
              
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
                          {renewalEstimate.billableUsers} billable user{renewalEstimate.billableUsers !== 1 ? 's' : ''} × ${PORTAL_COST_PER_USER}/month
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
                      
                      {creditsApplied > 0 && (
                        <>
                          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Expected Credits Applied</p>
                                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Will be applied automatically</p>
                              </div>
                              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">-{formatCurrency(creditsApplied)}</p>
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
                        <p className="text-xs text-muted-foreground">Invited + Active Users</p>
                        <p className="text-lg font-semibold">{renewalEstimate.activeUsers}</p>
                      </div>
                      <div className="rounded-md bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground">Minimum Included Users</p>
                        <p className="text-lg font-semibold">{renewalEstimate.baselineUsers}</p>
                      </div>
                      <div className="rounded-md bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground">Billable Users</p>
                        <p className="text-lg font-semibold">{renewalEstimate.billableUsers}</p>
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
                    <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                      <strong>Note:</strong> Portal renewals charge the greater of invited plus active users or the 2-user minimum baseline. Users added mid-cycle are prorated until the shared company renewal date, then charged the full monthly rate.
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
