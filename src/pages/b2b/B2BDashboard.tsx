import { useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, ClipboardList, Settings as SettingsIcon, Loader2, LogOut, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import OverviewTab from '@/components/b2b/OverviewTab';
import UsersTab from '@/components/b2b/UsersTab';
import AssessmentsTab from '@/components/b2b/AssessmentsTab';
import SettingsTab from '@/components/b2b/SettingsTab';
import { WorkAssigningMatrixTab } from '@/components/b2b/WorkAssigningMatrixTab';

export default function B2BDashboard() {
  const { company, companyUser, loading, isAdmin, refreshCompany } = useCompany();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/b2b';
  };

  const handleClaimAccess = async () => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('link-test-company', {
        body: {
          user_id: user.id,
        },
      });

      if (error || (data && (data as any).error)) {
        const message = (error as any)?.message ?? (data as any)?.error ?? 'Unknown error';
        console.error('Error linking company access via edge function:', message);
        toast({
          title: 'Unable to link company access',
          description: message,
          variant: 'destructive',
        });
        return;
      }

      await refreshCompany();

      toast({
        title: 'Company access linked',
        description: 'Your B2B dashboard is now ready.',
      });
    } catch (err: any) {
      console.error('Unexpected error linking company access:', err);
      toast({
        title: 'Unexpected error',
        description: err.message ?? 'Please try again or contact support.',
        variant: 'destructive',
      });
    }
  };

  // Re-fetch company data on mount to ensure we have the latest data
  useEffect(() => {
    refreshCompany();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!company || !companyUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Company Access</CardTitle>
            <CardDescription>
              You don't have access to any company portal yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => window.location.href = '/b2b'}>
              Create Company
            </Button>
            <Button variant="outline" onClick={handleClaimAccess}>
              Use Test Company / Link Access
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    // Employee view - redirect to appropriate assessment
    const assessmentPath = company.assessment_type === '25q' 
      ? '/b2b/assessment-25q' 
      : '/b2b/assessment-50q';
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Welcome to {company.name}</CardTitle>
            <CardDescription>
              Complete your professional assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = assessmentPath}>
              Take Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryColor = company.primary_color || '#9b87f5';
  const secondaryColor = company.secondary_color || '#7E69AB';

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}08 0%, ${secondaryColor}05 50%, hsl(var(--background)) 100%)`
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with company branding */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={`${company.name} logo`}
                className="h-14 w-auto object-contain"
              />
            ) : (
              <div 
                className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
                }}
              >
                <Building2 className="h-7 w-7 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <p className="text-muted-foreground text-sm">
                Admin Dashboard
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout} 
            className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList 
            className="grid w-full grid-cols-5 p-1.5 h-auto rounded-xl"
            style={{ 
              backgroundColor: `${primaryColor}10`,
            }}
          >
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:shadow-md transition-all"
              style={{ 
                '--tw-shadow-color': `${primaryColor}30`,
              } as React.CSSProperties}
            >
              <Building2 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:shadow-md transition-all"
            >
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="assessments" 
              className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:shadow-md transition-all"
            >
              <ClipboardList className="h-4 w-4" />
              Assessments
            </TabsTrigger>
            <TabsTrigger 
              value="matrix" 
              className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:shadow-md transition-all"
            >
              <Brain className="h-4 w-4" />
              Work Matrix
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:shadow-md transition-all"
            >
              <SettingsIcon className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="animate-fade-in">
            <OverviewTab company={company} />
          </TabsContent>

          <TabsContent value="users" className="animate-fade-in">
            <UsersTab company={company} />
          </TabsContent>

          <TabsContent value="assessments" className="animate-fade-in">
            <AssessmentsTab company={company} onSettingsSaved={refreshCompany} />
          </TabsContent>

          <TabsContent value="matrix" className="animate-fade-in">
            <WorkAssigningMatrixTab />
          </TabsContent>

          <TabsContent value="settings" className="animate-fade-in">
            <SettingsTab company={company} onSettingsSaved={refreshCompany} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
