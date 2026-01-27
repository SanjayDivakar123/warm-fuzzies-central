import { Check, Cloud, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
}

export function AutoSaveIndicator({ isSaving, lastSaved }: AutoSaveIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {isSaving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </>
      ) : lastSaved ? (
        <>
          <Cloud className="w-4 h-4 text-green-500" />
          <Check className="w-3 h-3 text-green-500 -ml-1" />
          <span>Saved {format(lastSaved, "h:mm a")}</span>
        </>
      ) : null}
    </div>
  );
}
