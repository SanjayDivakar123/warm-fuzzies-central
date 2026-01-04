import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  motion, 
  useMotionValue, 
  useMotionTemplate, 
  useAnimationFrame 
} from "framer-motion";
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { GooeyText } from '@/components/ui/gooey-text-morphing';
import { ParticleTextEffect } from '@/components/ui/interactive-text-particle';
import { HyperText } from '@/components/ui/hyper-text';
import { FlipWords } from '@/components/ui/flip-words';

/**
 * Helper component for the SVG grid pattern.
 */
const GridPattern = ({ offsetX, offsetY, size }: { offsetX: any; offsetY: any; size: number }) => {
  const patternId = React.useId();
  
  return (
    <svg className="absolute inset-0 h-full w-full">
      <defs>
        <pattern
          id={patternId}
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d={`M ${size} 0 L 0 0 0 ${size}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
};

/**
 * The Infinite Grid Component - RoleColor Hero
 */
const InfiniteGrid = () => {
  const navigate = useNavigate();
  const [gridSize] = useState(40);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track mouse position with Motion Values for performance
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  // Grid offsets for infinite scroll animation
  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  const speedX = 0.3; 
  const speedY = 0.3;

  useAnimationFrame(() => {
    const currentX = gridOffsetX.get();
    const currentY = gridOffsetY.get();
    gridOffsetX.set((currentX + speedX) % gridSize);
    gridOffsetY.set((currentY + speedY) % gridSize);
  });

  // Radial mask for the "flashlight" effect
  const maskImage = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-[90vh] overflow-hidden bg-background"
      aria-label="Hero section"
    >
      {/* Layer 1: Subtle background grid */}
      <div className="absolute inset-0 text-muted-foreground/15">
        <motion.div className="absolute inset-0" style={{ x: gridOffsetX, y: gridOffsetY }}>
          <GridPattern offsetX={0} offsetY={0} size={gridSize} />
        </motion.div>
      </div>

      {/* Layer 2: Highlighted grid (revealed by mouse) */}
      <motion.div
        className="absolute inset-0 text-primary/40"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} />
      </motion.div>

      {/* Decorative Blur Spheres - RoleColor themed */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-yellow/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-red/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-green/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-blue/20 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] px-4 py-20">
        <div className="text-center max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <div className="h-20 sm:h-24 md:h-32 lg:h-40 xl:h-48 w-full max-w-4xl mx-auto">
              <ParticleTextEffect
                text="LEADERSHIP"
                colors={['eab308', 'facc15', 'ef4444', 'f87171', '22c55e', '4ade80', '3b82f6', '60a5fa', 'a855f7']}
                animationForce={60}
                particleDensity={3}
              />
            </div>
            <h1 className="sr-only">we discover leadership styles</h1>
            <div className="h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 flex items-center justify-center mt-4">
              <GooeyText
                texts={["that makes you shine.", "that drives results.", "that inspires teams.", "that adapts to change."]}
                morphTime={1.5}
                cooldownTime={1}
                className="h-full"
                textClassName="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium text-primary"
              />
            </div>
            <div className="flex justify-center mt-4">
              <HyperText
                text="Then, learn how to adapt."
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light text-muted-foreground"
                duration={1200}
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-4xl mx-auto mb-10"
          >
            Receive your unique RoleColor™ profile,
            <FlipWords 
              words={["leadership insights", "team strategies", "adaptive strengths", "practical guidance"]} 
              className="text-primary font-medium"
              duration={2500}
            />
            <br className="hidden sm:block" />
            and practical strategies to adapt across different team stages and challenges.
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <InteractiveHoverButton 
              text="Get Started Now"
              onClick={() => navigate('/free-assessment')}
              className="text-lg py-4 px-8"
            />

            <Button variant="ghost" size="lg" className="text-base px-8 py-4" asChild>
              <a 
                href="https://static.wixstatic.com/ugd/9b68f8_417b1cdded3c4bef94e31bea9343cf47.pdf" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3"
              >
                <FileText className="w-5 h-5" />
                <span>Download Brochure</span>
              </a>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default InfiniteGrid;
