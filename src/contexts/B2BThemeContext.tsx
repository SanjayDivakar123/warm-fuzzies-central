import React, { createContext, useContext, useState, useEffect } from 'react';

// Import the context directly to avoid the throwing hook during HMR/error scenarios
import { CompanyContext } from './CompanyContext';

type Theme = 'light' | 'dark' | 'system';

interface B2BThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

const B2BThemeContext = createContext<B2BThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'rcf-b2b-theme';

// Convert hex to HSL string for CSS custom properties
function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function B2BThemeProvider({ children }: { children: React.ReactNode }) {
  // Use context directly to avoid throwing during HMR or when provider isn't ready
  const companyContext = useContext(CompanyContext);
  const company = companyContext?.company ?? null;
  
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(STORAGE_KEY) as Theme) || 'light';
    }
    return 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  
  // Get company colors with defaults
  const primaryColor = company?.primary_color || '#22c55e';
  const secondaryColor = company?.secondary_color || '#16a34a';

  // Resolve the actual theme (handle 'system')
  useEffect(() => {
    const resolveTheme = () => {
      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(isDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    resolveTheme();

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        resolveTheme();
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // Sync the dark class to the document root so Tailwind dark mode works
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    return () => {
      root.classList.remove('dark');
    };
  }, [resolvedTheme]);

  // Inject company colors as CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    
    // Set CSS custom properties for company branding
    root.style.setProperty('--b2b-primary', primaryColor);
    root.style.setProperty('--b2b-secondary', secondaryColor);
    root.style.setProperty('--b2b-primary-hsl', hexToHsl(primaryColor));
    root.style.setProperty('--b2b-secondary-hsl', hexToHsl(secondaryColor));
    
    return () => {
      root.style.removeProperty('--b2b-primary');
      root.style.removeProperty('--b2b-secondary');
      root.style.removeProperty('--b2b-primary-hsl');
      root.style.removeProperty('--b2b-secondary-hsl');
    };
  }, [primaryColor, secondaryColor]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  };

  return (
    <B2BThemeContext.Provider value={{ theme, setTheme, resolvedTheme, primaryColor, secondaryColor }}>
      {children}
    </B2BThemeContext.Provider>
  );
}

export function useB2BTheme() {
  const context = useContext(B2BThemeContext);
  if (!context) {
    throw new Error('useB2BTheme must be used within a B2BThemeProvider');
  }
  return context;
}
