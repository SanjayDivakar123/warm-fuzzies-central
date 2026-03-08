/**
 * Insight Usage Metering System
 * 
 * Tracks monthly insight generation per workspace/company.
 * Free tier: 3 insights per calendar month
 * After free tier: requires payment via feature flag
 */

import { supabase } from '@/integrations/supabase/client';

const FREE_INSIGHTS_PER_MONTH = 3;

function getDisplayLimit(usedThisMonth: number): number {
  // Once paid insights are used, keep the meter denominator aligned (4/4, 5/5, ...).
  return Math.max(FREE_INSIGHTS_PER_MONTH, usedThisMonth);
}

export interface InsightUsage {
  used: number;
  limit: number;
  remaining: number;
  canGenerate: boolean;
  requiresPayment: boolean;
  currentMonth: string; // YYYY-MM format
}

export interface InsightMeteringSettings {
  insightsPaidEnabled: boolean;
  insightCredits: number;
  allowPayPerInsight: boolean;
}

interface InsightPurchasePricing {
  amountUsd?: number;
  amountLocal?: number;
  currency?: string;
  countryCode?: string;
}

/**
 * Get the current month string in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  // Use UTC month boundaries so reset timing is consistent for all companies.
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Fetch insight usage for a company for the current month
 */
export async function getInsightUsage(companyId: string): Promise<InsightUsage> {
  const currentMonth = getCurrentMonth();
  
  // Get company settings - use try/catch to handle missing columns gracefully
  let company: Record<string, any> | null = null;
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('insight_usage_count, insight_usage_month, insights_paid_enabled, insight_credits, allow_pay_per_insight')
      .eq('id', companyId)
      .single();
    
    if (error) {
      // If columns don't exist yet, return default values allowing free usage
      console.warn('Error fetching insight usage (columns may not exist):', error.message);
      return {
        used: 0,
        limit: FREE_INSIGHTS_PER_MONTH,
        remaining: FREE_INSIGHTS_PER_MONTH,
        canGenerate: true,
        requiresPayment: false,
        currentMonth,
      };
    }
    company = data;
  } catch (err) {
    console.warn('Exception fetching insight usage:', err);
    return {
      used: 0,
      limit: FREE_INSIGHTS_PER_MONTH,
      remaining: FREE_INSIGHTS_PER_MONTH,
      canGenerate: true,
      requiresPayment: false,
      currentMonth,
    };
  }

  // Reset count if new month
  let usedThisMonth = 0;
  if (company?.insight_usage_month === currentMonth) {
    usedThisMonth = company.insight_usage_count || 0;
  }

  const remaining = Math.max(0, FREE_INSIGHTS_PER_MONTH - usedThisMonth);
  const insightCredits = company?.insight_credits ?? 0;

  // Over free quota is only allowed when a paid insight credit exists.
  const canGenerate = remaining > 0 || insightCredits > 0;
  const requiresPayment = remaining === 0 && insightCredits <= 0;

  return {
    used: usedThisMonth,
    limit: getDisplayLimit(usedThisMonth),
    remaining,
    canGenerate,
    requiresPayment,
    currentMonth,
  };
}

/**
 * Increment insight usage count for a company
 * Returns true if successful, false if blocked
 */
export async function incrementInsightUsage(companyId: string): Promise<{ success: boolean; needsPayment: boolean; usage: InsightUsage }> {
  const usage = await getInsightUsage(companyId);
  
  if (!usage.canGenerate) {
    return { success: false, needsPayment: usage.requiresPayment, usage };
  }

  const currentMonth = getCurrentMonth();

  // Over free quota: require a paid insight credit and consume one.
  if (usage.remaining === 0) {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('insight_credits')
      .eq('id', companyId)
      .single() as { data: Record<string, any> | null; error: any };

    if (companyError) {
      console.warn('Error loading insight credits:', companyError.message || companyError);
      return { success: false, needsPayment: true, usage };
    }

    const currentCredits = Number(company?.insight_credits || 0);
    if (currentCredits <= 0) {
      return { success: false, needsPayment: true, usage };
    }

    const { error: creditError } = await supabase
      .from('companies')
      .update({ insight_credits: currentCredits - 1 } as any)
      .eq('id', companyId);

    if (creditError) {
      console.warn('Error decrementing insight credits:', creditError.message || creditError);
      return { success: false, needsPayment: true, usage };
    }
  }

  // Update usage count - if columns don't exist, continue anyway
  try {
    const { error } = await supabase
      .from('companies')
      .update({
        insight_usage_count: usage.used + 1,
        insight_usage_month: currentMonth,
      } as any)
      .eq('id', companyId);

    if (error) {
      // Log but don't fail - columns may not exist yet
      console.warn('Error updating insight usage (columns may not exist):', error.message);
    }
  } catch (err) {
    console.warn('Exception updating insight usage:', err);
  }

  const nextUsed = usage.used + 1;
  const nextRemaining = Math.max(0, FREE_INSIGHTS_PER_MONTH - nextUsed);

  return { 
    success: true, 
    needsPayment: false, 
    usage: {
      ...usage,
      used: nextUsed,
      limit: getDisplayLimit(nextUsed),
      remaining: nextRemaining,
    } 
  };
}

/**
 * Add insight credits to a company (for purchasing)
 */
export async function addInsightCredits(
  companyId: string,
  credits: number,
  purchasePricing?: number | InsightPurchasePricing,
): Promise<boolean> {
  const legacyAmountUsd = typeof purchasePricing === 'number' ? purchasePricing : undefined;
  const amountUsd = typeof purchasePricing === 'object' ? purchasePricing?.amountUsd : legacyAmountUsd;
  const amountLocal = typeof purchasePricing === 'object' ? purchasePricing?.amountLocal : undefined;
  const currency = typeof purchasePricing === 'object' ? purchasePricing?.currency : undefined;
  const countryCode = typeof purchasePricing === 'object' ? purchasePricing?.countryCode : undefined;

  const amountToCharge = Number.isFinite(amountUsd as number)
    ? Math.max(0, amountUsd as number)
    : credits;

  const { data, error } = await supabase.functions.invoke('purchase-insight-credits', {
    body: {
      company_id: companyId,
      credits,
      amount_usd: amountToCharge,
      ...(Number.isFinite(amountLocal as number) && { amount_local: amountLocal }),
      ...(currency && { currency }),
      ...(countryCode && { country_code: countryCode }),
    },
  });

  if (error || data?.error) {
    console.warn('Failed to purchase insight credits:', error?.message || data?.error);
    return false;
  }

  return true;
}
