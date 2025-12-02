import { useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, ClipboardList, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import OverviewTab from '@/components/b2b/OverviewTab';
import UsersTab from '@/components/b2b/UsersTab';
import AssessmentsTab from '@/components/b2b/AssessmentsTab';
import SettingsTab from '@/components/b2b/SettingsTab';

export default function B2BDashboard() {
  const { company, companyUser, loading, isAdmin, refreshCompany } = useCompany();
  const { user } = useAuth();
  const { toast } = useToast();

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

  // Simple mount effect so useEffect remains used without auto-claim logic
  useEffect(() => {
    // B2B dashboard loaded
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

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{company.name}</h1>
          <p className="text-muted-foreground">
            {company.subdomain}.rolecolorfinder.com
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="assessments" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Assessments
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab company={company} />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab company={company} />
          </TabsContent>

          <TabsContent value="assessments">
            <AssessmentsTab company={company} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab company={company} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
