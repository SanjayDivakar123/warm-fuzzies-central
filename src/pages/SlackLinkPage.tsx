import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { CheckCircle2, Link2, Loader2, ShieldAlert, UserRound } from 'lucide-react';

interface SlackLinkConfirmationState {
  confirmation: {
    id: string;
    org_id: string;
    slack_email: string | null;
    slack_display_name: string | null;
    slack_real_name: string | null;
    slack_title: string | null;
    slack_avatar_url: string | null;
    matched_rcf_name: string | null;
    matched_rcf_role: string | null;
    matched_rcf_color: string | null;
    match_type: 'exact_email' | 'fuzzy_name' | 'none' | null;
    match_confidence: number | null;
    status:
      | 'pending'
      | 'confirmed'
      | 'rejected'
      | 'expired'
      | 'ignored'
      | 'auto_created'
      | 'admin_approved'
      | 'admin_rejected';
    expires_at: string;
  } | null;
  company: {
    id: string;
    name: string;
    subdomain: string | null;
  } | null;
  viewer: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  } | null;
}

const getStatusCopy = (status: SlackLinkConfirmationState['confirmation']['status']) => {
  switch (status) {
    case 'confirmed':
      return {
        title: 'Slack linked',
        description: 'Your Slack account is already linked to your RoleColorFinder profile.',
      };
    case 'rejected':
      return {
        title: 'Link declined',
        description: 'This Slack account was marked as not yours.',
      };
    case 'expired':
      return {
        title: 'Link expired',
        description: 'The confirmation window expired. Ask your admin to resend the Slack link.',
      };
    case 'ignored':
      return {
        title: 'Skipped by settings',
        description: 'Your admin chose not to create or link an RCF account automatically.',
      };
    case 'auto_created':
      return {
        title: 'Account created',
        description: 'RoleColorFinder already created an account and sent the Slack assessment invite.',
      };
    case 'admin_approved':
      return {
        title: 'Approved by admin',
        description: 'Your admin already handled this Slack onboarding request.',
      };
    case 'admin_rejected':
      return {
        title: 'Rejected by admin',
        description: 'Your admin chose not to link or create an RCF account for this Slack member.',
      };
    default:
      return {
        title: 'Confirm Slack account',
        description: 'Review the Slack profile below and decide whether it should link to your current RoleColorFinder account.',
      };
  }
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

export default function SlackLinkPage() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(true);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [state, setState] = useState<SlackLinkConfirmationState | null>(null);
  const [submittingAction, setSubmittingAction] = useState<'confirm' | 'reject' | null>(null);

  const loadState = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setSessionMissing(true);
        setState(null);
        return;
      }

      setSessionMissing(false);

      const { data, error } = await supabase.functions.invoke('slack-link-confirmation', {
        body: {
          action: 'fetch',
          token,
        },
      });

      if (error) {
        throw new Error(error.message || 'Could not load the Slack confirmation.');
      }

      setState((data as SlackLinkConfirmationState) || null);
    } catch (error: any) {
      toast({
        title: 'Could not load Slack link',
        description: error.message || 'Try refreshing after signing in.',
        variant: 'destructive',
      });
      setState(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadState();
  }, [token]);

  const handleAction = async (action: 'confirm' | 'reject') => {
    if (!token) {
      return;
    }

    setSubmittingAction(action);

    try {
      const { data, error } = await supabase.functions.invoke('slack-link-confirmation', {
        body: {
          action,
          token,
        },
      });

      if (error) {
        throw new Error(error.message || `Could not ${action} the Slack link.`);
      }

      toast({
        title: action === 'confirm' ? 'Slack linked' : 'Slack link declined',
        description:
          (data as { message?: string } | null)?.message ||
          (action === 'confirm'
            ? 'Your Slack account is now linked to RoleColorFinder.'
            : 'This Slack account was marked as not yours.'),
      });

      await loadState();
    } catch (error: any) {
      toast({
        title: action === 'confirm' ? 'Link failed' : 'Update failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingAction(null);
    }
  };

  const statusCopy = useMemo(
    () => getStatusCopy(state?.confirmation?.status || 'pending'),
    [state?.confirmation?.status],
  );

  const showActionButtons =
    state?.confirmation?.status === 'pending' && Boolean(state?.viewer) && !sessionMissing && !loading;

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="space-y-2">
          <Badge variant="secondary" className="w-fit">
            Slack Integration
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Link your Slack account</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            RoleColorFinder uses this secure page to confirm that the Slack profile belongs to the RCF account you’re
            signed into right now.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{statusCopy.title}</CardTitle>
            <CardDescription>{statusCopy.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {!token && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                This Slack link is missing its confirmation token.
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading the Slack confirmation...
              </div>
            )}

            {!loading && sessionMissing && (
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-5">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  Sign in to RoleColorFinder first, then reopen this Slack link.
                </div>
                <Button asChild>
                  <Link to="/auth">
                    <Link2 className="mr-2 h-4 w-4" />
                    Sign in
                  </Link>
                </Button>
              </div>
            )}

            {!loading && !sessionMissing && !state?.confirmation && (
              <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                This Slack confirmation could not be found.
              </div>
            )}

            {!loading && state?.confirmation && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-muted/30 p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Slack Profile</p>
                    <div className="mt-4 flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background">
                        {state.confirmation.slack_avatar_url ? (
                          <img
                            src={state.confirmation.slack_avatar_url}
                            alt={`${state.confirmation.slack_real_name || state.confirmation.slack_display_name || 'Slack'} avatar`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-base font-semibold text-foreground">
                          {state.confirmation.slack_real_name ||
                            state.confirmation.slack_display_name ||
                            state.confirmation.slack_email ||
                            'Slack member'}
                        </p>
                        {state.confirmation.slack_email && (
                          <p className="text-sm text-muted-foreground">{state.confirmation.slack_email}</p>
                        )}
                        {state.confirmation.slack_title && (
                          <p className="text-sm text-muted-foreground">{state.confirmation.slack_title}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <Badge variant="outline">
                            {state.confirmation.match_type === 'exact_email'
                              ? 'Email match'
                              : state.confirmation.match_type === 'fuzzy_name'
                                ? 'Name match'
                                : 'No match'}
                          </Badge>
                          {state.confirmation.match_type === 'fuzzy_name' &&
                            typeof state.confirmation.match_confidence === 'number' && (
                              <Badge variant="secondary">{state.confirmation.match_confidence}% confidence</Badge>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/30 p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current RCF Account</p>
                    {state.viewer ? (
                      <div className="mt-4 space-y-2 text-sm">
                        <p className="font-semibold text-foreground">
                          {state.viewer.full_name || state.viewer.email}
                        </p>
                        <p className="text-muted-foreground">{state.viewer.email}</p>
                        <Badge variant="secondary" className="capitalize">
                          {state.viewer.role}
                        </Badge>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-200">
                        You’re signed in, but this Slack token doesn’t map to a company membership on your current RCF
                        account.
                      </div>
                    )}
                  </div>
                </div>

                {state.confirmation.matched_rcf_name && (
                  <div className="rounded-2xl border border-border bg-muted/20 p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Suggested Match</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                      <p className="font-semibold text-foreground">{state.confirmation.matched_rcf_name}</p>
                      {state.confirmation.matched_rcf_role && (
                        <Badge variant="outline">{state.confirmation.matched_rcf_role}</Badge>
                      )}
                      {state.confirmation.matched_rcf_color && (
                        <Badge className={cn('border', roleColorBadgeClass(state.confirmation.matched_rcf_color))}>
                          {state.confirmation.matched_rcf_color}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {showActionButtons && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => void handleAction('reject')}
                      disabled={Boolean(submittingAction)}
                    >
                      {submittingAction === 'reject' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      This isn&apos;t my account
                    </Button>
                    <Button onClick={() => void handleAction('confirm')} disabled={Boolean(submittingAction)}>
                      {submittingAction === 'confirm' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Yes, link my Slack account
                    </Button>
                  </div>
                )}

                {!showActionButtons && state.confirmation.status !== 'pending' && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    This Slack confirmation has already been handled.
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {state.company && (
                    <Button asChild variant="outline">
                      <Link to={`/b2b/company-portal?company=${state.company.id}&tab=settings&settingsTab=integrations`}>
                        Back to Integrations
                      </Link>
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Confirmation expires {state.confirmation.expires_at ? new Date(state.confirmation.expires_at).toLocaleString() : 'soon'}.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
