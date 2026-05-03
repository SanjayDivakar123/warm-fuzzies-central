// @ts-nocheck
import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Sparkles } from 'lucide-react';
import { getInsightUsage, type InsightUsage } from '@/lib/insightMetering';

interface InsightUsageMeterProps {
  companyId: string;
  onUsageChange?: (usage: InsightUsage) => void;
  usageOverride?: InsightUsage | null;
  className?: string;
}

/**
 * Displays insight usage meter with dynamic monthly usage denominator.
 */
export function InsightUsageMeter({ companyId, onUsageChange, usageOverride = null, className = '' }: InsightUsageMeterProps) {
  const [usage, setUsage] = useState<InsightUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, [companyId]);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const data = await getInsightUsage(companyId);
      setUsage(data);
      onUsageChange?.(data);
    } catch (err) {
      console.error('Error fetching insight usage:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayUsage = usageOverride ?? usage;

  if ((loading && !displayUsage) || !displayUsage) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Lightbulb className="h-4 w-4 animate-pulse" />
        Loading usage...
      </div>
    );
  }

  const percentage = (displayUsage.used / displayUsage.limit) * 100;
  const isAtLimit = displayUsage.remaining === 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium">AI Insights</span>
        </div>
        <span className={`ml-auto shrink-0 pl-2 font-medium tabular-nums ${isAtLimit ? 'text-amber-600' : 'text-muted-foreground'}`}>
          {displayUsage.used} / {displayUsage.limit} used
        </span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2"
        style={{ 
          // Ensure left alignment with no gaps
          margin: 0,
          padding: 0,
        }}
      />
      {isAtLimit && (
        <p className="text-xs font-medium text-amber-600">Free limit reached</p>
      )}
    </div>
  );
}

export { type InsightUsage };
