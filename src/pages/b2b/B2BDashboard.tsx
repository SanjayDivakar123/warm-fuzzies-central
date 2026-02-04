import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, ClipboardList, Settings as SettingsIcon, Loader2, LogOut, Brain, CalendarClock, Moon, Sun, Monitor, UserSearch, BarChart3, Target, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import OverviewTab from '@/components/b2b/OverviewTab';
import UsersTab from '@/components/b2b/UsersTab';
import AssessmentsTab from '@/components/b2b/AssessmentsTab';
import SettingsTab from '@/components/b2b/SettingsTab';
import { WorkAssigningMatrixTab } from '@/components/b2b/WorkAssigningMatrixTab';
import RemindersHistoryTab from '@/components/b2b/RemindersHistoryTab';
import CandidatesTab from '@/components/b2b/CandidatesTab';
import AdvancedAnalyticsDashboard from '@/components/b2b/analytics/AdvancedAnalyticsDashboard';
import KeyboardShortcutsModal from '@/components/b2b/KeyboardShortcutsModal';
import { useKeyboardShortcuts, B2B_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { B2BThemeProvider, useB2BTheme } from '@/contexts/B2BThemeContext';
import { HelpButton, useAutoStartTour } from '@/components/help';
import MobileBottomNav from '@/components/b2b/MobileBottomNav';

// Inner component that uses the B2B theme
function B2BDashboardContent() {
  const { company, companyUser, loading, isAdmin, permissions, refreshCompany } = useCompany();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useB2BTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [scrollToSection, setScrollToSection] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    enabled: true,
    shortcuts: [
      { ...B2B_SHORTCUTS.NAVIGATE_OVERVIEW, action: () => setActiveTab('overview') },
      { ...B2B_SHORTCUTS.NAVIGATE_USERS, action: () => setActiveTab('users') },
      { ...B2B_SHORTCUTS.NAVIGATE_CANDIDATES, action: () => setActiveTab('candidates') },
      { ...B2B_SHORTCUTS.NAVIGATE_ASSESSMENTS, action: () => setActiveTab('assessments') },
      { ...B2B_SHORTCUTS.NAVIGATE_REMINDERS, action: () => setActiveTab('reminders') },
      { ...B2B_SHORTCUTS.NAVIGATE_MATRIX, action: () => setActiveTab('matrix') },
      { ...B2B_SHORTCUTS.NAVIGATE_SETTINGS, action: () => setActiveTab('settings') },
      { ...B2B_SHORTCUTS.HELP, action: () => setShowShortcuts(prev => !prev) },
      { ...B2B_SHORTCUTS.TOGGLE_THEME, action: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark') },
    ],
  });

  // Auto-start dashboard tour for first-time admins (hook must be called unconditionally)
  useAutoStartTour('admin-dashboard-overview', 1500, !loading && !!company && isAdmin);

  // Get role display label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'hr': return 'HR';
      case 'partner': return 'Partner';
      default: return role;
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/b2b';
  };

  useEffect(() => {
    const seatsAdded = searchParams.get('seats_added');
    const sessionId = searchParams.get('session_id');

    if (seatsAdded === 'true' && sessionId) {
      const verifyPayment = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('verify-add-seats-payment', {
            body: { sessionId },
          });

          if (error || !data?.success) {
            console.error('Seat payment verification failed:', error || data?.error);
          } else {
            toast({
              title: 'Seats added successfully!',
              description: `Your company now has ${data.newTotal} seats.`,
            });
          }
        } catch (err) {
          console.error('Error verifying seat payment:', err);
        }

        setSearchParams({});
        refreshCompany();
      };

      verifyPayment();
    } else {
      refreshCompany();
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company || !companyUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">No Company Access</CardTitle>
            <CardDescription>
              You don't have access to any company portal yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/b2b'} className="w-full">
              Create Company
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    const assessmentPath = company.assessment_type === '25q' 
      ? '/b2b/assessment-25q' 
      : '/b2b/assessment-50q';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome to {company.name}</CardTitle>
            <CardDescription>
              Complete your professional assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = assessmentPath} className="w-full">
              Take Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get company colors for styling
  const primaryColor = company.primary_color || '#22c55e';
  const secondaryColor = company.secondary_color || '#16a34a';

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Clean header with company color accent */}
      <header 
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50" 
        data-tour="dashboard-header"
        style={{ borderBottomColor: `${primaryColor}30` }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {(() => {
              // Determine which logo to show based on current theme
              const logoToShow = resolvedTheme === 'dark' && company.logo_url_dark ? company.logo_url_dark : company.logo_url;
              
              
              if (logoToShow) {
                return (
                  <img 
                    src={logoToShow} 
                    alt={`${company.name} logo`}
                    className="h-8 w-auto object-contain"
                  />
                );
              }
              return (
                <div className="h-8 w-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-foreground/60" />
                </div>
              );
            })()}
          </Link>
          <div className="flex items-center gap-2">
            {/* Help Button */}
            <HelpButton 
              tourFilter={(tour) => tour.id.startsWith('admin-')}
              size="sm"
              iconOnly
            />
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50" data-tour="theme-toggle">
              <Button
                variant={theme === 'light' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme('light')}
                title="Light mode"
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button
                variant={theme === 'dark' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme('dark')}
                title="Dark mode"
              >
                <Moon className="h-4 w-4" />
              </Button>
              <Button
                variant={theme === 'system' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme('system')}
                title="System theme"
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout} 
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8 pb-24 sm:pb-8">
        {/* Inject dynamic styles for active tabs using company colors */}
        <style>{`
          .b2b-tab[data-state=active] {
            background: linear-gradient(135deg, var(--b2b-primary, #22c55e), var(--b2b-secondary, #16a34a)) !important;
            color: white !important;
          }
          .b2b-tab:hover:not([data-state=active]) {
            background-color: hsl(var(--b2b-secondary-hsl, 142 76% 36%) / 0.1) !important;
          }
        `}</style>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <TabsList className="bg-background border p-1 h-auto hidden sm:inline-flex w-full gap-1 sticky top-16 z-40" data-tour="dashboard-tabs">
              {permissions.canViewOverview && (
                <TabsTrigger 
                  value="overview" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-colors flex-shrink-0"
                >
                  Overview
                </TabsTrigger>
              )}
              {permissions.canManageUsers && (
                <TabsTrigger 
                  value="users" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-colors flex-shrink-0"
                >
                  Users
                </TabsTrigger>
              )}
              {permissions.canManageCandidates && (
                <TabsTrigger 
                  value="candidates" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-colors flex-shrink-0"
                >
                  Candidates
                </TabsTrigger>
              )}
              {permissions.canViewAssessments && (
                <TabsTrigger 
                  value="assessments" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-colors flex-shrink-0"
                >
                  Assessments
                </TabsTrigger>
              )}
              {permissions.canManageReminders && (
                <TabsTrigger 
                  value="reminders" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-colors flex-shrink-0"
                >
                  Reminders
                </TabsTrigger>
              )}
              {permissions.canUseWorkMatrix && (
                <TabsTrigger 
                  value="matrix" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-colors flex-shrink-0"
                >
                  Work Matrix
                </TabsTrigger>
              )}
              {permissions.canViewOverview && (
                <TabsTrigger 
                  value="analytics" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-colors flex-shrink-0"
                >
                  Analytics
                </TabsTrigger>
              )}
              {permissions.canManageSettings && (
                <TabsTrigger 
                  value="settings" 
                  className="b2b-tab px-4 py-2 text-sm rounded-md transition-colors flex-shrink-0"
                >
                  Settings
                </TabsTrigger>
              )}
            </TabsList>
            {/* Role badge */}
            {companyUser && (
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {getRoleLabel(companyUser.role)}
              </span>
            )}
          </div>

          <TabsContent value="overview" className="mt-0 break-words">
            <OverviewTab company={company} />
          </TabsContent>

          <TabsContent value="users" className="mt-0 break-words">
            <UsersTab company={company} />
          </TabsContent>

          <TabsContent value="candidates" className="mt-0 break-words">
            <CandidatesTab company={company} />
          </TabsContent>

          <TabsContent value="assessments" className="mt-0 break-words">
            <AssessmentsTab 
              company={company} 
              onSettingsSaved={refreshCompany}
              onNavigateToSettings={() => {
                setActiveTab('settings');
                setScrollToSection('assessment-config');
              }}
            />
          </TabsContent>

          <TabsContent value="reminders" className="mt-0 break-words">
            <RemindersHistoryTab company={company} />
          </TabsContent>

          <TabsContent value="matrix" className="mt-0 break-words">
            <WorkAssigningMatrixTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-0 break-words">
            <SettingsTab 
              company={company} 
              onSettingsSaved={refreshCompany}
              scrollToSection={scrollToSection}
              onScrollComplete={() => setScrollToSection(null)}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0 break-words">
            <AdvancedAnalyticsDashboard companyId={company.id} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onChange={setActiveTab}
        permissions={permissions}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />
    </div>
  );
}

// Wrapper component that provides the B2B-specific theme
export default function B2BDashboard() {
  return (
    <B2BThemeProvider>
      <B2BDashboardContent />
    </B2BThemeProvider>
  );
}
