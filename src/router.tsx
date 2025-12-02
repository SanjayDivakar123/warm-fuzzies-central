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
import TermsOfService from "@/pages/TermsOfService";
import About from "@/pages/About";
import Contact from "@/pages/Contact";

import Team from "@/pages/Team";
import SanjayDivakar from "@/pages/team/SanjayDivakar";
import JenniferKlein from "@/pages/team/JenniferKlein";
import KaponoCiotti from "@/pages/team/KaponoCiotti";
import Sitemap from "@/components/Sitemap";
import ScrollToTop from "@/components/ScrollToTop";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { VoiceAssessment } from "@/pages/VoiceAssessment";
import { VoiceResults } from "@/pages/VoiceResults";
import SharedResult from "@/pages/SharedResult";
import LeadershipAssessment from "@/pages/LeadershipAssessment";
import LeadershipResults from "@/pages/LeadershipResults";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import UserManagement from "@/pages/admin/UserManagement";
import BlogManagement from "@/pages/admin/BlogManagement";
import BlogEditor from "@/pages/admin/BlogEditor";
import B2B from "@/pages/B2B";
import B2BDashboard from "@/pages/b2b/B2BDashboard";
import ProfessionalAssessment25Q from "@/pages/b2b/ProfessionalAssessment25Q";
import ProfessionalAssessment50Q from "@/pages/b2b/ProfessionalAssessment50Q";
import ProfessionalResults from "@/pages/b2b/ProfessionalResults";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <ScrollToTop />
    {children}
    <Footer />
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
    path: "/terms-of-service",
    element: <Layout><TermsOfService /></Layout>,
  },
  {
    path: "/about",
    element: <Layout><About /></Layout>,
  },
  {
    path: "/contact",
    element: <Layout><Contact /></Layout>,
  },
  {
    path: "/team",
    element: <Layout><Team /></Layout>,
  },
  {
    path: "/team/sanjay-divakar",
    element: <Layout><SanjayDivakar /></Layout>,
  },
  {
    path: "/team/jennifer-klein",
    element: <Layout><JenniferKlein /></Layout>,
  },
  {
    path: "/team/kapono-ciotti",
    element: <Layout><KaponoCiotti /></Layout>,
  },
  {
    path: "/sitemap",
    element: <Layout><Sitemap /></Layout>,
  },
  {
    path: "/voice-assessment",
    element: <Layout><VoiceAssessment /></Layout>,
  },
  {
    path: "/voice-results",
    element: <Layout><VoiceResults /></Layout>,
  },
  {
    path: "/result/:code",
    element: <Layout><SharedResult /></Layout>,
  },
  {
    path: "/leadership-assessment-privatedemo",
    element: <Layout><LeadershipAssessment /></Layout>,
  },
  {
    path: "/leadership-results/:type",
    element: <Layout><LeadershipResults /></Layout>,
  },
  {
    path: "/blog",
    element: <Layout><Blog /></Layout>,
  },
  {
    path: "/blog/:slug",
    element: <Layout><BlogPost /></Layout>,
  },
  {
    path: "/admin",
    element: <Layout><AdminDashboard /></Layout>,
  },
  {
    path: "/admin/users",
    element: <Layout><UserManagement /></Layout>,
  },
  {
    path: "/admin/blogs",
    element: <Layout><BlogManagement /></Layout>,
  },
  {
    path: "/admin/blog/new",
    element: <Layout><BlogEditor /></Layout>,
  },
  {
    path: "/b2b",
    element: <Layout><B2B /></Layout>,
  },
  {
    path: "/b2b/company-portal",
    element: <Layout><B2BDashboard /></Layout>,
  },
  {
    path: "/b2b/assessment-25q",
    element: <Layout><ProfessionalAssessment25Q /></Layout>,
  },
  {
    path: "/b2b/assessment-50q",
    element: <Layout><ProfessionalAssessment50Q /></Layout>,
  },
  {
    path: "/b2b/results",
    element: <Layout><ProfessionalResults /></Layout>,
  },
  {
    path: "*",
    element: <Layout><NotFound /></Layout>,
  },
]);