"use client";

import React, { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

type AnimationPreset = 
  | "fade-up" 
  | "fade-down" 
  | "fade-left" 
  | "fade-right" 
  | "zoom-in" 
  | "zoom-out"
  | "flip-up"
  | "blur-in";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  preset?: AnimationPreset;
  delay?: number;
  duration?: number;
  once?: boolean;
  threshold?: number;
}

const presetVariants: Record<AnimationPreset, Variants> = {
  "fade-up": {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-down": {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-left": {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  "fade-right": {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  "zoom-in": {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  "zoom-out": {
    hidden: { opacity: 0, scale: 1.2 },
    visible: { opacity: 1, scale: 1 },
  },
  "flip-up": {
    hidden: { opacity: 0, rotateX: -30, y: 20 },
    visible: { opacity: 1, rotateX: 0, y: 0 },
  },
  "blur-in": {
    hidden: { opacity: 0, filter: "blur(10px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
};

export function ScrollReveal({
  children,
  className,
  preset = "fade-up",
  delay = 0,
  duration = 0.6,
  once = true,
  threshold = 0.2,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: threshold });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={presetVariants[preset]}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={cn(className)}
      style={{ perspective: preset === "flip-up" ? "1000px" : undefined }}
    >
      {children}
    </motion.div>
  );
}

// Staggered children animation
interface ScrollRevealGroupProps {
  children: React.ReactNode;
  className?: string;
  preset?: AnimationPreset;
  staggerDelay?: number;
  duration?: number;
  once?: boolean;
  threshold?: number;
}

export function ScrollRevealGroup({
  children,
  className,
  preset = "fade-up",
  staggerDelay = 0.1,
  duration = 0.6,
  once = true,
  threshold = 0.2,
}: ScrollRevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: threshold });

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants = presetVariants[preset];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className={cn(className)}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={itemVariants}
          transition={{ duration, ease: [0.25, 0.4, 0.25, 1] }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
