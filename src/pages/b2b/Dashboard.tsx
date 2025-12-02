import { useEffect, useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, ClipboardList, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import OverviewTab from '@/components/b2b/OverviewTab';
import UsersTab from '@/components/b2b/UsersTab';
import AssessmentsTab from '@/components/b2b/AssessmentsTab';
import SettingsTab from '@/components/b2b/SettingsTab';

export default function Dashboard() {
  const { company, companyUser, loading, isAdmin } = useCompany();

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
          <CardContent>
            <Button onClick={() => window.location.href = '/b2b'}>
              Create Company
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Employee Portal</CardTitle>
            <CardDescription>
              Welcome to {company.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/quiz'}>
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
