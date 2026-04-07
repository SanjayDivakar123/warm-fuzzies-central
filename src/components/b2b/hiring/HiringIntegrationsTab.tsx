import { useEffect, useRef, useState } from 'react';
import { useMergeLink } from '@mergeapi/react-merge-link';
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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  getClearbitLogoUrl,
  MERGE_ATS_INTEGRATIONS,
  MERGE_HRIS_INTEGRATIONS,
  TOTAL_SUPPORTED_MERGE_INTEGRATIONS,
  type MergeIntegrationCategory,
  type SupportedMergeIntegration,
} from '@/lib/mergeCatalog';
import { cn } from '@/lib/utils';
import {
  BriefcaseBusiness,
  CheckCircle2,
  CircleX,
  Link2,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldAlert,
  Unplug,
  UserRound,
  Users,
  X,
} from 'lucide-react';

interface HiringIntegrationsTabProps {
  company: { id: string };
  companyUser: { id: string; role: string } | null;
}

interface MergeMetadataRecord {
  name: string;
  slug: string;
  image?: string | null;
  square_image?: string | null;
  categories: string[];
}

interface ConnectionSummary {
  id: string;
  orgId: string;
  platformName: string;
  category: MergeIntegrationCategory;
  integration: string | null;
  connectionStatus: 'connected' | 'reconnect_required' | 'disconnected';
  syncStatus: 'idle' | 'syncing' | 'retrying' | 'error';
  connectedAt: string;
  lastSyncedAt: string | null;
  counts: {
    employees: number;
    jobs: number;
    candidates: number;
    applications: number;
  };
}

interface ConnectionTestState {
  phase: 'loading' | 'success' | 'warning' | 'error';
  latencyMs?: number;
  message?: string;
  reconnectRequired?: boolean;
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

interface SlackAdminSettingsState {
  auto_add_users: boolean;
  email_mismatch_action: 'confirm' | 'ignore' | 'auto_create';
  name_matching_enabled: boolean;
  admin_notify_on_new_user: boolean;
  admin_notify_channel: string | null;
}

type IntegrationView = 'all' | 'mine';
type PrimarySectionConfig = (typeof SECTION_CONFIG)[number];

const SECTION_CONFIG = [
  {
    title: 'HRIS',
    description: 'Sync employees, departments, reporting lines, and RoleColor invite hooks.',
    category: 'hris' as const,
    integrations: MERGE_HRIS_INTEGRATIONS,
  },
  {
    title: 'ATS',
    description: 'Sync jobs, candidates, applications, and hiring activity through Merge.',
    category: 'ats' as const,
    integrations: MERGE_ATS_INTEGRATIONS,
  },
];

const ROLECOLOR_PLACEHOLDER_BACKGROUND =
  'linear-gradient(135deg, rgba(253,230,138,1) 0%, rgba(252,165,165,1) 34%, rgba(134,239,172,1) 68%, rgba(147,197,253,1) 100%)';
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

const logoCache: Record<string, string> = {};
let mergeMetadataCache: Record<string, MergeMetadataRecord> | null = null;

const getIntegrationKey = (integration: SupportedMergeIntegration) => `${integration.category}:${integration.integration}`;

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const getMetadataCandidates = (
  integration: SupportedMergeIntegration,
  metadata: MergeMetadataRecord | null,
) =>
  Array.from(new Set([metadata?.square_image, metadata?.image, getClearbitLogoUrl(integration.name)].filter(Boolean))) as string[];

const findSupportedIntegration = (category: MergeIntegrationCategory, platformName: string) =>
  SECTION_CONFIG.find((section) => section.category === category)?.integrations.find(
    (integration) => integration.name === platformName,
  ) || null;

const getStatusPresentation = (connection: ConnectionSummary | null, isCurrentPlatform: boolean) => {
  if (!connection || !isCurrentPlatform) {
    return {
      label: 'Not Connected',
      dotClassName: 'bg-muted-foreground/70',
      badgeClassName: 'border-border bg-muted text-muted-foreground',
      helperText: null,
    };
  }

  if (connection.connectionStatus === 'reconnect_required') {
    return {
      label: 'Reconnect required',
      dotClassName: 'bg-amber-500',
      badgeClassName:
        'border-amber-300/60 bg-amber-500/10 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200',
      helperText: 'Merge returned 401. Reconnect this integration to resume sync.',
    };
  }

  if (connection.syncStatus === 'syncing' || connection.syncStatus === 'retrying') {
    return {
      label: 'Sync in progress',
      dotClassName: 'bg-sky-500',
      badgeClassName:
        'border-sky-300/60 bg-sky-500/10 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-200',
      helperText: 'Merge sync is running or waiting on retry backoff.',
    };
  }

  return {
    label: 'Connected',
    dotClassName: 'bg-emerald-500',
    badgeClassName:
      'border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200',
    helperText: 'Connected and ready for ongoing Merge syncs.',
  };
};

const readFunctionErrorMessage = async (error: any, fallback: string) => {
  try {
    const payload = await error?.context?.json?.();
    const message = payload?.error || payload?.message || error?.message || fallback;
    if (typeof message === 'string' && message.includes('Failed to send a request to the Edge Function')) {
      return 'Could not reach the Supabase Edge Function. Make sure your local functions are running or deployed, then try again.';
    }
    return message;
  } catch {
    const message = error?.message || fallback;
    if (typeof message === 'string' && message.includes('Failed to send a request to the Edge Function')) {
      return 'Could not reach the Supabase Edge Function. Make sure your local functions are running or deployed, then try again.';
    }
    return message;
  }
};

const formatRelativeTimestamp = (value: string | null) => {
  if (!value) {
    return 'Not sent yet';
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

function PlatformLogo({
  integration,
  metadata,
  size = 40,
  onLogoStateChange,
}: {
  integration: SupportedMergeIntegration;
  metadata: MergeMetadataRecord | null;
  size?: number;
  onLogoStateChange?: (isPlaceholder: boolean) => void;
}) {
  const cacheKey = getIntegrationKey(integration);
  const logoCandidates = getMetadataCandidates(integration, metadata);
  const preferredLogo = logoCandidates[0] || null;
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => {
    const cachedLogo = logoCache[cacheKey];
    if (preferredLogo) {
      return preferredLogo;
    }

    if (cachedLogo) {
      return cachedLogo;
    }

    return null;
  });

  useEffect(() => {
    const cachedLogo = logoCache[cacheKey];
    if (preferredLogo && cachedLogo !== preferredLogo) {
      setResolvedSrc(preferredLogo);
      return;
    }

    if (cachedLogo) {
      setResolvedSrc(cachedLogo);
      return;
    }

    setResolvedSrc(preferredLogo);
  }, [cacheKey, preferredLogo, logoCandidates.join('|')]);

  useEffect(() => {
    onLogoStateChange?.(!resolvedSrc);
  }, [resolvedSrc]);

  const handleError = () => {
    if (!resolvedSrc) {
      return;
    }

    const currentIndex = logoCandidates.findIndex((candidate) => candidate === resolvedSrc);
    const nextLogo = currentIndex >= 0 ? logoCandidates[currentIndex + 1] || null : null;

    if (nextLogo) {
      setResolvedSrc(nextLogo);
      return;
    }

    setResolvedSrc(null);
  };

  const placeholderSize = Math.max(20, size - 8);

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background shadow-sm"
      style={{ width: size, height: size }}
    >
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={`${integration.name} logo`}
          className="h-full w-full object-contain p-2"
          loading="lazy"
          onError={handleError}
          onLoad={() => {
            if (resolvedSrc) {
              logoCache[cacheKey] = resolvedSrc;
            }
          }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full text-xs font-semibold text-foreground"
          style={{
            width: placeholderSize,
            height: placeholderSize,
            background: ROLECOLOR_PLACEHOLDER_BACKGROUND,
          }}
        >
          {getInitials(integration.name)}
        </div>
      )}
    </div>
  );
}

export default function HiringIntegrationsTab({ company, companyUser }: HiringIntegrationsTabProps) {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isHROrAdmin = companyUser?.role === 'admin' || companyUser?.role === 'hr';
  const testResetTimersRef = useRef<Record<string, number>>({});

  const [metadataByKey, setMetadataByKey] = useState<Record<string, MergeMetadataRecord>>({});
  const [connectionsByCategory, setConnectionsByCategory] = useState<
    Partial<Record<MergeIntegrationCategory, ConnectionSummary>>
  >({});
  const [slackConnection, setSlackConnection] = useState<SlackConnectionSummary | null>(null);
  const [connectionTests, setConnectionTests] = useState<Record<string, ConnectionTestState>>({});
  const [placeholderLogoKeys, setPlaceholderLogoKeys] = useState<Record<string, boolean>>({});
  const [activeView, setActiveView] = useState<IntegrationView>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [slackConnecting, setSlackConnecting] = useState(false);
  const [slackSendingTest, setSlackSendingTest] = useState(false);
  const [slackDisconnecting, setSlackDisconnecting] = useState(false);
  const [slackManageOpen, setSlackManageOpen] = useState(false);
  const [slackManageTab, setSlackManageTab] = useState<'overview' | 'settings'>('overview');
  const [slackAdminStateLoading, setSlackAdminStateLoading] = useState(false);
  const [slackAdminConnection, setSlackAdminConnection] = useState<SlackAdminConnectionState | null>(null);
  const [slackSettingsState, setSlackSettingsState] = useState<SlackAdminSettingsState>(DEFAULT_SLACK_SETTINGS);
  const [slackSettingsSaving, setSlackSettingsSaving] = useState(false);
  const [slackPendingConfirmations, setSlackPendingConfirmations] = useState<SlackPendingConfirmationSummary[]>([]);
  const [slackAvailableChannels, setSlackAvailableChannels] = useState<SlackChannelOption[]>([]);
  const [slackPendingActionKey, setSlackPendingActionKey] = useState<string | null>(null);
  const [creatingLinkKey, setCreatingLinkKey] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string | undefined>(undefined);
  const [pendingIntegration, setPendingIntegration] = useState<SupportedMergeIntegration | null>(null);
  const [completingLink, setCompletingLink] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionSummary | null>(null);
  const [syncingCategory, setSyncingCategory] = useState<MergeIntegrationCategory | null>(null);
  const [disconnectingCategory, setDisconnectingCategory] = useState<MergeIntegrationCategory | null>(null);

  const clearConnectionTest = (integrationKey: string) => {
    const resetTimer = testResetTimersRef.current[integrationKey];
    if (resetTimer) {
      window.clearTimeout(resetTimer);
      delete testResetTimersRef.current[integrationKey];
    }

    setConnectionTests((currentTests) => {
      if (!currentTests[integrationKey]) {
        return currentTests;
      }

      const nextTests = { ...currentTests };
      delete nextTests[integrationKey];
      return nextTests;
    });
  };

  const scheduleConnectionTestReset = (integrationKey: string) => {
    const existingTimer = testResetTimersRef.current[integrationKey];
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    testResetTimersRef.current[integrationKey] = window.setTimeout(() => {
      setConnectionTests((currentTests) => {
        if (currentTests[integrationKey]?.phase !== 'success') {
          return currentTests;
        }

        const nextTests = { ...currentTests };
        delete nextTests[integrationKey];
        return nextTests;
      });
      delete testResetTimersRef.current[integrationKey];
    }, 5000);
  };

  const loadMetadata = async () => {
    if (mergeMetadataCache) {
      setMetadataByKey(mergeMetadataCache);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('retrieve-token', {
        body: {
          action: 'list_metadata',
          orgId: company.id,
        },
      });

      if (error) {
        throw new Error(await readFunctionErrorMessage(error, 'Failed to load integration metadata'));
      }

      const records = (data?.metadata || []) as MergeMetadataRecord[];
      const nextMetadataByKey: Record<string, MergeMetadataRecord> = {};

      for (const section of SECTION_CONFIG) {
        for (const integration of section.integrations) {
          const record = records.find(
            (item) => item.slug === integration.integration && item.categories?.includes(integration.category),
          );

          if (record) {
            nextMetadataByKey[getIntegrationKey(integration)] = record;
          }
        }
      }

      mergeMetadataCache = nextMetadataByKey;
      setMetadataByKey(nextMetadataByKey);
    } catch (error) {
      console.error('Failed to load Merge integration metadata', error);
      toast({
        title: 'Metadata unavailable',
        description: 'Logos could not be loaded from Merge metadata. Falling back to cached logo sources.',
        variant: 'destructive',
      });
    }
  };

  const loadConnections = async () => {
    const { data, error } = await supabase.functions.invoke('retrieve-token', {
      body: {
        action: 'list_connections',
        orgId: company.id,
      },
    });

    if (error) {
      throw new Error(await readFunctionErrorMessage(error, 'Failed to load integration connections'));
    }

    const nextConnections = ((data?.connections || []) as ConnectionSummary[]).reduce<
      Partial<Record<MergeIntegrationCategory, ConnectionSummary>>
    >((accumulator, connection) => {
      accumulator[connection.category] = connection;
      return accumulator;
    }, {});

    setConnectionsByCategory(nextConnections);

    if (selectedConnection) {
      const refreshedConnection = nextConnections[selectedConnection.category] || null;
      setSelectedConnection(refreshedConnection);
      if (!refreshedConnection) {
        setManageDialogOpen(false);
      }
    }
  };

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
  }) => {
    const nextConnection = data.connection || null;
    setSlackAdminConnection(nextConnection);
    setSlackPendingConfirmations((data.pending_confirmations || []) as SlackPendingConfirmationSummary[]);
    setSlackAvailableChannels((data.available_channels || []) as SlackChannelOption[]);
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

  const refreshAll = async (showPageSpinner = true) => {
    if (showPageSpinner) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      await Promise.all([loadMetadata(), loadConnections(), loadSlackConnection()]);
    } catch (error: any) {
      toast({
        title: 'Failed to load integrations',
        description: error.message || 'Refresh and try again.',
        variant: 'destructive',
      });
    } finally {
      if (showPageSpinner) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  const resetMergeLinkState = () => {
    setLinkToken(undefined);
    setCreatingLinkKey(null);
    setPendingIntegration(null);
    setCompletingLink(false);
  };

  const completeLink = async (integration: SupportedMergeIntegration, publicToken: string) => {
    setCompletingLink(true);

    try {
      const { data, error } = await supabase.functions.invoke('retrieve-token', {
        body: {
          action: 'exchange_public_token',
          orgId: company.id,
          category: integration.category,
          platformName: integration.name,
          integration: integration.integration,
          publicToken,
        },
      });

      if (error) {
        throw new Error(await readFunctionErrorMessage(error, 'Failed to finalize Merge connection'));
      }

      clearConnectionTest(getIntegrationKey(integration));

      toast({
        title: `${integration.name} connected`,
        description: data?.retrying
          ? 'Initial sync hit rate limiting and is retrying in the background.'
          : 'Merge account token stored and initial sync completed.',
      });

      await loadConnections();
    } catch (error: any) {
      toast({
        title: 'Connection failed',
        description: error.message || 'We could not complete the Merge token exchange.',
        variant: 'destructive',
      });
    } finally {
      resetMergeLinkState();
    }
  };

  const { open, isReady } = useMergeLink({
    linkToken,
    shouldSendTokenOnSuccessfulLink: true,
    onSuccess: (publicToken) => {
      if (pendingIntegration) {
        void completeLink(pendingIntegration, publicToken);
      }
    },
    onExit: () => {
      setLinkToken(undefined);
      if (!completingLink) {
        setCreatingLinkKey(null);
        setPendingIntegration(null);
      }
    },
  });

  useEffect(() => {
    if (!isHROrAdmin) {
      setLoading(false);
      return;
    }

    void refreshAll();
  }, [company.id, isHROrAdmin]);

  useEffect(() => {
    if (linkToken && isReady) {
      open();
    }
  }, [linkToken, isReady, open]);

  useEffect(() => {
    return () => {
      Object.values(testResetTimersRef.current).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

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
  }, [searchParams, setSearchParams, toast]);

  useEffect(() => {
    if (!slackManageOpen) {
      setSlackManageTab('overview');
      setSlackPendingActionKey(null);
      return;
    }

    if (slackConnection) {
      void loadSlackAdminState();
    }
  }, [slackManageOpen, slackConnection?.id]);

  const handleConnect = async (integration: SupportedMergeIntegration) => {
    const key = getIntegrationKey(integration);
    clearConnectionTest(key);
    setCreatingLinkKey(key);

    try {
      const { data, error } = await supabase.functions.invoke('create-link-token', {
        body: {
          orgId: company.id,
          category: integration.category,
          platformName: integration.name,
          integration: integration.integration,
        },
      });

      if (error) {
        throw new Error(await readFunctionErrorMessage(error, 'Failed to create Merge Link token'));
      }

      if (!data?.linkToken) {
        throw new Error('Merge Link token missing from response');
      }

      setPendingIntegration(integration);
      setLinkToken(data.linkToken);
    } catch (error: any) {
      setCreatingLinkKey(null);
      setPendingIntegration(null);
      toast({
        title: `Could not connect ${integration.name}`,
        description: error.message || 'Disconnect the current platform first or try again.',
        variant: 'destructive',
      });
    }
  };

  const handleTestConnection = async (integration: SupportedMergeIntegration) => {
    const key = getIntegrationKey(integration);
    clearConnectionTest(key);
    setConnectionTests((currentTests) => ({
      ...currentTests,
      [key]: { phase: 'loading' },
    }));

    try {
      const { data, error } = await supabase.functions.invoke('test-merge-connection', {
        body: {
          orgId: company.id,
          category: integration.category,
          platformName: integration.name,
        },
      });

      if (error) {
        throw new Error(await readFunctionErrorMessage(error, 'Failed to test Merge connection'));
      }

      if (data?.success) {
        setConnectionTests((currentTests) => ({
          ...currentTests,
          [key]: {
            phase: 'success',
            latencyMs: data?.latency_ms || 0,
          },
        }));
        scheduleConnectionTestReset(key);
        return;
      }

      setConnectionTests((currentTests) => ({
        ...currentTests,
        [key]: {
          phase: data?.reconnect_required ? 'error' : 'warning',
          message: data?.error || 'Connection test failed',
          reconnectRequired: Boolean(data?.reconnect_required),
        },
      }));
      await loadConnections();
    } catch (error: any) {
      setConnectionTests((currentTests) => ({
        ...currentTests,
        [key]: {
          phase: 'error',
          message: error.message || 'Connection test failed',
          reconnectRequired: false,
        },
      }));

      toast({
        title: 'Connection test failed',
        description: error.message || 'We could not verify the Merge connection right now.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenManage = (connection: ConnectionSummary) => {
    setSelectedConnection(connection);
    setManageDialogOpen(true);
  };

  const handleLogoStateChange = (integrationKey: string, isPlaceholder: boolean) => {
    setPlaceholderLogoKeys((currentKeys) => {
      if (currentKeys[integrationKey] === isPlaceholder) {
        return currentKeys;
      }

      return {
        ...currentKeys,
        [integrationKey]: isPlaceholder,
      };
    });
  };

  const handleResync = async () => {
    if (!selectedConnection) return;

    setSyncingCategory(selectedConnection.category);
    try {
      const functionName = selectedConnection.category === 'hris' ? 'sync-hris' : 'sync-ats';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          orgId: company.id,
        },
      });

      if (error) {
        throw new Error(await readFunctionErrorMessage(error, 'Manual sync failed'));
      }

      await loadConnections();

      const syncWarnings = data?.syncResult?.warnings as string[] | undefined;
      toast({
        title: syncWarnings?.length ? `${selectedConnection.platformName} synced with warnings` : `${selectedConnection.platformName} sync started`,
        description: data?.retrying
          ? 'Merge rate limiting is retrying in the background.'
          : syncWarnings?.length
            ? syncWarnings[0]
            : 'Latest data has been pulled into Supabase.',
      });
    } catch (error: any) {
      toast({
        title: 'Re-sync failed',
        description: error.message || 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setSyncingCategory(null);
    }
  };

  const handleSyncAll = async () => {
    const syncTargets = Object.values(connectionsByCategory).filter(
      (connection): connection is ConnectionSummary =>
        Boolean(connection) && connection.connectionStatus === 'connected',
    );

    if (syncTargets.length === 0) {
      toast({
        title: 'No integrations to sync',
        description: 'Connect at least one HRIS or ATS integration first.',
      });
      return;
    }

    setSyncingAll(true);

    try {
      const results = await Promise.allSettled(
        syncTargets.map(async (connection) => {
          const functionName = connection.category === 'hris' ? 'sync-hris' : 'sync-ats';
          const { data, error } = await supabase.functions.invoke(functionName, {
            body: {
              orgId: company.id,
            },
          });

          if (error) {
            throw new Error(await readFunctionErrorMessage(error, `Failed to sync ${connection.platformName}`));
          }

          return {
            platformName: connection.platformName,
            retrying: Boolean(data?.retrying),
          };
        }),
      );

      await loadConnections();

      const succeeded = results.filter((result) => result.status === 'fulfilled') as Array<
        PromiseFulfilledResult<{ platformName: string; retrying: boolean }>
      >;
      const failed = results.filter((result) => result.status === 'rejected');

      if (failed.length === 0) {
        const retryingCount = succeeded.filter((result) => result.value.retrying).length;

        toast({
          title: 'All integrations syncing',
          description:
            retryingCount > 0
              ? `${retryingCount} sync${retryingCount === 1 ? '' : 's'} hit rate limits and will continue in the background.`
              : `Started sync for ${succeeded.length} integration${succeeded.length === 1 ? '' : 's'}.`,
        });
        return;
      }

      toast({
        title: 'Some integrations could not sync',
        description: `${succeeded.length} started successfully, ${failed.length} failed. Check the connected cards and try again.`,
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: 'Sync All failed',
        description: error.message || 'We could not start syncs for your integrations.',
        variant: 'destructive',
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedConnection) return;

    setDisconnectingCategory(selectedConnection.category);
    try {
      const { error } = await supabase.functions.invoke('retrieve-token', {
        body: {
          action: 'disconnect',
          orgId: company.id,
          category: selectedConnection.category,
        },
      });

      if (error) {
        throw new Error(await readFunctionErrorMessage(error, 'Disconnect failed'));
      }

      const currentIntegration =
        findSupportedIntegration(selectedConnection.category, selectedConnection.platformName) ||
        (selectedConnection.integration
          ? {
              name: selectedConnection.platformName,
              category: selectedConnection.category,
              integration: selectedConnection.integration,
            }
          : null);

      if (currentIntegration) {
        clearConnectionTest(getIntegrationKey(currentIntegration));
      }
      setManageDialogOpen(false);
      setSelectedConnection(null);
      await loadConnections();

      toast({
        title: `${selectedConnection.platformName} disconnected`,
        description: 'Merge access removed and synced records were soft-deactivated.',
      });
    } catch (error: any) {
      toast({
        title: 'Disconnect failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDisconnectingCategory(null);
    }
  };

  const handleSlackConnect = async () => {
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
      toast({
        title: 'Slack disconnected',
        description: 'The workspace was disconnected without revoking the Slack token.',
      });
      setSlackAdminConnection(null);
      setSlackPendingConfirmations([]);
      setSlackAvailableChannels([]);
      setSlackSettingsState(DEFAULT_SLACK_SETTINGS);
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

  if (!isHROrAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Only company admins and HR users can manage HRIS and ATS integrations.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const matchesSearch = (integration: SupportedMergeIntegration) => {
    if (!normalizedSearchQuery) {
      return true;
    }

    const searchableText = `${integration.name} ${integration.category}`.toLowerCase();
    return searchableText.includes(normalizedSearchQuery);
  };
  const sortIntegrations = (integrations: SupportedMergeIntegration[]) =>
    integrations.slice().sort((left, right) => {
      const leftKey = getIntegrationKey(left);
      const rightKey = getIntegrationKey(right);
      const leftRank = placeholderLogoKeys[leftKey] ? 1 : 0;
      const rightRank = placeholderLogoKeys[rightKey] ? 1 : 0;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      if (left.category !== right.category) {
        return left.category.localeCompare(right.category);
      }

      return left.name.localeCompare(right.name);
    });

  const sectionDisplayState = SECTION_CONFIG.map((section) => {
    const activeConnection = connectionsByCategory[section.category] || null;
    const hasLockedPrimary = Boolean(activeConnection && activeConnection.connectionStatus !== 'disconnected');
    const connectedIntegration =
      hasLockedPrimary && activeConnection
        ? findSupportedIntegration(section.category, activeConnection.platformName)
        : null;

    const integrations =
      activeView === 'mine'
        ? connectedIntegration
          ? [connectedIntegration].filter(matchesSearch)
          : []
        : connectedIntegration
          ? [connectedIntegration].filter(matchesSearch)
          : sortIntegrations(section.integrations.filter(matchesSearch));

    const otherIntegrations =
      activeView === 'all' && connectedIntegration
        ? sortIntegrations(
            section.integrations.filter(
              (integration) => integration.integration !== connectedIntegration.integration && matchesSearch(integration),
            ),
          )
        : [];

    return {
      ...section,
      integrations,
      otherIntegrations,
      hasLockedPrimary,
    };
  });

  const primarySections = sectionDisplayState.filter((section) => section.integrations.length > 0);
  const otherIntegrations = sortIntegrations(sectionDisplayState.flatMap((section) => section.otherIntegrations));
  const hasOtherIntegrationsSection = activeView === 'all' && otherIntegrations.length > 0;
  const activeMergeConnectionCount = Object.values(connectionsByCategory).filter(
    (connection): connection is ConnectionSummary => Boolean(connection) && connection.connectionStatus !== 'disconnected',
  ).length;
  const activeConnectionCount = activeMergeConnectionCount;
  const shouldShowSlackCard = false;
  const visibleIntegrationCount =
    primarySections.reduce((count, section) => count + section.integrations.length, 0) +
    otherIntegrations.length;
  const selectedSlackAdminChannelValue = slackSettingsState.admin_notify_channel || '__none__';
  const slackChannelOptions = slackSettingsState.admin_notify_channel &&
    !slackAvailableChannels.some((channel) => channel.id === slackSettingsState.admin_notify_channel)
      ? [
          ...slackAvailableChannels,
          {
            id: slackSettingsState.admin_notify_channel,
            name: slackSettingsState.admin_notify_channel,
          },
        ]
      : slackAvailableChannels;

  const renderSlackCard = () => (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Slack</CardTitle>
          <Badge variant="secondary">1</Badge>
        </div>
        <CardDescription>
          Connect Slack so RoleColorFinder can post digests, send assessment invites, and respond to slash commands.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/30">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                <img src={SLACK_LOGO_URL} alt="Slack logo" className="h-full w-full object-contain p-2" loading="lazy" />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-foreground">Slack</p>
                  <Badge variant="secondary">Chat</Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={cn('h-2.5 w-2.5 rounded-full', slackConnection ? 'bg-emerald-500' : 'bg-muted-foreground/70')} />
                  <span className="font-medium">{slackConnection ? 'Connected' : 'Not Connected'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {slackConnection ? (
                <>
                  <p>Connected workspace: {slackConnection.team_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Channel: {slackConnection.incoming_webhook_channel || 'Slack app default'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Connected {new Date(slackConnection.connected_at).toLocaleString()}
                  </p>
                </>
              ) : (
                <p>Secure Slack OAuth connection for digests, slash commands, and RoleColor assessment invites.</p>
              )}
            </div>

            <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
              {slackConnection ? (
                <Button
                  className="w-full"
                  onClick={() => setSlackManageOpen(true)}
                  disabled={slackSendingTest || slackDisconnecting}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              ) : (
                <Button className="w-full" onClick={() => void handleSlackConnect()} disabled={slackConnecting || slackDisconnecting}>
                  {slackConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                  Connect Slack
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection = (
    section:
      | (PrimarySectionConfig & {
          integrations: SupportedMergeIntegration[];
          hasLockedPrimary?: boolean;
        })
      | {
          title: string;
          description: string;
          category: 'other';
          integrations: SupportedMergeIntegration[];
          hasLockedPrimary?: boolean;
        },
  ) => (
    <Card key={section.category}>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          {section.category === 'hris' ? (
            <Users className="h-4 w-4 text-muted-foreground" />
          ) : section.category === 'ats' ? (
            <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          )}
          <CardTitle>{section.title}</CardTitle>
          <Badge variant="secondary">{section.integrations.length}</Badge>
        </div>
        <CardDescription>{section.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {section.integrations.map((integration) => {
            const key = getIntegrationKey(integration);
            const metadata = metadataByKey[key] || null;
            const activeConnection = connectionsByCategory[integration.category] || null;
            const isCurrentPlatform = activeConnection?.platformName === integration.name;
            const status = getStatusPresentation(activeConnection, isCurrentPlatform);
            const isOtherPlatformActive = Boolean(
              activeConnection &&
                activeConnection.platformName !== integration.name &&
                activeConnection.connectionStatus !== 'disconnected',
            );
            const isLockedAlternative = section.category === 'other' && isOtherPlatformActive;
            const testState = connectionTests[key];
            const isTesting = testState?.phase === 'loading';
            const canRunConnectionTest = Boolean(
              isCurrentPlatform && activeConnection?.connectionStatus === 'connected',
            );
            const shouldReconnect = status.label === 'Reconnect required' || Boolean(testState?.reconnectRequired);
            const isManageAction = isCurrentPlatform && !shouldReconnect;
            const primaryActionLabel = isManageAction
              ? 'Manage'
              : shouldReconnect
                ? 'Reconnect'
                : isLockedAlternative
                  ? 'Locked'
                  : 'Connect';

            return (
              <div
                key={key}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/30"
              >
                <div className="flex items-start gap-3">
                  <PlatformLogo
                    integration={integration}
                    metadata={metadata}
                    onLogoStateChange={(isPlaceholder) => handleLogoStateChange(key, isPlaceholder)}
                  />

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-foreground">{integration.name}</p>
                      <Badge variant="secondary">{integration.category.toUpperCase()}</Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={cn('h-2.5 w-2.5 rounded-full', status.dotClassName)} />
                      <span className="font-medium">{status.label}</span>
                    </div>

                    {testState?.phase === 'success' && (
                      <p className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Connected · {testState.latencyMs}ms
                      </p>
                    )}

                    {testState?.phase === 'error' && (
                      <p className="flex items-start gap-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                        <CircleX className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{testState.message}</span>
                      </p>
                    )}

                    {testState?.phase === 'warning' && (
                      <p className="flex items-start gap-2 text-xs font-medium text-amber-700 dark:text-amber-200">
                        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{testState.message}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {status.helperText && <p>{status.helperText}</p>}

                  {isCurrentPlatform && activeConnection?.lastSyncedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last synced {new Date(activeConnection.lastSyncedAt).toLocaleString()}
                    </p>
                  )}

                  {isCurrentPlatform && integration.category === 'hris' && (
                    <p className="text-xs text-muted-foreground">
                      {activeConnection?.counts.employees || 0} employees mirrored into Supabase
                    </p>
                  )}

                  {isCurrentPlatform && integration.category === 'ats' && (
                    <p className="text-xs text-muted-foreground">
                      {(activeConnection?.counts.jobs || 0)} jobs, {(activeConnection?.counts.candidates || 0)} candidates,{' '}
                      {(activeConnection?.counts.applications || 0)} applications
                    </p>
                  )}

                  {!isCurrentPlatform && isOtherPlatformActive && (
                    <p className="text-xs text-amber-700 dark:text-amber-200">
                      Disconnect {activeConnection?.platformName} to switch your {integration.category.toUpperCase()} connection.
                    </p>
                  )}
                </div>

                <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
                  {canRunConnectionTest && (
                    <Button
                      variant="outline"
                      className="sm:flex-1"
                      onClick={() => void handleTestConnection(integration)}
                      disabled={isTesting || creatingLinkKey === key || completingLink}
                    >
                      {isTesting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Test
                    </Button>
                  )}

                  <Button
                    className={cn('w-full', canRunConnectionTest && 'sm:flex-1')}
                    variant={primaryActionLabel === 'Manage' || primaryActionLabel === 'Reconnect' ? 'default' : 'outline'}
                    onClick={() =>
                      isManageAction && activeConnection
                        ? handleOpenManage(activeConnection)
                        : void handleConnect(integration)
                    }
                    disabled={
                      creatingLinkKey === key ||
                      completingLink ||
                      isTesting ||
                      isLockedAlternative
                    }
                  >
                    {creatingLinkKey === key ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="mr-2 h-4 w-4" />
                    )}
                    {primaryActionLabel}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect one Merge-powered HRIS and one Merge-powered ATS for hiring and employee syncs.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => void refreshAll(false)} disabled={refreshing || loading}>
                {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => void handleSyncAll()}
                disabled={syncingAll || loading || activeMergeConnectionCount === 0}
              >
                {syncingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Sync All
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={activeView === 'mine' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => setActiveView('mine')}
            >
              My Integrations
              <Badge
                variant="secondary"
                className={cn(
                  'ml-2',
                  activeView === 'mine' && 'bg-background/15 text-current dark:bg-background/10',
                )}
              >
                {activeConnectionCount}
              </Badge>
            </Button>
            <Button
              type="button"
              variant={activeView === 'all' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => setActiveView('all')}
            >
              All Integrations
              <Badge
                variant="secondary"
                className={cn(
                  'ml-2',
                  activeView === 'all' && 'bg-background/15 text-current dark:bg-background/10',
                )}
              >
                {TOTAL_SUPPORTED_MERGE_INTEGRATIONS}
              </Badge>
            </Button>
          </div>

          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={
                activeView === 'mine'
                  ? 'Search my integrations...'
                  : `Search ${TOTAL_SUPPORTED_MERGE_INTEGRATIONS} integrations...`
              }
              className="h-11 rounded-xl border-border bg-background pl-10 pr-10"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">Supported platforms</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{TOTAL_SUPPORTED_MERGE_INTEGRATIONS}</p>
              <p className="mt-1 text-xs text-muted-foreground">Merge-powered HRIS and ATS integrations</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">Current connections</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{activeConnectionCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">One live Merge linked account per category</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">
                {activeView === 'mine' ? 'My integrations' : 'Search coverage'}
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {normalizedSearchQuery || activeView === 'mine'
                  ? visibleIntegrationCount
                  : TOTAL_SUPPORTED_MERGE_INTEGRATIONS}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {activeView === 'mine' ? 'Connected platforms for this org' : 'Cards matching name or category'}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {shouldShowSlackCard && renderSlackCard()}

      {primarySections.map((section) => renderSection(section))}

      {hasOtherIntegrationsSection &&
        renderSection({
          title: 'Other Integrations',
          description:
            'Additional HRIS and ATS platforms supported by Merge. Disconnect your current primary HRIS or ATS connection to switch to one of these.',
          category: 'other',
          integrations: otherIntegrations,
        })}

      {!loading && primarySections.length === 0 && !hasOtherIntegrationsSection && !shouldShowSlackCard && normalizedSearchQuery && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No integrations found for '{searchQuery.trim()}'
          </CardContent>
        </Card>
      )}

      {!loading && primarySections.length === 0 && !hasOtherIntegrationsSection && !shouldShowSlackCard && activeView === 'mine' && !normalizedSearchQuery && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No integrations connected yet.
          </CardContent>
        </Card>
      )}

      <Dialog
        open={slackManageOpen}
        onOpenChange={(openState) => {
          setSlackManageOpen(openState);
        }}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Slack connection</DialogTitle>
            <DialogDescription>
              Review the connected workspace, tune Slack onboarding settings, and work through pending confirmations
              without leaving the Integrations tab.
            </DialogDescription>
          </DialogHeader>

          {slackConnection && (
            <Tabs value={slackManageTab} onValueChange={(value) => setSlackManageTab(value as 'overview' | 'settings')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
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
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    RoleColorFinder can post digests, send assessment invites, respond to slash commands, and now
                    govern Slack member onboarding through admin-controlled matching rules.
                  </p>
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

      <Dialog
        open={manageDialogOpen}
        onOpenChange={(openState) => {
          setManageDialogOpen(openState);
          if (!openState) {
            setSelectedConnection(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedConnection?.platformName || 'Integration'} details</DialogTitle>
            <DialogDescription>
              Review sync status, record counts, and disconnect this Merge-linked account if needed.
            </DialogDescription>
          </DialogHeader>

          {selectedConnection && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={getStatusPresentation(selectedConnection, true).badgeClassName}>
                      {getStatusPresentation(selectedConnection, true).label}
                    </Badge>
                    <Badge variant="secondary">{selectedConnection.category.toUpperCase()}</Badge>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Last synced</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {selectedConnection.lastSyncedAt
                      ? new Date(selectedConnection.lastSyncedAt).toLocaleString()
                      : 'No successful sync yet'}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {selectedConnection.category === 'hris' ? (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserRound className="h-4 w-4" />
                      <span className="text-sm font-medium">Employees</span>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{selectedConnection.counts.employees}</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BriefcaseBusiness className="h-4 w-4" />
                        <span className="text-sm font-medium">Jobs</span>
                      </div>
                      <p className="mt-2 text-2xl font-semibold text-foreground">{selectedConnection.counts.jobs}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">Candidates</span>
                      </div>
                      <p className="mt-2 text-2xl font-semibold text-foreground">{selectedConnection.counts.candidates}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Link2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Applications</span>
                      </div>
                      <p className="mt-2 text-2xl font-semibold text-foreground">{selectedConnection.counts.applications}</p>
                    </div>
                  </>
                )}
              </div>

              {selectedConnection.connectionStatus === 'reconnect_required' && (
                <div className="rounded-xl border border-amber-300/60 bg-amber-500/10 p-4 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4" />
                    <p>Merge reported that this account needs to be reconnected before sync can continue.</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => void handleResync()}
                  disabled={syncingCategory === selectedConnection.category || disconnectingCategory === selectedConnection.category}
                >
                  {syncingCategory === selectedConnection.category ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Re-sync now
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void handleDisconnect()}
                  disabled={disconnectingCategory === selectedConnection.category || syncingCategory === selectedConnection.category}
                >
                  {disconnectingCategory === selectedConnection.category ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Unplug className="mr-2 h-4 w-4" />
                  )}
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {loading && (
        <Card>
          <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Slack and Merge integrations...
          </CardContent>
        </Card>
      )}
    </div>
  );
}
