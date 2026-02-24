import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { useHelpTour } from '@/contexts/HelpTourContext';
import { cn } from '@/lib/utils';

interface Position {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

// Inner component that uses hooks - only rendered after mount
function TourTooltipInner() {
  const { activeTour, currentStepIndex, isActive, nextStep, prevStep, endTour } = useHelpTour();
  const [position, setPosition] = useState<Position | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = activeTour?.steps[currentStepIndex];

  // Calculate position based on target element
  useEffect(() => {
    if (!currentStep || !isActive) {
      setPosition(null);
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const padding = 16;
      const arrowSize = 12;
      const tooltipWidth = Math.min(tooltipRef.current?.offsetWidth ?? 350, window.innerWidth - padding * 2);
      const tooltipHeight = tooltipRef.current?.offsetHeight ?? 220;
      const target = document.querySelector(currentStep.target);
      if (!target) {
        // If target not found, show tooltip in center
        setPosition({
          top: Math.max(padding, window.innerHeight / 2 - tooltipHeight / 2),
          left: Math.max(padding, window.innerWidth / 2 - tooltipWidth / 2),
          arrowPosition: 'top',
        });
        setTargetRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      setTargetRect(rect);

      let top = 0;
      let left = 0;
      let arrowPosition: Position['arrowPosition'] = 'top';

      const placement = currentStep.placement || 'bottom';

      switch (placement) {
        case 'bottom':
          top = rect.bottom + arrowSize + padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          arrowPosition = 'top';
          break;
        case 'top':
          top = rect.top - tooltipHeight - arrowSize - padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          arrowPosition = 'bottom';
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - arrowSize - padding;
          arrowPosition = 'right';
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + arrowSize + padding;
          arrowPosition = 'left';
          break;
      }

      // Keep tooltip within viewport
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

      setPosition({ top, left, arrowPosition });

      // Scroll target into view if needed
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updatePosition();
    const rafId = window.requestAnimationFrame(updatePosition);
    
    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [currentStep, isActive]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          endTour();
          break;
        case 'ArrowRight':
        case 'Enter':
          nextStep();
          break;
        case 'ArrowLeft':
          prevStep();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, nextStep, prevStep, endTour]);

  if (!isActive || !activeTour || !currentStep || !position) {
    return null;
  }

  const totalSteps = activeTour.steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const arrowClasses = {
    top: 'before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-b-background',
    bottom: 'before:absolute before:-bottom-2 before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-t-background',
    left: 'before:absolute before:-left-2 before:top-1/2 before:-translate-y-1/2 before:border-8 before:border-transparent before:border-r-background',
    right: 'before:absolute before:-right-2 before:top-1/2 before:-translate-y-1/2 before:border-8 before:border-transparent before:border-l-background',
  };

  return createPortal(
    <>
      {/* Spotlight overlay - subtle highlight on target */}
      {targetRect && (
        <div 
          className="fixed inset-0 pointer-events-none z-[9998]"
          style={{
            background: `radial-gradient(ellipse ${targetRect.width + 40}px ${targetRect.height + 40}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent 0%, rgba(0,0,0,0.1) 100%)`,
          }}
        />
      )}

      {/* Target highlight ring */}
      {targetRect && (
        <div
          className="fixed pointer-events-none z-[9999] rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background transition-all duration-300"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <Card
        ref={tooltipRef}
        className={cn(
          'fixed z-[10000] w-[min(350px,calc(100vw-2rem))] shadow-2xl border-2 border-primary/20 animate-in fade-in-0 zoom-in-95 duration-200',
          arrowClasses[position.arrowPosition]
        )}
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Lightbulb className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-semibold text-sm">{currentStep.title}</h4>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-1 -mt-1"
              onClick={endTour}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Content */}
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {currentStep.content}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            {/* Step indicator */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === currentStepIndex
                      ? 'w-4 bg-primary'
                      : 'w-1.5 bg-muted-foreground/30'
                  )}
                />
              ))}
              <span className="ml-2 text-xs text-muted-foreground">
                {currentStepIndex + 1}/{totalSteps}
              </span>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <Button variant="ghost" size="sm" onClick={prevStep} className="h-7 px-2">
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={nextStep} className="h-7 px-3">
                {isLastStep ? 'Done' : 'Next'}
                {!isLastStep && <ChevronRight className="h-3.5 w-3.5 ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>,
    document.body
  );
}

// Wrapper component that ensures client-side only rendering
export function TourTooltip() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until after mount to avoid SSR/hydration issues with hooks
  if (!mounted) {
    return null;
  }

  return <TourTooltipInner />;
}
