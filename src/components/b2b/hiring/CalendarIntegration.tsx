import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Link,
  Unlink,
  RefreshCw,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Video,
} from 'lucide-react';

interface CalendarIntegration {
  id: string;
  provider: 'google' | 'microsoft' | 'apple';
  email: string;
  is_active: boolean;
  sync_enabled: boolean;
  last_synced_at: string | null;
  calendar_id: string | null;
}

interface CalendarIntegrationProps {
  companyId: string;
  userId: string;
}

// OAuth URLs (these would be edge functions in production)
const OAUTH_URLS = {
  google: '/api/auth/google-calendar',
  microsoft: '/api/auth/microsoft-calendar',
};

export default function CalendarIntegrationManager({
  companyId,
  userId,
}: CalendarIntegrationProps) {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [defaultDuration, setDefaultDuration] = useState('30');
  const [defaultBuffer, setDefaultBuffer] = useState('15');
  const [autoCreateMeet, setAutoCreateMeet] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchIntegrations();
  }, [companyId]);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', userId);

      if (error) throw error;
      setIntegrations((data || []) as CalendarIntegration[]);
    } catch (err) {
      console.error('Error fetching calendar integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectCalendar = async (provider: 'google' | 'microsoft') => {
    // In production, this would redirect to OAuth flow
    // For now, we'll simulate the connection
    toast({
      title: 'Connecting...',
      description: `Opening ${provider === 'google' ? 'Google' : 'Microsoft'} authorization...`,
    });

    // Simulate OAuth callback
    try {
      const { error } = await supabase.from('calendar_integrations').insert({
        company_id: companyId,
        user_id: userId,
        provider,
        email: `user@${provider === 'google' ? 'gmail.com' : 'outlook.com'}`,
        is_active: true,
        sync_enabled: true,
        access_token: 'mock_token',
        refresh_token: 'mock_refresh',
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Calendar Connected',
        description: `Successfully connected your ${provider === 'google' ? 'Google' : 'Microsoft'} calendar.`,
      });

      fetchIntegrations();
    } catch (err: any) {
      toast({
        title: 'Connection Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const disconnectCalendar = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;

      toast({
        title: 'Calendar Disconnected',
        description: 'Your calendar has been disconnected.',
      });

      fetchIntegrations();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const toggleSync = async (integrationId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('calendar_integrations')
        .update({ sync_enabled: enabled })
        .eq('id', integrationId);

      if (error) throw error;

      setIntegrations(prev =>
        prev.map(i =>
          i.id === integrationId ? { ...i, sync_enabled: enabled } : i
        )
      );
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const syncNow = async (integrationId: string) => {
    setSyncing(integrationId);
    try {
      // In production, this would call an edge function to sync
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error } = await supabase
        .from('calendar_integrations')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', integrationId);

      if (error) throw error;

      toast({
        title: 'Sync Complete',
        description: 'Your calendar has been synced.',
      });

      fetchIntegrations();
    } catch (err: any) {
      toast({
        title: 'Sync Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSyncing(null);
    }
  };

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'google':
        return {
          name: 'Google Calendar',
          icon: '🗓️',
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        };
      case 'microsoft':
        return {
          name: 'Microsoft Outlook',
          icon: '📅',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        };
      default:
        return {
          name: 'Calendar',
          icon: '📆',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
        };
    }
  };

  const formatLastSynced = (date: string | null) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading calendar settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your calendars to sync interview schedules automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connected Calendars */}
          {integrations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Connected Calendars</h3>
              {integrations.map(integration => {
                const info = getProviderInfo(integration.provider);
                return (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <p className="font-medium">{info.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {integration.email}
                        </p>
                      </div>
                      <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                        {integration.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Last synced</p>
                        <p>{formatLastSynced(integration.last_synced_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={integration.sync_enabled}
                          onCheckedChange={(checked) =>
                            toggleSync(integration.id, checked)
                          }
                        />
                        <span className="text-sm">Auto-sync</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncNow(integration.id)}
                        disabled={syncing === integration.id}
                      >
                        {syncing === integration.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnectCalendar(integration.id)}
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Connect New Calendar */}
          <div>
            <h3 className="text-sm font-medium mb-4">Connect a Calendar</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => connectCalendar('google')}
                disabled={integrations.some(i => i.provider === 'google')}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🗓️</span>
                  <div className="text-left">
                    <p className="font-medium">Google Calendar</p>
                    <p className="text-sm text-muted-foreground">
                      Sync with Google Workspace
                    </p>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => connectCalendar('microsoft')}
                disabled={integrations.some(i => i.provider === 'microsoft')}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📅</span>
                  <div className="text-left">
                    <p className="font-medium">Microsoft Outlook</p>
                    <p className="text-sm text-muted-foreground">
                      Sync with Microsoft 365
                    </p>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interview Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Interview Settings
          </CardTitle>
          <CardDescription>
            Configure default settings for scheduling interviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Interview Duration</Label>
              <Select value={defaultDuration} onValueChange={setDefaultDuration}>
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
              <Label>Buffer Time Between Interviews</Label>
              <Select value={defaultBuffer} onValueChange={setDefaultBuffer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No buffer</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Video Conferencing</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Auto-create Google Meet</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically add Google Meet links to interviews
                  </p>
                </div>
              </div>
              <Switch
                checked={autoCreateMeet}
                onCheckedChange={setAutoCreateMeet}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button>Save Settings</Button>
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Your Availability</CardTitle>
          <CardDescription>
            Set your available hours for interviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
              <div key={day} className="flex items-center gap-4">
                <div className="w-24">
                  <p className="font-medium">{day}</p>
                </div>
                <Select defaultValue="9:00">
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 7).map(hour => (
                      <SelectItem key={hour} value={`${hour}:00`}>
                        {hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">to</span>
                <Select defaultValue="17:00">
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 12).map(hour => (
                      <SelectItem key={hour} value={`${hour}:00`}>
                        {hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
