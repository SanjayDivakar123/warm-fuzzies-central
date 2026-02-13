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
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import hiring sub-components
import JobPostingsTab from './JobPostingsTab';
import HiringPipelineView from './HiringPipelineView';
import HiringCandidatesTab from './HiringCandidatesTab';
import InterviewsTab from './InterviewsTab';
import OffersTab from './OffersTab';
import EmailTemplatesTab from './EmailTemplatesTab';
import HiringAnalyticsTab from './HiringAnalyticsTab';

interface HiringSectionProps {
  company: { id: string; name: string };
  companyUser: { id: string; role: string } | null;
}

type HiringTab = 'jobs' | 'pipeline' | 'candidates' | 'interviews' | 'offers' | 'templates' | 'analytics';

export default function HiringSection({ company, companyUser }: HiringSectionProps) {
  const [activeTab, setActiveTab] = useState<HiringTab>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showCreateJob, setShowCreateJob] = useState(false);

  const isHROrAdmin = companyUser?.role === 'admin' || companyUser?.role === 'hr';

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

  return (
    <div className="space-y-6">
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
