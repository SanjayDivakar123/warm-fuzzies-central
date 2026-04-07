import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MERGE_ATS_INTEGRATIONS } from '@/lib/mergeCatalog';
import { 
  Plus, 
  MoreHorizontal,
  Edit, 
  Trash2, 
  Loader2, 
  Briefcase,
  Users,
  MapPin,
  Clock,
  DollarSign,
  Eye,
  Pause,
  Play,
  CheckCircle,
  GitBranch,
  Share2,
  Copy,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type JobPosting = Database['public']['Tables']['job_postings']['Row'];
type JobPostingInsert = Database['public']['Tables']['job_postings']['Insert'];
type JobPostingStatus = Database['public']['Enums']['job_posting_status'];
type EmploymentType = Database['public']['Enums']['employment_type'];
type RemotePolicy = Database['public']['Enums']['remote_policy'];

interface JobPostingsTabProps {
  company: { id: string; name: string };
  companyUser: { id: string; role: string } | null;
  showCreateModal: boolean;
  onOpenCreateModal: () => void;
  onCloseCreateModal: () => void;
  onViewPipeline: (jobId: string) => void;
  onViewCandidates: (jobId: string) => void;
}

interface MergeConnectionSummary {
  platformName: string;
  category: 'hris' | 'ats';
  connectionStatus: 'connected' | 'reconnect_required' | 'disconnected';
}

interface AtsTargetOption {
  name: string;
  integration: string;
  connected: boolean;
}

const STATUS_CONFIG: Record<JobPostingStatus, { label: string; color: string; icon: typeof Play }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Edit },
  open: { label: 'Open', color: 'bg-green-100 text-green-700', icon: Play },
  paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-700', icon: Pause },
  closed: { label: 'Closed', color: 'bg-red-100 text-red-700', icon: CheckCircle },
  filled: { label: 'Filled', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
};

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  temporary: 'Temporary',
  internship: 'Internship',
};

const REMOTE_LABELS: Record<RemotePolicy, string> = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
};

const ROLECOLOR_OPTIONS = [
  { value: 'Yellow', label: 'Yellow (Executor)', color: 'bg-yellow-500' },
  { value: 'Red', label: 'Red (Motivator)', color: 'bg-red-500' },
  { value: 'Green', label: 'Green (Organizer)', color: 'bg-green-500' },
  { value: 'Blue', label: 'Blue (Innovator)', color: 'bg-blue-500' },
];

// Default pipeline stages for new jobs  
type HiringStageType = Database['public']['Enums']['hiring_stage_type'];
const DEFAULT_PIPELINE_STAGES: Array<{ name: string; stage_type: HiringStageType; color_code: string; is_final_stage?: boolean }> = [
  { name: 'Applied', stage_type: 'applied', color_code: '#6B7280' },
  { name: 'Phone Screen', stage_type: 'phone_interview', color_code: '#3B82F6' },
  { name: 'Technical Interview', stage_type: 'technical_interview', color_code: '#8B5CF6' },
  { name: 'Onsite Interview', stage_type: 'onsite_interview', color_code: '#EC4899' },
  { name: 'Reference Check', stage_type: 'reference_check', color_code: '#F59E0B' },
  { name: 'Offer', stage_type: 'offer', color_code: '#10B981' },
  { name: 'Hired', stage_type: 'hired', color_code: '#059669', is_final_stage: true },
];

export default function JobPostingsTab({ 
  company, 
  companyUser,
  showCreateModal,
  onOpenCreateModal,
  onCloseCreateModal,
  onViewPipeline,
  onViewCandidates,
}: JobPostingsTabProps) {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | JobPostingStatus>('all');
  
  // Company roles for auto-fill
  const [companyRoles, setCompanyRoles] = useState<{ id: string; name: string; skills: string[] }[]>([]);
  const [mergeConnections, setMergeConnections] = useState<MergeConnectionSummary[]>([]);
  const [defaultAtsPlatform, setDefaultAtsPlatform] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState<Partial<JobPostingInsert>>({
    title: '',
    description: '',
    department: '',
    location: '',
    remote_policy: 'onsite',
    employment_type: 'full_time',
    salary_min: undefined,
    salary_max: undefined,
    required_experience_years: undefined,
    required_skills: [],
    ideal_role_color_primary: '',
    ideal_role_color_secondary: '',
    company_role_id: undefined,
  });
  const [newSkill, setNewSkill] = useState('');
  const [targetAtsPlatform, setTargetAtsPlatform] = useState<string>('');
  const [saveAsDraft, setSaveAsDraft] = useState(true);
  const [generatingAtsDraft, setGeneratingAtsDraft] = useState(false);
  const [atsPostingNotes, setAtsPostingNotes] = useState<string[]>([]);
  
  const { toast } = useToast();
  const isHROrAdmin = companyUser?.role === 'admin' || companyUser?.role === 'hr';

  useEffect(() => {
    fetchJobs();
    fetchCompanyRoles();
    fetchDefaultAtsTarget();
  }, [company.id]);

  useEffect(() => {
    if (editingJob) {
      setSaveAsDraft(editingJob.status === 'draft');
      setAtsPostingNotes([]);
    }
  }, [editingJob]);

  useEffect(() => {
    setAtsPostingNotes([]);
  }, [targetAtsPlatform]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err: unknown) {
      console.error('Error fetching jobs:', err);
      toast({
        title: 'Error loading jobs',
        description: err instanceof Error ? err.message : 'Failed to load jobs.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('company_roles')
        .select('id, name, skills')
        .eq('company_id', company.id)
        .order('name');

      if (error) throw error;
      setCompanyRoles(data || []);
    } catch (err) {
      console.error('Error fetching company roles:', err);
    }
  };

  const fetchDefaultAtsTarget = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('retrieve-token', {
        body: {
          action: 'list_connections',
          orgId: company.id,
        },
      });

      if (error) throw error;

      const connections = (data?.connections as MergeConnectionSummary[] | undefined) || [];
      setMergeConnections(connections);

      const atsConnection = connections.find(
        (connection) => connection.category === 'ats' && connection.connectionStatus === 'connected',
      );

      if (atsConnection?.platformName) {
        setDefaultAtsPlatform(atsConnection.platformName);
        setTargetAtsPlatform((current) => current || atsConnection.platformName);
      }
    } catch (err) {
      console.error('Error loading ATS target default:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      department: '',
      location: '',
      remote_policy: 'onsite',
      employment_type: 'full_time',
      salary_min: undefined,
      salary_max: undefined,
      required_experience_years: undefined,
      required_skills: [],
      ideal_role_color_primary: '',
      ideal_role_color_secondary: '',
      company_role_id: undefined,
    });
    setNewSkill('');
    setTargetAtsPlatform(defaultAtsPlatform);
    setSaveAsDraft(true);
    setAtsPostingNotes([]);
    setEditingJob(null);
  };

  const atsTargetOptions: AtsTargetOption[] = MERGE_ATS_INTEGRATIONS
    .map((integration) => ({
      ...integration,
      connected: mergeConnections.some(
        (connection) =>
          connection.category === 'ats' &&
          connection.connectionStatus === 'connected' &&
          connection.platformName === integration.name,
      ),
    }))
    .sort((left, right) => {
      if (left.connected !== right.connected) {
        return left.connected ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    });

  const handleCompanyRoleSelect = (roleId: string) => {
    const role = companyRoles.find(r => r.id === roleId);
    if (role) {
      setFormData(prev => ({
        ...prev,
        title: role.name,
        required_skills: role.skills || [],
        company_role_id: roleId,
      }));
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !formData.required_skills?.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...(prev.required_skills || []), trimmed],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      required_skills: (prev.required_skills || []).filter(s => s !== skill),
    }));
  };

  const handleGenerateAtsDraft = async () => {
    if (!targetAtsPlatform) {
      toast({
        title: 'Choose an ATS first',
        description: 'Select the ATS you plan to publish in so the AI can tailor the draft correctly.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title?.trim()) {
      toast({
        title: 'Title required',
        description: 'Add at least a job title before generating an ATS-tailored draft.',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingAtsDraft(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ats-job-draft', {
        body: {
          orgId: company.id,
          targetPlatform: targetAtsPlatform,
          job: {
            title: formData.title,
            department: formData.department,
            description: formData.description,
            location: formData.location,
            remotePolicy: formData.remote_policy,
            employmentType: formData.employment_type,
            requiredExperienceYears: formData.required_experience_years,
            salaryMin: formData.salary_min,
            salaryMax: formData.salary_max,
            requiredSkills: formData.required_skills || [],
            idealRoleColorPrimary: formData.ideal_role_color_primary,
            idealRoleColorSecondary: formData.ideal_role_color_secondary,
          },
        },
      });

      if (error) throw error;
      if (!data?.success || !data?.draft) {
        throw new Error('The ATS draft generator returned an unexpected response.');
      }

      const draft = data.draft as {
        title?: string;
        description?: string;
        required_skills?: string[];
        posting_notes?: string[];
      };

      setFormData((prev) => ({
        ...prev,
        title: draft.title?.trim() || prev.title,
        description: draft.description?.trim() || prev.description,
        required_skills: Array.from(
          new Set(
            (draft.required_skills || prev.required_skills || [])
              .map((skill) => skill.trim())
              .filter(Boolean),
          ),
        ),
      }));
      setAtsPostingNotes((draft.posting_notes || []).filter(Boolean));

      toast({
        title: 'ATS draft ready',
        description: `${targetAtsPlatform} copy has been tailored. Review it in RCF, then publish it manually in your ATS when ready.`,
      });
    } catch (err: unknown) {
      console.error('Error generating ATS draft:', err);
      toast({
        title: 'Could not generate ATS draft',
        description: err instanceof Error ? err.message : 'Failed to tailor the job post for the selected ATS.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingAtsDraft(false);
    }
  };

  const handleSaveJob = async () => {
    if (!formData.title?.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a job title.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const nextStatus: JobPostingStatus =
        editingJob && !['draft', 'open'].includes(editingJob.status)
          ? editingJob.status
          : saveAsDraft
            ? 'draft'
            : 'open';
      const nextPublishedAt =
        nextStatus === 'open'
          ? editingJob?.published_at || new Date().toISOString()
          : null;

      if (editingJob) {
        // Update existing job
        const { error } = await supabase
          .from('job_postings')
          .update({
            ...formData,
            status: nextStatus,
            published_at: nextPublishedAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingJob.id);

        if (error) throw error;
        
        toast({
          title: 'Job updated',
          description:
            nextStatus === 'draft'
              ? `"${formData.title}" has been updated and saved as a draft in RCF.`
              : `"${formData.title}" has been updated and is live in RCF.`,
        });
      } else {
        // Create new job
        const { data: newJob, error } = await supabase
          .from('job_postings')
          .insert({
            company_id: company.id,
            title: formData.title!,
            description: formData.description,
            department: formData.department,
            location: formData.location,
            remote_policy: formData.remote_policy,
            employment_type: formData.employment_type,
            salary_min: formData.salary_min,
            salary_max: formData.salary_max,
            required_experience_years: formData.required_experience_years,
            required_skills: formData.required_skills,
            ideal_role_color_primary: formData.ideal_role_color_primary,
            ideal_role_color_secondary: formData.ideal_role_color_secondary,
            company_role_id: formData.company_role_id,
            status: nextStatus,
            published_at: nextPublishedAt,
          })
          .select()
          .single();

        if (error) throw error;

        // Create default pipeline stages
        if (newJob) {
          const stages = DEFAULT_PIPELINE_STAGES.map((stage, index) => ({
            job_posting_id: newJob.id,
            company_id: company.id,
            name: stage.name,
            stage_type: stage.stage_type,
            color_code: stage.color_code,
            stage_order: index,
            is_final_stage: stage.is_final_stage || false,
          }));

          const { error: stagesError } = await supabase
            .from('hiring_pipeline_stages')
            .insert(stages);

          if (stagesError) {
            console.error('Error creating pipeline stages:', stagesError);
          }
        }
        
        toast({
          title: 'Job created',
          description:
            nextStatus === 'draft'
              ? `"${formData.title}" has been created as a draft in RCF. Publish it manually in ${targetAtsPlatform || 'your ATS'} when you're ready, then let sync pull candidates back in.`
              : `"${formData.title}" is live in RCF with default pipeline stages. Publish the matching role manually in ${targetAtsPlatform || 'your ATS'} so sync can pull applicants back into the pipeline.`,
        });
      }

      onCloseCreateModal();
      resetForm();
      fetchJobs();
    } catch (err: unknown) {
      console.error('Error saving job:', err);
      toast({
        title: 'Error saving job',
        description: err instanceof Error ? err.message : 'Failed to save job.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: JobPostingStatus) => {
    try {
      const updates: Partial<JobPosting> = { status: newStatus };
      
      if (newStatus === 'open' && !jobs.find(j => j.id === jobId)?.published_at) {
        updates.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('job_postings')
        .update(updates)
        .eq('id', jobId);

      if (error) throw error;
      
      toast({
        title: 'Status updated',
        description: `Job status changed to ${STATUS_CONFIG[newStatus].label}.`,
      });
      
      fetchJobs();
    } catch (err: unknown) {
      console.error('Error updating status:', err);
      toast({
        title: 'Error updating status',
        description: err instanceof Error ? err.message : 'Failed to update status.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteJob = async (job: JobPosting) => {
    if (!confirm(`Are you sure you want to delete "${job.title}"? This will also delete all applications and interviews.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', job.id);

      if (error) throw error;
      
      toast({
        title: 'Job deleted',
        description: `"${job.title}" has been deleted.`,
      });
      
      fetchJobs();
    } catch (err: unknown) {
      console.error('Error deleting job:', err);
      toast({
        title: 'Error deleting job',
        description: err instanceof Error ? err.message : 'Failed to delete job.',
        variant: 'destructive',
      });
    }
  };

  const handleEditJob = (job: JobPosting) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description || '',
      department: job.department || '',
      location: job.location || '',
      remote_policy: job.remote_policy,
      employment_type: job.employment_type,
      salary_min: job.salary_min || undefined,
      salary_max: job.salary_max || undefined,
      required_experience_years: job.required_experience_years || undefined,
      required_skills: job.required_skills || [],
      ideal_role_color_primary: job.ideal_role_color_primary || '',
      ideal_role_color_secondary: job.ideal_role_color_secondary || '',
      company_role_id: job.company_role_id || undefined,
    });
  };

  const copyPublicLink = (jobId: string) => {
    const link = `${window.location.origin}/apply/${jobId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copied',
      description: 'Application link copied to clipboard.',
    });
  };

  const filteredJobs = statusFilter === 'all' 
    ? jobs 
    : jobs.filter(j => j.status === statusFilter);

  const getDaysOpen = (job: JobPosting) => {
    if (!job.published_at) return null;
    const days = Math.floor((Date.now() - new Date(job.published_at).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null;
    const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    return `Up to ${fmt(max!)}`;
  };

  const isAtsImportedJob = (job: JobPosting) =>
    (job as JobPosting & { external_source?: string | null }).external_source === 'merge_ats';

  const connectedAtsCount = mergeConnections.filter(
    (connection) => connection.category === 'ats' && connection.connectionStatus === 'connected',
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-tour="hiring-jobs-overview">
      {/* Stats & Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" data-tour="hiring-jobs-filters">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All ({jobs.length})
          </Button>
          {(['open', 'draft', 'paused', 'closed', 'filled'] as JobPostingStatus[]).map(status => {
            const count = jobs.filter(j => j.status === status).length;
            if (count === 0) return null;
            return (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {STATUS_CONFIG[status].label} ({count})
              </Button>
            );
          })}
        </div>
        {isHROrAdmin && (
          <Button className="h-9 sm:ml-auto" onClick={onOpenCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        )}
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <Card className="border-dashed" data-tour="hiring-jobs-list">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No job postings yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Create your first job posting to start receiving applications.
            </p>
            {isHROrAdmin && (
              <Button onClick={onOpenCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Create Job Posting
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid justify-items-center gap-4 md:grid-cols-2 md:justify-items-stretch lg:grid-cols-3" data-tour="hiring-jobs-list">
          {filteredJobs.map(job => {
            const statusConfig = STATUS_CONFIG[job.status];
            const StatusIcon = statusConfig.icon;
            const daysOpen = getDaysOpen(job);
            const salary = formatSalary(job.salary_min, job.salary_max);
            const atsImported = isAtsImportedJob(job);

            return (
              <Card key={job.id} className="relative w-full max-w-xl md:max-w-none">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-medium truncate pr-2">
                        {job.title}
                      </CardTitle>
                      {job.department && (
                        <CardDescription className="mt-1">
                          {job.department}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onFocus={(e) => {
                            // Blur on focus to prevent scroll jump while keeping click behavior
                            e.currentTarget.blur();
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewPipeline(job.id)}>
                          <GitBranch className="h-4 w-4 mr-2" />
                          View Pipeline
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewCandidates(job.id)}>
                          <Users className="h-4 w-4 mr-2" />
                          View Candidates
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {job.status === 'open' && (
                          <DropdownMenuItem onClick={() => copyPublicLink(job.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Application Link
                          </DropdownMenuItem>
                        )}
                        {isHROrAdmin && (
                          <>
                            {atsImported ? (
                              <DropdownMenuItem disabled>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Managed in connected ATS
                              </DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuItem onClick={() => handleEditJob(job)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Job
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {job.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'open')}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Publish
                                  </DropdownMenuItem>
                                )}
                                {job.status === 'open' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'paused')}>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                  </DropdownMenuItem>
                                )}
                                {job.status === 'paused' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'open')}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Resume
                                  </DropdownMenuItem>
                                )}
                                {(job.status === 'open' || job.status === 'paused') && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'closed')}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Close
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteJob(job)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                    {atsImported && (
                      <Badge variant="outline" className="text-xs">
                        ATS Import
                      </Badge>
                    )}
                    {job.ideal_role_color_primary && (
                      <Badge variant="outline" className="text-xs">
                        <span 
                          className={`w-2 h-2 rounded-full mr-1 ${
                            ROLECOLOR_OPTIONS.find(c => c.value === job.ideal_role_color_primary)?.color || 'bg-gray-400'
                          }`}
                        />
                        {job.ideal_role_color_primary}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="space-y-2 text-sm">
                    {/* Location & Remote */}
                    <div className="flex items-center gap-4 text-muted-foreground">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        {REMOTE_LABELS[job.remote_policy]}
                      </span>
                    </div>

                    {/* Employment & Salary */}
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>{EMPLOYMENT_LABELS[job.employment_type]}</span>
                      {salary && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          {salary}
                        </span>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium">{job.applications_count}</span>
                        <span className="text-muted-foreground">applicants</span>
                      </span>
                      {daysOpen !== null && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {daysOpen} days
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Job Modal */}
      <Dialog open={showCreateModal || !!editingJob} onOpenChange={(open) => {
        if (!open) {
          onCloseCreateModal();
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingJob ? 'Edit Job Posting' : 'Create Job Posting'}
            </DialogTitle>
            <DialogDescription>
              {editingJob 
                ? 'Update the role in RCF, tailor it for the ATS you plan to use, and keep the pipeline in sync once candidates flow back from Merge.'
                : 'Create the role in RCF, generate ATS-specific copy with AI if helpful, and manually publish it in your external ATS when ready.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Quick fill from company role */}
            {companyRoles.length > 0 && !editingJob && (
              <div className="space-y-2">
                <Label>Quick fill from role template</Label>
                <Select onValueChange={handleCompanyRoleSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companyRoles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Senior Software Engineer"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-primary" />
                    ATS-tailored draft
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pick the ATS you plan to publish in and we&apos;ll tailor the posting for that workflow. RCF keeps the draft here, and your team still posts it manually in the external ATS.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="lg:shrink-0"
                  onClick={handleGenerateAtsDraft}
                  disabled={generatingAtsDraft || !targetAtsPlatform || !formData.title?.trim()}
                >
                  {generatingAtsDraft ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate ATS Copy
                </Button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-2">
                  <Label>Target ATS</Label>
                  <Select value={targetAtsPlatform} onValueChange={setTargetAtsPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an ATS to tailor this job post..." />
                    </SelectTrigger>
                    <SelectContent>
                      {atsTargetOptions.map((integration) => (
                        <SelectItem key={integration.integration} value={integration.name}>
                          {integration.connected ? `${integration.name} (Connected)` : integration.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {connectedAtsCount > 0
                      ? 'Your connected ATS is pre-selected, but you can tailor this copy for any supported Merge ATS.'
                      : 'Choose the ATS your team plans to publish in so the generated copy fits that workflow.'}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-background/80 px-4 py-3">
                  <div className="space-y-1">
                    <Label htmlFor="save-as-draft" className="text-sm font-medium">
                      Save as draft in RCF
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Keep this role private in RCF until your team is ready to open it publicly.
                    </p>
                  </div>
                  <Switch
                    id="save-as-draft"
                    checked={saveAsDraft}
                    onCheckedChange={setSaveAsDraft}
                  />
                </div>
              </div>

              {atsPostingNotes.length > 0 && (
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="text-sm font-medium">Manual publish notes for {targetAtsPlatform}</div>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {atsPostingNotes.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g., Engineering, Marketing, Sales"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Job description, responsibilities, requirements..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Location & Remote */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., New York, NY"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Remote Policy</Label>
                <Select 
                  value={formData.remote_policy}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, remote_policy: v as RemotePolicy }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REMOTE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Employment Type & Experience */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select 
                  value={formData.employment_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, employment_type: v as EmploymentType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Required Experience (years)</Label>
                <Input
                  id="experience"
                  type="number"
                  min={0}
                  placeholder="e.g., 3"
                  value={formData.required_experience_years || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    required_experience_years: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                />
              </div>
            </div>

            {/* Salary Range */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Salary Min ($)</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  min={0}
                  placeholder="e.g., 80000"
                  value={formData.salary_min || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    salary_min: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Salary Max ($)</Label>
                <Input
                  id="salaryMax"
                  type="number"
                  min={0}
                  placeholder="e.g., 120000"
                  value={formData.salary_max || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    salary_max: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                />
              </div>
            </div>

            {/* RoleColor matching */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Ideal RoleColor (Primary)</Label>
                <Select 
                  value={formData.ideal_role_color_primary || ''}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, ideal_role_color_primary: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLECOLOR_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${opt.color}`} />
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ideal RoleColor (Secondary)</Label>
                <Select 
                  value={formData.ideal_role_color_secondary || ''}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, ideal_role_color_secondary: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLECOLOR_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${opt.color}`} />
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Required Skills */}
            <div className="space-y-2">
              <Label>Required Skills</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                />
                <Button type="button" variant="secondary" onClick={handleAddSkill}>
                  Add
                </Button>
              </div>
              {(formData.required_skills?.length || 0) > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                  {formData.required_skills?.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1 pr-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                onCloseCreateModal();
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveJob} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingJob ? 'Save Job' : saveAsDraft ? 'Create Draft' : 'Create and Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
