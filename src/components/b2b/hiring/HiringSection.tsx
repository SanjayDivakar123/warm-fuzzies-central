import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, 
  Users, 
  GitBranch, 
  Calendar, 
  FileCheck, 
  Mail, 
  BarChart3,
  Plus,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Import hiring sub-components
import JobPostingsTab from './JobPostingsTab';
import HiringPipelineView from './HiringPipelineView';
import HiringCandidatesTab from './HiringCandidatesTab';
import InterviewsTab from './InterviewsTab';
import OffersTab from './OffersTab';
import EmailTemplatesTab from './EmailTemplatesTab';
import HiringAnalyticsTab from './HiringAnalyticsTab';

interface HiringSectionProps {
  company: { 
    id: string; 
    name: string;
    hiring_subscription_enabled?: boolean;
    hiring_subscription_status?: string;
    hiring_subscription_cancel_at_period_end?: boolean;
    hiring_subscription_current_period_end?: string;
  };
  companyUser: { id: string; role: string } | null;
}

type HiringTab = 'jobs' | 'pipeline' | 'candidates' | 'interviews' | 'offers' | 'templates' | 'analytics';

export default function HiringSection({ company, companyUser }: HiringSectionProps) {
  const [activeTab, setActiveTab] = useState<HiringTab>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const { toast } = useToast();

  const isHROrAdmin = companyUser?.role === 'admin' || companyUser?.role === 'hr';
  const hasHiringAccess = company.hiring_subscription_enabled && 
    (company.hiring_subscription_status === 'active' || company.hiring_subscription_status === 'trialing');

  // Handle subscription to hiring tab
  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke('subscribe-hiring-tab', {
        body: { companyId: company.id },
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error subscribing to hiring tab:', error);
      toast({
        title: 'Subscription failed',
        description: error.message || 'Failed to start subscription process',
        variant: 'destructive',
      });
    } finally {
      setSubscribing(false);
    }
  };

  // Show paywall if no access
  if (!hasHiringAccess) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Unlock Premium Hiring Features
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Get access to our complete Applicant Tracking System (ATS) and advanced hiring tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features List */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Briefcase className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Job Posting Management</p>
                  <p className="text-xs text-muted-foreground">Create and manage job postings with custom pipelines</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <GitBranch className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Visual Pipeline</p>
                  <p className="text-xs text-muted-foreground">Track candidates through customizable stages</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Candidate Management</p>
                  <p className="text-xs text-muted-foreground">Centralized candidate database and screening</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Interview Scheduling</p>
                  <p className="text-xs text-muted-foreground">Schedule and manage interviews seamlessly</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <FileCheck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Offer Management</p>
                  <p className="text-xs text-muted-foreground">Create and track job offers</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <BarChart3 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Hiring Analytics</p>
                  <p className="text-xs text-muted-foreground">Track hiring metrics and pipeline performance</p>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t pt-6">
              <div className="text-center space-y-4">
                <div>
                  <p className="text-3xl font-bold">$500<span className="text-base font-normal text-muted-foreground">/month</span></p>
                  <p className="text-sm text-muted-foreground mt-1">Cancel anytime</p>
                </div>
                
                {isHROrAdmin && (
                  <Button 
                    size="lg" 
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className="w-full max-w-md"
                  >
                    {subscribing ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Subscribe Now
                      </>
                    )}
                  </Button>
                )}
                
                {!isHROrAdmin && (
                  <p className="text-sm text-muted-foreground">
                    Contact your company admin to subscribe to this feature
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Payment will be processed securely via Stripe. Billing credits will be applied first, then your card on file will be charged.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Navigate to pipeline for a specific job
  const handleViewPipeline = (jobId: string) => {
    setSelectedJobId(jobId);
    setActiveTab('pipeline');
  };

  // Navigate to candidates filtered by job
  const handleViewJobCandidates = (jobId: string) => {
    setSelectedJobId(jobId);
    setActiveTab('candidates');
  };

  // Show subscription warning if cancelling at period end
  const showCancellationWarning = company.hiring_subscription_cancel_at_period_end && 
    company.hiring_subscription_current_period_end;

  return (
    <div className="space-y-6">
      {showCancellationWarning && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Subscription Ending</p>
                <p className="text-sm text-muted-foreground">
                  Your Hiring tab subscription will end on {new Date(company.hiring_subscription_current_period_end!).toLocaleDateString()}.
                  You can reactivate it in Settings before it expires.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as HiringTab)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid grid-cols-7 w-auto">
            <TabsTrigger value="jobs" className="flex items-center gap-1.5 px-3">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-1.5 px-3">
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Pipeline</span>
            </TabsTrigger>
            <TabsTrigger value="candidates" className="flex items-center gap-1.5 px-3">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Candidates</span>
            </TabsTrigger>
            <TabsTrigger value="interviews" className="flex items-center gap-1.5 px-3">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Interviews</span>
            </TabsTrigger>
            <TabsTrigger value="offers" className="flex items-center gap-1.5 px-3">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Offers</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1.5 px-3">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5 px-3">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Quick actions based on active tab */}
          {activeTab === 'jobs' && isHROrAdmin && (
            <Button onClick={() => setShowCreateJob(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          )}
        </div>

        <TabsContent value="jobs" className="mt-0">
          <JobPostingsTab 
            company={company}
            companyUser={companyUser}
            showCreateModal={showCreateJob}
            onCloseCreateModal={() => setShowCreateJob(false)}
            onViewPipeline={handleViewPipeline}
            onViewCandidates={handleViewJobCandidates}
          />
        </TabsContent>

        <TabsContent value="pipeline" className="mt-0">
          <HiringPipelineView 
            company={company}
            companyUser={companyUser}
            selectedJobId={selectedJobId}
            onSelectJob={setSelectedJobId}
          />
        </TabsContent>

        <TabsContent value="candidates" className="mt-0">
          <HiringCandidatesTab 
            company={company}
            companyUser={companyUser}
            selectedJobId={selectedJobId}
          />
        </TabsContent>

        <TabsContent value="interviews" className="mt-0">
          <InterviewsTab 
            company={company}
            companyUser={companyUser}
          />
        </TabsContent>

        <TabsContent value="offers" className="mt-0">
          <OffersTab 
            company={company}
            companyUser={companyUser}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-0">
          <EmailTemplatesTab 
            company={company}
            companyUser={companyUser}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <HiringAnalyticsTab 
            company={company}
            companyUser={companyUser}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
