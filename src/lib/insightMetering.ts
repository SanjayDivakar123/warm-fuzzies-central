/**
 * Insight Usage Metering System
 * 
 * Tracks monthly insight generation per workspace/company.
 * Free tier: 3 insights per calendar month
 * After free tier: requires payment via feature flag
 */

import { supabase } from '@/integrations/supabase/client';

const FREE_INSIGHTS_PER_MONTH = 3;

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
  const insightsPaidEnabled = company?.insights_paid_enabled ?? false;
  const insightCredits = company?.insight_credits ?? 0;
  const allowPayPerInsight = company?.allow_pay_per_insight ?? false;

  // Determine if user can generate
  let canGenerate = remaining > 0;
  let requiresPayment = false;

  if (remaining === 0 && insightsPaidEnabled) {
    // Over free limit, check if they can pay
    if (insightCredits > 0 || allowPayPerInsight) {
      canGenerate = true;
      requiresPayment = true;
    }
  }

  return {
    used: usedThisMonth,
    limit: FREE_INSIGHTS_PER_MONTH,
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
    return { success: false, needsPayment: usage.remaining === 0, usage };
  }

  const currentMonth = getCurrentMonth();

  // If requires payment, decrement credits
  if (usage.requiresPayment) {
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('insight_credits')
        .eq('id', companyId)
        .single() as { data: Record<string, any> | null };

      if (company && company.insight_credits > 0) {
        // Decrement credit
        await supabase
          .from('companies')
          .update({ insight_credits: company.insight_credits - 1 } as any)
          .eq('id', companyId);
      }
    } catch (err) {
      console.warn('Error decrementing insight credits:', err);
    }
    // Note: If allowPayPerInsight is true, we'd record charge intent here
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

  return { 
    success: true, 
    needsPayment: false, 
    usage: {
      ...usage,
      used: usage.used + 1,
      remaining: Math.max(0, usage.remaining - 1),
    } 
  };
}

/**
 * Add insight credits to a company (for purchasing)
 */
export async function addInsightCredits(companyId: string, credits: number): Promise<boolean> {
  const { data: company } = await supabase
    .from('companies')
    .select('insight_credits')
    .eq('id', companyId)
    .single() as { data: Record<string, any> | null };

  const newCredits = (company?.insight_credits || 0) + credits;

  const { error } = await supabase
    .from('companies')
    .update({ insight_credits: newCredits } as any)
    .eq('id', companyId);

  return !error;
}
