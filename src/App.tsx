import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { Auth } from "./pages/Auth";
import PaymentSuccess from "./pages/PaymentSuccess";
import Pricing from "./pages/Pricing";
import Quiz from "./pages/Quiz";
import Results from "./pages/Results";
import FreeAssessment from "./pages/FreeAssessment";
import FreeResults from "./pages/FreeResults";
import PremiumAssessment from "./pages/PremiumAssessment";
import PremiumResults from "./pages/PremiumResults";
import ProAssessment from "./pages/ProAssessment";
import ProResults from "./pages/ProResults";
import Dashboard from "./pages/Dashboard";
import { ResetPassword } from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/results" element={<Results />} />
            <Route path="/free-assessment" element={<FreeAssessment />} />
            <Route path="/free-results" element={<FreeResults />} />
            <Route path="/premium-assessment" element={<PremiumAssessment />} />
            <Route path="/premium-results" element={<PremiumResults />} />
            <Route path="/pro-assessment" element={<ProAssessment />} />
            <Route path="/pro-results" element={<ProResults />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
