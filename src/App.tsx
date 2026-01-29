import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { routeConfig } from "./router";

import { AuthProvider } from "./contexts/AuthContext";
import { CompanyProvider } from "./contexts/CompanyContext";
import { ThemeProvider } from "next-themes";
import { HelpTourProvider } from "./contexts/HelpTourContext";
import { TourTooltip } from "./components/help";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import * as Sentry from "@sentry/react";

/* -------------------------------------------------------------------------- */
/*                                   Setup                                    */
/* -------------------------------------------------------------------------- */

const queryClient = new QueryClient();

// Main production domain
const MAIN_DOMAIN = "rolecolorfinder.com";

// Domains that should not be treated as subdomains
const IGNORED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "lovable.app",
  "lovable.dev",
];

function extractSubdomain(hostname: string): string | null {
  if (IGNORED_HOSTS.some((ignored) => hostname.includes(ignored))) {
    return null;
  }

  if (hostname.endsWith(`.${MAIN_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${MAIN_DOMAIN}`, "");
    if (subdomain && subdomain !== "www") {
      return subdomain.toLowerCase();
    }
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*                        Subdomain Detection Wrapper                          */
/* -------------------------------------------------------------------------- */

function RootWithSubdomainDetection() {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSubdomain = async () => {
      const hostname = window.location.hostname;
      const subdomain = extractSubdomain(hostname);

      if (!subdomain) {
        setChecking(false);
        return;
      }

      // Already on a company route
      if (location.pathname.startsWith("/company/")) {
        setChecking(false);
        return;
      }

      // B2B routes should never redirect
      if (
        location.pathname.startsWith("/b2b/") ||
        location.pathname === "/b2b"
      ) {
        setChecking(false);
        return;
      }

      try {
        const { data: company, error } = await supabase
          .from("companies")
          .select("id, subdomain, subdomain_enabled")
          .eq("subdomain", subdomain)
          .eq("subdomain_enabled", true)
          .maybeSingle();

        if (error || !company) {
          setChecking(false);
          return;
        }

        const currentPath = location.pathname;
        let targetPath = `/company/${subdomain}`;

        if (currentPath === "/login") {
          targetPath = `/company/${subdomain}/login`;
        } else if (currentPath === "/admin") {
          targetPath = `/company/${subdomain}/admin`;
        } else if (currentPath === "/home") {
          targetPath = `/company/${subdomain}/home`;
        } else if (currentPath === "/assessment") {
          targetPath = `/company/${subdomain}/assessment`;
        } else if (currentPath === "/results") {
          targetPath = `/company/${subdomain}/results`;
        }

        navigate(targetPath + location.search, { replace: true });
      } catch {
        setChecking(false);
      }
    };

    checkSubdomain();
  }, [location.pathname, location.search, navigate]);

  if (checking) {
    const subdomain = extractSubdomain(window.location.hostname);
    if (subdomain) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">
              Loading company portal...
            </p>
          </div>
        </div>
      );
    }
  }

  return <Outlet />;
}

/* -------------------------------------------------------------------------- */
/*                                   Router                                   */
/* -------------------------------------------------------------------------- */

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootWithSubdomainDetection />,
    children: routeConfig,
  },
]);

/* -------------------------------------------------------------------------- */
/*                                    App                                     */
/* -------------------------------------------------------------------------- */

const App = () => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      storageKey="rcf-theme"
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CompanyProvider>
            <TooltipProvider>
              <HelpTourProvider>
                <Toaster />
                <Sonner />
                <TourTooltip />
                <RouterProvider router={router} />
              </HelpTourProvider>
            </TooltipProvider>
          </CompanyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

/* -------------------------------------------------------------------------- */
/*                           Sentry-wrapped Export                             */
/* -------------------------------------------------------------------------- */

const AppWithSentry = Sentry.withErrorBoundary(App, {
  fallback: <p>Something went wrong.</p>,
});

export default AppWithSentry;
