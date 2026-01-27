import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Bell, Check, Loader2, ExternalLink } from 'lucide-react';
import SlackIntegrationSettings from './SlackIntegrationSettings';

interface IntegrationsSettingsProps {
  company: any;
  onSettingsSaved?: () => void;
}

export default function IntegrationsSettings({ company, onSettingsSaved }: IntegrationsSettingsProps) {
  const [teamsEnabled, setTeamsEnabled] = useState(company.ms_teams_notifications_enabled || false);
  const [teamsWebhookUrl, setTeamsWebhookUrl] = useState(company.ms_teams_webhook_url || '');
  const [saving, setSaving] = useState(false);
  const [testingTeams, setTestingTeams] = useState(false);
  const { toast } = useToast();

  const handleSaveTeams = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          ms_teams_notifications_enabled: teamsEnabled,
          ms_teams_webhook_url: teamsWebhookUrl || null,
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: 'Teams settings saved',
        description: 'Your Microsoft Teams integration has been updated.',
      });

      onSettingsSaved?.();
    } catch (error: any) {
      toast({
        title: 'Error saving settings',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const testTeamsConnection = async () => {
    if (!teamsWebhookUrl) {
      toast({
        title: 'Webhook URL required',
        description: 'Please enter a Teams webhook URL first.',
        variant: 'destructive',
      });
      return;
    }

    setTestingTeams(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-teams-notification', {
        body: {
          company_id: company.id,
          event_type: 'reminder',
          data: {
            message: 'Test notification from RoleColorFinder - your Teams integration is working!'
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Test notification sent',
          description: 'Check your Teams channel for the test message.',
        });
      } else {
        throw new Error(data?.message || 'Failed to send test notification');
      }
    } catch (error: any) {
      toast({
        title: 'Test failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setTestingTeams(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Slack Integration - Full Featured */}
      <SlackIntegrationSettings 
        company={company} 
        onSettingsSaved={onSettingsSaved} 
      />

      {/* Microsoft Teams Integration */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#5059C9] flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-medium">Microsoft Teams</CardTitle>
                <CardDescription>Get notified about team updates in Teams</CardDescription>
              </div>
            </div>
            <Switch
              checked={teamsEnabled}
              onCheckedChange={setTeamsEnabled}
            />
          </div>
        </CardHeader>
        {teamsEnabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamsWebhook">Incoming Webhook URL</Label>
              <Input
                id="teamsWebhook"
                type="url"
                placeholder="https://outlook.office.com/webhook/..."
                value={teamsWebhookUrl}
                onChange={(e) => setTeamsWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Create an incoming webhook in your Teams channel settings
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testTeamsConnection}
                disabled={testingTeams || !teamsWebhookUrl}
              >
                {testingTeams ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
              <a 
                href="https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                How to create webhook <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Notifications sent:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Assessment completions</li>
                <li>New team members joining</li>
                <li>Task assignments</li>
              </ul>
            </div>
            
            {/* Save Button for Teams */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSaveTeams} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Teams Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
