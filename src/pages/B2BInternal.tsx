import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, ClipboardList, Settings, Lock, Globe, Workflow } from "lucide-react";

const B2BInternal = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">RCF B2B Platform</h1>
            <Badge variant="secondary" className="ml-2">Internal Build</Badge>
          </div>
          <p className="text-muted-foreground">
            Scaffolding for the Role Color Finder B2B enterprise solution
          </p>
        </div>

        <div className="space-y-8">
          {/* Company Subdomain Area */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle>Company Subdomain Setup</CardTitle>
              </div>
              <CardDescription>
                Custom subdomains for enterprise clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-2">
                  Each company gets their own branded subdomain:
                </p>
                <code className="text-sm bg-muted px-3 py-1 rounded">
                  companyname.rolecolorfinder.com
                </code>
                <p className="text-xs text-muted-foreground mt-4">
                  Subdomain provisioning UI — Coming Soon
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Authentication Options */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle>Authentication Options</CardTitle>
              </div>
              <CardDescription>
                Login methods and SSO configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Base Login Methods (Included)</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Invite code login</li>
                    <li>• Email/password login</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Google SSO (Add-on)</h4>
                    <Badge>+$10/mo</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Toggle for enterprise SSO integration
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  No backend implementation — mockup only
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Dashboard Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle>Admin Dashboard</CardTitle>
              </div>
              <CardDescription>
                Company administrator control panel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="assessments">Assessments</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Company Stats</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Total seats purchased</li>
                        <li>• Active users</li>
                        <li>• Assessments completed</li>
                        <li>• Usage analytics</li>
                      </ul>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Quick Actions</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Invite new users</li>
                        <li>• View recent assessments</li>
                        <li>• Export reports</li>
                        <li>• Manage billing</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="users" className="space-y-4 mt-4">
                  <div className="border rounded-lg p-6">
                    <h4 className="font-semibold mb-3">User Management</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• List of all company employees</li>
                      <li>• Send invite codes</li>
                      <li>• Track assessment completion status</li>
                      <li>• Seat allocation (purchased vs. used)</li>
                      <li>• Bulk invite via CSV upload</li>
                      <li>• User role assignment</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="assessments" className="space-y-4 mt-4">
                  <div className="border rounded-lg p-6">
                    <h4 className="font-semibold mb-3">Assessment Configuration</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Toggle between 25Q and 50Q assessments</li>
                      <li>• View all completed assessments</li>
                      <li>• Export results data</li>
                      <li>• Assessment completion tracking</li>
                      <li>• Team analytics and insights</li>
                      <li>• Custom branding for assessments</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-6">
                      <h4 className="font-semibold mb-3">Company Settings</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Company name and branding</li>
                        <li>• Logo upload</li>
                        <li>• Custom color scheme</li>
                        <li>• Subdomain configuration</li>
                      </ul>
                    </div>
                    <div className="border rounded-lg p-6">
                      <h4 className="font-semibold mb-3">Billing & Subscription</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Current plan and seat count</li>
                        <li>• Payment method</li>
                        <li>• Invoicing history</li>
                        <li>• Upgrade/downgrade options</li>
                        <li>• Add-ons (e.g., Google SSO)</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Employee Assessment Flow */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-primary" />
                <CardTitle>Employee Assessment Flow</CardTitle>
              </div>
              <CardDescription>
                User journey from login to results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 p-6">
                <div className="flex-1 border rounded-lg p-4 text-center">
                  <Lock className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-semibold">1. Login</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Via invite code or credentials
                  </p>
                </div>
                <div className="hidden md:block text-muted-foreground">→</div>
                <div className="flex-1 border rounded-lg p-4 text-center">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-semibold">2. Instructions</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Assessment overview
                  </p>
                </div>
                <div className="hidden md:block text-muted-foreground">→</div>
                <div className="flex-1 border rounded-lg p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-semibold">3. Assessment</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete 25Q or 50Q
                  </p>
                </div>
                <div className="hidden md:block text-muted-foreground">→</div>
                <div className="flex-1 border rounded-lg p-4 text-center">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-semibold">4. Results</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    View personalized report
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Slack integration is part of a later sprint — do not build now.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default B2BInternal;
