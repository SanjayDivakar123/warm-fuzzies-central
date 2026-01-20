import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "./contexts/AuthContext";
import { CompanyProvider } from "./contexts/CompanyContext";
import { ThemeProvider } from "next-themes";
import { HelpTourProvider } from "./contexts/HelpTourContext";
import { TourTooltip } from "./components/help";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" storageKey="rcf-theme">
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

export default App;
