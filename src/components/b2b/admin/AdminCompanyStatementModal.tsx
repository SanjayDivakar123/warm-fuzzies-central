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

const PORTAL_COST_PER_USER = 20;

type StatementRow = {
  id: string;
  created_at: string;
  category: 'subscription' | 'charge' | 'extra_insight' | 'credit' | 'portal_cost';
  description: string;
  amount: number;
  source: 'transaction' | 'credit';
};

interface AdminCompanyStatementModalProps {
  companyId: string;
  companyName: string;
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
  open,
  onClose,
}: AdminCompanyStatementModalProps) {
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
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StatementRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const normalizedName = companyName?.trim().toLowerCase().replace(/\s+/g, '') ?? '';
  const isInternalAdminCompany = normalizedName === 'rolecolorfinderllc' || normalizedName === 'rolecolorfinder';

  const loadStatement = async () => {
    setLoading(true);
    try {
      const [companyRes, txRes, creditRes, usedUsersRes] = await Promise.all([
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
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .neq('status', 'revoked'),
      ]);

      if (companyRes.error) throw companyRes.error;
      if (txRes.error) throw txRes.error;
      if (creditRes.error) throw creditRes.error;
      if (usedUsersRes.error) throw usedUsersRes.error;

      const company = companyRes.data;
      const transactions = txRes.data || [];
      const credits = creditRes.data || [];

      const derivedStartDate = company?.created_at
        ? new Date(company.created_at)
        : company?.hiring_subscription_current_period_end
          ? new Date(new Date(company.hiring_subscription_current_period_end).setMonth(new Date(company.hiring_subscription_current_period_end).getMonth() - 1))
          : null;

      setStatementStartDate(derivedStartDate);

      const hasActiveSubscription =
        company?.hiring_subscription_enabled &&
        (company?.hiring_subscription_status === 'active' || company?.hiring_subscription_status === 'trialing');
      const periodEnd = company?.hiring_subscription_current_period_end
        ? new Date(company.hiring_subscription_current_period_end)
        : null;
      const subStart = derivedStartDate;
      setRenewalDate(
        hasActiveSubscription && subStart
          ? getNextRenewalFromStart(subStart)
          : periodEnd
      );

      const activeUsers = Math.max(0, usedUsersRes.count || 0);
      const seatsPurchased = Math.max(2, company.seats_purchased || 2);
      const billableUsers = Math.max(activeUsers, seatsPurchased);
      const portalMonthlyCost = isInternalAdminCompany ? 0 : billableUsers * PORTAL_COST_PER_USER;

      const allTxRows: StatementRow[] = transactions
        .filter((row) => !derivedStartDate || new Date(row.created_at) >= derivedStartDate)
        .map((row) => ({
          id: `tx-${row.id}`,
          created_at: row.created_at,
          category: getStatementCategory(row.type, row.description),
          description: row.description || row.type,
          amount: row.amount || 0,
          source: 'transaction' as const,
        }));

      // Deduplicate hiring tab subscription rows — only show the most recent successful payment
      const subRows = allTxRows.filter((r) => r.category === 'subscription');
      const nonSubRows = allTxRows.filter((r) => r.category !== 'subscription');
      const dedupedSubRows = subRows.length > 0
        ? [subRows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]]
        : [];
      const txRows = [...nonSubRows, ...dedupedSubRows];

      const creditRows: StatementRow[] = isInternalAdminCompany
        ? []
        : credits
            .filter((row) => (!derivedStartDate || new Date(row.created_at) >= derivedStartDate) && row.amount > 0)
            .map((row) => ({
              id: `credit-${row.id}`,
              created_at: row.created_at,
              category: 'credit' as const,
              description: row.description || row.type || 'Credit adjustment',
              amount: -(row.amount || 0), // credits are deductions — they reduce what the company owes
              source: 'credit' as const,
            }));

      const periodAnchorDate = (derivedStartDate || new Date()).toISOString();
      const portalCostRow: StatementRow = {
        id: `portal-cost-${companyId}-${periodAnchorDate}`,
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

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (pendingDelete.source === 'transaction') {
        const rawId = pendingDelete.id.replace(/^tx-/, '');
        const { error } = await supabase.from('billing_transactions').delete().eq('id', rawId);
        if (error) throw error;
      } else {
        const rawId = pendingDelete.id.replace(/^credit-/, '');
        const { error } = await supabase.from('billing_credits').delete().eq('id', rawId);
        if (error) throw error;
      }
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

          <div className="flex-1 overflow-auto space-y-4 pr-1">
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
