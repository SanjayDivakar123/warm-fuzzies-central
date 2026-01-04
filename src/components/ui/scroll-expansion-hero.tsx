'use client';

import {
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { motion } from 'framer-motion';

interface ScrollExpansionHeroProps {
  children?: ReactNode;
  heroContent: ReactNode;
  scrollToExpand?: string;
}

const ScrollExpansionHero = ({
  children,
  heroContent,
  scrollToExpand = "↓ Scroll to explore",
}: ScrollExpansionHeroProps) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [heroFullyExpanded, setHeroFullyExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isMobileState, setIsMobileState] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (heroFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setHeroFullyExpanded(false);
        setShowContent(false);
        e.preventDefault();
      } else if (!heroFullyExpanded) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.002;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setHeroFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (heroFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setHeroFullyExpanded(false);
        setShowContent(false);
        e.preventDefault();
      } else if (!heroFullyExpanded) {
        e.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.01 : 0.008;
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setHeroFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }

        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = (): void => {
      setTouchStartY(0);
    };

    const handleScroll = (): void => {
      if (!heroFullyExpanded) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scrollProgress, heroFullyExpanded, touchStartY]);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Calculate hero container dimensions based on scroll
  const heroScale = 0.85 + scrollProgress * 0.15;
  const heroBorderRadius = 24 - scrollProgress * 24;
  const heroOpacity = 1 - scrollProgress * 0.3;

  return (
    <div className="relative w-full" ref={sectionRef}>
      {/* Fixed Hero Container */}
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4 md:p-8"
        style={{
          opacity: heroFullyExpanded ? 0 : 1,
          pointerEvents: heroFullyExpanded ? 'none' : 'auto',
          transition: 'opacity 0.5s ease-out',
        }}
      >
        <motion.div
          className="relative w-full h-full overflow-hidden bg-background shadow-2xl"
          style={{
            scale: heroScale,
            borderRadius: `${heroBorderRadius}px`,
          }}
        >
          {/* Hero content inside the expanding container */}
          {heroContent}
          
          {/* Scroll indicator */}
          {scrollProgress < 0.3 && (
            <motion.div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1 - scrollProgress * 3, y: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <p className="text-muted-foreground font-medium text-sm animate-bounce">
                {scrollToExpand}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Spacer to account for fixed hero */}
      <div className="h-screen" />

      {/* Content that appears after expansion */}
      <motion.div
        className="relative z-20 bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ pointerEvents: showContent ? 'auto' : 'none' }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default ScrollExpansionHero;
