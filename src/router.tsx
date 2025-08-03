import { createBrowserRouter } from "react-router-dom";
import Index from "@/pages/Index";
import { Auth } from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import FreeAssessment from "@/pages/FreeAssessment";
import FreeResults from "@/pages/FreeResults";
import PremiumAssessment from "@/pages/PremiumAssessment";
import PremiumResults from "@/pages/PremiumResults";
import ProAssessment from "@/pages/ProAssessment";
import ProResults from "@/pages/ProResults";
import PaymentSuccess from "@/pages/PaymentSuccess";
import Pricing from "@/pages/Pricing";
import Quiz from "@/pages/Quiz";
import Results from "@/pages/Results";
import { ResetPassword } from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/free-assessment",
    element: <FreeAssessment />,
  },
  {
    path: "/free-results",
    element: <FreeResults />,
  },
  {
    path: "/premium-assessment",
    element: <PremiumAssessment />,
  },
  {
    path: "/premium-results",
    element: <PremiumResults />,
  },
  {
    path: "/pro-assessment",
    element: <ProAssessment />,
  },
  {
    path: "/pro-results",
    element: <ProResults />,
  },
  {
    path: "/payment-success",
    element: <PaymentSuccess />,
  },
  {
    path: "/pricing",
    element: <Pricing />,
  },
  {
    path: "/quiz",
    element: <Quiz />,
  },
  {
    path: "/results",
    element: <Results />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);