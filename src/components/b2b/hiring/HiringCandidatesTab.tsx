import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Search,
  MoreHorizontal,
  Eye,
  Calendar,
  FileCheck,
  Mail,
  X,
  ChevronUp,
  ChevronDown,
  ArrowRightLeft,
  Star,
  Clock,
  Filter,
  Download,
  UserPlus,
  ClipboardCheck,
  RotateCcw,
} from 'lucide-react';
import AddCandidateDialog from './AddCandidateDialog';
import CandidateProfileDialog from './CandidateProfileDialog';
import MoveStageDialog from './MoveStageDialog';
import SendEmailDialog from './SendEmailDialog';
import ScheduleInterviewDialog from './ScheduleInterviewDialog';
import SendOfferDialog from './SendOfferDialog';
import SendAssessmentDialog from './SendAssessmentDialog';
import { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';

type JobPosting = Database['public']['Tables']['job_postings']['Row'];
type CandidateApplication = Database['public']['Tables']['candidate_applications']['Row'];
type HiringStage = Database['public']['Tables']['hiring_pipeline_stages']['Row'];

interface CandidateWithDetails extends CandidateApplication {
  candidate: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    fit_score: number | null;
    ideal_role_color: string | null;
    position_title: string | null;
    created_at: string;
  };
  job_posting: {
    id: string;
    title: string;
  } | null;
  current_stage: {
    id: string;
    name: string;
    color_code: string | null;
  } | null;
}

interface HiringCandidatesTabProps {
  company: { id: string; name: string };
  companyUser: { id: string; role: string } | null;
  selectedJobId: string | null;
}

const ROLECOLOR_COLORS: Record<string, string> = {
  Yellow: 'bg-yellow-500',
  Red: 'bg-red-500',
  Green: 'bg-green-500',
  Blue: 'bg-blue-500',
};

type SortField = 'name' | 'applied_at' | 'fit_score' | 'days_in_stage';
type SortOrder = 'asc' | 'desc';

export default function HiringCandidatesTab({
  company,
  companyUser,
  selectedJobId: initialJobId,
}: HiringCandidatesTabProps) {
  const [applications, setApplications] = useState<CandidateWithDetails[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [stages, setStages] = useState<HiringStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState<string>(initialJobId || 'all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'rejected' | 'hired' | 'all'>('active');
  const [sortField, setSortField] = useState<SortField>('applied_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [moveStageApp, setMoveStageApp] = useState<CandidateWithDetails | null>(null);
  const [emailCandidate, setEmailCandidate] = useState<{ id: string; name: string; email: string } | null>(null);
  const [interviewApp, setInterviewApp] = useState<CandidateWithDetails | null>(null);
  const [offerApp, setOfferApp] = useState<CandidateWithDetails | null>(null);
  const [assessmentApp, setAssessmentApp] = useState<CandidateWithDetails | null>(null);

  const { toast } = useToast();
  const isHROrAdmin = companyUser?.role === 'admin' || companyUser?.role === 'hr';

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, [company.id]);

  useEffect(() => {
    if (jobFilter !== 'all') {
      fetchStagesForJob(jobFilter);
    } else {
      setStages([]);
    }
  }, [jobFilter]);

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

  const fetchStagesForJob = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('hiring_pipeline_stages')
        .select('*')
        .eq('job_posting_id', jobId)
        .order('stage_order');

      if (error) throw error;
      setStages(data || []);
    } catch (err: any) {
      console.error('Error fetching stages:', err);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      // First get all job postings for this company
      const { data: jobsData } = await supabase
        .from('job_postings')
        .select('id')
        .eq('company_id', company.id);

      const jobIds = jobsData?.map(j => j.id) || [];

      if (jobIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('candidate_applications')
        .select(`
          *,
          candidate:candidates (
            id,
            full_name,
            email,
            phone,
            fit_score,
            ideal_role_color,
            position_title,
            created_at
          ),
          job_posting:job_postings (
            id,
            title
          ),
          current_stage:hiring_pipeline_stages (
            id,
            name,
            color_code
          )
        `)
        .in('job_posting_id', jobIds)
        .is('withdrawn_at', null)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications((data || []) as unknown as CandidateWithDetails[]);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      toast({
        title: 'Error loading candidates',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const rejectCandidate = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('candidate_applications')
        .update({
          rejection_reason: 'Rejected by HR',
          rejected_at: new Date().toISOString(),
          hired_at: null,
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: 'Candidate rejected',
        description: 'The candidate has been marked as rejected.',
      });

      fetchApplications();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const unrejectCandidate = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('candidate_applications')
        .update({
          rejected_at: null,
          rejection_reason: null,
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: 'Candidate restored',
        description: 'The candidate has been moved back to the active pipeline.',
      });

      fetchApplications();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const unhireCandidate = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('candidate_applications')
        .update({
          hired_at: null,
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: 'Candidate unhired',
        description: 'The candidate has been moved back to the active pipeline.',
      });

      fetchApplications();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Filter and sort applications
  const filteredApplications = applications
    .filter(app => {
      // Job filter
      if (jobFilter !== 'all' && app.job_posting_id !== jobFilter) return false;
      
      // Stage filter
      if (stageFilter !== 'all' && app.current_stage_id !== stageFilter) return false;
      
      // Status filter
      if (statusFilter === 'active' && (app.rejected_at || app.hired_at)) return false;
      if (statusFilter === 'rejected' && !app.rejected_at) return false;
      if (statusFilter === 'hired' && !app.hired_at) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = app.candidate.full_name?.toLowerCase() || '';
        const email = app.candidate.email.toLowerCase();
        const position = app.candidate.position_title?.toLowerCase() || '';
        if (!name.includes(query) && !email.includes(query) && !position.includes(query)) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = (a.candidate.full_name || a.candidate.email)
            .localeCompare(b.candidate.full_name || b.candidate.email);
          break;
        case 'applied_at':
          comparison = new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
          break;
        case 'fit_score':
          comparison = (a.candidate.fit_score || 0) - (b.candidate.fit_score || 0);
          break;
        case 'days_in_stage':
          const daysA = getDaysInStage(a.stage_entered_at);
          const daysB = getDaysInStage(b.stage_entered_at);
          comparison = daysA - daysB;
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const getDaysInStage = (stageEnteredAt: string) => {
    return Math.floor((Date.now() - new Date(stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Job', 'Stage', 'Applied Date', 'Fit Score', 'Days in Stage', 'Status'];
    const rows = filteredApplications.map(app => [
      app.candidate.full_name || '-',
      app.candidate.email,
      app.candidate.phone || '-',
      app.job_posting?.title || '-',
      app.current_stage?.name || 'Unassigned',
      format(new Date(app.applied_at), 'yyyy-MM-dd'),
      app.candidate.fit_score ? `${Math.round(app.candidate.fit_score)}%` : '-',
      getDaysInStage(app.stage_entered_at),
      app.hired_at ? 'Hired' : app.rejected_at ? 'Rejected' : 'Active',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidates-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-tour="hiring-candidates-overview">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3" data-tour="hiring-candidates-filters">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Jobs" />
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

        {stages.length > 0 && (
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {stages.map(stage => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        {isHROrAdmin && (
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Candidate
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground" data-tour="hiring-candidates-results">
        Showing {filteredApplications.length} of {applications.length} candidates
      </div>

      {/* Candidates Table */}
      <Card data-tour="hiring-candidates-table">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('name')}
                    className="h-8 -ml-2"
                  >
                    Candidate
                    <SortIcon field="name" />
                  </Button>
                </TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('applied_at')}
                    className="h-8 -ml-2"
                  >
                    Applied
                    <SortIcon field="applied_at" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('fit_score')}
                    className="h-8 -ml-2"
                  >
                    Fit Score
                    <SortIcon field="fit_score" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('days_in_stage')}
                    className="h-8 -ml-2"
                  >
                    Days in Stage
                    <SortIcon field="days_in_stage" />
                  </Button>
                </TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No candidates found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map(app => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`text-xs ${
                            app.candidate.ideal_role_color 
                              ? ROLECOLOR_COLORS[app.candidate.ideal_role_color] + ' text-white' 
                              : ''
                          }`}>
                            {getInitials(app.candidate.full_name, app.candidate.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {app.candidate.full_name || app.candidate.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {app.candidate.email}
                          </p>
                        </div>
                        {app.hired_at && (
                          <Badge className="bg-green-500/10 text-green-600 border-green-200">
                            Hired
                          </Badge>
                        )}
                        {app.rejected_at && (
                          <Badge variant="destructive" className="bg-red-100 text-red-600">
                            Rejected
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {app.job_posting?.title || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {app.current_stage ? (
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: app.current_stage.color_code || undefined,
                            color: app.current_stage.color_code || undefined,
                          }}
                        >
                          {app.current_stage.name}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(app.applied_at), 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {app.candidate.fit_score ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">
                            {Math.round(app.candidate.fit_score)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {getDaysInStage(app.stage_entered_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isHROrAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onFocus={(e) => {
                                e.currentTarget.blur();
                              }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedCandidateId(app.candidate.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>

                            {!app.hired_at && !app.rejected_at ? (
                              <>
                                <DropdownMenuItem onClick={() => setAssessmentApp(app)}>
                                  <ClipboardCheck className="h-4 w-4 mr-2" />
                                  Send Assessment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setMoveStageApp(app)}>
                                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                                  Move Stage
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setInterviewApp(app)}>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Schedule Interview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setOfferApp(app)}>
                                  <FileCheck className="h-4 w-4 mr-2" />
                                  Send Offer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEmailCandidate({
                                  id: app.candidate.id,
                                  name: app.candidate.full_name || 'Candidate',
                                  email: app.candidate.email,
                                })}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => rejectCandidate(app.id)}
                                  className="text-destructive"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                {app.rejected_at && (
                                  <DropdownMenuItem onClick={() => unrejectCandidate(app.id)}>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Unreject (Return to Pipeline)
                                  </DropdownMenuItem>
                                )}
                                {app.hired_at && (
                                  <DropdownMenuItem onClick={() => unhireCandidate(app.id)}>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Unhire (Return to Pipeline)
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Candidate Dialog */}
      <AddCandidateDialog
        companyId={company.id}
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onCandidateAdded={fetchApplications}
        preSelectedJobId={jobFilter !== 'all' ? jobFilter : null}
      />

      {/* Candidate Profile Dialog */}
      <CandidateProfileDialog
        candidateId={selectedCandidateId}
        companyId={company.id}
        open={!!selectedCandidateId}
        onClose={() => setSelectedCandidateId(null)}
      />

      {/* Move Stage Dialog */}
      <MoveStageDialog
        applicationId={moveStageApp?.id || null}
        candidateId={moveStageApp?.candidate.id || null}
        candidateName={moveStageApp?.candidate.full_name || 'Candidate'}
        currentStageId={moveStageApp?.current_stage?.id || null}
        jobId={moveStageApp?.job_posting?.id || null}
        companyId={company.id}
        open={!!moveStageApp}
        onClose={() => setMoveStageApp(null)}
        onMoved={fetchApplications}
      />

      {/* Send Email Dialog */}
      <SendEmailDialog
        candidateId={emailCandidate?.id || null}
        candidateName={emailCandidate?.name || ''}
        candidateEmail={emailCandidate?.email || ''}
        companyName={company.name}
        companyId={company.id}
        open={!!emailCandidate}
        onClose={() => setEmailCandidate(null)}
      />

      {/* Schedule Interview Dialog */}
      <ScheduleInterviewDialog
        applicationId={interviewApp?.id || null}
        candidateId={interviewApp?.candidate.id || null}
        candidateName={interviewApp?.candidate.full_name || 'Candidate'}
        candidateEmail={interviewApp?.candidate.email || ''}
        companyName={company.name}
        jobTitle={interviewApp?.job_posting?.title || ''}
        companyId={company.id}
        open={!!interviewApp}
        onClose={() => setInterviewApp(null)}
        onScheduled={fetchApplications}
      />

      {/* Send Offer Dialog */}
      <SendOfferDialog
        applicationId={offerApp?.id || null}
        candidateId={offerApp?.candidate.id || null}
        candidateName={offerApp?.candidate.full_name || 'Candidate'}
        candidateEmail={offerApp?.candidate.email || ''}
        companyName={company.name}
        jobTitle={offerApp?.job_posting?.title || ''}
        companyId={company.id}
        open={!!offerApp}
        onClose={() => setOfferApp(null)}
        onSent={fetchApplications}
      />

      {/* Send Assessment Dialog */}
      <SendAssessmentDialog
        candidateId={assessmentApp?.candidate.id || null}
        candidateName={assessmentApp?.candidate.full_name || 'Candidate'}
        candidateEmail={assessmentApp?.candidate.email || ''}
        jobTitle={assessmentApp?.job_posting?.title || ''}
        companyId={company.id}
        open={!!assessmentApp}
        onClose={() => setAssessmentApp(null)}
        onSent={fetchApplications}
      />
    </div>
  );
}
