"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';
import { Link } from "react-router-dom";
import { AnimatedGroup } from "@/components/ui/animated-group";
// NOTE: Use a versioned filename to avoid CDN/browser caching issues when swapping images.
import dashboardPreview from "@/assets/dashboard-preview-v2.png";

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
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Leadership Style
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

        {/* Brands Grid */}
        <BrandsGrid className="mt-20" />
      </div>
    </section>
  );
}

export const BrandsGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const brands = [
    { name: "Vercel", logo: "https://assets.rapidui.dev/brands/loops.svg" },
    { name: "PWC", logo: "https://assets.rapidui.dev/brands/pwc.svg" },
    { name: "Resend", logo: "https://assets.rapidui.dev/brands/resend.svg" },
    { name: "Udio", logo: "https://assets.rapidui.dev/brands/udio.svg" },
    { name: "Krea", logo: "https://assets.rapidui.dev/brands/krea.svg" },
    { name: "GoPuff", logo: "https://assets.rapidui.dev/brands/gopuff.svg" },
  ];

  return (
    <div
      ref={ref}
      className={cn("w-full max-w-4xl px-4", className)}
      {...props}
    >
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Trusted by innovative teams worldwide
      </p>

      <AnimatedGroup
        preset="blur-slide"
        className="grid grid-cols-3 gap-8 md:grid-cols-6"
      >
        {brands.map((brand) => (
          <div
            key={brand.name}
            className="flex items-center justify-center opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0"
          >
            <img
              src={brand.logo}
              alt={brand.name}
              className="h-8 w-auto object-contain"
            />
          </div>
        ))}
      </AnimatedGroup>
    </div>
  );
});

BrandsGrid.displayName = "BrandsGrid";

export { HeroSectionWithGradient };
