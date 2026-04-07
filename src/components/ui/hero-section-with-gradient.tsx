"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from "react-router-dom";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { X, Target, Heart, Brain, Lightbulb, Users, Zap, CheckCircle, TrendingUp } from "lucide-react";
// NOTE: Use a versioned filename to avoid CDN/browser caching issues when swapping images.
import dashboardPreview from "@/assets/dashboard-preview-v4.png";

// Floating Particles Background Component
const ParticleBackground = () => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.5 + 0.1,
    color: ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--red-500))', 'hsl(var(--yellow-500))', 'hsl(var(--green-500))', 'hsl(var(--blue-500))'][Math.floor(Math.random() * 6)]
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            scale: [1, 1.2, 1],
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* Larger glowing orbs */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full blur-xl"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
            width: 60 + i * 10,
            height: 60 + i * 10,
            background: `radial-gradient(circle, ${['hsl(var(--red-500) / 0.15)', 'hsl(var(--yellow-500) / 0.15)', 'hsl(var(--green-500) / 0.15)', 'hsl(var(--blue-500) / 0.15)'][i % 4]} 0%, transparent 70%)`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 12 + i * 2,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// 3D Tilt Card Component for Hero Image
const TiltCard = ({ className }: { className?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate rotation based on mouse position relative to center
    const rotateX = ((e.clientY - centerY) / (rect.height / 2)) * -8;
    const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 8;
    
    setTransform({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTransform({ rotateX: 0, rotateY: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      className={cn(className)}
      style={{ perspective: "1500px" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        animate={{
          rotateX: transform.rotateX,
          rotateY: transform.rotateY,
          scale: isHovering ? 1.02 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* Glowing shadow underneath */}
        <div 
          className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-2xl opacity-50 transition-opacity duration-500"
          style={{ 
            transform: "translateZ(-50px)",
            opacity: isHovering ? 0.7 : 0.3 
          }} 
        />
        
        {/* Main card */}
        <div className="relative overflow-hidden rounded-xl border border-border/50 bg-white shadow-2xl">
          <img 
            src={dashboardPreview} 
            alt="RoleColorFinder Dashboard Preview" 
            className="w-full h-auto object-contain" 
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent" />
          
          {/* Shine effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"
            initial={{ opacity: 0, x: "-100%" }}
            animate={{ 
              opacity: isHovering ? 1 : 0,
              x: isHovering ? "100%" : "-100%"
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        
        {/* Floating reflection */}
        <div 
          className="absolute -bottom-8 left-4 right-4 h-20 rounded-xl bg-gradient-to-b from-foreground/5 to-transparent blur-sm opacity-50"
          style={{ transform: "translateZ(-30px) rotateX(180deg)" }}
        />
      </motion.div>
    </motion.div>
  );
};
export default function HeroSectionWithGradient() {
  const gradientRef = useRef<HTMLDivElement>(null);
  const transitionVariants = {
    item: {
      hidden: {
        opacity: 0,
        filter: "blur(12px)",
        y: 12
      },
      visible: {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        transition: {
          type: "spring" as const,
          bounce: 0.3,
          duration: 1.5
        }
      }
    }
  };
  useEffect(() => {
    if (!gradientRef.current) return;
    gsap.fromTo(gradientRef.current, {
      opacity: 0,
      y: -30
    }, {
      opacity: 1,
      y: 0,
      duration: 1.6,
      ease: "power3.out"
    });
  }, []);
  return <section className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Floating Particle Background */}
      <ParticleBackground />

      {/* Gradient Background */}
      <div ref={gradientRef} className="absolute inset-0 z-0" style={{
      background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.3), transparent),
            radial-gradient(ellipse 60% 40% at 80% 20%, hsl(var(--secondary) / 0.2), transparent),
            radial-gradient(ellipse 50% 30% at 20% 80%, hsl(var(--primary) / 0.15), transparent)
          `
    }} />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03]">
        <div className="h-full w-full" style={{
        backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
        backgroundSize: '60px 60px'
      }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-28 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <AnimatedGroup variants={{
          container: {
            visible: {
              transition: {
                staggerChildren: 0.1
              }
            }
          },
          item: transitionVariants.item
        }} className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-muted-foreground">Now also for Teams</span>
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
                <Link to="/pricing/teams">
                  For Teams & Businesses
                </Link>
              </Button>
            </div>
          </AnimatedGroup>
        </div>

        {/* Hero Image with 3D Tilt Effect */}
        <TiltCard className="mt-16 w-full max-w-5xl px-4" />

        {/* RoleColor Badges */}
        <RoleColorBadges className="mt-16" />
      </div>
    </section>;
}
interface RoleColorData {
  name: string;
  label: string;
  description: string;
  color: string;
  textColor: string;
  borderColor: string;
  bgLight: string;
  glowColor: string;
  pulseColor: string;
  icon: React.ElementType;
  detailedDescription: string;
  strengths: string[];
  idealRoles: string[];
  teamContribution: string;
  underPressure: string;
}
const roleColors: RoleColorData[] = [{
  name: "Red",
  label: "Motivator",
  description: "Vision-driven leaders who inspire and persuade",
  color: "bg-red-500",
  textColor: "text-red-500",
  borderColor: "border-red-500/40",
  bgLight: "bg-red-500/10",
  glowColor: "shadow-red-500/40",
  pulseColor: "bg-red-400",
  icon: Heart,
  detailedDescription: "Red personalities are natural communicators and motivators. They thrive on connection, persuasion, and bringing people together around a shared vision. They excel at rallying teams during the Forming and Storming stages when energy and direction are critical.",
  strengths: ["Inspiring others", "Building relationships", "Creative direction", "Public speaking", "Brand building"],
  idealRoles: ["Team Lead", "Sales Director", "Creative Director", "Brand Manager", "Motivational Speaker"],
  teamContribution: "Reds bring enthusiasm and passion to the team. They're often the ones who can turn a discouraged group into a motivated force.",
  underPressure: "May become overly emotional or take things personally. Can struggle with detailed analysis when quick decisions are needed."
}, {
  name: "Yellow",
  label: "Executor",
  description: "Action-first builders who get things done",
  color: "bg-yellow-500",
  textColor: "text-yellow-500",
  borderColor: "border-yellow-500/40",
  bgLight: "bg-yellow-500/10",
  glowColor: "shadow-yellow-500/40",
  pulseColor: "bg-yellow-400",
  icon: Target,
  detailedDescription: "Yellow personalities are action-oriented executors who prioritize speed and results. They're the first to dive in and start building, making them invaluable during the Performing stage when execution is key.",
  strengths: ["Fast execution", "Initiative taking", "Problem solving", "Operational excellence", "Deadline management"],
  idealRoles: ["Project Manager", "Founder/CEO", "Operations Manager", "Product Manager", "Startup Builder"],
  teamContribution: "Yellows keep the team moving forward. When others are still planning, Yellows are already executing and learning from real-world feedback.",
  underPressure: "May rush decisions without enough analysis. Can become impatient with slower-moving team members."
}, {
  name: "Green",
  label: "Architect",
  description: "Logic-based thinkers with precision focus",
  color: "bg-green-500",
  textColor: "text-green-500",
  borderColor: "border-green-500/40",
  bgLight: "bg-green-500/10",
  glowColor: "shadow-green-500/40",
  pulseColor: "bg-green-400",
  icon: Brain,
  detailedDescription: "Green personalities are systematic thinkers who excel at building structured solutions. They bring order to chaos and ensure that systems are reliable and scalable. They're essential during the Norming stage when processes need to be established.",
  strengths: ["Systems thinking", "Analytical reasoning", "Process optimization", "Quality control", "Technical precision"],
  idealRoles: ["Software Engineer", "Data Analyst", "Systems Architect", "Quality Assurance", "Financial Analyst"],
  teamContribution: "Greens provide the backbone of operational excellence. They catch errors others miss and build systems that scale.",
  underPressure: "May over-analyze and delay decisions. Can struggle with ambiguity and rapidly changing requirements."
}, {
  name: "Blue",
  label: "Visionary",
  description: "Innovation-focused strategists and researchers",
  color: "bg-blue-500",
  textColor: "text-blue-500",
  borderColor: "border-blue-500/40",
  bgLight: "bg-blue-500/10",
  glowColor: "shadow-blue-500/40",
  pulseColor: "bg-blue-400",
  icon: Lightbulb,
  detailedDescription: "Blue personalities are forward-thinking innovators who see possibilities others miss. They excel at long-term strategy, research, and creative problem-solving. They're vital during strategic pivots and when the team needs fresh perspective.",
  strengths: ["Strategic thinking", "Innovation", "Research & analysis", "Long-term planning", "Creative ideation"],
  idealRoles: ["Chief Strategy Officer", "UX Designer", "Research Lead", "Innovation Director", "Futurist"],
  teamContribution: "Blues help the team see beyond immediate challenges. They identify opportunities and risks that others overlook.",
  underPressure: "May get lost in ideas without execution. Can struggle with urgent, tactical decisions that require quick action."
}];
export const RoleColorBadges = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => {
  const [selectedRole, setSelectedRole] = useState<RoleColorData | null>(null);
  return <>
      <div ref={ref} className={cn("w-full max-w-4xl px-4", className)} {...props}>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Discover which behavioral style defines you
        </p>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4" style={{ perspective: "1000px" }}>
          {roleColors.map((role, index) => (
            <motion.button
              key={role.name}
              onClick={() => setSelectedRole(role)}
              initial={{ opacity: 0, y: 30, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                delay: index * 0.1,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              whileHover={{
                scale: 1.05,
                y: -8,
                rotateX: 5,
                rotateY: index < 2 ? 3 : -3,
                z: 50
              }}
              whileTap={{ scale: 0.97 }}
              style={{ transformStyle: "preserve-3d" }}
              className={cn(
                "group relative flex flex-col items-center gap-4 rounded-2xl border-2 p-6 backdrop-blur-md transition-all duration-300 cursor-pointer",
                "bg-gradient-to-b from-background/80 to-background/40",
                "shadow-[0_10px_40px_-15px] hover:shadow-[0_20px_50px_-15px]",
                role.borderColor,
                role.glowColor
              )}
            >
              {/* 3D Glow layer behind */}
              <div 
                className={cn(
                  "absolute inset-0 rounded-2xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40 -z-10",
                  role.color
                )} 
                style={{ transform: "translateZ(-20px)" }}
              />
              
              {/* Inner highlight for 3D depth */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              
              {/* Animated orb with 3D effect */}
              <div className="relative" style={{ transform: "translateZ(20px)" }}>
                <span className={cn("absolute inline-flex h-6 w-6 animate-ping rounded-full opacity-30", role.pulseColor)} />
                <div className={cn(
                  "relative h-6 w-6 rounded-full shadow-lg",
                  "ring-2 ring-white/20 ring-offset-2 ring-offset-transparent",
                  role.color
                )} />
              </div>
              
              {/* Text with 3D pop */}
              <div className="relative text-center" style={{ transform: "translateZ(15px)" }}>
                <p className={cn("font-bold text-xl tracking-tight", role.textColor)}>{role.name}</p>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">{role.label}</p>
              </div>
              
              {/* Bottom edge shadow for depth */}
              <div className="absolute -bottom-1 left-2 right-2 h-4 rounded-2xl bg-black/5 blur-md -z-10" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* RoleColor Detail Popup Modal */}
      <AnimatePresence>
        {selectedRole && <RoleColorModal role={selectedRole} onClose={() => setSelectedRole(null)} />}
      </AnimatePresence>
    </>;
});
RoleColorBadges.displayName = "RoleColorBadges";

// Popup Modal Component with flip + zoom animation
const RoleColorModal = ({
  role,
  onClose
}: {
  role: RoleColorData;
  onClose: () => void;
}) => {
  const IconComponent = role.icon;
  const modalRef = useRef<HTMLDivElement>(null);
  const [contentScale, setContentScale] = useState(1);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const scrollY = window.scrollY;

    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalBodyOverscrollBehavior = document.body.style.overscrollBehavior;

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlOverscrollBehavior = document.documentElement.style.overscrollBehavior;

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      document.body.style.overscrollBehavior = originalBodyOverscrollBehavior;

      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.overscrollBehavior = originalHtmlOverscrollBehavior;

      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    const updateScale = () => {
      const modal = modalRef.current;
      if (!modal) return;

      const mobile = window.innerWidth < 640;
      setIsMobileViewport(mobile);

      if (mobile) {
        // Keep full-size content on mobile and let users scroll naturally.
        setContentScale(1);
        return;
      }

      const availableHeight = window.innerHeight - 160;
      const naturalHeight = modal.scrollHeight;
      const nextScale = naturalHeight > availableHeight
        ? Math.max(0.72, availableHeight / naturalHeight)
        : 1;

      setContentScale(nextScale);
    };

    const frame = window.requestAnimationFrame(() => {
      updateScale();
    });

    window.addEventListener("resize", updateScale);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScale);
    };
  }, [role]);

  return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }} transition={{
    duration: 0.2
  }} className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto overscroll-contain p-3 sm:p-4 pt-20 sm:pt-28 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{
      opacity: 0,
      scale: 0.3,
      rotateX: -90,
      y: 100
    }} animate={{
      opacity: 1,
      scale: isMobileViewport ? 1 : contentScale,
      rotateX: 0,
      y: 0
    }} exit={{
      opacity: 0,
      scale: 0.3,
      rotateX: 90,
      y: -100
    }} transition={{
      type: "spring",
      stiffness: 300,
      damping: 25,
      duration: 0.5
    }} onClick={e => e.stopPropagation()} ref={modalRef} className={cn("relative w-full max-w-2xl overflow-hidden rounded-3xl border-2 bg-background shadow-2xl", role.borderColor)} style={{
      perspective: "1000px",
      transformStyle: "preserve-3d",
      transformOrigin: "top center"
    }}>
        {/* Animated glow background */}
        <div className={cn("absolute inset-0 rounded-3xl opacity-20 blur-3xl", role.color)} />
        
        {/* Header */}
        <div className={cn("relative p-6 sm:p-8 border-b", role.borderColor, role.bgLight)}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-background/80 hover:bg-background transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div className="flex items-center gap-4">
            <motion.div initial={{
            rotate: -180,
            scale: 0
          }} animate={{
            rotate: 0,
            scale: 1
          }} transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 200
          }} className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", role.color)}>
              <IconComponent className="w-8 h-8 text-white" />
            </motion.div>
            
            <div>
              <motion.h2 initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 0.3
            }} className={cn("text-3xl sm:text-4xl font-bold", role.textColor)}>
                {role.name}
              </motion.h2>
              <motion.p initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 0.4
            }} className="text-lg text-muted-foreground font-medium">
                The {role.label}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-5 sm:p-8 space-y-6 overflow-y-auto max-h-[calc(100dvh-12.5rem)] sm:max-h-[calc(100dvh-14rem)]">
          {/* Main Description */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.4
        }}>
            <p className="text-lg text-foreground leading-relaxed">
              {role.detailedDescription}
            </p>
          </motion.div>

          {/* Strengths */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.5
        }} className={cn("rounded-2xl p-5 border", role.borderColor, role.bgLight)}>
            <h3 className={cn("font-bold text-lg mb-3 flex items-center gap-2", role.textColor)}>
              <CheckCircle className="w-5 h-5" />
              Core Strengths
            </h3>
            <div className="flex flex-wrap gap-2">
              {role.strengths.map((strength, i) => <motion.span key={strength} initial={{
              opacity: 0,
              scale: 0.8
            }} animate={{
              opacity: 1,
              scale: 1
            }} transition={{
              delay: 0.5 + i * 0.05
            }} className={cn("px-3 py-1.5 rounded-full text-sm font-medium border", role.borderColor, "bg-background")}>
                  {strength}
                </motion.span>)}
            </div>
          </motion.div>

          {/* Ideal Roles */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.6
        }}>
            <h3 className={cn("font-bold text-lg mb-3 flex items-center gap-2", role.textColor)}>
              <Target className="w-5 h-5" />
              Ideal Roles
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {role.idealRoles.map((idealRole, i) => <motion.div key={idealRole} initial={{
              opacity: 0,
              x: -10
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 0.6 + i * 0.05
            }} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className={cn("w-2 h-2 rounded-full", role.color)} />
                  {idealRole}
                </motion.div>)}
            </div>
          </motion.div>

          {/* Team Contribution */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.7
        }} className="rounded-2xl p-5 border border-border bg-muted/30">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5" />
              Team Contribution
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {role.teamContribution}
            </p>
          </motion.div>

          {/* Under Pressure */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.8
        }} className="rounded-2xl p-5 border border-border bg-muted/30">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-foreground">
              <Zap className="w-5 h-5" />
              Under Pressure
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {role.underPressure}
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.9
        }} className="pt-4">
            <Button asChild size="lg" className={cn("w-full", role.color, "hover:opacity-90")}>
              <Link to="/free-assessment" onClick={onClose}>
                Discover If You're a {role.name}
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>;
};
export { HeroSectionWithGradient };
