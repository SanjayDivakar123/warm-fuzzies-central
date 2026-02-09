import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";
import { routeConfig } from "./router";

import { AuthProvider } from "./contexts/AuthContext";
import { CompanyProvider } from "./contexts/CompanyContext";
import { ThemeProvider } from "next-themes";
import { HelpTourProvider } from "./contexts/HelpTourContext";
import { TourTooltip } from "./components/help";
import * as Sentry from "@sentry/react";

/* -------------------------------------------------------------------------- */
/*                                   Setup                                    */
/* -------------------------------------------------------------------------- */

const queryClient = new QueryClient();

/* -------------------------------------------------------------------------- */
/*                              Root Component                                 */
/* -------------------------------------------------------------------------- */

function RootLayout() {
  return <Outlet />;
}

/* -------------------------------------------------------------------------- */
/*                                   Router                                   */
/* -------------------------------------------------------------------------- */

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
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
