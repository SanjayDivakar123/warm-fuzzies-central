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
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  CHATGPT_LOGO_URL,
  PERSONAL_CHATGPT_TOOLS,
  SUPABASE_FUNCTIONS_BASE_URL,
  formatTimestamp,
  roleColorBadgeClass,
} from '@/lib/chatgptIntegration';
import { Bot, CheckCircle2, Loader2, RefreshCw, Sparkles, Unplug } from 'lucide-react';

interface PersonalChatGPTIntegrationCardProps {
  userEmail?: string | null;
}

interface PersonalChatGPTState {
  connection: null | {
    id: string;
    user_id: string;
    connection_type: 'personal';
    share_profile: boolean;
    include_teammates: boolean;
    enabled_tools: string[];
    scopes_granted: string[];
    last_sync_at: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  profile: null | {
    name: string;
    rolecolor: string;
    role_type: string;
    color_hex: string;
    summary: string;
    strengths: string[];
    blind_spots: string[];
    works_best_with: string[];
    communication_tips: string[];
  };
  teammates?: Array<{
    name: string;
    email: string;
    rolecolor: string | null;
    role_type: string | null;
    job_title: string | null;
  }>;
  stats?: {
    teammate_count: number;
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
    // Ignore parse failures.
  }

  return error?.message || fallback;
};

export default function PersonalChatGPTIntegrationCard({ userEmail }: PersonalChatGPTIntegrationCardProps) {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [state, setState] = useState<PersonalChatGPTState>({ connection: null, profile: null });
  const [shareProfile, setShareProfile] = useState(true);
  const [includeTeammates, setIncludeTeammates] = useState(false);

  const weeklySummary = useMemo(() => {
    const count = state.stats?.tool_calls_last_7_days || 0;
    return count === 1 ? 'ChatGPT used your RoleColor context once this week' : `ChatGPT used your RoleColor context ${count} times this week`;
  }, [state.stats?.tool_calls_last_7_days]);

  const fetchState = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chatgpt-manage', {
        body: {
          mode: 'personal',
          action: 'get',
        },
      });

      if (error) throw error;

      const nextState = (data || { connection: null, profile: null }) as PersonalChatGPTState;
      setState(nextState);
      setShareProfile(nextState.connection?.share_profile ?? true);
      setIncludeTeammates(nextState.connection?.include_teammates ?? false);
    } catch (error: any) {
      const message = await readFunctionErrorMessage(error, 'Could not load your ChatGPT integration.');
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
  }, []);

  useEffect(() => {
    if (searchParams.get('chatgpt') === 'connected') {
      toast({
        title: 'ChatGPT connected',
        description: 'ChatGPT can now personalize responses with your RoleColor profile.',
      });
      const next = new URLSearchParams(searchParams);
      next.delete('chatgpt');
      setSearchParams(next, { replace: true });
      void fetchState();
    }
  }, [searchParams, setSearchParams, toast]);

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
      oauthUrl.searchParams.set('type', 'personal');
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

  const handleSave = async () => {
    if (!state.connection) return;

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('chatgpt-manage', {
        body: {
          mode: 'personal',
          action: 'update_settings',
          share_profile: shareProfile,
          include_teammates: includeTeammates,
          enabled_tools: PERSONAL_CHATGPT_TOOLS.map((tool) => tool.key),
        },
      });

      if (error) throw error;

      setState(data as PersonalChatGPTState);
      toast({
        title: 'ChatGPT settings saved',
        description: 'Your personal ChatGPT preferences were updated.',
      });
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
          mode: 'personal',
          action: 'sync',
        },
      });

      if (error) throw error;

      setState(data as PersonalChatGPTState);
      toast({
        title: 'ChatGPT context refreshed',
        description: 'Your latest RoleColor context is ready for ChatGPT.',
      });
    } catch (error: any) {
      const message = await readFunctionErrorMessage(error, 'Could not refresh your ChatGPT context.');
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
          mode: 'personal',
          action: 'disconnect',
        },
      });

      if (error) throw error;

      setState({ connection: null, profile: null });
      setManageOpen(false);
      toast({
        title: 'ChatGPT disconnected',
        description: 'ChatGPT will stop using your RoleColorFinder profile.',
      });
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
                <CardDescription>Let ChatGPT personalize responses based on your RoleColor</CardDescription>
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
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Profile</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{state.profile?.name || userEmail || 'Your profile'}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">RoleColor</p>
                  <div className="mt-1">
                    {state.profile?.rolecolor ? (
                      <Badge variant="outline" className={roleColorBadgeClass(state.profile.rolecolor)}>
                        {state.profile.rolecolor} {state.profile.role_type}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Assessment needed</span>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Last Sync</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{formatTimestamp(state.connection.last_sync_at)}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{weeklySummary}</p>

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
                <p>When connected, ChatGPT can tailor advice to your RoleColor and, if you opt in, the teammates you work with most often.</p>
                <p>Keep your profile private until you&apos;re ready, then switch sharing on from the manage modal.</p>
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
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Personal ChatGPT Integration</DialogTitle>
            <DialogDescription>
              Control how much of your RoleColorFinder profile ChatGPT can use in personal conversations.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[72vh] pr-4">
            <div className="space-y-6 pb-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">RoleColor</p>
                  <div className="mt-2">
                    {state.profile?.rolecolor ? (
                      <Badge variant="outline" className={roleColorBadgeClass(state.profile.rolecolor)}>
                        {state.profile.rolecolor} {state.profile.role_type}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No completed assessment yet</span>
                    )}
                  </div>
                  {state.profile?.summary ? (
                    <p className="mt-3 text-sm text-muted-foreground">{state.profile.summary}</p>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Usage</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{state.stats?.tool_calls_last_7_days || 0}</p>
                  <p className="text-sm text-muted-foreground">tool calls in the last 7 days</p>
                  <p className="mt-4 text-sm text-muted-foreground">{state.stats?.teammate_count || 0} teammate profiles available</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Share my profile with ChatGPT</p>
                    <p className="text-sm text-muted-foreground">
                      Let ChatGPT use your RoleColor profile to personalize answers.
                    </p>
                  </div>
                  <Switch checked={shareProfile} onCheckedChange={setShareProfile} />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Include my teammates&apos; profiles</p>
                    <p className="text-sm text-muted-foreground">
                      Opt in to sharing direct teammate RoleColor context so ChatGPT can give better collaboration advice.
                    </p>
                  </div>
                  <Switch checked={includeTeammates} onCheckedChange={setIncludeTeammates} />
                </div>
              </div>

              {includeTeammates && state.teammates?.length ? (
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">Shared teammates</p>
                  <div className="mt-4 space-y-3">
                    {state.teammates.map((teammate) => (
                      <div key={teammate.email} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{teammate.name}</p>
                          {teammate.rolecolor ? (
                            <Badge variant="outline" className={roleColorBadgeClass(teammate.rolecolor)}>
                              {teammate.rolecolor} {teammate.role_type}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No RoleColor yet</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {teammate.job_title || 'Team member'} • {teammate.email}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="text-sm font-semibold text-foreground">Enabled tools</p>
                <div className="mt-4 space-y-3">
                  {PERSONAL_CHATGPT_TOOLS.map((tool) => (
                    <div key={tool.key} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <p className="text-sm font-medium text-foreground">{tool.label}</p>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                  ))}
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
                  <Button onClick={() => void handleSave()} disabled={saving}>
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
