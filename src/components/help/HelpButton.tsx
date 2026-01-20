import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Play, RotateCcw, CheckCircle2, BookOpen } from 'lucide-react';
import { useHelpTour, TourDefinition } from '@/contexts/HelpTourContext';
import { cn } from '@/lib/utils';

interface HelpButtonProps {
  /** Filter to only show certain tours */
  tourFilter?: (tour: TourDefinition) => boolean;
  /** Custom class names */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Whether to show as icon-only */
  iconOnly?: boolean;
}

export function HelpButton({ 
  tourFilter, 
  className, 
  size = 'default',
  iconOnly = false 
}: HelpButtonProps) {
  const { availableTours, startTour, hasCompletedTour, resetTourProgress, isActive } = useHelpTour();
  const [open, setOpen] = useState(false);

  const filteredTours = tourFilter 
    ? availableTours.filter(tourFilter) 
    : availableTours;

  const handleStartTour = (tourId: string) => {
    setOpen(false);
    // Small delay to allow dropdown to close
    setTimeout(() => startTour(tourId), 100);
  };

  const handleResetTour = (tourId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    resetTourProgress(tourId);
  };

  if (filteredTours.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size={size === 'sm' ? 'icon' : size}
          className={cn(
            'relative',
            size === 'sm' && 'h-8 w-8',
            className
          )}
          disabled={isActive}
        >
          <HelpCircle className={cn(
            size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
            !iconOnly && 'mr-2'
          )} />
          {!iconOnly && <span>Help</span>}
          {/* Notification dot if there are incomplete tours */}
          {filteredTours.some(t => !hasCompletedTour(t.id)) && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Guided Tours
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {filteredTours.map((tour) => {
          const isCompleted = hasCompletedTour(tour.id);
          
          return (
            <DropdownMenuItem
              key={tour.id}
              onClick={() => handleStartTour(tour.id)}
              className="flex flex-col items-start gap-1 py-3 cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Play className="h-4 w-4 text-primary" />
                  )}
                  <span className="font-medium">{tour.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {isCompleted && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => handleResetTour(tour.id, e)}
                      title="Restart tour"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {tour.steps.length} steps
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                {tour.description}
              </p>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Esc</kbd> to exit a tour
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
