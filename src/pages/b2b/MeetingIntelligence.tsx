import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompany } from '@/contexts/CompanyContext';
import { useMeetings } from '@/hooks/useMeetings';
import { Loader2, Video, Settings as SettingsIcon } from 'lucide-react';
import MeetingList from '@/components/meeting/MeetingList';
import MeetingDetail from '@/components/meeting/MeetingDetail';
import MeetingSettings from '@/components/meeting/MeetingSettings';

export default function MeetingIntelligence() {
  const { company, loading: companyLoading } = useCompany();
  const { meetings, loading, fetchMeetings } = useMeetings(company?.id);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('meetings');

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId) || null;

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-2 h-auto bg-background border p-1">
        <TabsTrigger value="meetings" className="flex items-center gap-2">
          <Video className="h-4 w-4" />
          Meetings
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <SettingsIcon className="h-4 w-4" />
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="meetings" className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r overflow-hidden">
          <MeetingList
            meetings={meetings}
            selectedMeetingId={selectedMeetingId}
            onSelectMeeting={setSelectedMeetingId}
            onRefresh={fetchMeetings}
            loading={loading}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <MeetingDetail
            meeting={selectedMeeting}
            loading={loading}
          />
        </div>
      </TabsContent>

      <TabsContent value="settings" className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          <div className="space-y-2 mb-6">
            <h2 className="text-3xl font-bold">Meeting Intelligence Settings</h2>
            <p className="text-muted-foreground">
              Configure bot behavior, calendar integration, and meeting management
            </p>
          </div>
          <MeetingSettings
            onMeetingCreated={(meetingId) => {
              setSelectedMeetingId(meetingId);
              setActiveTab('meetings');
              fetchMeetings();
            }}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
