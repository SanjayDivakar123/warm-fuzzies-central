import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, Clock, Video, MapPin, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduleInterviewDialogProps {
  applicationId: string | null;
  candidateId: string | null;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyId: string;
  open: boolean;
  onClose: () => void;
  onScheduled: () => void;
}

type InterviewType = 'video' | 'phone' | 'onsite';

export default function ScheduleInterviewDialog({
  applicationId,
  candidateId,
  candidateName,
  candidateEmail,
  jobTitle,
  companyId,
  open,
  onClose,
  onScheduled,
}: ScheduleInterviewDialogProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [interviewType, setInterviewType] = useState<InterviewType>('video');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // Set defaults
      setTitle(`Interview - ${jobTitle}`);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(format(tomorrow, 'yyyy-MM-dd'));
      setTime('10:00');
    }
  }, [open, jobTitle]);

  const handleSchedule = async () => {
    if (!date || !time) {
      toast({
        title: 'Missing information',
        description: 'Please select a date and time.',
        variant: 'destructive',
      });
      return;
    }

    setScheduling(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`);
      const endTime = new Date(scheduledAt.getTime() + parseInt(duration) * 60000);

      // Create interview record
      const { data: interview, error } = await supabase
        .from('interviews')
        .insert({
          application_id: applicationId!,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: parseInt(duration),
          interview_type: interviewType,
          location: interviewType === 'onsite' ? location.trim() || null : null,
          meeting_link: interviewType === 'video' ? location.trim() || null : null,
          instructions_for_candidate: notes.trim() || null,
          status: 'scheduled',
        })
        .select('id')
        .single();

      if (error) throw error;

      // Log activity
      if (candidateId) {
        await supabase.from('candidate_activities').insert({
          company_id: companyId,
          candidate_id: candidateId,
          application_id: applicationId,
          activity_type: 'interview_scheduled',
          title: 'Interview scheduled',
          description: `${interviewType === 'video' ? 'Video' : interviewType === 'phone' ? 'Phone' : 'In-person'} interview scheduled for ${format(scheduledAt, 'MMM d, yyyy')} at ${format(scheduledAt, 'h:mm a')}`,
          metadata: {
            interview_id: interview.id,
            scheduled_at: scheduledAt.toISOString(),
            interview_type: interviewType,
          },
        });
      }

      // Send email notification if enabled
      if (sendEmail && candidateEmail) {
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: candidateEmail,
              subject: `Interview Scheduled: ${title || jobTitle}`,
              html: `
                <h2>Interview Scheduled</h2>
                <p>Hello ${candidateName},</p>
                <p>Your interview has been scheduled:</p>
                <ul>
                  <li><strong>Date:</strong> ${format(scheduledAt, 'EEEE, MMMM d, yyyy')}</li>
                  <li><strong>Time:</strong> ${format(scheduledAt, 'h:mm a')}</li>
                  <li><strong>Duration:</strong> ${duration} minutes</li>
                  <li><strong>Type:</strong> ${interviewType === 'video' ? 'Video Call' : interviewType === 'phone' ? 'Phone Call' : 'In-Person'}</li>
                  ${location ? `<li><strong>Location:</strong> ${location}</li>` : ''}
                </ul>
                ${notes ? `<p><strong>Additional Notes:</strong><br>${notes}</p>` : ''}
                <p>Best regards,<br>The Hiring Team</p>
              `,
            },
          });
        } catch (emailErr) {
          console.error('Failed to send email:', emailErr);
        }
      }

      toast({
        title: 'Interview scheduled',
        description: `Interview with ${candidateName} scheduled for ${format(scheduledAt, 'MMM d')} at ${format(scheduledAt, 'h:mm a')}`,
      });

      onScheduled();
      onClose();
    } catch (err: any) {
      console.error('Error scheduling interview:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setScheduling(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDate('');
    setTime('');
    setDuration('60');
    setInterviewType('video');
    setLocation('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Interview
          </DialogTitle>
          <DialogDescription>
            Schedule an interview with {candidateName} for {jobTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Interview Title</Label>
            <Input
              id="title"
              placeholder="e.g., Technical Interview Round 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Interview Type</Label>
              <Select value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video Call
                    </div>
                  </SelectItem>
                  <SelectItem value="phone">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Call
                    </div>
                  </SelectItem>
                  <SelectItem value="onsite">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      In-Person
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(interviewType === 'video' || interviewType === 'onsite') && (
            <div className="space-y-2">
              <Label htmlFor="location">
                {interviewType === 'video' ? 'Meeting Link' : 'Address'}
              </Label>
              <Input
                id="location"
                placeholder={interviewType === 'video' ? 'https://meet.google.com/...' : 'Office address'}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information for the candidate..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="sendEmail" className="text-sm font-normal cursor-pointer">
              Send email notification to candidate
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={scheduling}>
            {scheduling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Schedule Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
