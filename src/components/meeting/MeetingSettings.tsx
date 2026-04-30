import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createBot, detectPlatform } from '@/lib/recallApi';

interface MeetingSettingsProps {
  onMeetingCreated?: (meetingId: string) => void;
}

export default function MeetingSettings({ onMeetingCreated }: MeetingSettingsProps) {
  const { company } = useCompany();
  const { toast } = useToast();

  // Google Calendar
  const [googleConnected, setGoogleConnected] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  // Instant join
  const [meetingLink, setMeetingLink] = useState('');
  const [joiningBot, setJoiningBot] = useState(false);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!company?.id) return;
      const { data } = await supabase
        .from('company_settings_meeting')
        .select('*')
        .eq('company_id', company.id)
        .single();

      if (data) {
        setGoogleConnected(data.google_cal_connected || false);
      }
    };

    loadSettings();
  }, [company?.id]);

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      // Placeholder for Google OAuth flow
      toast({
        title: 'Coming soon',
        description: 'Google Calendar integration will be available shortly.',
      });
    } finally {
      setConnectingGoogle(false);
    }
  };

  const handleSendBot = async () => {
    if (!meetingLink.trim()) {
      toast({
        title: 'Enter a meeting link',
        description: 'Please paste a Zoom, Meet, or Teams link.',
        variant: 'destructive',
      });
      return;
    }

    const platform = detectPlatform(meetingLink);
    if (!platform) {
      toast({
        title: 'Invalid meeting link',
        description: 'Link must be from Zoom, Google Meet, or Microsoft Teams.',
        variant: 'destructive',
      });
      return;
    }

    setJoiningBot(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const webhookUrl = `${supabaseUrl}/functions/v1/meeting-webhook`;

      const bot = await createBot({
        meetingUrl: meetingLink,
        webhookUrl,
      });

      // Create meeting record
      console.log('Creating meeting record:', { company_id: company?.id, platform, bot_id: bot.id });
      const { data, error } = await supabase
        .from('meetings')
        .insert([
          {
            company_id: company?.id,
            title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Meeting`,
            platform,
            meeting_url: meetingLink,
            source: 'manual',
            bot_id: bot.id,
            bot_join_status: 'joining',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Meeting creation error:', error);
        throw error;
      }
      console.log('Meeting created:', data);

      toast({
        title: '🤖 Bot is joining',
        description: 'The bot will send a chat message when it enters the meeting.',
      });

      setMeetingLink('');
      onMeetingCreated?.(data.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send bot';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setJoiningBot(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Calendar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Google Calendar Sync</CardTitle>
          <CardDescription>
            Automatically sync calendar events and schedule bot joins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {googleConnected ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-600" />
                <p className="text-sm font-medium text-green-900">Connected</p>
              </div>
              <p className="text-xs text-green-800">
                Syncing every 15 minutes · Bot joins 1 minute before start
              </p>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900">
                Connect your Google Calendar to automatically detect meeting times and schedule the bot.
              </p>
            </div>
          )}

          <Button
            onClick={handleConnectGoogle}
            disabled={connectingGoogle || googleConnected}
            className="w-full"
          >
            {connectingGoogle && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {googleConnected ? 'Connected' : 'Connect Google Calendar'}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Instant Join Section */}
      <Card>
        <CardHeader>
          <CardTitle>Send Bot to Meeting</CardTitle>
          <CardDescription>
            Paste a meeting link to send the bot immediately
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>The bot will automatically detect the platform (Zoom, Meet, Teams)</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting-link">Meeting Link</Label>
            <Input
              id="meeting-link"
              placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSendBot}
            disabled={joiningBot || !meetingLink.trim()}
            className="w-full"
          >
            {joiningBot && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send Bot
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
