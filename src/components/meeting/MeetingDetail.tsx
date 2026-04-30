import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { Meeting } from '@/hooks/useMeetings';
import ParticipantMapping from './ParticipantMapping';
import ReportView from './ReportView';
import { format } from 'date-fns';

interface MeetingDetailProps {
  meeting: Meeting | null;
  loading?: boolean;
}

export default function MeetingDetail({ meeting, loading }: MeetingDetailProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a meeting to view details
      </div>
    );
  }

  const renderContent = () => {
    switch (meeting.bot_join_status) {
      case 'live':
        return (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                Recording in Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700">
                🤖 <strong>Bot is live and recording.</strong> The chat message has been sent to participants.
              </p>
              <p className="text-sm text-gray-600">
                The report will be ready when the meeting ends. This usually takes 2-3 minutes after the meeting concludes.
              </p>
              <p className="text-xs text-gray-500 pt-2">
                Started: {format(new Date(meeting.started_at!), 'PPpp')}
              </p>
            </CardContent>
          </Card>
        );

      case 'scheduled':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Scheduled</CardTitle>
              <CardDescription>Bot scheduled to join this meeting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The bot is scheduled to join this meeting automatically 1 minute before it starts.
              </p>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm">
                  <strong>Meeting URL:</strong>
                </p>
                <p className="text-xs text-blue-700 break-all font-mono">{meeting.meeting_url}</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'processing':
        return (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                Analyzing Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                Processing the meeting transcript through RoleColor analysis. This typically takes 2-3 minutes.
              </p>
              <div className="mt-4 space-y-2">
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 animate-pulse w-3/4" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Classifying utterances and generating behavioral insights...
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 'needs_mapping':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Confirm Participants
              </CardTitle>
              <CardDescription>
                Map detected speakers to company users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ParticipantMapping meetingId={meeting.id} />
            </CardContent>
          </Card>
        );

      case 'complete':
        return <ReportView meetingId={meeting.id} />;

      case 'failed':
        return (
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                Bot Failed to Join
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-red-700">
                The bot encountered an error while trying to join this meeting.
              </p>
              <Button variant="outline" size="sm">
                Retry Meeting
              </Button>
              <Button variant="outline" size="sm" className="ml-2">
                View Error Details
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Status: <Badge>{meeting.bot_join_status}</Badge>
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{meeting.title || 'Untitled Meeting'}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="capitalize">{meeting.platform}</Badge>
          {meeting.source && <Badge variant="secondary" className="capitalize">{meeting.source}</Badge>}
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
