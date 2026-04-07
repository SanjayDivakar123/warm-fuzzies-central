# RCF Codebase Reference

Generated on 2026-04-07 from the checked-out repository and live linked Supabase metadata for `qbuxoetprodjxpagfkoi`. This document is intentionally exhaustive and calls out places where the live database has drifted beyond generated local types.

Important translation note: several newer integration tables use `org_id`, but in this repo the actual org model is `companies`, and org-scoped users are stored in `company_users` rather than a top-level `users` table.

## 1. Project Overview
RoleColorFinder (RCF) is a behavioral assessment and people-operations platform that measures four work-style colors (Red, Yellow, Green, Blue) and turns those results into personal reports, company insights, hiring decisions, career recommendations, collaboration guidance, and team-management workflows. The codebase combines a public marketing/product site, a personal user dashboard, a B2B company portal, company-branded employee/candidate portals, and a Supabase backend with a large edge-function surface.


### Two portals

- **Business Portal**: used by company admins, HR, partners, and in limited form employees. It manages company users, assessments, reminders, work assignment, hiring/ATS/HRIS integrations, API keys, reporting, and company settings. The root screen is `/b2b/company-portal`.

- **Personal Portal**: used by individual end users to view their own assessments, business invitations, career finder, account settings, and public RoleColor profile settings. The main authenticated screen is `/dashboard`.


### Tech stack

| Dependency | Version / status |
| --- | --- |
| React | ^18.3.1 |
| React DOM | ^18.3.1 |
| React Router DOM | ^7.7.1 |
| TypeScript | ^5.5.3 |
| Vite | ^5.4.1 |
| @vitejs/plugin-react-swc | ^3.5.0 |
| @supabase/supabase-js | ^2.53.0 |
| @tanstack/react-query | ^5.56.2 |
| Tailwind CSS | ^3.4.11 |
| shadcn-ui config | components.json present |
| next-themes | ^0.3.0 |
| Framer Motion | ^12.37.0 |
| Recharts | ^2.12.7 |
| Three | ^0.160.1 |
| Sentry | ^8.0.0 |
| Merge React Link | ^2.2.4 |
| Zod | ^3.23.8 |


### Repository model

Single-repo Vite application. There is no monorepo workspace split. Frontend, Supabase migrations, edge functions, and OpenAI app metadata live in the same repository.
## 2. Folder Structure
### Root tree



```
.
./.claude
./.claude/settings.local.json
./.env
./.gitignore
./.vercel
./.vercel/README.txt
./.vercel/project.json
./PDF_CONTENT_FOR_DESIGNER.md
./README.md
./bun.lockb
./components.json
./dev.log
./eslint.config.js
./index.html
./openai
./openai/rolecolorfinder-app-metadata.json
./package-lock.json
./package.json
./postcss.config.js
./public
./public/.well-known
./public/.well-known/security.txt
./public/DarkThemeTEDx.png
./public/TedxThirdWardLogo-R2ggq6GL.avif
./public/Used By Logos
./public/Used By Logos/houj-logo.webp
./public/Used By Logos/paf-logo.png
./public/Used By Logos/sg-logo.svg
./public/Used By Logos/tedx3w-logo.avif
./public/favicon.ico
./public/favicon.png
./public/favicon.svg
./public/google6a2681e4d30f2a61.html
./public/images
./public/images/amit-suthar.png
./public/images/jennifer-klein.png
./public/images/kapono-ciotti.png
./public/images/kody-krueger.jpg
./public/images/sam-otten-new.png
./public/images/sam-otten.png
./public/images/sanjay-divakar.png
./public/images/tanisha-sikder.jpg
./public/images/tristan-beley-new.png
./public/images/tristan-beley.png
./public/llms.txt
./public/placeholder.svg
./public/rcf-logo.png
./public/robots.txt
./public/uploads
./public/uploads/0ca6cfd6-fe95-4e26-8ace-76fff956f217.png
./public/uploads/215460ce-2150-4569-b60c-3a223ce10adf.png
./public/uploads/2842bc15-73da-4523-b9c9-228cb076346e.png
./public/uploads/2938b86e-e795-4587-9359-51f4b94c106a.png
./public/uploads/834de8a8-fe6c-412e-acc4-b14ee558851d.png
./public/uploads/b0720aa1-19dc-4cac-aefe-2dfb86343600.png
./public/uploads/fe97ed85-5d66-4caf-bd60-b8463d40052f.png
./src
./src/App.css
./src/App.tsx
./src/LegacyCandiadates
./src/LegacyCandiadates/CandidateBulkImportModal.tsx
./src/LegacyCandiadates/CandidateComparisonView.tsx
./src/LegacyCandiadates/CandidateDetailModal.tsx
./src/LegacyCandiadates/CandidateFitModal.tsx
./src/LegacyCandiadates/CandidateResultsModal.tsx
./src/LegacyCandiadates/CandidatesTab.tsx
./src/assets
./src/assets/dashboard-preview-v4.png
./src/assets/hero-image.jpg
./src/assets/professional-team.jpg
./src/assets/role-color-finder-white.svg
./src/assets/rolecolor-ai-logo.svg
./src/components
./src/components/AssessmentDetails.tsx
./src/components/BackToTop.tsx
./src/components/Footer.tsx
./src/components/PDFReport.tsx
./src/components/ScrollToTop.tsx
./src/components/Sitemap.tsx
./src/components/SubdomainRouter.tsx
./src/components/assessment
./src/components/assessment/AutoSaveIndicator.tsx
./src/components/assessment/PauseButton.tsx
./src/components/assessment/ResumeProgressModal.tsx
./src/components/auth
./src/components/auth/ProtectedRoute.tsx
./src/components/b2b
./src/components/b2b/AIFollowUpChat.tsx
./src/components/b2b/ActivityFeed.tsx
./src/components/b2b/AddCreditsModal.tsx
./src/components/b2b/AssessmentPreviewModal.tsx
./src/components/b2b/AssessmentsTab.tsx
./src/components/b2b/BillingModal.tsx
./src/components/b2b/BulkActionsBar.tsx
./src/components/b2b/BulkImportModal.tsx
./src/components/b2b/CandidateBulkImportModal.tsx
./src/components/b2b/CandidateDetailModal.tsx
./src/components/b2b/CandidateFitModal.tsx
./src/components/b2b/CandidateResultsModal.tsx
./src/components/b2b/CandidatesTab.tsx
./src/components/b2b/CreateApplicationLinkModal.tsx
./src/components/b2b/CreditNotificationModal.tsx
./src/components/b2b/DeleteCompanyModal.tsx
./src/components/b2b/EmailTemplateCustomizer.tsx
./src/components/b2b/EmployeeResultsModal.tsx
./src/components/b2b/EmployeeTasksView.tsx
./src/components/b2b/GlobalSearch.tsx
./src/components/b2b/GoogleWorkspaceImportModal.tsx
./src/components/b2b/HiringSubscriptionSettings.tsx
./src/components/b2b/HiringUnlockedModal.tsx
./src/components/b2b/InlineEditableCell.tsx
./src/components/b2b/InsightPaywallModal.tsx
./src/components/b2b/InsightUsageMeter.tsx
./src/components/b2b/InviteAdminModal.tsx
./src/components/b2b/InviteCandidateModal.tsx
./src/components/b2b/InviteUserModal.tsx
./src/components/b2b/KeyboardShortcutsModal.tsx
./src/components/b2b/ManageAdminModal.tsx
./src/components/b2b/MobileBottomNav.tsx
./src/components/b2b/OverviewTab.tsx
./src/components/b2b/PaymentMethodCard.tsx
./src/components/b2b/PromoteToAdminModal.tsx
./src/components/b2b/RemindersHistoryTab.tsx
./src/components/b2b/ResumeUpload.tsx
./src/components/b2b/RoleAnalysisCard.tsx
./src/components/b2b/RolesTab.tsx
./src/components/b2b/ScheduleReminderModal.tsx
./src/components/b2b/SettingsTab.tsx
./src/components/b2b/TeamFrictionMapTab.tsx
./src/components/b2b/TeamInsightsModal.tsx
./src/components/b2b/ThemeExportImport.tsx
./src/components/b2b/UserDetailModal.tsx
./src/components/b2b/UserProfileSheet.tsx
./src/components/b2b/UsersTab.tsx
./src/components/b2b/WorkAssigningMatrixTab.tsx
./src/components/b2b/admin
./src/components/b2b/admin/AdminCompanyStatementModal.tsx
./src/components/b2b/admin/ApiDocumentation.tsx
./src/components/b2b/admin/ApiKeyManagement.tsx
./src/components/b2b/admin/AuditLogViewer.tsx
./src/components/b2b/admin/ChatGPTIntegrationSettings.tsx
./src/components/b2b/admin/IntegrationsSettings.tsx
./src/components/b2b/admin/ScheduledReportsManager.tsx
./src/components/b2b/admin/SlackIntegrationSettings.tsx
./src/components/b2b/analytics
./src/components/b2b/analytics/AdvancedAnalyticsDashboard.tsx
./src/components/b2b/analytics/TeamCompatibilityMatrix.tsx
./src/components/b2b/hiring
./src/components/b2b/hiring/AddCandidateDialog.tsx
./src/components/b2b/hiring/AdvancedCandidateSearch.tsx
./src/components/b2b/hiring/BulkEmailComposer.tsx
./src/components/b2b/hiring/CalendarIntegration.tsx
./src/components/b2b/hiring/CandidateActivityTimeline.tsx
./src/components/b2b/hiring/CandidateComparisonView.tsx
./src/components/b2b/hiring/CandidateProfileDialog.tsx
./src/components/b2b/hiring/CareerPageSettings.tsx
./src/components/b2b/hiring/EmailTemplatesTab.tsx
./src/components/b2b/hiring/HiringAnalyticsTab.tsx
./src/components/b2b/hiring/HiringCandidatesTab.tsx
./src/components/b2b/hiring/HiringIntegrationsTab.tsx
./src/components/b2b/hiring/HiringPipelineView.tsx
./src/components/b2b/hiring/HiringSection.tsx
./src/components/b2b/hiring/InterviewQuestionGenerator.tsx
./src/components/b2b/hiring/InterviewsTab.tsx
./src/components/b2b/hiring/JobPostingsTab.tsx
./src/components/b2b/hiring/LegacyCandidatesTab.tsx
./src/components/b2b/hiring/MoveStageDialog.tsx
./src/components/b2b/hiring/OffersTab.tsx
./src/components/b2b/hiring/ScheduleInterviewDialog.tsx
./src/components/b2b/hiring/SendAssessmentDialog.tsx
./src/components/b2b/hiring/SendEmailDialog.tsx
./src/components/b2b/hiring/SendOfferDialog.tsx
./src/components/b2b/matrix
./src/components/b2b/matrix/TaskAssignmentOutput.tsx
./src/components/b2b/matrix/TaskEmailModal.tsx
./src/components/b2b/matrix/TaskHistoryPanel.tsx
./src/components/b2b/matrix/TaskIntakeForm.tsx
./src/components/career
./src/components/career/ResumeCareerUpload.tsx
./src/components/company
./src/components/company/EmployeeTasksKanban.tsx
./src/components/dashboard
./src/components/dashboard/ChangeEmailModal.tsx
./src/components/dashboard/MobileSidebar.tsx
./src/components/game
./src/components/game/GameUI.tsx
./src/components/game/OfficeScene.tsx
./src/components/game/PlayerController.tsx
./src/components/help
./src/components/help/HelpButton.tsx
./src/components/help/TourTooltip.tsx
./src/components/help/index.ts
./src/components/help/useAutoStartTour.ts
./src/components/hero
./src/components/hero/StickyTextHero.tsx
./src/components/hero/sticky-text-hero.css
./src/components/navigation
./src/components/navigation/Navbar.tsx
./src/components/payment
./src/components/payment/PaymentButton.tsx
./src/components/pricing
./src/components/pricing/LuminousPricingCard.tsx
./src/components/pricing/luminous-card.css
./src/components/profile
./src/components/profile/PublicRoleColorProfileSettings.tsx
./src/components/reports
./src/components/reports/RoleColorIdentityCard.tsx
./src/components/reports/SendToFriendCard.tsx
./src/components/settings
./src/components/settings/PersonalChatGPTIntegrationCard.tsx
./src/components/subscription
./src/components/subscription/FamilyMemberManager.tsx
./src/components/subscription/ProgressTracking.tsx
./src/components/subscription/SubscriptionCard.tsx
./src/components/subscription/SubscriptionStatus.tsx
./src/components/ui
./src/components/ui/accordion.tsx
./src/components/ui/aceternity-sidebar.tsx
./src/components/ui/alert-dialog.tsx
./src/components/ui/alert.tsx
./src/components/ui/animated-characters-login-demo.tsx
./src/components/ui/animated-characters-login-page.tsx
./src/components/ui/animated-group.tsx
./src/components/ui/aspect-ratio.tsx
./src/components/ui/avatar.tsx
./src/components/ui/badge.tsx
./src/components/ui/border-trail.tsx
./src/components/ui/breadcrumb.tsx
./src/components/ui/button.tsx
./src/components/ui/calendar.tsx
./src/components/ui/card.tsx
./src/components/ui/carousel.tsx
./src/components/ui/chart.tsx
./src/components/ui/checkbox.tsx
./src/components/ui/collapsible.tsx
./src/components/ui/command.tsx
./src/components/ui/contact-card-demo.tsx
./src/components/ui/contact-card.tsx
./src/components/ui/container-scroll-animation.tsx
./src/components/ui/context-menu.tsx
./src/components/ui/demo.tsx
./src/components/ui/dialog.tsx
./src/components/ui/drawer.tsx
./src/components/ui/dropdown-menu.tsx
./src/components/ui/expandable-text.tsx
./src/components/ui/faq-accordion.tsx
./src/components/ui/flip-words.tsx
./src/components/ui/floating-header.tsx
./src/components/ui/form.tsx
./src/components/ui/glowing-effect.tsx
./src/components/ui/gooey-text-morphing.tsx
./src/components/ui/header-demo.tsx
./src/components/ui/header.tsx
./src/components/ui/hero-section-with-gradient.tsx
./src/components/ui/hover-card.tsx
./src/components/ui/hover-footer.tsx
./src/components/ui/hyper-text.tsx
./src/components/ui/infinite-grid-integration.tsx
./src/components/ui/input-otp.tsx
./src/components/ui/input.tsx
./src/components/ui/interactive-hover-button.tsx
./src/components/ui/interactive-text-particle.tsx
./src/components/ui/label.tsx
./src/components/ui/logos3-demo.tsx
./src/components/ui/logos3.tsx
./src/components/ui/menu-vertical.tsx
./src/components/ui/menubar.tsx
./src/components/ui/navigation-menu.tsx
./src/components/ui/pagination.tsx
./src/components/ui/popover.tsx
./src/components/ui/pricing-cards.tsx
./src/components/ui/pricing-demo.tsx
./src/components/ui/progress.tsx
./src/components/ui/radio-group.tsx
./src/components/ui/resizable.tsx
./src/components/ui/scroll-area.tsx
./src/components/ui/scroll-expansion-hero.tsx
./src/components/ui/scroll-reveal.tsx
./src/components/ui/select.tsx
./src/components/ui/separator.tsx
./src/components/ui/sheet.tsx
./src/components/ui/sidebar.tsx
./src/components/ui/sign-in-flow.tsx
./src/components/ui/single-pricing-card.tsx
./src/components/ui/skeleton.tsx
./src/components/ui/slide-tabs.tsx
./src/components/ui/slider.tsx
./src/components/ui/sonner.tsx
./src/components/ui/stacked-color-bar.tsx
./src/components/ui/switch.tsx
./src/components/ui/table.tsx
./src/components/ui/tabs.tsx
./src/components/ui/testimonials-carousel.tsx
./src/components/ui/testimonials-columns-1.tsx
./src/components/ui/testimonials-columns.tsx
./src/components/ui/textarea.tsx
./src/components/ui/toast.tsx
./src/components/ui/toaster.tsx
./src/components/ui/toggle-group.tsx
./src/components/ui/toggle.tsx
./src/components/ui/tooltip.tsx
./src/components/ui/truncated-text.tsx
./src/components/ui/use-toast.ts
./src/components/ui/user-profile-sidebar.tsx
./src/contexts
./src/contexts/AuthContext.tsx
./src/contexts/B2BThemeContext.tsx
./src/contexts/CandidatePortalContext.tsx
./src/contexts/CompanyContext.tsx
./src/contexts/CompanyPortalContext.tsx
./src/contexts/HelpTourContext.tsx
./src/hooks
./src/hooks/use-mobile.tsx
./src/hooks/use-toast.ts
./src/hooks/useAssessmentProgress.ts
./src/hooks/useKeyboardShortcuts.ts
./src/hooks/useRoleColorSuggestion.ts
./src/hooks/useSubdomainDetection.ts
./src/index.css
./src/integrations
./src/integrations/supabase
./src/integrations/supabase/client.ts
./src/integrations/supabase/types.ts
./src/lib
./src/lib/adminExport.test.ts
./src/lib/adminExport.ts
./src/lib/adminPasswords.test.ts
./src/lib/adminPasswords.ts
./src/lib/assessmentQuestionLoader.ts
./src/lib/assessmentScoring.ts
./src/lib/auditLogger.ts
./src/lib/careerData.ts
./src/lib/chatgptIntegration.ts
./src/lib/clientProposals.ts
./src/lib/companyPdfExport.ts
./src/lib/countryPricing.ts
./src/lib/dashboardPdfExport.ts
./src/lib/entrepreneurAssessmentQuestions.ts
./src/lib/executiveAssessmentQuestions.ts
./src/lib/exportUtils.ts
./src/lib/hiringSubscribeLock.ts
./src/lib/insightMetering.ts
./src/lib/leadershipGameScenarios.ts
./src/lib/managerAssessmentQuestions.ts
./src/lib/mergeCatalog.ts
./src/lib/pdfExport.ts
./src/lib/professional50QPdfExport.ts
./src/lib/professionalAssessmentQuestions.ts
./src/lib/proposalPdfExport.ts
./src/lib/roleSkillsGenerator.ts
./src/lib/smoothScroll.ts
./src/lib/studentAssessmentQuestions.ts
./src/lib/subscribeHiring.ts
./src/lib/subscriptionTiers.ts
./src/lib/teacherAssessmentQuestions.ts
./src/lib/teamFrictionMap.ts
./src/lib/utils.ts
./src/main.tsx
./src/pages
./src/pages/About.tsx
./src/pages/AnimatedAuth.tsx
./src/pages/Auth.tsx
./src/pages/B2B.tsx
./src/pages/Blog.tsx
./src/pages/BlogPost.tsx
./src/pages/CareerFinder.tsx
./src/pages/CareerFinderResults.tsx
./src/pages/CareerPaymentSuccess.tsx
./src/pages/CareerResumeResults.tsx
./src/pages/CelebrityAssessment.tsx
./src/pages/CelebrityResults.tsx
./src/pages/ChangePassword.tsx
./src/pages/Contact.tsx
./src/pages/Dashboard.tsx
./src/pages/FreeAssessment.tsx
./src/pages/FreeResults.tsx
./src/pages/Index.tsx
./src/pages/LeadershipAssessment.tsx
./src/pages/LeadershipGame.tsx
./src/pages/LeadershipGame3D.tsx
./src/pages/LeadershipResults.tsx
./src/pages/Maintenance.tsx
./src/pages/NotFound.tsx
./src/pages/PaymentSuccess.tsx
./src/pages/PersonalIntegrationsPage.tsx
./src/pages/PremiumAssessment.tsx
./src/pages/PremiumResults.tsx
./src/pages/Pricing.tsx
./src/pages/PrivacyPolicy.tsx
./src/pages/ProAssessment.tsx
./src/pages/ProResults.tsx
./src/pages/PublicRoleColorProfile.tsx
./src/pages/Quiz.tsx
./src/pages/ResetPassword.tsx
./src/pages/Results.tsx
./src/pages/SharedResult.tsx
./src/pages/SlackLinkPage.tsx
./src/pages/SubscriptionSuccess.tsx
./src/pages/Team.tsx
./src/pages/TermsOfService.tsx
./src/pages/TwoFactorEnrollment.tsx
./src/pages/VoiceAssessment.tsx
./src/pages/VoiceResults.tsx
./src/pages/admin
./src/pages/admin/AdminDashboard.tsx
./src/pages/admin/BlogEditor.tsx
./src/pages/admin/BlogManagement.tsx
./src/pages/admin/ProposalManager.tsx
./src/pages/admin/RCFB2BAdminDashboard.tsx
./src/pages/admin/UserManagement.tsx
./src/pages/b2b
./src/pages/b2b/B2BDashboard.tsx
./src/pages/b2b/B2BPaymentSuccess.tsx
./src/pages/b2b/B2BSignIn.tsx
./src/pages/b2b/ConfirmDeleteCompany.tsx
./src/pages/b2b/ProfessionalAssessment25Q.tsx
./src/pages/b2b/ProfessionalAssessment50Q.tsx
./src/pages/b2b/ProfessionalResults.tsx
./src/pages/candidate
./src/pages/candidate/CandidateAssessment.tsx
./src/pages/candidate/CandidateLanding.tsx
./src/pages/candidate/CandidateLogin.tsx
./src/pages/candidate/CandidatePortalLayout.tsx
./src/pages/candidate/CandidateResults.tsx
./src/pages/careers
./src/pages/careers/PublicCareersPage.tsx
./src/pages/careers/PublicJobDetailPage.tsx
./src/pages/client
./src/pages/client/ClientProposal.tsx
./src/pages/client/HyattProposal.tsx
./src/pages/client/ProposalAgreement.tsx
./src/pages/client/ProposalLOE.tsx
./src/pages/client/ProposalLOI.tsx
./src/pages/client/ProposalPayment.tsx
./src/pages/client/ProposalSuccess.tsx
./src/pages/company
./src/pages/company/CompanyAdminLogin.tsx
./src/pages/company/CompanyAssessment.tsx
./src/pages/company/CompanyHome.tsx
./src/pages/company/CompanyLanding.tsx
./src/pages/company/CompanyLogin.tsx
./src/pages/company/CompanyPortalLayout.tsx
./src/pages/company/CompanyResults.tsx
./src/pages/school
./src/pages/school/AdminResults.tsx
./src/pages/school/StudentCustomAssessment.tsx
./src/pages/school/TeacherCustomAssessment.tsx
./src/pages/team
./src/pages/team/AmitSuthar.tsx
./src/pages/team/KodyKrueger.tsx
./src/pages/team/SanjayDivakar.tsx
./src/pages/team/TanishaSikder.tsx
./src/pages/team/TristanBeley.tsx
./src/router.tsx
./src/vite-env.d.ts
./supabase
./supabase/config.toml
./supabase/functions
./supabase/functions/_shared
./supabase/functions/_shared/admin.ts
./supabase/functions/_shared/chatgpt.ts
./supabase/functions/_shared/companyPortalBilling.ts
./supabase/functions/_shared/merge.ts
./supabase/functions/_shared/slack-assistant.ts
./supabase/functions/_shared/slack-onboarding.ts
./supabase/functions/_shared/slack.ts
./supabase/functions/_shared/superAdmin.ts
./supabase/functions/add-credits
./supabase/functions/add-credits/index.ts
./supabase/functions/add-seats-payment
./supabase/functions/add-seats-payment/index.ts
./supabase/functions/ai-follow-up
./supabase/functions/ai-follow-up/index.ts
./supabase/functions/analyze-candidate-fit
./supabase/functions/analyze-candidate-fit/index.ts
./supabase/functions/analyze-career-resume
./supabase/functions/analyze-career-resume/index.ts
./supabase/functions/analyze-csv-import
./supabase/functions/analyze-csv-import/index.ts
./supabase/functions/analyze-leadership
./supabase/functions/analyze-leadership/index.ts
./supabase/functions/analyze-role-assessment-need
./supabase/functions/analyze-role-assessment-need/index.ts
./supabase/functions/analyze-task-assignment
./supabase/functions/analyze-task-assignment/index.ts
./supabase/functions/api-assessments
./supabase/functions/api-assessments/index.ts
./supabase/functions/api-gateway
./supabase/functions/api-gateway/index.ts
./supabase/functions/api-users
./supabase/functions/api-users/index.ts
./supabase/functions/calculate-user-refund
./supabase/functions/calculate-user-refund/index.ts
./supabase/functions/cancel-hiring-subscription
./supabase/functions/cancel-hiring-subscription/index.ts
./supabase/functions/celebrity-assessment
./supabase/functions/celebrity-assessment/index.ts
./supabase/functions/charge-insight-redo
./supabase/functions/charge-insight-redo/index.ts
./supabase/functions/charge-invite
./supabase/functions/charge-invite/index.ts
./supabase/functions/chatgpt-manage
./supabase/functions/chatgpt-manage/index.ts
./supabase/functions/chatgpt-mcp-server
./supabase/functions/chatgpt-mcp-server/index.ts
./supabase/functions/chatgpt-oauth-callback
./supabase/functions/chatgpt-oauth-callback/index.ts
./supabase/functions/chatgpt-oauth-init
./supabase/functions/chatgpt-oauth-init/index.ts
./supabase/functions/check-payment-status
./supabase/functions/check-payment-status/index.ts
./supabase/functions/check-subscription
./supabase/functions/check-subscription/index.ts
./supabase/functions/convert-candidate-to-employee
./supabase/functions/convert-candidate-to-employee/index.ts
./supabase/functions/create-audit-log
./supabase/functions/create-audit-log/index.ts
./supabase/functions/create-b2b-payment
./supabase/functions/create-b2b-payment/index.ts
./supabase/functions/create-company
./supabase/functions/create-company/index.ts
./supabase/functions/create-link-token
./supabase/functions/create-link-token/index.ts
./supabase/functions/create-payment
./supabase/functions/create-payment/index.ts
./supabase/functions/create-probation-reminder
./supabase/functions/create-probation-reminder/index.ts
./supabase/functions/create-proposal-payment
./supabase/functions/create-proposal-payment/index.ts
./supabase/functions/create-rcf-user
./supabase/functions/create-rcf-user/index.ts
./supabase/functions/create-subscription-checkout
./supabase/functions/create-subscription-checkout/index.ts
./supabase/functions/customer-portal
./supabase/functions/customer-portal/index.ts
./supabase/functions/delete-billing-entry
./supabase/functions/delete-billing-entry/index.ts
./supabase/functions/delete-company
./supabase/functions/delete-company/index.ts
./supabase/functions/draft-task-email
./supabase/functions/draft-task-email/index.ts
./supabase/functions/fetch-google-workspace-users
./supabase/functions/fetch-google-workspace-users/index.ts
./supabase/functions/generate-ats-job-draft
./supabase/functions/generate-ats-job-draft/index.ts
./supabase/functions/generate-impersonation-link
./supabase/functions/generate-impersonation-link/index.ts
./supabase/functions/generate-interview-questions
./supabase/functions/generate-interview-questions/index.ts
./supabase/functions/generate-team-insights
./supabase/functions/generate-team-insights/index.ts
./supabase/functions/get-company-employee-session
./supabase/functions/get-company-employee-session/index.ts
./supabase/functions/get-employee-data
./supabase/functions/get-employee-data/index.ts
./supabase/functions/initiate-voice-call
./supabase/functions/initiate-voice-call/index.ts
./supabase/functions/invite-candidate
./supabase/functions/invite-candidate/index.ts
./supabase/functions/invite-company-user
./supabase/functions/invite-company-user/index.ts
./supabase/functions/invite-family-member
./supabase/functions/invite-family-member/index.ts
./supabase/functions/list-rcf-b2b-companies
./supabase/functions/list-rcf-b2b-companies/index.ts
./supabase/functions/list-rcf-company-users
./supabase/functions/list-rcf-company-users/index.ts
./supabase/functions/list-rcf-platform-users
./supabase/functions/list-rcf-platform-users/index.ts
./supabase/functions/list-user-announcements
./supabase/functions/list-user-announcements/index.ts
./supabase/functions/manage-payment-method
./supabase/functions/manage-payment-method/index.ts
./supabase/functions/manage-super-admins
./supabase/functions/manage-super-admins/index.ts
./supabase/functions/manage-user-sessions
./supabase/functions/manage-user-sessions/index.ts
./supabase/functions/notify-admin-new-employee
./supabase/functions/notify-admin-new-employee/index.ts
./supabase/functions/notify-task-completion
./supabase/functions/notify-task-completion/index.ts
./supabase/functions/parse-candidate-text
./supabase/functions/parse-candidate-text/index.ts
./supabase/functions/parse-resume
./supabase/functions/parse-resume/index.ts
./supabase/functions/process-monthly-billing
./supabase/functions/process-monthly-billing/index.ts
./supabase/functions/promote-company-user
./supabase/functions/promote-company-user/index.ts
./supabase/functions/purchase-insight-credits
./supabase/functions/purchase-insight-credits/index.ts
./supabase/functions/rcf-company-billing-admin
./supabase/functions/rcf-company-billing-admin/index.ts
./supabase/functions/recover-assessment-by-email
./supabase/functions/recover-assessment-by-email/index.ts
./supabase/functions/resend-invite
./supabase/functions/resend-invite/index.ts
./supabase/functions/resubscribe-hiring
./supabase/functions/resubscribe-hiring/index.ts
./supabase/functions/retrieve-token
./supabase/functions/retrieve-token/index.ts
./supabase/functions/retry-company-renewal-payment
./supabase/functions/retry-company-renewal-payment/index.ts
./supabase/functions/revoke-elevated-access
./supabase/functions/revoke-elevated-access/index.ts
./supabase/functions/run-bamboohr-auto-sync
./supabase/functions/run-bamboohr-auto-sync/index.ts
./supabase/functions/run-merge-auto-sync
./supabase/functions/run-merge-auto-sync/index.ts
./supabase/functions/save-company-assessment
./supabase/functions/save-company-assessment/index.ts
./supabase/functions/send-assessment-email
./supabase/functions/send-assessment-email/index.ts
./supabase/functions/send-candidate-email
./supabase/functions/send-candidate-email/index.ts
./supabase/functions/send-contact-reply
./supabase/functions/send-contact-reply/index.ts
./supabase/functions/send-email
./supabase/functions/send-email/_templates
./supabase/functions/send-email/_templates/confirmation-email.tsx
./supabase/functions/send-email/_templates/reset-password-email.tsx
./supabase/functions/send-email/index.ts
./supabase/functions/send-interview-email
./supabase/functions/send-interview-email/index.ts
./supabase/functions/send-offer-email
./supabase/functions/send-offer-email/index.ts
./supabase/functions/send-rcf-password-reset
./supabase/functions/send-rcf-password-reset/index.ts
./supabase/functions/send-scheduled-reminders
./supabase/functions/send-scheduled-reminders/index.ts
./supabase/functions/send-scheduled-report
./supabase/functions/send-scheduled-report/index.ts
./supabase/functions/send-slack-notification
./supabase/functions/send-slack-notification/index.ts
./supabase/functions/send-task-assignment-email
./supabase/functions/send-task-assignment-email/index.ts
./supabase/functions/send-teams-notification
./supabase/functions/send-teams-notification/index.ts
./supabase/functions/slack-admin-settings
./supabase/functions/slack-admin-settings/index.ts
./supabase/functions/slack-events
./supabase/functions/slack-events/index.ts
./supabase/functions/slack-interactivity
./supabase/functions/slack-interactivity/index.ts
./supabase/functions/slack-link-confirmation
./supabase/functions/slack-link-confirmation/index.ts
./supabase/functions/slack-manage
./supabase/functions/slack-manage/index.ts
./supabase/functions/slack-oauth-callback
./supabase/functions/slack-oauth-callback/index.ts
./supabase/functions/slack-oauth-init
./supabase/functions/slack-oauth-init/index.ts
./supabase/functions/slack-rcf
./supabase/functions/slack-rcf/index.ts
./supabase/functions/slack-rolecolor
./supabase/functions/slack-rolecolor/index.ts
./supabase/functions/slack-teambalance
./supabase/functions/slack-teambalance/index.ts
./supabase/functions/subscribe-hiring-tab
./supabase/functions/subscribe-hiring-tab/index.ts
./supabase/functions/suggest-assessment-category
./supabase/functions/suggest-assessment-category/index.ts
./supabase/functions/suggest-skills
./supabase/functions/suggest-skills/index.ts
./supabase/functions/super-admin-toggle-hiring
./supabase/functions/super-admin-toggle-hiring/index.ts
./supabase/functions/sync-ats
./supabase/functions/sync-ats/index.ts
./supabase/functions/sync-bamboohr-hiring
./supabase/functions/sync-bamboohr-hiring/index.ts
./supabase/functions/sync-google-workspace-users
./supabase/functions/sync-google-workspace-users/index.ts
./supabase/functions/sync-hris
./supabase/functions/sync-hris/index.ts
./supabase/functions/team-friction-pulse
./supabase/functions/test-merge-connection
./supabase/functions/test-merge-connection/index.ts
./supabase/functions/unhire-candidate
./supabase/functions/unhire-candidate/index.ts
./supabase/functions/update-company
./supabase/functions/update-company-user-email
./supabase/functions/update-company-user-email/index.ts
./supabase/functions/update-company/index.ts
./supabase/functions/update-daily-prorations
./supabase/functions/update-daily-prorations/index.ts
./supabase/functions/validate-api-key
./supabase/functions/validate-api-key/index.ts
./supabase/functions/verify-add-seats-payment
./supabase/functions/verify-add-seats-payment/index.ts
./supabase/functions/verify-b2b-payment
./supabase/functions/verify-b2b-payment/index.ts
./supabase/functions/verify-employee-invite
./supabase/functions/verify-employee-invite/index.ts
./supabase/functions/verify-google-sso-employee
./supabase/functions/verify-google-sso-employee/index.ts
./supabase/functions/verify-hiring-subscription
./supabase/functions/verify-hiring-subscription/index.ts
./supabase/functions/voiceAssessment
./supabase/functions/voiceAssessment/index.ts
./supabase/functions/webhook-handler
./supabase/functions/webhook-handler/index.ts
./supabase/migrations
./supabase/migrations/20240101000000_create_payments_table.sql
./supabase/migrations/20250718065448-d6f2c577-a3eb-4628-b6ea-f714a943d627.sql
./supabase/migrations/20250718085431-383e3c24-c1c4-4833-8ba5-459e5330e792.sql
./supabase/migrations/20250718093504-624d9a3e-f67f-48f8-84c2-ccf98a4a89d8.sql
./supabase/migrations/20250718093533-6a56d4b8-7487-46af-b576-b81633a022ec.sql
./supabase/migrations/20250730000422-fac407c8-7095-4ab0-b4a7-0152b71559ba.sql
./supabase/migrations/20250803002159_3b824080-3039-4ae1-8db1-e575b795112f.sql
./supabase/migrations/20251010001445_176a75bb-e921-42a4-a99e-216219192f2e.sql
./supabase/migrations/20251106014802_a37a794d-4694-4e5b-a4c2-3a293e063995.sql
./supabase/migrations/20251106014819_bef4e236-cced-45bf-9582-4f2029f971c7.sql
./supabase/migrations/20251119182901_8571f149-5296-4732-ae67-9b7d02930503.sql
./supabase/migrations/20251119183501_3e13e718-c9e6-4d7e-bd50-f75b2014c104.sql
./supabase/migrations/20251119184256_eb03895d-c811-44b2-bc51-2e15f78ca341.sql
./supabase/migrations/20251202073321_07f71cdb-65aa-4e26-b84c-4565b1eefb9c.sql
./supabase/migrations/20251202073349_07cb5211-58b8-45f9-bae6-34300c2fff43.sql
./supabase/migrations/20251202080659_243373b2-bcdd-4e12-85b3-2fc300e19017.sql
./supabase/migrations/20251202081205_85af5935-6b64-4e12-97a8-413585b138f3.sql
./supabase/migrations/20251202082654_3c9e5820-fe1f-4cf4-8a5a-a53bbdbacf24.sql
./supabase/migrations/20251202085531_b85bb234-d0f9-45b1-8fc3-14c1096bf69f.sql
./supabase/migrations/20251207101241_9491ffbf-039f-43cd-b315-b2499ba7ec72.sql
./supabase/migrations/20251207104154_af1c94b2-9def-4d3c-8c54-5a8bbc305c98.sql
./supabase/migrations/20251207110301_62278d57-152a-4181-a8e7-0b69caf2d3d7.sql
./supabase/migrations/20251207120653_1a76defc-5064-4e4d-b047-b4e489e2c148.sql
./supabase/migrations/20251207121328_7fa88dec-362a-4327-ac97-dd1159ec415a.sql
./supabase/migrations/20251207122107_6b1ab2d5-65b3-4c3d-8743-7f25abc40d1b.sql
./supabase/migrations/20260119052518_236f0674-13cb-4a50-bf67-f858d5e17bff.sql
./supabase/migrations/20260120005536_7713a873-9e25-4a90-9ee3-26af9c2fe49d.sql
./supabase/migrations/20260120022815_a7c088fc-7ed7-4e4c-ac5f-b27f2cf7e774.sql
./supabase/migrations/20260120024531_db8fbbdb-8bec-42d0-b117-b9c4004aa8fa.sql
./supabase/migrations/20260120032709_b7e499d8-6555-4544-96e9-6ff73dfa7afd.sql
./supabase/migrations/20260120034302_785e56e3-efae-4c2a-bf6b-d3e8c094d2d3.sql
./supabase/migrations/20260120034501_88827e38-55bb-4e86-ad07-1cab2d0f1cd2.sql
./supabase/migrations/20260120035210_65eeba91-6c19-4aab-899a-be66837e8371.sql
./supabase/migrations/20260120040127_723472bc-1906-45e0-8e2a-9185ba49cb73.sql
./supabase/migrations/20260120040840_fd1c3f76-98f6-4100-a5a6-c5caba195e14.sql
./supabase/migrations/20260120042507_cbe8decc-e5e9-4a2b-a2bf-0f4d59da0f68.sql
./supabase/migrations/20260120055240_237a3eca-cfc6-4864-996b-85d7e68e1b68.sql
./supabase/migrations/20260120191339_478fded6-fcb8-4aed-ba69-3c9b1e1835d2.sql
./supabase/migrations/20260120232840_063997d8-2d07-4626-b0a9-e1ede85a1823.sql
./supabase/migrations/20260121030453_47b27836-1e85-461c-a73a-9544522d4282.sql
./supabase/migrations/20260121030521_85ea9b2c-2f5b-4fe2-b99d-3fbdd0d368ad.sql
./supabase/migrations/20260122215741_f1c9b541-9751-4455-9bed-f73e44c9b0e1.sql
./supabase/migrations/20260125223541_66ef1785-a290-4ed7-b1e4-c31b71a059cb.sql
./supabase/migrations/20260126010948_52aadd3c-9c96-431b-9d1b-41afe54609ab.sql
./supabase/migrations/20260127063055_d20a183c-6979-46cf-b665-283c6e0dfd15.sql
./supabase/migrations/20260127063651_5df46c8c-597a-43b6-aa9c-142962a17447.sql
./supabase/migrations/20260127063703_cf6b4cec-96a9-47df-804c-12b4ae137bca.sql
./supabase/migrations/20260127070334_19ca9734-db10-42d8-a2ea-a8ee4743bc0e.sql
./supabase/migrations/20260127070652_1c0299a5-028b-48b1-827f-0e81e9651717.sql
./supabase/migrations/20260127070833_c0901680-fedd-4d95-b567-ada833b86b95.sql
./supabase/migrations/20260127180805_456fef0f-187e-4252-9eb7-f3813471762d.sql
./supabase/migrations/20260127182245_256124a3-3308-44f3-84dc-f8d138ec381a.sql
./supabase/migrations/20260127221632_bd2918bc-ce00-4fa3-a804-f68e86306ea3.sql
./supabase/migrations/20260129002529_91dec8f2-9114-4a0a-bbf8-49b39ef3f71d.sql
./supabase/migrations/20260129003151_099eb2b4-e985-4af3-a94c-c4e4ee77fdf7.sql
./supabase/migrations/20260129003503_f1796b84-d17d-455e-a8eb-3ef900e4a996.sql
./supabase/migrations/20260129004333_4c3c2013-cf4c-442a-934c-97b3388897b6.sql
./supabase/migrations/20260212000001_add_insight_usage_columns.sql
./supabase/migrations/20260212000002_add_job_description.sql
./supabase/migrations/20260212000003_create_company_roles.sql
./supabase/migrations/20260213000001_create_ats_tables.sql
./supabase/migrations/20260213000002_ats_rls_policies.sql
./supabase/migrations/20260213000003_ats_enhancements.sql
./supabase/migrations/20260213000004_resumes_storage.sql
./supabase/migrations/20260217000001_add_hiring_subscription.sql
./supabase/migrations/20260217000002_fix_hiring_subscription_schema.sql
./supabase/migrations/20260219000001_enforce_privileged_company_user_user_id.sql
./supabase/migrations/20260220000002_realign_privileged_user_id_to_auth_email.sql
./supabase/migrations/20260221083000_add_timezone_to_scheduled_reports.sql
./supabase/migrations/20260223000001_fix_interview_activity_trigger_status_column.sql
./supabase/migrations/20260224000001_create_offer_probation_reminders.sql
./supabase/migrations/20260301000001_fix_billing_credits_type_constraint.sql
./supabase/migrations/20260302000001_cleanup_duplicate_hiring_subscription_transactions.sql
./supabase/migrations/20260302000002_remove_orphan_hiring_subscription_transactions.sql
./supabase/migrations/20260302000003_hiring_subscription_single_flight.sql
./supabase/migrations/20260302000004_hiring_subscription_lock_failed_ttl_fix.sql
./supabase/migrations/20260302000005_hiring_subscription_lock_same_request_replay_fix.sql
./supabase/migrations/20260302000010_track_hiring_ever_subscribed.sql
./supabase/migrations/20260305093000_create_public_rolecolor_profiles.sql
./supabase/migrations/20260310000100_backfill_privileged_company_user_links.sql
./supabase/migrations/20260310000200_backfill_invited_privileged_company_user_links.sql
./supabase/migrations/20260310000300_add_company_portal_billing_lock.sql
./supabase/migrations/20260310011500_add_portal_billing_periods.sql
./supabase/migrations/20260311000001_add_hiring_commitment_block.sql
./supabase/migrations/20260311000002_secure_hiring_subscription_request_locks.sql
./supabase/migrations/20260311040000_company_deletion_requests.sql
./supabase/migrations/20260316000100_create_contact_queries.sql
./supabase/migrations/20260316101500_per_member_billing_baseline_and_daily_proration.sql
./supabase/migrations/20260322000001_create_client_proposals.sql
./supabase/migrations/20260322000002_fix_client_proposals_rls.sql
./supabase/migrations/20260322000003_fix_client_proposals_rls_v2.sql
./supabase/migrations/20260322090000_add_bamboohr_hiring_integration.sql
./supabase/migrations/20260322101500_bamboohr_auto_sync_settings.sql
./supabase/migrations/20260322113000_schedule_bamboohr_auto_sync.sql
./supabase/migrations/20260322160000_add_b2b_trial_controls.sql
./supabase/migrations/20260322191000_add_deployment_fee_controls.sql
./supabase/migrations/20260330000001_proposal_acceptances.sql
./supabase/migrations/20260330000002_loi_loe_signatures.sql
./supabase/migrations/20260330000003_platform_super_admins.sql
./supabase/migrations/20260331000001_rcf_super_admin_panel_foundations.sql
./supabase/migrations/20260331000002_fix_client_proposal_versioning.sql
./supabase/migrations/20260331000003_manage_auth_sessions_rpc.sql
./supabase/migrations/20260406000100_merge_integrations.sql
./supabase/migrations/20260406000200_merge_ats_pipeline_bridge.sql
./supabase/migrations/20260406000300_schedule_merge_auto_sync.sql
./supabase/migrations/20260406000400_slack_integrations.sql
./supabase/migrations/20260406000500_fix_slack_connection_status_view.sql
./supabase/migrations/20260407000100_slack_onboarding_controls.sql
./supabase/migrations/20260407000200_chatgpt_mcp_integration.sql
./tailwind.config.ts
./tsconfig.app.json
./tsconfig.json
./tsconfig.node.json
./vercel.json
./vite.config.ts
```


### Top-level folders/files

| Top-level entry | What lives there / why |
| --- | --- |
| .claude | Local Claude/Codex editor config; not part of app runtime. |
| .vercel | Local Vercel project linkage metadata. |
| openai | Apps SDK submission metadata for the hidden ChatGPT integration. |
| public | Static assets, SEO files, uploaded images, logos, favicons, security.txt, llms.txt. |
| src | Main React application code: pages, components, hooks, contexts, Supabase client, libraries. |
| supabase | Supabase migrations, edge functions, config; source of truth for backend behavior. |
| README.md | High-level local setup and deployment notes. |
| package.json | Dependency graph and npm scripts. |
| index.html | Vite HTML entry and third-party analytics tags. |
| vercel.json | Vercel rewrites/headers/build behavior. |



### Where business vs personal vs shared code lives

#### Business portal
| Area | Location |
| --- | --- |
| Business Portal root | src/pages/b2b/B2BDashboard.tsx |
| Business Portal tabs | src/components/b2b/* |
| Business Settings integrations | src/components/b2b/admin/IntegrationsSettings.tsx |
| Hiring module | src/components/b2b/hiring/* |

#### Personal portal
| Area | Location |
| --- | --- |
| Personal dashboard | src/pages/Dashboard.tsx |
| Personal integrations placeholder | src/pages/PersonalIntegrationsPage.tsx |
| Assessment flows/results | src/pages/FreeAssessment.tsx, PremiumAssessment.tsx, ProAssessment.tsx, Results pages |

#### Shared code
| Area | Location |
| --- | --- |
| UI primitives | src/components/ui/* |
| Shared hooks | src/hooks/* |
| Shared libs | src/lib/* |
| Supabase client/types | src/integrations/supabase/* |
| Auth/theme/help contexts | src/contexts/* |
## 3. Supabase
- **Project URL**: `https://qbuxoetprodjxpagfkoi.supabase.co`

- **Project ref**: `qbuxoetprodjxpagfkoi`

- **Client project URL in frontend**: currently hardcoded in `src/integrations/supabase/client.ts` instead of being fully env-driven.



### Tables (live linked database)

#### access_codes

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| code | text | text | NO |  |
| created_by_admin | uuid | uuid | YES |  |
| can_see_results | boolean | bool | NO | true |
| is_active | boolean | bool | NO | true |
| max_uses | integer | int4 | YES |  |
| expires_at | timestamp with time zone | timestamptz | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| is_used | boolean | bool | YES | false |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| access_codes_created_by_admin_fkey | created_by_admin | admin_users.id |

Indexes:
| Index | Definition |
| --- | --- |
| access_codes_code_key | CREATE UNIQUE INDEX access_codes_code_key ON public.access_codes USING btree (code) |
| access_codes_pkey | CREATE UNIQUE INDEX access_codes_pkey ON public.access_codes USING btree (id) |
| idx_access_codes_code | CREATE INDEX idx_access_codes_code ON public.access_codes USING btree (code) |
| idx_access_codes_created_by_admin | CREATE INDEX idx_access_codes_created_by_admin ON public.access_codes USING btree (created_by_admin) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Access codes are not accessible via RLS | ALL | {public} | false |  |

#### admin_action_logs

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| actor_id | uuid | uuid | YES |  |
| actor_email | text | text | YES |  |
| action_type | text | text | NO |  |
| target_type | text | text | YES |  |
| target_id | uuid | uuid | YES |  |
| target_label | text | text | YES |  |
| metadata | jsonb | jsonb | NO | '{}'::jsonb |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| admin_action_logs_action_type_idx | CREATE INDEX admin_action_logs_action_type_idx ON public.admin_action_logs USING btree (action_type) |
| admin_action_logs_actor_email_idx | CREATE INDEX admin_action_logs_actor_email_idx ON public.admin_action_logs USING btree (lower(actor_email)) |
| admin_action_logs_created_at_idx | CREATE INDEX admin_action_logs_created_at_idx ON public.admin_action_logs USING btree (created_at DESC) |
| admin_action_logs_pkey | CREATE UNIQUE INDEX admin_action_logs_pkey ON public.admin_action_logs USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| service role manages admin action logs | ALL | {service_role} | true | true |
| super admins can read admin action logs | SELECT | {authenticated} | is_super_admin(auth.uid()) |  |

#### admin_users

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| username | text | text | NO |  |
| password_hash | text | text | NO |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| admin_users_pkey | CREATE UNIQUE INDEX admin_users_pkey ON public.admin_users USING btree (id) |
| admin_users_username_key | CREATE UNIQUE INDEX admin_users_username_key ON public.admin_users USING btree (username) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admin users are not accessible via RLS | ALL | {public} | false |  |

#### announcements

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| title | text | text | NO |  |
| body | text | text | YES |  |
| audience | text | text | NO | 'all'::text |
| company_id | uuid | uuid | YES |  |
| scheduled_at | timestamp with time zone | timestamptz | YES |  |
| is_active | boolean | bool | NO | true |
| created_by | uuid | uuid | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| announcements_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| announcements_company_id_idx | CREATE INDEX announcements_company_id_idx ON public.announcements USING btree (company_id) |
| announcements_pkey | CREATE UNIQUE INDEX announcements_pkey ON public.announcements USING btree (id) |
| announcements_scheduled_at_idx | CREATE INDEX announcements_scheduled_at_idx ON public.announcements USING btree (scheduled_at) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| service role manages announcements | ALL | {service_role} | true | true |
| super admins can read announcements | SELECT | {authenticated} | is_super_admin(auth.uid()) |  |

#### assessment_progress

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| user_id | uuid | uuid | NO |  |
| assessment_type | text | text | NO |  |
| attempt_number | integer | int4 | YES | 1 |
| results | jsonb | jsonb | YES |  |
| dominant_color | text | text | YES |  |
| scores | jsonb | jsonb | YES |  |
| created_at | timestamp with time zone | timestamptz | YES | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| assessment_progress_pkey | CREATE UNIQUE INDEX assessment_progress_pkey ON public.assessment_progress USING btree (id) |
| idx_assessment_progress_user_id | CREATE INDEX idx_assessment_progress_user_id ON public.assessment_progress USING btree (user_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Users can delete their own assessment progress | DELETE | {public} | (auth.uid() = user_id) |  |
| Users can insert their own assessment progress | INSERT | {public} |  | (auth.uid() = user_id) |
| Users can update their own assessment progress | UPDATE | {public} | (auth.uid() = user_id) | (auth.uid() = user_id) |
| Users can view their own assessment progress | SELECT | {public} | (auth.uid() = user_id) |  |

#### assessment_results

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| user_id | uuid | uuid | NO |  |
| assessment_type | text | text | NO |  |
| results | jsonb | jsonb | NO |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| shareable_code | text | text | NO | generate_shareable_code() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| assessment_results_pkey | CREATE UNIQUE INDEX assessment_results_pkey ON public.assessment_results USING btree (id) |
| assessment_results_shareable_code_key | CREATE UNIQUE INDEX assessment_results_shareable_code_key ON public.assessment_results USING btree (shareable_code) |
| assessment_results_user_id_assessment_type_key | CREATE UNIQUE INDEX assessment_results_user_id_assessment_type_key ON public.assessment_results USING btree (user_id, assessment_type) |
| idx_assessment_results_shareable_code | CREATE INDEX idx_assessment_results_shareable_code ON public.assessment_results USING btree (shareable_code) |
| idx_assessment_results_type | CREATE INDEX idx_assessment_results_type ON public.assessment_results USING btree (assessment_type) |
| idx_assessment_results_user_id | CREATE INDEX idx_assessment_results_user_id ON public.assessment_results USING btree (user_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Anyone can view results via shareable code | SELECT | {public} | (shareable_code IS NOT NULL) |  |
| Candidates can insert their own assessment results | INSERT | {public} |  | (EXISTS ( SELECT 1<br>   FROM candidates<br>  WHERE ((candidates.id = assessment_results.user_id) AND (candidates.invite_code IS NOT NULL)))) |
| Candidates can update their own assessment results | UPDATE | {public} | (EXISTS ( SELECT 1<br>   FROM candidates<br>  WHERE ((candidates.id = assessment_results.user_id) AND (candidates.invite_code IS NOT NULL)))) |  |
| Candidates can view their own assessment results | SELECT | {public} | (EXISTS ( SELECT 1<br>   FROM candidates<br>  WHERE ((candidates.id = assessment_results.user_id) AND (candidates.invite_code IS NOT NULL)))) |  |
| Users can create their own assessment results | INSERT | {public} |  | (auth.uid() = user_id) |
| Users can delete their own assessment results | DELETE | {public} | (auth.uid() = user_id) |  |
| Users can update their own assessment results | UPDATE | {public} | (auth.uid() = user_id) |  |
| Users can view their own assessment results | SELECT | {public} | (auth.uid() = user_id) |  |

#### ats_applications

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| org_id | uuid | uuid | NO |  |
| merge_id | text | text | NO |  |
| platform_name | text | text | NO |  |
| candidate_id | text | text | YES |  |
| job_id | text | text | YES |  |
| current_stage | text | text | YES |  |
| status | text | text | YES |  |
| raw_data | jsonb | jsonb | NO | '{}'::jsonb |
| last_synced_at | timestamp with time zone | timestamptz | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| is_active | boolean | bool | NO | true |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| ats_applications_org_id_fkey | org_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| ats_applications_org_id_idx | CREATE INDEX ats_applications_org_id_idx ON public.ats_applications USING btree (org_id, is_active) |
| ats_applications_org_merge_key | CREATE UNIQUE INDEX ats_applications_org_merge_key ON public.ats_applications USING btree (org_id, merge_id) |
| ats_applications_pkey | CREATE UNIQUE INDEX ats_applications_pkey ON public.ats_applications USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins and HR can view ats applications | SELECT | {public} | (org_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role]))))) |  |
| Service role can manage ats applications | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |  |

#### ats_candidates

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| org_id | uuid | uuid | NO |  |
| merge_id | text | text | NO |  |
| platform_name | text | text | NO |  |
| first_name | text | text | YES |  |
| last_name | text | text | YES |  |
| email | text | text | YES |  |
| phone | text | text | YES |  |
| raw_data | jsonb | jsonb | NO | '{}'::jsonb |
| last_synced_at | timestamp with time zone | timestamptz | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| is_active | boolean | bool | NO | true |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| ats_candidates_org_id_fkey | org_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| ats_candidates_email_idx | CREATE INDEX ats_candidates_email_idx ON public.ats_candidates USING btree (org_id, email) |
| ats_candidates_org_id_idx | CREATE INDEX ats_candidates_org_id_idx ON public.ats_candidates USING btree (org_id, is_active) |
| ats_candidates_org_merge_key | CREATE UNIQUE INDEX ats_candidates_org_merge_key ON public.ats_candidates USING btree (org_id, merge_id) |
| ats_candidates_pkey | CREATE UNIQUE INDEX ats_candidates_pkey ON public.ats_candidates USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins and HR can view ats candidates | SELECT | {public} | (org_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role]))))) |  |
| Service role can manage ats candidates | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |  |

#### ats_jobs

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| org_id | uuid | uuid | NO |  |
| merge_id | text | text | NO |  |
| platform_name | text | text | NO |  |
| title | text | text | YES |  |
| status | text | text | YES |  |
| departments | ARRAY | _text | NO | '{}'::text[] |
| offices | ARRAY | _text | NO | '{}'::text[] |
| raw_data | jsonb | jsonb | NO | '{}'::jsonb |
| last_synced_at | timestamp with time zone | timestamptz | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| is_active | boolean | bool | NO | true |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| ats_jobs_org_id_fkey | org_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| ats_jobs_org_id_idx | CREATE INDEX ats_jobs_org_id_idx ON public.ats_jobs USING btree (org_id, is_active) |
| ats_jobs_org_merge_key | CREATE UNIQUE INDEX ats_jobs_org_merge_key ON public.ats_jobs USING btree (org_id, merge_id) |
| ats_jobs_pkey | CREATE UNIQUE INDEX ats_jobs_pkey ON public.ats_jobs USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins and HR can view ats jobs | SELECT | {public} | (org_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role]))))) |  |
| Service role can manage ats jobs | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |  |

#### audit_logs

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| user_id | uuid | uuid | YES |  |
| user_email | text | text | YES |  |
| action | text | text | NO |  |
| entity_type | text | text | NO |  |
| entity_id | uuid | uuid | YES |  |
| details | jsonb | jsonb | YES | '{}'::jsonb |
| ip_address | text | text | YES |  |
| user_agent | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| audit_logs_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| audit_logs_pkey | CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id) |
| idx_audit_logs_company_id | CREATE INDEX idx_audit_logs_company_id ON public.audit_logs USING btree (company_id) |
| idx_audit_logs_created_at | CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins can view audit logs | SELECT | {public} | is_company_admin_for_company(auth.uid(), company_id) |  |
| Service role can insert audit logs | INSERT | {public} |  | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |

#### bamboohr_integrations

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| company_id | uuid | uuid | NO |  |
| company_domain | text | text | NO |  |
| access_token | text | text | NO |  |
| refresh_token | text | text | YES |  |
| token_expires_at | timestamp with time zone | timestamptz | YES |  |
| scope | text | text | YES |  |
| connected_by | uuid | uuid | YES |  |
| connected_at | timestamp with time zone | timestamptz | NO | now() |
| last_synced_at | timestamp with time zone | timestamptz | YES |  |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| auto_sync_enabled | boolean | bool | NO | false |
| auto_sync_interval_seconds | integer | int4 | NO | 3600 |
| last_auto_sync_at | timestamp with time zone | timestamptz | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| bamboohr_integrations_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| bamboohr_integrations_pkey | CREATE UNIQUE INDEX bamboohr_integrations_pkey ON public.bamboohr_integrations USING btree (company_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| NOT FOUND |  |  |  |  |

#### billing_credits

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| amount | numeric | numeric | NO |  |
| type | text | text | NO |  |
| description | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| created_by | uuid | uuid | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| billing_credits_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| billing_credits_pkey | CREATE UNIQUE INDEX billing_credits_pkey ON public.billing_credits USING btree (id) |
| idx_billing_credits_company_id | CREATE INDEX idx_billing_credits_company_id ON public.billing_credits USING btree (company_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins can view their billing credits | SELECT | {public} | (EXISTS ( SELECT 1<br>   FROM company_users<br>  WHERE ((company_users.company_id = billing_credits.company_id) AND (company_users.user_id = auth.uid()) AND (company_users.role = 'admin'::company_user_role) AND (company_users.status = 'active'::company_user_status)))) |  |
| Only system can insert billing credits | INSERT | {public} |  | false |

#### billing_transactions

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| company_user_id | uuid | uuid | YES |  |
| amount | numeric | numeric | NO |  |
| type | text | text | NO |  |
| description | text | text | YES |  |
| stripe_payment_intent_id | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| billing_period_id | uuid | uuid | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| billing_transactions_billing_period_id_fkey | billing_period_id | company_portal_billing_periods.id |
| billing_transactions_company_id_fkey | company_id | companies.id |
| billing_transactions_company_user_id_fkey | company_user_id | company_users.id |

Indexes:
| Index | Definition |
| --- | --- |
| billing_transactions_pkey | CREATE UNIQUE INDEX billing_transactions_pkey ON public.billing_transactions USING btree (id) |
| billing_transactions_stripe_payment_intent_id_key | CREATE UNIQUE INDEX billing_transactions_stripe_payment_intent_id_key ON public.billing_transactions USING btree (stripe_payment_intent_id) |
| idx_billing_transactions_billing_period_id | CREATE INDEX idx_billing_transactions_billing_period_id ON public.billing_transactions USING btree (billing_period_id) |
| idx_billing_transactions_company | CREATE INDEX idx_billing_transactions_company ON public.billing_transactions USING btree (company_id) |
| idx_billing_transactions_company_id | CREATE INDEX idx_billing_transactions_company_id ON public.billing_transactions USING btree (company_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins can view their billing transactions | SELECT | {public} | (EXISTS ( SELECT 1<br>   FROM company_users<br>  WHERE ((company_users.company_id = billing_transactions.company_id) AND (company_users.user_id = auth.uid()) AND (company_users.role = 'admin'::company_user_role) AND (company_users.status = 'active'::company_user_status)))) |  |
| Only system can insert billing transactions | INSERT | {public} |  | false |

#### blog_posts

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| title | text | text | NO |  |
| slug | text | text | NO |  |
| excerpt | text | text | YES |  |
| content | text | text | NO |  |
| featured_image | text | text | YES |  |
| author_id | uuid | uuid | NO |  |
| status | text | text | NO | 'draft'::text |
| published_at | timestamp with time zone | timestamptz | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| tags | ARRAY | _text | YES | '{}'::text[] |
| meta_description | text | text | YES |  |
| meta_keywords | ARRAY | _text | YES |  |
| author_name | text | text | YES |  |
| read_time | integer | int4 | YES | 5 |
| featured_image_alt | text | text | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| blog_posts_pkey | CREATE UNIQUE INDEX blog_posts_pkey ON public.blog_posts USING btree (id) |
| blog_posts_slug_key | CREATE UNIQUE INDEX blog_posts_slug_key ON public.blog_posts USING btree (slug) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins and bloggers can create blog posts | INSERT | {authenticated} |  | (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'blogger'::app_role)) |
| Admins and post authors can update their posts | UPDATE | {authenticated} | (is_admin(auth.uid()) OR ((auth.uid() = author_id) AND has_role(auth.uid(), 'blogger'::app_role))) |  |
| Admins can delete blog posts | DELETE | {authenticated} | is_admin(auth.uid()) |  |
| Anyone can view published blog posts | SELECT | {public} | (status = 'published'::text) |  |

#### calendar_events

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| interview_id | uuid | uuid | YES |  |
| external_event_id | text | text | YES |  |
| calendar_integration_id | uuid | uuid | YES |  |
| title | text | text | NO |  |
| description | text | text | YES |  |
| start_time | timestamp with time zone | timestamptz | NO |  |
| end_time | timestamp with time zone | timestamptz | NO |  |
| location | text | text | YES |  |
| meeting_link | text | text | YES |  |
| last_synced_at | timestamp with time zone | timestamptz | YES |  |
| sync_error | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| calendar_events_calendar_integration_id_fkey | calendar_integration_id | calendar_integrations.id |
| calendar_events_company_id_fkey | company_id | companies.id |
| calendar_events_interview_id_fkey | interview_id | interviews.id |

Indexes:
| Index | Definition |
| --- | --- |
| calendar_events_pkey | CREATE UNIQUE INDEX calendar_events_pkey ON public.calendar_events USING btree (id) |
| idx_calendar_events_interview | CREATE INDEX idx_calendar_events_interview ON public.calendar_events USING btree (interview_id) |
| idx_calendar_events_time | CREATE INDEX idx_calendar_events_time ON public.calendar_events USING btree (start_time) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company users can view calendar events | ALL | {public} | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE (company_users.user_id = auth.uid()))) |  |

#### calendar_integrations

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| user_id | uuid | uuid | NO |  |
| provider | text | text | NO |  |
| access_token | text | text | YES |  |
| refresh_token | text | text | YES |  |
| token_expires_at | timestamp with time zone | timestamptz | YES |  |
| calendar_id | text | text | YES |  |
| is_connected | boolean | bool | YES | false |
| last_synced_at | timestamp with time zone | timestamptz | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| calendar_integrations_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| calendar_integrations_pkey | CREATE UNIQUE INDEX calendar_integrations_pkey ON public.calendar_integrations USING btree (id) |
| calendar_integrations_user_id_provider_key | CREATE UNIQUE INDEX calendar_integrations_user_id_provider_key ON public.calendar_integrations USING btree (user_id, provider) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Users can manage own calendar integrations | ALL | {public} | (user_id = auth.uid()) |  |

#### candidate_activities

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| candidate_id | uuid | uuid | NO |  |
| application_id | uuid | uuid | YES |  |
| job_posting_id | uuid | uuid | YES |  |
| activity_type | text | text | NO |  |
| title | text | text | NO |  |
| description | text | text | YES |  |
| metadata | jsonb | jsonb | YES | '{}'::jsonb |
| performed_by | uuid | uuid | YES |  |
| performed_by_name | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| candidate_activities_application_id_fkey | application_id | candidate_applications.id |
| candidate_activities_candidate_id_fkey | candidate_id | candidates.id |
| candidate_activities_company_id_fkey | company_id | companies.id |
| candidate_activities_job_posting_id_fkey | job_posting_id | job_postings.id |

Indexes:
| Index | Definition |
| --- | --- |
| candidate_activities_pkey | CREATE UNIQUE INDEX candidate_activities_pkey ON public.candidate_activities USING btree (id) |
| idx_candidate_activities_application | CREATE INDEX idx_candidate_activities_application ON public.candidate_activities USING btree (application_id, created_at DESC) |
| idx_candidate_activities_candidate | CREATE INDEX idx_candidate_activities_candidate ON public.candidate_activities USING btree (candidate_id, created_at DESC) |
| idx_candidate_activities_company | CREATE INDEX idx_candidate_activities_company ON public.candidate_activities USING btree (company_id, created_at DESC) |
| idx_candidate_activities_type | CREATE INDEX idx_candidate_activities_type ON public.candidate_activities USING btree (activity_type) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company users can create activities | INSERT | {public} |  | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE (company_users.user_id = auth.uid()))) |
| Company users can view activities | SELECT | {public} | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE (company_users.user_id = auth.uid()))) |  |

#### candidate_application_links

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| position_title | text | text | NO |  |
| ideal_role_color | text | text | YES |  |
| required_skills | ARRAY | _text | YES | '{}'::text[] |
| assessment_category | text | text | YES | 'professional'::text |
| assessment_type | text | text | YES | '25q'::text |
| link_code | text | text | YES | generate_invite_code() |
| is_active | boolean | bool | YES | true |
| max_applications | integer | int4 | YES |  |
| applications_count | integer | int4 | YES | 0 |
| expires_at | timestamp with time zone | timestamptz | YES |  |
| created_at | timestamp with time zone | timestamptz | YES | now() |
| created_by | uuid | uuid | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| candidate_application_links_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| candidate_application_links_link_code_key | CREATE UNIQUE INDEX candidate_application_links_link_code_key ON public.candidate_application_links USING btree (link_code) |
| candidate_application_links_pkey | CREATE UNIQUE INDEX candidate_application_links_pkey ON public.candidate_application_links USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Anyone can view active links by code | SELECT | {public} | (is_active = true) |  |
| Company admins can manage their application links | ALL | {public} | is_company_admin_for_company(auth.uid(), company_id) |  |

#### candidate_applications

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| candidate_id | uuid | uuid | NO |  |
| job_posting_id | uuid | uuid | NO |  |
| current_stage_id | uuid | uuid | YES |  |
| applied_at | timestamp with time zone | timestamptz | YES | now() |
| stage_entered_at | timestamp with time zone | timestamptz | YES | now() |
| source | text | text | YES |  |
| referrer_id | uuid | uuid | YES |  |
| application_link_id | uuid | uuid | YES |  |
| rejection_reason | text | text | YES |  |
| rejected_at | timestamp with time zone | timestamptz | YES |  |
| withdrawn_at | timestamp with time zone | timestamptz | YES |  |
| hired_at | timestamp with time zone | timestamptz | YES |  |
| internal_notes | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | YES | now() |
| updated_at | timestamp with time zone | timestamptz | YES | now() |
| external_source | text | text | YES |  |
| external_id | text | text | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| candidate_applications_application_link_id_fkey | application_link_id | candidate_application_links.id |
| candidate_applications_candidate_id_fkey | candidate_id | candidates.id |
| candidate_applications_current_stage_id_fkey | current_stage_id | hiring_pipeline_stages.id |
| candidate_applications_job_posting_id_fkey | job_posting_id | job_postings.id |
| candidate_applications_referrer_id_fkey | referrer_id | company_users.id |

Indexes:
| Index | Definition |
| --- | --- |
| candidate_applications_candidate_id_job_posting_id_key | CREATE UNIQUE INDEX candidate_applications_candidate_id_job_posting_id_key ON public.candidate_applications USING btree (candidate_id, job_posting_id) |
| candidate_applications_pkey | CREATE UNIQUE INDEX candidate_applications_pkey ON public.candidate_applications USING btree (id) |
| idx_applications_applied_at | CREATE INDEX idx_applications_applied_at ON public.candidate_applications USING btree (applied_at DESC) |
| idx_applications_candidate | CREATE INDEX idx_applications_candidate ON public.candidate_applications USING btree (candidate_id) |
| idx_applications_job | CREATE INDEX idx_applications_job ON public.candidate_applications USING btree (job_posting_id) |
| idx_applications_stage | CREATE INDEX idx_applications_stage ON public.candidate_applications USING btree (current_stage_id) |
| idx_candidate_applications_external_source_id | CREATE UNIQUE INDEX idx_candidate_applications_external_source_id ON public.candidate_applications USING btree (job_posting_id, external_source, external_id) WHERE ((external_source IS NOT NULL) AND (external_id IS NOT NULL)) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins and HR can manage applications | ALL | {public} | (job_posting_id IN ( SELECT jp.id<br>   FROM (job_postings jp<br>     JOIN company_users cu ON ((cu.company_id = jp.company_id)))<br>  WHERE ((cu.user_id = auth.uid()) AND (cu.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role]))))) |  |
| Hiring team can update applications | UPDATE | {public} | (job_posting_id IN ( SELECT htm.job_posting_id<br>   FROM (hiring_team_members htm<br>     JOIN company_users cu ON ((cu.id = htm.user_id)))<br>  WHERE (cu.user_id = auth.uid()))) |  |
| Users can view applications in their company | SELECT | {public} | (job_posting_id IN ( SELECT jp.id<br>   FROM (job_postings jp<br>     JOIN company_users cu ON ((cu.company_id = jp.company_id)))<br>  WHERE (cu.user_id = auth.uid()))) |  |

#### candidate_documents

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| candidate_id | uuid | uuid | NO |  |
| application_id | uuid | uuid | YES |  |
| document_type | text | text | NO |  |
| file_name | text | text | NO |  |
| file_url | text | text | NO |  |
| file_size | integer | int4 | YES |  |
| mime_type | text | text | YES |  |
| extracted_text | text | text | YES |  |
| extracted_skills | jsonb | jsonb | YES | '[]'::jsonb |
| extracted_experience | jsonb | jsonb | YES | '[]'::jsonb |
| uploaded_at | timestamp with time zone | timestamptz | NO | now() |
| uploaded_by | uuid | uuid | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| candidate_documents_application_id_fkey | application_id | candidate_applications.id |
| candidate_documents_candidate_id_fkey | candidate_id | candidates.id |
| candidate_documents_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| candidate_documents_pkey | CREATE UNIQUE INDEX candidate_documents_pkey ON public.candidate_documents USING btree (id) |
| idx_candidate_documents_candidate | CREATE INDEX idx_candidate_documents_candidate ON public.candidate_documents USING btree (candidate_id) |
| idx_candidate_documents_search | CREATE INDEX idx_candidate_documents_search ON public.candidate_documents USING gin (to_tsvector('english'::regconfig, COALESCE(extracted_text, ''::text))) |
| idx_candidate_documents_type | CREATE INDEX idx_candidate_documents_type ON public.candidate_documents USING btree (document_type) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company users can manage documents | ALL | {public} | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE (company_users.user_id = auth.uid()))) |  |

#### candidate_notes

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| candidate_id | uuid | uuid | NO |  |
| application_id | uuid | uuid | YES |  |
| content | text | text | NO |  |
| is_private | boolean | bool | YES | false |
| is_pinned | boolean | bool | YES | false |
| created_by | uuid | uuid | YES |  |
| created_by_name | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| candidate_notes_application_id_fkey | application_id | candidate_applications.id |
| candidate_notes_candidate_id_fkey | candidate_id | candidates.id |
| candidate_notes_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| candidate_notes_pkey | CREATE UNIQUE INDEX candidate_notes_pkey ON public.candidate_notes USING btree (id) |
| idx_candidate_notes_application | CREATE INDEX idx_candidate_notes_application ON public.candidate_notes USING btree (application_id, created_at DESC) |
| idx_candidate_notes_candidate | CREATE INDEX idx_candidate_notes_candidate ON public.candidate_notes USING btree (candidate_id, created_at DESC) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company users can manage notes | ALL | {public} | ((company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE (company_users.user_id = auth.uid()))) AND ((is_private = false) OR (created_by = auth.uid()))) |  |

#### candidate_ratings

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| candidate_id | uuid | uuid | NO |  |
| application_id | uuid | uuid | YES |  |
| interview_id | uuid | uuid | YES |  |
| overall_rating | integer | int4 | YES |  |
| technical_skills | integer | int4 | YES |  |
| communication | integer | int4 | YES |  |
| culture_fit | integer | int4 | YES |  |
| experience | integer | int4 | YES |  |
| custom_ratings | jsonb | jsonb | YES | '{}'::jsonb |
| strengths | text | text | YES |  |
| weaknesses | text | text | YES |  |
| recommendation | text | text | YES |  |
| comments | text | text | YES |  |
| rated_by | uuid | uuid | YES |  |
| rated_by_name | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| candidate_ratings_application_id_fkey | application_id | candidate_applications.id |
| candidate_ratings_candidate_id_fkey | candidate_id | candidates.id |
| candidate_ratings_company_id_fkey | company_id | companies.id |
| candidate_ratings_interview_id_fkey | interview_id | interviews.id |

Indexes:
| Index | Definition |
| --- | --- |
| candidate_ratings_pkey | CREATE UNIQUE INDEX candidate_ratings_pkey ON public.candidate_ratings USING btree (id) |
| idx_candidate_ratings_application | CREATE INDEX idx_candidate_ratings_application ON public.candidate_ratings USING btree (application_id) |
| idx_candidate_ratings_candidate | CREATE INDEX idx_candidate_ratings_candidate ON public.candidate_ratings USING btree (candidate_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company users can manage ratings | ALL | {public} | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE (company_users.user_id = auth.uid()))) |  |

#### candidate_tag_assignments

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| candidate_id | uuid | uuid | NO |  |
| tag_id | uuid | uuid | NO |  |
| assigned_by | uuid | uuid | YES |  |
| assigned_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| candidate_tag_assignments_candidate_id_fkey | candidate_id | candidates.id |
| candidate_tag_assignments_tag_id_fkey | tag_id | candidate_tags.id |

Indexes:
| Index | Definition |
| --- | --- |
| candidate_tag_assignments_candidate_id_tag_id_key | CREATE UNIQUE INDEX candidate_tag_assignments_candidate_id_tag_id_key ON public.candidate_tag_assignments USING btree (candidate_id, tag_id) |
| candidate_tag_assignments_pkey | CREATE UNIQUE INDEX candidate_tag_assignments_pkey ON public.candidate_tag_assignments USING btree (id) |
| idx_candidate_tag_assignments_candidate | CREATE INDEX idx_candidate_tag_assignments_candidate ON public.candidate_tag_assignments USING btree (candidate_id) |
| idx_candidate_tag_assignments_tag | CREATE INDEX idx_candidate_tag_assignments_tag ON public.candidate_tag_assignments USING btree (tag_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company users can manage tag assignments | ALL | {public} | (tag_id IN ( SELECT candidate_tags.id<br>   FROM candidate_tags<br>  WHERE (candidate_tags.company_id IN ( SELECT company_users.company_id<br>           FROM company_users<br>          WHERE (company_users.user_id = auth.uid()))))) |  |

#### candidate_tags

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| name | text | text | NO |  |
| color | text | text | YES | '#6366f1'::text |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| candidate_tags_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| candidate_tags_company_id_name_key | CREATE UNIQUE INDEX candidate_tags_company_id_name_key ON public.candidate_tags USING btree (company_id, name) |
| candidate_tags_pkey | CREATE UNIQUE INDEX candidate_tags_pkey ON public.candidate_tags USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company users can manage tags | ALL | {public} | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE (company_users.user_id = auth.uid()))) |  |

#### candidates

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| email | text | text | NO |  |
| full_name | text | text | YES |  |
| phone | text | text | YES |  |
| position_title | text | text | YES |  |
| ideal_role_color | text | text | YES |  |
| required_skills | ARRAY | _text | YES | '{}'::text[] |
| notes | text | text | YES |  |
| source | text | text | YES | 'invite'::text |
| status | USER-DEFINED | candidate_status | NO | 'invited'::candidate_status |
| invite_code | text | text | YES | generate_invite_code() |
| public_token | text | text | YES |  |
| assessment_category | text | text | YES |  |
| assessment_type | text | text | YES |  |
| assessment_result_id | uuid | uuid | YES |  |
| assessment_completed_at | timestamp with time zone | timestamptz | YES |  |
| fit_score | numeric | numeric | YES |  |
| fit_analysis | jsonb | jsonb | YES |  |
| fit_analyzed_at | timestamp with time zone | timestamptz | YES |  |
| converted_to_employee_id | uuid | uuid | YES |  |
| archived_at | timestamp with time zone | timestamptz | YES |  |
| archived_reason | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | YES | now() |
| updated_at | timestamp with time zone | timestamptz | YES | now() |
| created_by | uuid | uuid | YES |  |
| resume_url | text | text | YES |  |
| resume_parsed_content | text | text | YES |  |
| job_posting_id | uuid | uuid | YES |  |
| external_source | text | text | YES |  |
| external_id | text | text | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| candidates_assessment_result_id_fkey | assessment_result_id | assessment_results.id |
| candidates_company_id_fkey | company_id | companies.id |
| candidates_converted_to_employee_id_fkey | converted_to_employee_id | company_users.id |
| candidates_job_posting_id_fkey | job_posting_id | job_postings.id |

Indexes:
| Index | Definition |
| --- | --- |
| candidates_company_id_email_key | CREATE UNIQUE INDEX candidates_company_id_email_key ON public.candidates USING btree (company_id, email) |
| candidates_pkey | CREATE UNIQUE INDEX candidates_pkey ON public.candidates USING btree (id) |
| candidates_public_token_key | CREATE UNIQUE INDEX candidates_public_token_key ON public.candidates USING btree (public_token) |
| idx_candidates_external_source_id | CREATE UNIQUE INDEX idx_candidates_external_source_id ON public.candidates USING btree (company_id, external_source, external_id) WHERE ((external_source IS NOT NULL) AND (external_id IS NOT NULL)) |
| idx_candidates_job_posting | CREATE INDEX idx_candidates_job_posting ON public.candidates USING btree (job_posting_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins can manage their candidates | ALL | {public} | is_company_admin_for_company(auth.uid(), company_id) |  |
| Public can read candidates by invite code | SELECT | {public} | (invite_code IS NOT NULL) |  |
| Public can update candidate status by invite code | UPDATE | {public} | (invite_code IS NOT NULL) | (invite_code IS NOT NULL) |
| Service role can manage candidates | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |  |

#### career_page_settings

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| is_enabled | boolean | bool | YES | true |
| slug | text | text | YES |  |
| hero_title | text | text | YES | 'Join Our Team'::text |
| hero_subtitle | text | text | YES | 'Explore exciting career opportunities'::text |
| hero_image_url | text | text | YES |  |
| about_company | text | text | YES |  |
| benefits_list | jsonb | jsonb | YES | '[]'::jsonb |
| contact_email | text | text | YES |  |
| meta_title | text | text | YES |  |
| meta_description | text | text | YES |  |
| linkedin_url | text | text | YES |  |
| twitter_url | text | text | YES |  |
| glassdoor_url | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| career_page_settings_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| career_page_settings_company_id_key | CREATE UNIQUE INDEX career_page_settings_company_id_key ON public.career_page_settings USING btree (company_id) |
| career_page_settings_pkey | CREATE UNIQUE INDEX career_page_settings_pkey ON public.career_page_settings USING btree (id) |
| career_page_settings_slug_key | CREATE UNIQUE INDEX career_page_settings_slug_key ON public.career_page_settings USING btree (slug) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company users can manage career page | ALL | {public} | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE (company_users.user_id = auth.uid()))) |  |
| Public can view enabled career pages | SELECT | {public} | (is_enabled = true) |  |

#### chatgpt_connections

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| user_id | uuid | uuid | YES |  |
| connected_by_user_id | uuid | uuid | YES |  |
| org_id | uuid | uuid | YES |  |
| connection_type | text | text | NO |  |
| openai_user_id | text | text | YES |  |
| access_token | text | text | NO | ''::text |
| access_token_hash | text | text | NO | ''::text |
| refresh_token | text | text | YES |  |
| refresh_token_hash | text | text | YES |  |
| token_expires_at | timestamp with time zone | timestamptz | YES |  |
| scopes_granted | ARRAY | _text | NO | '{}'::text[] |
| enabled_tools | ARRAY | _text | NO | '{}'::text[] |
| auto_inject_context | boolean | bool | NO | true |
| share_profile | boolean | bool | NO | true |
| include_teammates | boolean | bool | NO | false |
| last_sync_at | timestamp with time zone | timestamptz | YES |  |
| is_active | boolean | bool | NO | true |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| chatgpt_connections_org_id_fkey | org_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| chatgpt_connections_access_token_hash_idx | CREATE UNIQUE INDEX chatgpt_connections_access_token_hash_idx ON public.chatgpt_connections USING btree (access_token_hash) WHERE (access_token_hash <> ''::text) |
| chatgpt_connections_active_b2b_idx | CREATE UNIQUE INDEX chatgpt_connections_active_b2b_idx ON public.chatgpt_connections USING btree (org_id, connection_type) WHERE ((connection_type = 'b2b'::text) AND (is_active = true)) |
| chatgpt_connections_active_org_idx | CREATE INDEX chatgpt_connections_active_org_idx ON public.chatgpt_connections USING btree (org_id, is_active, updated_at DESC) |
| chatgpt_connections_active_personal_idx | CREATE UNIQUE INDEX chatgpt_connections_active_personal_idx ON public.chatgpt_connections USING btree (user_id, connection_type) WHERE ((connection_type = 'personal'::text) AND (is_active = true)) |
| chatgpt_connections_active_user_idx | CREATE INDEX chatgpt_connections_active_user_idx ON public.chatgpt_connections USING btree (user_id, is_active, updated_at DESC) |
| chatgpt_connections_pkey | CREATE UNIQUE INDEX chatgpt_connections_pkey ON public.chatgpt_connections USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Service role manages chatgpt connections | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |

#### chatgpt_oauth_states

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| state_token | text | text | NO |  |
| connection_type | text | text | NO |  |
| user_id | uuid | uuid | YES |  |
| connected_by_user_id | uuid | uuid | YES |  |
| org_id | uuid | uuid | YES |  |
| requested_scopes | ARRAY | _text | NO | '{}'::text[] |
| redirect_uri | text | text | YES |  |
| resource | text | text | YES |  |
| client_id | text | text | YES |  |
| code | text | text | YES |  |
| status | text | text | NO | 'pending'::text |
| expires_at | timestamp with time zone | timestamptz | NO | (now() + '00:15:00'::interval) |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| chatgpt_oauth_states_org_id_fkey | org_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| chatgpt_oauth_states_pkey | CREATE UNIQUE INDEX chatgpt_oauth_states_pkey ON public.chatgpt_oauth_states USING btree (id) |
| chatgpt_oauth_states_state_token_key | CREATE UNIQUE INDEX chatgpt_oauth_states_state_token_key ON public.chatgpt_oauth_states USING btree (state_token) |
| chatgpt_oauth_states_status_idx | CREATE INDEX chatgpt_oauth_states_status_idx ON public.chatgpt_oauth_states USING btree (status, expires_at DESC) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Service role manages chatgpt oauth states | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |

#### chatgpt_tool_calls

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| connection_id | uuid | uuid | NO |  |
| tool_name | text | text | NO |  |
| input_params | jsonb | jsonb | NO | '{}'::jsonb |
| response_summary | text | text | YES |  |
| latency_ms | integer | int4 | YES |  |
| is_error | boolean | bool | NO | false |
| error_message | text | text | YES |  |
| occurred_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| chatgpt_tool_calls_connection_id_fkey | connection_id | chatgpt_connections.id |

Indexes:
| Index | Definition |
| --- | --- |
| chatgpt_tool_calls_connection_time_idx | CREATE INDEX chatgpt_tool_calls_connection_time_idx ON public.chatgpt_tool_calls USING btree (connection_id, occurred_at DESC) |
| chatgpt_tool_calls_error_idx | CREATE INDEX chatgpt_tool_calls_error_idx ON public.chatgpt_tool_calls USING btree (connection_id, is_error, occurred_at DESC) |
| chatgpt_tool_calls_pkey | CREATE UNIQUE INDEX chatgpt_tool_calls_pkey ON public.chatgpt_tool_calls USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Service role manages chatgpt tool calls | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |

#### class_enrollments

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| class_id | uuid | uuid | NO |  |
| student_id | uuid | uuid | NO |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| class_enrollments_class_id_fkey | class_id | school_classes.id |
| class_enrollments_student_id_fkey | student_id | school_students.id |

Indexes:
| Index | Definition |
| --- | --- |
| class_enrollments_class_id_student_id_key | CREATE UNIQUE INDEX class_enrollments_class_id_student_id_key ON public.class_enrollments USING btree (class_id, student_id) |
| class_enrollments_pkey | CREATE UNIQUE INDEX class_enrollments_pkey ON public.class_enrollments USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| admins_manage_enrollments | ALL | {authenticated} | (EXISTS ( SELECT 1<br>   FROM school_classes sc<br>  WHERE ((sc.id = class_enrollments.class_id) AND (sc.school_id IN ( SELECT school_admins.school_id<br>           FROM school_admins<br>          WHERE (school_admins.user_id = auth.uid())))))) |  |
| super_admins_enrollments | ALL | {authenticated} | has_role(auth.uid(), 'admin'::app_role) |  |
| teachers_manage_enrollments | ALL | {authenticated} | (EXISTS ( SELECT 1<br>   FROM school_classes sc<br>  WHERE ((sc.id = class_enrollments.class_id) AND (sc.school_id IN ( SELECT school_teachers.school_id<br>           FROM school_teachers<br>          WHERE (school_teachers.user_id = auth.uid())))))) |  |
| teachers_read_enrollments | SELECT | {authenticated} | (EXISTS ( SELECT 1<br>   FROM school_classes sc<br>  WHERE ((sc.id = class_enrollments.class_id) AND (sc.school_id IN ( SELECT school_teachers.school_id<br>           FROM school_teachers<br>          WHERE (school_teachers.user_id = auth.uid())))))) |  |

#### client_proposals

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| proposal_id | text | text | NO |  |
| slug | text | text | NO |  |
| proposal_title | text | text | NO |  |
| company_name | text | text | NO |  |
| submitted_by | text | text | NO | 'Kody Krueger, Head of Sales'::text |
| background_image_url | text | text | NO | 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80'::text |
| pricing | jsonb | jsonb | NO | '{}'::jsonb |
| closing_text | text | text | NO | ''::text |
| status | text | text | NO | 'draft'::text |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| version | integer | int4 | NO | 1 |
| parent_proposal_id | uuid | uuid | YES |  |
| linked_company_id | uuid | uuid | YES |  |
| viewed_at | timestamp with time zone | timestamptz | YES |  |
| accepted_at | timestamp with time zone | timestamptz | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| client_proposals_linked_company_id_fkey | linked_company_id | companies.id |
| client_proposals_parent_proposal_id_fkey | parent_proposal_id | client_proposals.id |

Indexes:
| Index | Definition |
| --- | --- |
| client_proposals_family_version_key | CREATE UNIQUE INDEX client_proposals_family_version_key ON public.client_proposals USING btree (COALESCE(parent_proposal_id, id), version) |
| client_proposals_linked_company_id_idx | CREATE INDEX client_proposals_linked_company_id_idx ON public.client_proposals USING btree (linked_company_id) |
| client_proposals_parent_proposal_id_idx | CREATE INDEX client_proposals_parent_proposal_id_idx ON public.client_proposals USING btree (parent_proposal_id) |
| client_proposals_pkey | CREATE UNIQUE INDEX client_proposals_pkey ON public.client_proposals USING btree (id) |
| client_proposals_root_slug_key | CREATE UNIQUE INDEX client_proposals_root_slug_key ON public.client_proposals USING btree (slug) WHERE (parent_proposal_id IS NULL) |
| client_proposals_slug_version_idx | CREATE INDEX client_proposals_slug_version_idx ON public.client_proposals USING btree (slug, version DESC, updated_at DESC) |
| idx_client_proposals_slug | CREATE INDEX idx_client_proposals_slug ON public.client_proposals USING btree (slug) |
| idx_client_proposals_status | CREATE INDEX idx_client_proposals_status ON public.client_proposals USING btree (status) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins can delete client proposals | DELETE | {authenticated} | ((EXISTS ( SELECT 1<br>   FROM user_roles<br>  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))) OR ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['sanjay@rolecolorfinder.com'::text, 'tristan@rolecolorfinder.com'::text]))) |  |
| Admins can insert client proposals | INSERT | {authenticated} |  | ((EXISTS ( SELECT 1<br>   FROM user_roles<br>  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))) OR ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['sanjay@rolecolorfinder.com'::text, 'tristan@rolecolorfinder.com'::text]))) |
| Admins can update client proposals | UPDATE | {authenticated} | ((EXISTS ( SELECT 1<br>   FROM user_roles<br>  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))) OR ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['sanjay@rolecolorfinder.com'::text, 'tristan@rolecolorfinder.com'::text]))) | ((EXISTS ( SELECT 1<br>   FROM user_roles<br>  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))) OR ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['sanjay@rolecolorfinder.com'::text, 'tristan@rolecolorfinder.com'::text]))) |
| Public can view client proposals | SELECT | {public} | true |  |

#### companies

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| name | text | text | NO |  |
| subdomain | text | text | NO |  |
| admin_email | text | text | NO |  |
| seats_purchased | integer | int4 | NO | 2 |
| assessment_type | USER-DEFINED | company_assessment_type | NO | '25q'::company_assessment_type |
| logo_url | text | text | YES |  |
| primary_color | text | text | YES | '#9b87f5'::text |
| secondary_color | text | text | YES | '#7E69AB'::text |
| google_sso_enabled | boolean | bool | YES | false |
| google_workspace_domain | text | text | YES |  |
| custom_domain | text | text | YES |  |
| custom_domain_enabled | boolean | bool | YES | false |
| created_at | timestamp with time zone | timestamptz | YES | now() |
| updated_at | timestamp with time zone | timestamptz | YES | now() |
| email_template_subject | text | text | YES |  |
| email_template_greeting | text | text | YES |  |
| email_template_body | text | text | YES |  |
| email_template_cta_text | text | text | YES |  |
| email_show_logo | boolean | bool | YES | true |
| credit_balance | numeric | numeric | NO | 0.00 |
| stripe_customer_id | text | text | YES |  |
| logo_url_dark | text | text | YES |  |
| subdomain_enabled | boolean | bool | YES | false |
| subdomain_status | text | text | YES | 'pending'::text |
| assessment_category | USER-DEFINED | company_assessment_category | NO | 'professional'::company_assessment_category |
| slack_channel_id | text | text | YES |  |
| slack_notifications_enabled | boolean | bool | YES | false |
| ms_teams_webhook_url | text | text | YES |  |
| ms_teams_notifications_enabled | boolean | bool | YES | false |
| slack_bot_token | text | text | YES |  |
| insight_usage_count | integer | int4 | YES | 0 |
| insight_usage_month | text | text | YES | ''::text |
| insight_credits | integer | int4 | YES | 0 |
| insights_paid_enabled | boolean | bool | YES | false |
| allow_pay_per_insight | boolean | bool | YES | false |
| hiring_subscription_enabled | boolean | bool | YES | false |
| hiring_subscription_status | text | text | YES |  |
| hiring_subscription_id | text | text | YES |  |
| hiring_subscription_current_period_end | timestamp with time zone | timestamptz | YES |  |
| hiring_subscription_cancel_at_period_end | boolean | bool | YES | false |
| hiring_ever_subscribed | boolean | bool | YES | false |
| portal_access_locked | boolean | bool | NO | false |
| portal_access_lock_reason | text | text | YES |  |
| portal_access_locked_at | timestamp with time zone | timestamptz | YES |  |
| portal_access_outstanding_balance | numeric | numeric | NO | 0.00 |
| portal_billing_anchor_at | timestamp with time zone | timestamptz | YES |  |
| portal_billing_next_renewal_at | timestamp with time zone | timestamptz | YES |  |
| hiring_commitment_block_cancel_until | timestamp with time zone | timestamptz | YES |  |
| b2b_trial_enabled | boolean | bool | NO | false |
| b2b_trial_starts_at | timestamp with time zone | timestamptz | YES |  |
| b2b_trial_ends_at | timestamp with time zone | timestamptz | YES |  |
| b2b_trial_user_limit | integer | int4 | NO | 10 |
| b2b_trial_converted_at | timestamp with time zone | timestamptz | YES |  |
| requires_post_setup_deployment_fee | boolean | bool | NO | false |
| deployment_fee_waived | boolean | bool | NO | false |
| deployment_fee_waived_at | timestamp with time zone | timestamptz | YES |  |
| deployment_fee_charged_at | timestamp with time zone | timestamptz | YES |  |
| deployment_fee_payment_intent_id | text | text | YES |  |
| plan_tier | text | text | NO | 'free'::text |
| archived_at | timestamp with time zone | timestamptz | YES |  |
| require_2fa | boolean | bool | NO | false |
| notes | text | text | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| companies_pkey | CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id) |
| companies_subdomain_key | CREATE UNIQUE INDEX companies_subdomain_key ON public.companies USING btree (subdomain) |
| companies_subdomain_unique | CREATE UNIQUE INDEX companies_subdomain_unique ON public.companies USING btree (subdomain) WHERE ((subdomain IS NOT NULL) AND (subdomain <> ''::text)) |
| idx_companies_slack_enabled | CREATE INDEX idx_companies_slack_enabled ON public.companies USING btree (slack_notifications_enabled) WHERE (slack_notifications_enabled = true) |
| idx_companies_subdomain | CREATE INDEX idx_companies_subdomain ON public.companies USING btree (subdomain) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Anyone can view companies by subdomain | SELECT | {public} | true |  |
| Company admins can update their company | UPDATE | {public} | (id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'admin'::company_user_role)))) |  |
| Company admins can view their company | SELECT | {public} | (id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'admin'::company_user_role)))) |  |
| Service role can manage companies | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |  |

#### company_api_keys

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| name | text | text | NO |  |
| key_hash | text | text | NO |  |
| key_prefix | text | text | NO |  |
| permissions | jsonb | jsonb | YES | '["read"]'::jsonb |
| last_used_at | timestamp with time zone | timestamptz | YES |  |
| expires_at | timestamp with time zone | timestamptz | YES |  |
| is_active | boolean | bool | NO | true |
| created_by | uuid | uuid | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| company_api_keys_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| company_api_keys_pkey | CREATE UNIQUE INDEX company_api_keys_pkey ON public.company_api_keys USING btree (id) |
| idx_company_api_keys_company_id | CREATE INDEX idx_company_api_keys_company_id ON public.company_api_keys USING btree (company_id) |
| idx_company_api_keys_key_prefix | CREATE INDEX idx_company_api_keys_key_prefix ON public.company_api_keys USING btree (key_prefix) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins can manage API keys | ALL | {public} | is_company_admin_for_company(auth.uid(), company_id) |  |

#### company_deletion_requests

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| requested_by | uuid | uuid | YES |  |
| token_hash | text | text | NO |  |
| expires_at | timestamp with time zone | timestamptz | NO |  |
| consumed_at | timestamp with time zone | timestamptz | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| company_deletion_requests_pkey | CREATE UNIQUE INDEX company_deletion_requests_pkey ON public.company_deletion_requests USING btree (id) |
| company_deletion_requests_token_hash_key | CREATE UNIQUE INDEX company_deletion_requests_token_hash_key ON public.company_deletion_requests USING btree (token_hash) |
| idx_company_deletion_requests_company_id | CREATE INDEX idx_company_deletion_requests_company_id ON public.company_deletion_requests USING btree (company_id) |
| idx_company_deletion_requests_expires_at | CREATE INDEX idx_company_deletion_requests_expires_at ON public.company_deletion_requests USING btree (expires_at) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| NOT FOUND |  |  |  |  |

#### company_portal_billing_periods

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| period_start | timestamp with time zone | timestamptz | NO |  |
| period_end | timestamp with time zone | timestamptz | NO |  |
| renewal_at | timestamp with time zone | timestamptz | NO |  |
| billed_user_count | integer | int4 | NO | 0 |
| total_amount | numeric | numeric | NO | 0.00 |
| credits_applied | numeric | numeric | NO | 0.00 |
| card_charged | numeric | numeric | NO | 0.00 |
| outstanding_balance | numeric | numeric | NO | 0.00 |
| status | text | text | NO | 'pending'::text |
| idempotency_key | text | text | NO |  |
| stripe_payment_intent_id | text | text | YES |  |
| failure_reason | text | text | YES |  |
| attempt_count | integer | int4 | NO | 0 |
| recovered_at | timestamp with time zone | timestamptz | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| company_portal_billing_periods_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| company_portal_billing_periods_company_period_key | CREATE UNIQUE INDEX company_portal_billing_periods_company_period_key ON public.company_portal_billing_periods USING btree (company_id, period_start, period_end) |
| company_portal_billing_periods_idempotency_key_key | CREATE UNIQUE INDEX company_portal_billing_periods_idempotency_key_key ON public.company_portal_billing_periods USING btree (idempotency_key) |
| company_portal_billing_periods_pkey | CREATE UNIQUE INDEX company_portal_billing_periods_pkey ON public.company_portal_billing_periods USING btree (id) |
| idx_company_portal_billing_periods_company_renewal | CREATE INDEX idx_company_portal_billing_periods_company_renewal ON public.company_portal_billing_periods USING btree (company_id, renewal_at DESC) |
| idx_company_portal_billing_periods_status | CREATE INDEX idx_company_portal_billing_periods_status ON public.company_portal_billing_periods USING btree (status, renewal_at) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company management can view portal billing periods | SELECT | {public} | (EXISTS ( SELECT 1<br>   FROM company_users<br>  WHERE ((company_users.company_id = company_portal_billing_periods.company_id) AND (company_users.user_id = auth.uid()) AND (company_users.status = 'active'::company_user_status) AND (company_users.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role, 'partner'::company_user_role]))))) |  |

#### company_roles

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| name | text | text | NO |  |
| description | text | text | YES |  |
| skills | ARRAY | _text | YES | '{}'::text[] |
| created_at | timestamp with time zone | timestamptz | YES | now() |
| updated_at | timestamp with time zone | timestamptz | YES | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| company_roles_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| company_roles_company_name_unique | CREATE UNIQUE INDEX company_roles_company_name_unique ON public.company_roles USING btree (company_id, name) |
| company_roles_pkey | CREATE UNIQUE INDEX company_roles_pkey ON public.company_roles USING btree (id) |
| idx_company_roles_company_id | CREATE INDEX idx_company_roles_company_id ON public.company_roles USING btree (company_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins can manage roles in their company | ALL | {public} | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role]))))) |  |
| Users can view roles in their company | SELECT | {public} | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE (company_users.user_id = auth.uid()))) |  |

#### company_users

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| user_id | uuid | uuid | YES |  |
| email | text | text | NO |  |
| role | USER-DEFINED | company_user_role | NO | 'employee'::company_user_role |
| status | USER-DEFINED | company_user_status | NO | 'invited'::company_user_status |
| invite_code | text | text | YES |  |
| invited_at | timestamp with time zone | timestamptz | YES | now() |
| joined_at | timestamp with time zone | timestamptz | YES |  |
| assessment_completed_at | timestamp with time zone | timestamptz | YES |  |
| assessment_result_id | uuid | uuid | YES |  |
| created_at | timestamp with time zone | timestamptz | YES | now() |
| updated_at | timestamp with time zone | timestamptz | YES | now() |
| invite_count | integer | int4 | NO | 1 |
| job_role | text | text | YES |  |
| skills | ARRAY | _text | YES | '{}'::text[] |
| charged_at | timestamp with time zone | timestamptz | YES |  |
| charge_amount | numeric | numeric | YES | 20.00 |
| full_name | text | text | YES |  |
| assessment_category | text | text | YES |  |
| assessment_type | text | text | YES |  |
| notify_task_completion | boolean | bool | YES | true |
| keyboard_shortcuts_enabled | boolean | bool | YES | true |
| assessment_history | jsonb | jsonb | YES | '[]'::jsonb |
| last_reassessed_at | timestamp with time zone | timestamptz | YES |  |
| job_description | text | text | YES |  |
| proration_last_adjusted_on | date | date | YES |  |
| slack_user_id | text | text | YES |  |
| slack_linked_at | timestamp with time zone | timestamptz | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| company_users_assessment_result_id_fkey | assessment_result_id | assessment_results.id |
| company_users_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| company_users_company_id_email_key | CREATE UNIQUE INDEX company_users_company_id_email_key ON public.company_users USING btree (company_id, email) |
| company_users_company_slack_user_idx | CREATE UNIQUE INDEX company_users_company_slack_user_idx ON public.company_users USING btree (company_id, slack_user_id) WHERE (slack_user_id IS NOT NULL) |
| company_users_invite_code_key | CREATE UNIQUE INDEX company_users_invite_code_key ON public.company_users USING btree (invite_code) |
| company_users_pkey | CREATE UNIQUE INDEX company_users_pkey ON public.company_users USING btree (id) |
| idx_company_users_charged_at | CREATE INDEX idx_company_users_charged_at ON public.company_users USING btree (charged_at) |
| idx_company_users_company_id | CREATE INDEX idx_company_users_company_id ON public.company_users USING btree (company_id) |
| idx_company_users_daily_proration | CREATE INDEX idx_company_users_daily_proration ON public.company_users USING btree (company_id, proration_last_adjusted_on) WHERE ((status <> 'revoked'::company_user_status) AND (charge_amount > (0)::numeric)) |
| idx_company_users_email | CREATE INDEX idx_company_users_email ON public.company_users USING btree (email) |
| idx_company_users_invite_code | CREATE INDEX idx_company_users_invite_code ON public.company_users USING btree (invite_code) |
| idx_company_users_job_description | CREATE INDEX idx_company_users_job_description ON public.company_users USING gin (to_tsvector('english'::regconfig, COALESCE(job_description, ''::text))) |
| idx_company_users_user_id | CREATE INDEX idx_company_users_user_id ON public.company_users USING btree (user_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins can manage users in their company | ALL | {public} | is_company_admin_for_company(auth.uid(), company_id) |  |
| Company admins can view all users in their company | SELECT | {public} | is_company_admin_for_company(auth.uid(), company_id) |  |
| Service role can manage company users | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |  |
| Users can claim unclaimed admin records | UPDATE | {authenticated} | ((user_id IS NULL) AND (role = 'admin'::company_user_role)) | ((user_id = auth.uid()) AND (role = 'admin'::company_user_role)) |
| Users can view their own company user record | SELECT | {public} | (user_id = auth.uid()) |  |

#### contact_queries

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| name | text | text | NO |  |
| email | text | text | NO |  |
| phone | text | text | YES |  |
| message | text | text | NO |  |
| source_page | text | text | NO | 'home'::text |
| status | text | text | NO | 'new'::text |
| submitted_by_user_id | uuid | uuid | YES |  |
| assigned_to | uuid | uuid | YES |  |
| replied_at | timestamp with time zone | timestamptz | YES |  |
| reply_status | text | text | NO | 'pending'::text |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| contact_queries_pkey | CREATE UNIQUE INDEX contact_queries_pkey ON public.contact_queries USING btree (id) |
| idx_contact_queries_created_at | CREATE INDEX idx_contact_queries_created_at ON public.contact_queries USING btree (created_at DESC) |
| idx_contact_queries_status | CREATE INDEX idx_contact_queries_status ON public.contact_queries USING btree (status) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Anyone can submit contact query | INSERT | {anon,authenticated} |  | ((char_length(TRIM(BOTH FROM name)) > 0) AND (char_length(TRIM(BOTH FROM email)) > 0) AND (char_length(TRIM(BOTH FROM message)) > 0)) |
| Super admins can read contact queries | SELECT | {authenticated} | (lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text)) = ANY (ARRAY['sanjay@rolecolorfinder.com'::text, 'tristan@rolecolorfinder.com'::text])) |  |
| Super admins can update contact query status | UPDATE | {authenticated} | (lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text)) = ANY (ARRAY['sanjay@rolecolorfinder.com'::text, 'tristan@rolecolorfinder.com'::text])) | (lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text)) = ANY (ARRAY['sanjay@rolecolorfinder.com'::text, 'tristan@rolecolorfinder.com'::text])) |

#### contact_replies

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| contact_query_id | uuid | uuid | NO |  |
| body | text | text | NO |  |
| sent_via | text | text | NO | 'draft'::text |
| sent_at | timestamp with time zone | timestamptz | YES |  |
| created_by | uuid | uuid | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| contact_replies_contact_query_id_fkey | contact_query_id | contact_queries.id |

Indexes:
| Index | Definition |
| --- | --- |
| contact_replies_contact_query_id_idx | CREATE INDEX contact_replies_contact_query_id_idx ON public.contact_replies USING btree (contact_query_id) |
| contact_replies_pkey | CREATE UNIQUE INDEX contact_replies_pkey ON public.contact_replies USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| service role manages contact replies | ALL | {service_role} | true | true |
| super admins can read contact replies | SELECT | {authenticated} | is_super_admin(auth.uid()) |  |

#### crm_activities

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| lead_id | uuid | uuid | NO |  |
| type | text | text | NO | 'task'::text |
| due_at | timestamp with time zone | timestamptz | NO | now() |
| completed_at | timestamp with time zone | timestamptz | YES |  |
| note | text | text | NO | ''::text |
| user_id | uuid | uuid | NO |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| crm_activities_lead_id_fkey | lead_id | crm_leads.id |

Indexes:
| Index | Definition |
| --- | --- |
| crm_activities_pkey | CREATE UNIQUE INDEX crm_activities_pkey ON public.crm_activities USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Users manage own activities | ALL | {authenticated} | (auth.uid() = user_id) | (auth.uid() = user_id) |

#### crm_companies

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| name | text | text | NO |  |
| domain | text | text | NO | ''::text |
| industry | text | text | NO | ''::text |
| size | text | text | NO | ''::text |
| user_id | uuid | uuid | NO |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| crm_companies_pkey | CREATE UNIQUE INDEX crm_companies_pkey ON public.crm_companies USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Users manage own companies | ALL | {authenticated} | (auth.uid() = user_id) | (auth.uid() = user_id) |

#### crm_contacts

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| first_name | text | text | NO |  |
| last_name | text | text | NO | ''::text |
| email | text | text | NO | ''::text |
| phone | text | text | NO | ''::text |
| title | text | text | NO | ''::text |
| company_id | uuid | uuid | YES |  |
| user_id | uuid | uuid | NO |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| crm_contacts_company_id_fkey | company_id | crm_companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| crm_contacts_pkey | CREATE UNIQUE INDEX crm_contacts_pkey ON public.crm_contacts USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Users manage own contacts | ALL | {authenticated} | (auth.uid() = user_id) | (auth.uid() = user_id) |

#### crm_leads

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| name | text | text | NO |  |
| source | text | text | NO | ''::text |
| stage_id | uuid | uuid | NO |  |
| priority | text | text | NO | 'medium'::text |
| owner_id | uuid | uuid | NO |  |
| company_id | uuid | uuid | YES |  |
| contact_id | uuid | uuid | YES |  |
| value | numeric | numeric | NO | 0 |
| notes | text | text | NO | ''::text |
| tag_ids | ARRAY | _uuid | NO | '{}'::uuid[] |
| user_id | uuid | uuid | NO |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| crm_leads_company_id_fkey | company_id | crm_companies.id |
| crm_leads_contact_id_fkey | contact_id | crm_contacts.id |
| crm_leads_stage_id_fkey | stage_id | crm_stages.id |

Indexes:
| Index | Definition |
| --- | --- |
| crm_leads_pkey | CREATE UNIQUE INDEX crm_leads_pkey ON public.crm_leads USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Users manage own leads | ALL | {authenticated} | (auth.uid() = user_id) | (auth.uid() = user_id) |

#### crm_stages

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| name | text | text | NO |  |
| color_hex | text | text | NO | '#6366f1'::text |
| order | integer | int4 | NO | 0 |
| probability | integer | int4 | NO | 0 |
| user_id | uuid | uuid | NO |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| crm_stages_pkey | CREATE UNIQUE INDEX crm_stages_pkey ON public.crm_stages USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Users manage own stages | ALL | {authenticated} | (auth.uid() = user_id) | (auth.uid() = user_id) |

#### crm_tags

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| name | text | text | NO |  |
| color_hex | text | text | NO | '#6366f1'::text |
| user_id | uuid | uuid | NO |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| crm_tags_pkey | CREATE UNIQUE INDEX crm_tags_pkey ON public.crm_tags USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Users manage own tags | ALL | {authenticated} | (auth.uid() = user_id) | (auth.uid() = user_id) |

#### email_campaign_recipients

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| campaign_id | uuid | uuid | NO |  |
| candidate_id | uuid | uuid | NO |  |
| application_id | uuid | uuid | YES |  |
| email | text | text | NO |  |
| name | text | text | YES |  |
| status | text | text | YES | 'pending'::text |
| sent_at | timestamp with time zone | timestamptz | YES |  |
| opened_at | timestamp with time zone | timestamptz | YES |  |
| clicked_at | timestamp with time zone | timestamptz | YES |  |
| error_message | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| email_campaign_recipients_application_id_fkey | application_id | candidate_applications.id |
| email_campaign_recipients_campaign_id_fkey | campaign_id | email_campaigns.id |
| email_campaign_recipients_candidate_id_fkey | candidate_id | candidates.id |

Indexes:
| Index | Definition |
| --- | --- |
| email_campaign_recipients_pkey | CREATE UNIQUE INDEX email_campaign_recipients_pkey ON public.email_campaign_recipients USING btree (id) |
| idx_email_campaign_recipients_campaign | CREATE INDEX idx_email_campaign_recipients_campaign ON public.email_campaign_recipients USING btree (campaign_id) |
| idx_email_campaign_recipients_candidate | CREATE INDEX idx_email_campaign_recipients_candidate ON public.email_campaign_recipients USING btree (candidate_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company users can view campaign recipients | ALL | {public} | (campaign_id IN ( SELECT email_campaigns.id<br>   FROM email_campaigns<br>  WHERE (email_campaigns.company_id IN ( SELECT company_users.company_id<br>           FROM company_users<br>          WHERE (company_users.user_id = auth.uid()))))) |  |

#### email_campaigns

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| name | text | text | NO |  |
| subject | text | text | NO |  |
| body_html | text | text | NO |  |
| body_text | text | text | YES |  |
| template_id | uuid | uuid | YES |  |
| target_job_id | uuid | uuid | YES |  |
| target_stage_id | uuid | uuid | YES |  |
| target_criteria | jsonb | jsonb | YES | '{}'::jsonb |
| status | text | text | YES | 'draft'::text |
| scheduled_at | timestamp with time zone | timestamptz | YES |  |
| sent_at | timestamp with time zone | timestamptz | YES |  |
| total_recipients | integer | int4 | YES | 0 |
| sent_count | integer | int4 | YES | 0 |
| opened_count | integer | int4 | YES | 0 |
| clicked_count | integer | int4 | YES | 0 |
| bounced_count | integer | int4 | YES | 0 |
| created_by | uuid | uuid | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| email_campaigns_company_id_fkey | company_id | companies.id |
| email_campaigns_target_job_id_fkey | target_job_id | job_postings.id |
| email_campaigns_target_stage_id_fkey | target_stage_id | hiring_pipeline_stages.id |
| email_campaigns_template_id_fkey | template_id | email_templates.id |

Indexes:
| Index | Definition |
| --- | --- |
| email_campaigns_pkey | CREATE UNIQUE INDEX email_campaigns_pkey ON public.email_campaigns USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company users can manage email campaigns | ALL | {public} | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE (company_users.user_id = auth.uid()))) |  |

#### email_signups

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| email | text | text | NO |  |
| source | text | text | NO |  |
| metadata | jsonb | jsonb | YES | '{}'::jsonb |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| email_signups_pkey | CREATE UNIQUE INDEX email_signups_pkey ON public.email_signups USING btree (id) |
| idx_email_signups_created_at | CREATE INDEX idx_email_signups_created_at ON public.email_signups USING btree (created_at) |
| idx_email_signups_email | CREATE INDEX idx_email_signups_email ON public.email_signups USING btree (email) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Anyone can insert email signups | INSERT | {public} |  | true |
| No public access to email signups | SELECT | {public} | false |  |

#### email_templates

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| template_type | USER-DEFINED | email_template_type | NO |  |
| name | text | text | NO |  |
| subject | text | text | NO |  |
| body_html | text | text | NO |  |
| body_text | text | text | YES |  |
| available_variables | ARRAY | _text | YES | '{}'::text[] |
| is_default | boolean | bool | YES | false |
| is_active | boolean | bool | YES | true |
| created_at | timestamp with time zone | timestamptz | YES | now() |
| updated_at | timestamp with time zone | timestamptz | YES | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| email_templates_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| email_templates_company_id_template_type_is_default_key | CREATE UNIQUE INDEX email_templates_company_id_template_type_is_default_key ON public.email_templates USING btree (company_id, template_type, is_default) |
| email_templates_pkey | CREATE UNIQUE INDEX email_templates_pkey ON public.email_templates USING btree (id) |
| idx_email_templates_company | CREATE INDEX idx_email_templates_company ON public.email_templates USING btree (company_id) |
| idx_email_templates_type | CREATE INDEX idx_email_templates_type ON public.email_templates USING btree (template_type) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins and HR can manage email templates | ALL | {public} | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role]))))) |  |
| Users can view email templates in their company | SELECT | {public} | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE (company_users.user_id = auth.uid()))) |  |

#### family_plan_members

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| owner_user_id | uuid | uuid | NO |  |
| member_email | text | text | NO |  |
| member_user_id | uuid | uuid | YES |  |
| status | text | text | YES | 'pending'::text |
| invited_at | timestamp with time zone | timestamptz | YES | now() |
| joined_at | timestamp with time zone | timestamptz | YES |  |
| created_at | timestamp with time zone | timestamptz | YES | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| family_plan_members_pkey | CREATE UNIQUE INDEX family_plan_members_pkey ON public.family_plan_members USING btree (id) |
| idx_family_plan_members_member | CREATE INDEX idx_family_plan_members_member ON public.family_plan_members USING btree (member_user_id) |
| idx_family_plan_members_owner | CREATE INDEX idx_family_plan_members_owner ON public.family_plan_members USING btree (owner_user_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Owners can delete family members | DELETE | {public} | (auth.uid() = owner_user_id) |  |
| Owners can insert family members | INSERT | {public} |  | (auth.uid() = owner_user_id) |
| Owners can update family members | UPDATE | {public} | (auth.uid() = owner_user_id) |  |
| Owners can view their family members | SELECT | {public} | ((auth.uid() = owner_user_id) OR (auth.uid() = member_user_id)) |  |

#### free_assessments

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| user_id | uuid | uuid | NO |  |
| assessment_type | text | text | NO |  |
| granted_by | uuid | uuid | NO |  |
| granted_at | timestamp with time zone | timestamptz | NO | now() |
| used | boolean | bool | YES | false |
| used_at | timestamp with time zone | timestamptz | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| free_assessments_pkey | CREATE UNIQUE INDEX free_assessments_pkey ON public.free_assessments USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins can manage free assessments | ALL | {authenticated} | is_admin(auth.uid()) | is_admin(auth.uid()) |
| Users can view their own free assessments | SELECT | {authenticated} | (auth.uid() = user_id) |  |

#### hiring_pipeline_stages

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| job_posting_id | uuid | uuid | NO |  |
| company_id | uuid | uuid | NO |  |
| name | text | text | NO |  |
| description | text | text | YES |  |
| stage_order | integer | int4 | NO | 0 |
| stage_type | USER-DEFINED | hiring_stage_type | NO | 'screening'::hiring_stage_type |
| is_rejection_stage | boolean | bool | YES | false |
| is_final_stage | boolean | bool | YES | false |
| color_code | text | text | YES | '#6B7280'::text |
| auto_send_email_template_id | uuid | uuid | YES |  |
| created_at | timestamp with time zone | timestamptz | YES | now() |
| updated_at | timestamp with time zone | timestamptz | YES | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| hiring_pipeline_stages_company_id_fkey | company_id | companies.id |
| hiring_pipeline_stages_job_posting_id_fkey | job_posting_id | job_postings.id |

Indexes:
| Index | Definition |
| --- | --- |
| hiring_pipeline_stages_job_posting_id_stage_order_key | CREATE UNIQUE INDEX hiring_pipeline_stages_job_posting_id_stage_order_key ON public.hiring_pipeline_stages USING btree (job_posting_id, stage_order) |
| hiring_pipeline_stages_pkey | CREATE UNIQUE INDEX hiring_pipeline_stages_pkey ON public.hiring_pipeline_stages USING btree (id) |
| idx_hiring_stages_job_posting | CREATE INDEX idx_hiring_stages_job_posting ON public.hiring_pipeline_stages USING btree (job_posting_id) |
| idx_hiring_stages_order | CREATE INDEX idx_hiring_stages_order ON public.hiring_pipeline_stages USING btree (job_posting_id, stage_order) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins and HR can manage hiring stages | ALL | {public} | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role]))))) |  |
| Users can view hiring stages in their company | SELECT | {public} | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE (company_users.user_id = auth.uid()))) |  |

#### hiring_subscription_request_locks

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| company_id | uuid | uuid | NO |  |
| request_id | text | text | NO |  |
| status | text | text | NO | 'processing'::text |
| started_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| expires_at | timestamp with time zone | timestamptz | NO |  |
| subscription_id | text | text | YES |  |
| payment_intent_id | text | text | YES |  |
| last_error | text | text | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| hiring_subscription_request_locks_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| hiring_subscription_request_locks_pkey | CREATE UNIQUE INDEX hiring_subscription_request_locks_pkey ON public.hiring_subscription_request_locks USING btree (company_id) |
| idx_hiring_subscription_request_locks_expires_at | CREATE INDEX idx_hiring_subscription_request_locks_expires_at ON public.hiring_subscription_request_locks USING btree (expires_at) |
| idx_hiring_subscription_request_locks_request_id | CREATE INDEX idx_hiring_subscription_request_locks_request_id ON public.hiring_subscription_request_locks USING btree (request_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| NOT FOUND |  |  |  |  |

#### hiring_team_members

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| job_posting_id | uuid | uuid | NO |  |
| user_id | uuid | uuid | NO |  |
| team_role | text | text | NO | 'interviewer'::text |
| added_at | timestamp with time zone | timestamptz | YES | now() |
| added_by | uuid | uuid | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| hiring_team_members_added_by_fkey | added_by | company_users.id |
| hiring_team_members_job_posting_id_fkey | job_posting_id | job_postings.id |
| hiring_team_members_user_id_fkey | user_id | company_users.id |

Indexes:
| Index | Definition |
| --- | --- |
| hiring_team_members_job_posting_id_user_id_key | CREATE UNIQUE INDEX hiring_team_members_job_posting_id_user_id_key ON public.hiring_team_members USING btree (job_posting_id, user_id) |
| hiring_team_members_pkey | CREATE UNIQUE INDEX hiring_team_members_pkey ON public.hiring_team_members USING btree (id) |
| idx_hiring_team_job | CREATE INDEX idx_hiring_team_job ON public.hiring_team_members USING btree (job_posting_id) |
| idx_hiring_team_user | CREATE INDEX idx_hiring_team_user ON public.hiring_team_members USING btree (user_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins and HR can manage hiring team | ALL | {public} | (job_posting_id IN ( SELECT jp.id<br>   FROM (job_postings jp<br>     JOIN company_users cu ON ((cu.company_id = jp.company_id)))<br>  WHERE ((cu.user_id = auth.uid()) AND (cu.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role]))))) |  |
| Users can view hiring team in their company | SELECT | {public} | (job_posting_id IN ( SELECT jp.id<br>   FROM (job_postings jp<br>     JOIN company_users cu ON ((cu.company_id = jp.company_id)))<br>  WHERE (cu.user_id = auth.uid()))) |  |

#### hris_employees

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| org_id | uuid | uuid | NO |  |
| merge_id | text | text | NO |  |
| platform_name | text | text | NO |  |
| first_name | text | text | YES |  |
| last_name | text | text | YES |  |
| email | text | text | YES |  |
| department | text | text | YES |  |
| job_title | text | text | YES |  |
| employment_status | text | text | YES |  |
| manager_id | text | text | YES |  |
| avatar_url | text | text | YES |  |
| rolecolor_id | uuid | uuid | YES |  |
| rolecolor_status | USER-DEFINED | rolecolor_sync_status | NO | 'pending'::rolecolor_sync_status |
| assessment_invite_sent_at | timestamp with time zone | timestamptz | YES |  |
| raw_data | jsonb | jsonb | NO | '{}'::jsonb |
| last_synced_at | timestamp with time zone | timestamptz | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| is_active | boolean | bool | NO | true |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| hris_employees_org_id_fkey | org_id | companies.id |
| hris_employees_rolecolor_id_fkey | rolecolor_id | assessment_results.id |

Indexes:
| Index | Definition |
| --- | --- |
| hris_employees_email_idx | CREATE INDEX hris_employees_email_idx ON public.hris_employees USING btree (org_id, email) |
| hris_employees_org_id_idx | CREATE INDEX hris_employees_org_id_idx ON public.hris_employees USING btree (org_id, is_active) |
| hris_employees_org_merge_key | CREATE UNIQUE INDEX hris_employees_org_merge_key ON public.hris_employees USING btree (org_id, merge_id) |
| hris_employees_pkey | CREATE UNIQUE INDEX hris_employees_pkey ON public.hris_employees USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins and HR can view hris employees | SELECT | {public} | (org_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role]))))) |  |
| Service role can manage hris employees | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |  |

#### incidents

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| code | integer | int4 | NO |  |
| description | text | text | NO |  |
| status | text | text | NO | 'open'::text |
| created_by | uuid | uuid | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| incidents_pkey | CREATE UNIQUE INDEX incidents_pkey ON public.incidents USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| service role manages incidents | ALL | {service_role} | true | true |
| super admins can read incidents | SELECT | {authenticated} | is_super_admin(auth.uid()) |  |

#### interviews

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| application_id | uuid | uuid | NO |  |
| stage_id | uuid | uuid | YES |  |
| scheduled_at | timestamp with time zone | timestamptz | NO |  |
| duration_minutes | integer | int4 | YES | 60 |
| timezone | text | text | YES | 'UTC'::text |
| interview_type | USER-DEFINED | interview_type | NO | 'video'::interview_type |
| location | text | text | YES |  |
| meeting_link | text | text | YES |  |
| interviewer_ids | ARRAY | _uuid | YES | '{}'::uuid[] |
| organizer_id | uuid | uuid | YES |  |
| status | USER-DEFINED | interview_status | NO | 'scheduled'::interview_status |
| feedback | jsonb | jsonb | YES |  |
| overall_score | integer | int4 | YES |  |
| recommendation | text | text | YES |  |
| instructions_for_candidate | text | text | YES |  |
| reminder_sent_at | timestamp with time zone | timestamptz | YES |  |
| created_at | timestamp with time zone | timestamptz | YES | now() |
| updated_at | timestamp with time zone | timestamptz | YES | now() |
| completed_at | timestamp with time zone | timestamptz | YES |  |
| cancelled_at | timestamp with time zone | timestamptz | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| interviews_application_id_fkey | application_id | candidate_applications.id |
| interviews_organizer_id_fkey | organizer_id | company_users.id |
| interviews_stage_id_fkey | stage_id | hiring_pipeline_stages.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_interviews_application | CREATE INDEX idx_interviews_application ON public.interviews USING btree (application_id) |
| idx_interviews_interviewers | CREATE INDEX idx_interviews_interviewers ON public.interviews USING gin (interviewer_ids) |
| idx_interviews_scheduled | CREATE INDEX idx_interviews_scheduled ON public.interviews USING btree (scheduled_at) |
| idx_interviews_status | CREATE INDEX idx_interviews_status ON public.interviews USING btree (status) |
| interviews_pkey | CREATE UNIQUE INDEX interviews_pkey ON public.interviews USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins and HR can manage interviews | ALL | {public} | (application_id IN ( SELECT ca.id<br>   FROM ((candidate_applications ca<br>     JOIN job_postings jp ON ((jp.id = ca.job_posting_id)))<br>     JOIN company_users cu ON ((cu.company_id = jp.company_id)))<br>  WHERE ((cu.user_id = auth.uid()) AND (cu.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role]))))) |  |
| Interviewers can update their interviews | UPDATE | {public} | (EXISTS ( SELECT 1<br>   FROM company_users cu<br>  WHERE ((cu.user_id = auth.uid()) AND (cu.id = ANY (interviews.interviewer_ids))))) |  |
| Users can view interviews in their company | SELECT | {public} | (application_id IN ( SELECT ca.id<br>   FROM ((candidate_applications ca<br>     JOIN job_postings jp ON ((jp.id = ca.job_posting_id)))<br>     JOIN company_users cu ON ((cu.company_id = jp.company_id)))<br>  WHERE (cu.user_id = auth.uid()))) |  |

#### job_postings

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| title | text | text | NO |  |
| description | text | text | YES |  |
| department | text | text | YES |  |
| hiring_manager_id | uuid | uuid | YES |  |
| recruiter_id | uuid | uuid | YES |  |
| status | USER-DEFINED | job_posting_status | NO | 'draft'::job_posting_status |
| salary_min | integer | int4 | YES |  |
| salary_max | integer | int4 | YES |  |
| salary_currency | text | text | YES | 'USD'::text |
| location | text | text | YES |  |
| remote_policy | USER-DEFINED | remote_policy | YES | 'onsite'::remote_policy |
| employment_type | USER-DEFINED | employment_type | YES | 'full_time'::employment_type |
| required_experience_years | integer | int4 | YES |  |
| required_skills | ARRAY | _text | YES | '{}'::text[] |
| preferred_skills | ARRAY | _text | YES | '{}'::text[] |
| ideal_role_color_primary | text | text | YES |  |
| ideal_role_color_secondary | text | text | YES |  |
| company_role_id | uuid | uuid | YES |  |
| applications_count | integer | int4 | YES | 0 |
| created_at | timestamp with time zone | timestamptz | YES | now() |
| updated_at | timestamp with time zone | timestamptz | YES | now() |
| published_at | timestamp with time zone | timestamptz | YES |  |
| closes_at | timestamp with time zone | timestamptz | YES |  |
| external_source | text | text | YES |  |
| external_id | text | text | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| job_postings_company_id_fkey | company_id | companies.id |
| job_postings_company_role_id_fkey | company_role_id | company_roles.id |
| job_postings_hiring_manager_id_fkey | hiring_manager_id | company_users.id |
| job_postings_recruiter_id_fkey | recruiter_id | company_users.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_job_postings_company_id | CREATE INDEX idx_job_postings_company_id ON public.job_postings USING btree (company_id) |
| idx_job_postings_created_at | CREATE INDEX idx_job_postings_created_at ON public.job_postings USING btree (created_at DESC) |
| idx_job_postings_external_source_id | CREATE UNIQUE INDEX idx_job_postings_external_source_id ON public.job_postings USING btree (company_id, external_source, external_id) WHERE ((external_source IS NOT NULL) AND (external_id IS NOT NULL)) |
| idx_job_postings_status | CREATE INDEX idx_job_postings_status ON public.job_postings USING btree (status) |
| job_postings_pkey | CREATE UNIQUE INDEX job_postings_pkey ON public.job_postings USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins and HR can manage job postings | ALL | {public} | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role]))))) |  |
| Public can view open jobs | SELECT | {public} | (status = 'open'::job_posting_status) |  |
| Users can view job postings in their company | SELECT | {public} | (company_id IN ( SELECT company_users.company_id<br>   FROM company_users<br>  WHERE (company_users.user_id = auth.uid()))) |  |

#### job_templates

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | YES |  |
| name | text | text | NO |  |
| description | text | text | YES |  |
| ideal_primary_color | text | text | NO |  |
| ideal_secondary_color | text | text | YES |  |
| required_skills | ARRAY | _text | YES | '{}'::text[] |
| suggested_interview_questions | jsonb | jsonb | YES | '[]'::jsonb |
| is_global | boolean | bool | YES | false |
| created_by | uuid | uuid | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| idx_job_templates_company | CREATE INDEX idx_job_templates_company ON public.job_templates USING btree (company_id) WHERE (company_id IS NOT NULL) |
| idx_job_templates_global | CREATE INDEX idx_job_templates_global ON public.job_templates USING btree (is_global) WHERE (is_global = true) |
| job_templates_pkey | CREATE UNIQUE INDEX job_templates_pkey ON public.job_templates USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Anyone can view global templates | SELECT | {public} | (is_global = true) |  |
| Company admins can manage their templates | ALL | {public} | ((company_id IS NOT NULL) AND is_company_admin_for_company(auth.uid(), company_id)) |  |

#### merge_connections

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| org_id | uuid | uuid | NO |  |
| platform_name | text | text | NO |  |
| category | USER-DEFINED | merge_connection_category | NO |  |
| integration_slug | text | text | YES |  |
| account_token | text | text | YES |  |
| linked_account_id | text | text | YES |  |
| webhook_listener_url | text | text | YES |  |
| connection_status | USER-DEFINED | merge_connection_status | NO | 'connected'::merge_connection_status |
| sync_status | USER-DEFINED | merge_sync_status | NO | 'idle'::merge_sync_status |
| connected_at | timestamp with time zone | timestamptz | NO | now() |
| last_synced_at | timestamp with time zone | timestamptz | YES |  |
| last_error_code | text | text | YES |  |
| last_error_message | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| is_active | boolean | bool | NO | true |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| merge_connections_org_id_fkey | org_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| merge_connections_org_category_key | CREATE UNIQUE INDEX merge_connections_org_category_key ON public.merge_connections USING btree (org_id, category) |
| merge_connections_org_id_idx | CREATE INDEX merge_connections_org_id_idx ON public.merge_connections USING btree (org_id, is_active, category) |
| merge_connections_pkey | CREATE UNIQUE INDEX merge_connections_pkey ON public.merge_connections USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Service role can manage merge connections | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |  |

#### merge_sync_errors

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| org_id | uuid | uuid | NO |  |
| platform | text | text | NO |  |
| category | USER-DEFINED | merge_connection_category | YES |  |
| error_code | text | text | YES |  |
| error_message | text | text | NO |  |
| context | jsonb | jsonb | NO | '{}'::jsonb |
| occurred_at | timestamp with time zone | timestamptz | NO | now() |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| is_active | boolean | bool | NO | true |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| merge_sync_errors_org_id_fkey | org_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| merge_sync_errors_org_id_idx | CREATE INDEX merge_sync_errors_org_id_idx ON public.merge_sync_errors USING btree (org_id, occurred_at DESC) |
| merge_sync_errors_pkey | CREATE UNIQUE INDEX merge_sync_errors_pkey ON public.merge_sync_errors USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Service role can manage merge sync errors | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |  |

#### offer_probation_reminders

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| offer_id | uuid | uuid | NO |  |
| company_id | uuid | uuid | NO |  |
| admin_company_user_id | uuid | uuid | NO |  |
| probation_period | text | text | NO |  |
| reminder_at | timestamp with time zone | timestamptz | NO |  |
| status | text | text | NO | 'pending'::text |
| sent_at | timestamp with time zone | timestamptz | YES |  |
| failure_reason | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| offer_probation_reminders_admin_company_user_id_fkey | admin_company_user_id | company_users.id |
| offer_probation_reminders_company_id_fkey | company_id | companies.id |
| offer_probation_reminders_offer_id_fkey | offer_id | offers.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_offer_probation_reminders_due | CREATE INDEX idx_offer_probation_reminders_due ON public.offer_probation_reminders USING btree (reminder_at) WHERE (status = 'pending'::text) |
| offer_probation_reminders_offer_id_key | CREATE UNIQUE INDEX offer_probation_reminders_offer_id_key ON public.offer_probation_reminders USING btree (offer_id) |
| offer_probation_reminders_pkey | CREATE UNIQUE INDEX offer_probation_reminders_pkey ON public.offer_probation_reminders USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins and HR can insert probation reminders in company | INSERT | {public} |  | (EXISTS ( SELECT 1<br>   FROM company_users cu<br>  WHERE ((cu.company_id = offer_probation_reminders.company_id) AND (cu.user_id = auth.uid()) AND (cu.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role])) AND (cu.status = 'active'::company_user_status)))) |
| Admins and HR can update probation reminders in company | UPDATE | {public} | (EXISTS ( SELECT 1<br>   FROM company_users cu<br>  WHERE ((cu.company_id = offer_probation_reminders.company_id) AND (cu.user_id = auth.uid()) AND (cu.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role])) AND (cu.status = 'active'::company_user_status)))) |  |
| Admins and HR can view probation reminders in company | SELECT | {public} | (EXISTS ( SELECT 1<br>   FROM company_users cu<br>  WHERE ((cu.company_id = offer_probation_reminders.company_id) AND (cu.user_id = auth.uid()) AND (cu.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role])) AND (cu.status = 'active'::company_user_status)))) |  |

#### offers

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| application_id | uuid | uuid | NO |  |
| salary | integer | int4 | NO |  |
| salary_currency | text | text | YES | 'USD'::text |
| bonus | integer | int4 | YES |  |
| equity | text | text | YES |  |
| job_title | text | text | YES |  |
| start_date | date | date | YES |  |
| status | USER-DEFINED | offer_status | NO | 'draft'::offer_status |
| expires_at | timestamp with time zone | timestamptz | YES |  |
| document_url | text | text | YES |  |
| sent_at | timestamp with time zone | timestamptz | YES |  |
| viewed_at | timestamp with time zone | timestamptz | YES |  |
| responded_at | timestamp with time zone | timestamptz | YES |  |
| signed_at | timestamp with time zone | timestamptz | YES |  |
| decline_reason | text | text | YES |  |
| internal_notes | text | text | YES |  |
| candidate_notes | text | text | YES |  |
| created_by | uuid | uuid | YES |  |
| created_at | timestamp with time zone | timestamptz | YES | now() |
| updated_at | timestamp with time zone | timestamptz | YES | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| offers_application_id_fkey | application_id | candidate_applications.id |
| offers_created_by_fkey | created_by | company_users.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_offers_application | CREATE INDEX idx_offers_application ON public.offers USING btree (application_id) |
| idx_offers_status | CREATE INDEX idx_offers_status ON public.offers USING btree (status) |
| offers_pkey | CREATE UNIQUE INDEX offers_pkey ON public.offers USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins and HR can manage offers | ALL | {public} | (application_id IN ( SELECT ca.id<br>   FROM ((candidate_applications ca<br>     JOIN job_postings jp ON ((jp.id = ca.job_posting_id)))<br>     JOIN company_users cu ON ((cu.company_id = jp.company_id)))<br>  WHERE ((cu.user_id = auth.uid()) AND (cu.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role]))))) |  |
| Users can view offers in their company | SELECT | {public} | (application_id IN ( SELECT ca.id<br>   FROM ((candidate_applications ca<br>     JOIN job_postings jp ON ((jp.id = ca.job_posting_id)))<br>     JOIN company_users cu ON ((cu.company_id = jp.company_id)))<br>  WHERE (cu.user_id = auth.uid()))) |  |

#### payments

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| user_id | uuid | uuid | YES |  |
| email | text | text | NO |  |
| stripe_session_id | text | text | YES |  |
| amount | integer | int4 | YES |  |
| currency | text | text | YES | 'usd'::text |
| status | text | text | YES | 'pending'::text |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| payments_pkey | CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id) |
| payments_stripe_session_id_key | CREATE UNIQUE INDEX payments_stripe_session_id_key ON public.payments USING btree (stripe_session_id) |
| payments_user_id_key | CREATE UNIQUE INDEX payments_user_id_key ON public.payments USING btree (user_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| insert_payment | INSERT | {public} |  | true |
| select_own_payments | SELECT | {public} | (user_id = auth.uid()) |  |
| update_payment | UPDATE | {public} | true |  |

#### platform_errors

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| message | text | text | NO |  |
| context | jsonb | jsonb | NO | '{}'::jsonb |
| severity | integer | int4 | NO | 1 |
| resolved_at | timestamp with time zone | timestamptz | YES |  |
| resolved_by | uuid | uuid | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| platform_errors_pkey | CREATE UNIQUE INDEX platform_errors_pkey ON public.platform_errors USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| service role manages platform errors | ALL | {service_role} | true | true |
| super admins can read platform errors | SELECT | {authenticated} | is_super_admin(auth.uid()) |  |

#### platform_settings

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| key | text | text | NO |  |
| value | jsonb | jsonb | NO | 'null'::jsonb |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| platform_settings_pkey | CREATE UNIQUE INDEX platform_settings_pkey ON public.platform_settings USING btree (key) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| service role manages platform settings | ALL | {service_role} | true | true |
| super admins can read platform settings | SELECT | {authenticated} | is_super_admin(auth.uid()) |  |

#### platform_super_admins

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| user_id | uuid | uuid | YES |  |
| email | text | text | NO |  |
| full_name | text | text | YES |  |
| added_by | uuid | uuid | YES |  |
| added_by_email | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| platform_super_admins_email_unique_idx | CREATE UNIQUE INDEX platform_super_admins_email_unique_idx ON public.platform_super_admins USING btree (email) |
| platform_super_admins_pkey | CREATE UNIQUE INDEX platform_super_admins_pkey ON public.platform_super_admins USING btree (id) |
| platform_super_admins_user_id_unique_idx | CREATE UNIQUE INDEX platform_super_admins_user_id_unique_idx ON public.platform_super_admins USING btree (user_id) WHERE (user_id IS NOT NULL) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| service role manages platform super admins | ALL | {service_role} | true | true |

#### profiles

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| user_id | uuid | uuid | NO |  |
| avatar_url | text | text | YES |  |
| full_name | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | YES | now() |
| updated_at | timestamp with time zone | timestamptz | YES | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| profiles_pkey | CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id) |
| profiles_user_id_key | CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles USING btree (user_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Users can insert their own profile | INSERT | {authenticated} |  | (auth.uid() = user_id) |
| Users can update their own profile | UPDATE | {authenticated} | (auth.uid() = user_id) |  |
| Users can view their own profile | SELECT | {authenticated} | (auth.uid() = user_id) |  |

#### proposal_acceptances

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| proposal_slug | text | text | NO |  |
| signed_name | text | text | YES |  |
| signed_at | timestamp with time zone | timestamptz | YES |  |
| agreement_accepted | boolean | bool | YES | false |
| stripe_session_id | text | text | YES |  |
| payment_status | text | text | YES | 'pending'::text |
| paid_at | timestamp with time zone | timestamptz | YES |  |
| first_name | text | text | YES |  |
| last_name | text | text | YES |  |
| email | text | text | YES |  |
| phone | text | text | YES |  |
| designation | text | text | YES |  |
| status | text | text | YES | 'loi_pending'::text |
| created_at | timestamp with time zone | timestamptz | YES | now() |
| updated_at | timestamp with time zone | timestamptz | YES | now() |
| loi_signed_name | text | text | YES |  |
| loi_signed_at | timestamp with time zone | timestamptz | YES |  |
| loe_signed_name | text | text | YES |  |
| loe_signed_at | timestamp with time zone | timestamptz | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| proposal_acceptances_pkey | CREATE UNIQUE INDEX proposal_acceptances_pkey ON public.proposal_acceptances USING btree (id) |
| proposal_acceptances_stripe_session_id_key | CREATE UNIQUE INDEX proposal_acceptances_stripe_session_id_key ON public.proposal_acceptances USING btree (stripe_session_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| public_insert_acceptance | INSERT | {public} |  | true |
| public_select_acceptance | SELECT | {public} | true |  |
| public_update_acceptance | UPDATE | {public} | true |  |

#### public_profiles

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| user_id | uuid | uuid | NO |  |
| username | text | text | NO |  |
| is_public | boolean | bool | NO | true |
| selected_assessment_result_id | uuid | uuid | YES |  |
| selected_assessment_type | text | text | YES |  |
| theme | text | text | NO | 'classic'::text |
| profile_image_url | text | text | YES |  |
| view_count | integer | int4 | NO | 0 |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| idx_public_profiles_user_id | CREATE INDEX idx_public_profiles_user_id ON public.public_profiles USING btree (user_id) |
| idx_public_profiles_username | CREATE INDEX idx_public_profiles_username ON public.public_profiles USING btree (username) |
| public_profiles_pkey | CREATE UNIQUE INDEX public_profiles_pkey ON public.public_profiles USING btree (id) |
| public_profiles_user_id_key | CREATE UNIQUE INDEX public_profiles_user_id_key ON public.public_profiles USING btree (user_id) |
| public_profiles_username_key | CREATE UNIQUE INDEX public_profiles_username_key ON public.public_profiles USING btree (username) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Public can view public profiles | SELECT | {public} | (is_public = true) |  |
| Users can delete their own public profile | DELETE | {authenticated} | (auth.uid() = user_id) |  |
| Users can insert their own public profile | INSERT | {authenticated} |  | (auth.uid() = user_id) |
| Users can update their own public profile | UPDATE | {authenticated} | (auth.uid() = user_id) | (auth.uid() = user_id) |

#### rcaimobile_candidate_profiles

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | uuid_generate_v4() |
| user_id | uuid | uuid | NO |  |
| headline | text | text | YES |  |
| role_color_primary | text | text | NO |  |
| role_color_secondary | text | text | YES |  |
| role_color_scores | jsonb | jsonb | NO | '{"red": 0, "blue": 0, "green": 0, "yellow": 0}'::jsonb |
| strengths | jsonb | jsonb | NO | '[]'::jsonb |
| risks | jsonb | jsonb | NO | '[]'::jsonb |
| growth_signals | jsonb | jsonb | NO | '[]'::jsonb |
| overall_confidence | text | text | NO | 'insufficient'::text |
| last_updated | timestamp with time zone | timestamptz | YES | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| idx_rcaimobile_candidate_profiles_user_id | CREATE INDEX idx_rcaimobile_candidate_profiles_user_id ON public.rcaimobile_candidate_profiles USING btree (user_id) |
| rcaimobile_candidate_profiles_pkey | CREATE UNIQUE INDEX rcaimobile_candidate_profiles_pkey ON public.rcaimobile_candidate_profiles USING btree (id) |
| rcaimobile_candidate_profiles_user_id_key | CREATE UNIQUE INDEX rcaimobile_candidate_profiles_user_id_key ON public.rcaimobile_candidate_profiles USING btree (user_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Candidate profiles viewable by authenticated | SELECT | {authenticated} | true |  |
| Candidates can manage own profile | ALL | {authenticated} | (user_id = auth.uid()) |  |

#### rcaimobile_candidate_reviews

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | uuid_generate_v4() |
| candidate_id | uuid | uuid | NO |  |
| job_id | uuid | uuid | NO |  |
| reviewer_id | uuid | uuid | YES |  |
| status | text | text | NO | 'pending'::text |
| notes | text | text | YES |  |
| reviewed_at | timestamp with time zone | timestamptz | YES |  |
| created_at | timestamp with time zone | timestamptz | YES | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| rcaimobile_candidate_reviews_candidate_id_fkey | candidate_id | rcaimobile_candidate_profiles.id |
| rcaimobile_candidate_reviews_job_id_fkey | job_id | rcaimobile_jobs.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_rcaimobile_candidate_reviews_candidate_id | CREATE INDEX idx_rcaimobile_candidate_reviews_candidate_id ON public.rcaimobile_candidate_reviews USING btree (candidate_id) |
| idx_rcaimobile_candidate_reviews_job_id | CREATE INDEX idx_rcaimobile_candidate_reviews_job_id ON public.rcaimobile_candidate_reviews USING btree (job_id) |
| rcaimobile_candidate_reviews_pkey | CREATE UNIQUE INDEX rcaimobile_candidate_reviews_pkey ON public.rcaimobile_candidate_reviews USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| NOT FOUND |  |  |  |  |

#### rcaimobile_jobs

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | uuid_generate_v4() |
| title | text | text | NO |  |
| company | text | text | NO |  |
| location | text | text | NO |  |
| department | text | text | YES |  |
| description | text | text | NO |  |
| ideal_role_color | text | text | NO |  |
| posted_at | timestamp with time zone | timestamptz | YES | now() |
| status | text | text | NO | 'open'::text |
| created_by | uuid | uuid | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| rcaimobile_jobs_pkey | CREATE UNIQUE INDEX rcaimobile_jobs_pkey ON public.rcaimobile_jobs USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Jobs viewable by authenticated | SELECT | {authenticated} | true |  |

#### rcaimobile_notifications

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | uuid_generate_v4() |
| user_id | uuid | uuid | NO |  |
| title | text | text | NO |  |
| body | text | text | NO |  |
| type | text | text | NO |  |
| read | boolean | bool | YES | false |
| data | jsonb | jsonb | YES |  |
| created_at | timestamp with time zone | timestamptz | YES | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| idx_rcaimobile_notifications_read | CREATE INDEX idx_rcaimobile_notifications_read ON public.rcaimobile_notifications USING btree (user_id, read) |
| idx_rcaimobile_notifications_user_id | CREATE INDEX idx_rcaimobile_notifications_user_id ON public.rcaimobile_notifications USING btree (user_id) |
| rcaimobile_notifications_pkey | CREATE UNIQUE INDEX rcaimobile_notifications_pkey ON public.rcaimobile_notifications USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Users can update own notifications | UPDATE | {authenticated} | (user_id = auth.uid()) |  |
| Users can view own notifications | SELECT | {authenticated} | (user_id = auth.uid()) |  |

#### rcaimobile_role_fit_insights

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | uuid_generate_v4() |
| candidate_id | uuid | uuid | NO |  |
| job_id | uuid | uuid | NO |  |
| fit_score | text | text | NO |  |
| fit_summary | text | text | NO |  |
| alignments | jsonb | jsonb | NO | '[]'::jsonb |
| frictions | jsonb | jsonb | NO | '[]'::jsonb |
| recommendation | text | text | YES |  |
| generated_at | timestamp with time zone | timestamptz | YES | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| rcaimobile_role_fit_insights_candidate_id_fkey | candidate_id | rcaimobile_candidate_profiles.id |
| rcaimobile_role_fit_insights_job_id_fkey | job_id | rcaimobile_jobs.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_rcaimobile_role_fit_insights_candidate_id | CREATE INDEX idx_rcaimobile_role_fit_insights_candidate_id ON public.rcaimobile_role_fit_insights USING btree (candidate_id) |
| idx_rcaimobile_role_fit_insights_job_id | CREATE INDEX idx_rcaimobile_role_fit_insights_job_id ON public.rcaimobile_role_fit_insights USING btree (job_id) |
| rcaimobile_role_fit_insights_candidate_id_job_id_key | CREATE UNIQUE INDEX rcaimobile_role_fit_insights_candidate_id_job_id_key ON public.rcaimobile_role_fit_insights USING btree (candidate_id, job_id) |
| rcaimobile_role_fit_insights_pkey | CREATE UNIQUE INDEX rcaimobile_role_fit_insights_pkey ON public.rcaimobile_role_fit_insights USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| NOT FOUND |  |  |  |  |

#### rcf_ai_narratives

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| subject_type | USER-DEFINED | rcf_subject_type | NO |  |
| subject_id | uuid | uuid | NO |  |
| disclosure_level | USER-DEFINED | rcf_disclosure_level | NO |  |
| prompt_template_version | text | text | NO | 'narrative-v1.0'::text |
| narrative | text | text | NO |  |
| generated_by | text | text | YES | 'openai-gpt-4'::text |
| token_count | integer | int4 | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| idx_rcf_ai_narratives_disclosure | CREATE INDEX idx_rcf_ai_narratives_disclosure ON public.rcf_ai_narratives USING btree (disclosure_level) |
| idx_rcf_ai_narratives_subject | CREATE INDEX idx_rcf_ai_narratives_subject ON public.rcf_ai_narratives USING btree (subject_type, subject_id) |
| rcf_ai_narratives_pkey | CREATE UNIQUE INDEX rcf_ai_narratives_pkey ON public.rcf_ai_narratives USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Service role can manage narratives | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |  |
| Users can view own narratives | SELECT | {public} | ((subject_type = 'USER'::rcf_subject_type) AND (subject_id = auth.uid())) |  |

#### rcf_assessments

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| user_id | uuid | uuid | NO |  |
| org_id | uuid | uuid | YES |  |
| version | text | text | NO | 'v25'::text |
| completed_at | timestamp with time zone | timestamptz | YES |  |
| raw_payload | jsonb | jsonb | NO | '{}'::jsonb |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| rcf_assessments_org_id_fkey | org_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_rcf_assessments_completed_at | CREATE INDEX idx_rcf_assessments_completed_at ON public.rcf_assessments USING btree (completed_at) |
| idx_rcf_assessments_org_id | CREATE INDEX idx_rcf_assessments_org_id ON public.rcf_assessments USING btree (org_id) |
| idx_rcf_assessments_user_id | CREATE INDEX idx_rcf_assessments_user_id ON public.rcf_assessments USING btree (user_id) |
| rcf_assessments_pkey | CREATE UNIQUE INDEX rcf_assessments_pkey ON public.rcf_assessments USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Users can create own assessments | INSERT | {public} |  | (auth.uid() = user_id) |
| Users can update own assessments | UPDATE | {public} | (auth.uid() = user_id) |  |
| Users can view own assessments | SELECT | {public} | (auth.uid() = user_id) |  |

#### rcf_context_checkins

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| user_id | uuid | uuid | NO |  |
| context_type | USER-DEFINED | rcf_context_type | NO |  |
| energy_level | integer | int4 | YES |  |
| alignment_feeling | integer | int4 | YES |  |
| notes | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| idx_rcf_context_checkins_created_at | CREATE INDEX idx_rcf_context_checkins_created_at ON public.rcf_context_checkins USING btree (created_at DESC) |
| idx_rcf_context_checkins_user_id | CREATE INDEX idx_rcf_context_checkins_user_id ON public.rcf_context_checkins USING btree (user_id) |
| rcf_context_checkins_pkey | CREATE UNIQUE INDEX rcf_context_checkins_pkey ON public.rcf_context_checkins USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Users can manage own check-ins | ALL | {public} | (auth.uid() = user_id) |  |

#### rcf_dyads

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| org_id | uuid | uuid | NO |  |
| user_a_id | uuid | uuid | NO |  |
| user_b_id | uuid | uuid | NO |  |
| team_id | uuid | uuid | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| rcf_dyads_org_id_fkey | org_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_rcf_dyads_org_id | CREATE INDEX idx_rcf_dyads_org_id ON public.rcf_dyads USING btree (org_id) |
| idx_rcf_dyads_users | CREATE INDEX idx_rcf_dyads_users ON public.rcf_dyads USING btree (user_a_id, user_b_id) |
| rcf_dyads_pkey | CREATE UNIQUE INDEX rcf_dyads_pkey ON public.rcf_dyads USING btree (id) |
| unique_dyad | CREATE UNIQUE INDEX unique_dyad ON public.rcf_dyads USING btree (org_id, user_a_id, user_b_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Org members can view dyads | SELECT | {public} | (EXISTS ( SELECT 1<br>   FROM company_users cu<br>  WHERE ((cu.company_id = rcf_dyads.org_id) AND (cu.user_id = auth.uid())))) |  |

#### rcf_insight_layers

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| org_id | uuid | uuid | NO |  |
| license_tier | USER-DEFINED | rcf_license_tier | NO | 'INDIVIDUAL'::rcf_license_tier |
| disclosure_level | USER-DEFINED | rcf_disclosure_level | NO | 'SNAPSHOT'::rcf_disclosure_level |
| max_disclosure_level | USER-DEFINED | rcf_disclosure_level | NO | 'SNAPSHOT'::rcf_disclosure_level |
| can_view_team_balance | boolean | bool | NO | false |
| can_view_friction_map | boolean | bool | NO | false |
| can_view_drift_signals | boolean | bool | NO | false |
| can_export_reports | boolean | bool | NO | false |
| can_access_ai_narratives | boolean | bool | NO | false |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| rcf_insight_layers_org_id_fkey | org_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_rcf_insight_layers_org_id | CREATE INDEX idx_rcf_insight_layers_org_id ON public.rcf_insight_layers USING btree (org_id) |
| rcf_insight_layers_org_id_key | CREATE UNIQUE INDEX rcf_insight_layers_org_id_key ON public.rcf_insight_layers USING btree (org_id) |
| rcf_insight_layers_pkey | CREATE UNIQUE INDEX rcf_insight_layers_pkey ON public.rcf_insight_layers USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Org admins can view insight layers | SELECT | {public} | (EXISTS ( SELECT 1<br>   FROM company_users cu<br>  WHERE ((cu.company_id = rcf_insight_layers.org_id) AND (cu.user_id = auth.uid()) AND (cu.role = 'admin'::company_user_role)))) |  |

#### rcf_role_profiles

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| assessment_id | uuid | uuid | NO |  |
| user_id | uuid | uuid | NO |  |
| primary_role | USER-DEFINED | rcf_role_type | NO |  |
| secondary_roles | ARRAY | _rcf_role_type | NO | '{}'::rcf_role_type[] |
| dominant_energy | USER-DEFINED | rcf_energy_type | NO |  |
| energy_profile | jsonb | jsonb | NO | '{}'::jsonb |
| context_map | jsonb | jsonb | NO | '{}'::jsonb |
| contribution_narrative | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| rcf_role_profiles_assessment_id_fkey | assessment_id | rcf_assessments.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_rcf_role_profiles_dominant_energy | CREATE INDEX idx_rcf_role_profiles_dominant_energy ON public.rcf_role_profiles USING btree (dominant_energy) |
| idx_rcf_role_profiles_primary_role | CREATE INDEX idx_rcf_role_profiles_primary_role ON public.rcf_role_profiles USING btree (primary_role) |
| idx_rcf_role_profiles_user_id | CREATE INDEX idx_rcf_role_profiles_user_id ON public.rcf_role_profiles USING btree (user_id) |
| rcf_role_profiles_assessment_id_key | CREATE UNIQUE INDEX rcf_role_profiles_assessment_id_key ON public.rcf_role_profiles USING btree (assessment_id) |
| rcf_role_profiles_pkey | CREATE UNIQUE INDEX rcf_role_profiles_pkey ON public.rcf_role_profiles USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Service role can manage role profiles | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |  |
| Users can view own role profiles | SELECT | {public} | (auth.uid() = user_id) |  |

#### rcf_signals

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| subject_type | USER-DEFINED | rcf_subject_type | NO |  |
| subject_id | uuid | uuid | NO |  |
| signal_type | USER-DEFINED | rcf_signal_type | NO |  |
| severity | USER-DEFINED | rcf_signal_severity | NO | 'LOW'::rcf_signal_severity |
| label | text | text | NO |  |
| summary | text | text | NO |  |
| details | jsonb | jsonb | NO | '{}'::jsonb |
| model_version | text | text | NO | 'signals-v1.0'::text |
| computed_at | timestamp with time zone | timestamptz | NO | now() |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| idx_rcf_signals_computed_at | CREATE INDEX idx_rcf_signals_computed_at ON public.rcf_signals USING btree (computed_at) |
| idx_rcf_signals_severity | CREATE INDEX idx_rcf_signals_severity ON public.rcf_signals USING btree (severity) |
| idx_rcf_signals_subject | CREATE INDEX idx_rcf_signals_subject ON public.rcf_signals USING btree (subject_type, subject_id) |
| idx_rcf_signals_type | CREATE INDEX idx_rcf_signals_type ON public.rcf_signals USING btree (signal_type) |
| rcf_signals_pkey | CREATE UNIQUE INDEX rcf_signals_pkey ON public.rcf_signals USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Service role can manage signals | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |  |
| Users can view own signals | SELECT | {public} | ((subject_type = 'USER'::rcf_subject_type) AND (subject_id = auth.uid())) |  |

#### rcf_team_summaries

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| org_id | uuid | uuid | NO |  |
| team_id | uuid | uuid | YES |  |
| architect_count | integer | int4 | NO | 0 |
| driver_count | integer | int4 | NO | 0 |
| connector_count | integer | int4 | NO | 0 |
| stabilizer_count | integer | int4 | NO | 0 |
| balance_score | numeric | numeric | YES |  |
| dominance_risk | ARRAY | _text | YES |  |
| absence_risk | ARRAY | _text | YES |  |
| computed_at | timestamp with time zone | timestamptz | NO | now() |
| model_version | text | text | NO | 'team-v1.0'::text |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| rcf_team_summaries_org_id_fkey | org_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_rcf_team_summaries_org_team | CREATE INDEX idx_rcf_team_summaries_org_team ON public.rcf_team_summaries USING btree (org_id, team_id) |
| rcf_team_summaries_pkey | CREATE UNIQUE INDEX rcf_team_summaries_pkey ON public.rcf_team_summaries USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Org admins can view team summaries | SELECT | {public} | (EXISTS ( SELECT 1<br>   FROM company_users cu<br>  WHERE ((cu.company_id = rcf_team_summaries.org_id) AND (cu.user_id = auth.uid()) AND (cu.role = 'admin'::company_user_role)))) |  |

#### registrants_hg

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| full_name | text | text | NO |  |
| email | text | text | NO |  |
| school_organization | text | text | NO |  |
| experience_level | text | text | NO |  |
| registered_at | timestamp with time zone | timestamptz | YES | now() |
| created_at | timestamp with time zone | timestamptz | YES | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| idx_registrants_hg_created_at | CREATE INDEX idx_registrants_hg_created_at ON public.registrants_hg USING btree (created_at DESC) |
| idx_registrants_hg_email | CREATE INDEX idx_registrants_hg_email ON public.registrants_hg USING btree (email) |
| registrants_hg_pkey | CREATE UNIQUE INDEX registrants_hg_pkey ON public.registrants_hg USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Allow authenticated read | SELECT | {authenticated} | true |  |
| Allow public read | SELECT | {anon} | true |  |
| Allow public registration | INSERT | {anon} |  | true |

#### registrations

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | bigint | int8 | NO | nextval('registrations_id_seq'::regclass) |
| name | text | text | NO |  |
| email | text | text | NO |  |
| idea | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | YES | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| registrations_pkey | CREATE UNIQUE INDEX registrations_pkey ON public.registrations USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Enable insert for all users | INSERT | {public} |  | true |
| Enable read access for all users | SELECT | {public} | true |  |

#### saved_searches

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| user_id | uuid | uuid | NO |  |
| name | text | text | NO |  |
| filters | jsonb | jsonb | NO |  |
| last_used_at | timestamp with time zone | timestamptz | YES |  |
| use_count | integer | int4 | YES | 0 |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| saved_searches_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_saved_searches_user | CREATE INDEX idx_saved_searches_user ON public.saved_searches USING btree (user_id) |
| saved_searches_pkey | CREATE UNIQUE INDEX saved_searches_pkey ON public.saved_searches USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Users can manage own saved searches | ALL | {public} | (user_id = auth.uid()) |  |

#### scheduled_reminders

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| company_user_id | uuid | uuid | NO |  |
| scheduled_for | timestamp with time zone | timestamptz | NO |  |
| status | text | text | NO | 'pending'::text |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| created_by | uuid | uuid | YES |  |
| sent_at | timestamp with time zone | timestamptz | YES |  |
| recurrence | text | text | NO | 'once'::text |
| delivery_status | text | text | YES |  |
| next_occurrence_at | timestamp with time zone | timestamptz | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| scheduled_reminders_company_id_fkey | company_id | companies.id |
| scheduled_reminders_company_user_id_fkey | company_user_id | company_users.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_scheduled_reminders_company | CREATE INDEX idx_scheduled_reminders_company ON public.scheduled_reminders USING btree (company_id) |
| idx_scheduled_reminders_pending | CREATE INDEX idx_scheduled_reminders_pending ON public.scheduled_reminders USING btree (scheduled_for) WHERE (status = 'pending'::text) |
| scheduled_reminders_pkey | CREATE UNIQUE INDEX scheduled_reminders_pkey ON public.scheduled_reminders USING btree (id) |
| unique_pending_reminder | CREATE UNIQUE INDEX unique_pending_reminder ON public.scheduled_reminders USING btree (company_user_id, scheduled_for) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins can create reminders for their company | INSERT | {public} |  | (EXISTS ( SELECT 1<br>   FROM company_users cu<br>  WHERE ((cu.company_id = scheduled_reminders.company_id) AND (cu.user_id = auth.uid()) AND (cu.role = 'admin'::company_user_role) AND (cu.status = 'active'::company_user_status)))) |
| Company admins can delete reminders for their company | DELETE | {public} | (EXISTS ( SELECT 1<br>   FROM company_users cu<br>  WHERE ((cu.company_id = scheduled_reminders.company_id) AND (cu.user_id = auth.uid()) AND (cu.role = 'admin'::company_user_role) AND (cu.status = 'active'::company_user_status)))) |  |
| Company admins can update reminders for their company | UPDATE | {public} | (EXISTS ( SELECT 1<br>   FROM company_users cu<br>  WHERE ((cu.company_id = scheduled_reminders.company_id) AND (cu.user_id = auth.uid()) AND (cu.role = 'admin'::company_user_role) AND (cu.status = 'active'::company_user_status)))) |  |
| Company admins can view reminders for their company | SELECT | {public} | (EXISTS ( SELECT 1<br>   FROM company_users cu<br>  WHERE ((cu.company_id = scheduled_reminders.company_id) AND (cu.user_id = auth.uid()) AND (cu.role = 'admin'::company_user_role) AND (cu.status = 'active'::company_user_status)))) |  |

#### scheduled_reports

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| name | text | text | NO |  |
| frequency | text | text | NO | 'weekly'::text |
| recipients | ARRAY | _text | NO | '{}'::text[] |
| report_type | text | text | NO | 'team_summary'::text |
| include_sections | jsonb | jsonb | YES | '["overview", "color_distribution", "completion_trend"]'::jsonb |
| last_sent_at | timestamp with time zone | timestamptz | YES |  |
| next_send_at | timestamp with time zone | timestamptz | YES |  |
| is_active | boolean | bool | NO | true |
| created_by | uuid | uuid | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| timezone | text | text | NO | 'UTC'::text |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| scheduled_reports_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_scheduled_reports_company_id | CREATE INDEX idx_scheduled_reports_company_id ON public.scheduled_reports USING btree (company_id) |
| idx_scheduled_reports_next_send | CREATE INDEX idx_scheduled_reports_next_send ON public.scheduled_reports USING btree (next_send_at) WHERE (is_active = true) |
| scheduled_reports_pkey | CREATE UNIQUE INDEX scheduled_reports_pkey ON public.scheduled_reports USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins can manage scheduled reports | ALL | {public} | is_company_admin_for_company(auth.uid(), company_id) |  |

#### school_admins

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| school_id | uuid | uuid | NO |  |
| user_id | uuid | uuid | NO |  |
| email | text | text | NO |  |
| full_name | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| school_admins_school_id_fkey | school_id | schools.id |

Indexes:
| Index | Definition |
| --- | --- |
| school_admins_pkey | CREATE UNIQUE INDEX school_admins_pkey ON public.school_admins USING btree (id) |
| school_admins_school_id_user_id_key | CREATE UNIQUE INDEX school_admins_school_id_user_id_key ON public.school_admins USING btree (school_id, user_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| school_admins_read_own_membership | SELECT | {authenticated} | ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR is_school_admin(school_id)) |  |
| super_admins_manage_school_admins | ALL | {authenticated} | has_role(auth.uid(), 'admin'::app_role) | has_role(auth.uid(), 'admin'::app_role) |

#### school_classes

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| admin_id | uuid | uuid | NO |  |
| name | text | text | NO |  |
| block | text | text | NO |  |
| type | text | text | NO |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| school_id | uuid | uuid | YES |  |
| teacher_id | uuid | uuid | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| school_classes_school_id_fkey | school_id | schools.id |
| school_classes_teacher_id_fkey | teacher_id | school_teachers.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_school_classes_admin_id | CREATE INDEX idx_school_classes_admin_id ON public.school_classes USING btree (admin_id) |
| school_classes_pkey | CREATE UNIQUE INDEX school_classes_pkey ON public.school_classes USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins can manage their own classes | ALL | {public} | (EXISTS ( SELECT 1<br>   FROM admin_users<br>  WHERE ((admin_users.id = auth.uid()) AND (admin_users.id = school_classes.admin_id)))) |  |
| super_admins_classes | ALL | {authenticated} | has_role(auth.uid(), 'admin'::app_role) |  |
| teachers_manage_classes | ALL | {authenticated} | (school_id IN ( SELECT school_teachers.school_id<br>   FROM school_teachers<br>  WHERE (school_teachers.user_id = auth.uid()))) |  |
| teachers_read_classes | SELECT | {authenticated} | (school_id IN ( SELECT school_teachers.school_id<br>   FROM school_teachers<br>  WHERE (school_teachers.user_id = auth.uid()))) |  |

#### school_students

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| school_id | uuid | uuid | NO |  |
| user_id | uuid | uuid | NO |  |
| email | text | text | NO |  |
| full_name | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| school_students_school_id_fkey | school_id | schools.id |

Indexes:
| Index | Definition |
| --- | --- |
| school_students_pkey | CREATE UNIQUE INDEX school_students_pkey ON public.school_students USING btree (id) |
| school_students_school_id_user_id_key | CREATE UNIQUE INDEX school_students_school_id_user_id_key ON public.school_students USING btree (school_id, user_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| school_admins_manage_students | ALL | {authenticated} | (has_role(auth.uid(), 'admin'::app_role) OR is_school_admin(school_id)) | (has_role(auth.uid(), 'admin'::app_role) OR is_school_admin(school_id)) |
| school_staff_read_students | SELECT | {authenticated} | (has_role(auth.uid(), 'admin'::app_role) OR is_school_admin(school_id) OR is_school_teacher(school_id)) |  |
| students_insert_own_record | INSERT | {authenticated} |  | (user_id = auth.uid()) |
| students_read_own_record | SELECT | {authenticated} | (user_id = auth.uid()) |  |

#### school_teachers

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| school_id | uuid | uuid | NO |  |
| user_id | uuid | uuid | NO |  |
| email | text | text | NO |  |
| full_name | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| school_teachers_school_id_fkey | school_id | schools.id |

Indexes:
| Index | Definition |
| --- | --- |
| school_teachers_pkey | CREATE UNIQUE INDEX school_teachers_pkey ON public.school_teachers USING btree (id) |
| school_teachers_school_id_user_id_key | CREATE UNIQUE INDEX school_teachers_school_id_user_id_key ON public.school_teachers USING btree (school_id, user_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| school_admins_manage_teachers_safe | ALL | {authenticated} | (has_role(auth.uid(), 'admin'::app_role) OR is_school_admin(school_id)) | (has_role(auth.uid(), 'admin'::app_role) OR is_school_admin(school_id)) |
| teachers_read_own_membership | SELECT | {authenticated} | ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR is_school_admin(school_id)) |  |

#### school_team_members

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| team_id | uuid | uuid | NO |  |
| student_id | uuid | uuid | NO |  |
| assigned_role | text | text | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| school_team_members_team_id_fkey | team_id | school_teams.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_school_team_members_student_id | CREATE INDEX idx_school_team_members_student_id ON public.school_team_members USING btree (student_id) |
| idx_school_team_members_team_id | CREATE INDEX idx_school_team_members_team_id ON public.school_team_members USING btree (team_id) |
| school_team_members_pkey | CREATE UNIQUE INDEX school_team_members_pkey ON public.school_team_members USING btree (id) |
| school_team_members_team_id_student_id_key | CREATE UNIQUE INDEX school_team_members_team_id_student_id_key ON public.school_team_members USING btree (team_id, student_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins can manage team members in their classes | ALL | {public} | (EXISTS ( SELECT 1<br>   FROM ((school_teams<br>     JOIN school_classes ON ((school_classes.id = school_teams.class_id)))<br>     JOIN admin_users ON ((admin_users.id = school_classes.admin_id)))<br>  WHERE ((school_teams.id = school_team_members.team_id) AND (admin_users.id = auth.uid())))) |  |
| super_admins_team_members | ALL | {authenticated} | has_role(auth.uid(), 'admin'::app_role) |  |
| teachers_manage_team_members | ALL | {authenticated} | (team_id IN ( SELECT t.id<br>   FROM (school_teams t<br>     JOIN school_classes sc ON ((sc.id = t.class_id)))<br>  WHERE (sc.school_id IN ( SELECT school_teachers.school_id<br>           FROM school_teachers<br>          WHERE (school_teachers.user_id = auth.uid()))))) |  |

#### school_teams

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| class_id | uuid | uuid | NO |  |
| name | text | text | NO |  |
| access_code | text | text | NO |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| team_size | integer | int4 | YES | 4 |
| created_by | uuid | uuid | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| school_teams_class_id_fkey | class_id | school_classes.id |
| school_teams_created_by_fkey | created_by | school_teachers.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_school_teams_access_code | CREATE INDEX idx_school_teams_access_code ON public.school_teams USING btree (access_code) |
| idx_school_teams_class_id | CREATE INDEX idx_school_teams_class_id ON public.school_teams USING btree (class_id) |
| school_teams_access_code_key | CREATE UNIQUE INDEX school_teams_access_code_key ON public.school_teams USING btree (access_code) |
| school_teams_pkey | CREATE UNIQUE INDEX school_teams_pkey ON public.school_teams USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins can manage teams in their classes | ALL | {public} | (EXISTS ( SELECT 1<br>   FROM (school_classes<br>     JOIN admin_users ON ((admin_users.id = school_classes.admin_id)))<br>  WHERE ((school_classes.id = school_teams.class_id) AND (admin_users.id = auth.uid())))) |  |
| super_admins_teams | ALL | {authenticated} | has_role(auth.uid(), 'admin'::app_role) |  |
| teachers_manage_teams | ALL | {authenticated} | (class_id IN ( SELECT school_classes.id<br>   FROM school_classes<br>  WHERE (school_classes.school_id IN ( SELECT school_teachers.school_id<br>           FROM school_teachers<br>          WHERE (school_teachers.user_id = auth.uid()))))) |  |

#### schools

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| name | text | text | NO |  |
| slug | text | text | NO |  |
| email_domains | ARRAY | _text | NO | '{}'::text[] |
| max_students | integer | int4 | NO | 50 |
| is_active | boolean | bool | NO | true |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| schools_pkey | CREATE UNIQUE INDEX schools_pkey ON public.schools USING btree (id) |
| schools_slug_key | CREATE UNIQUE INDEX schools_slug_key ON public.schools USING btree (slug) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| public_can_view_active_schools | SELECT | {anon,authenticated} | ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role) OR is_school_admin(id) OR is_school_teacher(id)) |  |
| super_admins_manage_schools | ALL | {authenticated} | has_role(auth.uid(), 'admin'::app_role) | has_role(auth.uid(), 'admin'::app_role) |

#### slack_connection_statuses

RLS enabled: NOT FOUND.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | YES |  |
| org_id | uuid | uuid | YES |  |
| team_id | text | text | YES |  |
| team_name | text | text | YES |  |
| authed_user_id | text | text | YES |  |
| incoming_webhook_channel | text | text | YES |  |
| connected_at | timestamp with time zone | timestamptz | YES |  |
| is_active | boolean | bool | YES |  |
| created_at | timestamp with time zone | timestamptz | YES |  |
| updated_at | timestamp with time zone | timestamptz | YES |  |
| auto_add_users | boolean | bool | YES |  |
| email_mismatch_action | text | text | YES |  |
| name_matching_enabled | boolean | bool | YES |  |
| admin_notify_on_new_user | boolean | bool | YES |  |
| admin_notify_channel | text | text | YES |  |
| pending_confirmations_count | integer | int4 | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| NOT FOUND |  |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| NOT FOUND |  |  |  |  |

#### slack_connections

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| org_id | uuid | uuid | NO |  |
| team_id | text | text | NO |  |
| team_name | text | text | NO |  |
| bot_token | text | text | NO |  |
| authed_user_id | text | text | YES |  |
| incoming_webhook_url | text | text | YES |  |
| incoming_webhook_channel | text | text | YES |  |
| connected_at | timestamp with time zone | timestamptz | NO | now() |
| is_active | boolean | bool | NO | true |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| auto_add_users | boolean | bool | NO | false |
| email_mismatch_action | text | text | NO | 'confirm'::text |
| name_matching_enabled | boolean | bool | NO | false |
| admin_notify_on_new_user | boolean | bool | NO | true |
| admin_notify_channel | text | text | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| slack_connections_org_id_fkey | org_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| slack_connections_active_org_idx | CREATE UNIQUE INDEX slack_connections_active_org_idx ON public.slack_connections USING btree (org_id) WHERE (is_active = true) |
| slack_connections_active_team_idx | CREATE UNIQUE INDEX slack_connections_active_team_idx ON public.slack_connections USING btree (team_id) WHERE (is_active = true) |
| slack_connections_org_team_key | CREATE UNIQUE INDEX slack_connections_org_team_key ON public.slack_connections USING btree (org_id, team_id) |
| slack_connections_pkey | CREATE UNIQUE INDEX slack_connections_pkey ON public.slack_connections USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Service role can manage slack connections | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |

#### slack_errors

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| org_id | uuid | uuid | YES |  |
| function_name | text | text | NO |  |
| error_message | text | text | NO |  |
| payload | jsonb | jsonb | NO | '{}'::jsonb |
| occurred_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| slack_errors_org_id_fkey | org_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| slack_errors_org_occurred_idx | CREATE INDEX slack_errors_org_occurred_idx ON public.slack_errors USING btree (org_id, occurred_at DESC) |
| slack_errors_pkey | CREATE UNIQUE INDEX slack_errors_pkey ON public.slack_errors USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Service role can manage slack errors | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |

#### slack_interactions

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| org_id | uuid | uuid | YES |  |
| user_id | text | text | NO |  |
| action_id | text | text | NO |  |
| occurred_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| slack_interactions_org_id_fkey | org_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| slack_interactions_org_occurred_idx | CREATE INDEX slack_interactions_org_occurred_idx ON public.slack_interactions USING btree (org_id, occurred_at DESC) |
| slack_interactions_pkey | CREATE UNIQUE INDEX slack_interactions_pkey ON public.slack_interactions USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Service role can manage slack interactions | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |

#### slack_pending_confirmations

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| org_id | uuid | uuid | NO |  |
| slack_user_id | text | text | NO |  |
| slack_email | text | text | YES |  |
| slack_display_name | text | text | YES |  |
| slack_real_name | text | text | YES |  |
| slack_title | text | text | YES |  |
| slack_avatar_url | text | text | YES |  |
| matched_rcf_user_id | uuid | uuid | YES |  |
| matched_rcf_name | text | text | YES |  |
| matched_rcf_role | text | text | YES |  |
| matched_rcf_color | text | text | YES |  |
| match_type | text | text | YES |  |
| match_confidence | integer | int4 | YES |  |
| confirmation_token | uuid | uuid | NO | gen_random_uuid() |
| status | text | text | NO | 'pending'::text |
| initiated_by | text | text | NO | 'system'::text |
| dm_sent_at | timestamp with time zone | timestamptz | YES |  |
| responded_at | timestamp with time zone | timestamptz | YES |  |
| expires_at | timestamp with time zone | timestamptz | NO | (now() + '48:00:00'::interval) |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| slack_pending_confirmations_matched_rcf_user_id_fkey | matched_rcf_user_id | company_users.id |
| slack_pending_confirmations_org_id_fkey | org_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| slack_pending_confirmations_confirmation_token_idx | CREATE UNIQUE INDEX slack_pending_confirmations_confirmation_token_idx ON public.slack_pending_confirmations USING btree (confirmation_token) |
| slack_pending_confirmations_org_expires_idx | CREATE INDEX slack_pending_confirmations_org_expires_idx ON public.slack_pending_confirmations USING btree (org_id, expires_at) |
| slack_pending_confirmations_org_status_idx | CREATE INDEX slack_pending_confirmations_org_status_idx ON public.slack_pending_confirmations USING btree (org_id, status, created_at DESC) |
| slack_pending_confirmations_pkey | CREATE UNIQUE INDEX slack_pending_confirmations_pkey ON public.slack_pending_confirmations USING btree (id) |
| slack_pending_confirmations_slack_user_idx | CREATE INDEX slack_pending_confirmations_slack_user_idx ON public.slack_pending_confirmations USING btree (org_id, slack_user_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Service role can manage slack pending confirmations | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |

#### stage_transitions

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| application_id | uuid | uuid | NO |  |
| from_stage_id | uuid | uuid | YES |  |
| to_stage_id | uuid | uuid | YES |  |
| moved_by | uuid | uuid | YES |  |
| notes | text | text | YES |  |
| auto_transitioned | boolean | bool | YES | false |
| moved_at | timestamp with time zone | timestamptz | YES | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| stage_transitions_application_id_fkey | application_id | candidate_applications.id |
| stage_transitions_from_stage_id_fkey | from_stage_id | hiring_pipeline_stages.id |
| stage_transitions_moved_by_fkey | moved_by | company_users.id |
| stage_transitions_to_stage_id_fkey | to_stage_id | hiring_pipeline_stages.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_transitions_application | CREATE INDEX idx_transitions_application ON public.stage_transitions USING btree (application_id) |
| idx_transitions_moved_at | CREATE INDEX idx_transitions_moved_at ON public.stage_transitions USING btree (moved_at DESC) |
| stage_transitions_pkey | CREATE UNIQUE INDEX stage_transitions_pkey ON public.stage_transitions USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins and HR can create stage transitions | INSERT | {public} |  | (application_id IN ( SELECT ca.id<br>   FROM ((candidate_applications ca<br>     JOIN job_postings jp ON ((jp.id = ca.job_posting_id)))<br>     JOIN company_users cu ON ((cu.company_id = jp.company_id)))<br>  WHERE ((cu.user_id = auth.uid()) AND (cu.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role]))))) |
| Users can view stage transitions in their company | SELECT | {public} | (application_id IN ( SELECT ca.id<br>   FROM ((candidate_applications ca<br>     JOIN job_postings jp ON ((jp.id = ca.job_posting_id)))<br>     JOIN company_users cu ON ((cu.company_id = jp.company_id)))<br>  WHERE (cu.user_id = auth.uid()))) |  |

#### task_assignments

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| task_id | uuid | uuid | NO |  |
| company_id | uuid | uuid | NO |  |
| primary_assignee_id | uuid | uuid | YES |  |
| secondary_assignee_id | uuid | uuid | YES |  |
| reasoning | jsonb | jsonb | NO | '{}'::jsonb |
| ai_score | numeric | numeric | YES |  |
| approved_at | timestamp with time zone | timestamptz | YES |  |
| approved_by | uuid | uuid | YES |  |
| outcome_status | text | text | YES |  |
| outcome_notes | text | text | YES |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |
| employee_status | text | text | YES | 'pending'::text |
| employee_notes | text | text | YES |  |
| employee_completed_at | timestamp with time zone | timestamptz | YES |  |
| notification_sent_at | timestamp with time zone | timestamptz | YES |  |
| assigner_email | text | text | YES |  |
| notify_on_completion | boolean | bool | YES | true |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| task_assignments_company_id_fkey | company_id | companies.id |
| task_assignments_primary_assignee_id_fkey | primary_assignee_id | company_users.id |
| task_assignments_secondary_assignee_id_fkey | secondary_assignee_id | company_users.id |
| task_assignments_task_id_fkey | task_id | work_tasks.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_task_assignments_employee_status | CREATE INDEX idx_task_assignments_employee_status ON public.task_assignments USING btree (employee_status) |
| idx_task_assignments_primary_assignee | CREATE INDEX idx_task_assignments_primary_assignee ON public.task_assignments USING btree (primary_assignee_id) |
| task_assignments_pkey | CREATE UNIQUE INDEX task_assignments_pkey ON public.task_assignments USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins can manage assignments | ALL | {public} | is_company_admin_for_company(auth.uid(), company_id) |  |

#### team_compatibility_scores

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| user_a_id | uuid | uuid | NO |  |
| user_b_id | uuid | uuid | NO |  |
| compatibility_score | numeric | numeric | NO |  |
| analysis | jsonb | jsonb | YES | '{}'::jsonb |
| calculated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| team_compatibility_scores_company_id_fkey | company_id | companies.id |
| team_compatibility_scores_user_a_id_fkey | user_a_id | company_users.id |
| team_compatibility_scores_user_b_id_fkey | user_b_id | company_users.id |

Indexes:
| Index | Definition |
| --- | --- |
| idx_team_compatibility_company | CREATE INDEX idx_team_compatibility_company ON public.team_compatibility_scores USING btree (company_id) |
| team_compatibility_scores_pkey | CREATE UNIQUE INDEX team_compatibility_scores_pkey ON public.team_compatibility_scores USING btree (id) |
| team_compatibility_scores_user_a_id_user_b_id_key | CREATE UNIQUE INDEX team_compatibility_scores_user_a_id_user_b_id_key ON public.team_compatibility_scores USING btree (user_a_id, user_b_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins can view compatibility scores | SELECT | {public} | is_company_admin_for_company(auth.uid(), company_id) |  |
| Service role can manage compatibility scores | ALL | {public} | ((auth.jwt() ->> 'role'::text) = 'service_role'::text) |  |

#### team_insights

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| insights | jsonb | jsonb | NO |  |
| team_hash | text | text | NO |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| team_insights_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| team_insights_company_id_idx | CREATE UNIQUE INDEX team_insights_company_id_idx ON public.team_insights USING btree (company_id) |
| team_insights_pkey | CREATE UNIQUE INDEX team_insights_pkey ON public.team_insights USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins can delete team insights | DELETE | {public} | (EXISTS ( SELECT 1<br>   FROM company_users cu<br>  WHERE ((cu.company_id = team_insights.company_id) AND (cu.user_id = auth.uid()) AND (cu.role = 'admin'::company_user_role)))) |  |
| Company admins can insert team insights | INSERT | {public} |  | (EXISTS ( SELECT 1<br>   FROM company_users cu<br>  WHERE ((cu.company_id = team_insights.company_id) AND (cu.user_id = auth.uid()) AND (cu.role = 'admin'::company_user_role)))) |
| Company admins can update team insights | UPDATE | {public} | (EXISTS ( SELECT 1<br>   FROM company_users cu<br>  WHERE ((cu.company_id = team_insights.company_id) AND (cu.user_id = auth.uid()) AND (cu.role = 'admin'::company_user_role)))) |  |
| Company admins can view their team insights | SELECT | {public} | (EXISTS ( SELECT 1<br>   FROM company_users cu<br>  WHERE ((cu.company_id = team_insights.company_id) AND (cu.user_id = auth.uid()) AND (cu.role = 'admin'::company_user_role)))) |  |

#### test_results

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| student_id | uuid | uuid | NO |  |
| school_id | uuid | uuid | NO |  |
| user_id | uuid | uuid | NO |  |
| primary_role | text | text | NO |  |
| secondary_role | text | text | NO |  |
| scores | jsonb | jsonb | NO |  |
| normalized_scores | jsonb | jsonb | NO |  |
| confidence | numeric | numeric | NO |  |
| consistency | numeric | numeric | NO |  |
| total_time | numeric | numeric | NO |  |
| avg_decision_time | numeric | numeric | NO |  |
| telemetry | jsonb | jsonb | YES |  |
| completed_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| test_results_school_id_fkey | school_id | schools.id |
| test_results_student_id_fkey | student_id | school_students.id |

Indexes:
| Index | Definition |
| --- | --- |
| test_results_pkey | CREATE UNIQUE INDEX test_results_pkey ON public.test_results USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| School admins can view their school results | SELECT | {authenticated} | (EXISTS ( SELECT 1<br>   FROM school_admins sa<br>  WHERE ((sa.school_id = test_results.school_id) AND (sa.user_id = auth.uid())))) |  |
| Students can insert own results | INSERT | {authenticated} |  | (user_id = auth.uid()) |
| Students can view own results | SELECT | {authenticated} | (user_id = auth.uid()) |  |
| Super admins can view all results | SELECT | {authenticated} | has_role(auth.uid(), 'admin'::app_role) |  |
| teachers_read_results | SELECT | {authenticated} | (school_id IN ( SELECT school_teachers.school_id<br>   FROM school_teachers<br>  WHERE (school_teachers.user_id = auth.uid()))) |  |

#### testimonials

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| name | text | text | NO |  |
| organization | text | text | NO |  |
| role_title | text | text | NO |  |
| problem_description | text | text | NO |  |
| results_benefits | text | text | NO |  |
| recommendation_score | integer | int4 | NO |  |
| liked_most | text | text | NO |  |
| advice_to_others | text | text | NO |  |
| permission_level | text | text | NO |  |
| video_testimonial_interest | text | text | NO |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| testimonials_pkey | CREATE UNIQUE INDEX testimonials_pkey ON public.testimonials USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins can view all testimonials | SELECT | {public} | (EXISTS ( SELECT 1<br>   FROM admin_users<br>  WHERE (admin_users.id = auth.uid()))) |  |
| Anyone can submit testimonials | INSERT | {public} |  | true |

#### user_roles

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| user_id | uuid | uuid | NO |  |
| role | USER-DEFINED | app_role | NO |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| created_by | uuid | uuid | YES |  |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| user_roles_pkey | CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id) |
| user_roles_user_id_role_key | CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Admins can manage all user roles | ALL | {authenticated} | is_admin(auth.uid()) | is_admin(auth.uid()) |
| Users can view their own roles | SELECT | {authenticated} | (auth.uid() = user_id) |  |

#### user_subscriptions

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| user_id | uuid | uuid | NO |  |
| stripe_customer_id | text | text | YES |  |
| stripe_subscription_id | text | text | YES |  |
| product_id | text | text | NO |  |
| price_id | text | text | YES |  |
| tier | text | text | NO |  |
| status | text | text | NO | 'active'::text |
| current_period_start | timestamp with time zone | timestamptz | YES |  |
| current_period_end | timestamp with time zone | timestamptz | YES |  |
| cancel_at_period_end | boolean | bool | YES | false |
| created_at | timestamp with time zone | timestamptz | YES | now() |
| updated_at | timestamp with time zone | timestamptz | YES | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| idx_user_subscriptions_status | CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions USING btree (status) |
| idx_user_subscriptions_user_id | CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions USING btree (user_id) |
| user_subscriptions_pkey | CREATE UNIQUE INDEX user_subscriptions_pkey ON public.user_subscriptions USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Users can insert their own subscriptions | INSERT | {public} |  | (auth.uid() = user_id) |
| Users can update their own subscriptions | UPDATE | {public} | (auth.uid() = user_id) |  |
| Users can view their own subscriptions | SELECT | {public} | (auth.uid() = user_id) |  |

#### voice_assessments

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| session_id | text | text | NO |  |
| phone_number | text | text | NO |  |
| assessment_type | text | text | NO | 'professional_25q'::text |
| score_yellow | integer | int4 | NO | 0 |
| score_red | integer | int4 | NO | 0 |
| score_green | integer | int4 | NO | 0 |
| score_blue | integer | int4 | NO | 0 |
| dominant_color | text | text | YES |  |
| status | text | text | NO | 'initiated'::text |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| NOT FOUND |  |  |

Indexes:
| Index | Definition |
| --- | --- |
| idx_voice_assessments_phone_number | CREATE INDEX idx_voice_assessments_phone_number ON public.voice_assessments USING btree (phone_number) |
| idx_voice_assessments_session_id | CREATE INDEX idx_voice_assessments_session_id ON public.voice_assessments USING btree (session_id) |
| idx_voice_assessments_status | CREATE INDEX idx_voice_assessments_status ON public.voice_assessments USING btree (status) |
| voice_assessments_pkey | CREATE UNIQUE INDEX voice_assessments_pkey ON public.voice_assessments USING btree (id) |
| voice_assessments_session_id_key | CREATE UNIQUE INDEX voice_assessments_session_id_key ON public.voice_assessments USING btree (session_id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Anyone can view results by phone number | SELECT | {public} | true |  |
| System can manage voice assessments | ALL | {public} | true |  |

#### work_tasks

RLS enabled: Yes; forced: No.

| Column | Type | UDT | Nullable | Default |
| --- | --- | --- | --- | --- |
| id | uuid | uuid | NO | gen_random_uuid() |
| company_id | uuid | uuid | NO |  |
| title | text | text | NO |  |
| description | text | text | YES |  |
| importance | USER-DEFINED | task_priority | NO | 'medium'::task_priority |
| urgency | USER-DEFINED | task_priority | NO | 'medium'::task_priority |
| quadrant | USER-DEFINED | covey_quadrant | NO | 'q4'::covey_quadrant |
| due_date | timestamp with time zone | timestamptz | YES |  |
| department | text | text | YES |  |
| required_skills | ARRAY | _text | YES | '{}'::text[] |
| status | USER-DEFINED | task_status | NO | 'pending'::task_status |
| created_by | uuid | uuid | NO |  |
| created_at | timestamp with time zone | timestamptz | NO | now() |
| updated_at | timestamp with time zone | timestamptz | NO | now() |

Foreign keys:
| Constraint | Column | References |
| --- | --- | --- |
| work_tasks_company_id_fkey | company_id | companies.id |

Indexes:
| Index | Definition |
| --- | --- |
| work_tasks_pkey | CREATE UNIQUE INDEX work_tasks_pkey ON public.work_tasks USING btree (id) |

Policies:
| Policy | Command | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| Company admins can manage tasks | ALL | {public} | is_company_admin_for_company(auth.uid(), company_id) |  |



### Views

#### slack_connection_statuses


```sql
 SELECT id,
    org_id,
    team_id,
    team_name,
    authed_user_id,
    incoming_webhook_channel,
    connected_at,
    is_active,
    created_at,
    updated_at,
    auto_add_users,
    email_mismatch_action,
    name_matching_enabled,
    admin_notify_on_new_user,
    admin_notify_channel,
    COALESCE(( SELECT (count(*))::integer AS count
           FROM slack_pending_confirmations spc
          WHERE ((spc.org_id = sc.org_id) AND (spc.status = 'pending'::text) AND (spc.expires_at > now()))), 0) AS pending_confirmations_count
   FROM slack_connections sc
  WHERE (EXISTS ( SELECT 1
           FROM company_users cu
          WHERE ((cu.company_id = sc.org_id) AND (cu.user_id = auth.uid()) AND (cu.status = 'active'::company_user_status) AND (cu.role = ANY (ARRAY['admin'::company_user_role, 'hr'::company_user_role])))));
```




### Public database functions

| Function | Args | Returns |
| --- | --- | --- |
| acquire_hiring_subscription_lock | p_company_id uuid, p_request_id text, p_ttl_seconds integer | TABLE(acquired boolean, current_request_id text, current_status text, current_expires_at timestamp with time zone) |
| can_school_accept_student | p_school_id uuid | boolean |
| disconnect_slack_connection | p_org_id uuid | jsonb |
| enforce_privileged_company_user_link | none | trigger |
| find_school_by_email | p_email text | uuid |
| generate_invite_code | none | text |
| generate_shareable_code | none | text |
| get_admin_action_logs | p_action_type text, p_actor_email text, p_date_from timestamp with time zone, p_date_to timestamp with time zone, p_page integer, p_page_size integer | TABLE(id uuid, actor_id uuid, actor_email text, action_type text, target_type text, target_id uuid, target_label text, metadata jsonb, created_at timestamp with time zone, total_count bigint) |
| get_admin_assessment_funnel | none | TABLE(total_started bigint, total_completed bigint, completion_rate numeric, question_25_count bigint, question_50_count bigint) |
| get_company_creation_cohorts | none | TABLE(week_start date, new_companies bigint, active_companies bigint, dormant_companies bigint) |
| get_rolecolor_distribution | p_company_id uuid | TABLE(role_color text, total bigint) |
| gin_extract_query_trgm | text, internal, smallint, internal, internal, internal, internal | internal |
| gin_extract_value_trgm | text, internal | internal |
| gin_trgm_consistent | internal, smallint, text, integer, internal, internal, internal, internal | boolean |
| gin_trgm_triconsistent | internal, smallint, text, integer, internal, internal, internal | "char" |
| gtrgm_compress | internal | internal |
| gtrgm_consistent | internal, text, smallint, oid, internal | boolean |
| gtrgm_decompress | internal | internal |
| gtrgm_distance | internal, text, smallint, oid, internal | double precision |
| gtrgm_in | cstring | gtrgm |
| gtrgm_options | internal | void |
| gtrgm_out | gtrgm | cstring |
| gtrgm_penalty | internal, internal, internal | internal |
| gtrgm_picksplit | internal, internal | internal |
| gtrgm_same | gtrgm, gtrgm, internal | internal |
| gtrgm_union | internal, internal | gtrgm |
| handle_profile_updated_at | none | trigger |
| handle_rcaimobile_new_user | none | trigger |
| has_role | _user_id uuid, _role app_role | boolean |
| is_admin | _user_id uuid | boolean |
| is_company_admin_for_company | _user_id uuid, _company_id uuid | boolean |
| is_school_admin | _school_id uuid, _user_id uuid | boolean |
| is_school_teacher | _school_id uuid, _user_id uuid | boolean |
| is_super_admin | uid uuid | boolean |
| is_valid_subdomain | subdomain text | boolean |
| list_auth_sessions | p_target_user_id uuid | TABLE(id uuid, user_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, ip text, user_agent text) |
| log_admin_action | p_actor_id uuid, p_actor_email text, p_action_type text, p_target_type text, p_target_id uuid, p_target_label text, p_metadata jsonb | uuid |
| log_candidate_activity | none | trigger |
| log_interview_activity | none | trigger |
| match_company_user_by_name | p_org_id uuid, p_name text | TABLE(company_user_id uuid, full_name text, job_role text, rolecolor text, match_confidence integer) |
| resolve_auth_user_id_by_email | _email text | uuid |
| revoke_auth_sessions | p_target_user_id uuid, p_session_id uuid | integer |
| seed_crm_for_new_user | none | trigger |
| set_limit | real | real |
| set_proposal_acceptance_updated_at | none | trigger |
| show_limit | none | real |
| show_trgm | text | text[] |
| similarity | text, text | real |
| similarity_dist | text, text | real |
| similarity_op | text, text | boolean |
| strict_word_similarity | text, text | real |
| strict_word_similarity_commutator_op | text, text | boolean |
| strict_word_similarity_dist_commutator_op | text, text | real |
| strict_word_similarity_dist_op | text, text | real |
| strict_word_similarity_op | text, text | boolean |
| update_applications_updated_at | none | trigger |
| update_client_proposals_updated_at | none | trigger |
| update_company_roles_updated_at | none | trigger |
| update_crm_updated_at | none | trigger |
| update_email_templates_updated_at | none | trigger |
| update_hiring_stages_updated_at | none | trigger |
| update_interviews_updated_at | none | trigger |
| update_job_applications_count | none | trigger |
| update_job_postings_updated_at | none | trigger |
| update_offers_updated_at | none | trigger |
| update_rcf_updated_at | none | trigger |
| update_updated_at_column | none | trigger |
| validate_company_subdomain | none | trigger |
| word_similarity | text, text | real |
| word_similarity_commutator_op | text, text | boolean |
| word_similarity_dist_commutator_op | text, text | real |
| word_similarity_dist_op | text, text | real |
| word_similarity_op | text, text | boolean |



### Triggers

| Table | Trigger | Timing | Event | Action |
| --- | --- | --- | --- | --- |
| access_codes | update_access_codes_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| admin_users | update_admin_users_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| assessment_results | update_assessment_results_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| ats_applications | update_ats_applications_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| ats_candidates | update_ats_candidates_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| ats_jobs | update_ats_jobs_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| blog_posts | update_blog_posts_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| candidate_applications | manage_job_applications_count | AFTER | DELETE | EXECUTE FUNCTION update_job_applications_count() |
| candidate_applications | manage_job_applications_count | AFTER | INSERT | EXECUTE FUNCTION update_job_applications_count() |
| candidate_applications | trigger_log_application_activity | AFTER | UPDATE | EXECUTE FUNCTION log_candidate_activity() |
| candidate_applications | trigger_log_application_activity | AFTER | INSERT | EXECUTE FUNCTION log_candidate_activity() |
| candidate_applications | update_applications_timestamp | BEFORE | UPDATE | EXECUTE FUNCTION update_applications_updated_at() |
| candidates | update_candidates_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| chatgpt_connections | update_chatgpt_connections_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| chatgpt_oauth_states | update_chatgpt_oauth_states_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| client_proposals | trg_client_proposals_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_client_proposals_updated_at() |
| companies | update_companies_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| companies | validate_subdomain_trigger | BEFORE | UPDATE | EXECUTE FUNCTION validate_company_subdomain() |
| companies | validate_subdomain_trigger | BEFORE | INSERT | EXECUTE FUNCTION validate_company_subdomain() |
| company_roles | update_company_roles_timestamp | BEFORE | UPDATE | EXECUTE FUNCTION update_company_roles_updated_at() |
| company_users | trg_enforce_privileged_company_user_link | BEFORE | UPDATE | EXECUTE FUNCTION enforce_privileged_company_user_link() |
| company_users | trg_enforce_privileged_company_user_link | BEFORE | INSERT | EXECUTE FUNCTION enforce_privileged_company_user_link() |
| company_users | update_company_users_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| crm_leads | update_crm_leads_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_crm_updated_at() |
| email_templates | update_email_templates_timestamp | BEFORE | UPDATE | EXECUTE FUNCTION update_email_templates_updated_at() |
| hiring_pipeline_stages | update_hiring_stages_timestamp | BEFORE | UPDATE | EXECUTE FUNCTION update_hiring_stages_updated_at() |
| hris_employees | update_hris_employees_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| interviews | trigger_log_interview_activity | AFTER | INSERT | EXECUTE FUNCTION log_interview_activity() |
| interviews | trigger_log_interview_activity | AFTER | UPDATE | EXECUTE FUNCTION log_interview_activity() |
| interviews | update_interviews_timestamp | BEFORE | UPDATE | EXECUTE FUNCTION update_interviews_updated_at() |
| job_postings | update_job_postings_timestamp | BEFORE | UPDATE | EXECUTE FUNCTION update_job_postings_updated_at() |
| merge_connections | update_merge_connections_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| merge_sync_errors | update_merge_sync_errors_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| offers | update_offers_timestamp | BEFORE | UPDATE | EXECUTE FUNCTION update_offers_updated_at() |
| profiles | on_profile_updated | BEFORE | UPDATE | EXECUTE FUNCTION handle_profile_updated_at() |
| proposal_acceptances | proposal_acceptances_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_proposal_acceptance_updated_at() |
| rcf_ai_narratives | update_rcf_ai_narratives_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_rcf_updated_at() |
| rcf_assessments | update_rcf_assessments_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_rcf_updated_at() |
| rcf_insight_layers | update_rcf_insight_layers_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_rcf_updated_at() |
| rcf_role_profiles | update_rcf_role_profiles_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_rcf_updated_at() |
| rcf_signals | update_rcf_signals_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_rcf_updated_at() |
| rcf_team_summaries | update_rcf_team_summaries_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_rcf_updated_at() |
| school_classes | update_school_classes_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| schools | update_schools_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| slack_connections | update_slack_connections_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| slack_pending_confirmations | update_slack_pending_confirmations_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| task_assignments | update_task_assignments_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| team_insights | update_team_insights_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| testimonials | update_testimonials_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| user_subscriptions | update_user_subscriptions_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| voice_assessments | update_voice_assessments_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| work_tasks | update_work_tasks_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |



### Storage buckets

| Bucket | Visibility | File size limit | Allowed MIME types |
| --- | --- | --- | --- |
| blog-images | public |  |  |
| candidate-resumes | private |  |  |
| company-logos | public |  |  |
| public-profile-photos | public | 5242880 | image/png, image/jpeg, image/webp |
| resumes | public | 10485760 | application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain |



### Cron jobs

| Job name | Schedule | Target | Status |
| --- | --- | --- | --- |
| bamboohr-auto-sync | */5 * * * * | /functions/v1/run-bamboohr-auto-sync | active |
| run-bamboohr-auto-sync-every-minute | * * * * * | /functions/v1/run-bamboohr-auto-sync | active |
| run-merge-auto-sync-every-15-minutes | */15 * * * * | /functions/v1/run-merge-auto-sync | active |



### Supabase realtime publications

NOT FOUND in linked metadata: `/tmp/rcf_realtime.json` returned no publication rows.



### Edge functions

| Function | Path | verify_jwt | Methods | What it does | What it accepts | What it returns |
| --- | --- | --- | --- | --- | --- | --- |
| add-credits | supabase/functions/add-credits/index.ts | true | OPTIONS | Adds billing credits to a company. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| add-seats-payment | supabase/functions/add-seats-payment/index.ts | false | OPTIONS | Charges for additional B2B seats. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| ai-follow-up | supabase/functions/ai-follow-up/index.ts | true | OPTIONS | AI follow-up chat endpoint used by fit and team insight modals. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| analyze-candidate-fit | supabase/functions/analyze-candidate-fit/index.ts | true | OPTIONS | Calculates and persists candidate fit score/analysis from RoleColor + resume data. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| analyze-career-resume | supabase/functions/analyze-career-resume/index.ts | NOT FOUND | OPTIONS | Handles Analyze Career Resume. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| analyze-csv-import | supabase/functions/analyze-csv-import/index.ts | true | NOT FOUND | Uses Gemini to analyze CSV imports for bulk user/candidate upload. | Body/interface fields: csvContent: string, sampleRows: number | Returns JSON error payloads on failure. |
| analyze-leadership | supabase/functions/analyze-leadership/index.ts | NOT FOUND | NOT FOUND | Handles Analyze Leadership. | Request schema not formally declared in this file; inspect source. | Returns JSON error payloads on failure. |
| analyze-role-assessment-need | supabase/functions/analyze-role-assessment-need/index.ts | NOT FOUND | NOT FOUND | Handles Analyze Role Assessment Need. | Body/interface fields: jobRole: string, teamSize?: number, responsibilities?: string | Returns JSON error payloads on failure. |
| analyze-task-assignment | supabase/functions/analyze-task-assignment/index.ts | true | NOT FOUND | AI + heuristic work-assignment ranking for the Work Matrix. | Request schema not formally declared in this file; inspect source. | Returns JSON error payloads on failure. |
| api-assessments | supabase/functions/api-assessments/index.ts | NOT FOUND | NOT FOUND | REST handlers for listing assessments and fetching results via the external API surface. | Request schema not formally declared in this file; inspect source. | Returns JSON error payloads on failure. |
| api-gateway | supabase/functions/api-gateway/index.ts | NOT FOUND | NOT FOUND | External REST API gateway that validates company API keys and routes /users, /assessments, and /company resources. | Request schema not formally declared in this file; inspect source. | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| api-users | supabase/functions/api-users/index.ts | NOT FOUND | NOT FOUND | CRUD-style REST handlers for company users via the external API surface. | Request schema not formally declared in this file; inspect source. | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| calculate-user-refund | supabase/functions/calculate-user-refund/index.ts | false | OPTIONS | Calculates refund amounts for a user/subscription. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| cancel-hiring-subscription | supabase/functions/cancel-hiring-subscription/index.ts | NOT FOUND | OPTIONS | Handles Cancel Hiring Subscription. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| celebrity-assessment | supabase/functions/celebrity-assessment/index.ts | NOT FOUND | NOT FOUND | Handles Celebrity Assessment. | Request schema not formally declared in this file; inspect source. | Returns JSON error payloads on failure. |
| charge-insight-redo | supabase/functions/charge-insight-redo/index.ts | NOT FOUND | OPTIONS | Handles Charge Insight Redo. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| charge-invite | supabase/functions/charge-invite/index.ts | false | OPTIONS | Charges a company invite credit. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| chatgpt-manage | supabase/functions/chatgpt-manage/index.ts | true | OPTIONS, POST | Loads, updates, syncs, and disconnects hidden ChatGPT connections. | Methods: OPTIONS, POST Actions: get, sync, disconnect, update_settings | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| chatgpt-mcp-server | supabase/functions/chatgpt-mcp-server/index.ts | false | OPTIONS, GET, POST | Hidden MCP server for OpenAI Apps SDK / ChatGPT integration. | Methods: OPTIONS, GET, POST | Returns JSON error payloads on failure. |
| chatgpt-oauth-callback | supabase/functions/chatgpt-oauth-callback/index.ts | false | OPTIONS, GET | Completes the ChatGPT connection flow and upserts chatgpt_connections. | Methods: OPTIONS, GET | Returns JSON error payloads on failure. May return HTTP redirect response. |
| chatgpt-oauth-init | supabase/functions/chatgpt-oauth-init/index.ts | false | OPTIONS, GET | Starts the ChatGPT connection state flow for B2B or personal mode. | Methods: OPTIONS, GET | Returns JSON error payloads on failure. May return HTTP redirect response. |
| check-payment-status | supabase/functions/check-payment-status/index.ts | false | OPTIONS | Checks Stripe/Supabase payment completion state. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| check-subscription | supabase/functions/check-subscription/index.ts | false | OPTIONS | Returns current personal subscription status and features. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| convert-candidate-to-employee | supabase/functions/convert-candidate-to-employee/index.ts | true | OPTIONS | Converts a hired candidate into a company user. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| create-audit-log | supabase/functions/create-audit-log/index.ts | false | OPTIONS | Writes audit log entries. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| create-b2b-payment | supabase/functions/create-b2b-payment/index.ts | false | OPTIONS | Creates one-time B2B checkout sessions. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| create-company | supabase/functions/create-company/index.ts | false | NOT FOUND | Creates a business/company record and its initial admin membership. | Request schema not formally declared in this file; inspect source. | Returns JSON error payloads on failure. |
| create-link-token | supabase/functions/create-link-token/index.ts | true | OPTIONS, POST | Creates a Merge Link token for a chosen HRIS/ATS category. | Methods: OPTIONS, POST Body/interface fields: orgId?: string, category?: "hris" \| "ats", platformName?: string, integration?: string \| null | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| create-payment | supabase/functions/create-payment/index.ts | false | OPTIONS | Creates Stripe checkout sessions for personal assessment purchases. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| create-probation-reminder | supabase/functions/create-probation-reminder/index.ts | true | OPTIONS, POST | Creates probation reminder rows after an offer is sent. | Methods: OPTIONS, POST Body/interface fields: offerId: string, companyId: string, adminCompanyUserId: string, probationPeriod: string, reminderAt: string | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| create-proposal-payment | supabase/functions/create-proposal-payment/index.ts | false | OPTIONS | Creates Stripe checkout sessions for client proposal payments. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| create-rcf-user | supabase/functions/create-rcf-user/index.ts | NOT FOUND | OPTIONS | Handles Create Rcf User. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| create-subscription-checkout | supabase/functions/create-subscription-checkout/index.ts | false | OPTIONS | Starts Stripe checkout for subscriptions. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| customer-portal | supabase/functions/customer-portal/index.ts | false | OPTIONS | Opens Stripe customer portal. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| delete-billing-entry | supabase/functions/delete-billing-entry/index.ts | NOT FOUND | OPTIONS | Handles Delete Billing Entry. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| delete-company | supabase/functions/delete-company/index.ts | true | OPTIONS | Deletes a company and related records after verification. | Methods: OPTIONS Actions: string, request, confirm | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| draft-task-email | supabase/functions/draft-task-email/index.ts | true | OPTIONS | Drafts a task email with AI assistance. | Methods: OPTIONS Body/interface fields: task: {, title: string, description: string, importance: string, urgency: string, dueDate?: string, requiredSkills: string[], }, additionalDetails: string, assigneeName: string, companyName: string, design?: EmailDesign | Returns JSON error payloads on failure. |
| fetch-google-workspace-users | supabase/functions/fetch-google-workspace-users/index.ts | true | NOT FOUND | Lists Google Workspace directory users for preview before import. | Request schema not formally declared in this file; inspect source. | Returns JSON error payloads on failure. |
| generate-ats-job-draft | supabase/functions/generate-ats-job-draft/index.ts | true | OPTIONS, POST | Generates ATS-specific AI job draft copy for manual posting. | Methods: OPTIONS, POST Body/interface fields: orgId?: string, targetPlatform?: string, job?: {, title?: string, department?: string, description?: string, location?: string, remotePolicy?: string, employmentType?: string, requiredExperienceYears?: number \| null, salaryMin?: number \| null, salaryMax?: number \| null | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. May return HTTP redirect response. |
| generate-impersonation-link | supabase/functions/generate-impersonation-link/index.ts | NOT FOUND | OPTIONS | Handles Generate Impersonation Link. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| generate-interview-questions | supabase/functions/generate-interview-questions/index.ts | true | OPTIONS | Generates interview questions for a role/job. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| generate-team-insights | supabase/functions/generate-team-insights/index.ts | true | OPTIONS | Generates AI team insights from company RoleColor data. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| get-company-employee-session | supabase/functions/get-company-employee-session/index.ts | false | NOT FOUND | Validates and hydrates the company employee local-session token. | Request schema not formally declared in this file; inspect source. | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| get-employee-data | supabase/functions/get-employee-data/index.ts | true | NOT FOUND | Fetches detailed company employee data for admins/HR. | Request schema not formally declared in this file; inspect source. | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| initiate-voice-call | supabase/functions/initiate-voice-call/index.ts | false | NOT FOUND | Starts a Bland AI voice assessment call. | Request schema not formally declared in this file; inspect source. | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| invite-candidate | supabase/functions/invite-candidate/index.ts | true | OPTIONS | Creates a candidate and sends candidate invite email. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| invite-company-user | supabase/functions/invite-company-user/index.ts | true | OPTIONS | Invites or re-invites company users, charges invite credits when needed, optionally sends Slack DMs. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| invite-family-member | supabase/functions/invite-family-member/index.ts | false | OPTIONS | Invites a family plan member; email sending still contains a TODO. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| list-rcf-b2b-companies | supabase/functions/list-rcf-b2b-companies/index.ts | true | OPTIONS | Super-admin listing endpoint for B2B companies. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| list-rcf-company-users | supabase/functions/list-rcf-company-users/index.ts | true | OPTIONS | Super-admin listing endpoint for company users. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| list-rcf-platform-users | supabase/functions/list-rcf-platform-users/index.ts | true | OPTIONS | Super-admin listing endpoint for platform user accounts. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| list-user-announcements | supabase/functions/list-user-announcements/index.ts | NOT FOUND | OPTIONS | Handles List User Announcements. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| manage-payment-method | supabase/functions/manage-payment-method/index.ts | false | OPTIONS | Creates or returns Stripe payment method management flow. | Methods: OPTIONS Actions: get_payment_method, setup_payment_method, charge_deployment_fee_if_needed | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| manage-super-admins | supabase/functions/manage-super-admins/index.ts | NOT FOUND | OPTIONS | Handles Manage Super Admins. | Methods: OPTIONS Actions: list, add | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| manage-user-sessions | supabase/functions/manage-user-sessions/index.ts | NOT FOUND | OPTIONS | Handles Manage User Sessions. | Methods: OPTIONS Actions: list, force_sign_out | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| notify-admin-new-employee | supabase/functions/notify-admin-new-employee/index.ts | false | NOT FOUND | Notifies admins after a new employee joins. | Request schema not formally declared in this file; inspect source. | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| notify-task-completion | supabase/functions/notify-task-completion/index.ts | false | OPTIONS | Sends completion notification when a task assignment is finished. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| parse-candidate-text | supabase/functions/parse-candidate-text/index.ts | NOT FOUND | OPTIONS | Handles Parse Candidate Text. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| parse-resume | supabase/functions/parse-resume/index.ts | false | OPTIONS | Parses resume files with OpenAI and updates candidate parsed content. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| process-monthly-billing | supabase/functions/process-monthly-billing/index.ts | false | OPTIONS | Processes monthly B2B billing. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| promote-company-user | supabase/functions/promote-company-user/index.ts | NOT FOUND | OPTIONS | Handles Promote Company User. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| purchase-insight-credits | supabase/functions/purchase-insight-credits/index.ts | NOT FOUND | OPTIONS | Handles Purchase Insight Credits. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| rcf-company-billing-admin | supabase/functions/rcf-company-billing-admin/index.ts | true | OPTIONS | Admin billing control endpoint for company accounts. | Methods: OPTIONS Actions: create_company, assign_admin, set_deployment_fee_waived, set_trial, add_free_credits, remove_credits | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| recover-assessment-by-email | supabase/functions/recover-assessment-by-email/index.ts | NOT FOUND | NOT FOUND | Handles Recover Assessment By Email. | Request schema not formally declared in this file; inspect source. | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| resend-invite | supabase/functions/resend-invite/index.ts | true | NOT FOUND | Re-sends company employee invites. | Request schema not formally declared in this file; inspect source. | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| resubscribe-hiring | supabase/functions/resubscribe-hiring/index.ts | NOT FOUND | OPTIONS | Handles Resubscribe Hiring. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| retrieve-token | supabase/functions/retrieve-token/index.ts | true | OPTIONS, POST | Lists Merge metadata/connections, exchanges public token, disconnects, and triggers initial sync. | Methods: OPTIONS, POST Body/interface fields: action?: RetrieveTokenAction, orgId?: string, category?: "hris" \| "ats", platformName?: string, integration?: string \| null, publicToken?: string Actions: list_connections, list_metadata, disconnect | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| retry-company-renewal-payment | supabase/functions/retry-company-renewal-payment/index.ts | NOT FOUND | OPTIONS | Handles Retry Company Renewal Payment. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| revoke-elevated-access | supabase/functions/revoke-elevated-access/index.ts | NOT FOUND | OPTIONS | Handles Revoke Elevated Access. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| run-bamboohr-auto-sync | supabase/functions/run-bamboohr-auto-sync/index.ts | false | OPTIONS | Cron-triggered BambooHR auto-sync runner. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| run-merge-auto-sync | supabase/functions/run-merge-auto-sync/index.ts | false | OPTIONS, POST | Cron-triggered Merge sync runner. | Methods: OPTIONS, POST | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| save-company-assessment | supabase/functions/save-company-assessment/index.ts | false | NOT FOUND | Saves a company-portal employee assessment result. | Request schema not formally declared in this file; inspect source. | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| send-assessment-email | supabase/functions/send-assessment-email/index.ts | true | OPTIONS, POST | Sends RoleColor assessment emails. | Methods: OPTIONS, POST Body/interface fields: to: string, candidateName: string, companyName: string, jobTitle?: string, assessmentCategory: string, assessmentType: "25q" \| "50q", idealRoleColor?: string \| null, inviteCode: string, assessmentUrl: string | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| send-candidate-email | supabase/functions/send-candidate-email/index.ts | true | OPTIONS, POST | Sends ad-hoc candidate emails. | Methods: OPTIONS, POST Body/interface fields: to: string, subject: string, message: string, candidateName: string, companyName: string | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| send-contact-reply | supabase/functions/send-contact-reply/index.ts | NOT FOUND | OPTIONS | Handles Send Contact Reply. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| send-email | supabase/functions/send-email/index.ts | false | OPTIONS, POST | Transactional email hook that relays outbound email through Resend. | Methods: OPTIONS, POST | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| send-interview-email | supabase/functions/send-interview-email/index.ts | true | OPTIONS, POST | Emails interview scheduling details. | Methods: OPTIONS, POST Body/interface fields: to: string, candidateName: string, companyName: string, jobTitle: string, interviewTitle: string, scheduledDate: string, scheduledTime: string, timezone: string, durationMinutes: number, interviewType: "video" \| "phone" \| "onsite", location?: string \| null, notes?: string \| null | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| send-offer-email | supabase/functions/send-offer-email/index.ts | true | OPTIONS, POST | Emails offers. | Methods: OPTIONS, POST Body/interface fields: to: string, candidateName: string, companyName: string, jobTitle: string, salary?: number \| null, currency: string, bonus?: number \| null, equity?: string \| null, startDate?: string \| null, offerExpires?: string \| null, probationPeriod?: string \| null, notes?: string \| null | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| send-rcf-password-reset | supabase/functions/send-rcf-password-reset/index.ts | true | OPTIONS | Sends admin-triggered password reset email. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| send-scheduled-reminders | supabase/functions/send-scheduled-reminders/index.ts | false | OPTIONS | Processes scheduled reminder rows and sends reminder emails. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| send-scheduled-report | supabase/functions/send-scheduled-report/index.ts | false | OPTIONS | Builds and emails scheduled reports. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| send-slack-notification | supabase/functions/send-slack-notification/index.ts | true | OPTIONS | Posts Slack channel or DM notifications for invites, completions, reminders, and tests. | Methods: OPTIONS Body/interface fields: company_id: string, event_type: "assessment_completed" \| "new_employee" \| "reminder" \| "task_assigned" \| "dm_invite" \| "share_results" \| "test_connection", data: Record<string, any> | Returns JSON error payloads on failure. |
| send-task-assignment-email | supabase/functions/send-task-assignment-email/index.ts | true | OPTIONS | Emails a task assignment. | Methods: OPTIONS Body/interface fields: to: string, subject: string, body?: string \| null, customHtml?: string \| null, taskId: string, assigneeId: string, companyName: string, senderEmail?: string, senderName?: string, design?: {, headerColor: string, accentColor: string | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| send-teams-notification | supabase/functions/send-teams-notification/index.ts | true | OPTIONS | Posts Microsoft Teams adaptive-card notifications to an incoming webhook. | Methods: OPTIONS Body/interface fields: company_id: string, event_type: "assessment_completed" \| "new_employee" \| "reminder" \| "task_assigned", data: Record<string, any> | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| slack-admin-settings | supabase/functions/slack-admin-settings/index.ts | true | OPTIONS, POST | Legacy/admin Slack settings endpoint (still configured). | Methods: OPTIONS, POST Actions: get, update_settings, approve_confirmation, reject_confirmation, resend_confirmation | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| slack-events | supabase/functions/slack-events/index.ts | false | OPTIONS | Slack Events API endpoint for team_join, app mentions, and DMs to the bot. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| slack-interactivity | supabase/functions/slack-interactivity/index.ts | false | OPTIONS | Slack interactivity endpoint for onboarding buttons and manual link flows. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| slack-link-confirmation | supabase/functions/slack-link-confirmation/index.ts | true | OPTIONS, POST | Authenticated portal endpoint for manual Slack account linking. | Methods: OPTIONS, POST Actions: fetch, confirm, reject | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| slack-manage | supabase/functions/slack-manage/index.ts | true | OPTIONS, POST | Admin Slack manage endpoint: settings, pending confirmations, mapping, workspace user list. | Methods: OPTIONS, POST Actions: get, update_settings, map_user, unlink_user, approve_confirmation, reject_confirmation, resend_confirmation | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| slack-oauth-callback | supabase/functions/slack-oauth-callback/index.ts | false | OPTIONS, GET | Finishes Slack OAuth and stores workspace tokens/settings. | Methods: OPTIONS, GET | Returns JSON error payloads on failure. May return HTTP redirect response. |
| slack-oauth-init | supabase/functions/slack-oauth-init/index.ts | false | OPTIONS, GET | Starts Slack OAuth install flow. | Methods: OPTIONS, GET | Returns JSON error payloads on failure. May return HTTP redirect response. |
| slack-rcf | supabase/functions/slack-rcf/index.ts | false | OPTIONS | Implements /rcf slash command and Slack quick actions/help. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| slack-rolecolor | supabase/functions/slack-rolecolor/index.ts | false | OPTIONS | Implements /rolecolor slash command. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| slack-teambalance | supabase/functions/slack-teambalance/index.ts | false | OPTIONS | Implements /teambalance slash command. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| subscribe-hiring-tab | supabase/functions/subscribe-hiring-tab/index.ts | NOT FOUND | OPTIONS | Handles Subscribe Hiring Tab. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| suggest-assessment-category | supabase/functions/suggest-assessment-category/index.ts | true | NOT FOUND | Suggests the best assessment category/type with AI. | Body/interface fields: jobRole: string, jobRoles?: string[]; // For bulk suggestions | Returns JSON error payloads on failure. |
| suggest-skills | supabase/functions/suggest-skills/index.ts | true | OPTIONS | Suggests skills for roles/tasks with AI. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| super-admin-toggle-hiring | supabase/functions/super-admin-toggle-hiring/index.ts | NOT FOUND | OPTIONS | Handles Super Admin Toggle Hiring. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| sync-ats | supabase/functions/sync-ats/index.ts | true | OPTIONS, POST | Manually re-syncs the active Merge ATS connection. | Methods: OPTIONS, POST Body/interface fields: orgId?: string | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| sync-bamboohr-hiring | supabase/functions/sync-bamboohr-hiring/index.ts | true | OPTIONS | Direct BambooHR ATS integration with two-way job sync and OAuth/token refresh. | Methods: OPTIONS Actions: get_status, update_preferences, authorize_url, sync_jobs | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| sync-google-workspace-users | supabase/functions/sync-google-workspace-users/index.ts | true | NOT FOUND | Imports or syncs Google Workspace users into company_users. | Request schema not formally declared in this file; inspect source. | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| sync-hris | supabase/functions/sync-hris/index.ts | true | OPTIONS, POST | Manually re-syncs the active Merge HRIS connection. | Methods: OPTIONS, POST Body/interface fields: orgId?: string | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| test-merge-connection | supabase/functions/test-merge-connection/index.ts | true | OPTIONS, POST | Runs a lightweight Merge connectivity test and updates connection state. | Methods: OPTIONS, POST Body/interface fields: orgId?: string, category?: "hris" \| "ats", platformName?: string | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| unhire-candidate | supabase/functions/unhire-candidate/index.ts | NOT FOUND | OPTIONS | Handles Unhire Candidate. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| update-company | supabase/functions/update-company/index.ts | NOT FOUND | OPTIONS | Handles Update Company. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| update-company-user-email | supabase/functions/update-company-user-email/index.ts | NOT FOUND | OPTIONS | Handles Update Company User Email. | Methods: OPTIONS | Returns JSON error payloads on failure. |
| update-daily-prorations | supabase/functions/update-daily-prorations/index.ts | false | OPTIONS | Updates daily proration state for portal billing. | Methods: OPTIONS | Returns JSON with success flag on happy path. |
| validate-api-key | supabase/functions/validate-api-key/index.ts | NOT FOUND | NOT FOUND | Validates an RCF company API key and returns the resolved company context. | Request schema not formally declared in this file; inspect source. | Returns JSON error payloads on failure. |
| verify-add-seats-payment | supabase/functions/verify-add-seats-payment/index.ts | false | OPTIONS | Verifies successful add-seat payment and updates company seats. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| verify-b2b-payment | supabase/functions/verify-b2b-payment/index.ts | false | OPTIONS | Verifies B2B Stripe checkout completion and provisions company billing state. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| verify-employee-invite | supabase/functions/verify-employee-invite/index.ts | false | NOT FOUND | Verifies employee invite code login for the company portal. | Request schema not formally declared in this file; inspect source. | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| verify-google-sso-employee | supabase/functions/verify-google-sso-employee/index.ts | false | NOT FOUND | Verifies Google SSO access for employee portal login. | Request schema not formally declared in this file; inspect source. | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| verify-hiring-subscription | supabase/functions/verify-hiring-subscription/index.ts | NOT FOUND | OPTIONS | Handles Verify Hiring Subscription. | Methods: OPTIONS | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| voiceAssessment | supabase/functions/voiceAssessment/index.ts | false | NOT FOUND | Processes Bland webhook events for the voice assessment flow and updates assessment state. | Request schema not formally declared in this file; inspect source. | Returns JSON with success flag on happy path. Returns JSON error payloads on failure. |
| webhook-handler | supabase/functions/webhook-handler/index.ts | false | OPTIONS, POST | Merge webhook endpoint for HRIS/ATS account updates. | Methods: OPTIONS, POST | Returns JSON error payloads on failure. |
## 4. Authentication
- **Auth provider**: Supabase Auth via `@supabase/supabase-js`.

- **Session storage**: browser `localStorage` via the Supabase client config (`persistSession: true`, `autoRefreshToken: true`).

- **Primary auth context**: `src/contexts/AuthContext.tsx` exposes `user`, `session`, `subscription`, `signUp`, `signIn`, `signInWithGoogle`, `signOut`, `resetPassword`, `updatePassword`, and `refreshSubscription`.

- **Google OAuth**: supported in personal auth and employee SSO flows. `signInWithGoogle()` optionally sends the hosted-domain (`hd`) hint; employee Google SSO is separately verified by `verify-google-sso-employee`.

- **Password reset / magic-link-like flows**: Supabase password reset uses `resetPasswordForEmail(..., redirectTo=/reset-password)`. Company and candidate portals use invite-code verification rather than Supabase magic links.

- **Business portal role model**: `CompanyContext.tsx` maps `company_users.role` to `admin | hr | partner | employee` and exposes a permission matrix. Admin has full access; HR can manage users/candidates but not settings; partner is read-only-ish with work matrix access; employee is diverted to task view.

- **Route guard**: `src/components/auth/ProtectedRoute.tsx` protects authenticated personal routes and optionally gates by subscription/payment state.

- **Company portal auth guard**: `CompanyPortalContext.tsx` restores an employee session from `localStorage` key `employee_session_${subdomain}` and hydrates it through `get-company-employee-session`.

- **Candidate portal auth guard**: `CandidatePortalContext.tsx` restores candidate portal session from `localStorage` key `candidate_session_${subdomain}_${code}` and resolves whether the portal is an invite or public-application flow.

- **Super-admin checks**: personal dashboard and admin pages query `platform_super_admins`, `admin_users`, and `platform_settings` to decide whether extra admin UI should appear.

- **2FA**: `/two-factor-enrollment` exists; dashboard also checks `platform_settings` for super-admin 2FA enforcement.

- **Important issue**: `AuthProvider` is mounted in both `src/main.tsx` and `src/App.tsx`, so auth context is duplicated today.
## 5. Routing
- **Router implementation**: React Router (`createBrowserRouter`) in `src/App.tsx`, with route definitions in `src/router.tsx`.

- **Layouts**: `Layout` adds `ScrollToTop`, footer, and back-to-top; `WorkspaceLayout` omits the marketing footer for workspace-like pages.

- **Protected routes**: `/settings/integrations` is explicitly wrapped in `ProtectedRoute`. Other routes often self-protect inside the rendered component/context rather than via router-level guards.

- **Dynamic routes**: `/:username`, `/result/:code`, `/leadership-results/:type`, `/company/:subdomain`, `/company/:subdomain/candidate/:code`, `/careers/:companySlug`, `/careers/:companySlug/jobs/:jobId`, `/client/:slug/*`.



| Path | Rendered component(s) | File path(s) | Protected? | Notes |
| --- | --- | --- | --- | --- |
| / | Index -> AnimatedAuth -> Dashboard | src/pages/Index.tsx, src/pages/AnimatedAuth.tsx, src/pages/Dashboard.tsx | No |  |
| /auth | AnimatedAuth -> Dashboard | src/pages/AnimatedAuth.tsx, src/pages/Dashboard.tsx | No |  |
| /dashboard | Dashboard -> PersonalIntegrationsPage | src/pages/Dashboard.tsx, src/pages/PersonalIntegrationsPage.tsx | Yes |  |
| /settings/integrations | PersonalIntegrationsPage | src/pages/PersonalIntegrationsPage.tsx | Yes |  |
| /change-password | ChangePassword -> TwoFactorEnrollment -> FreeAssessment | src/pages/ChangePassword.tsx, src/pages/TwoFactorEnrollment.tsx, src/pages/FreeAssessment.tsx | No |  |
| /two-factor-enrollment | TwoFactorEnrollment -> FreeAssessment -> FreeResults | src/pages/TwoFactorEnrollment.tsx, src/pages/FreeAssessment.tsx, src/pages/FreeResults.tsx | No |  |
| /free-assessment | FreeAssessment -> FreeResults -> CelebrityAssessment | src/pages/FreeAssessment.tsx, src/pages/FreeResults.tsx, src/pages/CelebrityAssessment.tsx | No |  |
| /free-results | FreeResults -> CelebrityAssessment -> CelebrityResults | src/pages/FreeResults.tsx, src/pages/CelebrityAssessment.tsx, src/pages/CelebrityResults.tsx | No |  |
| /celebrity-assessment | CelebrityAssessment -> CelebrityResults -> PremiumAssessment | src/pages/CelebrityAssessment.tsx, src/pages/CelebrityResults.tsx, src/pages/PremiumAssessment.tsx | No |  |
| /celebrity-results | CelebrityResults -> PremiumAssessment -> PremiumResults | src/pages/CelebrityResults.tsx, src/pages/PremiumAssessment.tsx, src/pages/PremiumResults.tsx | No |  |
| /premium-assessment | PremiumAssessment -> PremiumResults -> ProAssessment | src/pages/PremiumAssessment.tsx, src/pages/PremiumResults.tsx, src/pages/ProAssessment.tsx | No |  |
| /premium-results | PremiumResults -> ProAssessment -> ProResults | src/pages/PremiumResults.tsx, src/pages/ProAssessment.tsx, src/pages/ProResults.tsx | No |  |
| /pro-assessment | ProAssessment -> ProResults -> CareerFinder | src/pages/ProAssessment.tsx, src/pages/ProResults.tsx, src/pages/CareerFinder.tsx | No |  |
| /pro-results | ProResults -> CareerFinder -> CareerFinderResults | src/pages/ProResults.tsx, src/pages/CareerFinder.tsx, src/pages/CareerFinderResults.tsx | No |  |
| /career-finder | CareerFinder -> CareerFinderResults -> CareerResumeResults | src/pages/CareerFinder.tsx, src/pages/CareerFinderResults.tsx, src/pages/CareerResumeResults.tsx | No |  |
| /career-finder/results | CareerFinderResults -> CareerResumeResults -> CareerPaymentSuccess | src/pages/CareerFinderResults.tsx, src/pages/CareerResumeResults.tsx, src/pages/CareerPaymentSuccess.tsx | No |  |
| /career-finder/resume-results | CareerResumeResults -> CareerPaymentSuccess -> PaymentSuccess | src/pages/CareerResumeResults.tsx, src/pages/CareerPaymentSuccess.tsx, src/pages/PaymentSuccess.tsx | No |  |
| /career-payment-success | CareerPaymentSuccess -> PaymentSuccess -> Pricing | src/pages/CareerPaymentSuccess.tsx, src/pages/PaymentSuccess.tsx, src/pages/Pricing.tsx | No |  |
| /payment-success | PaymentSuccess -> Pricing -> Quiz | src/pages/PaymentSuccess.tsx, src/pages/Pricing.tsx, src/pages/Quiz.tsx | No |  |
| /pricing | Pricing -> Quiz -> Results | src/pages/Pricing.tsx, src/pages/Quiz.tsx, src/pages/Results.tsx | No |  |
| /quiz | Quiz -> Results -> ResetPassword | src/pages/Quiz.tsx, src/pages/Results.tsx, src/pages/ResetPassword.tsx | No |  |
| /results | Results -> ResetPassword -> Maintenance | src/pages/Results.tsx, src/pages/ResetPassword.tsx, src/pages/Maintenance.tsx | No |  |
| /reset-password | ResetPassword -> Maintenance -> PrivacyPolicy | src/pages/ResetPassword.tsx, src/pages/Maintenance.tsx, src/pages/PrivacyPolicy.tsx | No |  |
| /maintenance | Maintenance -> PrivacyPolicy -> TermsOfService | src/pages/Maintenance.tsx, src/pages/PrivacyPolicy.tsx, src/pages/TermsOfService.tsx | No |  |
| /privacy-policy | PrivacyPolicy -> TermsOfService -> About | src/pages/PrivacyPolicy.tsx, src/pages/TermsOfService.tsx, src/pages/About.tsx | No |  |
| /terms-of-service | TermsOfService -> About -> Contact | src/pages/TermsOfService.tsx, src/pages/About.tsx, src/pages/Contact.tsx | No |  |
| /about | About -> Contact -> Team | src/pages/About.tsx, src/pages/Contact.tsx, src/pages/Team.tsx | No |  |
| /contact | Contact -> Team -> SanjayDivakar | src/pages/Contact.tsx, src/pages/Team.tsx, src/pages/team/SanjayDivakar.tsx | No |  |
| /team | Team -> SanjayDivakar -> TristanBeley | src/pages/Team.tsx, src/pages/team/SanjayDivakar.tsx, src/pages/team/TristanBeley.tsx | No |  |
| /team/sanjay-divakar | SanjayDivakar -> TristanBeley -> TanishaSikder | src/pages/team/SanjayDivakar.tsx, src/pages/team/TristanBeley.tsx, src/pages/team/TanishaSikder.tsx | No |  |
| /team/tristan-beley | TristanBeley -> TanishaSikder -> AmitSuthar | src/pages/team/TristanBeley.tsx, src/pages/team/TanishaSikder.tsx, src/pages/team/AmitSuthar.tsx | No |  |
| /team/tanisha-sikder | TanishaSikder -> AmitSuthar -> KodyKrueger | src/pages/team/TanishaSikder.tsx, src/pages/team/AmitSuthar.tsx, src/pages/team/KodyKrueger.tsx | No |  |
| /team/amit-suthar | AmitSuthar -> KodyKrueger -> Sitemap | src/pages/team/AmitSuthar.tsx, src/pages/team/KodyKrueger.tsx, src/components/Sitemap.tsx | No |  |
| /team/kody-krueger | KodyKrueger -> Sitemap -> VoiceAssessment | src/pages/team/KodyKrueger.tsx, src/components/Sitemap.tsx, src/pages/VoiceAssessment.tsx | No |  |
| /sitemap | Sitemap -> VoiceAssessment -> VoiceResults | src/components/Sitemap.tsx, src/pages/VoiceAssessment.tsx, src/pages/VoiceResults.tsx | No |  |
| /voice-assessment | VoiceAssessment -> VoiceResults -> SharedResult | src/pages/VoiceAssessment.tsx, src/pages/VoiceResults.tsx, src/pages/SharedResult.tsx | No |  |
| /voice-results | VoiceResults -> SharedResult -> LeadershipAssessment | src/pages/VoiceResults.tsx, src/pages/SharedResult.tsx, src/pages/LeadershipAssessment.tsx | No |  |
| /result/:code | SharedResult -> LeadershipAssessment -> LeadershipResults | src/pages/SharedResult.tsx, src/pages/LeadershipAssessment.tsx, src/pages/LeadershipResults.tsx | No | Dynamic route |
| /leadership-assessment-privatedemo | LeadershipAssessment -> LeadershipResults | src/pages/LeadershipAssessment.tsx, src/pages/LeadershipResults.tsx | No |  |
| /leadership-results/:type | LeadershipResults -> LeadershipGame | src/pages/LeadershipResults.tsx, src/pages/LeadershipGame.tsx | No | Dynamic route |
| /leadership-results | LeadershipResults -> LeadershipGame -> LeadershipGame3D | src/pages/LeadershipResults.tsx, src/pages/LeadershipGame.tsx, src/pages/LeadershipGame3D.tsx | No |  |
| /leadership-game | LeadershipGame -> LeadershipGame3D -> AdminDashboard | src/pages/LeadershipGame.tsx, src/pages/LeadershipGame3D.tsx, src/pages/admin/AdminDashboard.tsx | No |  |
| /leadership-game-3d | LeadershipGame3D -> AdminDashboard -> RCFB2BAdminDashboard | src/pages/LeadershipGame3D.tsx, src/pages/admin/AdminDashboard.tsx, src/pages/admin/RCFB2BAdminDashboard.tsx | No |  |
| /admin | AdminDashboard -> RCFB2BAdminDashboard -> UserManagement | src/pages/admin/AdminDashboard.tsx, src/pages/admin/RCFB2BAdminDashboard.tsx, src/pages/admin/UserManagement.tsx | No |  |
| /admin/rcf-b2b | RCFB2BAdminDashboard -> UserManagement -> ProposalManager | src/pages/admin/RCFB2BAdminDashboard.tsx, src/pages/admin/UserManagement.tsx, src/pages/admin/ProposalManager.tsx | No |  |
| /admin/users | UserManagement -> ProposalManager -> B2B | src/pages/admin/UserManagement.tsx, src/pages/admin/ProposalManager.tsx, src/pages/B2B.tsx | No |  |
| /admin/proposals | ProposalManager -> B2B -> B2BSignIn | src/pages/admin/ProposalManager.tsx, src/pages/B2B.tsx, src/pages/b2b/B2BSignIn.tsx | No |  |
| /b2b | B2B -> B2BSignIn -> B2BPaymentSuccess | src/pages/B2B.tsx, src/pages/b2b/B2BSignIn.tsx, src/pages/b2b/B2BPaymentSuccess.tsx | No |  |
| /b2b/signin | B2BSignIn -> B2BPaymentSuccess -> SlackLinkPage | src/pages/b2b/B2BSignIn.tsx, src/pages/b2b/B2BPaymentSuccess.tsx, src/pages/SlackLinkPage.tsx | No |  |
| /b2b/payment-success | B2BPaymentSuccess -> SlackLinkPage -> ConfirmDeleteCompany | src/pages/b2b/B2BPaymentSuccess.tsx, src/pages/SlackLinkPage.tsx, src/pages/b2b/ConfirmDeleteCompany.tsx | No |  |
| /settings/integrations/slack/link | SlackLinkPage -> ConfirmDeleteCompany -> B2BDashboard | src/pages/SlackLinkPage.tsx, src/pages/b2b/ConfirmDeleteCompany.tsx, src/pages/b2b/B2BDashboard.tsx | No |  |
| /b2b/confirm-delete-company | ConfirmDeleteCompany -> B2BDashboard -> ProfessionalAssessment25Q | src/pages/b2b/ConfirmDeleteCompany.tsx, src/pages/b2b/B2BDashboard.tsx, src/pages/b2b/ProfessionalAssessment25Q.tsx | No |  |
| /b2b/company-portal | B2BDashboard -> ProfessionalAssessment25Q -> ProfessionalAssessment50Q | src/pages/b2b/B2BDashboard.tsx, src/pages/b2b/ProfessionalAssessment25Q.tsx, src/pages/b2b/ProfessionalAssessment50Q.tsx | No |  |
| /b2b/assessment-25q | ProfessionalAssessment25Q -> ProfessionalAssessment50Q -> ProfessionalResults | src/pages/b2b/ProfessionalAssessment25Q.tsx, src/pages/b2b/ProfessionalAssessment50Q.tsx, src/pages/b2b/ProfessionalResults.tsx | No |  |
| /b2b/assessment-50q | ProfessionalAssessment50Q -> ProfessionalResults -> TeacherCustomAssessment | src/pages/b2b/ProfessionalAssessment50Q.tsx, src/pages/b2b/ProfessionalResults.tsx, src/pages/school/TeacherCustomAssessment.tsx | No |  |
| /b2b/results | ProfessionalResults -> TeacherCustomAssessment -> StudentCustomAssessment | src/pages/b2b/ProfessionalResults.tsx, src/pages/school/TeacherCustomAssessment.tsx, src/pages/school/StudentCustomAssessment.tsx | No |  |
| /school/teachercustom | TeacherCustomAssessment -> StudentCustomAssessment -> AdminResults | src/pages/school/TeacherCustomAssessment.tsx, src/pages/school/StudentCustomAssessment.tsx, src/pages/school/AdminResults.tsx | No |  |
| /school/studentcustom | StudentCustomAssessment -> AdminResults | src/pages/school/StudentCustomAssessment.tsx, src/pages/school/AdminResults.tsx | No |  |
| /school/adminresults | AdminResults -> CompanyPortalLayout -> CompanyLanding -> CompanyLogin | src/pages/school/AdminResults.tsx, src/pages/company/CompanyPortalLayout.tsx, src/pages/company/CompanyLanding.tsx, src/pages/company/CompanyLogin.tsx | No |  |
| /company/:subdomain | CompanyPortalLayout -> CompanyLanding -> CompanyLogin -> CompanyAdminLogin -> CompanyHome -> CompanyAssessment -> CompanyResults | src/pages/company/CompanyPortalLayout.tsx, src/pages/company/CompanyLanding.tsx, src/pages/company/CompanyLogin.tsx, src/pages/company/CompanyAdminLogin.tsx, src/pages/company/CompanyHome.tsx, src/pages/company/CompanyAssessment.tsx, src/pages/company/CompanyResults.tsx | No | Dynamic route |
| login | CompanyLogin -> CompanyAdminLogin -> CompanyHome -> CompanyAssessment -> CompanyResults -> CandidatePortalLayout | src/pages/company/CompanyLogin.tsx, src/pages/company/CompanyAdminLogin.tsx, src/pages/company/CompanyHome.tsx, src/pages/company/CompanyAssessment.tsx, src/pages/company/CompanyResults.tsx, src/pages/candidate/CandidatePortalLayout.tsx | No |  |
| admin | CompanyAdminLogin -> CompanyHome -> CompanyAssessment -> CompanyResults -> CandidatePortalLayout -> CandidateLanding | src/pages/company/CompanyAdminLogin.tsx, src/pages/company/CompanyHome.tsx, src/pages/company/CompanyAssessment.tsx, src/pages/company/CompanyResults.tsx, src/pages/candidate/CandidatePortalLayout.tsx, src/pages/candidate/CandidateLanding.tsx | No |  |
| home | CompanyHome -> CompanyAssessment -> CompanyResults -> CandidatePortalLayout -> CandidateLanding -> CandidateLogin | src/pages/company/CompanyHome.tsx, src/pages/company/CompanyAssessment.tsx, src/pages/company/CompanyResults.tsx, src/pages/candidate/CandidatePortalLayout.tsx, src/pages/candidate/CandidateLanding.tsx, src/pages/candidate/CandidateLogin.tsx | No |  |
| assessment | CompanyAssessment -> CompanyResults -> CandidatePortalLayout -> CandidateLanding -> CandidateLogin -> CandidateAssessment | src/pages/company/CompanyAssessment.tsx, src/pages/company/CompanyResults.tsx, src/pages/candidate/CandidatePortalLayout.tsx, src/pages/candidate/CandidateLanding.tsx, src/pages/candidate/CandidateLogin.tsx, src/pages/candidate/CandidateAssessment.tsx | No |  |
| results | CompanyResults -> CandidatePortalLayout -> CandidateLanding -> CandidateLogin -> CandidateAssessment -> CandidateResults | src/pages/company/CompanyResults.tsx, src/pages/candidate/CandidatePortalLayout.tsx, src/pages/candidate/CandidateLanding.tsx, src/pages/candidate/CandidateLogin.tsx, src/pages/candidate/CandidateAssessment.tsx, src/pages/candidate/CandidateResults.tsx | No |  |
| candidate/:code | CandidatePortalLayout -> CandidateLanding -> CandidateLogin -> CandidateAssessment -> CandidateResults | src/pages/candidate/CandidatePortalLayout.tsx, src/pages/candidate/CandidateLanding.tsx, src/pages/candidate/CandidateLogin.tsx, src/pages/candidate/CandidateAssessment.tsx, src/pages/candidate/CandidateResults.tsx | No | Dynamic route |
| login | CandidateLogin -> CandidateAssessment -> CandidateResults | src/pages/candidate/CandidateLogin.tsx, src/pages/candidate/CandidateAssessment.tsx, src/pages/candidate/CandidateResults.tsx | No |  |
| assessment | CandidateAssessment -> CandidateResults -> PublicCareersPage | src/pages/candidate/CandidateAssessment.tsx, src/pages/candidate/CandidateResults.tsx, src/pages/careers/PublicCareersPage.tsx | No |  |
| results | CandidateResults -> PublicCareersPage | src/pages/candidate/CandidateResults.tsx, src/pages/careers/PublicCareersPage.tsx | No |  |
| /careers/:companySlug | PublicCareersPage -> PublicJobDetailPage -> ClientProposal | src/pages/careers/PublicCareersPage.tsx, src/pages/careers/PublicJobDetailPage.tsx, src/pages/client/ClientProposal.tsx | No | Dynamic route |
| /careers/:companySlug/jobs/:jobId | PublicJobDetailPage -> ClientProposal -> ProposalAgreement | src/pages/careers/PublicJobDetailPage.tsx, src/pages/client/ClientProposal.tsx, src/pages/client/ProposalAgreement.tsx | No | Dynamic route |
| /client/:slug | ClientProposal -> ProposalAgreement -> ProposalLOI | src/pages/client/ClientProposal.tsx, src/pages/client/ProposalAgreement.tsx, src/pages/client/ProposalLOI.tsx | No | Dynamic route |
| /client/:slug/agreement | ProposalAgreement -> ProposalLOI -> ProposalLOE | src/pages/client/ProposalAgreement.tsx, src/pages/client/ProposalLOI.tsx, src/pages/client/ProposalLOE.tsx | No | Dynamic route |
| /client/:slug/loi | ProposalLOI -> ProposalLOE -> ProposalPayment | src/pages/client/ProposalLOI.tsx, src/pages/client/ProposalLOE.tsx, src/pages/client/ProposalPayment.tsx | No | Dynamic route |
| /client/:slug/loe | ProposalLOE -> ProposalPayment -> ProposalSuccess | src/pages/client/ProposalLOE.tsx, src/pages/client/ProposalPayment.tsx, src/pages/client/ProposalSuccess.tsx | No | Dynamic route |
| /client/:slug/payment | ProposalPayment -> ProposalSuccess -> PublicRoleColorProfile | src/pages/client/ProposalPayment.tsx, src/pages/client/ProposalSuccess.tsx, src/pages/PublicRoleColorProfile.tsx | No | Dynamic route |
| /client/:slug/success | ProposalSuccess -> PublicRoleColorProfile -> NotFound | src/pages/client/ProposalSuccess.tsx, src/pages/PublicRoleColorProfile.tsx, src/pages/NotFound.tsx | No | Dynamic route |
| /:username | PublicRoleColorProfile -> NotFound | src/pages/PublicRoleColorProfile.tsx, src/pages/NotFound.tsx | No | Dynamic route |
| * | NotFound | src/pages/NotFound.tsx | No |  |
## 6. State Management
- **Global state approach**: mostly React Context + component state. No Redux or Zustand found.

- **React Query**: `QueryClientProvider` is mounted in `src/App.tsx`, but the codebase rarely uses `useQuery`/`useMutation`; most fetching is still manual `useEffect` + Supabase client calls.

- **Supabase realtime**: limited. `CompanyContext.tsx` subscribes to `companies` changes; no broad realtime publication usage was found in linked metadata.



### Context-backed stores

| Store/context | File | State / responsibility | Key actions |
| --- | --- | --- | --- |
| AuthContext | src/contexts/AuthContext.tsx | Supabase auth session + subscription metadata. | signUp, signIn, signInWithGoogle, signOut, resetPassword, updatePassword, refreshSubscription |
| CompanyContext | src/contexts/CompanyContext.tsx | Current company, current companyUser, permissions, list of all accessible companies. | refreshCompany, switchCompany |
| CompanyPortalContext | src/contexts/CompanyPortalContext.tsx | Company-branded employee portal session, company record, employee record, assessment result loading. | login/logout-style session restore helpers, fetchAssessmentResults |
| CandidatePortalContext | src/contexts/CandidatePortalContext.tsx | Candidate portal session, candidate/application link state, results loading, portal mode detection. | setCandidate, fetchAssessmentResults, session restore |
| B2BThemeContext | src/contexts/B2BThemeContext.tsx | Company branding/theme colors and derived CSS variables. | setTheme, applyTheme |
| HelpTourContext | src/contexts/HelpTourContext.tsx | Interactive tour state and completion tracking. | startTour, nextStep, dismissTour |



### Data fetching pattern

- Direct `supabase.from(...).select/update/insert` calls from components are the norm.

- Sensitive operations use `supabase.functions.invoke(...)` to hit Edge Functions.

- Frontend caches are ad hoc (e.g. `AssessmentsTab` cache maps, in-memory logo cache in `HiringIntegrationsTab`, toast reducer state).

- LocalStorage is heavily used for drafts, selected company, payment verification caches, completed tours, and portal sessions.
## 7. Components
### Reusable components inventory (all component files under `src/components`)

#### (root)
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| AssessmentDetails | src/components/AssessmentDetails.tsx | AssessmentDetails(props unknown or anonymous default export) | Assessment Details |
| BackToTop | src/components/BackToTop.tsx | BackToTop(props unknown or anonymous default export) | Back To Top |
| Footer | src/components/Footer.tsx | Footer(none) | Footer |
| PDFReport | src/components/PDFReport.tsx | PDFReport({ results, analysis, reportType }: PDFReportProps) | PDFReport |
| ScrollToTop | src/components/ScrollToTop.tsx | ScrollToTop(props unknown or anonymous default export) | Scroll To Top |
| Sitemap | src/components/Sitemap.tsx | Sitemap(props unknown or anonymous default export) | Sitemap |
| SubdomainRouter | src/components/SubdomainRouter.tsx | SubdomainRouter({ children }: SubdomainRouterProps) | Subdomain Router |

#### assessment
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| AutoSaveIndicator | src/components/assessment/AutoSaveIndicator.tsx | AutoSaveIndicator({ isSaving, lastSaved }: AutoSaveIndicatorProps) | Auto Save Indicator |
| PauseButton | src/components/assessment/PauseButton.tsx | PauseButton({ onSave, disabled }: PauseButtonProps) | Pause Button |
| ResumeProgressModal | src/components/assessment/ResumeProgressModal.tsx | ResumeProgressModal({ open, onResume, onStartFresh, answeredCount, totalQuestions, lastSavedAt, }: ResumeProgressModalProps) | Resume Progress Modal |

#### auth
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| ProtectedRoute | src/components/auth/ProtectedRoute.tsx | ProtectedRoute({ children, requiresPayment = false, assessmentType }: ProtectedRouteProps) | Protected Route |

#### b2b
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| ActivityFeed | src/components/b2b/ActivityFeed.tsx | ActivityFeed({ companyId, maxItems = 10, onViewAll }: ActivityFeedProps) | Activity Feed |
| AddCreditsModal | src/components/b2b/AddCreditsModal.tsx | AddCreditsModal({ open, onClose, companyId, currentBalance, onCreditsAdded, }: AddCreditsModalProps) | Add Credits Modal |
| AdminCompanyStatementModal | src/components/b2b/admin/AdminCompanyStatementModal.tsx | AdminCompanyStatementModal({ companyId, companyName, initialView = 'statement', open, onClose, }: AdminCompanyStatementModalProps) | Admin Company Statement Modal |
| ApiDocumentation | src/components/b2b/admin/ApiDocumentation.tsx | ApiDocumentation({ companyId }: ApiDocumentationProps) | Api Documentation |
| ApiKeyManagement | src/components/b2b/admin/ApiKeyManagement.tsx | ApiKeyManagement({ companyId }: ApiKeyManagementProps) | Api Key Management |
| AuditLogViewer | src/components/b2b/admin/AuditLogViewer.tsx | AuditLogViewer({ companyId }: AuditLogViewerProps) | Audit Log Viewer |
| ChatGPTIntegrationSettings | src/components/b2b/admin/ChatGPTIntegrationSettings.tsx | ChatGPTIntegrationSettings({ company, onSettingsSaved, }: ChatGPTIntegrationSettingsProps) | Chat GPTIntegration Settings |
| IntegrationsSettings | src/components/b2b/admin/IntegrationsSettings.tsx | IntegrationsSettings({ company, companyUser, onSettingsSaved }: IntegrationsSettingsProps) | Integrations Settings |
| ScheduledReportsManager | src/components/b2b/admin/ScheduledReportsManager.tsx | ScheduledReportsManager({ companyId }: ScheduledReportsManagerProps) | Scheduled Reports Manager |
| SlackIntegrationSettings | src/components/b2b/admin/SlackIntegrationSettings.tsx | SlackIntegrationSettings({ company, companyUser, onSettingsSaved, }: SlackIntegrationSettingsProps) | Slack Integration Settings |
| AIFollowUpChat | src/components/b2b/AIFollowUpChat.tsx | AIFollowUpChat({ contextType, contextData, initialContext, onSendMessage, }: AIFollowUpChatProps) | AIFollow Up Chat |
| AdvancedAnalyticsDashboard | src/components/b2b/analytics/AdvancedAnalyticsDashboard.tsx | AdvancedAnalyticsDashboard({ companyId, primaryColor = '#22c55e', secondaryColor = '#16a34a' }: AdvancedAnalyticsDashboardProps) | Advanced Analytics Dashboard |
| TeamCompatibilityMatrix | src/components/b2b/analytics/TeamCompatibilityMatrix.tsx | TeamCompatibilityMatrix({ companyId }: TeamCompatibilityMatrixProps) | Team Compatibility Matrix |
| AssessmentPreviewModal | src/components/b2b/AssessmentPreviewModal.tsx | AssessmentPreviewModal({ open, onClose, assessmentType: initialType = '25q', assessmentCategory: initialCategory = 'professional' }: AssessmentPreviewModalProps) | Assessment Preview Modal |
| AssessmentsTab | src/components/b2b/AssessmentsTab.tsx | AssessmentsTab({ company, onSettingsSaved, onNavigateToSettings }: AssessmentsTabProps); invalidateAssessmentsCache(companyId?: string) | Assessments Tab |
| BillingModal | src/components/b2b/BillingModal.tsx | BillingModal({ open, onClose, company }: BillingModalProps) | Billing Modal |
| BulkActionsBar | src/components/b2b/BulkActionsBar.tsx | BulkActionsBar({ selectedCount, onClear, onSendReminder, onResendInvite, onExport, onDelete, onBulkCategoryChange, isLoading = false, type = 'users', }: BulkActionsBarProps) | Bulk Actions Bar |
| BulkImportModal | src/components/b2b/BulkImportModal.tsx | BulkImportModal({ open, onClose, companyId, onImportComplete }: BulkImportModalProps) | Bulk Import Modal |
| CandidateBulkImportModal | src/components/b2b/CandidateBulkImportModal.tsx | CandidateBulkImportModal({ open, onClose, companyId, onImportComplete }: CandidateBulkImportModalProps) | Candidate Bulk Import Modal |
| CandidateDetailModal | src/components/b2b/CandidateDetailModal.tsx | CandidateDetailModal({ candidate, open, onOpenChange, analyzingFit, canHire = true, onViewResults, onViewFitAnalysis, onAnalyzeFit, onHire, onArchive, onDelete, onUploadResume, }: CandidateDetailModalProps) | Candidate Detail Modal |
| CandidateFitModal | src/components/b2b/CandidateFitModal.tsx | CandidateFitModal({ open, onClose, candidate, }: CandidateFitModalProps) | Candidate Fit Modal |
| CandidateResultsModal | src/components/b2b/CandidateResultsModal.tsx | CandidateResultsModal({ open, onClose, onCandidateUpdate, candidate, }: CandidateResultsModalProps) | Candidate Results Modal |
| CandidatesTab | src/components/b2b/CandidatesTab.tsx | CandidatesTab({ company, canHireCandidates = true, canManageCandidates = true }: CandidatesTabProps) | Candidates Tab |
| CreateApplicationLinkModal | src/components/b2b/CreateApplicationLinkModal.tsx | CreateApplicationLinkModal({ open, onClose, companyId, companySubdomain, onLinkCreated, }: CreateApplicationLinkModalProps) | Create Application Link Modal |
| CreditNotificationModal | src/components/b2b/CreditNotificationModal.tsx | CreditNotificationModal({ open, onClose, notifications, }: CreditNotificationModalProps) | Credit Notification Modal |
| DeleteCompanyModal | src/components/b2b/DeleteCompanyModal.tsx | DeleteCompanyModal({ open, onClose, company }: DeleteCompanyModalProps) | Delete Company Modal |
| EmailTemplateCustomizer | src/components/b2b/EmailTemplateCustomizer.tsx | EmailTemplateCustomizer({ company, onUpdate }: EmailTemplateCustomizerProps) | Email Template Customizer |
| EmployeeResultsModal | src/components/b2b/EmployeeResultsModal.tsx | EmployeeResultsModal({ open, onClose, email, results, completedAt, assessmentType = '25q', assessmentCategory = 'professional' }: EmployeeResultsModalProps) | Employee Results Modal |
| EmployeeTasksView | src/components/b2b/EmployeeTasksView.tsx | EmployeeTasksView(none) | Employee Tasks View |
| GlobalSearch | src/components/b2b/GlobalSearch.tsx | GlobalSearch({ companyId, open, onOpenChange, onSelectUser, onSelectCandidate, onSelectTask, }: GlobalSearchProps) | Global Search |
| GoogleWorkspaceImportModal | src/components/b2b/GoogleWorkspaceImportModal.tsx | GoogleWorkspaceImportModal({ open, onOpenChange, companyId, companyDomain, existingEmails, onImportComplete, mode = 'import', }: GoogleWorkspaceImportModalProps) | Google Workspace Import Modal |
| AddCandidateDialog | src/components/b2b/hiring/AddCandidateDialog.tsx | AddCandidateDialog({ companyId, open, onClose, onCandidateAdded, preSelectedJobId, }: AddCandidateDialogProps) | Add Candidate Dialog |
| AdvancedCandidateSearch | src/components/b2b/hiring/AdvancedCandidateSearch.tsx | AdvancedCandidateSearch({ companyId, onSearch, onReset, initialFilters, }: AdvancedCandidateSearchProps) | Advanced Candidate Search |
| BulkEmailComposer | src/components/b2b/hiring/BulkEmailComposer.tsx | BulkEmailComposer({ companyId, companyName, preSelectedCandidates = [], onClose, open, }: BulkEmailComposerProps) | Bulk Email Composer |
| CalendarIntegration | src/components/b2b/hiring/CalendarIntegration.tsx | CalendarIntegrationManager({ companyId, userId, }: CalendarIntegrationProps) | Calendar Integration |
| CandidateActivityTimeline | src/components/b2b/hiring/CandidateActivityTimeline.tsx | CandidateActivityTimeline({ candidateId, applicationId, companyId, companyUserId, companyUserName, compact = false, maxItems, }: CandidateActivityTimelineProps) | Candidate Activity Timeline |
| CandidateComparisonView | src/components/b2b/hiring/CandidateComparisonView.tsx | CandidateComparisonView({ companyId }: CandidateComparisonViewProps) | Candidate Comparison View |
| CandidateProfileDialog | src/components/b2b/hiring/CandidateProfileDialog.tsx | CandidateProfileDialog({ candidateId, companyId, open, onClose, }: CandidateProfileDialogProps) | Candidate Profile Dialog |
| CareerPageSettings | src/components/b2b/hiring/CareerPageSettings.tsx | CareerPageSettingsUI({ companyId, companyName, companySlug, }: CareerPageSettingsUIProps) | Career Page Settings |
| EmailTemplatesTab | src/components/b2b/hiring/EmailTemplatesTab.tsx | EmailTemplatesTab({ company, companyUser, }: EmailTemplatesTabProps) | Email Templates Tab |
| HiringAnalyticsTab | src/components/b2b/hiring/HiringAnalyticsTab.tsx | HiringAnalyticsTab({ company, companyUser, }: HiringAnalyticsTabProps) | Hiring Analytics Tab |
| HiringCandidatesTab | src/components/b2b/hiring/HiringCandidatesTab.tsx | HiringCandidatesTab({ company, companyUser, selectedJobId: initialJobId, }: HiringCandidatesTabProps) | Hiring Candidates Tab |
| HiringIntegrationsTab | src/components/b2b/hiring/HiringIntegrationsTab.tsx | HiringIntegrationsTab({ company, companyUser }: HiringIntegrationsTabProps) | Hiring Integrations Tab |
| HiringPipelineView | src/components/b2b/hiring/HiringPipelineView.tsx | HiringPipelineView({ company, companyUser, selectedJobId, onSelectJob, onNavigateToInterviews, onNavigateToOffers, }: HiringPipelineViewProps) | Hiring Pipeline View |
| HiringSection | src/components/b2b/hiring/HiringSection.tsx | HiringSection({ company, companyUser, onSubscriptionUpdated }: HiringSectionProps) | Hiring Section |
| InterviewQuestionGenerator | src/components/b2b/hiring/InterviewQuestionGenerator.tsx | InterviewQuestionGenerator({ companyId }: InterviewQuestionGeneratorProps) | Interview Question Generator |
| InterviewsTab | src/components/b2b/hiring/InterviewsTab.tsx | InterviewsTab({ company, companyUser, isActive = false, }: InterviewsTabProps) | Interviews Tab |
| JobPostingsTab | src/components/b2b/hiring/JobPostingsTab.tsx | JobPostingsTab({ company, companyUser, showCreateModal, onOpenCreateModal, onCloseCreateModal, onViewPipeline, onViewCandidates, }: JobPostingsTabProps) | Job Postings Tab |
| LegacyCandidatesTab | src/components/b2b/hiring/LegacyCandidatesTab.tsx | LegacyCandidatesTab({ company }: LegacyCandidatesTabProps) | Legacy Candidates Tab |
| MoveStageDialog | src/components/b2b/hiring/MoveStageDialog.tsx | MoveStageDialog({ applicationId, candidateId, candidateName, currentStageId, jobId, companyId, open, onClose, onMoved, }: MoveStageDialogProps) | Move Stage Dialog |
| OffersTab | src/components/b2b/hiring/OffersTab.tsx | OffersTab({ company, companyUser, }: OffersTabProps) | Offers Tab |
| ScheduleInterviewDialog | src/components/b2b/hiring/ScheduleInterviewDialog.tsx | ScheduleInterviewDialog({ applicationId, candidateId, candidateName, candidateEmail, companyName, jobTitle, companyId, open, onClose, onScheduled, candidateOptions = [], requireCandidateSelection = false, }: ScheduleInterviewDialogProps) | Schedule Interview Dialog |
| SendAssessmentDialog | src/components/b2b/hiring/SendAssessmentDialog.tsx | SendAssessmentDialog({ candidateId, candidateName, candidateEmail, jobTitle, companyName, companyId, open, onClose, onSent, }: SendAssessmentDialogProps) | Send Assessment Dialog |
| SendEmailDialog | src/components/b2b/hiring/SendEmailDialog.tsx | SendEmailDialog({ candidateId, candidateName, candidateEmail, companyName, companyId, open, onClose, }: SendEmailDialogProps) | Send Email Dialog |
| SendOfferDialog | src/components/b2b/hiring/SendOfferDialog.tsx | SendOfferDialog({ applicationId, candidateId, candidateName, candidateEmail, companyName, jobTitle, companyId, createdByCompanyUserId = null, open, onClose, onSent, candidateOptions = [], requireCandidateSelection = false, }: SendOfferDialogProps) | Send Offer Dialog |
| HiringSubscriptionSettings | src/components/b2b/HiringSubscriptionSettings.tsx | HiringSubscriptionSettings({ company, onSubscriptionUpdated }: HiringSubscriptionSettingsProps) | Hiring Subscription Settings |
| HiringUnlockedModal | src/components/b2b/HiringUnlockedModal.tsx | HiringUnlockedModal({ open, onClose, onStartTutorial, }: HiringUnlockedModalProps) | Hiring Unlocked Modal |
| InlineEditableCell | src/components/b2b/InlineEditableCell.tsx | InlineEditableCell({ value, onSave, placeholder = 'Click to edit', className, editable = true, }: InlineEditableCellProps) | Inline Editable Cell |
| InsightPaywallModal | src/components/b2b/InsightPaywallModal.tsx | InsightPaywallModal({ open, onClose, onPurchaseComplete, companyId, insightCredits, }: InsightPaywallModalProps) | Insight Paywall Modal |
| InsightUsageMeter | src/components/b2b/InsightUsageMeter.tsx | InsightUsageMeter({ companyId, onUsageChange, usageOverride = null, className = '' }: InsightUsageMeterProps) | Insight Usage Meter |
| InviteAdminModal | src/components/b2b/InviteAdminModal.tsx | InviteAdminModal({ open, onClose, companyId, defaultAssessmentType, onInviteComplete, }: InviteAdminModalProps) | Invite Admin Modal |
| InviteCandidateModal | src/components/b2b/InviteCandidateModal.tsx | InviteCandidateModal({ open, onClose, companyId, onInviteComplete, }: InviteCandidateModalProps) | Invite Candidate Modal |
| InviteUserModal | src/components/b2b/InviteUserModal.tsx | InviteUserModal({ open, onClose, companyId, onInviteComplete, onCompanyUpdate, }: InviteUserModalProps) | Invite User Modal |
| KeyboardShortcutsModal | src/components/b2b/KeyboardShortcutsModal.tsx | KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) | Keyboard Shortcuts Modal |
| ManageAdminModal | src/components/b2b/ManageAdminModal.tsx | ManageAdminModal({ open, onClose, admin, onActionComplete, }: ManageAdminModalProps) | Manage Admin Modal |
| TaskAssignmentOutput | src/components/b2b/matrix/TaskAssignmentOutput.tsx | TaskAssignmentOutput({ task, assignment, companyId, onApproved }: TaskAssignmentOutputProps) | Task Assignment Output |
| TaskEmailModal | src/components/b2b/matrix/TaskEmailModal.tsx | TaskEmailModal({ open, onClose, task, assignee, reasoning }: TaskEmailModalProps) | Task Email Modal |
| TaskHistoryPanel | src/components/b2b/matrix/TaskHistoryPanel.tsx | TaskHistoryPanel({ companyId, tasks, onRefresh }: TaskHistoryPanelProps) | Task History Panel |
| TaskIntakeForm | src/components/b2b/matrix/TaskIntakeForm.tsx | TaskIntakeForm({ companyId, onTaskCreated, isAnalyzing, setIsAnalyzing }: TaskIntakeFormProps) | Task Intake Form |
| MobileBottomNav | src/components/b2b/MobileBottomNav.tsx | MobileBottomNav({ activeTab, onChange, permissions }: MobileBottomNavProps) | Mobile Bottom Nav |
| OverviewTab | src/components/b2b/OverviewTab.tsx | OverviewTab({ company }: OverviewTabProps) | Overview Tab |
| PaymentMethodCard | src/components/b2b/PaymentMethodCard.tsx | PaymentMethodCard({ company, billingLock, onBillingResolved }: PaymentMethodCardProps) | Payment Method Card |
| PromoteToAdminModal | src/components/b2b/PromoteToAdminModal.tsx | PromoteToAdminModal({ open, onClose, user, onPromoteComplete, }: PromoteToAdminModalProps) | Promote To Admin Modal |
| RemindersHistoryTab | src/components/b2b/RemindersHistoryTab.tsx | RemindersHistoryTab({ company }: RemindersHistoryTabProps) | Reminders History Tab |
| ResumeUpload | src/components/b2b/ResumeUpload.tsx | ResumeUpload({ candidateId, companyId, existingResumeUrl, onUploadComplete, onRemove, compact = false, primaryColor = '#9b87f5', trigger, }: ResumeUploadProps) | Resume Upload |
| RoleAnalysisCard | src/components/b2b/RoleAnalysisCard.tsx | RoleAnalysisCard({ mode = "standalone", onCategorySelect, initialJobRole = "", showCategorySelect = true, }: RoleAnalysisCardProps) | Role Analysis Card |
| RolesTab | src/components/b2b/RolesTab.tsx | RolesTab({ company }: RolesTabProps) | Roles Tab |
| ScheduleReminderModal | src/components/b2b/ScheduleReminderModal.tsx | ScheduleReminderModal({ open, onClose, companyId, selectedUsers, onScheduled, }: ScheduleReminderModalProps) | Schedule Reminder Modal |
| SettingsTab | src/components/b2b/SettingsTab.tsx | SettingsTab({ company, companyUser, onSettingsSaved, scrollToSection, onScrollComplete, onDirtyChange, registerSaveHandler, billingOnly = false, billingLock = null, onResolveBillingLock, }: SettingsTabProps) | Settings Tab |
| TeamFrictionMapTab | src/components/b2b/TeamFrictionMapTab.tsx | TeamFrictionMapTab({ company }: TeamFrictionMapTabProps) | Team Friction Map Tab |
| TeamInsightsModal | src/components/b2b/TeamInsightsModal.tsx | TeamInsightsModal({ open, onClose, teamMembers, pendingMembers = [], companyId, onBillingUpdated, }: TeamInsightsModalProps) | Team Insights Modal |
| ThemeExportImport | src/components/b2b/ThemeExportImport.tsx | ThemeExportImport({ company, logoUrl, logoUrlDark, primaryColor, secondaryColor, onImport, onSettingsSaved, }: ThemeExportImportProps) | Theme Export Import |
| UserDetailModal | src/components/b2b/UserDetailModal.tsx | UserDetailModal({ user, open, onOpenChange, superAdminId, isSuperAdmin, currentUserId, currentUserEmail, allJobRoles, predefinedSkills, copiedId, resendingId, savingUserId, suggestingSkillsFor, suggestedSkills, onCopyCode, onResendInvite, onPromoteUser, onManageAdmin, onRevokeAccess, onRestoreAccess, onRestoreAndPromote, onDeleteUser, onRequestRetake, onSaveUserDetails, onSuggestSkills, canResend, getResendTooltip, getStatusBadge, cancelledReminders, canPromoteUsers = true, canManageAllRoles = true, }: UserDetailModalProps) | User Detail Modal |
| UserProfileSheet | src/components/b2b/UserProfileSheet.tsx | UserProfileSheet({ userId, companyId, open, onOpenChange, readOnly = false, onUserUpdate, }: UserProfileSheetProps) | User Profile Sheet |
| UsersTab | src/components/b2b/UsersTab.tsx | UsersTab({ company, onCompanyUpdate, readOnly = false, selectedUserId, onClearSelectedUser }: UsersTabProps) | Users Tab |
| WorkAssigningMatrixTab | src/components/b2b/WorkAssigningMatrixTab.tsx | WorkAssigningMatrixTab(none) | Work Assigning Matrix Tab |

#### career
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| ResumeCareerUpload | src/components/career/ResumeCareerUpload.tsx | ResumeCareerUpload({ primaryColor, userId }: ResumeCareerUploadProps) | Resume Career Upload |

#### company
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| EmployeeTasksKanban | src/components/company/EmployeeTasksKanban.tsx | EmployeeTasksKanban({ primaryColor = '#6366f1', secondaryColor = '#8b5cf6' }: Props) | Employee Tasks Kanban |

#### dashboard
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| ChangeEmailModal | src/components/dashboard/ChangeEmailModal.tsx | ChangeEmailModal({ open, onOpenChange, currentEmail }: ChangeEmailModalProps) | Change Email Modal |
| MobileSidebar | src/components/dashboard/MobileSidebar.tsx | MobileSidebar({ user, navItems, logoutItem, onAvatarChange }: MobileSidebarProps) | Mobile Sidebar |

#### game
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| GameUI | src/components/game/GameUI.tsx | GameUI({ scenario, npcName, onChoiceSelect, onClose, completedCount, totalCount, showOutcome, selectedOutcome, onContinue, }: GameUIProps) | Game UI |
| OfficeScene | src/components/game/OfficeScene.tsx | OfficeScene({ npcs, activeNPC, onNPCClick }: OfficeSceneProps) | Office Scene |
| PlayerController | src/components/game/PlayerController.tsx | PlayerController({ speed = 5 }: PlayerControllerProps) | Player Controller |

#### help
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| HelpButton | src/components/help/HelpButton.tsx | HelpButton({ tourFilter, className, size = 'default', iconOnly = false }: HelpButtonProps) | Help Button |
| index | src/components/help/index.ts | index(props unknown or anonymous default export) | index |
| TourTooltip | src/components/help/TourTooltip.tsx | TourTooltip(none) | Tour Tooltip |
| useAutoStartTour | src/components/help/useAutoStartTour.ts | useAutoStartTour(tourId: string, delay: number = 1000, condition: boolean = true) | use Auto Start Tour |

#### hero
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| StickyTextHero | src/components/hero/StickyTextHero.tsx | StickyTextHero(none) | Sticky Text Hero |

#### navigation
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| Navbar | src/components/navigation/Navbar.tsx | Navbar(props unknown or anonymous default export) | Navbar |

#### payment
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| PaymentButton | src/components/payment/PaymentButton.tsx | PaymentButton({ productType, children, className, variant = "default", size = "default", customAmount, customDescription }: PaymentButtonProps) | Payment Button |

#### pricing
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| LuminousPricingCard | src/components/pricing/LuminousPricingCard.tsx | LuminousPricingCard({ name, price, priceNote, target, description, features, cta, popular, icon: Icon, ctaAction }: LuminousPricingCardProps) | Luminous Pricing Card |

#### profile
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| PublicRoleColorProfileSettings | src/components/profile/PublicRoleColorProfileSettings.tsx | PublicRoleColorProfileSettings({ userId, userEmail, displayName, defaultAvatarUrl, assessments, }: PublicRoleColorProfileSettingsProps) | Public Role Color Profile Settings |

#### reports
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| RoleColorIdentityCard | src/components/reports/RoleColorIdentityCard.tsx | RoleColorIdentityCard({ name, primaryColor, secondaryColor, className }: RoleColorIdentityCardProps) | Role Color Identity Card |
| SendToFriendCard | src/components/reports/SendToFriendCard.tsx | SendToFriendCard({ color, className }: SendToFriendCardProps) | Send To Friend Card |

#### settings
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| PersonalChatGPTIntegrationCard | src/components/settings/PersonalChatGPTIntegrationCard.tsx | PersonalChatGPTIntegrationCard({ userEmail }: PersonalChatGPTIntegrationCardProps) | Personal Chat GPTIntegration Card |

#### subscription
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| FamilyMemberManager | src/components/subscription/FamilyMemberManager.tsx | FamilyMemberManager(none) | Family Member Manager |
| ProgressTracking | src/components/subscription/ProgressTracking.tsx | ProgressTracking(none) | Progress Tracking |
| SubscriptionCard | src/components/subscription/SubscriptionCard.tsx | SubscriptionCard({ tier, currentTier, isActive }: SubscriptionCardProps) | Subscription Card |
| SubscriptionStatus | src/components/subscription/SubscriptionStatus.tsx | SubscriptionStatus({ tier, subscriptionEnd, onRefresh }: SubscriptionStatusProps) | Subscription Status |

#### ui
| Name | File path | Props/export signature | What it renders |
| --- | --- | --- | --- |
| accordion | src/components/ui/accordion.tsx | accordion(props unknown or anonymous default export) | accordion |
| aceternity-sidebar | src/components/ui/aceternity-sidebar.tsx | useSidebar(none); SidebarProvider({ children, open: openProp, setOpen: setOpenProp, animate = true, }: { children: React.ReactNode; open?: boolean; setOpen?: React.Dispatch<React.SetStateAction<boolean>>; animate?: boolean; }); Sidebar({ children, open, setOpen, animate, }: { children: React.ReactNode; open?: boolean; setOpen?: React.Dispatch<React.SetStateAction<boolean>>; animate?: boolean; }); SidebarBody({ className, children, }: { className?: string; children: React.ReactNode; }); DesktopSidebar({ className, children, }: { className?: string; children: React.ReactNode; }); MobileSidebar({ className, children, }: { className?: string; children: React.ReactNode; }); SidebarLink({ link, className, ...props }: { link: Links; className?: string; props?: Omit<LinkProps, 'to'>; }) | aceternity sidebar |
| alert-dialog | src/components/ui/alert-dialog.tsx | alert-dialog(props unknown or anonymous default export) | alert dialog |
| alert | src/components/ui/alert.tsx | alert(props unknown or anonymous default export) | alert |
| animated-characters-login-demo | src/components/ui/animated-characters-login-demo.tsx | AnimatedCharactersLoginDemo(none) | animated characters login demo |
| animated-characters-login-page | src/components/ui/animated-characters-login-page.tsx | animated-characters-login-page(props unknown or anonymous default export) | animated characters login page |
| animated-group | src/components/ui/animated-group.tsx | animated-group(props unknown or anonymous default export) | animated group |
| aspect-ratio | src/components/ui/aspect-ratio.tsx | aspect-ratio(props unknown or anonymous default export) | aspect ratio |
| avatar | src/components/ui/avatar.tsx | avatar(props unknown or anonymous default export) | avatar |
| badge | src/components/ui/badge.tsx | badge(props unknown or anonymous default export) | badge |
| border-trail | src/components/ui/border-trail.tsx | BorderTrail({ className, size = 60, transition, delay, onAnimationComplete, style, }: BorderTrailProps) | border trail |
| breadcrumb | src/components/ui/breadcrumb.tsx | breadcrumb(props unknown or anonymous default export) | breadcrumb |
| button | src/components/ui/button.tsx | button(props unknown or anonymous default export) | button |
| calendar | src/components/ui/calendar.tsx | calendar(props unknown or anonymous default export) | calendar |
| card | src/components/ui/card.tsx | card(props unknown or anonymous default export) | card |
| carousel | src/components/ui/carousel.tsx | carousel(props unknown or anonymous default export) | carousel |
| chart | src/components/ui/chart.tsx | chart(props unknown or anonymous default export) | chart |
| checkbox | src/components/ui/checkbox.tsx | checkbox(props unknown or anonymous default export) | checkbox |
| collapsible | src/components/ui/collapsible.tsx | collapsible(props unknown or anonymous default export) | collapsible |
| command | src/components/ui/command.tsx | command(props unknown or anonymous default export) | command |
| contact-card-demo | src/components/ui/contact-card-demo.tsx | ContactCardDemo(none) | contact card demo |
| contact-card | src/components/ui/contact-card.tsx | ContactCard({ title = "Contact With Us", description = "If you have any questions regarding our Services or need help, please fill out the form here. We do our best to respond within 1 business day.", contactInfo, className, formSectionClassName, children, ...props }: ContactCardProps) | contact card |
| container-scroll-animation | src/components/ui/container-scroll-animation.tsx | ContainerScroll({ titleComponent, children, }: { titleComponent: string \| React.ReactNode; children: React.ReactNode; }); Header({ translate, titleComponent, }: { translate: MotionValue<number>; titleComponent: string \| React.ReactNode; }); Card({ rotate, scale, children, }: { rotate: MotionValue<number>; scale: MotionValue<number>; translate: MotionValue<number>; children: React.ReactNode; }) | container scroll animation |
| context-menu | src/components/ui/context-menu.tsx | context-menu(props unknown or anonymous default export) | context menu |
| demo | src/components/ui/demo.tsx | HeroScrollDemo(none) | demo |
| dialog | src/components/ui/dialog.tsx | dialog(props unknown or anonymous default export) | dialog |
| drawer | src/components/ui/drawer.tsx | drawer(props unknown or anonymous default export) | drawer |
| dropdown-menu | src/components/ui/dropdown-menu.tsx | dropdown-menu(props unknown or anonymous default export) | dropdown menu |
| expandable-text | src/components/ui/expandable-text.tsx | ExpandableText({ text, maxWords = 80, className = '' }: ExpandableTextProps); ExpandableOverview({ text, className = '' }: Omit<ExpandableTextProps, 'maxWords'>) | expandable text |
| faq-accordion | src/components/ui/faq-accordion.tsx | FAQAccordion({ items, className }: FAQAccordionProps) | faq accordion |
| flip-words | src/components/ui/flip-words.tsx | FlipWords({ words, duration = 3000, className, }: { words: string[]; duration?: number; className?: string; }) | flip words |
| floating-header | src/components/ui/floating-header.tsx | FloatingHeader(none) | floating header |
| form | src/components/ui/form.tsx | form(props unknown or anonymous default export) | form |
| glowing-effect | src/components/ui/glowing-effect.tsx | glowing-effect(props unknown or anonymous default export) | glowing effect |
| gooey-text-morphing | src/components/ui/gooey-text-morphing.tsx | GooeyText({ texts, morphTime = 1, cooldownTime = 0.25, className, textClassName }: GooeyTextProps) | gooey text morphing |
| header-demo | src/components/ui/header-demo.tsx | header-demo(props unknown or anonymous default export) | header demo |
| header | src/components/ui/header.tsx | header(props unknown or anonymous default export) | header |
| hero-section-with-gradient | src/components/ui/hero-section-with-gradient.tsx | HeroSectionWithGradient(none) | hero section with gradient |
| hover-card | src/components/ui/hover-card.tsx | hover-card(props unknown or anonymous default export) | hover card |
| hover-footer | src/components/ui/hover-footer.tsx | HoverFooter(none); TextHoverEffect({ text, duration, className, }: { text: string; duration?: number; automatic?: boolean; className?: string; }); FooterBackgroundGradient(none) | hover footer |
| hyper-text | src/components/ui/hyper-text.tsx | HyperText({ text, duration = 800, framerProps = { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 3 }, }, className, animateOnLoad = true, }: HyperTextProps) | hyper text |
| infinite-grid-integration | src/components/ui/infinite-grid-integration.tsx | infinite-grid-integration(props unknown or anonymous default export) | infinite grid integration |
| input-otp | src/components/ui/input-otp.tsx | input-otp(props unknown or anonymous default export) | input otp |
| input | src/components/ui/input.tsx | input(props unknown or anonymous default export) | input |
| interactive-hover-button | src/components/ui/interactive-hover-button.tsx | interactive-hover-button(props unknown or anonymous default export) | interactive hover button |
| interactive-text-particle | src/components/ui/interactive-text-particle.tsx | interactive-text-particle(props unknown or anonymous default export) | interactive text particle |
| label | src/components/ui/label.tsx | label(props unknown or anonymous default export) | label |
| logos3-demo | src/components/ui/logos3-demo.tsx | logos3-demo(props unknown or anonymous default export) | logos3 demo |
| logos3 | src/components/ui/logos3.tsx | logos3(props unknown or anonymous default export) | logos3 |
| menu-vertical | src/components/ui/menu-vertical.tsx | menu-vertical(props unknown or anonymous default export) | menu vertical |
| menubar | src/components/ui/menubar.tsx | menubar(props unknown or anonymous default export) | menubar |
| navigation-menu | src/components/ui/navigation-menu.tsx | navigation-menu(props unknown or anonymous default export) | navigation menu |
| pagination | src/components/ui/pagination.tsx | pagination(props unknown or anonymous default export) | pagination |
| popover | src/components/ui/popover.tsx | popover(props unknown or anonymous default export) | popover |
| pricing-cards | src/components/ui/pricing-cards.tsx | pricing-cards(props unknown or anonymous default export) | pricing cards |
| pricing-demo | src/components/ui/pricing-demo.tsx | pricing-demo(props unknown or anonymous default export) | pricing demo |
| progress | src/components/ui/progress.tsx | progress(props unknown or anonymous default export) | progress |
| radio-group | src/components/ui/radio-group.tsx | radio-group(props unknown or anonymous default export) | radio group |
| resizable | src/components/ui/resizable.tsx | resizable(props unknown or anonymous default export) | resizable |
| scroll-area | src/components/ui/scroll-area.tsx | scroll-area(props unknown or anonymous default export) | scroll area |
| scroll-expansion-hero | src/components/ui/scroll-expansion-hero.tsx | scroll-expansion-hero(props unknown or anonymous default export) | scroll expansion hero |
| scroll-reveal | src/components/ui/scroll-reveal.tsx | ScrollReveal({ children, className, preset = "fade-up", delay = 0, duration = 0.6, once = true, threshold = 0.2, }: ScrollRevealProps); ScrollRevealGroup({ children, className, preset = "fade-up", staggerDelay = 0.1, duration = 0.6, once = true, threshold = 0.2, }: ScrollRevealGroupProps) | scroll reveal |
| select | src/components/ui/select.tsx | select(props unknown or anonymous default export) | select |
| separator | src/components/ui/separator.tsx | separator(props unknown or anonymous default export) | separator |
| sheet | src/components/ui/sheet.tsx | sheet(props unknown or anonymous default export) | sheet |
| sidebar | src/components/ui/sidebar.tsx | sidebar(props unknown or anonymous default export) | sidebar |
| sign-in-flow | src/components/ui/sign-in-flow.tsx | SignInPage({ className, onSuccess }: { className?: string; onSuccess?: () | sign in flow |
| single-pricing-card | src/components/ui/single-pricing-card.tsx | SinglePricingCard(none) | single pricing card |
| skeleton | src/components/ui/skeleton.tsx | skeleton(props unknown or anonymous default export) | skeleton |
| slide-tabs | src/components/ui/slide-tabs.tsx | SlideTabs({ tabs }: SlideTabsProps) | slide tabs |
| slider | src/components/ui/slider.tsx | slider(props unknown or anonymous default export) | slider |
| sonner | src/components/ui/sonner.tsx | sonner(props unknown or anonymous default export) | sonner |
| stacked-color-bar | src/components/ui/stacked-color-bar.tsx | StackedColorBar({ segments, height = 'h-3', className, showLabels = false, }: StackedColorBarProps); ScoreBarLeftAligned({ label, score, max = 100, color, className, }: ScoreBarLeftAlignedProps) | stacked color bar |
| switch | src/components/ui/switch.tsx | switch(props unknown or anonymous default export) | switch |
| table | src/components/ui/table.tsx | table(props unknown or anonymous default export) | table |
| tabs | src/components/ui/tabs.tsx | tabs(props unknown or anonymous default export) | tabs |
| testimonials-carousel | src/components/ui/testimonials-carousel.tsx | TestimonialsCarousel(none) | testimonials carousel |
| testimonials-columns-1 | src/components/ui/testimonials-columns-1.tsx | TestimonialsColumn(props: { className?: string; testimonials: TestimonialItem[]; duration?: number; }) | testimonials columns 1 |
| testimonials-columns | src/components/ui/testimonials-columns.tsx | TestimonialsColumns(none) | testimonials columns |
| textarea | src/components/ui/textarea.tsx | textarea(props unknown or anonymous default export) | textarea |
| toast | src/components/ui/toast.tsx | toast(props unknown or anonymous default export) | toast |
| toaster | src/components/ui/toaster.tsx | Toaster(none) | toaster |
| toggle-group | src/components/ui/toggle-group.tsx | toggle-group(props unknown or anonymous default export) | toggle group |
| toggle | src/components/ui/toggle.tsx | toggle(props unknown or anonymous default export) | toggle |
| tooltip | src/components/ui/tooltip.tsx | tooltip(props unknown or anonymous default export) | tooltip |
| truncated-text | src/components/ui/truncated-text.tsx | TruncatedText({ text, fallback = <span className="text-muted-foreground">Not set</span>, maxWidth = "150px", className, tooltipSide = "top", }: TruncatedTextProps) | truncated text |
| use-toast | src/components/ui/use-toast.ts | use-toast(props unknown or anonymous default export) | use toast |
| user-profile-sidebar | src/components/ui/user-profile-sidebar.tsx | user-profile-sidebar(props unknown or anonymous default export) | user profile sidebar |



### Custom hooks

| Hook/file | File path | Exports/signature | Purpose |
| --- | --- | --- | --- |
| use-mobile | src/hooks/use-mobile.tsx | useIsMobile(none) | use mobile |
| use-toast | src/hooks/use-toast.ts | NOT FOUND | use toast |
| useAssessmentProgress | src/hooks/useAssessmentProgress.ts | useAssessmentProgress({ assessmentType, totalQuestions, autoSaveInterval = 5000, }: UseAssessmentProgressOptions) | use Assessment Progress |
| useKeyboardShortcuts | src/hooks/useKeyboardShortcuts.ts | useKeyboardShortcuts({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) | use Keyboard Shortcuts |
| useRoleColorSuggestion | src/hooks/useRoleColorSuggestion.ts | suggestRoleColor(positionTitle: string); useRoleColorSuggestion(none) | use Role Color Suggestion |
| useSubdomainDetection | src/hooks/useSubdomainDetection.ts | useSubdomainDetection(none); getSubdomainFromHostname(none) | use Subdomain Detection |



### Design system / component library

- Primary design system is **shadcn-ui + Radix-style primitives** under `src/components/ui`.

- Tailwind CSS is the styling foundation.

- Additional visual systems include Aceternity-style sidebar/hero components, Framer Motion animations, and Recharts for analytics.
## 8. RoleColor System
| Color | Common archetype labels found in code | Primary description from UI copy | Key files |
| --- | --- | --- | --- |
| Red | Motivator; Inspirational Leader | Enthusiastic, people-focused, energizes teams, strong communicator and connector. | src/pages/company/CompanyResults.tsx; src/pages/candidate/CandidateResults.tsx; src/lib/teamFrictionMap.ts; supabase/functions/_shared/chatgpt.ts |
| Yellow | Executor; Action-Oriented Leader | Decisive, results-focused, action-oriented, fast-paced, execution-heavy. | src/pages/company/CompanyResults.tsx; src/pages/candidate/CandidateResults.tsx; src/lib/careerData.ts; supabase/functions/_shared/chatgpt.ts |
| Green | Organizer; Analytical Leader; Architect; Strategist | Systematic, structured, analytical, process/quality focused. | src/pages/company/CompanyResults.tsx; src/pages/candidate/CandidateResults.tsx; src/lib/teamFrictionMap.ts; src/lib/careerData.ts; supabase/functions/_shared/chatgpt.ts |
| Blue | Innovator; Creator; Visionary; Connector | Creative, future-focused, strategic, idea-driven and/or relationship-aware depending on subsystem. | src/pages/company/CompanyResults.tsx; src/pages/candidate/CandidateResults.tsx; src/lib/teamFrictionMap.ts; src/lib/careerData.ts; supabase/functions/_shared/chatgpt.ts |



### Assessment flow end to end

- Question banks live in `src/lib/professionalAssessmentQuestions.ts`, `entrepreneurAssessmentQuestions.ts`, `executiveAssessmentQuestions.ts`, `managerAssessmentQuestions.ts`, `studentAssessmentQuestions.ts`, and `teacherAssessmentQuestions.ts`.

- `src/lib/assessmentQuestionLoader.ts` centralizes category/type selection and display labels. Supported categories include `professional`, `entrepreneur`, `executive`, and `manager`; types include `25q` and `50q`.

- `src/lib/assessmentScoring.ts` performs color counting and category aggregation. `calculateResults()` builds `colorScores`, chooses `primaryColor` and `secondaryColor`, computes `spectrumPosition`, and derives category scores differently for 25-question and 50-question formats.

- Personal assessments write to `assessment_results`; in-progress personal assessments are stored in `assessment_progress`; company/candidate assessments also write `assessment_results` and back-link their owning company/candidate row.

- Candidate/company portal assessments save via direct Supabase insert or via `save-company-assessment` edge function depending on flow.

- Results are displayed through report components like `AssessmentDetails`, `RoleColorIdentityCard`, PDF exporters in `src/lib/*PdfExport.ts`, and many page-specific result screens.



### How RoleColor is stored

- Raw outputs are stored as JSON in `assessment_results.results`.

- Dominant/secondary colors are typically stored inside the JSON payload rather than first-class columns.

- Business features often join `company_users.assessment_result_id -> assessment_results.id`.

- Candidate flows join `candidates.assessment_result_id -> assessment_results.id`.

- Merge HRIS enrichment can attach RoleColor back to `hris_employees.rolecolor_id` / status fields.



### RoleColor business logic already in code

- `src/lib/teamFrictionMap.ts`: pairwise compatibility/fear/watchout/next-step logic, used by Team Friction Map.

- `supabase/functions/analyze-candidate-fit/index.ts`: candidate fit score based on dominant/secondary color match plus optional OpenAI resume analysis. Leadership potential is treated as high if Red or Yellow is primary or secondary.

- `src/components/b2b/analytics/TeamCompatibilityMatrix.tsx`: team compatibility visualization.

- `supabase/functions/_shared/chatgpt.ts`: compatibility scores, communication advice, conflict advice, team composition, gap analysis, health scoring, succession planning, cloning, and department comparison for MCP tools.



### Important inconsistency to know before editing

- The repo does **not** use one canonical archetype naming system. Yellow/Red are relatively consistent (Executor/Motivator), but Green and Blue vary by subsystem: Organizer vs Architect vs Strategist for Green, and Innovator vs Visionary vs Connector for Blue. This inconsistency is real in current code and must be handled carefully.
## 9. Integrations Already Built
| Integration | Type | Status / flow | Edge functions | Primary tables touched |
| --- | --- | --- | --- | --- |
| Slack | Chat | Visible in Business Settings -> Integrations. Slack OAuth install; stores workspace bot token in slack_connections; supports slash commands, DM/app-mention assistant, onboarding automations, manual user mapping, admin settings. | slack-oauth-init, slack-oauth-callback, slack-rolecolor, slack-teambalance, slack-rcf, slack-events, slack-interactivity, slack-link-confirmation, slack-manage, send-slack-notification | slack_connections, slack_errors, slack_interactions, slack_pending_confirmations, company_users |
| Microsoft Teams | Chat | Visible in Business Settings -> Integrations. Simple incoming webhook setup stored on companies row; sends adaptive-card notifications. | send-teams-notification | companies |
| Merge.dev HRIS | HRIS | Visible in Hiring -> Integrations. One active HRIS at a time per org; 46 supported HRIS platforms; connects via Merge Link; syncs employees and RoleColor mapping. | create-link-token, retrieve-token, sync-hris, webhook-handler, run-merge-auto-sync, test-merge-connection | merge_connections, hris_employees, merge_sync_errors, assessments/company_users linkages |
| Merge.dev ATS | ATS | Visible in Hiring -> Integrations. One active ATS at a time per org; 33 supported ATS platforms; syncs jobs/candidates/applications into ATS bridge tables and local hiring tables. | create-link-token, retrieve-token, sync-ats, webhook-handler, run-merge-auto-sync, generate-ats-job-draft, test-merge-connection | merge_connections, ats_jobs, ats_candidates, ats_applications, merge_sync_errors, job_postings, candidate_applications, candidates |
| BambooHR direct hiring sync | ATS/HRIS | Backend-only direct BambooHR OAuth integration outside Merge. Supports BambooHR -> RCF job sync and RCF -> BambooHR job push, plus auto-sync. No visible integration card found in current frontend. | sync-bamboohr-hiring, run-bamboohr-auto-sync | bamboohr_integrations, job_postings, hiring_pipeline_stages |
| Google Workspace import | Directory import | User import modal inside Users tab; fetches directory users then imports/invites into company_users. Not a top-level integrations card. | fetch-google-workspace-users, sync-google-workspace-users, invite-company-user | company_users, companies |
| ChatGPT / OpenAI Apps SDK | AI | Backend + hidden UI only. ChatGPT cards/components still exist in code but are intentionally hidden from visible settings pages. MCP server and manage endpoints remain deployed. | chatgpt-mcp-server, chatgpt-oauth-init, chatgpt-oauth-callback, chatgpt-manage | chatgpt_connections, chatgpt_oauth_states, chatgpt_tool_calls |
| External API keys | API | Business Settings -> API exposes company API keys for api.rolecolorfinder.com REST API. | api-gateway, api-users, api-assessments, validate-api-key | company_api_keys, audit_logs |



### Merge.dev catalog enabled in code

HRIS platforms (46): ADP Workforce Now, Altera Payroll, BambooHR, Breathe, Charlie, ChartHop, ClayHR, Dayforce, Deel, Factorial, Freshteam, Google Workspace, Gusto, Hibob, HR Cloud, HR Partner, Humaans, Insperity Premier, IntelliHR, JumpCloud, Lucca, Microsoft Entra ID, Namely, Nmbrs, Officient, Okta, OneLogin, Paychex, Paycor, PayFit, Paylocity, PeopleHR, Personio, Proliant, Rippling, Sage HR, Sesame, Simployer, Square Payroll, TriNet, TriNet HR Platform, UKG Pro, UKG Pro Workforce Management, UKG Ready, Workday, Zoho People.

ATS platforms (33): ApplicantStack, Ashby, BambooHR, Breezy, CATS, ClayHR, Clockwork, Cornerstone TalentLink, EngageATS, Fountain, Freshteam, Greenhouse, Greenhouse Job Board API, Homerun, HR Cloud, JazzHR, Jobsoid, Jobvite, Lano, Lever, Oracle Taleo, Polymer, Recruiterflow, Sage HR, SAP SuccessFactors, SmartRecruiters, TalentLyft, TalentReef, Teamtailor, Tellent Recruitee, UKG Pro Recruiting, Workable, Workday.



### Slack full flow

- OAuth install via `slack-oauth-init` and `slack-oauth-callback`.

- Workspace state stored in `slack_connections`.

- Slash commands: `/rcf`, `/rcf help`, `/rolecolor [email|@handle|@mention]`, `/teambalance`.

- Events API handles `team_join`, direct messages, app mentions.

- Interactivity handles confirmation buttons, admin approval/rejection, assessment invite, and manual link flow.

- Admin settings + manual user mapping live in `SlackIntegrationSettings` + `slack-manage`.

- Error logging uses `slack_errors`; interaction logging uses `slack_interactions`; onboarding queue uses `slack_pending_confirmations`.



### Microsoft Teams flow

- Simple webhook-based integration only. Admin stores `companies.ms_teams_webhook_url` and enables `companies.ms_teams_notifications_enabled`.

- `send-teams-notification` builds adaptive cards for assessment completion, new employee, reminders, and task assignments.



### ChatGPT / OpenAI Apps SDK flow

- Backend exists and is deployed: `chatgpt-mcp-server`, `chatgpt-oauth-init`, `chatgpt-oauth-callback`, `chatgpt-manage`, `chatgpt_connections`, `chatgpt_oauth_states`, `chatgpt_tool_calls`.

- Frontend UI components still exist in `src/components/b2b/admin/ChatGPTIntegrationSettings.tsx` and `src/components/settings/PersonalChatGPTIntegrationCard.tsx`, but visible Settings pages currently hide them.

- MCP tools exposed in code include classic RoleColor tools plus newer org-analysis tools such as team health score, org chart, gap analysis, succession planning, team cloning, collaboration score, and department comparison.



### Partially built / stubbed / backend-only integrations

- **BambooHR direct sync**: backend implemented, cron implemented, no visible frontend card found in current repo.

- **Google Workspace import**: modal/import workflow exists inside Users tab, not a dedicated top-level integration card.

- **Personal portal integrations**: `/settings/integrations` intentionally shows a placeholder stating personal integrations are hidden for now.
## 10. API Layer
- **Frontend -> backend pattern**: both direct Supabase client queries and Edge Functions are used. Browser-safe reads/writes often call `supabase.from(...)`; privileged operations use `supabase.functions.invoke(...)`.

- **External REST API**: `api.rolecolorfinder.com/v1` is backed by `api-gateway`, `api-users`, `api-assessments`, and `validate-api-key`.

- **Company API keys**: generated in Business Settings API tab; stored hashed in `company_api_keys` with `rcf_` prefix, `key_hash`, `key_prefix`, permissions array, and audit timestamps.



### External APIs and auth methods used

| External service | Where used | Auth method / key |
| --- | --- | --- |
| Supabase | Frontend + all edge functions | Anon key in browser; service role key in server-side functions |
| Stripe | Payments, billing, seat purchases, subscriptions | \`STRIPE_SECRET\` or \`STRIPE_SECRET_KEY\` server-side |
| Mailgun | Invite and transactional emails | \`MAILGUN_API_KEY\` + \`MAILGUN_DOMAIN\` |
| Resend | Some transactional emails (\`send-email\`, task completion, new employee notice) | \`RESEND_API_KEY\` |
| OpenAI | Resume parsing, candidate fit, ATS job drafts, Slack assistant fallback, team insights, interview/task drafting, ChatGPT MCP logic | \`OPENAI_API_KEY\` |
| Google Gemini | CSV import analysis, leadership analysis | \`GEMINI_API_KEY\` |
| Slack Web API | Slack OAuth, slash commands, DM/channel messaging, onboarding | Slack app credentials + bot tokens |
| Microsoft Teams webhooks | Teams channel notifications | Incoming webhook URL stored on company row |
| Merge.dev | HRIS/ATS unified API, metadata, Link tokens, webhook validation | \`REACT_APP_MERGE_API_KEY\`, account tokens, webhook secret |
| BambooHR | Direct ATS/HR job sync | \`BAMBOOHR_CLIENT_ID\`, \`BAMBOOHR_CLIENT_SECRET\`, OAuth tokens per company |
| Google Admin SDK / Workspace | User directory import | OAuth access token supplied at import time |
| Bland AI | Voice assessment calling | \`BLAND_APIKEY\` |
| Clearbit Logo API | Client-side integration-card logo fallback | No key |
| PostHog / Google Ads / Apollo / REB2B / Sentry | Frontend analytics/monitoring | Hardcoded keys/scripts in \`index.html\` and \`src/main.tsx\` |



### Retry / rate limiting logic

- Merge sync helpers implement cursor pagination, retry/backoff, and special-case handling for `401`, `403`, `404`, and `429` responses.

- `test-merge-connection` marks reconnect-required / retrying / disconnected states based on HTTP status.

- Merge and BambooHR auto-sync runners are cron-driven.

- Most other edge functions do not implement sophisticated retry logic; failures surface directly to UI/toasts.
## 11. Environment Variables
| Variable | Public or secret | Referenced in | Configured status |
| --- | --- | --- | --- |
| APP_BASE_URL | secret/server | supabase/functions/_shared/chatgpt.ts<br>supabase/functions/_shared/merge.ts<br>supabase/functions/_shared/slack-onboarding.ts<br>supabase/functions/_shared/slack.ts<br>supabase/functions/delete-company/index.ts | NOT CONFIGURED in checked local env or hosted secret list |
| BAMBOOHR_AUTO_SYNC_KEY | secret/server | supabase/functions/run-bamboohr-auto-sync/index.ts<br>supabase/functions/sync-bamboohr-hiring/index.ts | hosted Supabase secret |
| BAMBOOHR_CLIENT_ID | secret/server | supabase/functions/sync-bamboohr-hiring/index.ts | hosted Supabase secret |
| BAMBOOHR_CLIENT_SECRET | secret/server | supabase/functions/sync-bamboohr-hiring/index.ts | hosted Supabase secret |
| BLAND_APIKEY | secret/server | supabase/functions/initiate-voice-call/index.ts | hosted Supabase secret |
| CHATGPT_TOKEN_ENCRYPTION_KEY | secret/server | supabase/functions/_shared/chatgpt.ts | NOT CONFIGURED in checked local env or hosted secret list |
| GEMINI_API_KEY | secret/server | supabase/functions/analyze-csv-import/index.ts<br>supabase/functions/analyze-leadership/index.ts | hosted Supabase secret |
| MAILGUN_API_KEY | secret/server | supabase/functions/delete-company/index.ts<br>supabase/functions/invite-candidate/index.ts<br>supabase/functions/invite-company-user/index.ts<br>supabase/functions/promote-company-user/index.ts<br>supabase/functions/resend-invite/index.ts<br>supabase/functions/send-assessment-email/index.ts<br>supabase/functions/send-candidate-email/index.ts<br>supabase/functions/send-contact-reply/index.ts<br>supabase/functions/send-interview-email/index.ts<br>supabase/functions/send-offer-email/index.ts<br>supabase/functions/send-rcf-password-reset/index.ts<br>supabase/functions/send-scheduled-reminders/index.ts<br>supabase/functions/send-scheduled-report/index.ts<br>supabase/functions/send-task-assignment-email/index.ts | hosted Supabase secret |
| MAILGUN_DOMAIN | secret/server | supabase/functions/delete-company/index.ts<br>supabase/functions/invite-candidate/index.ts<br>supabase/functions/invite-company-user/index.ts<br>supabase/functions/promote-company-user/index.ts<br>supabase/functions/resend-invite/index.ts<br>supabase/functions/send-assessment-email/index.ts<br>supabase/functions/send-candidate-email/index.ts<br>supabase/functions/send-contact-reply/index.ts<br>supabase/functions/send-interview-email/index.ts<br>supabase/functions/send-offer-email/index.ts<br>supabase/functions/send-rcf-password-reset/index.ts<br>supabase/functions/send-scheduled-reminders/index.ts<br>supabase/functions/send-scheduled-report/index.ts<br>supabase/functions/send-task-assignment-email/index.ts | hosted Supabase secret |
| MERGE_API_BASE_URL | secret/server | supabase/functions/_shared/merge.ts | NOT CONFIGURED in checked local env or hosted secret list |
| MERGE_AUTO_SYNC_KEY | secret/server | supabase/functions/run-merge-auto-sync/index.ts | hosted Supabase secret |
| MERGE_WEBHOOK_SIGNATURE_KEY | secret/server | supabase/functions/_shared/merge.ts | local .env |
| OPENAI_API_KEY | secret/server | supabase/functions/_shared/slack-assistant.ts<br>supabase/functions/ai-follow-up/index.ts<br>supabase/functions/analyze-candidate-fit/index.ts<br>supabase/functions/analyze-career-resume/index.ts<br>supabase/functions/analyze-role-assessment-need/index.ts<br>supabase/functions/analyze-task-assignment/index.ts<br>supabase/functions/celebrity-assessment/index.ts<br>supabase/functions/draft-task-email/index.ts<br>supabase/functions/generate-ats-job-draft/index.ts<br>supabase/functions/generate-interview-questions/index.ts<br>supabase/functions/generate-team-insights/index.ts<br>supabase/functions/parse-candidate-text/index.ts<br>supabase/functions/parse-resume/index.ts<br>supabase/functions/suggest-assessment-category/index.ts<br>supabase/functions/suggest-skills/index.ts | hosted Supabase secret |
| PUBLIC_APP_URL | secret/server | supabase/functions/_shared/chatgpt.ts<br>supabase/functions/_shared/merge.ts<br>supabase/functions/_shared/slack-onboarding.ts<br>supabase/functions/_shared/slack.ts<br>supabase/functions/delete-company/index.ts | NOT CONFIGURED in checked local env or hosted secret list |
| PUBLIC_SUPABASE_URL | secret/server | supabase/functions/_shared/chatgpt.ts | NOT CONFIGURED in checked local env or hosted secret list |
| REACT_APP_MERGE_API_KEY | public/browser or semi-public build-time | supabase/functions/_shared/merge.ts<br>supabase/functions/test-merge-connection/index.ts | local .env; hosted Supabase secret |
| RECOVERY_ADMIN_TOKEN | secret/server | supabase/functions/recover-assessment-by-email/index.ts | hosted Supabase secret |
| RESEND_API_KEY | secret/server | supabase/functions/notify-admin-new-employee/index.ts<br>supabase/functions/notify-task-completion/index.ts<br>supabase/functions/send-email/index.ts | NOT CONFIGURED in checked local env or hosted secret list |
| SEND_EMAIL_HOOK_SECRET | secret/server | supabase/functions/send-email/index.ts | NOT CONFIGURED in checked local env or hosted secret list |
| SLACK_APP_ID | secret/server | supabase/functions/_shared/slack.ts | local .env; hosted Supabase secret |
| SLACK_CLIENT_ID | secret/server | supabase/functions/_shared/slack.ts | local .env; hosted Supabase secret |
| SLACK_CLIENT_SECRET | secret/server | supabase/functions/_shared/slack.ts | local .env; hosted Supabase secret |
| SLACK_SIGNING_SECRET | secret/server | supabase/functions/_shared/slack.ts | local .env; hosted Supabase secret |
| STRIPE_SECRET | secret/server | supabase/functions/add-credits/index.ts<br>supabase/functions/add-seats-payment/index.ts<br>supabase/functions/cancel-hiring-subscription/index.ts<br>supabase/functions/charge-insight-redo/index.ts<br>supabase/functions/charge-invite/index.ts<br>supabase/functions/create-b2b-payment/index.ts<br>supabase/functions/create-payment/index.ts<br>supabase/functions/create-proposal-payment/index.ts<br>supabase/functions/manage-payment-method/index.ts<br>supabase/functions/process-monthly-billing/index.ts<br>supabase/functions/purchase-insight-credits/index.ts<br>supabase/functions/rcf-company-billing-admin/index.ts<br>supabase/functions/resubscribe-hiring/index.ts<br>supabase/functions/retry-company-renewal-payment/index.ts<br>supabase/functions/subscribe-hiring-tab/index.ts<br>supabase/functions/super-admin-toggle-hiring/index.ts<br>supabase/functions/verify-add-seats-payment/index.ts<br>supabase/functions/verify-b2b-payment/index.ts<br>supabase/functions/verify-hiring-subscription/index.ts | hosted Supabase secret |
| STRIPE_SECRET_KEY | secret/server | supabase/functions/check-payment-status/index.ts<br>supabase/functions/check-subscription/index.ts<br>supabase/functions/create-subscription-checkout/index.ts<br>supabase/functions/customer-portal/index.ts | hosted Supabase secret |
| SUPABASE_ANON_KEY | public/browser or semi-public build-time | supabase/functions/_shared/admin.ts<br>supabase/functions/add-credits/index.ts<br>supabase/functions/analyze-task-assignment/index.ts<br>supabase/functions/create-company/index.ts<br>supabase/functions/create-probation-reminder/index.ts<br>supabase/functions/create-subscription-checkout/index.ts<br>supabase/functions/delete-company/index.ts<br>supabase/functions/get-employee-data/index.ts<br>supabase/functions/invite-company-user/index.ts<br>supabase/functions/list-rcf-b2b-companies/index.ts<br>supabase/functions/list-rcf-company-users/index.ts<br>supabase/functions/list-rcf-platform-users/index.ts<br>supabase/functions/list-user-announcements/index.ts<br>supabase/functions/manage-super-admins/index.ts<br>supabase/functions/promote-company-user/index.ts<br>supabase/functions/rcf-company-billing-admin/index.ts<br>supabase/functions/resend-invite/index.ts<br>supabase/functions/retry-company-renewal-payment/index.ts<br>supabase/functions/send-email/index.ts<br>supabase/functions/send-rcf-password-reset/index.ts<br>supabase/functions/update-company-user-email/index.ts | hosted Supabase secret |
| SUPABASE_DB_URL | secret/server | supabase/functions/manage-super-admins/index.ts | hosted Supabase secret |
| SUPABASE_SERVICE_ROLE_KEY | secret/server | supabase/functions/_shared/admin.ts<br>supabase/functions/add-credits/index.ts<br>supabase/functions/analyze-candidate-fit/index.ts<br>supabase/functions/analyze-task-assignment/index.ts<br>supabase/functions/api-assessments/index.ts<br>supabase/functions/api-gateway/index.ts<br>supabase/functions/api-users/index.ts<br>supabase/functions/calculate-user-refund/index.ts<br>supabase/functions/cancel-hiring-subscription/index.ts<br>supabase/functions/charge-insight-redo/index.ts<br>supabase/functions/charge-invite/index.ts<br>supabase/functions/check-payment-status/index.ts<br>supabase/functions/check-subscription/index.ts<br>supabase/functions/convert-candidate-to-employee/index.ts<br>supabase/functions/create-audit-log/index.ts<br>supabase/functions/create-company/index.ts<br>supabase/functions/create-probation-reminder/index.ts<br>supabase/functions/customer-portal/index.ts<br>supabase/functions/delete-billing-entry/index.ts<br>supabase/functions/delete-company/index.ts<br>supabase/functions/get-company-employee-session/index.ts<br>supabase/functions/get-employee-data/index.ts<br>supabase/functions/initiate-voice-call/index.ts<br>supabase/functions/invite-candidate/index.ts<br>supabase/functions/invite-company-user/index.ts<br>supabase/functions/invite-family-member/index.ts<br>supabase/functions/list-rcf-b2b-companies/index.ts<br>supabase/functions/list-rcf-company-users/index.ts<br>supabase/functions/list-rcf-platform-users/index.ts<br>supabase/functions/list-user-announcements/index.ts<br>supabase/functions/manage-payment-method/index.ts<br>supabase/functions/manage-super-admins/index.ts<br>supabase/functions/notify-admin-new-employee/index.ts<br>supabase/functions/notify-task-completion/index.ts<br>supabase/functions/parse-resume/index.ts<br>supabase/functions/process-monthly-billing/index.ts<br>supabase/functions/promote-company-user/index.ts<br>supabase/functions/purchase-insight-credits/index.ts<br>supabase/functions/rcf-company-billing-admin/index.ts<br>supabase/functions/recover-assessment-by-email/index.ts<br>supabase/functions/resend-invite/index.ts<br>supabase/functions/resubscribe-hiring/index.ts<br>supabase/functions/retry-company-renewal-payment/index.ts<br>supabase/functions/run-bamboohr-auto-sync/index.ts<br>supabase/functions/save-company-assessment/index.ts<br>supabase/functions/send-rcf-password-reset/index.ts<br>supabase/functions/send-scheduled-reminders/index.ts<br>supabase/functions/send-scheduled-report/index.ts<br>supabase/functions/send-slack-notification/index.ts<br>supabase/functions/send-task-assignment-email/index.ts<br>supabase/functions/send-teams-notification/index.ts<br>supabase/functions/subscribe-hiring-tab/index.ts<br>supabase/functions/super-admin-toggle-hiring/index.ts<br>supabase/functions/sync-bamboohr-hiring/index.ts<br>supabase/functions/sync-google-workspace-users/index.ts<br>supabase/functions/unhire-candidate/index.ts<br>supabase/functions/update-company-user-email/index.ts<br>supabase/functions/validate-api-key/index.ts<br>supabase/functions/verify-add-seats-payment/index.ts<br>supabase/functions/verify-b2b-payment/index.ts<br>supabase/functions/verify-employee-invite/index.ts<br>supabase/functions/verify-google-sso-employee/index.ts<br>supabase/functions/verify-hiring-subscription/index.ts<br>supabase/functions/voiceAssessment/index.ts | hosted Supabase secret |
| SUPABASE_URL | secret/server | supabase/functions/_shared/admin.ts<br>supabase/functions/add-credits/index.ts<br>supabase/functions/analyze-candidate-fit/index.ts<br>supabase/functions/analyze-task-assignment/index.ts<br>supabase/functions/api-assessments/index.ts<br>supabase/functions/api-gateway/index.ts<br>supabase/functions/api-users/index.ts<br>supabase/functions/calculate-user-refund/index.ts<br>supabase/functions/cancel-hiring-subscription/index.ts<br>supabase/functions/charge-insight-redo/index.ts<br>supabase/functions/charge-invite/index.ts<br>supabase/functions/chatgpt-oauth-init/index.ts<br>supabase/functions/check-payment-status/index.ts<br>supabase/functions/check-subscription/index.ts<br>supabase/functions/convert-candidate-to-employee/index.ts<br>supabase/functions/create-audit-log/index.ts<br>supabase/functions/create-company/index.ts<br>supabase/functions/create-probation-reminder/index.ts<br>supabase/functions/create-subscription-checkout/index.ts<br>supabase/functions/customer-portal/index.ts<br>supabase/functions/delete-billing-entry/index.ts<br>supabase/functions/delete-company/index.ts<br>supabase/functions/get-company-employee-session/index.ts<br>supabase/functions/get-employee-data/index.ts<br>supabase/functions/initiate-voice-call/index.ts<br>supabase/functions/invite-candidate/index.ts<br>supabase/functions/invite-company-user/index.ts<br>supabase/functions/invite-family-member/index.ts<br>supabase/functions/list-rcf-b2b-companies/index.ts<br>supabase/functions/list-rcf-company-users/index.ts<br>supabase/functions/list-rcf-platform-users/index.ts<br>supabase/functions/list-user-announcements/index.ts<br>supabase/functions/manage-payment-method/index.ts<br>supabase/functions/manage-super-admins/index.ts<br>supabase/functions/notify-admin-new-employee/index.ts<br>supabase/functions/notify-task-completion/index.ts<br>supabase/functions/parse-resume/index.ts<br>supabase/functions/process-monthly-billing/index.ts<br>supabase/functions/promote-company-user/index.ts<br>supabase/functions/purchase-insight-credits/index.ts<br>supabase/functions/rcf-company-billing-admin/index.ts<br>supabase/functions/recover-assessment-by-email/index.ts<br>supabase/functions/resend-invite/index.ts<br>supabase/functions/resubscribe-hiring/index.ts<br>supabase/functions/retry-company-renewal-payment/index.ts<br>supabase/functions/run-bamboohr-auto-sync/index.ts<br>supabase/functions/save-company-assessment/index.ts<br>supabase/functions/send-email/index.ts<br>supabase/functions/send-rcf-password-reset/index.ts<br>supabase/functions/send-scheduled-reminders/index.ts<br>supabase/functions/send-scheduled-report/index.ts<br>supabase/functions/send-slack-notification/index.ts<br>supabase/functions/send-task-assignment-email/index.ts<br>supabase/functions/send-teams-notification/index.ts<br>supabase/functions/subscribe-hiring-tab/index.ts<br>supabase/functions/super-admin-toggle-hiring/index.ts<br>supabase/functions/sync-bamboohr-hiring/index.ts<br>supabase/functions/sync-google-workspace-users/index.ts<br>supabase/functions/unhire-candidate/index.ts<br>supabase/functions/update-company-user-email/index.ts<br>supabase/functions/validate-api-key/index.ts<br>supabase/functions/verify-add-seats-payment/index.ts<br>supabase/functions/verify-b2b-payment/index.ts<br>supabase/functions/verify-employee-invite/index.ts<br>supabase/functions/verify-google-sso-employee/index.ts<br>supabase/functions/verify-hiring-subscription/index.ts<br>supabase/functions/voiceAssessment/index.ts | hosted Supabase secret |
| VITE_SUPABASE_URL | public/browser or semi-public build-time | src/components/b2b/admin/SlackIntegrationSettings.tsx<br>src/components/b2b/hiring/HiringIntegrationsTab.tsx<br>src/lib/chatgptIntegration.ts | local .env |



### Used in code but not present in hosted Supabase secret list
APP_BASE_URL, CHATGPT_TOKEN_ENCRYPTION_KEY, MERGE_API_BASE_URL, MERGE_WEBHOOK_SIGNATURE_KEY, PUBLIC_APP_URL, PUBLIC_SUPABASE_URL, RESEND_API_KEY, SEND_EMAIL_HOOK_SECRET, VITE_SUPABASE_URL



### Notes

- `src/integrations/supabase/client.ts` hardcodes the live Supabase URL and anon key instead of reading them from `import.meta.env`.

- `.env` currently includes a suspicious entry named `none`; this does not map to a real environment variable used in code.

- Hosted secret availability was checked against `supabase secrets list --project-ref qbuxoetprodjxpagfkoi` on 2026-04-07.
## 12. Business Portal – Full Feature Map
| URL / tab | Component | What it shows | Reads/writes |
| --- | --- | --- | --- |
| /b2b/company-portal?tab=overview | src/pages/b2b/B2BDashboard.tsx -> OverviewTab | Company stats, activity feed, hiring status, team insight entry points. | company_users, scheduled_reminders, audit_logs, candidate_activities, billing_credits |
| /b2b/company-portal?tab=users | src/pages/b2b/B2BDashboard.tsx -> UsersTab | Manage/invite users, import from CSV/Google Workspace, update emails, admin/role operations. | company_users, company_roles; invite-company-user, update-company-user-email, fetch-google-workspace-users, sync-google-workspace-users |
| /b2b/company-portal?tab=hiring | src/pages/b2b/B2BDashboard.tsx -> HiringSection | Hiring product shell; subscription-gated job, pipeline, interview, offer, analytics, ATS integration flows. | job_postings, candidates, candidate_applications, interviews, offers, merge_connections |
| /b2b/company-portal?tab=assessments | src/pages/b2b/B2BDashboard.tsx -> AssessmentsTab | Assessment type configuration, completed/pending lists, team insight modal. | company_users, companies, assessment_results, team_insights; generate-team-insights |
| /b2b/company-portal?tab=matrix | src/pages/b2b/B2BDashboard.tsx -> WorkAssigningMatrixTab | AI work assignment intake and output plus task assignment history. | work_tasks, task_assignments, assessment_results; analyze-task-assignment |
| /b2b/company-portal?tab=roles | src/pages/b2b/B2BDashboard.tsx -> RolesTab | Company role library and generated skill suggestions. | company_roles, company_users |
| /b2b/company-portal?tab=reminders | src/pages/b2b/B2BDashboard.tsx -> RemindersHistoryTab | Scheduled reminder history and management. | scheduled_reminders, company_users |
| /b2b/company-portal?tab=analytics | src/pages/b2b/B2BDashboard.tsx -> AdvancedAnalyticsDashboard | Charts for color distribution, completion trends, leadership potential, department breakdown. | company_users, assessment_results |
| /b2b/company-portal?tab=friction-map | src/pages/b2b/B2BDashboard.tsx -> TeamFrictionMapTab | Pairwise friction and compatibility views driven by RoleColor. | company_users, assessment_results |
| /b2b/company-portal?tab=settings | src/pages/b2b/B2BDashboard.tsx -> SettingsTab | Branding, subscriptions, integrations, API keys/docs, scheduled reports. | companies, company_api_keys, scheduled_reports, slack_connections |



### Settings sub-tabs

| Sub-tab | Purpose |
| --- | --- |
| branding | Branding/theme/export/import settings for company portal presentation. |
| subscriptions | Billing state, payment method, hiring subscription settings, credit balances. |
| integrations | Slack manage card + Microsoft Teams webhook card. ChatGPT component is built but intentionally hidden. |
| api | API key management and REST API documentation. |
| reports | Scheduled reports manager; feature flag present and tab rendered only when enabled in code. |



### Admin vs regular user gating

| Role | Business portal behavior |
| --- | --- |
| admin | Full access to overview, users, hiring, assessments, work matrix, roles, reminders, analytics, friction map, settings. |
| hr | Can view/manage users and candidates/hiring, view assessments and reminders, but cannot use settings or roles admin functions. |
| partner | Read-only leaning role; can view overview, assessments, candidates, and use Work Matrix, but cannot hire or manage settings. |
| employee | Does not get admin-style tabbed portal; \`B2BDashboard\` renders \`EmployeeTasksView\` instead. |



### Integrations tab(s)

- **Settings -> Integrations** currently shows: Slack (full OAuth/manage flow) and Microsoft Teams (webhook settings/test).

- **Hiring -> Integrations** currently shows the 79-platform Merge HRIS/ATS catalog with search, status, connection tests, sync all, and lockout/other-integrations behavior. Slack is no longer the intended surface there, although residual Slack-related types/constants still exist inside `HiringIntegrationsTab.tsx`.
## 13. Personal Portal – Full Feature Map
| URL / screen | Component | Data sources / purpose |
| --- | --- | --- |
| /dashboard | src/pages/Dashboard.tsx | Authenticated personal dashboard with internal sidebar sections overview, assessments, business, career, settings. |
| /settings/integrations | src/pages/PersonalIntegrationsPage.tsx | Currently a placeholder page; personal integrations are intentionally hidden. |
| /auth | src/pages/AnimatedAuth.tsx | Primary sign-in/sign-up experience. |
| /change-password | src/pages/ChangePassword.tsx | Authenticated password change utility. |
| /reset-password | src/pages/ResetPassword.tsx | Supabase password reset completion flow. |
| /two-factor-enrollment | src/pages/TwoFactorEnrollment.tsx | 2FA enrollment UI for users/super admins. |
| /free-assessment, /premium-assessment, /pro-assessment, /voice-assessment, /leadership-assessment-privatedemo | src/pages/*Assessment.tsx | Assessment entry points. |
| /free-results, /premium-results, /pro-results, /voice-results, /leadership-results, /results | src/pages/*Results.tsx | Assessment result/report screens and downloads. |
| /career-finder, /career-finder/results, /career-finder/resume-results | src/pages/CareerFinder*.tsx | Career Finder product and resume analysis flow. |
| /:username | src/pages/PublicRoleColorProfile.tsx | Public shareable RoleColor profile page. |



### Dashboard internal sections (`/dashboard`)

| Section | What it shows |
| --- | --- |
| overview | Announcements, welcome banner, total assessments, active businesses, completed assessments, latest result, pending invites. |
| assessments | All purchased/completed assessments, in-progress resume flow, downloads, details modal, result navigation. |
| business | Pending company invites, businesses where the user is admin/HR/partner, employee portal shortcuts, super-admin shortcut, create business CTA. |
| career | Career Finder upsell or unlocked career recommendations/resume analysis based on completed assessments and localStorage purchase marker. |
| settings | Email display, password change, Google account linking, public RoleColor profile settings. |
## 14. Hiring Platform
- Hiring is implemented as a module inside the Business Portal (`tab=hiring`), not as a separate app.

- The outer shell is `src/components/b2b/hiring/HiringSection.tsx` and is subscription-gated through billing status plus the `subscribeHiring` flow.



### Hiring sub-tabs

| Sub-tab | Component | What it does |
| --- | --- | --- |
| jobs | JobPostingsTab | Create/edit jobs, AI ATS-targeted drafts, publish state, career page links, default ATS target selection. |
| pipeline | HiringPipelineView | Kanban pipeline view, drag/move stages, stage transitions, candidate stage actions. |
| candidates | HiringCandidatesTab | Candidate list/search/comparison and candidate dialogs. |
| interviews | InterviewsTab | Interview scheduling and email notifications. |
| offers | OffersTab | Offer creation, offer emails, probation reminders. |
| templates | EmailTemplatesTab | Reusable email template management. |
| analytics | HiringAnalyticsTab | Hiring funnel metrics and KPI cards/charts. |
| legacy | LegacyCandidatesTab | Older candidate tab retained for compatibility. |
| integrations | HiringIntegrationsTab | Merge HRIS/ATS catalog (79 cards), connection test, sync all, search, single-active-per-category behavior. |



### Candidate management data model

| Concern | Primary tables / logic |
| --- | --- |
| Candidate master record | \`candidates\` |
| Job applications / pipeline position | \`candidate_applications\` |
| Pipeline stage definitions | \`hiring_pipeline_stages\` |
| Stage change history | \`stage_transitions\` |
| Candidate activity log | \`candidate_activities\` |
| Candidate notes | \`candidate_notes\` |
| Candidate documents / resumes | \`candidate_documents\`, storage \`resumes\`, and legacy \`candidate-resumes\` bucket references |
| Interviews | \`interviews\` |
| Offers | \`offers\`, \`offer_probation_reminders\` |
| Email campaigns / bulk emails | \`email_campaigns\`, \`email_campaign_recipients\`, \`email_templates\` |



### ATS integration flows

- Merge ATS: connect via `create-link-token` -> Merge Link widget -> `retrieve-token` exchange -> `merge_connections` row -> initial `sync-ats` -> bridge into `ats_jobs`, `ats_candidates`, `ats_applications`, plus local hiring tables.

- BambooHR direct sync: `sync-bamboohr-hiring` can both import BambooHR jobs into `job_postings` and push local unsynced RCF jobs into BambooHR as job openings.

- Merge auto-sync runs every 15 minutes; BambooHR auto-sync runners run every minute and every 5 minutes based on cron jobs in the linked DB.



### Candidate fit scoring

- Implemented in `supabase/functions/analyze-candidate-fit/index.ts`.

- Requires candidate assessment completion; pulls `candidates.assessment_result_id -> assessment_results.results`.

- Base score uses exact dominant-color match to `candidate.ideal_role_color`, otherwise falls back to the candidate score for the ideal color or `50`.

- If `OPENAI_API_KEY` is present, the function sends the candidate role, ideal color, full color scores, strengths, and up to 2000 characters of parsed resume text to OpenAI (`gpt-4o-mini`) and expects JSON with summary, strengths, concerns, recommendations, `fitScore`, and leadership potential.

- Leadership potential heuristic: if Red or Yellow appears as primary or secondary/top-two, leadership potential is treated as high; otherwise limited.

- Results persist to `candidates.fit_score`, `candidates.fit_analysis`, and `candidates.fit_analyzed_at`.
## 15. Mobile App (if any code exists)
NOT FOUND: no Expo/React Native app config at repo root. Only database tables prefixed rcaimobile_* exist; there is no mobile frontend source tree in this repository.



### Mobile-related artifacts found

- Database tables exist for a mobile initiative: `rcaimobile_candidate_profiles`, `rcaimobile_candidate_reviews`, `rcaimobile_jobs`, `rcaimobile_notifications`, `rcaimobile_role_fit_insights`.

- No Expo config, React Native source folder, mobile app package, or screen code was found in this repository.
## 16. Known Issues / Incomplete Features
### TODO comments found



```
./src/components/b2b/EmailTemplateCustomizer.tsx:53:      .replace(/\{\{invite_code\}\}/g, 'XXXX-XXXX')
./src/components/b2b/EmailTemplateCustomizer.tsx:132:            <p className="text-2xl font-bold tracking-[0.3em] text-primary font-mono">XXXX-XXXX</p>
./supabase/functions/invite-family-member/index.ts:105:    // TODO: Send invitation email if member doesn't exist
```




### Console logging left in production code



```
src/pages/company/CompanyLogin.tsx:52:      console.log('Processing Google SSO callback for', user.email);
src/pages/company/CompanyLogin.tsx:67:          console.error('SSO verification failed:', fnError || data?.message);
src/pages/company/CompanyLogin.tsx:97:        console.error('OAuth callback error:', err);
src/pages/company/CompanyLogin.tsx:195:      console.error('Login error:', err);
supabase/functions/verify-employee-invite/index.ts:45:      console.log('Invalid invite code format:', inviteCode)
supabase/functions/verify-employee-invite/index.ts:53:      console.log('Invalid company ID format:', companyId)
supabase/functions/verify-employee-invite/index.ts:61:      console.log('Invalid email format:', email)
supabase/functions/verify-employee-invite/index.ts:68:    console.log('Verifying invite code for company:', companyId)
supabase/functions/verify-employee-invite/index.ts:85:      console.error('Error looking up employee:', lookupError)
supabase/functions/verify-employee-invite/index.ts:93:      console.log('No employee found with provided credentials')
supabase/functions/verify-employee-invite/index.ts:101:      console.log('Employee access revoked')
supabase/functions/verify-employee-invite/index.ts:115:        console.log('Invite code expired:', {
supabase/functions/verify-employee-invite/index.ts:142:        console.error('Error updating employee status:', updateError)
supabase/functions/verify-employee-invite/index.ts:144:        console.log('Employee status updated to active')
supabase/functions/verify-employee-invite/index.ts:148:    console.log('Credentials verified successfully')
supabase/functions/verify-employee-invite/index.ts:171:    console.error('Unexpected error:', error)
src/pages/company/CompanyAssessment.tsx:149:            console.error('Error saving assessment:', fnError || errorMessage);
src/pages/company/CompanyAssessment.tsx:159:          console.log('Assessment saved successfully:', data.assessmentResultId);
src/pages/company/CompanyAssessment.tsx:179:          console.error('Error saving assessment:', err);
supabase/functions/create-subscription-checkout/index.ts:12:  console.log(`[CREATE-SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
src/pages/company/CompanyResults.tsx:134:      console.error('PDF export error:', error);
supabase/functions/slack-oauth-init/index.ts:43:    console.error("slack-oauth-init error", error);
src/pages/company/CompanyAdminLogin.tsx:71:        console.error('Error checking admin access:', err);
src/pages/company/CompanyAdminLogin.tsx:168:      console.error('Admin login error:', err);
supabase/functions/sync-hris/index.ts:66:    console.error("sync-hris error", error);
src/pages/NotFound.tsx:10:    console.error(
supabase/functions/run-merge-auto-sync/index.ts:129:    console.error("run-merge-auto-sync error", error);
supabase/functions/sync-ats/index.ts:65:    console.error("sync-ats error", error);
supabase/functions/celebrity-assessment/index.ts:181:      console.error('OpenAI API error:', errorText);
supabase/functions/celebrity-assessment/index.ts:247:    console.error('Error in celebrity-assessment:', error);
supabase/functions/parse-resume/index.ts:28:    console.log(`Parsing resume for candidate ${candidateId}`);
supabase/functions/parse-resume/index.ts:53:      console.error("OPENAI_API_KEY not configured, skipping parsing");
supabase/functions/parse-resume/index.ts:113:        console.error("OpenAI parsing failed:", await aiResponse.text());
supabase/functions/parse-resume/index.ts:128:      console.error("Failed to update candidate:", updateError);
supabase/functions/parse-resume/index.ts:131:    console.log(`Resume parsed successfully for candidate ${candidateId}`);
supabase/functions/parse-resume/index.ts:141:    console.error("Error in parse-resume:", error);
src/pages/FreeAssessment.tsx:105:            console.error('Error saving assessment results:', error);
supabase/functions/chatgpt-mcp-server/index.ts:143:    console.error("chatgpt-mcp-server error", error);
src/pages/PaymentSuccess.tsx:29:        console.log('Google Ads conversion tracked for purchase');
src/pages/PaymentSuccess.tsx:36:      console.log('Storing payment record for user:', user?.id, 'type:', assessmentType);
src/pages/PaymentSuccess.tsx:61:        console.error('Database error:', error);
src/pages/PaymentSuccess.tsx:63:        console.log('Payment record stored successfully:', data);
src/pages/PaymentSuccess.tsx:66:      console.error('Error storing payment record:', error);
supabase/functions/analyze-candidate-fit/index.ts:43:      console.error("Candidate not found:", candidateError);
supabase/functions/analyze-candidate-fit/index.ts:146:        console.error("AI analysis failed:", aiError);
supabase/functions/analyze-candidate-fit/index.ts:175:      console.error("Failed to update candidate:", updateError);
supabase/functions/analyze-candidate-fit/index.ts:187:    console.error("Error in analyze-candidate-fit:", error);
src/pages/FreeResults.tsx:116:      console.error('Error saving assessment:', error);
src/pages/FreeResults.tsx:161:      console.error('Error saving email:', error);
src/pages/VoiceResults.tsx:116:      console.error('Error saving assessment:', error);
src/pages/VoiceResults.tsx:167:        console.error("Error fetching results:", error);
supabase/functions/list-rcf-company-users/index.ts:99:    console.error("Error in list-rcf-company-users:", error);
src/pages/ProResults.tsx:184:        console.error('Supabase error:', error);
src/pages/ProResults.tsx:199:      console.error('Error saving assessment:', error);
src/pages/ProResults.tsx:261:            console.error("Error fetching shareable code:", error);
src/pages/ProResults.tsx:269:            console.log("No saved assessment found - will generate code on save");
src/pages/ProResults.tsx:301:      console.error('Error exporting PDF:', error);
supabase/functions/manage-super-admins/index.ts:255:    console.error("Error in manage-super-admins:", error);
src/pages/SharedResult.tsx:212:      console.error("Error fetching result:", error);
src/pages/LeadershipResults.tsx:620:      console.error('Error saving assessment:', error);
src/pages/LeadershipResults.tsx:654:            console.error('AI error:', error);
src/pages/LeadershipResults.tsx:689:          console.error('AI error:', error);
src/pages/LeadershipResults.tsx:696:        console.error('Error:', error);
src/pages/LeadershipResults.tsx:753:      console.error('PDF generation error:', error);
supabase/functions/analyze-role-assessment-need/index.ts:106:      console.error('AI gateway error:', await response.text());
supabase/functions/analyze-role-assessment-need/index.ts:130:      console.error('Failed to parse AI response:', content);
supabase/functions/analyze-role-assessment-need/index.ts:138:    console.error('Error in analyze-role-assessment-need:', error);
supabase/functions/analyze-task-assignment/index.ts:78:      console.log('No authorization header provided');
supabase/functions/analyze-task-assignment/index.ts:98:      console.log('Invalid token:', authError?.message);
supabase/functions/analyze-task-assignment/index.ts:169:      console.log('User is not a company admin for this company');
supabase/functions/analyze-task-assignment/index.ts:176:    console.log('Analyzing task assignment:', { taskId, companyId, title, quadrant });
supabase/functions/analyze-task-assignment/index.ts:189:      console.log('Excluding task creator from assignment:', createdByUserId);
supabase/functions/analyze-task-assignment/index.ts:195:      console.error('Error fetching employees:', empError);
supabase/functions/analyze-task-assignment/index.ts:199:    console.log('Found employees:', employees?.length || 0);
supabase/functions/analyze-task-assignment/index.ts:352:      console.log(`Employee ${emp.email}: roleColor=${roleColorScore.toFixed(2)}, skill=${skillMatch.toFixed(2)}, jobRole=${jobRoleFit.toFixed(2)}, workload=${workloadMargin.toFixed(2)}, total=${totalScore.toFixed(2)}`);
supabase/functions/analyze-task-assignment/index.ts:380:        console.log('Using OpenAI to generate enhanced assignment reasoning...');
supabase/functions/analyze-task-assignment/index.ts:471:            console.log('Successfully generated AI-enhanced reasoning');
supabase/functions/analyze-task-assignment/index.ts:474:          console.log('OpenAI API error, falling back to algorithmic reasoning:', aiResponse.status);
supabase/functions/analyze-task-assignment/index.ts:477:        console.error('Error with OpenAI reasoning, using fallback:', aiError);
supabase/functions/analyze-task-assignment/index.ts:518:    console.log('Assignment complete. Primary:', primaryAssignee?.email, 'Score:', primaryAssignee?.totalScore, 'AI Enhanced:', aiEnhanced);
supabase/functions/analyze-task-assignment/index.ts:561:    console.error('Error in analyze-task-assignment:', error);
supabase/functions/api-users/index.ts:42:    console.error('DB error:', error);
supabase/functions/api-users/index.ts:232:          console.error('Invite error:', inviteError);
supabase/functions/api-users/index.ts:509:        console.error('Query error:', error);
supabase/functions/api-users/index.ts:535:    console.error('Unhandled error:', err);
supabase/functions/suggest-assessment-category/index.ts:80:        console.error('AI gateway error:', await response.text());
supabase/functions/suggest-assessment-category/index.ts:103:        console.error('Failed to parse AI response:', content);
supabase/functions/suggest-assessment-category/index.ts:165:      console.error('AI gateway error:', await response.text());
supabase/functions/suggest-assessment-category/index.ts:187:      console.error('Failed to parse AI response:', content);
supabase/functions/suggest-assessment-category/index.ts:195:    console.error('Error suggesting category:', error);
supabase/functions/parse-candidate-text/index.ts:73:      console.error("OpenAI error:", data.error);
supabase/functions/parse-candidate-text/index.ts:90:      console.error("Failed to parse GPT response:", content);
supabase/functions/parse-candidate-text/index.ts:98:    console.error("Error:", error);
supabase/functions/analyze-leadership/index.ts:90:      console.error('Gemini API error:', response.status, errorText);
supabase/functions/analyze-leadership/index.ts:101:    console.log('Raw AI response:', content);
supabase/functions/analyze-leadership/index.ts:114:    console.log('Cleaned content:', cleanContent);
supabase/functions/analyze-leadership/index.ts:120:      console.error('JSON parse error:', parseError);
supabase/functions/analyze-leadership/index.ts:121:      console.error('Content that failed to parse:', cleanContent);
supabase/functions/analyze-leadership/index.ts:146:    console.error('Error in analyze-leadership:', error);
src/pages/Blog.tsx:43:      console.error("Error loading posts:", error);
supabase/functions/retry-company-renewal-payment/index.ts:275:    console.error("Error retrying company renewal payment:", error);
src/pages/CareerPaymentSuccess.tsx:31:        console.log('Google Ads conversion tracked for career purchase');
supabase/functions/manage-payment-method/index.ts:12:  console.log(`[MANAGE-PAYMENT-METHOD] ${step}${detailsStr}`);
supabase/functions/sync-google-workspace-users/index.ts:52:    console.log('Sync triggered but no access token provided. Manual sync required for each company.');
supabase/functions/sync-google-workspace-users/index.ts:63:    console.error('Error in sync-google-workspace-users:', error);
supabase/functions/sync-google-workspace-users/index.ts:72:  console.log(`Starting Google Workspace sync for company: ${companyId}`);
supabase/functions/sync-google-workspace-users/index.ts:118:    console.error('Google API error:', response.status, errorText);
supabase/functions/sync-google-workspace-users/index.ts:125:  console.log(`Found ${googleUsers.length} active users in Google Workspace`);
supabase/functions/sync-google-workspace-users/index.ts:162:          console.log(`Updated name for ${email}: ${gUser.name.fullName}`);
supabase/functions/sync-google-workspace-users/index.ts:176:      console.log(`User ${existingUser.email} not found in Google Workspace - may need review`);
supabase/functions/sync-google-workspace-users/index.ts:190:  console.log('Sync complete:', result);
supabase/functions/create-audit-log/index.ts:59:      console.error("Error creating audit log:", error);
supabase/functions/create-audit-log/index.ts:68:    console.error("Error in create-audit-log:", error);
supabase/functions/create-payment/index.ts:18:  console.log("=== CREATE PAYMENT FUNCTION STARTED ===");
supabase/functions/create-payment/index.ts:19:  console.log("Request method:", req.method);
supabase/functions/create-payment/index.ts:23:    console.log("Handling CORS preflight request");
supabase/functions/create-payment/index.ts:28:    console.log("Starting payment creation process...");
supabase/functions/create-payment/index.ts:31:    console.log("Request body:", body);
supabase/functions/create-payment/index.ts:46:    console.log("Extracted data:", {
supabase/functions/create-payment/index.ts:67:      console.error("STRIPE_SECRET environment variable is not set");
supabase/functions/create-payment/index.ts:71:    console.log("Stripe secret found, initializing Stripe...");
supabase/functions/create-payment/index.ts:114:    console.log("Creating payment for:", productConfig.name, "Amount:", safeCheckoutAmount, "Currency:", checkoutCurrency);
supabase/functions/create-payment/index.ts:144:    console.log("Payment session created successfully:", session.id);
supabase/functions/create-payment/index.ts:145:    console.log("Session URL:", session.url);
supabase/functions/create-payment/index.ts:155:    console.error("=== PAYMENT CREATION ERROR ===");
supabase/functions/create-payment/index.ts:156:    console.error("Error details:", error);
supabase/functions/create-payment/index.ts:157:    console.error("Error message:", error.message);
supabase/functions/analyze-csv-import/index.ts:132:      console.error('Gemini API error:', await response.text());
supabase/functions/analyze-csv-import/index.ts:170:      console.error('Failed to parse AI response:', content);
supabase/functions/analyze-csv-import/index.ts:186:    console.error('Error analyzing CSV:', error);
src/pages/VoiceAssessment.tsx:71:          console.error("Finalize via function failed", err);
src/pages/VoiceAssessment.tsx:100:          console.error("Finalize via function failed", err);
src/pages/VoiceAssessment.tsx:112:      console.error("Error looking up results:", error);
supabase/functions/get-employee-data/index.ts:23:      console.log('No authorization header provided');
supabase/functions/get-employee-data/index.ts:42:      console.log('Invalid token:', authError?.message);
supabase/functions/get-employee-data/index.ts:74:    console.log('Fetching employee data:', employeeId, 'company:', companyId)
supabase/functions/get-employee-data/index.ts:90:      console.log('User is not a company admin');
supabase/functions/get-employee-data/index.ts:106:      console.error('Employee not found:', empError)
supabase/functions/get-employee-data/index.ts:127:    console.log('Employee data fetched successfully')
supabase/functions/get-employee-data/index.ts:148:    console.error('Unexpected error:', error)
supabase/functions/rcf-company-billing-admin/index.ts:414:        console.error("Failed to write super_admin_trial_configured log:", trialLogError.message);
supabase/functions/rcf-company-billing-admin/index.ts:475:      }).then(({ error }) => { if (error) console.error('Audit log failed:', error.message); });
supabase/functions/rcf-company-billing-admin/index.ts:539:      }).then(({ error }) => { if (error) console.error('Audit log failed:', error.message); });
supabase/functions/rcf-company-billing-admin/index.ts:671:    }).then(({ error }) => { if (error) console.error('Audit log failed:', error.message); });
supabase/functions/rcf-company-billing-admin/index.ts:706:    console.error("Error in rcf-company-billing-admin:", error);
supabase/functions/send-rcf-password-reset/index.ts:24:    console.error("MAILGUN_API_KEY or MAILGUN_DOMAIN not configured");
supabase/functions/send-rcf-password-reset/index.ts:90:      console.error("Mailgun error sending reset email:", response.status, errorText);
supabase/functions/send-rcf-password-reset/index.ts:96:    console.error("Error sending reset email:", error);
supabase/functions/send-rcf-password-reset/index.ts:197:    console.error("Error in send-rcf-password-reset:", error);
supabase/functions/slack-events/index.ts:43:  void task.catch((error) => console.error("slack-events background task failed", error));
src/pages/b2b/ProfessionalAssessment50Q.tsx:624:            console.error('Error saving assessment results:', error);
supabase/functions/verify-hiring-subscription/index.ts:12:  console.log("=== VERIFY HIRING SUBSCRIPTION PAYMENT FUNCTION STARTED ===");
supabase/functions/verify-hiring-subscription/index.ts:79:      console.error("Error updating company:", updateError);
supabase/functions/verify-hiring-subscription/index.ts:101:      console.error("Error inserting billing transaction:", txError);
supabase/functions/verify-hiring-subscription/index.ts:105:    console.log("Hiring subscription activated for company:", companyId);
supabase/functions/verify-hiring-subscription/index.ts:115:    console.error("Error verifying hiring subscription:", error);
supabase/functions/fetch-google-workspace-users/index.ts:24:    console.log('Fetching Google Workspace users for domain:', domain);
supabase/functions/fetch-google-workspace-users/index.ts:43:    console.log('Calling Google Admin API:', apiUrl);
supabase/functions/fetch-google-workspace-users/index.ts:55:      console.error('Google API error:', response.status, errorText);
supabase/functions/fetch-google-workspace-users/index.ts:89:    console.log(`Successfully fetched ${data.users?.length || 0} users from Google Workspace`);
supabase/functions/fetch-google-workspace-users/index.ts:111:    console.error('Error in fetch-google-workspace-users:', error);
supabase/functions/list-rcf-platform-users/index.ts:177:    console.error("Error in list-rcf-platform-users:", error);
supabase/functions/notify-task-completion/index.ts:53:      console.error("Assignment not found:", assignmentError);
supabase/functions/notify-task-completion/index.ts:70:      console.log("Per-assignment notifications disabled for this task");
supabase/functions/notify-task-completion/index.ts:78:      console.log("No assigner email found, skipping notification");
supabase/functions/notify-task-completion/index.ts:95:    console.log("Assigner has opted out of completion notifications");
supabase/functions/notify-task-completion/index.ts:170:      console.error("Resend error:", emailError);
supabase/functions/notify-task-completion/index.ts:174:    console.log("Completion notification sent:", emailData);
supabase/functions/notify-task-completion/index.ts:187:    console.error("Error in notify-task-completion:", error);
supabase/functions/create-probation-reminder/index.ts:128:      console.error("Failed to create probation reminder:", upsertError);
supabase/functions/create-probation-reminder/index.ts:140:    console.error("create-probation-reminder error:", error);
supabase/functions/update-company-user-email/index.ts:365:    console.error("Error in update-company-user-email:", error);
src/pages/b2b/B2BDashboard.tsx:378:            console.error('Hiring subscription verification failed:', error || data?.error);
src/pages/b2b/B2BDashboard.tsx:388:          console.error('Error verifying subscription:', err);
src/pages/b2b/B2BDashboard.tsx:516:        console.error('Failed to verify payment method gate', error);
supabase/functions/slack-admin-settings/index.ts:38:    console.warn("Could not load Slack channels", error);
supabase/functions/voiceAssessment/index.ts:24:      console.error('voiceAssessment: empty or invalid JSON body');
supabase/functions/voiceAssessment/index.ts:27:    console.log('Received webhook:', JSON.stringify(body, null, 2));
supabase/functions/voiceAssessment/index.ts:52:      console.error('Missing identifiers for event', { event, session_id, phone_number });
supabase/functions/voiceAssessment/index.ts:70:        console.error('Invalid answer received:', answer);
supabase/functions/voiceAssessment/index.ts:98:        console.error('No existing assessment found to update scores', { session_id, phone_number });
supabase/functions/voiceAssessment/index.ts:125:        console.error('Update error:', updateErr);
supabase/functions/voiceAssessment/index.ts:132:      console.log(`Updated ${color} score for session ${session_id}`);
supabase/functions/voiceAssessment/index.ts:166:        console.error('Assessment not found for session or phone:', { session_id, phone_number, fetchError });
supabase/functions/voiceAssessment/index.ts:195:        console.error('Update error:', updateError);
supabase/functions/voiceAssessment/index.ts:202:      console.log(`Call completed for session ${session_id}, dominant color: ${dominantColor}`);
supabase/functions/voiceAssessment/index.ts:216:    console.error('Error in voiceAssessment function:', error);
supabase/functions/chatgpt-manage/index.ts:145:    console.error("chatgpt-manage error", error);
supabase/functions/webhook-handler/index.ts:98:    console.error("webhook-handler error", error);
src/pages/CareerFinder.tsx:68:      console.log('Career Finder - Found assessments:', assessments);
src/pages/CareerFinder.tsx:71:        console.error('Error checking assessment status:', error);
src/pages/CareerFinder.tsx:90:        console.log(`Assessment ${a.id} (${assessmentType}):`, { hasColorData, results });
src/pages/CareerFinder.tsx:98:        console.log('Found completed assessment with color:', color);
src/pages/CareerFinder.tsx:114:          console.log('Found payment record, but no completed assessment');
src/pages/CareerFinder.tsx:125:      console.error('Error checking assessment status:', error);
supabase/functions/create-b2b-payment/index.ts:24:  console.log("=== CREATE B2B PAYMENT FUNCTION STARTED ===");
supabase/functions/create-b2b-payment/index.ts:32:    console.log("Request body:", body);
supabase/functions/create-b2b-payment/index.ts:53:      console.error("STRIPE_SECRET not configured");
supabase/functions/create-b2b-payment/index.ts:65:    console.log(`Creating one-time checkout for deployment + ${seatCount} onboarding seats at ${totalAmount} ${checkoutCurrency}`);
supabase/functions/create-b2b-payment/index.ts:113:    console.log("Checkout session created:", session.id);
supabase/functions/create-b2b-payment/index.ts:123:    console.error("Error creating B2B payment:", error);
src/pages/b2b/B2BPaymentSuccess.tsx:35:      console.log('Verifying payment session:', sessionId);
src/pages/b2b/B2BPaymentSuccess.tsx:43:        console.error('Verification error:', error);
src/pages/b2b/B2BPaymentSuccess.tsx:79:      console.error('Error in payment verification:', error);
supabase/functions/delete-company/index.ts:300:    console.error("Unexpected error in delete-company:", err);
supabase/functions/generate-team-insights/index.ts:52:      console.error("OPENAI_API_KEY not configured");
supabase/functions/generate-team-insights/index.ts:154:    console.log(
supabase/functions/generate-team-insights/index.ts:178:      console.error("OpenAI API error:", response.status, errorText);
supabase/functions/generate-team-insights/index.ts:204:      console.error("No content in OpenAI response:", data);
supabase/functions/generate-team-insights/index.ts:228:      console.error("Failed to parse AI response:", parseError, content);
supabase/functions/generate-team-insights/index.ts:235:    console.log("Successfully generated detailed team insights with OpenAI");
supabase/functions/generate-team-insights/index.ts:243:    console.error("Error in generate-team-insights:", error);
supabase/functions/invite-candidate/index.ts:60:      console.error("Company not found:", companyError);
supabase/functions/invite-candidate/index.ts:86:      console.error("Failed to create candidate:", insertError);
supabase/functions/invite-candidate/index.ts:182:          console.error("Mailgun error:", errorText);
supabase/functions/invite-candidate/index.ts:184:          console.log("Invitation email sent successfully");
supabase/functions/invite-candidate/index.ts:187:        console.error("Failed to send email:", emailError);
supabase/functions/invite-candidate/index.ts:200:    console.error("Error in invite-candidate:", error);
src/pages/b2b/ProfessionalAssessment25Q.tsx:349:            console.error('Error saving assessment results:', error);
supabase/functions/invite-company-user/index.ts:75:    console.error("MAILGUN_API_KEY or MAILGUN_DOMAIN not configured");
supabase/functions/invite-company-user/index.ts:79:  console.log("Sending email via Mailgun domain:", mailgunDomain);
supabase/functions/invite-company-user/index.ts:215:      console.error("Mailgun error:", response.status, errorText);
supabase/functions/invite-company-user/index.ts:219:    console.log("Invite email sent successfully to:", email);
supabase/functions/invite-company-user/index.ts:222:    console.error("Error sending email:", error);
supabase/functions/invite-company-user/index.ts:239:    console.error("MAILGUN_API_KEY or MAILGUN_DOMAIN not configured");
supabase/functions/invite-company-user/index.ts:328:      console.error("Mailgun error:", response.status, errorText);
supabase/functions/invite-company-user/index.ts:334:    console.error("Error sending privileged invite email:", error);
supabase/functions/invite-company-user/index.ts:348:      console.log("No authorization header provided");
supabase/functions/invite-company-user/index.ts:370:      console.log("Invalid token:", authError?.message);
supabase/functions/invite-company-user/index.ts:402:    console.log("Inviting user:", { company_id, email });
supabase/functions/invite-company-user/index.ts:418:      console.log("User is not a company admin for this company. User ID:", user.id, "Company ID:", company_id);
supabase/functions/invite-company-user/index.ts:486:    console.log("Attempting to charge for invite...");
supabase/functions/invite-company-user/index.ts:498:    console.log("Charge result:", chargeResult);
supabase/functions/invite-company-user/index.ts:525:    console.log("Charge successful - proceeding with invite");
supabase/functions/invite-company-user/index.ts:610:        console.error("Error re-inviting user:", updateError);
supabase/functions/invite-company-user/index.ts:614:      console.log("User re-invited:", invitedUser.id);
supabase/functions/invite-company-user/index.ts:638:        console.error("Error creating user invite:", userError);
supabase/functions/invite-company-user/index.ts:642:      console.log("User invited:", invitedUser.id);
supabase/functions/invite-company-user/index.ts:670:      console.log('Attempting to send Slack DM invite...');
supabase/functions/invite-company-user/index.ts:691:      console.log('Slack DM result:', slackResult);
supabase/functions/invite-company-user/index.ts:693:      console.error('Slack DM error (non-fatal):', slackError);
supabase/functions/invite-company-user/index.ts:710:      if (error) console.error('Audit log insert failed (non-fatal):', error.message);
supabase/functions/invite-company-user/index.ts:734:    console.error("Error:", error);
supabase/functions/send-scheduled-report/index.ts:151:    console.log(`Found ${dueReports?.length || 0} reports to send`);
supabase/functions/send-scheduled-report/index.ts:259:        console.error(`Error processing report ${report.id}:`, reportError);
supabase/functions/send-scheduled-report/index.ts:270:    console.error("Error in send-scheduled-report:", error);
supabase/functions/promote-company-user/index.ts:53:    console.error("MAILGUN_API_KEY or MAILGUN_DOMAIN not configured");
supabase/functions/promote-company-user/index.ts:145:      console.error("Mailgun error sending admin promotion email:", response.status, errorText);
supabase/functions/promote-company-user/index.ts:151:    console.error("Error sending admin promotion email:", error);
supabase/functions/promote-company-user/index.ts:330:    console.error("Error in promote-company-user:", error);
supabase/functions/api-assessments/index.ts:44:    console.error('DB error:', error);
supabase/functions/api-assessments/index.ts:466:        console.error('Query error:', error);
supabase/functions/api-assessments/index.ts:503:    console.error('Unhandled error:', err);
supabase/functions/create-company/index.ts:58:      console.log('No authorization header provided');
supabase/functions/create-company/index.ts:73:      console.log('Invalid token:', authError?.message);
supabase/functions/create-company/index.ts:80:    console.log('Authenticated user:', user.id, user.email);
supabase/functions/create-company/index.ts:116:    console.log('Creating company:', { name, subdomain, admin_email, user_id: user.id });
supabase/functions/create-company/index.ts:151:      console.error('Error creating company:', companyError);
supabase/functions/create-company/index.ts:155:    console.log('Company created:', company.id);
supabase/functions/create-company/index.ts:177:      console.error('Error creating admin user:', adminUserError);
supabase/functions/create-company/index.ts:181:    console.log('Admin user created:', adminUser.id, 'with invite code:', inviteCode);
supabase/functions/create-company/index.ts:189:    console.error('Error:', error);
supabase/functions/calculate-user-refund/index.ts:13:  console.log(`[CALCULATE-REFUND] ${step}${detailsStr}`);
supabase/functions/draft-task-email/index.ts:115:      console.error("AI Gateway error:", response.status, errorText);
supabase/functions/draft-task-email/index.ts:148:      console.error("Failed to parse AI response as JSON:", parseError);
supabase/functions/draft-task-email/index.ts:156:    console.log("Generated email draft:", { subject: emailData.subject, bodyLength: emailData.body.length });
supabase/functions/draft-task-email/index.ts:162:    console.error("Error in draft-task-email:", error);
supabase/functions/slack-oauth-callback/index.ts:114:    console.error("slack-oauth-callback error", error);
src/pages/careers/PublicCareersPage.tsx:161:      console.error('Error fetching career page:', err);
supabase/functions/invite-family-member/index.ts:11:  console.log(`[INVITE-FAMILY-MEMBER] ${step}${detailsStr}`);
supabase/functions/send-slack-notification/index.ts:40:    console.log("Slack user not found for email:", email, data.error);
supabase/functions/send-slack-notification/index.ts:43:    console.error("Error looking up Slack user:", error);
supabase/functions/send-slack-notification/index.ts:63:      console.error("Failed to open DM channel:", openData.error);
supabase/functions/send-slack-notification/index.ts:85:      console.error("Failed to send DM:", messageData.error);
supabase/functions/send-slack-notification/index.ts:89:    console.log("DM sent successfully to user:", userId);
supabase/functions/send-slack-notification/index.ts:92:    console.error("Error sending DM:", error);
supabase/functions/send-slack-notification/index.ts:115:      console.error("Failed to post to channel:", data.error);
supabase/functions/send-slack-notification/index.ts:119:    console.log("Message posted to channel:", channelId);
supabase/functions/send-slack-notification/index.ts:122:    console.error("Error posting to channel:", error);
supabase/functions/send-slack-notification/index.ts:141:      console.error("Failed to post to Slack webhook:", await response.text());
supabase/functions/send-slack-notification/index.ts:147:    console.error("Error posting to Slack webhook:", error);
supabase/functions/send-slack-notification/index.ts:689:    console.error("Error sending Slack notification:", error);
supabase/functions/manage-user-sessions/index.ts:15:    console.error("Session inspection failed:", error.message);
supabase/functions/manage-user-sessions/index.ts:64:        console.error("Session sign-out failed:", error.message);
supabase/functions/manage-user-sessions/index.ts:100:    console.error("Error in manage-user-sessions:", error);
src/pages/careers/PublicJobDetailPage.tsx:140:      console.error('Error fetching job:', err);
src/pages/careers/PublicJobDetailPage.tsx:268:      console.error('Application error:', error);
supabase/functions/customer-portal/index.ts:12:  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
supabase/functions/save-company-assessment/index.ts:66:      console.log('Invalid employee ID format')
supabase/functions/save-company-assessment/index.ts:74:      console.log('Invalid company ID format')
supabase/functions/save-company-assessment/index.ts:82:      console.log('Invalid results format or size')
supabase/functions/save-company-assessment/index.ts:89:    console.log('Saving assessment for employee:', employeeId, 'company:', companyId)
supabase/functions/save-company-assessment/index.ts:105:      console.error('Employee not found:', lookupError)
supabase/functions/save-company-assessment/index.ts:114:      console.log('Assessment already completed for employee at:', employee.assessment_completed_at)
supabase/functions/save-company-assessment/index.ts:164:        console.error('Error updating assessment result:', updateResultError)
supabase/functions/save-company-assessment/index.ts:171:      console.log('Updated existing assessment result:', assessmentResultId)
supabase/functions/save-company-assessment/index.ts:185:        console.error('Error inserting assessment result:', insertError)
supabase/functions/save-company-assessment/index.ts:192:      console.log('Created new assessment result:', assessmentResultId)
supabase/functions/save-company-assessment/index.ts:207:      console.error('Error updating employee record:', updateError)
supabase/functions/save-company-assessment/index.ts:214:    console.log('Employee record updated successfully')
supabase/functions/save-company-assessment/index.ts:228:      console.error('Error cancelling reminders (non-fatal):', cancelError)
supabase/functions/save-company-assessment/index.ts:230:      console.log(`Auto-cancelled ${cancelledReminders.length} pending reminder(s) for employee`)
supabase/functions/save-company-assessment/index.ts:237:      console.log('Sending Slack notification for assessment completion')
supabase/functions/save-company-assessment/index.ts:257:      }).catch(err => console.error('Slack notification error (non-fatal):', err))
supabase/functions/save-company-assessment/index.ts:259:      console.error('Error checking Slack settings (non-fatal):', slackError)
supabase/functions/save-company-assessment/index.ts:272:    console.error('Unexpected error:', error)
src/pages/SubscriptionSuccess.tsx:47:      console.error('Error refreshing subscription:', error);
src/pages/Results.tsx:456:      console.error('Error saving assessment:', error);
src/pages/Results.tsx:525:      console.error('Error generating PDF:', error);
supabase/functions/subscribe-hiring-tab/index.ts:21:  console.log("=== SUBSCRIBE TO HIRING TAB FUNCTION STARTED ===");
supabase/functions/subscribe-hiring-tab/index.ts:98:      console.error("Failed to acquire subscription lock:", lockErrorResponse);
supabase/functions/subscribe-hiring-tab/index.ts:116:        console.error("Failed to reacquire subscription lock after stale-lock recovery:", lockErrorResponse);
supabase/functions/subscribe-hiring-tab/index.ts:174:        console.error("Failed to normalize portal billing dates:", repairError);
supabase/functions/subscribe-hiring-tab/index.ts:203:    console.log("Proration check:", {
supabase/functions/subscribe-hiring-tab/index.ts:229:        console.error("update_company_internal_free error", freeUpdateError);
supabase/functions/subscribe-hiring-tab/index.ts:262:    console.log("Billing calculation:", {
supabase/functions/subscribe-hiring-tab/index.ts:329:          console.log("Stripe-level duplicate guard triggered — existing active sub found:", existingHiringSub.id);
supabase/functions/subscribe-hiring-tab/index.ts:352:          console.log("Found incomplete hiring subscription, cancelling before retry:", existingHiringSub.id);
supabase/functions/subscribe-hiring-tab/index.ts:356:            console.error("Failed to cancel incomplete subscription:", cancelErr);
supabase/functions/subscribe-hiring-tab/index.ts:370:        console.log("No card on stored customer, scanning all email-matched customers...");
supabase/functions/subscribe-hiring-tab/index.ts:376:            console.log("Found card on alternate customer", c.id, "— updating stored customer ID");
supabase/functions/subscribe-hiring-tab/index.ts:464:          console.error("Stripe payment intent create error:", stripeErr);
supabase/functions/subscribe-hiring-tab/index.ts:513:        console.error("Stripe subscription create error (prorated flow):", stripeErr);
supabase/functions/subscribe-hiring-tab/index.ts:536:        console.error("update_company_subscription error", subUpdateError);
supabase/functions/subscribe-hiring-tab/index.ts:599:        console.error("update_company (full credits) error", updateError);
supabase/functions/subscribe-hiring-tab/index.ts:624:      console.log("Subscription activated — fully covered by credits");
supabase/functions/subscribe-hiring-tab/index.ts:648:      console.log("No card on stored customer, scanning all email-matched customers...");
supabase/functions/subscribe-hiring-tab/index.ts:654:          console.log("Found card on alternate customer", c.id, "— updating stored customer ID");
supabase/functions/subscribe-hiring-tab/index.ts:701:      console.log(`Coupon ${couponId} for $${creditContribution.toFixed(2)} (request ${requestId})`);
supabase/functions/subscribe-hiring-tab/index.ts:746:      console.error("Stripe subscription create error:", stripeErr);
supabase/functions/subscribe-hiring-tab/index.ts:797:      console.log(`Deducted $${creditContribution.toFixed(2)} credits after successful card charge`);
supabase/functions/subscribe-hiring-tab/index.ts:814:      console.error("update_company_subscription error", subUpdateError);
supabase/functions/subscribe-hiring-tab/index.ts:884:          console.error("Failed to persist hiring subscription lock state:", persistLockError);
supabase/functions/subscribe-hiring-tab/index.ts:889:    console.error("Error creating hiring subscription:", error);
src/pages/CareerResumeResults.tsx:92:      console.error('Failed to parse analysis:', e);
supabase/functions/revoke-elevated-access/index.ts:80:    console.error("Error in revoke-elevated-access:", error);
supabase/functions/send-assessment-email/index.ts:165:      console.error("Mailgun error sending assessment email:", response.status, errorText);
supabase/functions/send-assessment-email/index.ts:177:    console.error("send-assessment-email error:", error);
src/pages/BlogPost.tsx:48:      console.error("Error loading post:", error);
supabase/functions/super-admin-toggle-hiring/index.ts:14:  console.log("=== SUPER ADMIN TOGGLE HIRING FUNCTION STARTED ===");
supabase/functions/super-admin-toggle-hiring/index.ts:47:    console.log(`Super admin ${userEmail} attempting to ${action} hiring for company ${companyId}`);
supabase/functions/super-admin-toggle-hiring/index.ts:75:            console.log("Reactivated existing subscription:", company.hiring_subscription_id);
supabase/functions/super-admin-toggle-hiring/index.ts:108:          console.error("Error with existing subscription:", stripeError);
supabase/functions/super-admin-toggle-hiring/index.ts:179:          console.log("Set subscription to cancel at period end:", company.hiring_subscription_id);
supabase/functions/super-admin-toggle-hiring/index.ts:220:          console.error("Error cancelling subscription:", stripeError);
supabase/functions/super-admin-toggle-hiring/index.ts:232:          console.log("Cancelled Stripe subscription immediately:", company.hiring_subscription_id);
supabase/functions/super-admin-toggle-hiring/index.ts:234:          console.error("Error cancelling Stripe subscription:", stripeError);
supabase/functions/super-admin-toggle-hiring/index.ts:260:      console.log("Hiring platform disabled immediately for company:", companyId);
supabase/functions/super-admin-toggle-hiring/index.ts:274:    console.error("Error toggling hiring access:", error);
src/pages/CareerFinderResults.tsx:75:      console.log('Career Finder Results - Found assessments:', assessments);
src/pages/CareerFinderResults.tsx:78:        console.error('Error loading assessment:', error);
src/pages/CareerFinderResults.tsx:100:        console.log('Found color:', color, 'secondary:', secondary);
src/pages/CareerFinderResults.tsx:108:      console.error('Error loading career data:', error);
supabase/functions/add-credits/index.ts:83:    console.log("Adding credits:", { company_id, amount, user_id: user.id });
supabase/functions/add-credits/index.ts:205:      console.error("Error updating balance:", updateError);
supabase/functions/add-credits/index.ts:224:      console.error("Error logging credit:", creditLogError);
supabase/functions/add-credits/index.ts:240:        console.error("Error logging charge transaction:", txError);
supabase/functions/add-credits/index.ts:244:    console.log("Credits added successfully. New balance:", newBalance);
supabase/functions/add-credits/index.ts:255:    console.error("Error:", error);
supabase/functions/create-link-token/index.ts:89:    console.error("create-link-token error", error);
src/pages/candidate/CandidateAssessment.tsx:162:          console.error('Error saving assessment:', err);
supabase/functions/send-candidate-email/index.ts:116:      console.error("Mailgun error sending candidate email:", response.status, errorText);
supabase/functions/send-candidate-email/index.ts:128:    console.error("send-candidate-email error:", error);
supabase/functions/retrieve-token/index.ts:158:    console.error("retrieve-token error", error);
src/pages/candidate/CandidateLogin.tsx:85:      }).catch(err => console.error('Resume parsing failed:', err));
src/pages/candidate/CandidateLogin.tsx:88:      console.error('Resume upload error:', error);
src/pages/candidate/CandidateLogin.tsx:157:      console.error('Verification error:', err);
src/pages/candidate/CandidateLogin.tsx:273:      console.error('Application error:', err);
src/pages/B2B.tsx:155:      console.error('Create company error:', errorMessage);
supabase/functions/resubscribe-hiring/index.ts:19:  console.log("=== RESUBSCRIBE HIRING FUNCTION STARTED ===");
supabase/functions/resubscribe-hiring/index.ts:64:    console.log("Company state:", {
supabase/functions/resubscribe-hiring/index.ts:121:        console.log("Reactivated subscription in Stripe:", company.hiring_subscription_id);
supabase/functions/resubscribe-hiring/index.ts:133:        console.log("Updated company record for reactivation");
supabase/functions/resubscribe-hiring/index.ts:144:        console.error("Stripe error during reactivation:", stripeError);
supabase/functions/resubscribe-hiring/index.ts:174:    console.log("Cannot resubscribe - no valid subscription state. Company state:", {
supabase/functions/resubscribe-hiring/index.ts:182:    console.error("Error resubscribing to hiring:", error);
supabase/functions/generate-interview-questions/index.ts:98:      console.error("AI Gateway error:", response.status, errorText);
supabase/functions/generate-interview-questions/index.ts:117:      console.error("Error parsing AI response:", parseError);
supabase/functions/generate-interview-questions/index.ts:146:    console.error("Error generating interview questions:", error);
src/pages/Index.tsx:95:      console.error('Celebrity analysis error:', error);
src/pages/Index.tsx:175:      console.error("Contact form submission failed:", error);
supabase/functions/check-subscription/index.ts:12:  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
supabase/functions/add-seats-payment/index.ts:10:  console.log("=== ADD SEATS PAYMENT FUNCTION STARTED ===");
supabase/functions/add-seats-payment/index.ts:18:    console.log("Request body:", body);
supabase/functions/add-seats-payment/index.ts:45:      console.error("STRIPE_SECRET not configured");
supabase/functions/add-seats-payment/index.ts:56:    console.log(`Creating checkout for ${additionalSeats} additional seats at $${totalAmount / 100}`);
supabase/functions/add-seats-payment/index.ts:86:    console.log("Checkout session created:", session.id);
supabase/functions/add-seats-payment/index.ts:96:    console.error("Error creating add seats payment:", error);
src/pages/admin/BlogEditor.tsx:65:      console.error("Error:", error);
src/pages/admin/BlogEditor.tsx:96:      console.error("Error loading post:", error);
supabase/functions/cancel-hiring-subscription/index.ts:34:    console.error("Failed to record hiring cancellation event:", error);
supabase/functions/cancel-hiring-subscription/index.ts:39:  console.log("=== CANCEL HIRING SUBSCRIPTION FUNCTION STARTED ===");
supabase/functions/cancel-hiring-subscription/index.ts:99:        console.log("Commitment block active until", blockUntilFormatted, "for company", companyId);
supabase/functions/cancel-hiring-subscription/index.ts:133:        console.log("Hiring platform disabled immediately by super admin (no Stripe subscription):", companyId);
supabase/functions/cancel-hiring-subscription/index.ts:161:        console.log("Hiring platform set to cancel at end of billing period (no Stripe subscription):", companyId);
supabase/functions/cancel-hiring-subscription/index.ts:200:      console.log("Hiring subscription cancelled immediately:", companyId);
supabase/functions/cancel-hiring-subscription/index.ts:234:        console.log("Hiring subscription set to cancel at period end:", companyId);
supabase/functions/cancel-hiring-subscription/index.ts:245:        console.error("Stripe cancellation failed, falling back to local cancellation state:", stripeError);
supabase/functions/cancel-hiring-subscription/index.ts:279:    console.error("Error cancelling hiring subscription:", error);
supabase/functions/test-merge-connection/index.ts:181:    console.error("test-merge-connection error", error);
supabase/functions/create-proposal-payment/index.ts:59:    console.error("create-proposal-payment error:", error);
supabase/functions/process-monthly-billing/index.ts:25:  console.log(`[MONTHLY-BILLING] ${step}${detailsStr}`);
supabase/functions/slack-manage/index.ts:120:    console.warn("Could not load Slack channels", error);
supabase/functions/slack-manage/index.ts:137:    console.warn("Could not load Slack workspace users", error);
supabase/functions/charge-invite/index.ts:15:  console.log(`[CHARGE-INVITE] ${step}${detailsStr}`);
supabase/functions/validate-api-key/index.ts:59:      console.error('DB error:', error);
supabase/functions/validate-api-key/index.ts:85:      console.warn('Failed to update last_used_at:', updError.message);
supabase/functions/validate-api-key/index.ts:98:    console.error('Unhandled error:', err);
supabase/functions/ai-follow-up/index.ts:94:    console.log(`Processing ${contextType} follow-up question:`, question);
supabase/functions/ai-follow-up/index.ts:112:      console.error("OpenAI API error:", response.status, errorText);
supabase/functions/ai-follow-up/index.ts:137:    console.log("Successfully generated follow-up response");
supabase/functions/ai-follow-up/index.ts:145:    console.error("Error in ai-follow-up:", error);
supabase/functions/verify-add-seats-payment/index.ts:11:  console.log("=== VERIFY ADD SEATS PAYMENT FUNCTION STARTED ===");
supabase/functions/verify-add-seats-payment/index.ts:19:    console.log("Verifying session:", sessionId);
supabase/functions/verify-add-seats-payment/index.ts:36:    console.log("Session status:", session.payment_status);
supabase/functions/verify-add-seats-payment/index.ts:37:    console.log("Session metadata:", session.metadata);
supabase/functions/verify-add-seats-payment/index.ts:72:      console.error("Seat update error:", updateError);
supabase/functions/verify-add-seats-payment/index.ts:76:    console.log(`Successfully updated company ${company_id} to ${new_total} seats`);
supabase/functions/verify-add-seats-payment/index.ts:86:    console.error("Error verifying add seats payment:", error);
supabase/functions/send-task-assignment-email/index.ts:49:    console.error("MAILGUN_API_KEY not configured");
supabase/functions/send-task-assignment-email/index.ts:53:  console.log("Sending email via Mailgun to:", to);
supabase/functions/send-task-assignment-email/index.ts:80:      console.error("Mailgun error:", result);
supabase/functions/send-task-assignment-email/index.ts:84:    console.log("Email sent successfully:", result);
supabase/functions/send-task-assignment-email/index.ts:87:    console.error("Mailgun request error:", error);
supabase/functions/send-task-assignment-email/index.ts:197:      console.error("Failed to log email send:", dbError);
supabase/functions/send-task-assignment-email/index.ts:205:    console.error("Error in send-task-assignment-email:", error);
supabase/functions/convert-candidate-to-employee/index.ts:36:      console.error("Candidate not found:", candidateError);
supabase/functions/convert-candidate-to-employee/index.ts:102:          console.error("Failed to fetch existing employee:", existingUserError);
supabase/functions/convert-candidate-to-employee/index.ts:127:          console.error("Failed to sync existing employee:", updateExistingError);
supabase/functions/convert-candidate-to-employee/index.ts:136:        console.error("Failed to create employee:", employeeError);
supabase/functions/convert-candidate-to-employee/index.ts:147:      console.error("Failed to create employee:", employeeError);
supabase/functions/convert-candidate-to-employee/index.ts:164:      console.error("Failed to update candidate status:", updateError);
supabase/functions/convert-candidate-to-employee/index.ts:167:    console.log(`Candidate ${candidate.email} converted to employee ${employee.id}`);
supabase/functions/convert-candidate-to-employee/index.ts:178:    console.error("Error in convert-candidate-to-employee:", error);
supabase/functions/chatgpt-oauth-callback/index.ts:71:    console.error("chatgpt-oauth-callback error", error);
supabase/functions/send-teams-notification/index.ts:159:      console.error("Teams webhook error:", errorText);
supabase/functions/send-teams-notification/index.ts:166:    console.log("Teams notification sent:", { company_id, event_type });
supabase/functions/send-teams-notification/index.ts:174:    console.error("Error sending Teams notification:", error);
supabase/functions/verify-google-sso-employee/index.ts:25:    console.log(`Verifying Google SSO for user ${userEmail} in company ${companyId}`);
supabase/functions/verify-google-sso-employee/index.ts:39:      console.error('Company not found:', companyError);
supabase/functions/verify-google-sso-employee/index.ts:48:      console.log('Google SSO not enabled for this company');
supabase/functions/verify-google-sso-employee/index.ts:60:        console.log(`Domain mismatch: ${emailDomain} vs ${requiredDomain}`);
supabase/functions/verify-google-sso-employee/index.ts:80:      console.log('Existing employee found:', existingEmployee.id);
supabase/functions/verify-google-sso-employee/index.ts:95:          console.error('Error updating employee:', updateError);
supabase/functions/verify-google-sso-employee/index.ts:119:      console.error('Error counting employees:', countError);
supabase/functions/verify-google-sso-employee/index.ts:127:    console.log(`Current employee count: ${currentCount}, seats purchased: ${company.seats_purchased}`);
supabase/functions/verify-google-sso-employee/index.ts:144:      console.log('Charging for new seat...');
supabase/functions/verify-google-sso-employee/index.ts:156:        console.log('Charge result:', chargeResult);
supabase/functions/verify-google-sso-employee/index.ts:169:        console.error('Charge error:', chargeError);
supabase/functions/verify-google-sso-employee/index.ts:194:      console.error('Error creating employee:', createError);
supabase/functions/verify-google-sso-employee/index.ts:201:    console.log('New employee created:', newEmployee.id);
supabase/functions/verify-google-sso-employee/index.ts:215:      }).catch(err => console.error('Failed to send admin notification:', err));
supabase/functions/verify-google-sso-employee/index.ts:217:      console.error('Error triggering admin notification:', notifyError);
supabase/functions/verify-google-sso-employee/index.ts:232:    console.error('Unexpected error:', err);
supabase/functions/sync-bamboohr-hiring/index.ts:240:    console.error("Failed creating default pipeline stages", { jobPostingId, error });
supabase/functions/sync-bamboohr-hiring/index.ts:367:      console.error("Failed pushing RCF job to BambooHR", { jobId: job.id, err });
supabase/functions/sync-bamboohr-hiring/index.ts:546:        console.error("Failed to save BambooHR integration", upsertError);
supabase/functions/sync-bamboohr-hiring/index.ts:606:        console.error("Failed to update refreshed BambooHR token", tokenUpdateError);
supabase/functions/sync-bamboohr-hiring/index.ts:714:        console.error("Failed to fetch existing synced jobs", existingJobsError);
supabase/functions/sync-bamboohr-hiring/index.ts:748:            console.error("Failed to update synced BambooHR job", { job: job.externalId, error });
supabase/functions/sync-bamboohr-hiring/index.ts:764:            console.error("Failed to create synced BambooHR job", { job: job.externalId, error });
supabase/functions/sync-bamboohr-hiring/index.ts:803:    console.error("sync-bamboohr-hiring error", error);
supabase/functions/list-rcf-b2b-companies/index.ts:143:    console.error("Error in list-rcf-b2b-companies:", error);
supabase/functions/verify-b2b-payment/index.ts:13:  console.log("=== VERIFY B2B PAYMENT FUNCTION STARTED ===");
supabase/functions/verify-b2b-payment/index.ts:21:    console.log("Verifying session:", sessionId);
supabase/functions/verify-b2b-payment/index.ts:38:    console.log("Session status:", session.payment_status);
supabase/functions/verify-b2b-payment/index.ts:39:    console.log("Session metadata:", session.metadata);
supabase/functions/verify-b2b-payment/index.ts:79:      console.log("Company already exists, returning success");
supabase/functions/verify-b2b-payment/index.ts:111:      console.error("Company creation error:", companyError);
supabase/functions/verify-b2b-payment/index.ts:115:    console.log("Company created:", newCompany.id);
supabase/functions/verify-b2b-payment/index.ts:130:      console.error("Admin user creation error:", userError);
supabase/functions/verify-b2b-payment/index.ts:134:    console.log("B2B company setup complete");
supabase/functions/verify-b2b-payment/index.ts:146:    console.error("Error verifying B2B payment:", error);
supabase/functions/get-company-employee-session/index.ts:61:      console.error('Employee lookup error:', empError)
supabase/functions/get-company-employee-session/index.ts:91:        console.error('Assessment result fetch error:', resultError)
supabase/functions/get-company-employee-session/index.ts:117:    console.error('Unexpected error:', error)
supabase/functions/send-email/index.ts:146:        console.error("Auth webhook email send error:", error);
supabase/functions/send-email/index.ts:179:      console.error("Direct email send error:", error);
supabase/functions/send-email/index.ts:185:    console.error("send-email function error:", error);
supabase/functions/list-user-announcements/index.ts:81:    console.error("Error in list-user-announcements:", error);
supabase/functions/generate-ats-job-draft/index.ts:153:      console.error("generate-ats-job-draft OpenAI error", response.status, errorText);
supabase/functions/generate-ats-job-draft/index.ts:182:    console.error("generate-ats-job-draft error", error);
supabase/functions/chatgpt-oauth-init/index.ts:85:    console.error("chatgpt-oauth-init error", error);
supabase/functions/send-scheduled-reminders/index.ts:28:    console.error("MAILGUN_API_KEY or MAILGUN_DOMAIN not configured");
supabase/functions/send-scheduled-reminders/index.ts:110:      console.error("Mailgun error (probation reminder):", response.status, errorText);
supabase/functions/send-scheduled-reminders/index.ts:117:    console.error("Error sending probation reminder:", error);
supabase/functions/send-scheduled-reminders/index.ts:133:    console.error("MAILGUN_API_KEY or MAILGUN_DOMAIN not configured");
supabase/functions/send-scheduled-reminders/index.ts:224:      console.error("Mailgun error:", response.status, errorText);
supabase/functions/send-scheduled-reminders/index.ts:229:    console.log("Reminder email sent successfully to:", email, "Message ID:", result.id);
supabase/functions/send-scheduled-reminders/index.ts:234:    console.error("Error sending email:", error);
supabase/functions/send-scheduled-reminders/index.ts:290:      console.error("Error fetching reminders:", fetchError);
supabase/functions/send-scheduled-reminders/index.ts:294:    console.log(`Found ${dueReminders?.length || 0} due reminders`);
supabase/functions/send-scheduled-reminders/index.ts:311:        console.log(`Skipping reminder for ${user.email} - already completed or status changed`);
supabase/functions/send-scheduled-reminders/index.ts:358:            console.error("Error creating next recurring reminder:", insertError);
supabase/functions/send-scheduled-reminders/index.ts:360:            console.log(`Created next ${reminder.recurrence} reminder for ${user.email}`);
supabase/functions/send-scheduled-reminders/index.ts:387:      console.error("Error fetching probation reminders:", probationFetchError);
supabase/functions/send-scheduled-reminders/index.ts:479:    console.log("Reminder processing complete:", results);
supabase/functions/send-scheduled-reminders/index.ts:493:    console.error("Error processing reminders:", error);
supabase/functions/suggest-skills/index.ts:25:      console.error("OPENAI_API_KEY not configured");
supabase/functions/suggest-skills/index.ts:46:    console.log(`Suggesting skills for job role: ${jobRole}`);
supabase/functions/suggest-skills/index.ts:83:      console.error("AI Gateway error:", response.status, errorText);
supabase/functions/suggest-skills/index.ts:93:    console.log("Raw AI response:", content);
supabase/functions/suggest-skills/index.ts:114:      console.error("Failed to parse AI response:", parseError);
supabase/functions/suggest-skills/index.ts:119:    console.log("Suggested skills:", skills);
supabase/functions/suggest-skills/index.ts:126:    console.error("Error in suggest-skills:", error);
supabase/functions/recover-assessment-by-email/index.ts:369:    console.error('Recovery function error:', error)
supabase/functions/run-bamboohr-auto-sync/index.ts:113:    console.error("run-bamboohr-auto-sync error", error);
supabase/functions/send-offer-email/index.ts:181:      console.error("Mailgun error sending offer email:", response.status, errorText);
supabase/functions/send-offer-email/index.ts:193:    console.error("send-offer-email error:", error);
supabase/functions/send-interview-email/index.ts:181:      console.error("Mailgun error sending interview email:", response.status, errorText);
supabase/functions/send-interview-email/index.ts:193:    console.error("send-interview-email error:", error);
supabase/functions/charge-insight-redo/index.ts:15:  console.log(`[CHARGE-INSIGHT-REDO] ${step}${detailsStr}`);
supabase/functions/notify-admin-new-employee/index.ts:78:    console.log(`Sending admin notification for new employee: ${employeeEmail}`);
supabase/functions/notify-admin-new-employee/index.ts:87:      console.log('RESEND_API_KEY not configured, skipping email notification');
supabase/functions/notify-admin-new-employee/index.ts:103:      console.error('Company not found:', companyError);
supabase/functions/notify-admin-new-employee/index.ts:118:      console.error('Error fetching admins:', adminsError);
supabase/functions/notify-admin-new-employee/index.ts:130:      console.log('No admins to notify');
supabase/functions/notify-admin-new-employee/index.ts:137:    console.log(`Notifying ${adminEmails.size} admin(s)`);
supabase/functions/notify-admin-new-employee/index.ts:154:        console.error(`Failed to send to ${adminEmail}:`, err);
supabase/functions/notify-admin-new-employee/index.ts:162:    console.log(`Sent ${successCount}/${adminEmails.size} notifications`);
supabase/functions/notify-admin-new-employee/index.ts:170:    console.error('Unexpected error:', err);
supabase/functions/resend-invite/index.ts:46:    console.error('MAILGUN_API_KEY or MAILGUN_DOMAIN not configured');
supabase/functions/resend-invite/index.ts:50:  console.log('Sending email via Mailgun domain:', mailgunDomain);
supabase/functions/resend-invite/index.ts:183:      console.error('Mailgun error:', response.status, errorText);
supabase/functions/resend-invite/index.ts:187:    console.log('Resend invite email sent successfully to:', email);
supabase/functions/resend-invite/index.ts:190:    console.error('Error sending email:', error);
supabase/functions/resend-invite/index.ts:204:      console.log('No authorization header provided');
supabase/functions/resend-invite/index.ts:223:      console.log('Invalid token:', authError?.message);
supabase/functions/resend-invite/index.ts:241:    console.log('Resending invite for user:', user_id);
supabase/functions/resend-invite/index.ts:254:      console.error('User not found:', userError);
supabase/functions/resend-invite/index.ts:272:      console.log('User is not a company admin');
supabase/functions/resend-invite/index.ts:280:      console.log('User status is not invited:', targetUser.status);
supabase/functions/resend-invite/index.ts:290:      console.log('Max invites reached:', currentCount);
supabase/functions/resend-invite/index.ts:312:      console.error('Error updating user:', updateError);
supabase/functions/resend-invite/index.ts:336:    console.log('Invite resent, email sent:', emailSent, 'new count:', currentCount + 1);
supabase/functions/resend-invite/index.ts:349:    console.error('Error:', error);
supabase/functions/check-payment-status/index.ts:82:    console.error("Error checking payment status:", error);
supabase/functions/_shared/superAdmin.ts:46:    console.error("Error checking platform_super_admins:", error.message);
src/LegacyCandiadates/CandidateComparisonView.tsx:73:      console.error('Error fetching candidates:', error);
src/LegacyCandiadates/CandidatesTab.tsx:130:      console.error('Error fetching candidates:', error);
src/LegacyCandiadates/CandidatesTab.tsx:145:      console.error('Error fetching application links:', error);
src/LegacyCandiadates/CandidatesTab.tsx:779:              }).catch(err => console.error('Resume parsing failed:', err));
src/LegacyCandiadates/CandidatesTab.tsx:782:              console.error('Upload error:', error);
supabase/functions/analyze-career-resume/index.ts:68:      console.error("JSON parse error:", e);
supabase/functions/analyze-career-resume/index.ts:84:      console.log("Returning color-based recommendations (no API key or no resume content)");
supabase/functions/analyze-career-resume/index.ts:91:    console.log(`Analyzing resume for ${primaryColor} (${colorProfile.archetype}), type: ${fileType}, text length: ${resumeText?.length || 0}`);
supabase/functions/analyze-career-resume/index.ts:181:        console.error("OpenAI error:", errText);
supabase/functions/analyze-career-resume/index.ts:192:      console.log("AI response received, length:", content.length);
supabase/functions/analyze-career-resume/index.ts:200:        console.error("JSON parse failed, using fallback");
supabase/functions/analyze-career-resume/index.ts:213:      console.error("AI processing error:", aiErr);
supabase/functions/analyze-career-resume/index.ts:221:    console.error("Function error:", err);
src/pages/admin/UserManagement.tsx:61:      console.error("Error:", error);
src/pages/admin/UserManagement.tsx:95:      console.error("Error loading users:", error);
src/pages/admin/BlogManagement.tsx:53:      console.error("Error:", error);
src/pages/admin/BlogManagement.tsx:71:      console.error("Error loading posts:", error);
src/components/company/EmployeeTasksKanban.tsx:104:      console.log('Fetching tasks for employee:', employee.id);
src/components/company/EmployeeTasksKanban.tsx:130:      console.log('Raw task assignments:', data);
src/components/company/EmployeeTasksKanban.tsx:141:      console.log('Filtered valid tasks:', validTasks);
src/components/company/EmployeeTasksKanban.tsx:144:      console.error('Error fetching tasks:', error);
src/components/company/EmployeeTasksKanban.tsx:189:      console.error('Error updating task:', error);
src/pages/PublicRoleColorProfile.tsx:350:          console.error("Failed to load public profile", error);
src/lib/smoothScroll.ts:66:    console.warn(`Element with id "${elementId}" not found`);
src/pages/PremiumResults.tsx:163:        console.error('Supabase error:', error);
src/pages/PremiumResults.tsx:178:      console.error('Error saving assessment:', error);
src/pages/PremiumResults.tsx:217:      console.error('Error exporting PDF:', error);
src/pages/PremiumResults.tsx:242:            console.error('Error fetching shareable code:', error);
src/pages/PremiumResults.tsx:250:            console.log('No saved assessment found - will generate code on save');
src/pages/admin/AdminDashboard.tsx:59:      console.error("Error checking admin access:", error);
src/pages/admin/AdminDashboard.tsx:85:      console.error("Error loading stats:", error);
src/pages/Dashboard.tsx:503:          console.error("Super admin 2FA check failed:", error);
src/pages/Dashboard.tsx:511:        console.error("MFA check failed:", error);
src/pages/Dashboard.tsx:526:      console.error("Failed to load announcements:", error);
src/pages/Dashboard.tsx:630:      console.error('Error checking company access:', error);
src/pages/Dashboard.tsx:645:      console.error('Error fetching assessments:', error);
src/pages/Dashboard.tsx:678:      console.error('Error fetching in-progress assessments:', error);
src/pages/Dashboard.tsx:727:      console.error('Error downloading report:', error);
src/pages/Dashboard.tsx:944:      console.error('Error uploading avatar:', error);
supabase/functions/_shared/merge.ts:271:    console.error(`Failed to count rows for ${table}`, error);
supabase/functions/_shared/merge.ts:418:    console.error("Failed to log merge sync error", error);
supabase/functions/_shared/merge.ts:1011:    console.error("Failed to record RoleColor invite timestamp", employeeUpdateError);
supabase/functions/_shared/merge.ts:1064:      console.error("Failed to update pending RoleColor state", pendingError);
supabase/functions/api-gateway/index.ts:42:    console.error('DB error:', error);
supabase/functions/api-gateway/index.ts:215:    console.error('Unhandled error:', err);
supabase/functions/api-gateway/index.ts:272:        console.error('Invite error:', error);
supabase/functions/api-gateway/index.ts:340:      console.error('Query error:', error);
supabase/functions/api-gateway/index.ts:455:      console.error('Query error:', error);
supabase/functions/delete-billing-entry/index.ts:69:    console.error("delete-billing-entry error:", error);
src/components/career/ResumeCareerUpload.tsx:108:          console.log('Extracted PDF text length:', resumeText.length);
src/components/career/ResumeCareerUpload.tsx:110:          console.error('PDF extraction failed:', pdfErr);
src/components/career/ResumeCareerUpload.tsx:160:      console.error('Analysis error:', error);
supabase/functions/_shared/slack-assistant.ts:286:    console.error("slack assistant OpenAI error", response.status, errorText);
supabase/functions/initiate-voice-call/index.ts:29:    console.log('Initiating call to:', phone_number);
supabase/functions/initiate-voice-call/index.ts:53:      console.error('Database error:', dbError);
supabase/functions/initiate-voice-call/index.ts:155:      console.error('Bland API error:', blandData);
supabase/functions/initiate-voice-call/index.ts:159:    console.log('Call initiated successfully:', blandData);
supabase/functions/initiate-voice-call/index.ts:171:    console.error('Error in initiate-voice-call:', error);
src/components/auth/ProtectedRoute.tsx:78:        console.error('Error checking payment status:', error);
src/components/auth/ProtectedRoute.tsx:101:      console.error('Payment verification failed:', error);
src/components/reports/RoleColorIdentityCard.tsx:103:      console.error("Identity card export failed:", error);
src/lib/insightMetering.ts:66:      console.warn('Error fetching insight usage (columns may not exist):', error.message);
src/lib/insightMetering.ts:78:    console.warn('Exception fetching insight usage:', err);
src/lib/insightMetering.ts:134:      console.warn('Error loading insight credits:', companyError.message || companyError);
src/lib/insightMetering.ts:149:      console.warn('Error decrementing insight credits:', creditError.message || creditError);
src/lib/insightMetering.ts:166:      console.warn('Error updating insight usage (columns may not exist):', error.message);
src/lib/insightMetering.ts:169:    console.warn('Exception updating insight usage:', err);
src/lib/insightMetering.ts:217:    console.warn('Failed to purchase insight credits:', error?.message || data?.error);
src/components/payment/PaymentButton.tsx:35:    console.log("=== PAYMENT FLOW STARTED ===");
src/components/payment/PaymentButton.tsx:36:    console.log("Product type:", productType);
src/components/payment/PaymentButton.tsx:37:    console.log("User:", user?.email);
src/components/payment/PaymentButton.tsx:82:      console.log("Creating payment with data:", paymentData);
src/components/payment/PaymentButton.tsx:88:      console.log("Payment response:", { data, error });
src/components/payment/PaymentButton.tsx:91:        console.error("Payment creation error:", error);
src/components/payment/PaymentButton.tsx:101:      console.log("About to redirect to:", data.url);
src/components/payment/PaymentButton.tsx:107:      console.error("=== PAYMENT ERROR ===", error);
supabase/functions/_shared/chatgpt.ts:1245:    console.error("Failed to log ChatGPT tool call", error);
src/contexts/CompanyContext.tsx:310:      console.error('Error fetching company data:', error);
supabase/functions/_shared/admin.ts:80:    console.error("Failed to write admin action log:", error.message);
supabase/functions/_shared/slack.ts:274:    console.error("Failed to log Slack error", error);
src/contexts/HelpTourContext.tsx:433:      console.error('Failed to load tour progress:', e);
src/contexts/HelpTourContext.tsx:442:      console.error('Failed to save tour progress:', e);
src/components/b2b/AssessmentsTab.tsx:235:      console.error('Error fetching assessments:', error);
src/contexts/AuthContext.tsx:80:      console.error('Error checking subscription:', error);
src/contexts/CandidatePortalContext.tsx:189:        console.error('Error in fetchData:', err);
src/contexts/CandidatePortalContext.tsx:244:      console.error('Error refreshing candidate session:', err);
src/contexts/CandidatePortalContext.tsx:265:      console.error('Error fetching assessment results:', err);
src/contexts/CompanyPortalContext.tsx:103:          console.error('Error fetching company:', fetchError);
src/contexts/CompanyPortalContext.tsx:134:        console.error('Error in fetchCompany:', err);
src/contexts/CompanyPortalContext.tsx:189:        console.error('Failed to refresh employee session:', fetchError || data?.message);
src/contexts/CompanyPortalContext.tsx:199:      console.error('Error refreshing employee session:', err);
src/contexts/CompanyPortalContext.tsx:227:      console.error('Error fetching assessment results:', err);
src/components/profile/PublicRoleColorProfileSettings.tsx:421:          console.error("Failed to load public profile", error);
src/components/b2b/analytics/AdvancedAnalyticsDashboard.tsx:184:      console.error('Error fetching analytics:', error);
src/lib/exportUtils.ts:5:    console.warn('No data to export');
src/components/b2b/analytics/TeamCompatibilityMatrix.tsx:108:      console.error('Error fetching team members:', error);
src/components/b2b/ActivityFeed.tsx:430:      console.error('Error fetching activities:', error);
src/components/ui/user-profile-sidebar.tsx:159:        console.error('Error uploading avatar:', error);
src/lib/pdfExport.ts:58:    console.error('PDF Export Error:', error);
src/lib/pdfExport.ts:127:    console.log('Logo not available');
src/lib/auditLogger.ts:47:    console.error('Error logging audit event:', error);
src/components/b2b/matrix/TaskEmailModal.tsx:137:      console.error('Error generating email draft:', error);
src/components/b2b/matrix/TaskEmailModal.tsx:186:      console.error('Error sending email:', error);
src/components/b2b/matrix/TaskIntakeForm.tsx:138:      console.error('Error creating task:', error);
src/components/b2b/InsightUsageMeter.tsx:31:      console.error('Error fetching insight usage:', err);
src/hooks/useAssessmentProgress.ts:57:          console.error('Error loading progress:', error);
src/hooks/useAssessmentProgress.ts:80:      console.error('Error loading progress:', error);
src/hooks/useAssessmentProgress.ts:154:      console.error('Error saving progress:', error);
src/hooks/useAssessmentProgress.ts:175:      console.error('Error clearing progress:', error);
src/hooks/useAssessmentProgress.ts:203:      console.error('Error marking complete:', error);
src/components/b2b/TeamInsightsModal.tsx:333:        console.error('Error loading cached insights:', fetchError);
src/components/b2b/TeamInsightsModal.tsx:355:      console.error('Error loading insights:', err);
src/components/b2b/TeamInsightsModal.tsx:386:          console.error('Error updating insights:', updateError);
src/components/b2b/TeamInsightsModal.tsx:400:          console.error('Error inserting insights:', insertError);
src/components/b2b/TeamInsightsModal.tsx:405:      console.error('Error saving insights:', err);
src/components/b2b/TeamInsightsModal.tsx:507:        console.warn(`AI omitted ${missing.length} member(s), backfilling with defaults`);
src/components/b2b/TeamInsightsModal.tsx:545:      console.error('Error generating insights:', err);
src/components/b2b/TeamInsightsModal.tsx:590:      console.error('Error replaying cached insights:', err);
src/components/b2b/TeamInsightsModal.tsx:637:      console.error('Error processing paid re-do:', err);
src/components/b2b/TeamInsightsModal.tsx:663:      console.error('Error processing re-do usage:', err);
src/components/dashboard/ChangeEmailModal.tsx:121:      console.error('Error checking email:', error);
src/components/dashboard/ChangeEmailModal.tsx:175:      console.error('Error verifying account:', error);
src/components/dashboard/ChangeEmailModal.tsx:236:      console.error('Error changing email:', error);
src/components/b2b/ResumeUpload.tsx:117:      }).catch(err => console.error('Resume parsing failed:', err));
src/components/b2b/ResumeUpload.tsx:120:      console.error('Upload error:', error);
src/components/b2b/ResumeUpload.tsx:154:      console.error('Remove error:', error);
src/components/b2b/AIFollowUpChat.tsx:51:      console.error('Failed to get response:', error);
src/components/subscription/SubscriptionCard.tsx:57:      console.error('Checkout error:', error);
src/components/b2b/RolesTab.tsx:158:      console.error('Error fetching roles:', err);
src/components/b2b/RolesTab.tsx:181:      console.log('Found users with job_role:', users);
src/components/b2b/RolesTab.tsx:190:      console.log('Unique job roles:', uniqueJobRoles);
src/components/b2b/RolesTab.tsx:229:      console.log('Inserting roles:', rolesToInsert);
src/components/b2b/RolesTab.tsx:237:        console.error('Insert error:', insertError);
src/components/b2b/RolesTab.tsx:241:      console.log('Inserted roles:', insertedRoles);
src/components/b2b/RolesTab.tsx:251:      console.error('Error importing roles from users:', err);
src/components/b2b/RolesTab.tsx:275:        console.error('Error fetching users for skill propagation:', fetchError);
src/components/b2b/RolesTab.tsx:292:          console.error(`Error updating user ${user.id} skills:`, updateError);
src/components/b2b/RolesTab.tsx:298:      console.error('Error propagating skills to users:', err);
src/components/b2b/RolesTab.tsx:430:      console.error('Error saving role:', err);
src/components/b2b/RolesTab.tsx:460:      console.error('Error deleting role:', err);
src/components/b2b/RolesTab.tsx:507:      console.error('Error seeding default roles:', err);
src/components/b2b/RolesTab.tsx:547:          console.error(`Error updating role ${role.name}:`, error);
src/components/b2b/RolesTab.tsx:564:      console.error('Error bulk generating skills:', err);
src/components/b2b/DeleteCompanyModal.tsx:56:      console.error('Error requesting company deletion:', error);
src/components/subscription/SubscriptionStatus.tsx:33:      console.error('Portal error:', error);
src/components/b2b/HiringSubscriptionSettings.tsx:327:      console.error('Error loading renewal estimate:', error);
src/components/b2b/HiringSubscriptionSettings.tsx:548:      console.error('Error loading monthly statement:', error);
src/components/b2b/HiringSubscriptionSettings.tsx:720:      console.error('Error subscribing:', error);
src/components/b2b/HiringSubscriptionSettings.tsx:745:      console.error('Error reactivating subscription:', error);
src/components/b2b/HiringSubscriptionSettings.tsx:800:      console.error('Error cancelling subscription:', error);
src/hooks/useSubdomainDetection.ts:82:          console.error('Error fetching company by subdomain:', error);
src/hooks/useSubdomainDetection.ts:112:        console.error('Subdomain detection error:', err);
src/components/dashboard/MobileSidebar.tsx:130:      console.error('Error uploading avatar:', error);
src/components/b2b/TeamFrictionMapTab.tsx:337:      console.error('Failed to load Team Friction Map members', loadError);
src/components/subscription/FamilyMemberManager.tsx:44:      console.error('Error fetching members:', error);
src/components/subscription/FamilyMemberManager.tsx:76:      console.error('Invite error:', error);
src/components/subscription/FamilyMemberManager.tsx:103:      console.error('Remove error:', error);
src/components/b2b/GlobalSearch.tsx:169:      console.error('Search error:', error);
src/components/subscription/ProgressTracking.tsx:49:      console.error('Error fetching progress:', error);
src/components/b2b/SettingsTab.tsx:347:      console.error("Upload error:", error);
src/components/b2b/OverviewTab.tsx:182:      console.error('Error fetching stats:', error);
src/components/b2b/RemindersHistoryTab.tsx:78:      console.error('Error fetching reminders:', error);
src/components/b2b/RemindersHistoryTab.tsx:109:      console.error('Error cancelling reminder:', error);
src/components/b2b/UsersTab.tsx:257:      console.error('Error fetching company roles:', error);
src/components/b2b/UsersTab.tsx:308:      console.error('Error syncing job role to company roles:', error);
src/components/b2b/UsersTab.tsx:328:      console.error('Error fetching role skills for job role sync:', error);
src/components/b2b/UsersTab.tsx:684:          console.error("Error sending retake email:", emailError);
src/components/b2b/UsersTab.tsx:731:        console.error("Error clearing primary assignments:", primaryError);
src/components/b2b/UsersTab.tsx:740:        console.error("Error clearing secondary assignments:", secondaryError);
src/components/b2b/UsersTab.tsx:833:        console.error("Error clearing primary assignments:", primaryError);
src/components/b2b/UsersTab.tsx:842:        console.error("Error clearing secondary assignments:", secondaryError);
src/components/b2b/UsersTab.tsx:1170:      console.error("Error suggesting skills:", error);
src/components/b2b/UsersTab.tsx:1299:      console.warn('[UsersTabScroller] Missing users table container ref.');
src/components/b2b/UsersTab.tsx:1309:    console.info('[UsersTabScroller] Click', {
src/components/b2b/UsersTab.tsx:1320:      console.warn('[UsersTabScroller] No horizontal overflow detected. Nothing to scroll.');
src/components/b2b/UsersTab.tsx:1330:      console.info('[UsersTabScroller] After click', {
src/components/b2b/GoogleWorkspaceImportModal.tsx:161:      console.error('Error fetching Google users:', err);
src/components/b2b/GoogleWorkspaceImportModal.tsx:241:        console.error(`Failed to invite ${email}:`, err);
src/components/b2b/admin/AdminCompanyStatementModal.tsx:443:      console.error('Error loading statement:', error);
src/components/b2b/admin/ScheduledReportsManager.tsx:83:      console.error('Error fetching reports:', error);
src/components/b2b/hiring/InterviewQuestionGenerator.tsx:70:      console.error('Error generating questions:', error);
src/components/b2b/hiring/CandidateActivityTimeline.tsx:157:      console.error('Error fetching activities:', err);
src/components/b2b/UserProfileSheet.tsx:154:      console.error('Error fetching user profile:', error);
src/components/b2b/UserProfileSheet.tsx:187:      console.error('Error saving user profile:', error);
src/components/b2b/admin/ApiKeyManagement.tsx:66:      console.error('Error fetching API keys:', error);
src/components/b2b/hiring/MoveStageDialog.tsx:71:      console.error('Error fetching stages:', err);
src/components/b2b/hiring/MoveStageDialog.tsx:120:      console.error('Error moving stage:', err);
src/components/b2b/PaymentMethodCard.tsx:64:      console.error('Error fetching payment method:', error);
src/components/b2b/PaymentMethodCard.tsx:139:      console.error('Error setting up payment method:', error);
src/components/b2b/admin/AuditLogViewer.tsx:84:      console.error('Error fetching audit logs:', error);
src/components/b2b/hiring/SendEmailDialog.tsx:90:      console.error('Error sending email:', err);
src/components/b2b/EmployeeTasksView.tsx:155:      console.error('Error fetching tasks:', error);
src/components/b2b/EmployeeTasksView.tsx:199:      console.error('Error updating task:', error);
src/components/b2b/EmployeeTasksView.tsx:237:      console.error('Error adding note:', error);
src/components/b2b/hiring/CandidateProfileDialog.tsx:196:      console.error('Error fetching candidate:', err);
src/components/b2b/hiring/SendAssessmentDialog.tsx:161:        console.error('Failed to send email:', emailErr);
src/components/b2b/hiring/SendAssessmentDialog.tsx:177:      console.error('Error sending assessment:', err);
src/components/b2b/hiring/CandidateComparisonView.tsx:73:      console.error('Error fetching candidates:', error);
src/components/b2b/CandidatesTab.tsx:133:      console.error('Error fetching candidates:', error);
src/components/b2b/CandidatesTab.tsx:148:      console.error('Error fetching application links:', error);
src/components/b2b/CandidatesTab.tsx:779:              }).catch(err => console.error('Resume parsing failed:', err));
src/components/b2b/CandidatesTab.tsx:782:              console.error('Upload error:', error);
src/components/b2b/hiring/HiringSection.tsx:339:      console.error('Error subscribing to hiring tab:', err);
src/components/b2b/hiring/HiringSection.tsx:416:      console.error('Error resubscribing to hiring tab:', err);
src/components/b2b/hiring/HiringSection.tsx:438:      console.error('Error reactivating subscription:', err);
src/components/b2b/hiring/OffersTab.tsx:213:      console.error('Error fetching offers:', err);
src/components/b2b/hiring/JobPostingsTab.tsx:200:      console.error('Error fetching jobs:', err);
src/components/b2b/hiring/JobPostingsTab.tsx:222:      console.error('Error fetching company roles:', err);
src/components/b2b/hiring/JobPostingsTab.tsx:249:      console.error('Error loading ATS target default:', err);
src/components/b2b/hiring/JobPostingsTab.tsx:396:      console.error('Error generating ATS draft:', err);
src/components/b2b/hiring/JobPostingsTab.tsx:495:            console.error('Error creating pipeline stages:', stagesError);
src/components/b2b/hiring/JobPostingsTab.tsx:512:      console.error('Error saving job:', err);
src/components/b2b/hiring/JobPostingsTab.tsx:545:      console.error('Error updating status:', err);
src/components/b2b/hiring/JobPostingsTab.tsx:574:      console.error('Error deleting job:', err);
src/components/b2b/hiring/ScheduleInterviewDialog.tsx:201:          console.error('Failed to send email:', emailErr);
src/components/b2b/hiring/ScheduleInterviewDialog.tsx:218:      console.error('Error scheduling interview:', err);
src/components/b2b/hiring/HiringCandidatesTab.tsx:153:      console.error('Error fetching jobs:', err);
src/components/b2b/hiring/HiringCandidatesTab.tsx:168:      console.error('Error fetching stages:', err);
src/components/b2b/hiring/HiringCandidatesTab.tsx:220:      console.error('Error fetching applications:', err);
src/components/b2b/hiring/AddCandidateDialog.tsx:207:          console.log('Could not extract text from resume:', extractErr);
src/components/b2b/hiring/AddCandidateDialog.tsx:211:      console.error('Error uploading resume:', err);
src/components/b2b/hiring/AddCandidateDialog.tsx:242:        console.error('Error removing resume:', err);
src/components/b2b/hiring/AddCandidateDialog.tsx:425:      console.log('[AddCandidate] Starting save for:', { fullName, email, companyId, resumeUrl });
src/components/b2b/hiring/AddCandidateDialog.tsx:435:      console.log('[AddCandidate] Existing candidate lookup:', { existingCandidate, lookupError });
src/components/b2b/hiring/AddCandidateDialog.tsx:442:        console.log('[AddCandidate] Updating existing candidate:', candidateId);
src/components/b2b/hiring/AddCandidateDialog.tsx:458:          console.error('[AddCandidate] Update error:', updateError);
src/components/b2b/hiring/AddCandidateDialog.tsx:475:        console.log('[AddCandidate] Inserting new candidate:', insertData);
src/components/b2b/hiring/AddCandidateDialog.tsx:483:        console.log('[AddCandidate] Insert result:', { newCandidate, insertError });
src/components/b2b/hiring/AddCandidateDialog.tsx:486:          console.error('[AddCandidate] Insert error:', insertError);
src/components/b2b/hiring/AddCandidateDialog.tsx:544:      console.error('Error adding candidate:', err);
src/components/b2b/hiring/EmailTemplatesTab.tsx:181:      console.error('Error fetching templates:', err);
src/components/b2b/hiring/CareerPageSettings.tsx:122:      console.error('Error fetching career page settings:', err);
src/components/b2b/hiring/SendOfferDialog.tsx:265:          console.error('Failed to send email:', emailErr);
src/components/b2b/hiring/SendOfferDialog.tsx:289:      console.error('Error sending offer:', err);
src/components/b2b/hiring/CalendarIntegration.tsx:90:      console.error('Error fetching calendar integrations:', err);
src/components/b2b/hiring/HiringPipelineView.tsx:120:      console.error('Error fetching jobs:', err);
src/components/b2b/hiring/HiringPipelineView.tsx:161:      console.error('Error fetching pipeline data:', err);
src/components/b2b/hiring/HiringPipelineView.tsx:199:        console.error('Error logging transition:', transitionError);
src/components/b2b/hiring/HiringPipelineView.tsx:225:      console.error('Error moving candidate:', err);
src/components/b2b/hiring/HiringPipelineView.tsx:258:      console.error('Error rejecting candidate:', err);
src/components/b2b/hiring/HiringIntegrationsTab.tsx:535:      console.error('Failed to load Merge integration metadata', error);
src/components/b2b/hiring/HiringAnalyticsTab.tsx:86:      console.error('Error fetching jobs:', err);
src/components/b2b/hiring/HiringAnalyticsTab.tsx:283:      console.error('Error fetching analytics:', err);
src/components/b2b/hiring/AdvancedCandidateSearch.tsx:209:      console.error('Error loading filter options:', err);
src/components/b2b/hiring/BulkEmailComposer.tsx:163:      console.error('Error fetching data:', err);
src/components/b2b/hiring/BulkEmailComposer.tsx:302:        console.error('Error sending to', candidate.email, err);
src/components/b2b/hiring/InterviewsTab.tsx:185:      console.error('Error fetching interviews:', err);
```




### Hardcoded values that should be env/config driven



```
supabase/functions/run-merge-auto-sync/index.ts:38:    const providedKey = req.headers.get("x-merge-auto-sync-key") || "";
./src/pages/PaymentSuccess.tsx:26:          'send_to': 'AW-17863629259/VC_nCNu61uAbEMuzhcZC',
src/pages/PaymentSuccess.tsx:26:          'send_to': 'AW-17863629259/VC_nCNu61uAbEMuzhcZC',
./src/pages/CareerPaymentSuccess.tsx:28:          'send_to': 'AW-17863629259/VC_nCNu61uAbEMuzhcZC',
supabase/functions/run-bamboohr-auto-sync/index.ts:7:  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bamboo-auto-sync-key",
supabase/functions/run-bamboohr-auto-sync/index.ts:23:    const providedAutoSyncKey = req.headers.get("x-bamboo-auto-sync-key") || "";
supabase/functions/run-bamboohr-auto-sync/index.ts:76:            "x-bamboo-auto-sync-key": configuredAutoSyncKey,
supabase/functions/sync-bamboohr-hiring/index.ts:394:    const providedAutoSyncKey = req.headers.get("x-bamboo-auto-sync-key") || "";
supabase/functions/_shared/slack.ts:309:      client_secret: getRequiredEnv("SLACK_CLIENT_SECRET"),
src/pages/CareerPaymentSuccess.tsx:28:          'send_to': 'AW-17863629259/VC_nCNu61uAbEMuzhcZC',
supabase/migrations/20260322113000_schedule_bamboohr_auto_sync.sql:26:      'x-bamboo-auto-sync-key', '54b4b43eec0558e6d7320defcf3dcf3db7c7d2ce51d76c2e94fc68ec1ca3286a'
supabase/migrations/20260406000300_schedule_merge_auto_sync.sql:25:      'x-merge-auto-sync-key', '63d69c90a398f564a42009e22b8d7bbab128d8b8f4ce8f25b32a33bf7a1760f6'
./supabase/functions/run-merge-auto-sync/index.ts:38:    const providedKey = req.headers.get("x-merge-auto-sync-key") || "";
src/integrations/supabase/client.ts:5:const SUPABASE_URL = "https://qbuxoetprodjxpagfkoi.supabase.co";
src/integrations/supabase/client.ts:6:const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFidXhvZXRwcm9kanhwYWdma29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMDMzOTcsImV4cCI6MjA2OTU3OTM5N30.XWrpWtw6li21hAeIpeYImOdi20sVoQ7Hbh1Bd3zMBWA";
src/main.tsx:8:  dsn: "https://2110fe70d3740c1afbf80b6cf36c6d23@o4510791492567040.ingest.us.sentry.io/4510791495450624",
./src/integrations/supabase/client.ts:5:const SUPABASE_URL = "https://qbuxoetprodjxpagfkoi.supabase.co";
./src/integrations/supabase/client.ts:6:const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFidXhvZXRwcm9kanhwYWdma29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMDMzOTcsImV4cCI6MjA2OTU3OTM5N30.XWrpWtw6li21hAeIpeYImOdi20sVoQ7Hbh1Bd3zMBWA";
./index.html:110:    <!-- REB2B Tracking Script (with error handling to prevent Sentry noise from ad blockers) -->
./index.html:118:            s.onerror = function() { console.warn('REB2B script failed to load (likely blocked by ad blocker)'); };
./index.html:122:            console.warn('REB2B init error:', e);
./index.html:130:    posthog.init('phc_hyEyRvNVqN0tKElFb8U7oXEP51doQ401U1Y4bKDUgQs', {
./index.html:138:    <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17863629259"></script>
./index.html:143:      gtag('config', 'AW-17863629259');
./supabase/functions/_shared/slack.ts:309:      client_secret: getRequiredEnv("SLACK_CLIENT_SECRET"),
./src/main.tsx:8:  dsn: "https://2110fe70d3740c1afbf80b6cf36c6d23@o4510791492567040.ingest.us.sentry.io/4510791495450624",
./supabase/functions/run-bamboohr-auto-sync/index.ts:7:  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bamboo-auto-sync-key",
./supabase/functions/run-bamboohr-auto-sync/index.ts:23:    const providedAutoSyncKey = req.headers.get("x-bamboo-auto-sync-key") || "";
./supabase/functions/run-bamboohr-auto-sync/index.ts:76:            "x-bamboo-auto-sync-key": configuredAutoSyncKey,
./supabase/functions/sync-bamboohr-hiring/index.ts:394:    const providedAutoSyncKey = req.headers.get("x-bamboo-auto-sync-key") || "";
./supabase/migrations/20260406000300_schedule_merge_auto_sync.sql:25:      'x-merge-auto-sync-key', '63d69c90a398f564a42009e22b8d7bbab128d8b8f4ce8f25b32a33bf7a1760f6'
./supabase/migrations/20260322113000_schedule_bamboohr_auto_sync.sql:26:      'x-bamboo-auto-sync-key', '54b4b43eec0558e6d7320defcf3dcf3db7c7d2ce51d76c2e94fc68ec1ca3286a'
```




### Additional issues spotted during audit

| Issue | Why it matters |
| --- | --- |
| Duplicate \`AuthProvider\` mount (\`src/main.tsx\` and \`src/App.tsx\`) | Can cause duplicated auth subscriptions and confusing context behavior. |
| \`src/integrations/supabase/types.ts\` is stale relative to live DB | Generated local types do not reflect all live tables/columns such as Slack/ChatGPT/ATS additions. |
| RoleColor archetype labels are inconsistent across subsystems | Green/Blue especially vary between Organizer/Architect/Strategist and Innovator/Visionary/Connector, which can create contradictory UI/AI outputs. |
| ChatGPT integration backend exists while visible UI is hidden | Future agents may wrongly assume it is removed because current visible settings pages hide it. |
| Cron secret values were committed inside SQL migrations | Operational secrets should not live in migration history. |
| Personal integrations page is placeholder-only | Components for personal ChatGPT integration still exist, but the page intentionally hides integrations. |
| Slack remnants inside \`HiringIntegrationsTab.tsx\` | Slack was moved to Settings, but older Slack types/constants remain in the hiring integrations file. |
## 17. Naming Conventions
| Layer | Observed convention |
| --- | --- |
| React component files | Mostly PascalCase \`.tsx\` (\`UsersTab.tsx\`, \`HiringSection.tsx\`). |
| Page files | Mostly PascalCase \`.tsx\` in \`src/pages/**\`. |
| Utility/lib files | camelCase or descriptive lower-case names (\`assessmentScoring.ts\`, \`mergeCatalog.ts\`, \`teamFrictionMap.ts\`). |
| Database tables | snake_case plural nouns in Postgres (\`company_users\`, \`assessment_results\`, \`merge_connections\`). |
| Database columns | snake_case. |
| Edge functions | kebab-case folder names (\`send-slack-notification\`, \`create-link-token\`, \`chatgpt-mcp-server\`). |
| Env vars | UPPER_SNAKE_CASE. Browser-exposed vars use \`VITE_\` or legacy \`REACT_APP_\` prefixes. |



Pattern to follow when editing: keep new React components in PascalCase, new libs in lower camel/snake descriptive names, Postgres identifiers in snake_case, and edge function folders in kebab-case.
## 18. Deployment
- **Frontend deployment**: Vercel. `README.md` explicitly states pushes to `main` trigger production deploys. `vercel.json` exists in the repo root.

- **Frontend build**: Vite build output to `dist` via `npm run build`.

- **Edge function deployment**: Supabase Edge Functions, configured in `supabase/config.toml` and deployed against project ref `qbuxoetprodjxpagfkoi`.

- **Database migrations**: SQL migrations in `supabase/migrations`; linked DB push used for live schema changes.

- **Environment separation**: Production-linked Supabase project is clearly configured. A separate staging environment was **NOT FOUND** in code/config. Local `.env` exists for developer overrides.

- **CI/CD**: explicit pipeline config was **NOT FOUND** beyond Vercel’s Git-based deploy model and Supabase CLI usage. No GitHub Actions workflow directory was present in the tree.
## 19. Quick Reference – Cheat Sheet
### 10 most important tables

| Table | Primary key | Why it matters |
| --- | --- | --- |
| companies | id | Core org record for Business Portal and all org-scoped integrations. |
| company_users | id | Org-scoped membership, role permissions, invite state, assessment linkage, Slack linkage. |
| assessment_results | id | Canonical assessment outputs for personal, business, candidate, and career flows. |
| job_postings | id | Central hiring jobs table; also the local bridge target for ATS/BambooHR sync. |
| candidates | id | Candidate master records with fit scores and assessment linkage. |
| candidate_applications | id | Pipeline placement linking candidates to jobs/stages. |
| hiring_pipeline_stages | id | Per-job pipeline stage definitions. |
| merge_connections | id | Active Merge HRIS/ATS connection records. |
| slack_connections | id | Active Slack workspace connection/configuration. |
| chatgpt_connections | id | Hidden ChatGPT/OpenAI Apps SDK connection state. |



### 10 most important edge functions

| Endpoint | Purpose |
| --- | --- |
| /functions/v1/invite-company-user | Invites and provisions company users. |
| /functions/v1/save-company-assessment | Writes company-portal employee assessments. |
| /functions/v1/generate-team-insights | Generates AI team insight reports. |
| /functions/v1/analyze-task-assignment | Scores assignees for the Work Matrix. |
| /functions/v1/analyze-candidate-fit | Scores candidate fit for hiring. |
| /functions/v1/create-link-token | Starts Merge Link flow. |
| /functions/v1/retrieve-token | Completes Merge connection and sync. |
| /functions/v1/slack-manage | Slack admin state/settings/mapping endpoint. |
| /functions/v1/slack-events | Slack Events API endpoint. |
| /functions/v1/chatgpt-mcp-server | Hidden RoleColor MCP server for ChatGPT Apps SDK. |



### 5 most important components

| Component | File path | Why it matters |
| --- | --- | --- |
| B2BDashboard | src/pages/b2b/B2BDashboard.tsx | Main Business Portal shell and tab/router synchronization. |
| Dashboard | src/pages/Dashboard.tsx | Main Personal Portal shell and authenticated user hub. |
| SettingsTab | src/components/b2b/SettingsTab.tsx | Business settings surface for branding, billing, integrations, API, reports. |
| HiringSection | src/components/b2b/hiring/HiringSection.tsx | Hiring product shell and sub-tab gateway. |
| SlackIntegrationSettings | src/components/b2b/admin/SlackIntegrationSettings.tsx | Most sophisticated visible integration UI and admin mapping/settings surface. |



### `.env.example` (copy-paste starter; values intentionally blank)



```env
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
STRIPE_PUBLIC=
STRIPE_SECRET=
STRIPE_SECRET_KEY=
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
RESEND_API_KEY=
SENDGRID_API_KEY=
SEND_EMAIL_HOOK_SECRET=
OPENAI_API_KEY=
GEMINI_API_KEY=
BLAND_APIKEY=
BLAND_WEBHOOKSIGNING=
REACT_APP_MERGE_API_KEY=
MERGE_API_BASE_URL=
MERGE_WEBHOOK_SIGNATURE_KEY=
MERGE_AUTO_SYNC_KEY=
BAMBOOHR_CLIENT_ID=
BAMBOOHR_CLIENT_SECRET=
BAMBOOHR_AUTO_SYNC_KEY=
SLACK_APP_ID=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
CHATGPT_TOKEN_ENCRYPTION_KEY=
APP_BASE_URL=
PUBLIC_APP_URL=
PUBLIC_SUPABASE_URL=
RECOVERY_ADMIN_TOKEN=
```




### Single most important thing to know before making changes

> The repo’s visible frontend is only part of the system. Many critical behaviors live in Edge Functions and the live Supabase schema has evolved beyond the generated local types, so any non-trivial change should be checked against both the current React code **and** the linked production-like Supabase metadata before editing.
