import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Bell, 
  Check, 
  Loader2, 
  ExternalLink, 
  Users, 
  Send, 
  AlertCircle,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

interface SlackIntegrationSettingsProps {
  company: any;
  onSettingsSaved?: () => void;
}

export default function SlackIntegrationSettings({ company, onSettingsSaved }: SlackIntegrationSettingsProps) {
  const [enabled, setEnabled] = useState(company.slack_notifications_enabled || false);
  const [channelId, setChannelId] = useState(company.slack_channel_id || '');
  const [botToken, setBotToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [hasExistingToken, setHasExistingToken] = useState(!!company.slack_bot_token);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    
    try {
      const updates: Record<string, any> = {
        slack_notifications_enabled: enabled,
        slack_channel_id: channelId || null,
      };
      
      // Only update token if a new one was entered
      if (botToken.trim()) {
        updates.slack_bot_token = botToken.trim();
      }

      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', company.id);

      if (error) throw error;

      if (botToken.trim()) {
        setHasExistingToken(true);
        setBotToken('');
      }

      toast({
        title: 'Slack settings saved',
        description: 'Your Slack integration has been updated.',
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

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-slack-notification', {
        body: {
          company_id: company.id,
          event_type: 'reminder',
          data: {
            email: 'test@example.com',
            reminder_message: 'This is a test notification from RoleColorFinder! Your Slack integration is working correctly. 🎉'
          }
        }
      });

      if (error) throw error;

      setTestResult({
        success: data?.success || false,
        message: data?.message || 'Unknown result'
      });

      if (data?.success) {
        toast({
          title: 'Test successful!',
          description: 'Check your Slack channel for the test message.',
        });
      } else {
        toast({
          title: 'Test completed',
          description: data?.message || 'Check the result below.',
          variant: 'default',
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message
      });
      toast({
        title: 'Test failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const sendTestDM = async () => {
    // Get current user's email
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast({
        title: 'Unable to test',
        description: 'Could not determine your email address.',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-slack-notification', {
        body: {
          company_id: company.id,
          event_type: 'dm_invite',
          data: {
            email: user.email,
            invite_code: 'TEST1234',
            full_name: 'Test User'
          }
        }
      });

      if (error) throw error;

      setTestResult({
        success: data?.success || false,
        message: data?.message || 'Unknown result'
      });

      toast({
        title: data?.success ? 'DM sent!' : 'DM test completed',
        description: data?.message,
        variant: data?.success ? 'default' : 'destructive',
      });
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
      toast({
        title: 'Test failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#4A154B] flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                Slack Integration
                {hasExistingToken && enabled && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Send DM invites, share results, and notify admins via Slack
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </CardHeader>
      
      {enabled && (
        <CardContent className="space-y-6">
          {/* Bot Token */}
          <div className="space-y-2">
            <Label htmlFor="botToken" className="flex items-center gap-2">
              Bot Token
              {hasExistingToken && (
                <Badge variant="outline" className="text-xs">Token saved</Badge>
              )}
            </Label>
            <div className="relative">
              <Input
                id="botToken"
                type={showToken ? "text" : "password"}
                placeholder={hasExistingToken ? "••••••••••••••••" : "xoxb-your-bot-token"}
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get this from your Slack App settings → OAuth & Permissions → Bot User OAuth Token
            </p>
          </div>

          {/* Channel ID */}
          <div className="space-y-2">
            <Label htmlFor="channelId">Notification Channel ID</Label>
            <Input
              id="channelId"
              placeholder="C1234567890"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Right-click on a channel → View channel details → Copy Channel ID
            </p>
          </div>

          {/* Features List */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium">What this integration does:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <Send className="h-4 w-4 mt-0.5 text-primary" />
                <span><strong>DM Invites:</strong> Automatically DM employees when you invite them to take the assessment</span>
              </li>
              <li className="flex items-start gap-2">
                <Bell className="h-4 w-4 mt-0.5 text-primary" />
                <span><strong>Completion Alerts:</strong> Post to your channel when employees complete their assessment</span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 text-primary" />
                <span><strong>Share Results:</strong> Share RoleColor profiles in channels for team visibility</span>
              </li>
            </ul>
          </div>

          {/* Required Scopes Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Required Bot Scopes:</strong>
              <div className="mt-2 flex flex-wrap gap-1">
                {['chat:write', 'users:read.email', 'im:write', 'channels:read'].map(scope => (
                  <code key={scope} className="bg-muted px-1.5 py-0.5 rounded text-xs">
                    {scope}
                  </code>
                ))}
              </div>
            </AlertDescription>
          </Alert>

          {/* Test Result */}
          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testConnection}
              disabled={testing || !hasExistingToken}
            >
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Test Channel Post
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={sendTestDM}
              disabled={testing || !hasExistingToken}
            >
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Test DM to Me
            </Button>
            
            <a 
              href="https://api.slack.com/apps" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto"
            >
              Manage Slack App <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Slack Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
