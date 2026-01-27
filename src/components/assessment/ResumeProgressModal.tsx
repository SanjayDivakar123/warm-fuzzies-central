import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Clock, RotateCcw, Play } from "lucide-react";

interface ResumeProgressModalProps {
  open: boolean;
  onResume: () => void;
  onStartFresh: () => void;
  answeredCount: number;
  totalQuestions: number;
  lastSavedAt: Date | null;
}

export function ResumeProgressModal({
  open,
  onResume,
  onStartFresh,
  answeredCount,
  totalQuestions,
  lastSavedAt,
}: ResumeProgressModalProps) {
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-center">
            Continue Where You Left Off?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3">
            <p>
              You have an assessment in progress with{" "}
              <span className="font-semibold text-foreground">
                {answeredCount} of {totalQuestions}
              </span>{" "}
              questions answered ({progressPercent}%).
            </p>
            {lastSavedAt && (
              <p className="text-sm text-muted-foreground">
                Last saved: {format(lastSavedAt, "MMM dd, yyyy 'at' h:mm a")}
              </p>
            )}
            <div className="w-full bg-muted rounded-full h-2 mt-4">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onStartFresh} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Start Fresh
          </AlertDialogCancel>
          <AlertDialogAction onClick={onResume} className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Continue Assessment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
