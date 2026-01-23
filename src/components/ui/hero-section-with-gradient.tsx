"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';
import { Link } from "react-router-dom";
import { AnimatedGroup } from "@/components/ui/animated-group";
// NOTE: Use a versioned filename to avoid CDN/browser caching issues when swapping images.
import dashboardPreview from "@/assets/dashboard-preview-v4.png";

export default function HeroSectionWithGradient() {
  const gradientRef = useRef<HTMLDivElement>(null);

  const transitionVariants = {
    item: {
      hidden: {
        opacity: 0,
        filter: "blur(12px)",
        y: 12,
      },
      visible: {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        transition: {
          type: "spring" as const,
          bounce: 0.3,
          duration: 1.5,
        },
      },
    },
  };

  useEffect(() => {
    if (!gradientRef.current) return;
    gsap.fromTo(
      gradientRef.current,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 1.6, ease: "power3.out" }
    );
  }, []);

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Gradient Background */}
      <div
        ref={gradientRef}
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.3), transparent),
            radial-gradient(ellipse 60% 40% at 80% 20%, hsl(var(--secondary) / 0.2), transparent),
            radial-gradient(ellipse 50% 30% at 20% 80%, hsl(var(--primary) / 0.15), transparent)
          `,
        }}
      />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <AnimatedGroup
            variants={{
              container: {
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              },
              item: transitionVariants.item,
            }}
            className="space-y-8"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-muted-foreground">Built on Tuckman's Team Development Model</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Discover Your{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">
                  Leadership Style
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent blur-lg opacity-60" aria-hidden="true">
                  Leadership Style
                </span>
              </span>
            </h1>

            {/* Description */}
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Unlock your team's potential with RoleColorFinder. Our behavioral assessment reveals how each person leads, decides, and collaborates — so you can build stronger teams that thrive at every stage.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="min-w-[160px]">
                <Link to="/free-assessment">
                  Take Free Assessment
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="min-w-[160px]">
                <Link to="/b2b">
                  For Teams & Businesses
                </Link>
              </Button>
            </div>
          </AnimatedGroup>
        </div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          className="mt-16 w-full max-w-5xl px-4"
        >
          <div className="relative overflow-hidden rounded-xl border border-border/50 bg-white shadow-2xl">
            <img
              src={dashboardPreview}
              alt="RoleColorFinder Dashboard Preview"
              className="w-full h-auto object-contain"
            />
            {/* Gradient overlay on image */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent" />
          </div>
        </motion.div>

        {/* RoleColor Badges */}
        <RoleColorBadges className="mt-16" />
      </div>
    </section>
  );
}

const roleColors = [
  {
    name: "Red",
    label: "Motivator",
    description: "Vision-driven leaders who inspire and persuade",
    color: "bg-red-500",
    textColor: "text-red-500",
    borderColor: "border-red-500/40",
    bgLight: "bg-red-500/10",
    glowColor: "shadow-red-500/40",
    pulseColor: "bg-red-400",
  },
  {
    name: "Yellow",
    label: "Executor",
    description: "Action-first builders who get things done",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    borderColor: "border-yellow-500/40",
    bgLight: "bg-yellow-500/10",
    glowColor: "shadow-yellow-500/40",
    pulseColor: "bg-yellow-400",
  },
  {
    name: "Green",
    label: "Architect",
    description: "Logic-based thinkers with precision focus",
    color: "bg-green-500",
    textColor: "text-green-500",
    borderColor: "border-green-500/40",
    bgLight: "bg-green-500/10",
    glowColor: "shadow-green-500/40",
    pulseColor: "bg-green-400",
  },
  {
    name: "Blue",
    label: "Visionary",
    description: "Innovation-focused strategists and researchers",
    color: "bg-blue-500",
    textColor: "text-blue-500",
    borderColor: "border-blue-500/40",
    bgLight: "bg-blue-500/10",
    glowColor: "shadow-blue-500/40",
    pulseColor: "bg-blue-400",
  },
];

export const RoleColorBadges = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("w-full max-w-4xl px-4", className)}
      {...props}
    >
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Discover which behavioral style defines you
      </p>

      <AnimatedGroup
        preset="blur-slide"
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {roleColors.map((role, index) => (
          <motion.div
            key={role.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.1,
              type: "spring", 
              stiffness: 300, 
              damping: 20 
            }}
            whileHover={{ scale: 1.08, y: -6 }}
            className={cn(
              "group relative flex flex-col items-center gap-3 rounded-xl border p-5 backdrop-blur-sm transition-all duration-300",
              "hover:shadow-xl",
              role.borderColor,
              role.bgLight,
              `hover:${role.glowColor}`
            )}
            style={{
              boxShadow: 'none',
            }}
          >
            {/* Glow effect on hover */}
            <div 
              className={cn(
                "absolute inset-0 rounded-xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-30",
                role.color
              )}
            />
            
            {/* Animated dot with pulse */}
            <div className="relative">
              <span className={cn(
                "absolute inline-flex h-5 w-5 animate-ping rounded-full opacity-40",
                role.pulseColor
              )} />
              <div className={cn("relative h-5 w-5 rounded-full shadow-lg", role.color)} />
            </div>
            
            <div className="relative text-center">
              <p className={cn("font-bold text-lg", role.textColor)}>{role.name}</p>
              <p className="text-sm text-muted-foreground font-medium">{role.label}</p>
            </div>
          </motion.div>
        ))}
      </AnimatedGroup>
    </div>
  );
});

RoleColorBadges.displayName = "RoleColorBadges";

export { HeroSectionWithGradient };
