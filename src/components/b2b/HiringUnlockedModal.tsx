import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, GraduationCap, X } from 'lucide-react';
import { useHelpTour } from '@/contexts/HelpTourContext';

interface HiringUnlockedModalProps {
  open: boolean;
  onClose: () => void;
  onStartTutorial?: () => void;
}

export default function HiringUnlockedModal({
  open,
  onClose,
  onStartTutorial,
}: HiringUnlockedModalProps) {
  const { startTour } = useHelpTour();

  const handleStartTutorial = () => {
    onClose();
    if (onStartTutorial) {
      onStartTutorial();
    }
    // Start the hiring unlocked tour after navigation
    setTimeout(() => {
      startTour('admin-hiring-unlocked');
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-0">
        <div className="relative bg-gradient-to-b from-primary/20 to-background rounded-lg p-8 text-center">
          {/* Animated sparkles background effect */}
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <div className="absolute top-10 left-10 animate-pulse">
              <Sparkles className="h-4 w-4 text-primary/40" />
            </div>
            <div className="absolute top-20 right-12 animate-pulse delay-100">
              <Sparkles className="h-3 w-3 text-primary/30" />
            </div>
            <div className="absolute bottom-16 left-16 animate-pulse delay-200">
              <Sparkles className="h-5 w-5 text-primary/50" />
            </div>
            <div className="absolute bottom-12 right-20 animate-pulse delay-300">
              <Sparkles className="h-3 w-3 text-primary/40" />
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Animated icon */}
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 animate-bounce">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>

            <div className="space-y-2">
              <DialogTitle className="text-3xl font-bold">
                🎉 Congratulations!
              </DialogTitle>
              <DialogDescription className="text-lg">
                You've successfully unlocked the Hiring Tab!
              </DialogDescription>
            </div>

            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                You now have access to our complete Applicant Tracking System with job postings, 
                pipeline tracking, candidate management, interviews, offers, and more.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button
                onClick={handleStartTutorial}
                size="lg"
                className="w-full"
              >
                <GraduationCap className="h-5 w-5 mr-2" />
                Start Tutorial
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                size="lg"
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              You can access the tutorial anytime from the Help menu
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
