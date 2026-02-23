import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Video,
  Phone,
  MapPin,
  Users,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { format, addDays, isSameDay, startOfDay, parseISO } from 'date-fns';

type Interview = Database['public']['Tables']['interviews']['Row'];
type InterviewStatus = Database['public']['Enums']['interview_status'];
type InterviewType = Database['public']['Enums']['interview_type'];

interface InterviewWithDetails extends Interview {
  candidate_application: {
    id: string;
    candidate: {
      id: string;
      full_name: string | null;
      email: string;
    };
    job_posting: {
      id: string;
      title: string;
    };
  };
}

interface InterviewsTabProps {
  company: { id: string; name: string };
  companyUser: { id: string; role: string } | null;
  isActive?: boolean;
}

const INTERVIEW_TYPE_ICONS: Record<InterviewType, React.ReactNode> = {
  phone: <Phone className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  onsite: <MapPin className="h-4 w-4" />,
  panel: <Users className="h-4 w-4" />,
  technical: <FileText className="h-4 w-4" />,
  behavioral: <MessageSquare className="h-4 w-4" />,
};

const INTERVIEW_STATUS_BADGES: Record<InterviewStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  scheduled: { variant: 'outline', label: 'Scheduled' },
  completed: { variant: 'secondary', label: 'Completed' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
  no_show: { variant: 'destructive', label: 'No Show' },
};

export default function InterviewsTab({
  company,
  companyUser,
  isActive = false,
}: InterviewsTabProps) {
  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | 'all'>('all');

  const { toast } = useToast();
  const isHROrAdmin = companyUser?.role === 'admin' || companyUser?.role === 'hr';

  useEffect(() => {
    if (!isActive) return;
    fetchInterviews();
  }, [company.id, isActive]);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      // First get all job IDs for this company
      const { data: jobsData } = await supabase
        .from('job_postings')
        .select('id')
        .eq('company_id', company.id);

      const jobIds = jobsData?.map(j => j.id) || [];

      if (jobIds.length === 0) {
        setInterviews([]);
        setLoading(false);
        return;
      }

      // Get applications for those jobs
      const { data: appsData } = await supabase
        .from('candidate_applications')
        .select('id')
        .in('job_posting_id', jobIds);

      const appIds = appsData?.map(a => a.id) || [];

      if (appIds.length === 0) {
        setInterviews([]);
        setLoading(false);
        return;
      }

      // Get interviews
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          candidate_application:candidate_applications (
            id,
            candidate:candidates (
              id,
              full_name,
              email
            ),
            job_posting:job_postings (
              id,
              title
            )
          )
        `)
        .in('application_id', appIds)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setInterviews(data as InterviewWithDetails[] || []);
    } catch (err: any) {
      console.error('Error fetching interviews:', err);
      toast({
        title: 'Error loading interviews',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateInterviewStatus = async (interviewId: string, status: InterviewStatus) => {
    try {
      const { error } = await supabase
        .from('interviews')
        .update({ status })
        .eq('id', interviewId);

      if (error) throw error;

      toast({
        title: 'Interview updated',
        description: `Status changed to ${INTERVIEW_STATUS_BADGES[status].label}.`,
      });

      fetchInterviews();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    if (statusFilter !== 'all' && interview.status !== statusFilter) return false;
    return true;
  });

  const getInterviewsForDate = (date: Date) => {
    return filteredInterviews.filter(interview => {
      const interviewDate = parseISO(interview.scheduled_at);
      return isSameDay(interviewDate, date);
    });
  };

  const upcomingInterviews = filteredInterviews.filter(i => 
    parseISO(i.scheduled_at) >= startOfDay(new Date()) && 
    i.status !== 'cancelled' && 
    i.status !== 'completed'
  );

  const todaysInterviews = getInterviewsForDate(new Date());

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{todaysInterviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingInterviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {interviews.filter(i => i.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isHROrAdmin && (
          <Button onClick={() => setShowScheduleDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Interview
          </Button>
        )}
      </div>

      {/* Calendar/List View */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md"
                modifiers={{
                  hasInterviews: filteredInterviews.map(i => parseISO(i.scheduled_at)),
                }}
                modifiersStyles={{
                  hasInterviews: { fontWeight: 'bold', textDecoration: 'underline' },
                }}
              />
            </CardContent>
          </Card>

          {/* Selected date interviews */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardTitle>
              <CardDescription>
                {getInterviewsForDate(selectedDate).length} interview(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {getInterviewsForDate(selectedDate).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No interviews scheduled for this date.
                </p>
              ) : (
                getInterviewsForDate(selectedDate).map(interview => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    onUpdateStatus={updateInterviewStatus}
                    canManage={isHROrAdmin}
                    getInitials={getInitials}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Interviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredInterviews.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No interviews found.
              </p>
            ) : (
              filteredInterviews.map(interview => (
                <InterviewCard
                  key={interview.id}
                  interview={interview}
                  onUpdateStatus={updateInterviewStatus}
                  canManage={isHROrAdmin}
                  getInitials={getInitials}
                  showDate
                />
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedule Dialog (placeholder - would need application selector) */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              To schedule an interview, go to the Pipeline or Candidates tab and select a candidate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Interview Card Component
interface InterviewCardProps {
  interview: InterviewWithDetails;
  onUpdateStatus: (id: string, status: InterviewStatus) => void;
  canManage: boolean;
  getInitials: (name: string | null, email: string) => string;
  showDate?: boolean;
}

function InterviewCard({
  interview,
  onUpdateStatus,
  canManage,
  getInitials,
  showDate,
}: InterviewCardProps) {
  const candidate = interview.candidate_application?.candidate;
  const job = interview.candidate_application?.job_posting;
  const scheduledDate = parseISO(interview.scheduled_at);
  const statusBadge = INTERVIEW_STATUS_BADGES[interview.status];

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {candidate ? getInitials(candidate.full_name, candidate.email) : '??'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {candidate?.full_name || candidate?.email || 'Unknown Candidate'}
              </p>
              <p className="text-sm text-muted-foreground">
                {job?.title || 'Unknown Position'}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {INTERVIEW_TYPE_ICONS[interview.interview_type]}
                  <span className="capitalize">{interview.interview_type.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {format(scheduledDate, 'h:mm a')}
                  {interview.duration_minutes && ` (${interview.duration_minutes}min)`}
                </div>
                {showDate && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {format(scheduledDate, 'MMM d, yyyy')}
                  </div>
                )}
              </div>
              {interview.location && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {interview.location}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            
            {canManage && interview.status !== 'completed' && interview.status !== 'cancelled' && (
              <Select
                value=""
                onValueChange={(value) => onUpdateStatus(interview.id, value as InterviewStatus)}
              >
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="Update..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Mark Complete</SelectItem>
                  <SelectItem value="cancelled">Cancel</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
