import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TruncatedTextProps {
  text: string | null | undefined;
  fallback?: React.ReactNode;
  maxWidth?: string;
  className?: string;
  tooltipSide?: "top" | "bottom" | "left" | "right";
}

/**
 * A text component that truncates long text with ellipsis
 * and shows the full text in a tooltip on hover.
 */
export function TruncatedText({
  text,
  fallback = <span className="text-muted-foreground">Not set</span>,
  maxWidth = "150px",
  className,
  tooltipSide = "top",
}: TruncatedTextProps) {
  if (!text) {
    return <>{fallback}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "block truncate cursor-default",
            className
          )}
          style={{ maxWidth }}
        >
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide} className="max-w-[300px] break-all">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
