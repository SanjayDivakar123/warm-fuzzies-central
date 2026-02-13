import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  MoreHorizontal,
  Calendar,
  FileCheck,
  X,
  ChevronRight,
  ChevronLeft,
  User,
  Clock,
  Star,
  ArrowRight,
  Mail,
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type JobPosting = Database['public']['Tables']['job_postings']['Row'];
type HiringStage = Database['public']['Tables']['hiring_pipeline_stages']['Row'];
type CandidateApplication = Database['public']['Tables']['candidate_applications']['Row'];

interface CandidateWithDetails extends CandidateApplication {
  candidate: {
    id: string;
    full_name: string | null;
    email: string;
    fit_score: number | null;
    ideal_role_color: string | null;
    position_title: string | null;
  };
}

interface HiringPipelineViewProps {
  company: { id: string; name: string };
  companyUser: { id: string; role: string } | null;
  selectedJobId: string | null;
  onSelectJob: (jobId: string | null) => void;
}

const ROLECOLOR_COLORS: Record<string, string> = {
  Yellow: 'bg-yellow-500',
  Red: 'bg-red-500',
  Green: 'bg-green-500',
  Blue: 'bg-blue-500',
};

export default function HiringPipelineView({ 
  company, 
  companyUser,
  selectedJobId,
  onSelectJob,
}: HiringPipelineViewProps) {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [stages, setStages] = useState<HiringStage[]>([]);
  const [applications, setApplications] = useState<CandidateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingCandidate, setMovingCandidate] = useState<string | null>(null);
  
  const { toast } = useToast();
  const isHROrAdmin = companyUser?.role === 'admin' || companyUser?.role === 'hr';

  useEffect(() => {
    fetchJobs();
  }, [company.id]);

  useEffect(() => {
    if (selectedJobId) {
      fetchPipelineData(selectedJobId);
    } else {
      setStages([]);
      setApplications([]);
    }
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('company_id', company.id)
        .in('status', ['open', 'paused'])
        .order('title');

      if (error) throw error;
      setJobs(data || []);

      // Auto-select first job if none selected
      if (!selectedJobId && data && data.length > 0) {
        onSelectJob(data[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPipelineData = async (jobId: string) => {
    setLoading(true);
    try {
      // Fetch stages
      const { data: stagesData, error: stagesError } = await supabase
        .from('hiring_pipeline_stages')
        .select('*')
        .eq('job_posting_id', jobId)
        .order('stage_order');

      if (stagesError) throw stagesError;
      setStages(stagesData || []);

      // Fetch applications with candidate details
      const { data: appsData, error: appsError } = await supabase
        .from('candidate_applications')
        .select(`
          *,
          candidate:candidates (
            id,
            full_name,
            email,
            fit_score,
            ideal_role_color,
            position_title
          )
        `)
        .eq('job_posting_id', jobId)
        .is('withdrawn_at', null);

      if (appsError) throw appsError;
      setApplications(appsData as CandidateWithDetails[] || []);
    } catch (err: any) {
      console.error('Error fetching pipeline data:', err);
      toast({
        title: 'Error loading pipeline',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const moveCandidate = async (applicationId: string, toStageId: string, fromStageId: string | null) => {
    if (!companyUser) return;
    
    setMovingCandidate(applicationId);
    try {
      // Update application stage
      const { error: updateError } = await supabase
        .from('candidate_applications')
        .update({
          current_stage_id: toStageId,
          stage_entered_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Log transition
      const { error: transitionError } = await supabase
        .from('stage_transitions')
        .insert({
          application_id: applicationId,
          from_stage_id: fromStageId,
          to_stage_id: toStageId,
          moved_by: companyUser.id,
        });

      if (transitionError) {
        console.error('Error logging transition:', transitionError);
      }

      // Check if moved to hired stage
      const toStage = stages.find(s => s.id === toStageId);
      if (toStage?.is_final_stage) {
        await supabase
          .from('candidate_applications')
          .update({ hired_at: new Date().toISOString() })
          .eq('id', applicationId);
      }

      toast({
        title: 'Candidate moved',
        description: `Moved to ${toStage?.name || 'next stage'}.`,
      });

      // Refresh data
      if (selectedJobId) {
        fetchPipelineData(selectedJobId);
      }
    } catch (err: any) {
      console.error('Error moving candidate:', err);
      toast({
        title: 'Error moving candidate',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setMovingCandidate(null);
    }
  };

  const rejectCandidate = async (applicationId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('candidate_applications')
        .update({
          rejection_reason: reason || 'Did not meet criteria',
          rejected_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: 'Candidate rejected',
        description: 'The candidate has been removed from the pipeline.',
      });

      if (selectedJobId) {
        fetchPipelineData(selectedJobId);
      }
    } catch (err: any) {
      console.error('Error rejecting candidate:', err);
      toast({
        title: 'Error rejecting candidate',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const getApplicationsForStage = (stageId: string) => {
    return applications.filter(app => app.current_stage_id === stageId);
  };

  const getUnstagedApplications = () => {
    return applications.filter(app => !app.current_stage_id);
  };

  const getDaysInStage = (stageEnteredAt: string) => {
    return Math.floor((Date.now() - new Date(stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (loading && !selectedJobId) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">
            No active job postings. Create a job first to see the pipeline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Job Selector */}
      <div className="flex items-center gap-4">
        <Select value={selectedJobId || ''} onValueChange={onSelectJob}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a job..." />
          </SelectTrigger>
          <SelectContent>
            {jobs.map(job => (
              <SelectItem key={job.id} value={job.id}>
                {job.title} ({job.applications_count} applicants)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedJobId && (
          <Badge variant="outline">
            {applications.length} in pipeline
          </Badge>
        )}
      </div>

      {loading && selectedJobId ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : selectedJobId ? (
        /* Pipeline Kanban Board */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {/* Unstaged column (if any) */}
            {getUnstagedApplications().length > 0 && (
              <div className="w-72 flex-shrink-0">
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        New Applications
                      </CardTitle>
                      <Badge variant="secondary">
                        {getUnstagedApplications().length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {getUnstagedApplications().map(app => (
                      <CandidateCard
                        key={app.id}
                        application={app}
                        stages={stages}
                        isMoving={movingCandidate === app.id}
                        onMove={(toStageId) => moveCandidate(app.id, toStageId, null)}
                        onReject={() => rejectCandidate(app.id)}
                        canManage={isHROrAdmin}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Pipeline stage columns */}
            {stages.map((stage, index) => {
              const stageApps = getApplicationsForStage(stage.id);
              const nextStage = stages[index + 1];
              const prevStage = stages[index - 1];

              return (
                <div key={stage.id} className="w-72 flex-shrink-0">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stage.color_code || '#6B7280' }}
                          />
                          <CardTitle className="text-sm font-medium">
                            {stage.name}
                          </CardTitle>
                        </div>
                        <Badge variant="secondary">
                          {stageApps.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                      {stageApps.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No candidates
                        </p>
                      ) : (
                        stageApps.map(app => (
                          <CandidateCard
                            key={app.id}
                            application={app}
                            stages={stages}
                            currentStageIndex={index}
                            isMoving={movingCandidate === app.id}
                            onMoveNext={nextStage ? () => moveCandidate(app.id, nextStage.id, stage.id) : undefined}
                            onMovePrev={prevStage ? () => moveCandidate(app.id, prevStage.id, stage.id) : undefined}
                            onMove={(toStageId) => moveCandidate(app.id, toStageId, stage.id)}
                            onReject={() => rejectCandidate(app.id)}
                            canManage={isHROrAdmin}
                          />
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Select a job to view its pipeline.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Candidate Card Component
interface CandidateCardProps {
  application: CandidateWithDetails;
  stages: HiringStage[];
  currentStageIndex?: number;
  isMoving: boolean;
  onMoveNext?: () => void;
  onMovePrev?: () => void;
  onMove: (toStageId: string) => void;
  onReject: () => void;
  canManage: boolean;
}

function CandidateCard({
  application,
  stages,
  currentStageIndex,
  isMoving,
  onMoveNext,
  onMovePrev,
  onMove,
  onReject,
  canManage,
}: CandidateCardProps) {
  const candidate = application.candidate;
  const daysInStage = getDaysInStage(application.stage_entered_at);
  const roleColor = candidate.ideal_role_color;

  function getDaysInStage(stageEnteredAt: string) {
    return Math.floor((Date.now() - new Date(stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24));
  }

  function getInitials(name: string | null, email: string) {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  }

  return (
    <Card className="bg-background shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className={`text-xs ${
              roleColor ? ROLECOLOR_COLORS[roleColor] + ' text-white' : ''
            }`}>
              {getInitials(candidate.full_name, candidate.email)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {candidate.full_name || candidate.email.split('@')[0]}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {candidate.email}
            </p>
            
            <div className="flex items-center gap-2 mt-1.5">
              {candidate.fit_score !== null && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  <Star className="h-3 w-3 mr-0.5 text-yellow-500" />
                  {Math.round(candidate.fit_score)}%
                </Badge>
              )}
              {roleColor && (
                <span 
                  className={`w-2.5 h-2.5 rounded-full ${ROLECOLOR_COLORS[roleColor]}`}
                  title={`${roleColor} RoleColor`}
                />
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {daysInStage}d
              </span>
            </div>
          </div>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isMoving}>
                  {isMoving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onMoveNext && (
                  <DropdownMenuItem onClick={onMoveNext}>
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Move to Next Stage
                  </DropdownMenuItem>
                )}
                {onMovePrev && (
                  <DropdownMenuItem onClick={onMovePrev}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Move to Previous Stage
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Interview
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Send Offer
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Move to specific stage submenu */}
                {stages.filter(s => s.id !== application.current_stage_id).length > 0 && (
                  <>
                    {stages
                      .filter(s => s.id !== application.current_stage_id)
                      .map(stage => (
                        <DropdownMenuItem key={stage.id} onClick={() => onMove(stage.id)}>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Move to {stage.name}
                        </DropdownMenuItem>
                      ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={onReject} className="text-destructive">
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
