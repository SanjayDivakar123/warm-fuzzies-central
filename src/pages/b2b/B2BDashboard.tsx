import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, ClipboardList, Settings as SettingsIcon, Loader2, LogOut, Brain, CalendarClock, Moon, Sun } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import OverviewTab from '@/components/b2b/OverviewTab';
import UsersTab from '@/components/b2b/UsersTab';
import AssessmentsTab from '@/components/b2b/AssessmentsTab';
import SettingsTab from '@/components/b2b/SettingsTab';
import { WorkAssigningMatrixTab } from '@/components/b2b/WorkAssigningMatrixTab';
import RemindersHistoryTab from '@/components/b2b/RemindersHistoryTab';
import { useTheme } from 'next-themes';

export default function B2BDashboard() {
  const { company, companyUser, loading, isAdmin, refreshCompany } = useCompany();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

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

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Clean header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={`${company.name} logo`}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-foreground/60" />
              </div>
            )}
            <span className="font-semibold text-foreground">{company.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
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
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-background border p-1 h-auto inline-flex">
            <TabsTrigger 
              value="overview" 
              className="px-4 py-2 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background rounded-md"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="px-4 py-2 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background rounded-md"
            >
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="assessments" 
              className="px-4 py-2 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background rounded-md"
            >
              Assessments
            </TabsTrigger>
            <TabsTrigger 
              value="reminders" 
              className="px-4 py-2 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background rounded-md"
            >
              Reminders
            </TabsTrigger>
            <TabsTrigger 
              value="matrix" 
              className="px-4 py-2 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background rounded-md"
            >
              Work Matrix
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="px-4 py-2 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background rounded-md"
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
