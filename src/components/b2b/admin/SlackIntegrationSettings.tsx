import { useEffect, useRef, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Link2,
  Loader2,
  MessageSquare,
  ShieldAlert,
  Unplug,
  UserRound,
} from 'lucide-react';

interface SlackIntegrationSettingsProps {
  company: { id: string };
  companyUser?: { id: string; role: string } | null;
  onSettingsSaved?: () => void;
}

interface SlackConnectionSummary {
  id: string;
  org_id: string;
  team_id: string;
  team_name: string;
  authed_user_id: string | null;
  incoming_webhook_channel: string | null;
  connected_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SlackAdminConnectionState {
  id: string;
  org_id: string;
  team_id: string;
  team_name: string;
  authed_user_id: string | null;
  incoming_webhook_channel: string | null;
  connected_at: string;
  is_active: boolean;
  auto_add_users: boolean;
  email_mismatch_action: 'confirm' | 'ignore' | 'auto_create';
  name_matching_enabled: boolean;
  admin_notify_on_new_user: boolean;
  admin_notify_channel: string | null;
}

interface SlackPendingConfirmationSummary {
  id: string;
  confirmation_token: string;
  slack_user_id: string;
  slack_email: string | null;
  slack_display_name: string | null;
  slack_real_name: string | null;
  slack_title: string | null;
  slack_avatar_url: string | null;
  matched_rcf_user_id: string | null;
  matched_rcf_name: string | null;
  matched_rcf_role: string | null;
  matched_rcf_color: string | null;
  matchedRoleColorLabel: string | null;
  match_type: 'exact_email' | 'fuzzy_name' | 'none' | null;
  match_confidence: number | null;
  matchBadgeLabel: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'rejected'
    | 'expired'
    | 'ignored'
    | 'auto_created'
    | 'admin_approved'
    | 'admin_rejected';
  dm_sent_at: string | null;
  responded_at: string | null;
  expires_at: string;
  created_at: string;
}

interface SlackChannelOption {
  id: string;
  name: string;
}

interface SlackCompanyUserSummary {
  id: string;
  email: string;
  full_name: string | null;
  job_role: string | null;
  role: string;
  status: string | null;
  slack_user_id: string | null;
  slack_linked_at: string | null;
  role_color: string | null;
}

interface SlackWorkspaceUserSummary {
  slack_user_id: string;
  email: string | null;
  display_name: string | null;
  real_name: string | null;
  title: string | null;
  avatar_url: string | null;
  linked_company_user_id: string | null;
  linked_company_user_name: string | null;
  linked_company_user_email: string | null;
  linked_company_user_role: string | null;
  linked_company_user_role_color: string | null;
  linked_at: string | null;
}

interface SlackAdminSettingsState {
  auto_add_users: boolean;
  email_mismatch_action: 'confirm' | 'ignore' | 'auto_create';
  name_matching_enabled: boolean;
  admin_notify_on_new_user: boolean;
  admin_notify_channel: string | null;
}

const SLACK_LOGO_URL = 'https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png';
const SUPABASE_FUNCTIONS_BASE_URL = `${
  import.meta.env.VITE_SUPABASE_URL || 'https://qbuxoetprodjxpagfkoi.supabase.co'
}/functions/v1`;
const DEFAULT_SLACK_SETTINGS: SlackAdminSettingsState = {
  auto_add_users: false,
  email_mismatch_action: 'confirm',
  name_matching_enabled: false,
  admin_notify_on_new_user: true,
  admin_notify_channel: null,
};
const SUPPORTED_SLACK_COMMANDS = [
  {
    command: '/rcf',
    description: 'Open quick actions and Slack help.',
  },
  {
    command: '/rcf help',
    description: 'Show the full RoleColorFinder command list.',
  },
  {
    command: '/rolecolor [email|@handle|@mention]',
    description: 'Look up a teammate’s RoleColor and working style.',
  },
  {
    command: '/teambalance',
    description: 'See the team’s color mix and hiring insight.',
  },
];

const readFunctionErrorMessage = async (error: any, fallback: string) => {
  try {
    const payload = await error?.context?.json?.();
    if (payload?.error && typeof payload.error === 'string') {
      return payload.error;
    }
    if (payload?.message && typeof payload.message === 'string') {
      return payload.message;
    }
  } catch {
    // Ignore parse errors and fall through.
  }

  return error?.message || fallback;
};

const formatRelativeTimestamp = (value: string | null) => {
  if (!value) {
    return 'just now';
  }

  const targetDate = new Date(value);
  const deltaSeconds = Math.round((targetDate.getTime() - Date.now()) / 1000);

  if (!Number.isFinite(deltaSeconds)) {
    return new Date(value).toLocaleString();
  }

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const absoluteSeconds = Math.abs(deltaSeconds);

  if (absoluteSeconds < 60) {
    return formatter.format(deltaSeconds, 'second');
  }

  const deltaMinutes = Math.round(deltaSeconds / 60);
  if (Math.abs(deltaMinutes) < 60) {
    return formatter.format(deltaMinutes, 'minute');
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 24) {
    return formatter.format(deltaHours, 'hour');
  }

  const deltaDays = Math.round(deltaHours / 24);
  return formatter.format(deltaDays, 'day');
};

const roleColorBadgeClass = (color: string | null) => {
  switch (color?.toLowerCase()) {
    case 'red':
      return 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300';
    case 'yellow':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200';
    case 'green':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200';
    case 'blue':
      return 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-200';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
};

const normalizeTextValue = (value: string | null | undefined) => value?.trim().toLowerCase() || '';

const normalizeNameValue = (value: string | null | undefined) =>
  normalizeTextValue(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenizeNameValue = (value: string | null | undefined) =>
  normalizeNameValue(value)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean);

const emailLocalPart = (email: string | null | undefined) => normalizeTextValue(email).split('@')[0] || '';

const diceCoefficient = (left: string, right: string) => {
  if (!left || !right) {
    return 0;
  }

  if (left === right) {
    return 1;
  }

  if (left.length < 2 || right.length < 2) {
    return left === right ? 1 : 0;
  }

  const bigrams = new Map<string, number>();
  for (let index = 0; index < left.length - 1; index += 1) {
    const chunk = left.slice(index, index + 2);
    bigrams.set(chunk, (bigrams.get(chunk) || 0) + 1);
  }

  let intersections = 0;
  for (let index = 0; index < right.length - 1; index += 1) {
    const chunk = right.slice(index, index + 2);
    const count = bigrams.get(chunk) || 0;
    if (count > 0) {
      bigrams.set(chunk, count - 1);
      intersections += 1;
    }
  }

  return (2 * intersections) / (left.length + right.length - 2);
};

const scoreSlackCompanyUserMatch = (
  workspaceUser: SlackWorkspaceUserSummary,
  companyUser: SlackCompanyUserSummary,
) => {
  const slackEmail = normalizeTextValue(workspaceUser.email);
  const companyEmail = normalizeTextValue(companyUser.email);
  const slackName = normalizeNameValue(workspaceUser.real_name || workspaceUser.display_name);
  const companyName = normalizeNameValue(companyUser.full_name || companyUser.email);
  const slackTokens = tokenizeNameValue(workspaceUser.real_name || workspaceUser.display_name);
  const companyTokens = tokenizeNameValue(companyUser.full_name || companyUser.email);
  const overlappingTokens = slackTokens.filter((token) => companyTokens.includes(token)).length;

  if (slackEmail && companyEmail && slackEmail === companyEmail) {
    return 100;
  }

  if (
    slackEmail &&
    companyEmail &&
    emailLocalPart(slackEmail) &&
    emailLocalPart(slackEmail) === emailLocalPart(companyEmail)
  ) {
    return 96;
  }

  if (slackName && companyName && slackName === companyName) {
    return 95;
  }

  if (
    slackTokens.length >= 2 &&
    companyTokens.length >= 2 &&
    overlappingTokens >= Math.min(slackTokens.length, companyTokens.length)
  ) {
    return 92;
  }

  const similarity = Math.max(
    diceCoefficient(slackName.replace(/\s/g, ''), companyName.replace(/\s/g, '')),
    diceCoefficient(emailLocalPart(slackEmail), emailLocalPart(companyEmail)),
  );

  if (similarity >= 0.93) {
    return 90;
  }
  if (similarity >= 0.88) {
    return 86;
  }
  if (similarity >= 0.82 && overlappingTokens > 0) {
    return 82;
  }

  return 0;
};

const findSuggestedCompanyUser = (
  workspaceUser: SlackWorkspaceUserSummary,
  companyUsers: SlackCompanyUserSummary[],
) => {
  if (workspaceUser.linked_company_user_id) {
    return {
      companyUser: companyUsers.find((user) => user.id === workspaceUser.linked_company_user_id) || null,
      confidence: 100,
    };
  }

  let bestMatch: SlackCompanyUserSummary | null = null;
  let bestScore = 0;
  let secondBestScore = 0;

  for (const companyUser of companyUsers) {
    const score = scoreSlackCompanyUserMatch(workspaceUser, companyUser);
    if (score > bestScore) {
      secondBestScore = bestScore;
      bestScore = score;
      bestMatch = companyUser;
    } else if (score > secondBestScore) {
      secondBestScore = score;
    }
  }

  if (!bestMatch || bestScore < 82 || bestScore - secondBestScore < 4) {
    return {
      companyUser: null,
      confidence: 0,
    };
  }

  return {
    companyUser: bestMatch,
    confidence: bestScore,
  };
};

export default function SlackIntegrationSettings({
  company,
  companyUser,
  onSettingsSaved,
}: SlackIntegrationSettingsProps) {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isHROrAdmin = companyUser?.role === 'admin' || companyUser?.role === 'hr';

  const [slackConnection, setSlackConnection] = useState<SlackConnectionSummary | null>(null);
  const [slackConnecting, setSlackConnecting] = useState(false);
  const [slackSendingTest, setSlackSendingTest] = useState(false);
  const [slackDisconnecting, setSlackDisconnecting] = useState(false);
  const [slackManageOpen, setSlackManageOpen] = useState(false);
  const [slackManageTab, setSlackManageTab] = useState<'overview' | 'settings' | 'mapping'>('overview');
  const [slackAdminStateLoading, setSlackAdminStateLoading] = useState(false);
  const [slackAdminConnection, setSlackAdminConnection] = useState<SlackAdminConnectionState | null>(null);
  const [slackSettingsState, setSlackSettingsState] = useState<SlackAdminSettingsState>(DEFAULT_SLACK_SETTINGS);
  const [slackSettingsSaving, setSlackSettingsSaving] = useState(false);
  const [slackPendingConfirmations, setSlackPendingConfirmations] = useState<SlackPendingConfirmationSummary[]>([]);
  const [slackAvailableChannels, setSlackAvailableChannels] = useState<SlackChannelOption[]>([]);
  const [slackCompanyUsers, setSlackCompanyUsers] = useState<SlackCompanyUserSummary[]>([]);
  const [slackWorkspaceUsers, setSlackWorkspaceUsers] = useState<SlackWorkspaceUserSummary[]>([]);
  const [slackMappingDrafts, setSlackMappingDrafts] = useState<Record<string, string>>({});
  const [slackMappingSavingKey, setSlackMappingSavingKey] = useState<string | null>(null);
  const [slackPendingActionKey, setSlackPendingActionKey] = useState<string | null>(null);
  const slackAutoMappingAttemptRef = useRef<Record<string, string>>({});

  const loadSlackConnection = async () => {
    const { data, error } = await supabase
      .from('slack_connection_statuses' as any)
      .select('id, org_id, team_id, team_name, authed_user_id, incoming_webhook_channel, connected_at, is_active, created_at, updated_at')
      .eq('org_id', company.id)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    setSlackConnection((data as SlackConnectionSummary | null) ?? null);
  };

  const applySlackAdminState = (data: {
    connection?: SlackAdminConnectionState | null;
    pending_confirmations?: SlackPendingConfirmationSummary[];
    available_channels?: SlackChannelOption[];
    company_users?: SlackCompanyUserSummary[];
    workspace_users?: SlackWorkspaceUserSummary[];
  }) => {
    const nextConnection = data.connection || null;
    setSlackAdminConnection(nextConnection);
    setSlackPendingConfirmations((data.pending_confirmations || []) as SlackPendingConfirmationSummary[]);
    setSlackAvailableChannels((data.available_channels || []) as SlackChannelOption[]);
    setSlackCompanyUsers((data.company_users || []) as SlackCompanyUserSummary[]);
    setSlackWorkspaceUsers((data.workspace_users || []) as SlackWorkspaceUserSummary[]);
    setSlackMappingDrafts({});
    setSlackSettingsState(
      nextConnection
        ? {
            auto_add_users: nextConnection.auto_add_users,
            email_mismatch_action: nextConnection.email_mismatch_action,
            name_matching_enabled: nextConnection.name_matching_enabled,
            admin_notify_on_new_user: nextConnection.admin_notify_on_new_user,
            admin_notify_channel: nextConnection.admin_notify_channel,
          }
        : DEFAULT_SLACK_SETTINGS,
    );
  };

  const loadSlackAdminState = async () => {
    if (!slackConnection) {
      setSlackAdminConnection(null);
      setSlackPendingConfirmations([]);
      setSlackAvailableChannels([]);
      setSlackCompanyUsers([]);
      setSlackWorkspaceUsers([]);
      setSlackMappingDrafts({});
      setSlackSettingsState(DEFAULT_SLACK_SETTINGS);
      return;
    }

    setSlackAdminStateLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('slack-manage', {
        body: {
          action: 'get',
          orgId: company.id,
        },
      });

      if (error) {
        throw new Error(await readFunctionErrorMessage(error, 'Failed to load Slack settings'));
      }

      applySlackAdminState((data || {}) as any);
    } catch (error: any) {
      toast({
        title: 'Slack settings unavailable',
        description: error.message || 'We could not load the Slack onboarding settings.',
        variant: 'destructive',
      });
    } finally {
      setSlackAdminStateLoading(false);
    }
  };

  useEffect(() => {
    void loadSlackConnection().catch((error: Error) => {
      toast({
        title: 'Slack status unavailable',
        description: error.message || 'We could not load your Slack connection.',
        variant: 'destructive',
      });
    });
  }, [company.id]);

  useEffect(() => {
    const slackStatus = searchParams.get('slack');
    if (!slackStatus) {
      return;
    }

    if (slackStatus === 'connected') {
      toast({
        title: 'Slack connected',
        description: 'Your Slack workspace is ready for team digests, invites, and slash commands.',
      });
      void loadSlackConnection();
      onSettingsSaved?.();
    } else if (slackStatus === 'error') {
      toast({
        title: 'Slack connection failed',
        description: 'Slack OAuth could not be completed. Try connecting again in a moment.',
        variant: 'destructive',
      });
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('slack');
    setSearchParams(nextParams, { replace: true });
  }, [onSettingsSaved, searchParams, setSearchParams, toast]);

  useEffect(() => {
    if (!slackManageOpen) {
      setSlackManageTab('overview');
      setSlackPendingActionKey(null);
      setSlackMappingSavingKey(null);
      setSlackMappingDrafts({});
      slackAutoMappingAttemptRef.current = {};
      return;
    }

    if (slackConnection && isHROrAdmin) {
      void loadSlackAdminState();
    }
  }, [isHROrAdmin, slackManageOpen, slackConnection?.id]);

  const handleSlackConnect = async () => {
    if (!isHROrAdmin) {
      toast({
        title: 'Access required',
        description: 'Only company admins and HR users can connect Slack.',
        variant: 'destructive',
      });
      return;
    }

    setSlackConnecting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Sign in again before connecting Slack.');
      }

      const oauthUrl = new URL(`${SUPABASE_FUNCTIONS_BASE_URL}/slack-oauth-init`);
      oauthUrl.searchParams.set('orgId', company.id);
      oauthUrl.searchParams.set('access_token', session.access_token);
      window.location.assign(oauthUrl.toString());
    } catch (error: any) {
      setSlackConnecting(false);
      toast({
        title: 'Could not connect Slack',
        description: error.message || 'Try again after refreshing your session.',
        variant: 'destructive',
      });
    }
  };

  const handleSlackTest = async () => {
    setSlackSendingTest(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-slack-notification', {
        body: {
          company_id: company.id,
          event_type: 'test_connection',
          data: {},
        },
      });

      if (error) {
        throw new Error(await readFunctionErrorMessage(error, 'Failed to send Slack test message'));
      }

      if (!data?.success) {
        throw new Error(data?.message || 'Slack test message failed');
      }

      toast({
        title: 'Slack test sent',
        description: slackConnection?.incoming_webhook_channel
          ? `Posted to ${slackConnection.incoming_webhook_channel}.`
          : 'Posted to your connected Slack workspace.',
      });
    } catch (error: any) {
      toast({
        title: 'Slack test failed',
        description: error.message || 'We could not send the Slack test message.',
        variant: 'destructive',
      });
    } finally {
      setSlackSendingTest(false);
    }
  };

  const handleSlackDisconnect = async () => {
    setSlackDisconnecting(true);

    try {
      const { error } = await supabase.rpc('disconnect_slack_connection' as any, {
        p_org_id: company.id,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSlackManageOpen(false);
      await loadSlackConnection();
      setSlackAdminConnection(null);
      setSlackPendingConfirmations([]);
      setSlackAvailableChannels([]);
      setSlackSettingsState(DEFAULT_SLACK_SETTINGS);
      onSettingsSaved?.();
      toast({
        title: 'Slack disconnected',
        description: 'The workspace was disconnected without revoking the Slack token.',
      });
    } catch (error: any) {
      toast({
        title: 'Slack disconnect failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSlackDisconnecting(false);
    }
  };

  const handleSlackSettingsSave = async () => {
    setSlackSettingsSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke('slack-manage', {
        body: {
          action: 'update_settings',
          orgId: company.id,
          ...slackSettingsState,
        },
      });

      if (error) {
        throw new Error(await readFunctionErrorMessage(error, 'Failed to save Slack settings'));
      }

      applySlackAdminState((data || {}) as any);
      await loadSlackConnection();
      onSettingsSaved?.();
      toast({
        title: 'Slack settings saved',
        description: 'The Slack onboarding rules are updated for future workspace joins.',
      });
    } catch (error: any) {
      toast({
        title: 'Slack settings failed',
        description: error.message || 'Try saving again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setSlackSettingsSaving(false);
    }
  };

  const handleSlackPendingConfirmationAction = async (
    confirmationId: string,
    action: 'approve_confirmation' | 'reject_confirmation' | 'resend_confirmation',
  ) => {
    const actionKey = `${action}:${confirmationId}`;
    setSlackPendingActionKey(actionKey);

    try {
      const { data, error } = await supabase.functions.invoke('slack-manage', {
        body: {
          action,
          orgId: company.id,
          confirmationId,
        },
      });

      if (error) {
        throw new Error(await readFunctionErrorMessage(error, 'Failed to update the Slack confirmation'));
      }

      applySlackAdminState((data || {}) as any);
      await loadSlackConnection();
      onSettingsSaved?.();
      toast({
        title:
          action === 'approve_confirmation'
            ? 'Slack member approved'
            : action === 'reject_confirmation'
              ? 'Slack member skipped'
              : 'Confirmation re-sent',
        description:
          (data as { message?: string } | null)?.message ||
          (action === 'resend_confirmation'
            ? 'The Slack confirmation was sent again.'
            : 'The pending Slack confirmation was updated.'),
      });
    } catch (error: any) {
      toast({
        title: 'Slack confirmation failed',
        description: error.message || 'Try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setSlackPendingActionKey(null);
    }
  };

  const handleSlackMappingSave = async (
    workspaceUser: SlackWorkspaceUserSummary,
    nextCompanyUserId?: string,
    options?: {
      silentSuccess?: boolean;
      silentError?: boolean;
    },
  ) => {
    const selectedCompanyUserId =
      nextCompanyUserId ??
      slackMappingDrafts[workspaceUser.slack_user_id] ??
      workspaceUser.linked_company_user_id ??
      '__none__';
    const currentCompanyUserId = workspaceUser.linked_company_user_id ?? '__none__';

    if (selectedCompanyUserId === currentCompanyUserId) {
      return false;
    }

    setSlackMappingSavingKey(workspaceUser.slack_user_id);

    try {
      const action = selectedCompanyUserId === '__none__' ? 'unlink_user' : 'map_user';
      const { data, error } = await supabase.functions.invoke('slack-manage', {
        body: {
          action,
          orgId: company.id,
          slackUserId: workspaceUser.slack_user_id,
          companyUserId: selectedCompanyUserId === '__none__' ? undefined : selectedCompanyUserId,
        },
      });

      if (error) {
        throw new Error(await readFunctionErrorMessage(error, 'Failed to update Slack user mapping'));
      }

      applySlackAdminState((data || {}) as any);
      await loadSlackConnection();
      onSettingsSaved?.();
      if (!options?.silentSuccess) {
        toast({
          title: selectedCompanyUserId === '__none__' ? 'Slack mapping removed' : 'Slack mapping saved',
          description:
            (data as { message?: string } | null)?.message ||
            (selectedCompanyUserId === '__none__'
              ? 'That Slack user is no longer linked to an RCF user.'
              : 'The Slack user is now linked to the selected RCF user.'),
        });
      }
      return true;
    } catch (error: any) {
      setSlackMappingDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[workspaceUser.slack_user_id];
        return nextDrafts;
      });
      if (!options?.silentError) {
        toast({
          title: 'Slack mapping failed',
          description: error.message || 'Try again in a moment.',
          variant: 'destructive',
        });
      }
      return false;
    } finally {
      setSlackMappingSavingKey(null);
    }
  };

  const selectedSlackAdminChannelValue = slackSettingsState.admin_notify_channel || '__none__';
  const slackChannelOptions =
    slackSettingsState.admin_notify_channel &&
    !slackAvailableChannels.some((channel) => channel.id === slackSettingsState.admin_notify_channel)
      ? [
          ...slackAvailableChannels,
          {
            id: slackSettingsState.admin_notify_channel,
            name: slackSettingsState.admin_notify_channel,
          },
        ]
      : slackAvailableChannels;
  const mappedSlackUserCount = slackWorkspaceUsers.filter((user) => Boolean(user.linked_company_user_id)).length;
  const unmappedSlackUserCount = Math.max(slackWorkspaceUsers.length - mappedSlackUserCount, 0);
  const workspaceUsersWithSuggestions = slackWorkspaceUsers.map((workspaceUser) => {
    const suggestion = findSuggestedCompanyUser(workspaceUser, slackCompanyUsers);
    return {
      workspaceUser,
      suggestedCompanyUser: suggestion.companyUser,
      suggestedConfidence: suggestion.confidence,
    };
  });
  const sortedWorkspaceUsers = workspaceUsersWithSuggestions.slice().sort((left, right) => {
    const leftMappedRank = left.workspaceUser.linked_company_user_id ? 0 : 1;
    const rightMappedRank = right.workspaceUser.linked_company_user_id ? 0 : 1;

    if (leftMappedRank !== rightMappedRank) {
      return leftMappedRank - rightMappedRank;
    }

    if (!left.workspaceUser.linked_company_user_id && !right.workspaceUser.linked_company_user_id) {
      if (left.suggestedConfidence !== right.suggestedConfidence) {
        return right.suggestedConfidence - left.suggestedConfidence;
      }
    }

    const leftName =
      left.workspaceUser.real_name ||
      left.workspaceUser.display_name ||
      left.workspaceUser.email ||
      left.workspaceUser.slack_user_id;
    const rightName =
      right.workspaceUser.real_name ||
      right.workspaceUser.display_name ||
      right.workspaceUser.email ||
      right.workspaceUser.slack_user_id;
    return leftName.localeCompare(rightName);
  });

  useEffect(() => {
    if (!slackManageOpen || slackManageTab !== 'mapping' || slackAdminStateLoading || slackMappingSavingKey) {
      return;
    }

    const autoMatchCandidate = workspaceUsersWithSuggestions.find(({ workspaceUser, suggestedCompanyUser, suggestedConfidence }) => {
      if (workspaceUser.linked_company_user_id || !suggestedCompanyUser || suggestedConfidence < 95) {
        return false;
      }

      if (
        suggestedCompanyUser.slack_user_id &&
        suggestedCompanyUser.slack_user_id !== workspaceUser.slack_user_id
      ) {
        return false;
      }

      return slackAutoMappingAttemptRef.current[workspaceUser.slack_user_id] !== suggestedCompanyUser.id;
    });

    if (!autoMatchCandidate?.suggestedCompanyUser) {
      return;
    }

    slackAutoMappingAttemptRef.current[autoMatchCandidate.workspaceUser.slack_user_id] =
      autoMatchCandidate.suggestedCompanyUser.id;

    void handleSlackMappingSave(
      autoMatchCandidate.workspaceUser,
      autoMatchCandidate.suggestedCompanyUser.id,
      { silentSuccess: true, silentError: true },
    );
  }, [
    slackAdminStateLoading,
    slackManageOpen,
    slackManageTab,
    slackMappingSavingKey,
    workspaceUsersWithSuggestions,
  ]);

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                <img src={SLACK_LOGO_URL} alt="Slack logo" className="h-full w-full object-contain p-2" loading="lazy" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base font-medium">Slack</CardTitle>
                  <Badge variant="secondary">Chat</Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      'border',
                      slackConnection
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
                        : 'border-border bg-muted text-muted-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'mr-2 inline-block h-2.5 w-2.5 rounded-full',
                        slackConnection ? 'bg-emerald-500' : 'bg-muted-foreground/70',
                      )}
                    />
                    {slackConnection ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
                <CardDescription>
                  Connect Slack so RoleColorFinder can post digests, send assessment invites, respond to slash
                  commands, reply in DMs with AI help, and manage onboarding confirmations.
                </CardDescription>
              </div>
            </div>

            {slackConnection ? (
              <Button onClick={() => setSlackManageOpen(true)} disabled={slackSendingTest || slackDisconnecting || !isHROrAdmin}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Manage
              </Button>
            ) : (
              <Button onClick={() => void handleSlackConnect()} disabled={slackConnecting || !isHROrAdmin}>
                {slackConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                Connect Slack
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Workspace</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {slackConnection?.team_name || 'Not connected yet'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {slackConnection?.team_id || 'Connect your Slack workspace with OAuth'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Webhook channel</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {slackConnection?.incoming_webhook_channel || 'Slack app default'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {slackConnection ? `Connected ${new Date(slackConnection.connected_at).toLocaleString()}` : 'Used for test messages and digests'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Access</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {isHROrAdmin ? 'Admin / HR controls enabled' : 'Admin / HR required'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isHROrAdmin
                  ? 'You can connect, test, disconnect, and tune onboarding rules here.'
                  : 'Only company admins and HR users can manage the Slack workspace connection.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={slackManageOpen} onOpenChange={setSlackManageOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Slack connection</DialogTitle>
            <DialogDescription>
              Review the connected workspace, tune Slack onboarding settings, and work through pending confirmations
              from Settings.
            </DialogDescription>
          </DialogHeader>

          {slackConnection && (
            <Tabs value={slackManageTab} onValueChange={(value) => setSlackManageTab(value as 'overview' | 'settings' | 'mapping')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="mapping">
                  User Mapping
                  {unmappedSlackUserCount > 0 ? (
                    <Badge variant="secondary" className="ml-2">
                      {unmappedSlackUserCount}
                    </Badge>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="settings">
                  Settings
                  {slackPendingConfirmations.length > 0 ? (
                    <Badge variant="secondary" className="ml-2">
                      {slackPendingConfirmations.length}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-5">
                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Workspace</p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {slackAdminConnection?.team_name || slackConnection.team_name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {slackAdminConnection?.team_id || slackConnection.team_id}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Webhook channel</p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {slackAdminConnection?.incoming_webhook_channel || slackConnection.incoming_webhook_channel || 'Slack app default'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Connected {new Date(slackAdminConnection?.connected_at || slackConnection.connected_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Onboarding mode</p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {slackSettingsState.auto_add_users ? 'Auto-add new Slack members' : 'Admin review / confirmation'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {slackPendingConfirmations.length > 0
                        ? `${slackPendingConfirmations.length} pending confirmation${slackPendingConfirmations.length === 1 ? '' : 's'}`
                        : 'No pending confirmations right now'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Slack OAuth</Badge>
                    <Badge variant="outline">Slash Commands</Badge>
                    <Badge variant="outline">Events API</Badge>
                    <Badge variant="outline">User Mapping</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    RoleColorFinder can post digests, send assessment invites, respond to slash commands, and govern
                    Slack member onboarding through admin-controlled matching rules. Users can also DM the app for AI
                    help with assessments, RoleColors, team balance, and portal navigation.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card/60 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Slash Commands</Badge>
                    <Badge variant="outline">AI Replies</Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {SUPPORTED_SLACK_COMMANDS.map((item) => (
                      <div key={item.command} className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">{item.command}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Direct messages to the RoleColorFinder app will also get AI replies once the Slack app is reinstalled
                    with the updated messaging scopes.
                  </p>
                  <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-200">
                    If Slack still says sending messages to this app is turned off, enable the Slack app&apos;s Messages
                    tab and Events API subscriptions for direct messages and app mentions, then reconnect the workspace
                    here so Slack grants the new scopes.
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => void handleSlackTest()}
                    disabled={slackSendingTest || slackDisconnecting}
                  >
                    {slackSendingTest ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Send test message
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => void handleSlackDisconnect()}
                    disabled={slackDisconnecting || slackSendingTest}
                  >
                    {slackDisconnecting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Unplug className="mr-2 h-4 w-4" />
                    )}
                    Disconnect
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="mapping" className="space-y-5">
                {slackAdminStateLoading ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading Slack user mappings...
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-border bg-muted/40 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Workspace members</p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">{slackWorkspaceUsers.length}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Slack users available for manual linking</p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/40 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Mapped users</p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">{mappedSlackUserCount}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Slack members already linked to RCF users</p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/40 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Need mapping</p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">{unmappedSlackUserCount}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Workspace members still waiting on a manual link</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card/60 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Map Slack users to RCF users</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            After Slack is connected, you can manually pair each Slack member with the right RCF user profile.
                          </p>
                        </div>
                        <Badge variant="secondary">{slackCompanyUsers.length} RCF users available</Badge>
                      </div>

                      {sortedWorkspaceUsers.length === 0 ? (
                        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                          No Slack workspace users were returned. If this stays empty, reconnect Slack and confirm the
                          app has permission to read workspace members.
                        </div>
                      ) : (
                        <div className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto pr-3">
                            {sortedWorkspaceUsers.map(({ workspaceUser, suggestedCompanyUser, suggestedConfidence }) => {
                              const selectedCompanyUserId =
                                slackMappingDrafts[workspaceUser.slack_user_id] ??
                                workspaceUser.linked_company_user_id ??
                                suggestedCompanyUser?.id ??
                                '__none__';
                              const currentCompanyUserId = workspaceUser.linked_company_user_id ?? '__none__';
                              const isSaving = slackMappingSavingKey === workspaceUser.slack_user_id;
                              const selectedCompanyUser =
                                selectedCompanyUserId !== '__none__'
                                  ? slackCompanyUsers.find((user) => user.id === selectedCompanyUserId) || null
                                  : null;

                              return (
                                <div key={workspaceUser.slack_user_id} className="rounded-2xl border border-border bg-muted/20 p-4">
                                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                                    <div className="flex min-w-0 flex-1 gap-4">
                                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background">
                                        {workspaceUser.avatar_url ? (
                                          <img
                                            src={workspaceUser.avatar_url}
                                            alt={`${workspaceUser.real_name || workspaceUser.display_name || workspaceUser.email || 'Slack'} avatar`}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <UserRound className="h-5 w-5 text-muted-foreground" />
                                        )}
                                      </div>

                                      <div className="min-w-0 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="text-sm font-semibold text-foreground">
                                            {workspaceUser.real_name ||
                                              workspaceUser.display_name ||
                                              workspaceUser.email ||
                                              workspaceUser.slack_user_id}
                                          </p>
                                          <Badge variant={workspaceUser.linked_company_user_id ? 'secondary' : 'outline'}>
                                            {workspaceUser.linked_company_user_id ? 'Mapped' : 'Unmapped'}
                                          </Badge>
                                          {!workspaceUser.linked_company_user_id && suggestedCompanyUser && (
                                            <Badge variant="secondary">{suggestedConfidence}% auto-match</Badge>
                                          )}
                                        </div>

                                        {workspaceUser.email && (
                                          <p className="text-sm text-muted-foreground">{workspaceUser.email}</p>
                                        )}
                                        {workspaceUser.title && (
                                          <p className="text-xs text-muted-foreground">{workspaceUser.title}</p>
                                        )}

                                        {workspaceUser.linked_company_user_name ? (
                                          <div className="rounded-xl border border-border bg-background/80 p-3 text-sm">
                                            <p className="font-medium text-foreground">{workspaceUser.linked_company_user_name}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                              {workspaceUser.linked_company_user_email && (
                                                <Badge variant="outline">{workspaceUser.linked_company_user_email}</Badge>
                                              )}
                                              {workspaceUser.linked_company_user_role && (
                                                <Badge variant="secondary">{workspaceUser.linked_company_user_role}</Badge>
                                              )}
                                              {workspaceUser.linked_company_user_role_color && (
                                                <Badge className={cn('border', roleColorBadgeClass(workspaceUser.linked_company_user_role_color))}>
                                                  {workspaceUser.linked_company_user_role_color}
                                                </Badge>
                                              )}
                                            </div>
                                            {workspaceUser.linked_at && (
                                              <p className="mt-2 text-xs text-muted-foreground">
                                                Linked {formatRelativeTimestamp(workspaceUser.linked_at)}
                                              </p>
                                            )}
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>

                                    <div className="w-full space-y-3 xl:w-[22rem]">
                                      <Select
                                        value={selectedCompanyUserId}
                                        onValueChange={(value) => {
                                          setSlackMappingDrafts((current) => ({
                                            ...current,
                                            [workspaceUser.slack_user_id]: value,
                                          }));
                                          void handleSlackMappingSave(workspaceUser, value);
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Choose an RCF user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="__none__">No linked RCF user</SelectItem>
                                          {slackCompanyUsers.map((companyUserOption) => {
                                            const isLinkedElsewhere =
                                              companyUserOption.slack_user_id &&
                                              companyUserOption.slack_user_id !== workspaceUser.slack_user_id;
                                            const optionLabel =
                                              companyUserOption.full_name ||
                                              companyUserOption.email;

                                            return (
                                              <SelectItem key={companyUserOption.id} value={companyUserOption.id}>
                                                {optionLabel}
                                                {companyUserOption.email ? ` · ${companyUserOption.email}` : ''}
                                                {isLinkedElsewhere ? ' · linked elsewhere' : ''}
                                              </SelectItem>
                                            );
                                          })}
                                        </SelectContent>
                                      </Select>

                                      {selectedCompanyUser && (
                                        <div className="rounded-xl border border-border bg-background/80 p-3 text-xs text-muted-foreground">
                                          <p className="font-medium text-foreground">
                                            {selectedCompanyUser.full_name || selectedCompanyUser.email}
                                          </p>
                                          <p className="mt-1">
                                            {selectedCompanyUser.email}
                                            {selectedCompanyUser.job_role ? ` · ${selectedCompanyUser.job_role}` : ''}
                                          </p>
                                          {selectedCompanyUser.slack_user_id &&
                                          selectedCompanyUser.slack_user_id !== workspaceUser.slack_user_id ? (
                                            <p className="mt-2 text-amber-700 dark:text-amber-200">
                                              Saving this will move the RCF user from another Slack mapping.
                                            </p>
                                          ) : null}
                                          {!workspaceUser.linked_company_user_id &&
                                          suggestedCompanyUser &&
                                          suggestedCompanyUser.id === selectedCompanyUser.id ? (
                                            <p className="mt-2 text-emerald-700 dark:text-emerald-200">
                                              Best-effort match based on email and name similarity.
                                            </p>
                                          ) : null}
                                        </div>
                                      )}

                                      <div className="rounded-xl border border-dashed border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                                        {isSaving ? (
                                          <span className="inline-flex items-center gap-2">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Saving mapping...
                                          </span>
                                        ) : selectedCompanyUserId === currentCompanyUserId ? (
                                          'Mappings save automatically when you choose an RCF user.'
                                        ) : (
                                          'Saving will happen automatically after your selection.'
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-5">
                {slackAdminStateLoading ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading Slack onboarding settings...
                  </div>
                ) : (
                  <>
                    <div className="space-y-5 rounded-2xl border border-border bg-card/60 p-5">
                      <div>
                        <p className="text-sm font-semibold text-foreground">User Onboarding</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Control what RoleColorFinder should do when somebody new appears in your Slack workspace.
                        </p>
                      </div>

                      <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Automatically add new Slack members to RCF</p>
                          <p className="text-sm text-muted-foreground">
                            When someone joins your Slack workspace, automatically create them as an RCF user using
                            their Slack profile.
                          </p>
                        </div>
                        <Switch
                          checked={slackSettingsState.auto_add_users}
                          onCheckedChange={(checked) =>
                            setSlackSettingsState((current) => ({
                              ...current,
                              auto_add_users: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">Notify me when a new Slack member isn&apos;t in RCF</p>
                            <p className="text-sm text-muted-foreground">
                              Receive a notification when someone joins Slack but doesn&apos;t have an RCF account, so
                              you can decide whether to add them.
                            </p>
                          </div>
                          <Switch
                            checked={slackSettingsState.admin_notify_on_new_user}
                            disabled={slackSettingsState.auto_add_users}
                            onCheckedChange={(checked) =>
                              setSlackSettingsState((current) => ({
                                ...current,
                                admin_notify_on_new_user: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Send notifications to channel
                          </p>
                          <Select
                            value={selectedSlackAdminChannelValue}
                            onValueChange={(value) =>
                              setSlackSettingsState((current) => ({
                                ...current,
                                admin_notify_channel: value === '__none__' ? null : value,
                              }))
                            }
                            disabled={slackSettingsState.auto_add_users}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="DM the connecting admin by default" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">DM the connecting admin</SelectItem>
                              {slackChannelOptions.map((channel) => (
                                <SelectItem key={channel.id} value={channel.id}>
                                  #{channel.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Uses the Slack app default DM when no channel override is selected.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 rounded-2xl border border-border bg-card/60 p-5">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Identity Matching</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Decide how RoleColorFinder should react when a Slack email doesn&apos;t line up with an
                          existing RCF record.
                        </p>
                      </div>

                      <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Enable name matching</p>
                          <p className="text-sm text-muted-foreground">
                            When a Slack email doesn&apos;t match any RCF account, attempt to find a match using the
                            person&apos;s name. Only enable this if your team uses different emails across tools.
                          </p>
                        </div>
                        <Switch
                          checked={slackSettingsState.name_matching_enabled}
                          onCheckedChange={(checked) =>
                            setSlackSettingsState((current) => ({
                              ...current,
                              name_matching_enabled: checked,
                            }))
                          }
                        />
                      </div>

                      {slackSettingsState.name_matching_enabled && (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-200">
                          ⚠️ Name matching can produce false positives. Always review pending confirmations carefully.
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">When Slack email doesn&apos;t match an RCF account</p>
                        <Select
                          value={slackSettingsState.email_mismatch_action}
                          onValueChange={(value) =>
                            setSlackSettingsState((current) => ({
                              ...current,
                              email_mismatch_action: value as SlackAdminSettingsState['email_mismatch_action'],
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="confirm">Ask user to confirm their identity</SelectItem>
                            <SelectItem value="ignore">Ignore and skip</SelectItem>
                            <SelectItem value="auto_create">Auto-create new account</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          If name matching is off, this setting applies only to direct email mismatches.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => void handleSlackSettingsSave()} disabled={slackSettingsSaving}>
                        {slackSettingsSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Settings
                      </Button>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Pending Confirmations</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Review Slack members who still need an RCF identity decision.
                          </p>
                        </div>
                        <Badge variant="secondary">{slackPendingConfirmations.length} pending confirmations</Badge>
                      </div>

                      {slackPendingConfirmations.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                          No Slack onboarding confirmations are waiting on review right now.
                        </div>
                      ) : (
                        <ScrollArea className="max-h-[28rem]">
                          <div className="space-y-3 pr-3">
                            {slackPendingConfirmations.map((confirmation) => {
                              const approveActionKey = `approve_confirmation:${confirmation.id}`;
                              const rejectActionKey = `reject_confirmation:${confirmation.id}`;
                              const resendActionKey = `resend_confirmation:${confirmation.id}`;

                              return (
                                <div key={confirmation.id} className="rounded-2xl border border-border bg-muted/20 p-4">
                                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                                    <div className="flex min-w-0 flex-1 gap-4">
                                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background">
                                        {confirmation.slack_avatar_url ? (
                                          <img
                                            src={confirmation.slack_avatar_url}
                                            alt={`${confirmation.slack_real_name || confirmation.slack_display_name || 'Slack'} avatar`}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <UserRound className="h-5 w-5 text-muted-foreground" />
                                        )}
                                      </div>

                                      <div className="min-w-0 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="text-sm font-semibold text-foreground">
                                            {confirmation.slack_real_name ||
                                              confirmation.slack_display_name ||
                                              confirmation.slack_email ||
                                              'Slack member'}
                                          </p>
                                          <Badge variant="outline">{confirmation.matchBadgeLabel}</Badge>
                                          {confirmation.match_type === 'fuzzy_name' &&
                                            typeof confirmation.match_confidence === 'number' && (
                                              <Badge variant="secondary">{confirmation.match_confidence}%</Badge>
                                            )}
                                        </div>

                                        {confirmation.slack_email && (
                                          <p className="text-sm text-muted-foreground">{confirmation.slack_email}</p>
                                        )}
                                        {confirmation.slack_title && (
                                          <p className="text-xs text-muted-foreground">{confirmation.slack_title}</p>
                                        )}

                                        {confirmation.matched_rcf_name && (
                                          <div className="rounded-xl border border-border bg-background/80 p-3 text-sm">
                                            <p className="font-medium text-foreground">{confirmation.matched_rcf_name}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                              {confirmation.matched_rcf_role && (
                                                <Badge variant="secondary">{confirmation.matched_rcf_role}</Badge>
                                              )}
                                              {confirmation.matched_rcf_color && (
                                                <Badge
                                                  className={cn(
                                                    'border',
                                                    roleColorBadgeClass(confirmation.matched_rcf_color),
                                                  )}
                                                >
                                                  {confirmation.matchedRoleColorLabel || confirmation.matched_rcf_color}
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        <p className="text-xs text-muted-foreground">
                                          DM sent {formatRelativeTimestamp(confirmation.dm_sent_at)}. Expires{' '}
                                          {formatRelativeTimestamp(confirmation.expires_at)}.
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 lg:w-[15rem] lg:justify-end">
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          void handleSlackPendingConfirmationAction(
                                            confirmation.id,
                                            'approve_confirmation',
                                          )
                                        }
                                        disabled={Boolean(slackPendingActionKey)}
                                      >
                                        {slackPendingActionKey === approveActionKey ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          void handleSlackPendingConfirmationAction(
                                            confirmation.id,
                                            'resend_confirmation',
                                          )
                                        }
                                        disabled={Boolean(slackPendingActionKey)}
                                      >
                                        {slackPendingActionKey === resendActionKey ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        Resend DM
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() =>
                                          void handleSlackPendingConfirmationAction(
                                            confirmation.id,
                                            'reject_confirmation',
                                          )
                                        }
                                        disabled={Boolean(slackPendingActionKey)}
                                      >
                                        {slackPendingActionKey === rejectActionKey ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
