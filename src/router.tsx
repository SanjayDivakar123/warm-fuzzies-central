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
import TristanBeley from "@/pages/team/TristanBeley";
import TanishaSikder from "@/pages/team/TanishaSikder";
import AmitSuthar from "@/pages/team/AmitSuthar";


import Sitemap from "@/components/Sitemap";
import ScrollToTop from "@/components/ScrollToTop";
import BackToTop from "@/components/BackToTop";
import { HoverFooter } from "@/components/ui/hover-footer";
import { Navbar } from "@/components/navigation/Navbar";
import { VoiceAssessment } from "@/pages/VoiceAssessment";
import { VoiceResults } from "@/pages/VoiceResults";
import SharedResult from "@/pages/SharedResult";
import LeadershipAssessment from "@/pages/LeadershipAssessment";
import LeadershipResults from "@/pages/LeadershipResults";
import LeadershipGame from "@/pages/LeadershipGame";
import LeadershipGame3D from "@/pages/LeadershipGame3D";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import UserManagement from "@/pages/admin/UserManagement";
import B2B from "@/pages/B2B";
import B2BDashboard from "@/pages/b2b/B2BDashboard";
import B2BSignIn from "@/pages/b2b/B2BSignIn";
import B2BPaymentSuccess from "@/pages/b2b/B2BPaymentSuccess";
import ProfessionalAssessment25Q from "@/pages/b2b/ProfessionalAssessment25Q";
import ProfessionalAssessment50Q from "@/pages/b2b/ProfessionalAssessment50Q";
import ProfessionalResults from "@/pages/b2b/ProfessionalResults";
import TeacherCustomAssessment from "@/pages/school/TeacherCustomAssessment";
import StudentCustomAssessment from "@/pages/school/StudentCustomAssessment";
import AdminResults from "@/pages/school/AdminResults";

// Company portal pages
import CompanyPortalLayout from "@/pages/company/CompanyPortalLayout";
import CompanyLanding from "@/pages/company/CompanyLanding";
import CompanyLogin from "@/pages/company/CompanyLogin";
import CompanyAdminLogin from "@/pages/company/CompanyAdminLogin";
import CompanyAssessment from "@/pages/company/CompanyAssessment";
import CompanyResults from "@/pages/company/CompanyResults";
import CompanyHome from "@/pages/company/CompanyHome";

// Candidate portal pages
import CandidatePortalLayout from "@/pages/candidate/CandidatePortalLayout";
import CandidateLanding from "@/pages/candidate/CandidateLanding";
import CandidateLogin from "@/pages/candidate/CandidateLogin";
import CandidateAssessment from "@/pages/candidate/CandidateAssessment";
import CandidateResults from "@/pages/candidate/CandidateResults";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <ScrollToTop />
    {children}
    <HoverFooter />
    <BackToTop />
  </>
);

// Export route configuration array for use in App.tsx
export const routeConfig = [
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
    path: "/team/tristan-beley",
    element: <Layout><TristanBeley /></Layout>,
  },
  {
    path: "/team/tanisha-sikder",
    element: <Layout><TanishaSikder /></Layout>,
  },
  {
    path: "/team/amit-suthar",
    element: <Layout><AmitSuthar /></Layout>,
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
    path: "/leadership-results",
    element: <Layout><LeadershipResults /></Layout>,
  },
  {
    path: "/leadership-game",
    element: <Layout><LeadershipGame /></Layout>,
  },
  {
    path: "/leadership-game-3d",
    element: <LeadershipGame3D />,
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
    path: "/b2b",
    element: <Layout><B2B /></Layout>,
  },
  {
    path: "/b2b/signin",
    element: <Layout><B2BSignIn /></Layout>,
  },
  {
    path: "/b2b/payment-success",
    element: <Layout><B2BPaymentSuccess /></Layout>,
  },
  {
    path: "/b2b/company-portal",
    element: <B2BDashboard />,
  },
  {
    path: "/b2b/assessment-25q",
    element: <ProfessionalAssessment25Q />,
  },
  {
    path: "/b2b/assessment-50q",
    element: <ProfessionalAssessment50Q />,
  },
  {
    path: "/b2b/results",
    element: <ProfessionalResults />,
  },
  {
    path: "/school/teachercustom",
    element: <TeacherCustomAssessment />,
  },
  {
    path: "/school/studentcustom",
    element: <StudentCustomAssessment />,
  },
  {
    path: "/school/adminresults",
    element: <AdminResults />,
  },
  // Company Portal Routes (path-based subdomain alternative)
  {
    path: "/company/:subdomain",
    element: <CompanyPortalLayout />,
    children: [
      { index: true, element: <CompanyLanding /> },
      { path: "login", element: <CompanyLogin /> },
      { path: "admin", element: <CompanyAdminLogin /> },
      { path: "home", element: <CompanyHome /> },
      { path: "assessment", element: <CompanyAssessment /> },
      { path: "results", element: <CompanyResults /> },
      // Candidate routes nested under company
      { 
        path: "candidate/:code", 
        element: <CandidatePortalLayout />,
        children: [
          { index: true, element: <CandidateLanding /> },
          { path: "login", element: <CandidateLogin /> },
          { path: "assessment", element: <CandidateAssessment /> },
          { path: "results", element: <CandidateResults /> },
        ]
      },
    ],
  },
  {
    path: "*",
    element: <Layout><NotFound /></Layout>,
  },
];