import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

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

interface AdminCompanyStatementModalProps {
  companyId: string;
  companyName: string;
  initialView?: 'statement' | 'renewal';
  open: boolean;
  onClose: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const getStatementCategory = (type: string, description?: string | null): StatementRow['category'] => {
  const normalizedType = (type || '').toLowerCase();
  const normalizedDescription = (description || '').toLowerCase();
  if (normalizedType.includes('insight') || normalizedDescription.includes('insight')) return 'extra_insight';
  if (normalizedDescription.includes('hiring tab subscription')) return 'subscription';
  if (normalizedType.includes('user_addition')) {
    if (normalizedType.includes('credit')) return 'credit';
    if (normalizedType.includes('failed')) return 'charge';
    return 'charge';
  }
  if (normalizedType.includes('monthly_billing')) {
    if (normalizedType.includes('credit')) return 'credit';
    if (normalizedType.includes('failed')) return 'charge';
    return 'portal_cost';
  }
  if (normalizedType.includes('credit')) return 'credit';
  return 'charge';
};

const getCategoryLabel = (category: StatementRow['category']) => {
  if (category === 'subscription') return 'Subscription';
  if (category === 'extra_insight') return 'Extra Insights';
  if (category === 'portal_cost') return 'Portal Cost';
  if (category === 'credit') return 'Credits';
  return 'Charges';
};

const getCategoryColor = (category: StatementRow['category']) => {
  if (category === 'subscription') return 'text-blue-500';
  if (category === 'extra_insight') return 'text-purple-500';
  if (category === 'portal_cost') return 'text-orange-500';
  if (category === 'credit') return 'text-green-500';
  return 'text-foreground';
};

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

export default function AdminCompanyStatementModal({
  companyId,
  companyName,
  initialView = 'statement',
  open,
  onClose,
}: AdminCompanyStatementModalProps) {
  const INTERNAL_COMPANY_ID = '0f03753c-ea99-4236-9f8c-16324b92f257';
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [statementRows, setStatementRows] = useState<StatementRow[]>([]);
  const [statementTotals, setStatementTotals] = useState({
    charges: 0,
    subscriptions: 0,
    extraInsights: 0,
    portalCost: 0,
    creditsApplied: 0,
    net: 0,
  });
  const [statementStartDate, setStatementStartDate] = useState<Date | null>(null);
  const [renewalDate, setRenewalDate] = useState<Date | null>(null);
  const [activeView, setActiveView] = useState<'statement' | 'renewal'>(initialView);
  const [renewalPreview, setRenewalPreview] = useState({
    portalCost: 0,
    hiringCost: 0,
    total: 0,
    willRenewHiring: false,
  });
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StatementRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isInternalAdminCompany = companyId === INTERNAL_COMPANY_ID;

  const loadStatement = async () => {
    setLoading(true);
    try {
      const [companyRes, txRes, creditRes, userChargesRes] = await Promise.all([
        supabase
          .from('companies')
          .select('created_at, seats_purchased, hiring_subscription_enabled, hiring_subscription_status, hiring_subscription_current_period_end')
          .eq('id', companyId)
          .single(),
        supabase
          .from('billing_transactions')
          .select('id, created_at, type, amount, description, stripe_payment_intent_id')
          .eq('company_id', companyId)
          .order('created_at', { ascending: true }),
        supabase
          .from('billing_credits')
          .select('id, created_at, amount, description, type')
          .eq('company_id', companyId)
          .order('created_at', { ascending: true }),
        supabase
          .from('company_users')
          .select('id, email, full_name, charged_at, charge_amount')
          .eq('company_id', companyId)
          .not('charged_at', 'is', null)
          .gt('charge_amount', 0)
          .order('charged_at', { ascending: true }),
      ]);

      if (companyRes.error) throw companyRes.error;
      if (txRes.error) throw txRes.error;
      if (creditRes.error) throw creditRes.error;
      if (userChargesRes.error) throw userChargesRes.error;

      const company = companyRes.data;
      const transactions = txRes.data || [];
      const credits = creditRes.data || [];
      const chargedUsers = userChargesRes.data || [];

      const derivedStartDate = company?.created_at
        ? new Date(company.created_at)
        : company?.hiring_subscription_current_period_end
          ? new Date(new Date(company.hiring_subscription_current_period_end).setMonth(new Date(company.hiring_subscription_current_period_end).getMonth() - 1))
          : null;

      setStatementStartDate(derivedStartDate);

      const hasActiveSubscription =
        company?.hiring_subscription_enabled &&
        (company?.hiring_subscription_status === 'active' || company?.hiring_subscription_status === 'trialing');
      const hasCancelledAtPeriodEnd = !!company?.hiring_subscription_cancel_at_period_end;
      const periodEnd = company?.hiring_subscription_current_period_end
        ? new Date(company.hiring_subscription_current_period_end)
        : null;
      const subStart = derivedStartDate;
      setRenewalDate(
        hasActiveSubscription && subStart
          ? getNextRenewalFromStart(subStart)
          : periodEnd
      );

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
      const creditRows: StatementRow[] = isInternalAdminCompany
        ? []
        : credits
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
      const hiringRenewalCost = isInternalAdminCompany ? 0 : (hasActiveSubscription && !hasCancelledAtPeriodEnd ? 500 : 0);
      setRenewalPreview({
        portalCost: basePortalMonthlyCost,
        hiringCost: hiringRenewalCost,
        total: basePortalMonthlyCost + hiringRenewalCost,
        willRenewHiring: hiringRenewalCost > 0,
      });
      const periodAnchorDate = (derivedStartDate || new Date()).toISOString();
      const basePortalCostRow: StatementRow | null = hasMonthlyBillingRow
        ? null
        : {
            id: `portal-base-${companyId}-${periodAnchorDate}`,
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
      ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
    } catch (error: any) {
      console.error('Error loading statement:', error);
      toast({
        title: 'Failed to load statement',
        description: error.message || 'Unable to load billing statement.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !companyId) return;
    loadStatement();
  }, [open, companyId, companyName, isInternalAdminCompany]);

  useEffect(() => {
    if (open) {
      setActiveView(initialView);
    }
  }, [initialView, open]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const rawId = pendingDelete.source === 'transaction'
        ? pendingDelete.id.replace(/^tx-/, '')
        : pendingDelete.id.replace(/^credit-/, '');

      const { data, error } = await supabase.functions.invoke('delete-billing-entry', {
        body: { entryId: rawId, source: pendingDelete.source },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Entry deleted', description: 'The statement entry has been removed.' });
      setPendingDelete(null);
      await loadStatement();
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message || 'Could not delete entry.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const isDeletable = (row: StatementRow) => row.category !== 'portal_cost';

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Monthly Statement — {companyName}</DialogTitle>
            <DialogDescription>
              Statement period starts from company creation date. Portal cost is free only for the internal admin company (RoleColorFinder). Click any row to expand details. Trash icon removes the entry permanently.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={activeView === 'statement' ? 'default' : 'outline'}
              onClick={() => setActiveView('statement')}
            >
              View Statement
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeView === 'renewal' ? 'default' : 'outline'}
              onClick={() => setActiveView('renewal')}
            >
              View Renewal Statement
            </Button>
          </div>

          <div className="flex-1 overflow-auto space-y-4 pr-1">
            {activeView === 'renewal' ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Next Renewal Date</p>
                    <p className="text-sm font-medium">
                      {renewalDate ? renewalDate.toLocaleDateString() : 'Not available yet'}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Recurring Total</p>
                    <p className="text-sm font-medium">{formatCurrency(renewalPreview.total)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Hiring Renewal Status</p>
                    <p className="text-sm font-medium">
                      {renewalPreview.willRenewHiring ? 'Will renew' : 'Not scheduled to renew'}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border">
                  <div className="grid grid-cols-12 gap-2 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
                    <div className="col-span-8">Renewal Line Item</div>
                    <div className="col-span-4 text-right">Amount</div>
                  </div>
                  <div className="divide-y">
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center">
                      <div className="col-span-8 text-muted-foreground">Base Portal Cost (monthly recurring)</div>
                      <div className="col-span-4 text-right font-semibold">{formatCurrency(renewalPreview.portalCost)}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center">
                      <div className="col-span-8 text-muted-foreground">
                        Hiring Subscription (monthly recurring)
                        {!renewalPreview.willRenewHiring ? ' — cancellation scheduled' : ''}
                      </div>
                      <div className="col-span-4 text-right font-semibold">{formatCurrency(renewalPreview.hiringCost)}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center bg-muted/20">
                      <div className="col-span-8 font-medium">Projected Renewal Total</div>
                      <div className="col-span-4 text-right font-bold">{formatCurrency(renewalPreview.total)}</div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Billing credits on the company wallet are applied first at renewal time before any card charge.
                </p>
              </>
            ) : (
              <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Billing Cycle Started</p>
                <p className="text-sm font-medium">
                  {statementStartDate ? statementStartDate.toLocaleDateString() : 'Not available yet'}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Renewal Date</p>
                <p className="text-sm font-medium">
                  {renewalDate ? renewalDate.toLocaleDateString() : 'Not available yet'}
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
                  <p className="text-xs text-muted-foreground">Credits (deduction)</p>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(statementTotals.creditsApplied)}</p>
                </div>
              )}
            </div>

            <div className="rounded-lg border">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-2">Date & Time</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-6">Description</div>
                <div className="col-span-1 text-right">Amount</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : statementRows.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No statement activity yet.</div>
              ) : (
                <div className="divide-y">
                  {statementRows.map((row) => {
                    const isExpanded = expandedRowId === row.id;
                    const d = new Date(row.created_at);
                    return (
                      <div key={row.id} className="group">
                        <div
                          className="grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-muted/20 cursor-pointer items-center"
                          onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                        >
                          <div className="col-span-2 text-xs text-muted-foreground">
                            <div>{d.toLocaleDateString()}</div>
                            <div>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                          <div className={`col-span-2 font-medium text-xs ${getCategoryColor(row.category)}`}>
                            {getCategoryLabel(row.category)}
                          </div>
                          <div className="col-span-6 text-sm text-muted-foreground">
                            {row.description}
                          </div>
                          <div className={`col-span-1 text-right font-semibold text-sm ${row.amount < 0 ? 'text-green-600' : ''}`}>
                            {formatCurrency(row.amount)}
                          </div>
                          <div className="col-span-1 flex justify-end items-center gap-1">
                            {isExpanded
                              ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                              : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            }
                            {isDeletable(row) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => { e.stopPropagation(); setPendingDelete(row); }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t bg-muted/10 px-4 py-3 text-xs space-y-1.5">
                            <div className="flex gap-4 flex-wrap">
                              <div>
                                <span className="text-muted-foreground">ID: </span>
                                <span className="font-mono">{row.id}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Source: </span>
                                <span className="capitalize">{row.source}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Full Date: </span>
                                <span>{new Date(row.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Full Description: </span>
                              <span>{row.description}</span>
                            </div>
                            {(row.user_email || row.user_name) && (
                              <div className="pt-1">
                                <span className="text-muted-foreground">Charged For: </span>
                                <span className="font-medium">{row.user_name || 'Unknown'}</span>
                                {row.user_email && (
                                  <span className="text-muted-foreground ml-2">({row.user_email})</span>
                                )}
                              </div>
                            )}
                            {isDeletable(row) && (
                              <div className="pt-1">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setPendingDelete(row)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1.5" />
                                  Delete this entry
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete statement entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{pendingDelete?.description}</strong> ({pendingDelete ? formatCurrency(pendingDelete.amount) : ''}) from the billing records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
