"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export const TextHoverEffect = ({
  text,
  duration,
  className,
}: {
  text: string;
  duration?: number;
  automatic?: boolean;
  className?: string;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });
  
  // Only trigger animation when element is in view
  const isInView = useInView(svgRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (svgRef.current && cursor.x !== null && cursor.y !== null) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
      setMaskPosition({
        cx: `${cxPercentage}%`,
        cy: `${cyPercentage}%`,
      });
    }
  }, [cursor]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 500 70"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className={cn("select-none cursor-pointer", className)}
    >
      <defs>
        <linearGradient
          id="textGradient"
          gradientUnits="userSpaceOnUse"
          x1="0%"
          y1="50%"
          x2="100%"
          y2="50%"
        >
          {hovered && (
            <>
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="33%" stopColor="#eab308" />
              <stop offset="66%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#3b82f6" />
            </>
          )}
        </linearGradient>

        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="20%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration: duration ?? 0, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="textMask">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#revealMask)"
          />
        </mask>
      </defs>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.6"
        className="fill-transparent stroke-neutral-600 dark:stroke-neutral-700"
        style={{ opacity: hovered ? 0.7 : 0, fontSize: '65px', fontWeight: 'bold', fontFamily: 'system-ui, sans-serif' }}
      >
        {text}
      </text>
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.6"
        className="fill-transparent stroke-[#3ca2fa] dark:stroke-[#3ca2fa99]"
        style={{ fontSize: '65px', fontWeight: 'bold', fontFamily: 'system-ui, sans-serif' }}
        initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
        animate={isInView ? {
          strokeDashoffset: 0,
          strokeDasharray: 1000,
        } : { strokeDashoffset: 1000, strokeDasharray: 1000 }}
        transition={{
          duration: 4,
          ease: "easeInOut",
        }}
      >
        {text}
      </motion.text>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        stroke="url(#textGradient)"
        strokeWidth="0.6"
        mask="url(#textMask)"
        className="fill-transparent"
        style={{ fontSize: '65px', fontWeight: 'bold', fontFamily: 'system-ui, sans-serif' }}
      >
        {text}
      </text>
    </svg>
  );
};

export const FooterBackgroundGradient = () => {
  return (
    <div
      className="absolute inset-0 z-0"
      style={{
        background:
          "radial-gradient(125% 125% at 50% 10%, #0F0F1166 50%, #3ca2fa33 100%)",
      }}
    />
  );
};

// Footer link data - matching your original footer structure
const footerLinks = [
  {
    title: "Main Pages",
    links: [
      { label: "Home", href: "/" },
      { label: "Pricing", href: "/pricing" },
      { label: "Sitemap", href: "/sitemap" },
    ],
  },
  {
    title: "Assessments",
    links: [
      { label: "Free Assessment", href: "/free-assessment" },
      { label: "Premium Assessment", href: "/premium-assessment" },
      { label: "Pro Assessment", href: "/pro-assessment" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Account & Legal",
    links: [
      { label: "Sign In / Sign Up", href: "/auth" },
      { label: "Reset Password", href: "/reset-password" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
    ],
  },
];

export function HoverFooter() {
  return (
    <footer className="bg-[#0F0F11] relative h-fit rounded-3xl overflow-hidden m-8">
      <div className="max-w-7xl mx-auto p-14 z-40 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 lg:gap-16 pb-12">
          {/* Brand section */}
          <div className="flex flex-col space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/uploads/215460ce-2150-4569-b60c-3a223ce10adf.png" 
                alt="RoleColor™ Finder" 
                className="h-10 w-auto" 
              />
            </Link>
            <p className="text-sm leading-relaxed text-white/80">
              Discover your unique leadership color profile with our science-backed assessment system.
            </p>
          </div>

          {/* Footer link sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-lg font-bold mb-6 gradient-text">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label} className="relative">
                    <Link
                      to={link.href}
                      className="text-white/80 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-8 relative z-20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <span>&copy; {new Date().getFullYear()}</span>
              <img src="/uploads/2842bc15-73da-4523-b9c9-228cb076346e.png" alt="RoleColor™ Finder" className="h-4 w-auto" />
              <span>All rights reserved.</span>
            </div>
            <div className="flex gap-6">
              <Link to="/about" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                About
              </Link>
              <Link to="/contact" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                Contact
              </Link>
              <Link to="/privacy-policy" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                Privacy
              </Link>
              <Link to="/terms-of-service" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Text hover effect - OUTSIDE container for full footer width */}
      <div className="lg:flex hidden h-[12rem] w-full items-center justify-center relative z-10">
        <TextHoverEffect text="RoleColor" className="w-full h-full" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}

export default HoverFooter;
