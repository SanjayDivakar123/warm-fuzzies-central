/**
 * Smooth Scroll Utility
 * 
 * Provides configurable smooth scrolling across the site.
 * Adjust SCROLL_DURATION to change the speed of all programmatic scrolling.
 */

// ========================================
// SCROLL SPEED CONFIGURATION
// Change this value to adjust scroll animation duration (in milliseconds)
// Lower values = faster scrolling (e.g., 300)
// Higher values = slower, smoother scrolling (e.g., 1200)
// ========================================
export const SCROLL_DURATION = 800; // milliseconds

/**
 * Easing function for smooth scroll animation
 * Uses ease-in-out cubic for natural feel
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Smoothly scroll to a specific Y position
 * @param targetY - The target scroll position in pixels
 * @param duration - Animation duration in milliseconds (defaults to SCROLL_DURATION)
 */
export function smoothScrollTo(targetY: number, duration: number = SCROLL_DURATION): Promise<void> {
  return new Promise((resolve) => {
    const startY = window.scrollY;
    const difference = targetY - startY;
    const startTime = performance.now();

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);
      
      window.scrollTo(0, startY + difference * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(step);
  });
}

/**
 * Smoothly scroll to an element by ID
 * @param elementId - The ID of the element to scroll to (without #)
 * @param offset - Optional offset from the top (for fixed headers, etc.)
 * @param duration - Animation duration in milliseconds (defaults to SCROLL_DURATION)
 */
export function smoothScrollToElement(
  elementId: string, 
  offset: number = 0, 
  duration: number = SCROLL_DURATION
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with id "${elementId}" not found`);
    return Promise.resolve();
  }

  const elementPosition = element.getBoundingClientRect().top + window.scrollY;
  const targetPosition = elementPosition - offset;

  return smoothScrollTo(targetPosition, duration);
}

/**
 * Smoothly scroll to the top of the page
 * @param duration - Animation duration in milliseconds (defaults to SCROLL_DURATION)
 */
export function smoothScrollToTop(duration: number = SCROLL_DURATION): Promise<void> {
  return smoothScrollTo(0, duration);
}

/**
 * Smoothly scroll to the bottom of the page
 * @param duration - Animation duration in milliseconds (defaults to SCROLL_DURATION)
 */
export function smoothScrollToBottom(duration: number = SCROLL_DURATION): Promise<void> {
  const documentHeight = document.documentElement.scrollHeight;
  const windowHeight = window.innerHeight;
  return smoothScrollTo(documentHeight - windowHeight, duration);
}
