import { useEffect, useRef } from 'react';
import { useHelpTour } from '@/contexts/HelpTourContext';

/**
 * Hook to automatically start a tour on first visit
 * @param tourId - The ID of the tour to auto-start
 * @param delay - Delay in ms before starting (default 1000ms)
 * @param condition - Optional condition that must be true to start
 */
export function useAutoStartTour(
  tourId: string,
  delay: number = 1000,
  condition: boolean = true
) {
  const { startTour, hasCompletedTour, isActive } = useHelpTour();
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Only trigger once per mount and if conditions are met
    if (
      hasTriggered.current ||
      !condition ||
      isActive ||
      hasCompletedTour(tourId)
    ) {
      return;
    }

    const timer = setTimeout(() => {
      if (!hasCompletedTour(tourId) && !isActive) {
        hasTriggered.current = true;
        startTour(tourId);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [tourId, delay, condition, startTour, hasCompletedTour, isActive]);
}
