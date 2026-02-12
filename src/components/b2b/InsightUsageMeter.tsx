import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Sparkles } from 'lucide-react';
import { getInsightUsage, type InsightUsage } from '@/lib/insightMetering';

interface InsightUsageMeterProps {
  companyId: string;
  onUsageChange?: (usage: InsightUsage) => void;
  className?: string;
}

/**
 * Displays insight usage meter: "X / 3 free insights used this month"
 */
export function InsightUsageMeter({ companyId, onUsageChange, className = '' }: InsightUsageMeterProps) {
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

  if (loading || !usage) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Lightbulb className="h-4 w-4 animate-pulse" />
        Loading usage...
      </div>
    );
  }

  const percentage = (usage.used / usage.limit) * 100;
  const isAtLimit = usage.remaining === 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium">AI Insights</span>
        </div>
        <span className={`font-medium ${isAtLimit ? 'text-amber-600' : 'text-muted-foreground'}`}>
          {usage.used} / {usage.limit} free used
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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
            Free limit reached
          </Badge>
          {usage.canGenerate && (
            <span className="text-xs text-muted-foreground">
              Paid insights available
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export { type InsightUsage };
