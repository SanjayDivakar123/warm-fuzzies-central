"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

type MenuItem = {
  label: string;
  href: string;
};

interface MenuVerticalProps {
  menuItems: MenuItem[];
  color?: string;
  skew?: number;
  onItemClick?: () => void;
}

const MotionLink = motion.create(Link);

export const MenuVertical = ({
  menuItems = [],
  color = "hsl(var(--primary))",
  skew = 0,
  onItemClick,
}: MenuVerticalProps) => {
  return (
    <nav className="flex w-full flex-col">
      {menuItems.map((item, index) => (
        <MotionLink
          key={index}
          to={item.href}
          onClick={onItemClick}
          initial="initial"
          whileHover="hovered"
          className="group relative flex items-center justify-between overflow-hidden border-b border-border py-4 text-lg font-medium text-foreground transition-colors"
        >
          <motion.div
            variants={{
              initial: { x: "-100%" },
              hovered: { x: 0 },
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ 
              backgroundColor: color,
              transform: `skewX(${skew}deg)`,
            }}
            className="absolute inset-0 z-0"
          />

          <motion.span
            variants={{
              initial: { color: "hsl(var(--foreground))" },
              hovered: { color: "hsl(var(--primary-foreground))" },
            }}
            transition={{ duration: 0.3 }}
            className="relative z-10 pl-2"
          >
            {item.label}
          </motion.span>

          <motion.div
            variants={{
              initial: { x: 0, opacity: 0.5 },
              hovered: { x: 4, opacity: 1 },
            }}
            transition={{ duration: 0.3 }}
            className="relative z-10 pr-2"
          >
            <ArrowRight className="h-5 w-5 transition-colors group-hover:text-primary-foreground" />
          </motion.div>
        </MotionLink>
      ))}
    </nav>
  );
};
