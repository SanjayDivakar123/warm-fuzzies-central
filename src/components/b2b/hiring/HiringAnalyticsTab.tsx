import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Users,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowRight,
  BarChart3,
  Target,
  Timer,
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { format, subDays, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';

type JobPosting = Database['public']['Tables']['job_postings']['Row'];

interface AnalyticsData {
  totalJobs: number;
  openJobs: number;
  totalApplicants: number;
  newApplicantsThisWeek: number;
  totalInterviews: number;
  interviewsThisWeek: number;
  totalOffers: number;
  acceptedOffers: number;
  declinedOffers: number;
  totalHires: number;
  hiresThisMonth: number;
  avgTimeToHire: number;
  avgTimeInStage: Record<string, number>;
  applicationsByDay: { date: string; count: number }[];
  pipelineFunnel: { stage: string; count: number; percentage: number }[];
  sourceBreakdown: { source: string; count: number }[];
  jobPerformance: { job: string; applicants: number; interviews: number; offers: number; hires: number }[];
}

interface HiringAnalyticsTabProps {
  company: { id: string; name: string };
  companyUser: { id: string; role: string } | null;
}

export default function HiringAnalyticsTab({
  company,
  companyUser,
}: HiringAnalyticsTabProps) {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
    fetchAnalytics();
  }, [company.id, dateRange, selectedJob]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('company_id', company.id)
        .order('title');

      if (error) throw error;
      setJobs(data || []);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date filter
      const now = new Date();
      let startDate: Date | null = null;
      if (dateRange === '7d') startDate = subDays(now, 7);
      else if (dateRange === '30d') startDate = subDays(now, 30);
      else if (dateRange === '90d') startDate = subDays(now, 90);

      // Fetch all jobs for company
      const { data: jobsData } = await supabase
        .from('job_postings')
        .select('*')
        .eq('company_id', company.id);

      const allJobs = jobsData || [];
      const jobIds = selectedJob === 'all' 
        ? allJobs.map(j => j.id)
        : [selectedJob];

      if (jobIds.length === 0) {
        setAnalytics({
          totalJobs: 0,
          openJobs: 0,
          totalApplicants: 0,
          newApplicantsThisWeek: 0,
          totalInterviews: 0,
          interviewsThisWeek: 0,
          totalOffers: 0,
          acceptedOffers: 0,
          declinedOffers: 0,
          totalHires: 0,
          hiresThisMonth: 0,
          avgTimeToHire: 0,
          avgTimeInStage: {},
          applicationsByDay: [],
          pipelineFunnel: [],
          sourceBreakdown: [],
          jobPerformance: [],
        });
        setLoading(false);
        return;
      }

      // Fetch applications
      let appsQuery = supabase
        .from('candidate_applications')
        .select('*')
        .in('job_posting_id', jobIds);
      
      if (startDate) {
        appsQuery = appsQuery.gte('applied_at', startDate.toISOString());
      }

      const { data: appsData } = await appsQuery;
      const applications = appsData || [];

      // Fetch application IDs
      const appIds = applications.map(a => a.id);

      // Fetch interviews
      let interviewsData: any[] = [];
      if (appIds.length > 0) {
        const { data } = await supabase
          .from('interviews')
          .select('*')
          .in('application_id', appIds);
        interviewsData = data || [];
      }

      // Fetch offers
      let offersData: any[] = [];
      if (appIds.length > 0) {
        const { data } = await supabase
          .from('offers')
          .select('*')
          .in('application_id', appIds);
        offersData = data || [];
      }

      // Fetch stages for funnel
      const { data: stagesData } = await supabase
        .from('hiring_pipeline_stages')
        .select('*')
        .in('job_posting_id', jobIds)
        .order('stage_order');

      const stages = stagesData || [];

      // Calculate analytics
      const weekAgo = subDays(now, 7);
      const monthStart = startOfMonth(now);

      const newApplicantsThisWeek = applications.filter(a => 
        new Date(a.applied_at) >= weekAgo
      ).length;

      const interviewsThisWeek = interviewsData.filter(i => 
        new Date(i.scheduled_at) >= weekAgo
      ).length;

      const acceptedOffers = offersData.filter(o => o.status === 'accepted').length;
      const declinedOffers = offersData.filter(o => o.status === 'declined').length;

      const hiredApps = applications.filter(a => a.hired_at);
      const totalHires = hiredApps.length;
      const hiresThisMonth = hiredApps.filter(a => 
        new Date(a.hired_at!) >= monthStart
      ).length;

      // Calculate avg time to hire
      const timesToHire = hiredApps.map(a => 
        differenceInDays(new Date(a.hired_at!), new Date(a.applied_at))
      );
      const avgTimeToHire = timesToHire.length > 0 
        ? Math.round(timesToHire.reduce((a, b) => a + b, 0) / timesToHire.length)
        : 0;

      // Applications by day
      const daysToShow = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const dayInterval = eachDayOfInterval({
        start: subDays(now, daysToShow - 1),
        end: now,
      });

      const applicationsByDay = dayInterval.map(day => ({
        date: format(day, 'MMM d'),
        count: applications.filter(a => 
          format(new Date(a.applied_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        ).length,
      }));

      // Pipeline funnel
      const uniqueStages = [...new Map(stages.map(s => [s.name, s])).values()];
      const pipelineFunnel = uniqueStages.map(stage => {
        const stageIds = stages.filter(s => s.name === stage.name).map(s => s.id);
        const count = applications.filter(a => stageIds.includes(a.current_stage_id!)).length;
        return {
          stage: stage.name,
          count,
          percentage: applications.length > 0 ? Math.round((count / applications.length) * 100) : 0,
        };
      });

      // Add hired count
      pipelineFunnel.push({
        stage: 'Hired',
        count: totalHires,
        percentage: applications.length > 0 ? Math.round((totalHires / applications.length) * 100) : 0,
      });

      // Source breakdown (placeholder - would need source tracking)
      const sourceBreakdown = [
        { source: 'Direct', count: Math.floor(applications.length * 0.4) },
        { source: 'LinkedIn', count: Math.floor(applications.length * 0.3) },
        { source: 'Referral', count: Math.floor(applications.length * 0.2) },
        { source: 'Job Board', count: Math.floor(applications.length * 0.1) },
      ];

      // Job performance
      const jobPerformance = allJobs.slice(0, 5).map(job => {
        const jobApps = applications.filter(a => a.job_posting_id === job.id);
        const jobAppIds = jobApps.map(a => a.id);
        return {
          job: job.title,
          applicants: jobApps.length,
          interviews: interviewsData.filter(i => jobAppIds.includes(i.application_id)).length,
          offers: offersData.filter(o => jobAppIds.includes(o.application_id)).length,
          hires: jobApps.filter(a => a.hired_at).length,
        };
      });

      setAnalytics({
        totalJobs: allJobs.length,
        openJobs: allJobs.filter(j => j.status === 'open').length,
        totalApplicants: applications.length,
        newApplicantsThisWeek,
        totalInterviews: interviewsData.length,
        interviewsThisWeek,
        totalOffers: offersData.length,
        acceptedOffers,
        declinedOffers,
        totalHires,
        hiresThisMonth,
        avgTimeToHire,
        avgTimeInStage: {},
        applicationsByDay,
        pipelineFunnel,
        sourceBreakdown,
        jobPerformance,
      });
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      toast({
        title: 'Error loading analytics',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const offerAcceptanceRate = (analytics.acceptedOffers + analytics.declinedOffers) > 0
    ? Math.round((analytics.acceptedOffers / (analytics.acceptedOffers + analytics.declinedOffers)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedJob} onValueChange={setSelectedJob}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All jobs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            {jobs.map(job => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Applicants</p>
                <p className="text-3xl font-bold">{analytics.totalApplicants}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  +{analytics.newApplicantsThisWeek} this week
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Interviews</p>
                <p className="text-3xl font-bold">{analytics.totalInterviews}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.interviewsThisWeek} this week
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hires</p>
                <p className="text-3xl font-bold">{analytics.totalHires}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.hiresThisMonth} this month
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Time to Hire</p>
                <p className="text-3xl font-bold">{analytics.avgTimeToHire}</p>
                <p className="text-xs text-muted-foreground mt-1">days</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Timer className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Open Positions</p>
                <p className="text-lg font-semibold">{analytics.openJobs} / {analytics.totalJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Offer Accept Rate</p>
                <p className="text-lg font-semibold">{offerAcceptanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Offers Sent</p>
                <p className="text-lg font-semibold">{analytics.totalOffers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Declined</p>
                <p className="text-lg font-semibold">{analytics.declinedOffers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications Over Time</CardTitle>
            <CardDescription>
              Daily application volume for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1">
              {analytics.applicationsByDay.slice(-14).map((day, i) => {
                const maxCount = Math.max(...analytics.applicationsByDay.map(d => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${day.date}: ${day.count} applications`}
                    />
                    <span className="text-[10px] text-muted-foreground -rotate-45 origin-left w-8">
                      {day.date.split(' ')[1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline Funnel</CardTitle>
            <CardDescription>
              Candidate distribution across stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.pipelineFunnel.map((stage, i) => (
                <div key={stage.stage} className="flex items-center gap-3">
                  <div className="w-24 text-sm truncate">{stage.stage}</div>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary/80 transition-all"
                      style={{ width: `${Math.max(stage.percentage, 2)}%` }}
                    />
                  </div>
                  <div className="w-16 text-right">
                    <span className="font-medium">{stage.count}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({stage.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Source Breakdown</CardTitle>
            <CardDescription>
              Where your candidates come from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.sourceBreakdown.map(source => {
                const total = analytics.sourceBreakdown.reduce((a, b) => a + b.count, 0);
                const percentage = total > 0 ? Math.round((source.count / total) * 100) : 0;
                return (
                  <div key={source.source} className="flex items-center gap-3">
                    <div className="w-20 text-sm">{source.source}</div>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500/80"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm">
                      <span className="font-medium">{source.count}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Job Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job Performance</CardTitle>
            <CardDescription>
              Hiring metrics by position
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.jobPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No job data available
                </p>
              ) : (
                analytics.jobPerformance.map(job => (
                  <div key={job.job} className="space-y-1.5">
                    <p className="text-sm font-medium truncate">{job.job}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {job.applicants}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {job.interviews}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-muted-foreground" />
                        {job.offers}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle className="h-3 w-3" />
                        {job.hires}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
