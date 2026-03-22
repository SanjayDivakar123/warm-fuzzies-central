import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Loader2, RefreshCw } from 'lucide-react';

interface HiringIntegrationsTabProps {
  company: { id: string };
  companyUser: { id: string; role: string } | null;
}

const AUTO_SYNC_OPTIONS = [
  { label: 'Instant', value: '6' },
  { label: '1 Minute', value: '60' },
  { label: '5 Minutes', value: '300' },
  { label: '15 Minutes', value: '900' },
  { label: '1 Hour', value: '3600' },
  { label: '6 Hours', value: '21600' },
  { label: '12 Hours', value: '43200' },
  { label: '1 Day', value: '86400' },
  { label: 'Weekly', value: '604800' },
] as const;

export default function HiringIntegrationsTab({ company, companyUser }: HiringIntegrationsTabProps) {
  const [syncingBamboo, setSyncingBamboo] = useState(false);
  const [generatingAuthUrl, setGeneratingAuthUrl] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [bambooCompanyDomain, setBambooCompanyDomain] = useState('');
  const [bambooRedirectUri, setBambooRedirectUri] = useState(`${window.location.origin}/bamboohr/callback`);
  const [bambooAuthCode, setBambooAuthCode] = useState('');
  const [bambooAuthorizeUrl, setBambooAuthorizeUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [autoSyncIntervalSeconds, setAutoSyncIntervalSeconds] = useState('3600');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastAutoSyncAt, setLastAutoSyncAt] = useState<string | null>(null);

  const { toast } = useToast();
  const isHROrAdmin = companyUser?.role === 'admin' || companyUser?.role === 'hr';

  const loadIntegrationStatus = async () => {
    setLoadingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-bamboohr-hiring', {
        body: {
          action: 'get_status',
          company_id: company.id,
        },
      });

      if (error) throw error;

      const integration = data?.integration;
      setIsConnected(Boolean(data?.connected));
      setBambooCompanyDomain(integration?.company_domain || '');
      setAutoSyncEnabled(Boolean(integration?.auto_sync_enabled));
      setAutoSyncIntervalSeconds(String(integration?.auto_sync_interval_seconds || 3600));
      setLastSyncedAt(integration?.last_synced_at || null);
      setLastAutoSyncAt(integration?.last_auto_sync_at || null);
    } catch (err: any) {
      toast({
        title: 'Failed to load BambooHR integration',
        description: err.message || 'Please refresh and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  const savePreferences = async (nextEnabled: boolean, nextInterval: string) => {
    setSavingPreferences(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-bamboohr-hiring', {
        body: {
          action: 'update_preferences',
          company_id: company.id,
          auto_sync_enabled: nextEnabled,
          auto_sync_interval_seconds: Number(nextInterval),
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to update preferences');

      setAutoSyncEnabled(nextEnabled);
      setAutoSyncIntervalSeconds(nextInterval);

      toast({
        title: 'Auto-sync preferences updated',
        description: 'Your BambooHR auto-sync settings were saved.',
      });
    } catch (err: any) {
      toast({
        title: 'Could not save preferences',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleGenerateBambooAuthorizeUrl = async () => {
    if (!bambooCompanyDomain.trim()) {
      toast({
        title: 'Bamboo company domain required',
        description: 'Enter the BambooHR company domain (for example: acme if acme.bamboohr.com).',
        variant: 'destructive',
      });
      return;
    }

    if (!bambooRedirectUri.trim()) {
      toast({
        title: 'Redirect URI required',
        description: 'Enter the same Redirect URI configured in the BambooHR developer portal.',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingAuthUrl(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-bamboohr-hiring', {
        body: {
          action: 'authorize_url',
          company_id: company.id,
          company_domain: bambooCompanyDomain,
          redirect_uri: bambooRedirectUri,
        },
      });

      if (error) throw error;
      if (!data?.authorizeUrl) throw new Error('Failed to generate authorization URL');

      setBambooAuthorizeUrl(data.authorizeUrl);
      toast({
        title: 'Authorization URL ready',
        description: 'Open the URL, approve access in BambooHR, then paste the returned code below.',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to generate authorization URL',
        description: err.message || 'Please verify your BambooHR domain and try again.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingAuthUrl(false);
    }
  };

  const handleSyncBambooJobs = async (options?: { autoTrigger?: boolean; silent?: boolean }) => {
    setSyncingBamboo(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-bamboohr-hiring', {
        body: {
          action: 'sync_jobs',
          company_id: company.id,
          company_domain: bambooCompanyDomain || undefined,
          redirect_uri: bambooRedirectUri || undefined,
          code: bambooAuthCode || undefined,
          auto_trigger: options?.autoTrigger || false,
        },
      });

      if (error) throw error;

      if (data?.needsAuthorization) {
        if (data.authorizeUrl) {
          setBambooAuthorizeUrl(data.authorizeUrl);
        }
        if (!options?.silent) {
          toast({
            title: 'Authorization required',
            description: data.message || 'Authorize BambooHR first, then sync again with the returned code.',
          });
        }
        return;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'BambooHR sync failed');
      }

      setBambooAuthCode('');
      setSyncDialogOpen(false);
      await loadIntegrationStatus();
      if (!options?.silent) {
        toast({
          title: 'BambooHR sync complete',
          description: data.message || 'Two-way sync completed between RCF and BambooHR.',
        });
      }
    } catch (err: any) {
      if (!options?.silent) {
        toast({
          title: 'BambooHR sync failed',
          description: err.message || 'Please check your connection details and try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setSyncingBamboo(false);
    }
  };

  const handleRunSyncClick = () => {
    void handleSyncBambooJobs();
  };

  useEffect(() => {
    loadIntegrationStatus();
  }, []);

  useEffect(() => {
    if (!isConnected || !autoSyncEnabled || syncingBamboo) return;

    const intervalSeconds = Number(autoSyncIntervalSeconds || '3600');
    if (!Number.isFinite(intervalSeconds) || intervalSeconds < 6) return;

    const tick = async () => {
      const lastRunTime = lastAutoSyncAt ? new Date(lastAutoSyncAt).getTime() : 0;
      const now = Date.now();
      if (lastRunTime && now - lastRunTime < intervalSeconds * 1000) return;

      await handleSyncBambooJobs({ autoTrigger: true, silent: true });
    };

    void tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [isConnected, autoSyncEnabled, autoSyncIntervalSeconds, lastAutoSyncAt, syncingBamboo]);

  if (!isHROrAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Only company admins and HR users can manage ATS integrations.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-md border bg-white p-2">
              <svg
                width="110"
                viewBox="0 0 546 136"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="BambooHR logo"
                className="h-auto w-[110px]"
              >
                <g>
                  <path fill="#599D15" d="M103.75,54.99c-8.52,0-13.08,2.92-16.28,6.1l-0.87,0.92l0-29.51h-7.36v47.67c0,14.37,11.07,23.33,23.77,23.33
                  c13.99,0,24.59-10.77,24.59-24.61C127.6,66.04,116.55,54.99,103.75,54.99z M103.01,96.68c-9.27,0-17.12-7.31-17.12-17.1
                  c0-9.8,6.61-17.84,17.28-17.84c10.67,0,16.95,8.63,16.95,17.66C120.13,89.23,113.48,96.68,103.01,96.68z" />
                  <path fill="#599D15" d="M172.36,63.06h-0.1c-3.13-3.69-7.95-8.04-16.19-8.04c-13.54,0-23.77,10.12-23.77,24.14
                  c0,14.77,10.99,24.34,23.29,24.34c7.67,0,13.26-3.69,16.57-7.67h0.19v6.06h7.48V56.53h-7.48V63.06z M156.17,96.69
                  c-11.06,0-16.4-8.91-16.4-17.53c0-8.62,5.34-17.43,16.59-17.43c8.81,0,16.02,7.03,16.02,17.71
                  C172.38,89.56,164.6,96.69,156.17,96.69z" />
                  <path fill="#599D15" d="M238.51,55.02c-7.86,0-13.35,4.83-15.62,9.37c-1.9-5.3-7.67-9.37-14.77-9.37c-5.87,0-10.51,3.13-13.54,7.19
                  h-0.19v-5.68h-7.49v45.36h7.49V76.7c0-9.47,4.83-14.96,12.4-14.96c6.72,0,10.79,5.68,10.79,13.16v26.99h7.58V76.7
                  c0-10.42,5.97-14.96,12.31-14.96c7.67,0,10.89,6.15,10.89,13.16v26.99h7.48V75.47C255.84,62.12,248.74,55.02,238.51,55.02z" />
                  <path fill="#599D15" d="M339.03,55.02c-13.64,0-24.24,10.12-24.24,24.14c0,13.73,10.51,24.34,24.24,24.34
                  c14.01,0,24.24-10.98,24.24-24.34C363.27,65.43,353.14,55.02,339.03,55.02z M339.03,96.68c-8.71,0-16.48-7.29-16.48-17.52
                  c0-10.04,6.82-17.42,16.48-17.42c9.94,0,16.47,7.86,16.47,17.42C355.51,89.1,348.59,96.68,339.03,96.68z" />
                  <path fill="#599D15" d="M286.24,54.99c-8.52,0-13.08,2.92-16.28,6.1l-0.87,0.92l0-25.96h-7.36v44.12c0,14.37,11.07,23.33,23.77,23.33
                  c13.99,0,24.59-10.77,24.59-24.61C310.08,66.04,299.03,54.99,286.24,54.99z M285.5,96.68c-9.27,0-17.12-7.31-17.12-17.1
                  c0-9.8,6.61-17.84,17.28-17.84c10.67,0,16.95,8.63,16.95,17.66C302.62,89.23,295.97,96.68,285.5,96.68z" />
                  <polygon fill="#599D15" points="451.4,75.89 427.28,75.89 427.28,56.53 421.76,56.53 421.76,101.89 427.28,101.89 427.28,80.94 451.4,80.94 451.4,101.89 456.92,101.89 456.92,56.53 451.4,56.53" />
                  <path fill="#599D15" d="M493.63,69.83c0-6.25-4.06-13.3-15.36-13.3h-13.11v45.36h5.52V82.94h6.06l13.69,18.95h6.99l-14.3-19.49
                  C488.84,81.27,493.63,76.28,493.63,69.83z M470.68,77.88V61.59h8.18c5.86,0,9.05,2.93,9.05,8.25c0,4.39-2.99,8.05-8.99,8.05H470.68
                  z" />
                  <path fill="#599D15" d="M507.26,58.2c-0.28-0.64-0.66-1.2-1.15-1.67c-0.48-0.47-1.04-0.84-1.68-1.11c-0.64-0.27-1.33-0.4-2.05-0.4
                  c-0.73,0-1.41,0.13-2.06,0.4c-0.65,0.27-1.21,0.64-1.7,1.11c-0.49,0.47-0.87,1.03-1.15,1.67c-0.28,0.64-0.42,1.34-0.42,2.08
                  c0,0.76,0.14,1.47,0.42,2.12c0.28,0.65,0.67,1.21,1.15,1.68c0.49,0.48,1.05,0.85,1.7,1.11c0.65,0.26,1.33,0.4,2.06,0.4
                  c0.73,0,1.41-0.13,2.05-0.4c0.64-0.26,1.2-0.63,1.68-1.11c0.48-0.48,0.86-1.04,1.15-1.68c0.28-0.65,0.42-1.35,0.42-2.12
                  C507.69,59.54,507.55,58.85,507.26,58.2z M506.39,62.09c-0.22,0.55-0.53,1.03-0.92,1.44c-0.39,0.4-0.85,0.72-1.38,0.96
                  c-0.53,0.23-1.1,0.35-1.71,0.35c-0.62,0-1.2-0.12-1.73-0.35c-0.53-0.23-1-0.55-1.39-0.96c-0.39-0.41-0.7-0.88-0.92-1.44
                  c-0.22-0.55-0.33-1.15-0.33-1.8c0-0.63,0.11-1.22,0.33-1.77c0.22-0.55,0.53-1.02,0.92-1.42c0.39-0.4,0.85-0.72,1.39-0.95
                  c0.53-0.23,1.11-0.35,1.73-0.35c0.61,0,1.18,0.11,1.71,0.35c0.53,0.23,0.99,0.55,1.38,0.95c0.39,0.4,0.7,0.88,0.92,1.42
                  c0.22,0.55,0.33,1.14,0.33,1.77C506.73,60.94,506.62,61.54,506.39,62.09z" />
                  <path fill="#599D15" d="M504.4,60.21c0.31-0.26,0.47-0.67,0.47-1.22c0-0.59-0.18-1.04-0.53-1.33c-0.35-0.29-0.9-0.44-1.63-0.44h-2.39
                  v6.19h0.96v-2.66h1.02l1.68,2.66h1.03l-1.77-2.73C503.71,60.62,504.09,60.47,504.4,60.21z M502.28,59.96h-1.01v-1.97h1.27
                  c0.16,0,0.32,0.01,0.49,0.04c0.17,0.02,0.31,0.07,0.44,0.13c0.13,0.07,0.23,0.16,0.31,0.28c0.08,0.12,0.12,0.29,0.12,0.49
                  c0,0.25-0.04,0.44-0.13,0.57c-0.09,0.14-0.21,0.24-0.36,0.3c-0.15,0.07-0.32,0.11-0.52,0.12C502.7,59.95,502.5,59.96,502.28,59.96z" />
                  <path fill="#599D15" d="M392.22,55.02c-13.64,0-24.24,10.12-24.24,24.14c0,13.73,10.51,24.34,24.24,24.34
                  c14.01,0,24.24-10.98,24.24-24.34C416.46,65.43,406.33,55.02,392.22,55.02z M392.22,96.68c-8.71,0-16.48-7.29-16.48-17.52
                  c0-10.04,6.82-17.42,16.48-17.42c9.94,0,16.47,7.86,16.47,17.42C408.7,89.1,401.78,96.68,392.22,96.68z" />
                  <path fill="#599D15" d="M55.89,32.5c-0.06-0.02-0.09,0.05-0.05,0.1c7.55,8.52,13.02,18.83,15.76,25.44
                  c-3.46-3.71-6.76-7.57-10.46-10.14c-7.5-5.23-15.42-7.82-22.76-8.8c-0.06-0.01-0.09,0.07-0.04,0.11
                  c17.98,14.42,13.79,21.96,37.26,24.94c0.04,0.01,0.08-0.04,0.06-0.08c-3.47-10.69-4.6-18.62-10.49-24.92
                  C63.31,37.17,57.85,33.18,55.89,32.5z" />
                </g>
              </svg>
            </div>
            <div>
              <CardDescription>
                Run two-way sync between RoleColorFinder and BambooHR, and configure automatic sync frequency.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Connection status</p>
                <p className="text-xs text-muted-foreground">
                  {loadingStatus
                    ? 'Checking BambooHR connection...'
                    : isConnected
                    ? 'Connected and ready for two-way sync.'
                    : 'Not connected yet. Open Sync Now and complete OAuth once.'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={loadIntegrationStatus} disabled={loadingStatus}>
                {loadingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh Status
              </Button>
            </div>
            {lastSyncedAt && (
              <p className="mt-3 text-xs text-muted-foreground">
                Last sync: {new Date(lastSyncedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Automatic sync</p>
                <p className="text-xs text-muted-foreground">Choose how often background sync should run.</p>
              </div>
              <Switch
                checked={autoSyncEnabled}
                disabled={!isConnected || savingPreferences}
                onCheckedChange={(checked) => {
                  savePreferences(checked, autoSyncIntervalSeconds);
                }}
              />
            </div>

            <div className="mt-4 space-y-2">
              <Label>Sync frequency</Label>
              <Select
                value={autoSyncIntervalSeconds}
                disabled={!isConnected || savingPreferences}
                onValueChange={(value) => {
                  setAutoSyncIntervalSeconds(value);
                  savePreferences(autoSyncEnabled, value);
                }}
              >
                <SelectTrigger className="w-full md:w-[240px]">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {AUTO_SYNC_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Two-way BambooHR Sync</DialogTitle>
                  <DialogDescription>
                    Configure OAuth details if needed, then run an immediate sync between BambooHR and RoleColorFinder.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bambooDomain">BambooHR Company Domain</Label>
                      <Input
                        id="bambooDomain"
                        placeholder="acme"
                        value={bambooCompanyDomain}
                        onChange={(e) => setBambooCompanyDomain(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bambooRedirectUri">OAuth Redirect URI</Label>
                      <Input
                        id="bambooRedirectUri"
                        placeholder="https://yourapp.com/path"
                        value={bambooRedirectUri}
                        onChange={(e) => setBambooRedirectUri(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bambooCode">Authorization Code (first-time setup)</Label>
                    <Textarea
                      id="bambooCode"
                      placeholder="Paste the code returned in your redirect URL"
                      value={bambooAuthCode}
                      onChange={(e) => setBambooAuthCode(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={handleGenerateBambooAuthorizeUrl}
                      disabled={generatingAuthUrl}
                    >
                      {generatingAuthUrl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Generate Authorization URL
                    </Button>

                    {bambooAuthorizeUrl && (
                      <a href={bambooAuthorizeUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Authorization
                        </Button>
                      </a>
                    )}

                    <Button onClick={handleRunSyncClick} disabled={syncingBamboo}>
                      {syncingBamboo ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Run Sync
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
