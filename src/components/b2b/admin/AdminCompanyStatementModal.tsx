import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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

  const normalizedName = companyName?.trim().toLowerCase().replace(/\s+/g, '') ?? '';
  const isInternalAdminCompany = normalizedName === 'rolecolorfinderllc' || normalizedName === 'rolecolorfinder';

  useEffect(() => {
    if (!open || !companyId) return;

    const load = async () => {
      setLoading(true);
      try {
        const [companyRes, txRes, creditRes, usedUsersRes] = await Promise.all([
          supabase
            .from('companies')
            .select('created_at, hiring_subscription_enabled, hiring_subscription_status, hiring_subscription_current_period_end')
            .eq('id', companyId)
            .single(),
          supabase
            .from('billing_transactions')
            .select('id, created_at, type, amount, description')
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

        const usersUsed = Math.max(0, usedUsersRes.count || 0);
        const portalMonthlyCost = isInternalAdminCompany ? 0 : usersUsed * PORTAL_COST_PER_USER;

        const txRows: StatementRow[] = transactions
          .filter((row) => !derivedStartDate || new Date(row.created_at) >= derivedStartDate)
          .map((row) => ({
            id: `tx-${row.id}`,
            created_at: row.created_at,
            category: getStatementCategory(row.type, row.description),
            description: row.description || row.type,
            amount: row.amount || 0,
            source: 'transaction' as const,
          }));

        const creditRows: StatementRow[] = isInternalAdminCompany
          ? []
          : credits
              .filter((row) => !derivedStartDate || new Date(row.created_at) >= derivedStartDate)
              .map((row) => ({
                id: `credit-${row.id}`,
                created_at: row.created_at,
                category: 'credit' as const,
                description: row.description || row.type || 'Credit adjustment',
                amount: row.amount || 0,
                source: 'credit' as const,
              }));

        const periodAnchorDate = (derivedStartDate || new Date()).toISOString();
        const portalCostRow: StatementRow = {
          id: `portal-cost-${companyId}-${periodAnchorDate}`,
          created_at: periodAnchorDate,
          category: 'portal_cost',
          description: isInternalAdminCompany
            ? 'Overall Portal Cost (Internal Admin Company - No Charge)'
            : `Overall Portal Cost (${usersUsed} user${usersUsed !== 1 ? 's' : ''} used × $${PORTAL_COST_PER_USER}/month)`,
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

    load();
  }, [open, companyId, companyName, isInternalAdminCompany, toast]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Monthly Statement — {companyName}</DialogTitle>
          <DialogDescription>
            Statement period starts from company creation date in the B2B portal. Portal cost is free only for the
            internal admin company (RoleColorFinder).
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

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : statementRows.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No statement activity yet.</div>
            ) : (
              <div className="max-h-80 overflow-auto">
                {statementRows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-12 gap-2 border-b px-3 py-2 text-sm"
                  >
                    <div className="col-span-3">{new Date(row.created_at).toLocaleDateString()}</div>
                    <div className="col-span-3">{getCategoryLabel(row.category)}</div>
                    <div className="col-span-4 truncate" title={row.description}>
                      {row.description}
                    </div>
                    <div className="col-span-2 text-right font-medium">{formatCurrency(row.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
