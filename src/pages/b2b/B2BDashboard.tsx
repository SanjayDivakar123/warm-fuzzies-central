import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, ClipboardList, Settings as SettingsIcon, Loader2, LogOut, Brain, CalendarClock, Moon, Sun, Monitor } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import OverviewTab from '@/components/b2b/OverviewTab';
import UsersTab from '@/components/b2b/UsersTab';
import AssessmentsTab from '@/components/b2b/AssessmentsTab';
import SettingsTab from '@/components/b2b/SettingsTab';
import { WorkAssigningMatrixTab } from '@/components/b2b/WorkAssigningMatrixTab';
import RemindersHistoryTab from '@/components/b2b/RemindersHistoryTab';
import { B2BThemeProvider, useB2BTheme } from '@/contexts/B2BThemeContext';
import { HelpButton, useAutoStartTour } from '@/components/help';

// Inner component that uses the B2B theme
function B2BDashboardContent() {
  const { company, companyUser, loading, isAdmin, refreshCompany } = useCompany();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useB2BTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-start dashboard tour for first-time admins (hook must be called unconditionally)
  useAutoStartTour('admin-dashboard-overview', 1500, !loading && !!company && isAdmin);

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
            <Button onClick={() => window.location.href = '/b2b'} className="w-full" style={{ backgroundColor: 'var(--b2b-secondary, #16a34a)' }}>
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
            <Button onClick={() => window.location.href = assessmentPath} className="w-full" style={{ backgroundColor: 'var(--b2b-secondary, #16a34a)' }}>
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
          <div className="flex items-center gap-3">
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
          </div>
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Inject dynamic styles for active tabs using company primary color */}
        <style>{`
          .b2b-tab[data-state=active] {
            background-color: var(--b2b-primary, #22c55e) !important;
            color: white !important;
          }
        `}</style>
        
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-background border p-1 h-auto inline-flex" data-tour="dashboard-tabs">
            <TabsTrigger 
              value="overview" 
              className="b2b-tab px-4 py-2 text-sm rounded-md transition-colors"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="b2b-tab px-4 py-2 text-sm rounded-md transition-colors"
            >
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="assessments" 
              className="b2b-tab px-4 py-2 text-sm rounded-md transition-colors"
            >
              Assessments
            </TabsTrigger>
            <TabsTrigger 
              value="reminders" 
              className="b2b-tab px-4 py-2 text-sm rounded-md transition-colors"
            >
              Reminders
            </TabsTrigger>
            <TabsTrigger 
              value="matrix" 
              className="b2b-tab px-4 py-2 text-sm rounded-md transition-colors"
            >
              Work Matrix
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="b2b-tab px-4 py-2 text-sm rounded-md transition-colors"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <OverviewTab company={company} />
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <UsersTab company={company} />
          </TabsContent>

          <TabsContent value="assessments" className="mt-0">
            <AssessmentsTab company={company} onSettingsSaved={refreshCompany} />
          </TabsContent>

          <TabsContent value="reminders" className="mt-0">
            <RemindersHistoryTab company={company} />
          </TabsContent>

          <TabsContent value="matrix" className="mt-0">
            <WorkAssigningMatrixTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <SettingsTab company={company} onSettingsSaved={refreshCompany} />
          </TabsContent>
        </Tabs>
      </main>
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
