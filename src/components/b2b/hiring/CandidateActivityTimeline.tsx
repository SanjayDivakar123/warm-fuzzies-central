import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Calendar,
  FileText,
  UserCheck,
  UserX,
  MessageSquare,
  Star,
  Tag,
  Upload,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Briefcase,
  Plus,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, any>;
  performed_by_name: string | null;
  created_at: string;
}

interface CandidateActivityTimelineProps {
  candidateId: string;
  applicationId?: string;
  companyId: string;
  companyUserId?: string;
  companyUserName?: string;
  compact?: boolean;
  maxItems?: number;
}

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  application_received: Briefcase,
  stage_changed: ArrowRight,
  note_added: MessageSquare,
  email_sent: Mail,
  email_opened: Eye,
  interview_scheduled: Calendar,
  interview_completed: CheckCircle,
  interview_cancelled: XCircle,
  offer_sent: Send,
  offer_accepted: CheckCircle,
  offer_declined: XCircle,
  rejected: UserX,
  hired: UserCheck,
  resume_viewed: FileText,
  assessment_invited: Send,
  assessment_completed: CheckCircle,
  rating_added: Star,
  tag_added: Tag,
  tag_removed: Tag,
  document_uploaded: Upload,
  comment_added: MessageSquare,
};

const ACTIVITY_COLORS: Record<string, string> = {
  application_received: 'bg-blue-500',
  stage_changed: 'bg-purple-500',
  note_added: 'bg-gray-500',
  email_sent: 'bg-indigo-500',
  email_opened: 'bg-green-500',
  interview_scheduled: 'bg-orange-500',
  interview_completed: 'bg-green-500',
  interview_cancelled: 'bg-red-500',
  offer_sent: 'bg-yellow-500',
  offer_accepted: 'bg-green-500',
  offer_declined: 'bg-red-500',
  rejected: 'bg-red-500',
  hired: 'bg-green-500',
  resume_viewed: 'bg-gray-500',
  assessment_invited: 'bg-blue-500',
  assessment_completed: 'bg-green-500',
  rating_added: 'bg-yellow-500',
  tag_added: 'bg-purple-500',
  tag_removed: 'bg-gray-500',
  document_uploaded: 'bg-blue-500',
  comment_added: 'bg-gray-500',
};

export default function CandidateActivityTimeline({
  candidateId,
  applicationId,
  companyId,
  companyUserId,
  companyUserName,
  compact = false,
  maxItems,
}: CandidateActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchActivities();
  }, [candidateId, applicationId]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('candidate_activities')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (applicationId) {
        query = query.eq('application_id', applicationId);
      }

      if (maxItems) {
        query = query.limit(maxItems);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActivities((data || []) as Activity[]);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!noteContent.trim()) return;

    setSavingNote(true);
    try {
      // Add note to candidate_notes table
      const { error: noteError } = await supabase
        .from('candidate_notes')
        .insert({
          company_id: companyId,
          candidate_id: candidateId,
          application_id: applicationId || null,
          content: noteContent,
          created_by: companyUserId || null,
          created_by_name: companyUserName || null,
        });

      if (noteError) throw noteError;

      // Log activity
      const { error: activityError } = await supabase
        .from('candidate_activities')
        .insert({
          company_id: companyId,
          candidate_id: candidateId,
          application_id: applicationId || null,
          activity_type: 'note_added',
          title: 'Note added',
          description: noteContent.slice(0, 100) + (noteContent.length > 100 ? '...' : ''),
          performed_by: companyUserId || null,
          performed_by_name: companyUserName || null,
        });

      if (activityError) throw activityError;

      toast({ title: 'Note added' });
      setNoteContent('');
      setShowNoteInput(false);
      fetchActivities();
    } catch (err: any) {
      toast({
        title: 'Error adding note',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Activity Timeline</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNoteInput(!showNoteInput)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent>
        {/* Note Input */}
        {showNoteInput && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add a note about this candidate..."
              rows={3}
              className="mb-2"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNoteInput(false);
                  setNoteContent('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={addNote}
                disabled={savingNote || !noteContent.trim()}
              >
                {savingNote && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Save Note
              </Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <ScrollArea className={compact ? 'h-64' : 'h-96'}>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No activity yet</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-4">
                {activities.map((activity, index) => {
                  const IconComponent = ACTIVITY_ICONS[activity.activity_type] || MessageSquare;
                  const colorClass = ACTIVITY_COLORS[activity.activity_type] || 'bg-gray-500';

                  return (
                    <div key={activity.id} className="relative flex gap-3 pl-2">
                      {/* Icon */}
                      <div
                        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${colorClass} text-white`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{activity.title}</p>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {activity.description}
                              </p>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onFocus={(e) => {
                                  e.currentTarget.blur();
                                }}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedActivity(activity)}>
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Metadata badges */}
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {activity.activity_type === 'stage_changed' && activity.metadata.new_stage_name && (
                              <Badge variant="secondary" className="text-xs">
                                → {activity.metadata.new_stage_name}
                              </Badge>
                            )}
                            {activity.activity_type === 'interview_scheduled' && activity.metadata.interview_type && (
                              <Badge variant="outline" className="text-xs">
                                {activity.metadata.interview_type}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Timestamp and author */}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span title={format(new Date(activity.created_at), 'PPpp')}>
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </span>
                          {activity.performed_by_name && (
                            <>
                              <span>•</span>
                              <span>{activity.performed_by_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>

        {maxItems && activities.length >= maxItems && (
          <Button variant="ghost" className="w-full mt-2" size="sm">
            View All Activity
          </Button>
        )}
      </CardContent>

      <Dialog
        open={!!selectedActivity}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedActivity(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>

          {selectedActivity && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{selectedActivity.title}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="outline">{selectedActivity.activity_type.replace(/_/g, ' ')}</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">When</p>
                <p className="font-medium">{format(new Date(selectedActivity.created_at), 'PPpp')}</p>
              </div>

              {selectedActivity.performed_by_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Performed By</p>
                  <p className="font-medium">{selectedActivity.performed_by_name}</p>
                </div>
              )}

              {selectedActivity.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="whitespace-pre-wrap">{selectedActivity.description}</p>
                </div>
              )}

              {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Metadata</p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(selectedActivity.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
