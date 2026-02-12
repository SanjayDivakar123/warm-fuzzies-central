import { cn } from "@/lib/utils";

interface ColorSegment {
  color: string;
  value: number;
  label?: string;
}

interface StackedColorBarProps {
  segments: ColorSegment[];
  height?: string;
  className?: string;
  showLabels?: boolean;
}

const colorClasses: Record<string, string> = {
  yellow: 'bg-yellow-400',
  red: 'bg-red-400', 
  green: 'bg-green-400',
  blue: 'bg-blue-400',
};

/**
 * Stacked color bar with left alignment and NO gaps between segments.
 * Use for displaying color distributions or multi-category progress bars.
 */
export function StackedColorBar({ 
  segments, 
  height = 'h-3', 
  className,
  showLabels = false,
}: StackedColorBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  
  if (total === 0) return null;

  return (
    <div className={cn("w-full", className)}>
      {/* Bar */}
      <div 
        className={cn(
          "w-full overflow-hidden rounded-full bg-muted flex",
          // No gap between segments - use flex with no space
          height,
        )}
        style={{ margin: 0, padding: 0 }}
      >
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
          if (percentage === 0) return null;
          
          return (
            <div
              key={segment.color + index}
              className={cn(
                "h-full transition-all",
                colorClasses[segment.color] || 'bg-primary',
                // Remove rounded edges for middle segments to avoid gaps
                index === 0 && 'rounded-l-full',
                index === segments.length - 1 && 'rounded-r-full',
              )}
              style={{ 
                width: `${percentage}%`,
                // Ensure no margin/padding creating gaps
                margin: 0,
                padding: 0,
              }}
              title={`${segment.label || segment.color}: ${segment.value}`}
            />
          );
        })}
      </div>
      
      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          {segments.map((segment, index) => {
            const percentage = (segment.value / total) * 100;
            if (percentage < 10) return null; // Don't show label for tiny segments
            
            return (
              <span key={segment.color + index} className="capitalize">
                {segment.label || segment.color}: {Math.round(percentage)}%
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ScoreBarLeftAlignedProps {
  label: string;
  score: number;
  max?: number;
  color?: string;
  className?: string;
}

/**
 * Left-aligned score bar with consistent spacing.
 * No gaps between label, bar, and value.
 */
export function ScoreBarLeftAligned({
  label,
  score,
  max = 100,
  color,
  className,
}: ScoreBarLeftAlignedProps) {
  const percentage = max > 0 ? (score / max) * 100 : 0;
  const bgColor = color ? colorClasses[color] || 'bg-primary' : 'bg-primary';

  return (
    <div className={cn("flex items-center", className)} style={{ gap: 0 }}>
      <span className="w-20 text-sm text-muted-foreground flex-shrink-0 pr-2">
        {label}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden" style={{ margin: 0 }}>
        <div 
          className={cn("h-full transition-all rounded-l-full", bgColor)}
          style={{ width: `${percentage}%`, margin: 0 }}
        />
      </div>
      <span className="w-10 text-sm text-muted-foreground text-right pl-2 flex-shrink-0">
        {score}
      </span>
    </div>
  );
}
