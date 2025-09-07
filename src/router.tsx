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
import Maintenance from "@/pages/Maintenance";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TeamProgram from "@/pages/TeamProgram";
import Sitemap from "@/pages/Sitemap";
import Schools from "@/pages/Schools";
import AudiencePage from "@/pages/AudiencePage";
import ScrollToTop from "@/components/ScrollToTop";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <ScrollToTop />
    {children}
  </>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout><Index /></Layout>,
  },
  {
    path: "/auth",
    element: <Layout><Auth /></Layout>,
  },
  {
    path: "/dashboard",
    element: <Layout><Dashboard /></Layout>,
  },
  {
    path: "/free-assessment",
    element: <Layout><FreeAssessment /></Layout>,
  },
  {
    path: "/free-results",
    element: <Layout><FreeResults /></Layout>,
  },
  {
    path: "/premium-assessment",
    element: <Layout><PremiumAssessment /></Layout>,
  },
  {
    path: "/premium-results",
    element: <Layout><PremiumResults /></Layout>,
  },
  {
    path: "/pro-assessment",
    element: <Layout><ProAssessment /></Layout>,
  },
  {
    path: "/pro-results",
    element: <Layout><ProResults /></Layout>,
  },
  {
    path: "/payment-success",
    element: <Layout><PaymentSuccess /></Layout>,
  },
  {
    path: "/pricing",
    element: <Layout><Pricing /></Layout>,
  },
  {
    path: "/quiz",
    element: <Layout><Quiz /></Layout>,
  },
  {
    path: "/results",
    element: <Layout><Results /></Layout>,
  },
  {
    path: "/reset-password",
    element: <Layout><ResetPassword /></Layout>,
  },
  {
    path: "/maintenance",
    element: <Layout><Maintenance /></Layout>,
  },
  {
    path: "/privacy-policy",
    element: <Layout><PrivacyPolicy /></Layout>,
  },
  {
    path: "/team-program",
    element: <Layout><TeamProgram /></Layout>,
  },
  {
    path: "/sitemap",
    element: <Layout><Sitemap /></Layout>,
  },
  {
    path: "/schools",
    element: <Layout><Schools /></Layout>,
  },
  {
    path: "/audience",
    element: <Layout><AudiencePage /></Layout>,
  },
  {
    path: "*",
    element: <Layout><NotFound /></Layout>,
  },
]);