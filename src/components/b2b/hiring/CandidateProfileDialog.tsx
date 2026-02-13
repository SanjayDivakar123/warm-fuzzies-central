import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  FileText,
  Star,
  Clock,
  ExternalLink,
  Download,
  Loader2,
  Activity,
  MessageSquare,
  Linkedin,
  MapPin,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import CandidateActivityTimeline from './CandidateActivityTimeline';

interface CandidateProfile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  position_title: string | null;
  ideal_role_color: string | null;
  fit_score: number | null;
  required_skills: string[] | null;
  notes: string | null;
  source: string | null;
  resume_url: string | null;
  linkedin_url?: string | null;
  created_at: string | null;
  status: string;
  assessment_completed_at: string | null;
}

interface Application {
  id: string;
  job_posting: {
    id: string;
    title: string;
  } | null;
  current_stage: {
    id: string;
    name: string;
    color_code: string | null;
  } | null;
  applied_at: string;
  stage_entered_at: string | null;
  hired_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
}

interface CandidateProfileDialogProps {
  candidateId: string | null;
  companyId: string;
  open: boolean;
  onClose: () => void;
}

const ROLECOLOR_COLORS: Record<string, string> = {
  Yellow: 'bg-yellow-500',
  Red: 'bg-red-500',
  Green: 'bg-green-500',
  Blue: 'bg-blue-500',
};

export default function CandidateProfileDialog({
  candidateId,
  companyId,
  open,
  onClose,
}: CandidateProfileDialogProps) {
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && candidateId) {
      fetchCandidateDetails();
    }
  }, [open, candidateId]);

  const fetchCandidateDetails = async () => {
    if (!candidateId) return;
    
    setLoading(true);
    try {
      // Fetch candidate
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (candidateError) throw candidateError;
      setCandidate(candidateData);

      // Fetch applications
      const { data: appsData } = await supabase
        .from('candidate_applications')
        .select(`
          id,
          applied_at,
          stage_entered_at,
          hired_at,
          rejected_at,
          rejection_reason,
          job_posting:job_postings(id, title),
          current_stage:hiring_pipeline_stages(id, name, color_code)
        `)
        .eq('candidate_id', candidateId);

      setApplications((appsData || []) as Application[]);
    } catch (err: any) {
      console.error('Error fetching candidate:', err);
      toast({
        title: 'Error loading candidate',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      invited: 'bg-blue-100 text-blue-700',
      applied: 'bg-purple-100 text-purple-700',
      assessment_pending: 'bg-yellow-100 text-yellow-700',
      assessment_completed: 'bg-green-100 text-green-700',
      hired: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      archived: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
  };

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Candidate Profile</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : candidate ? (
          <div className="space-y-6 pt-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {getInitials(candidate.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">
                    {candidate.full_name || 'Unknown'}
                  </h2>
                  {candidate.ideal_role_color && (
                    <div
                      className={`w-4 h-4 rounded-full ${ROLECOLOR_COLORS[candidate.ideal_role_color] || 'bg-gray-400'}`}
                      title={`RoleColor: ${candidate.ideal_role_color}`}
                    />
                  )}
                </div>
                {candidate.position_title && (
                  <p className="text-muted-foreground">{candidate.position_title}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusBadge(candidate.status)}>
                    {formatStatus(candidate.status)}
                  </Badge>
                  {candidate.fit_score !== null && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {candidate.fit_score}% Fit
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Info */}
            <div className="grid gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${candidate.email}`} className="text-primary hover:underline">
                  {candidate.email}
                </a>
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${candidate.phone}`} className="hover:underline">
                    {candidate.phone}
                  </a>
                </div>
              )}
              {candidate.linkedin_url && (
                <div className="flex items-center gap-2 text-sm">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={candidate.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    LinkedIn Profile
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {candidate.source && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Source:</span>
                  <span className="capitalize">{candidate.source.replace(/_/g, ' ')}</span>
                </div>
              )}
              {candidate.created_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Added:</span>
                  <span>{format(new Date(candidate.created_at), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>

            {/* Resume */}
            {candidate.resume_url && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Resume
                  </h3>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={candidate.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Resume
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </>
            )}

            {/* Skills */}
            {candidate.required_skills && candidate.required_skills.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.required_skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            {candidate.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Notes
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {candidate.notes}
                  </p>
                </div>
              </>
            )}

            {/* Applications */}
            {applications.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Applications ({applications.length})
                  </h3>
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <Card key={app.id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {app.job_posting?.title || 'Unknown Position'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Applied {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                              </p>
                            </div>
                            {app.current_stage && (
                              <Badge
                                style={{
                                  backgroundColor: app.current_stage.color_code || undefined,
                                  color: app.current_stage.color_code ? 'white' : undefined,
                                }}
                              >
                                {app.current_stage.name}
                              </Badge>
                            )}
                            {app.hired_at && (
                              <Badge className="bg-emerald-100 text-emerald-700">Hired</Badge>
                            )}
                            {app.rejected_at && (
                              <Badge className="bg-red-100 text-red-700">Rejected</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Activity Timeline */}
            <Separator />
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity History
              </h3>
              <CandidateActivityTimeline
                candidateId={candidateId!}
                companyId={companyId}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Candidate not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
