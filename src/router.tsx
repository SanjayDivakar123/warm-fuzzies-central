import { createBrowserRouter, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import AnimatedAuth from "@/pages/AnimatedAuth";
import Dashboard from "@/pages/Dashboard";
import ChangePassword from "@/pages/ChangePassword";
import FreeAssessment from "@/pages/FreeAssessment";
import FreeResults from "@/pages/FreeResults";
import CelebrityAssessment from "@/pages/CelebrityAssessment";
import CelebrityResults from "@/pages/CelebrityResults";
import PremiumAssessment from "@/pages/PremiumAssessment";
import PremiumResults from "@/pages/PremiumResults";
import ProAssessment from "@/pages/ProAssessment";
import ProResults from "@/pages/ProResults";
import PaymentSuccess from "@/pages/PaymentSuccess";
import RedeemRcaiDiscount from "@/pages/RedeemRcaiDiscount";
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
import JessicahFowler from "@/pages/team/JessicahFowler";
import AaronSmart from "@/pages/team/AaronSmart";
import KodyKrueger from "@/pages/team/KodyKrueger";


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
import RCFB2BAdminDashboard from "@/pages/admin/RCFB2BAdminDashboard";
import UserManagement from "@/pages/admin/UserManagement";
import AdvisorLandingPages from "@/pages/admin/AdvisorLandingPages";
import AdvisorLandingPage from "@/pages/advisor/AdvisorLandingPage";
import AdvisorPaymentSuccess from "@/pages/advisor/AdvisorPaymentSuccess";
import AdvisorAssessment from "@/pages/advisor/AdvisorAssessment";
import AdvisorResult from "@/pages/advisor/AdvisorResult";
import AdvisorPortal from "@/pages/advisor/AdvisorPortal";
import B2BDashboard from "@/pages/b2b/B2BDashboard";
import B2BSignIn from "@/pages/b2b/B2BSignIn";
import B2BPaymentSuccess from "@/pages/b2b/B2BPaymentSuccess";
import ConfirmDeleteCompany from "@/pages/b2b/ConfirmDeleteCompany";
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
import CompanyReuseResult from "@/pages/company/CompanyReuseResult";

// Candidate portal pages
import CandidatePortalLayout from "@/pages/candidate/CandidatePortalLayout";
import CandidateLanding from "@/pages/candidate/CandidateLanding";
import CandidateLogin from "@/pages/candidate/CandidateLogin";
import CandidateAssessment from "@/pages/candidate/CandidateAssessment";
import CandidateResults from "@/pages/candidate/CandidateResults";

// Public careers pages
import PublicCareersPage from "@/pages/careers/PublicCareersPage";
import PublicJobDetailPage from "@/pages/careers/PublicJobDetailPage";
import PublicRoleColorProfile from "@/pages/PublicRoleColorProfile";

// Career Finder pages
import TeamsLearnMore from "@/pages/TeamsLearnMore";
import CareerFinder from "@/pages/CareerFinder";
import CareerFinderResults from "@/pages/CareerFinderResults";
import CareerResumeResults from "@/pages/CareerResumeResults";
import CareerPaymentSuccess from "@/pages/CareerPaymentSuccess";
import ClientProposal from "@/pages/client/ClientProposal";
import ProposalAgreement from "@/pages/client/ProposalAgreement";
import ProposalLOI from "@/pages/client/ProposalLOI";
import ProposalLOE from "@/pages/client/ProposalLOE";
import ProposalPayment from "@/pages/client/ProposalPayment";
import ProposalSuccess from "@/pages/client/ProposalSuccess";
import ProposalManager from "@/pages/admin/ProposalManager";
import TwoFactorEnrollment from "@/pages/TwoFactorEnrollment";
import SlackLinkPage from "@/pages/SlackLinkPage";
import PersonalIntegrationsPage from "@/pages/PersonalIntegrationsPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <ScrollToTop />
    {children}
    <HoverFooter />
    <BackToTop />
  </>
);

const WorkspaceLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <ScrollToTop />
    {children}
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
    element: <Layout><AnimatedAuth /></Layout>,
  },
  {
    path: "/dashboard",
    element: <Layout><Dashboard /></Layout>,
  },
  {
    path: "/settings/integrations",
    element: (
      <Layout>
        <ProtectedRoute>
          <PersonalIntegrationsPage />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: "/change-password",
    element: <Layout><ChangePassword /></Layout>,
  },
  {
    path: "/two-factor-enrollment",
    element: <Layout><TwoFactorEnrollment /></Layout>,
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
    path: "/celebrity-assessment",
    element: <Layout><CelebrityAssessment /></Layout>,
  },
  {
    path: "/celebrity-results",
    element: <Layout><CelebrityResults /></Layout>,
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
    path: "/career-finder",
    element: <Layout><CareerFinder /></Layout>,
  },
  {
    path: "/career-finder/results",
    element: <Layout><CareerFinderResults /></Layout>,
  },
  {
    path: "/career-finder/resume-results",
    element: <Layout><CareerResumeResults /></Layout>,
  },
  {
    path: "/career-payment-success",
    element: <Layout><CareerPaymentSuccess /></Layout>,
  },
  {
    path: "/payment-success",
    element: <Layout><PaymentSuccess /></Layout>,
  },
  {
    path: "/redeem",
    element: <Layout><RedeemRcaiDiscount /></Layout>,
  },
  {
    path: "/advisor/:slug",
    element: <Layout><AdvisorLandingPage /></Layout>,
  },
  {
    path: "/advisor-payment-success",
    element: <Layout><AdvisorPaymentSuccess /></Layout>,
  },
  {
    path: "/advisor/assessment/:token",
    element: <AdvisorAssessment />,
  },
  {
    path: "/advisor/results/:token",
    element: <Layout><AdvisorResult /></Layout>,
  },
  {
    path: "/advisor-portal",
    element: <AdvisorPortal />,
  },
  {
    path: "/pricing",
    element: <Layout><Pricing /></Layout>,
  },
  {
    path: "/pricing/teams",
    element: <Layout><TeamsLearnMore /></Layout>,
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
    path: "/team/jessicah-fowler",
    element: <Layout><JessicahFowler /></Layout>,
  },
  {
    path: "/team/aaron-smart",
    element: <Layout><AaronSmart /></Layout>,
  },
  {
    path: "/team/kody-krueger",
    element: <Layout><KodyKrueger /></Layout>,
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
    path: "/admin/rcf-b2b",
    element: <WorkspaceLayout><RCFB2BAdminDashboard /></WorkspaceLayout>,
  },
  {
    path: "/admin/advisor-landing-pages",
    element: <WorkspaceLayout><AdvisorLandingPages /></WorkspaceLayout>,
  },
  {
    path: "/admin/users",
    element: <Layout><UserManagement /></Layout>,
  },
  {
    path: "/admin/proposals",
    element: <Layout><ProposalManager /></Layout>,
  },
  {
    path: "/b2b",
    element: <Navigate to="/pricing/teams" replace />,
  },
  {
    path: "/company",
    element: <Navigate to="/" replace />,
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
    path: "/settings/integrations/slack/link",
    element: <WorkspaceLayout><SlackLinkPage /></WorkspaceLayout>,
  },
  {
    path: "/b2b/confirm-delete-company",
    element: <ConfirmDeleteCompany />,
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
      { path: "reuse-result", element: <CompanyReuseResult /> },
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
  // Public Careers Pages
  {
    path: "/careers/:companySlug",
    element: <PublicCareersPage />,
  },
  {
    path: "/careers/:companySlug/jobs/:jobId",
    element: <PublicJobDetailPage />,
  },
  {
    path: "/client/:slug",
    element: <ClientProposal />,
  },
  {
    path: "/client/:slug/agreement",
    element: <ProposalAgreement />,
  },
  {
    path: "/client/:slug/loi",
    element: <ProposalLOI />,
  },
  {
    path: "/client/:slug/loe",
    element: <ProposalLOE />,
  },
  {
    path: "/client/:slug/payment",
    element: <ProposalPayment />,
  },
  {
    path: "/client/:slug/success",
    element: <ProposalSuccess />,
  },
  {
    path: "/:username",
    element: <Layout><PublicRoleColorProfile /></Layout>,
  },
  {
    path: "*",
    element: <Layout><NotFound /></Layout>,
  },
];
