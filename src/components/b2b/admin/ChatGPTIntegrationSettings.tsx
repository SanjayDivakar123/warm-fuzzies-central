import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  BUSINESS_CHATGPT_TOOLS,
  CHATGPT_LOGO_URL,
  SUPABASE_FUNCTIONS_BASE_URL,
  formatTimestamp,
  roleColorBadgeClass,
} from '@/lib/chatgptIntegration';
import { Bot, Brain, CheckCircle2, Loader2, RefreshCw, Sparkles, Unplug } from 'lucide-react';

interface ChatGPTIntegrationSettingsProps {
  company: { id: string; name?: string | null };
  onSettingsSaved?: () => void;
}

interface BusinessChatGPTState {
  connection: null | {
    id: string;
    org_id: string;
    connection_type: 'b2b';
    auto_inject_context: boolean;
    enabled_tools: string[];
    scopes_granted: string[];
    last_sync_at: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  company?: {
    id: string;
    name: string;
    subdomain: string | null;
  };
  admin?: {
    name: string;
    email: string | null;
    rolecolor: string | null;
    role_type: string | null;
  };
  stats?: {
    member_count: number;
    completed_count: number;
    completion_rate: number;
    pending_count: number;
    tool_calls_last_7_days: number;
  };
  tool_history?: Array<{
    id: string;
    tool_name: string;
    response_summary: string | null;
    latency_ms: number | null;
    is_error: boolean;
    occurred_at: string;
  }>;
}

const readFunctionErrorMessage = async (error: any, fallback: string) => {
  try {
    const payload = await error?.context?.json?.();
    if (payload?.error && typeof payload.error === 'string') {
      return payload.error;
    }
  } catch {
    // Ignore parse failures and use the fallback.
  }

  return error?.message || fallback;
};

export default function ChatGPTIntegrationSettings({
  company,
  onSettingsSaved,
}: ChatGPTIntegrationSettingsProps) {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [state, setState] = useState<BusinessChatGPTState>({ connection: null });
  const [autoInjectContext, setAutoInjectContext] = useState(true);
  const [enabledTools, setEnabledTools] = useState<string[]>([]);

  const weeklySummary = useMemo(() => {
    const count = state.stats?.tool_calls_last_7_days || 0;
    return count === 1 ? 'ChatGPT asked about your team once this week' : `ChatGPT asked about your team ${count} times this week`;
  }, [state.stats?.tool_calls_last_7_days]);

  const fetchState = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chatgpt-manage', {
        body: {
          mode: 'b2b',
          action: 'get',
          orgId: company.id,
        },
      });

      if (error) throw error;

      const nextState = (data || { connection: null }) as BusinessChatGPTState;
      setState(nextState);
      setAutoInjectContext(nextState.connection?.auto_inject_context ?? true);
      setEnabledTools(nextState.connection?.enabled_tools || BUSINESS_CHATGPT_TOOLS.map((tool) => tool.key));
    } catch (error: any) {
      const message = await readFunctionErrorMessage(error, 'Could not load the ChatGPT integration.');
      toast({
        title: 'ChatGPT integration unavailable',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchState();
  }, [company.id]);

  useEffect(() => {
    if (searchParams.get('chatgpt') === 'connected') {
      toast({
        title: 'ChatGPT connected',
        description: 'RoleColorFinder is ready to share team context with ChatGPT.',
      });
      const next = new URLSearchParams(searchParams);
      next.delete('chatgpt');
      setSearchParams(next, { replace: true });
      void fetchState();
      onSettingsSaved?.();
    }
  }, [onSettingsSaved, searchParams, setSearchParams, toast]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Your session expired. Please sign in again and retry.');
      }

      const oauthUrl = new URL(`${SUPABASE_FUNCTIONS_BASE_URL}/chatgpt-oauth-init`);
      oauthUrl.searchParams.set('type', 'b2b');
      oauthUrl.searchParams.set('orgId', company.id);
      oauthUrl.searchParams.set('access_token', session.access_token);
      window.location.assign(oauthUrl.toString());
    } catch (error: any) {
      toast({
        title: 'Could not connect ChatGPT',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      setConnecting(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!state.connection) return;

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('chatgpt-manage', {
        body: {
          mode: 'b2b',
          action: 'update_settings',
          orgId: company.id,
          auto_inject_context: autoInjectContext,
          enabled_tools: enabledTools,
        },
      });

      if (error) throw error;

      setState(data as BusinessChatGPTState);
      toast({
        title: 'ChatGPT settings saved',
        description: 'Your Business ChatGPT settings were updated.',
      });
      onSettingsSaved?.();
    } catch (error: any) {
      const message = await readFunctionErrorMessage(error, 'Could not save ChatGPT settings.');
      toast({
        title: 'Save failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!state.connection) return;

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('chatgpt-manage', {
        body: {
          mode: 'b2b',
          action: 'sync',
          orgId: company.id,
        },
      });

      if (error) throw error;

      setState(data as BusinessChatGPTState);
      toast({
        title: 'ChatGPT context refreshed',
        description: 'The latest team RoleColor snapshot is ready for ChatGPT.',
      });
    } catch (error: any) {
      const message = await readFunctionErrorMessage(error, 'Could not refresh the ChatGPT context.');
      toast({
        title: 'Sync failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!state.connection) return;

    setDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke('chatgpt-manage', {
        body: {
          mode: 'b2b',
          action: 'disconnect',
          orgId: company.id,
        },
      });

      if (error) throw error;

      setState({ connection: null });
      setManageOpen(false);
      toast({
        title: 'ChatGPT disconnected',
        description: 'This company no longer shares team context with ChatGPT.',
      });
      onSettingsSaved?.();
    } catch (error: any) {
      const message = await readFunctionErrorMessage(error, 'Could not disconnect ChatGPT.');
      toast({
        title: 'Disconnect failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const toggleTool = (toolKey: string, checked: boolean) => {
    setEnabledTools((current) => {
      if (checked) {
        return current.includes(toolKey) ? current : [...current, toolKey];
      }

      return current.filter((value) => value !== toolKey);
    });
  };

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white/90 p-2 shadow-sm">
                <img src={CHATGPT_LOGO_URL} alt="ChatGPT logo" className="h-6 w-6 object-contain" loading="lazy" />
              </div>
              <div>
                <CardTitle className="text-base font-medium">ChatGPT</CardTitle>
                <CardDescription>Give ChatGPT full awareness of your team&apos;s RoleColor profiles</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">AI</Badge>
              {state.connection ? (
                <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline">Not Connected</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading ChatGPT integration...
            </div>
          ) : state.connection ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Company</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{state.company?.name || company.name || 'Business Portal'}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Members</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {state.stats?.member_count || 0} rostered • {state.stats?.completion_rate || 0}% complete
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Last Sync</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{formatTimestamp(state.connection.last_sync_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Brain className="h-4 w-4" />
                {weeklySummary}
              </div>

              <div className="flex flex-wrap gap-2">
                {state.admin?.rolecolor ? (
                  <Badge variant="outline" className={roleColorBadgeClass(state.admin.rolecolor)}>
                    {state.admin.rolecolor} {state.admin.role_type}
                  </Badge>
                ) : null}
                <Badge variant="outline">{enabledTools.length} tools enabled</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => setManageOpen(true)}>
                  <Bot className="mr-2 h-4 w-4" />
                  Manage
                </Button>
                <Button variant="outline" onClick={() => void handleSync()} disabled={syncing}>
                  {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Sync now
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>When connected, ChatGPT can coach hiring, communication, conflict, and team balance with live RoleColor context.</p>
                <p>Admins control tool access, team-context injection, and sync timing from the manage modal.</p>
              </div>
              <Button onClick={() => void handleConnect()} disabled={connecting}>
                {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Connect ChatGPT
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>ChatGPT Integration</DialogTitle>
            <DialogDescription>
              Manage the team context and tool access that RoleColorFinder shares with ChatGPT.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[72vh] pr-4">
            <div className="space-y-6 pb-2">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Team Stats</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{state.stats?.member_count || 0}</p>
                  <p className="text-sm text-muted-foreground">members connected</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Completion</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{state.stats?.completion_rate || 0}%</p>
                  <p className="text-sm text-muted-foreground">{state.stats?.pending_count || 0} still pending</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tool History</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{state.stats?.tool_calls_last_7_days || 0}</p>
                  <p className="text-sm text-muted-foreground">calls in the last 7 days</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Auto-inject team context</p>
                    <p className="text-sm text-muted-foreground">
                      Add the admin profile, team balance, and available tool context to ChatGPT conversations automatically.
                    </p>
                  </div>
                  <Switch checked={autoInjectContext} onCheckedChange={setAutoInjectContext} />
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Enabled tools</p>
                    <p className="text-sm text-muted-foreground">
                      Control which RoleColorFinder tools ChatGPT can call for this company.
                    </p>
                  </div>
                  <Badge variant="outline">{enabledTools.length} active</Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {BUSINESS_CHATGPT_TOOLS.map((tool) => (
                    <div
                      key={tool.key}
                      className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{tool.label}</p>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </div>
                      <Switch
                        checked={enabledTools.includes(tool.key)}
                        onCheckedChange={(checked) => toggleTool(tool.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Recent tool activity</p>
                    <p className="text-sm text-muted-foreground">
                      See which RoleColorFinder tools ChatGPT has used recently.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void handleSync()} disabled={syncing}>
                    {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Sync now
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {state.tool_history?.length ? (
                    state.tool_history.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{entry.tool_name}</Badge>
                          {entry.is_error ? (
                            <Badge variant="destructive">Error</Badge>
                          ) : (
                            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                              Success
                            </Badge>
                          )}
                          {entry.latency_ms ? <span className="text-xs text-muted-foreground">{entry.latency_ms}ms</span> : null}
                        </div>
                        {entry.response_summary ? (
                          <p className="mt-2 text-sm text-muted-foreground">{entry.response_summary}</p>
                        ) : null}
                        <p className="mt-2 text-xs text-muted-foreground">{formatTimestamp(entry.occurred_at)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                      ChatGPT has not called any RoleColorFinder tools for this company yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                <Button variant="destructive" onClick={() => void handleDisconnect()} disabled={disconnecting}>
                  {disconnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unplug className="mr-2 h-4 w-4" />}
                  Disconnect
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setManageOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => void handleSaveSettings()} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Save settings
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
