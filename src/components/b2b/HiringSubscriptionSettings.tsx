import { useEffect, useState } from 'react';
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

interface HiringSubscriptionSettingsProps {
  company: {
    id: string;
    name: string;
    created_at?: string;
    seats_purchased?: number;
    hiring_subscription_enabled?: boolean;
    hiring_subscription_status?: string;
    hiring_subscription_cancel_at_period_end?: boolean;
    hiring_subscription_current_period_end?: string;
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
  };

  const [subscribing, setSubscribing] = useState(false);
  const [noPaymentMethod, setNoPaymentMethod] = useState(false);
  const [subscribeError, setSubscribeError] = useState<{
    title: string;
    description: string;
    actionUrl?: string;
    type: 'auth_required' | 'card_declined' | 'generic';
  } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showStatementDialog, setShowStatementDialog] = useState(false);
  const [showChargeDetailDialog, setShowChargeDetailDialog] = useState(false);
  const [selectedStatementRow, setSelectedStatementRow] = useState<StatementRow | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementRows, setStatementRows] = useState<StatementRow[]>([]);
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

  const loadMonthlyStatement = async () => {
    setStatementLoading(true);
    try {
      const [txRes, creditRes, usedUsersRes] = await Promise.all([
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
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .neq('status', 'revoked'),
      ]);

      if (txRes.error) throw txRes.error;
      if (creditRes.error) throw creditRes.error;
      if (usedUsersRes.error) throw usedUsersRes.error;

      const transactions = txRes.data || [];
      const credits = creditRes.data || [];

      const derivedStartDate = company.created_at
        ? new Date(company.created_at)
        : company.hiring_subscription_current_period_end
          ? new Date(new Date(company.hiring_subscription_current_period_end).setMonth(new Date(company.hiring_subscription_current_period_end).getMonth() - 1))
          : null;

      setStatementStartDate(derivedStartDate);

      const activeUsers = Math.max(0, usedUsersRes.count || 0);
      const seatsPurchased = Math.max(2, company.seats_purchased || 2);
      // Billed for whichever is greater: seats purchased or active users (minimum 2 seats = $40/mo)
      const billableUsers = Math.max(activeUsers, seatsPurchased);
      // Portal cost is free only for the internal admin company (RoleColorFinder); all others pay $20/user/month
      const portalMonthlyCost = isInternalAdminCompany ? 0 : billableUsers * PORTAL_COST_PER_USER;

      const txRows: StatementRow[] = transactions
        .filter((row) => !derivedStartDate || new Date(row.created_at) >= derivedStartDate)
        .map((row) => {
          const category = getStatementCategory(row.type, row.description);
          return {
            id: `tx-${row.id}`,
            created_at: row.created_at,
            category,
            description: row.description || row.type,
            amount: row.amount || 0,
            source: 'transaction',
          };
        });

      const creditRows: StatementRow[] = isInternalAdminCompany ? [] : credits
        .filter((row) => !derivedStartDate || new Date(row.created_at) >= derivedStartDate)
        .map((row) => ({
          id: `credit-${row.id}`,
          created_at: row.created_at,
          category: 'credit',
          description: row.description || row.type || 'Credit adjustment',
          amount: row.amount || 0,
          source: 'credit',
        }));

      const periodAnchorDate = (derivedStartDate || new Date()).toISOString();
      const portalCostRow: StatementRow = {
        id: `portal-cost-${company.id}-${periodAnchorDate}`,
        created_at: periodAnchorDate,
        category: 'portal_cost',
        description: isInternalAdminCompany
          ? 'Overall Portal Cost (Internal Admin Company - No Charge)'
          : `Overall Portal Cost (${billableUsers} seat${billableUsers !== 1 ? 's' : ''} × $${PORTAL_COST_PER_USER}/month${billableUsers > activeUsers ? ` — minimum ${seatsPurchased} purchased` : ''})`,
        amount: portalMonthlyCost,
        source: 'transaction',
      };

      const rowsToInclude = [...txRows, ...creditRows, portalCostRow];
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
    } catch (error: any) {
      console.error('Error loading monthly statement:', error);
      toast({
        title: 'Failed to load statement',
        description: error.message || 'Unable to load billing statement right now.',
        variant: 'destructive',
      });
    } finally {
      setStatementLoading(false);
    }
  };

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
  const classifyError = (msg: string, step?: string): typeof subscribeError => {
    const m = (msg || '').toLowerCase();
    if (step === 'no_default_payment_method' || m.includes('no payment method') || m.includes('no default payment')) {
      return null; // handled separately via noPaymentMethod state
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
    if (m.includes('declined') || m.includes('insufficient funds') || m.includes('do_not_honor') || m.includes('frozen')) {
      return {
        type: 'card_declined',
        title: 'Card Issue',
        description: 'There was a problem with your card on file. It may be declined, frozen, or have insufficient funds. Please update your payment method and try again.',
      };
    }
    return {
      type: 'generic',
      title: 'Subscription Failed',
      description: 'Something went wrong processing your subscription. Please try again or contact support if the issue persists.',
    };
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    setNoPaymentMethod(false);
    setSubscribeError(null);
    try {
      const { data, error } = await supabase.functions.invoke('subscribe-hiring-tab', {
        body: { companyId: company.id },
      });

      // Parse actual error body from edge function
      if (error) {
        let payload: any = null;
        try { payload = await (error as any).context?.json?.(); } catch {}
        const step = payload?.step || data?.step;
        const msg = payload?.error || data?.error || error.message || '';

        if (step === 'no_default_payment_method' || msg.toLowerCase().includes('no payment method') || msg.toLowerCase().includes('no default payment')) {
          setNoPaymentMethod(true);
          setTimeout(() => {
            document.getElementById('payment-method-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        } else {
          setSubscribeError(classifyError(msg, step));
        }
        setSubscribing(false);
        return;
      }

      // 3DS / bank authentication required (new edge function response)
      if (data?.requiresAction) {
        setSubscribeError({
          type: 'auth_required',
          title: 'Card Requires Verification',
          description: 'Your bank requires additional verification before this payment can go through. Click below to complete the authentication step, then return here.',
          actionUrl: data.actionUrl,
        });
        setSubscribing(false);
        return;
      }

      if (data?.error) {
        const step = data.step;
        const msg: string = data.error || '';
        if (step === 'no_default_payment_method' || msg.toLowerCase().includes('no payment method')) {
          setNoPaymentMethod(true);
          setTimeout(() => {
            document.getElementById('payment-method-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        } else {
          setSubscribeError(classifyError(msg, step));
        }
        setSubscribing(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      if (data?.success && onSubscriptionUpdated) {
        onSubscriptionUpdated();
      }
    } catch (error: any) {
      console.error('Error subscribing:', error);
      setSubscribeError(classifyError(error.message || ''));
      setSubscribing(false);
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

      toast({
        title: 'Subscription will be cancelled',
        description: `Your Hiring tab access will end on ${data.periodEnd ? new Date(data.periodEnd).toLocaleDateString() : 'the end of the billing period'}`,
      });

      if (onSubscriptionUpdated) {
        onSubscriptionUpdated();
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Cancellation failed',
        description: error.message || 'Failed to cancel subscription',
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
          <Button
            variant="outline"
            onClick={() => {
              setShowStatementDialog(true);
              loadMonthlyStatement();
            }}
          >
            View Statement
          </Button>
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
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-600">Subscription Cancelling</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You will lose access to the Hiring tab after {periodEnd?.toLocaleDateString()}.
                      </p>
                    </div>
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
                    : 'Payment will be processed via Stripe. Billing credits will be applied first, then your card on file will be charged.'}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Monthly Statement</DialogTitle>
            <DialogDescription>
              Statement period starts from your company creation date in the B2B portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
                <p className="text-sm font-medium">{formatCurrency(statementTotals.net)}</p>
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
                <div className="max-h-80 overflow-auto">
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
    </>
  );
}
