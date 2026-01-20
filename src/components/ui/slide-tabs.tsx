import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

interface TabItem {
  label: string;
  href: string;
}

interface SlideTabsProps {
  tabs: TabItem[];
}

export const SlideTabs = ({ tabs }: SlideTabsProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  
  // Track which tab is currently highlighted (hovered or selected)
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  
  // Find active tab index based on current route
  const activeIndex = tabs.findIndex(tab => tab.href === location.pathname);
  const [selected, setSelected] = useState(activeIndex >= 0 ? activeIndex : 0);
  
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Update selected when route changes
  useEffect(() => {
    const newIndex = tabs.findIndex(tab => tab.href === location.pathname);
    if (newIndex >= 0) {
      setSelected(newIndex);
      setHighlightedIndex(newIndex);
    }
  }, [location.pathname, tabs]);

  // Position the cursor on the selected tab
  useEffect(() => {
    const selectedTab = tabsRef.current[selected];
    if (selectedTab) {
      const { width } = selectedTab.getBoundingClientRect();
      setPosition({
        left: selectedTab.offsetLeft,
        width,
        opacity: 1,
      });
    }
  }, [selected]);

  const handleTabClick = (index: number, href: string) => {
    setSelected(index);
    setHighlightedIndex(index);
    navigate(href);
  };

  const handleTabHover = (index: number) => {
    setHighlightedIndex(index);
    const tab = tabsRef.current[index];
    if (tab) {
      const { width } = tab.getBoundingClientRect();
      setPosition({
        left: tab.offsetLeft,
        width,
        opacity: 1,
      });
    }
  };

  return (
    <div
      onMouseLeave={() => {
        setHighlightedIndex(selected);
        const selectedTab = tabsRef.current[selected];
        if (selectedTab) {
          const { width } = selectedTab.getBoundingClientRect();
          setPosition({
            left: selectedTab.offsetLeft,
            width,
            opacity: 1,
          });
        }
      }}
      className="relative mx-auto flex w-fit rounded-full border border-border bg-background/50 p-1"
    >
      {tabs.map((tab, i) => (
        <button
          key={tab.href}
          ref={(el) => (tabsRef.current[i] = el)}
          onClick={() => handleTabClick(i, tab.href)}
          onMouseEnter={() => handleTabHover(i)}
          className={`relative z-10 block cursor-pointer px-4 py-2 text-sm font-medium transition-colors duration-150 ${
            highlightedIndex === i ? 'text-primary-foreground' : 'text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
      <Cursor position={position} />
    </div>
  );
};

interface CursorProps {
  position: { left: number; width: number; opacity: number };
}

const Cursor = ({ position }: CursorProps) => {
  return (
    <motion.div
      animate={{
        left: position.left,
        width: position.width,
        opacity: position.opacity,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="absolute inset-y-1 z-0 rounded-full bg-primary"
    />
  );
};
