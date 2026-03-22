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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  
  const { toast } = useToast();
  const isHROrAdmin = companyUser?.role === 'admin' || companyUser?.role === 'hr';

  useEffect(() => {
    fetchJobs();
    fetchCompanyRoles();
  }, [company.id]);

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
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      toast({
        title: 'Error loading jobs',
        description: err.message,
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
    setEditingJob(null);
  };

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
      if (editingJob) {
        // Update existing job
        const { error } = await supabase
          .from('job_postings')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingJob.id);

        if (error) throw error;
        
        toast({
          title: 'Job updated',
          description: `"${formData.title}" has been updated.`,
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
            status: 'draft',
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
          description: `"${formData.title}" has been created with default pipeline stages.`,
        });
      }

      onCloseCreateModal();
      resetForm();
      fetchJobs();
    } catch (err: any) {
      console.error('Error saving job:', err);
      toast({
        title: 'Error saving job',
        description: err.message,
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
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast({
        title: 'Error updating status',
        description: err.message,
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
    } catch (err: any) {
      console.error('Error deleting job:', err);
      toast({
        title: 'Error deleting job',
        description: err.message,
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
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
                ? 'Update the job details below.'
                : 'Fill in the details to create a new job posting. Default pipeline stages will be created automatically.'}
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
              {editingJob ? 'Update Job' : 'Create Job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
