import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VideoIcon, Loader2, Search, Zap, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Meeting } from '@/hooks/useMeetings';

interface MeetingListProps {
  meetings: Meeting[];
  selectedMeetingId: string | null;
  onSelectMeeting: (id: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

const STATUS_CONFIG = {
  live: { icon: Zap, color: 'text-red-600', bg: 'bg-red-50', label: '🔴 LIVE' },
  needs_mapping: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', label: '⚠️ NEEDS MAPPING' },
  processing: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', label: '⏳ PROCESSING' },
  complete: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: '✅ REPORTS READY' },
  scheduled: { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', label: '🗓 UPCOMING' },
  failed: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: '❌ FAILED' },
};

export default function MeetingList({
  meetings,
  selectedMeetingId,
  onSelectMeeting,
  onRefresh,
  loading
}: MeetingListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const groupedMeetings = {
    live: meetings.filter(m => m.bot_join_status === 'live'),
    needs_mapping: meetings.filter(m => m.bot_join_status === 'needs_mapping'),
    processing: meetings.filter(m => m.bot_join_status === 'processing'),
    complete: meetings.filter(m => m.bot_join_status === 'complete'),
    scheduled: meetings.filter(m => m.bot_join_status === 'scheduled'),
    failed: meetings.filter(m => m.bot_join_status === 'failed'),
  };

  const filteredGroups = Object.entries(groupedMeetings).map(([status, items]) => ({
    status,
    items: items.filter(m =>
      m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.meeting_url?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(g => g.items.length > 0);

  return (
    <div className="h-full flex flex-col bg-background border-r">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Meetings</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <VideoIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {meetings.length === 0
                ? 'No meetings yet'
                : 'No meetings match your search'}
            </div>
          ) : (
            filteredGroups.map(({ status, items }) => (
              <div key={status} className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground px-2 py-1">
                  {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}
                </h3>
                {items.map(meeting => (
                  <button
                    key={meeting.id}
                    onClick={() => onSelectMeeting(meeting.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedMeetingId === meeting.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted border-border'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm truncate">
                        {meeting.title || 'Untitled Meeting'}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div className="capitalize">{meeting.platform}</div>
                        {meeting.started_at && (
                          <div>{format(new Date(meeting.started_at), 'MMM dd, hh:mm a')}</div>
                        )}
                      </div>
                      {meeting.bot_join_status && (
                        <div className="pt-2">
                          <Badge variant="outline" className="text-xs">
                            {STATUS_CONFIG[meeting.bot_join_status as keyof typeof STATUS_CONFIG]?.label || meeting.bot_join_status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
