import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import {
  Activity,
  UserPlus,
  ClipboardCheck,
  Briefcase,
  Mail,
  Sparkles,
  UserCheck,
  Settings,
  RefreshCw,
  ChevronRight,
  DollarSign,
  GitBranch,
  Calendar,
  FileCheck,
  CreditCard,
  TrendingDown,
  Users,
  Bell,
  Key,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UnifiedActivity {
  id: string;
  icon: React.ElementType;
  message: string;
  color: string;
  actorInitial: string;
  actorLabel?: string;
  badge?: string;
  badgeColor?: string;
  created_at: string;
}

interface ActivityFeedProps {
  companyId: string;
  maxItems?: number;
  onViewAll?: () => void;
}

// ─── Candidate activity type → display ───────────────────────────────────────
function mapCandidateActivity(row: Record<string, any>): UnifiedActivity {
  const actorName = row.performed_by_name || 'Someone';
  const meta = (typeof row.metadata === 'object' && row.metadata !== null) ? row.metadata as Record<string, string> : {};
  const candidateName = meta.candidate_name || meta.name || row.title || 'A candidate';
  const jobTitle = meta.job_title || meta.position || '';
  const stageName = meta.stage_name || meta.to_stage || '';

  const typeMap: Record<string, { icon: React.ElementType; message: string; color: string; badge?: string; badgeColor?: string }> = {
    application_received: {
      icon: UserPlus,
      message: `New application received${jobTitle ? ` for ${jobTitle}` : ''}`,
      color: 'text-blue-500',
      badge: 'New Application',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    stage_changed: {
      icon: GitBranch,
      message: `${candidateName} moved to ${stageName || 'next stage'}`,
      color: 'text-purple-500',
    },
    interview_scheduled: {
      icon: Calendar,
      message: `Interview scheduled for ${candidateName}`,
      color: 'text-orange-500',
      badge: 'Interview',
      badgeColor: 'bg-orange-100 text-orange-700',
    },
    interview_completed: {
      icon: ClipboardCheck,
      message: `Interview completed for ${candidateName}`,
      color: 'text-green-500',
    },
    offer_sent: {
      icon: FileCheck,
      message: `Offer sent to ${candidateName}`,
      color: 'text-indigo-500',
      badge: 'Offer',
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    hired: {
      icon: UserCheck,
      message: `${candidateName} was hired${jobTitle ? ` as ${jobTitle}` : ''}`,
      color: 'text-emerald-500',
      badge: 'Hired',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    rejected: {
      icon: Activity,
      message: `${candidateName} was not selected`,
      color: 'text-muted-foreground',
    },
    withdrawn: {
      icon: Activity,
      message: `${candidateName} withdrew their application`,
      color: 'text-muted-foreground',
    },
    note_added: {
      icon: Bell,
      message: `${actorName} added a note for ${candidateName}`,
      color: 'text-gray-500',
    },
  };

  const mapped = typeMap[row.activity_type] || {
    icon: Activity,
    message: row.title || `${actorName} updated a candidate`,
    color: 'text-muted-foreground',
  };

  return {
    id: `ca-${row.id}`,
    icon: mapped.icon,
    message: mapped.message,
    color: mapped.color,
    actorInitial: (actorName.charAt(0) || 'S').toUpperCase(),
    actorLabel: actorName,
    badge: mapped.badge,
    badgeColor: mapped.badgeColor,
    created_at: row.created_at,
  };
}

// ─── Billing credit → display ────────────────────────────────────────────────
function mapBillingCredit(row: Record<string, any>): UnifiedActivity {
  const amountDollars = Math.abs(Number(row.amount) || 0).toFixed(2);
  const isRemoval = Number(row.amount) < 0 || row.type === 'super_admin_credit_removal';

  const typeMap: Record<string, { icon: React.ElementType; message: string; color: string; badge?: string; badgeColor?: string }> = {
    super_admin_free_credit: {
      icon: DollarSign,
      message: `$${amountDollars} in free credits added to account`,
      color: 'text-emerald-500',
      badge: 'Credits Added',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    super_admin_paid_credit: {
      icon: CreditCard,
      message: `$${amountDollars} in credits added via card charge`,
      color: 'text-emerald-500',
      badge: 'Credits Added',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    super_admin_credit_removal: {
      icon: TrendingDown,
      message: `$${amountDollars} in credits removed from account`,
      color: 'text-red-500',
      badge: 'Credits Removed',
      badgeColor: 'bg-red-100 text-red-700',
    },
    payment: {
      icon: CreditCard,
      message: `Payment of $${amountDollars} processed`,
      color: 'text-blue-500',
    },
    refund: {
      icon: RefreshCw,
      message: `Refund of $${amountDollars} issued`,
      color: 'text-yellow-500',
    },
    credit_used: {
      icon: DollarSign,
      message: `$${amountDollars} in credits used for subscription`,
      color: 'text-orange-500',
    },
    manual: {
      icon: DollarSign,
      message: `$${amountDollars} credit adjustment`,
      color: 'text-gray-500',
    },
  };

  const mapped = typeMap[row.type] || {
    icon: isRemoval ? TrendingDown : DollarSign,
    message: row.description || `$${amountDollars} billing event`,
    color: isRemoval ? 'text-red-500' : 'text-emerald-500',
  };

  return {
    id: `bc-${row.id}`,
    icon: mapped.icon,
    message: mapped.message,
    color: mapped.color,
    actorInitial: '$',
    actorLabel: 'Billing',
    badge: mapped.badge,
    badgeColor: mapped.badgeColor,
    created_at: row.created_at,
  };
}

// ─── Company user invite → display ───────────────────────────────────────────
function mapUserInvite(row: Record<string, any>): UnifiedActivity {
  const displayName = row.full_name || row.email;
  const roleLabel = row.role === 'admin' ? 'admin' : row.role === 'hr' ? 'HR member' : row.role === 'partner' ? 'partner' : 'team member';
  return {
    id: `ui-${row.id}`,
    icon: Mail,
    message: `${displayName} was invited as a ${roleLabel}`,
    color: 'text-purple-500',
    actorInitial: (row.email?.charAt(0) || 'U').toUpperCase(),
    actorLabel: row.email,
    badge: 'Invited',
    badgeColor: 'bg-purple-100 text-purple-700',
    created_at: row.invited_at,
  };
}

// ─── Assessment completion → display ─────────────────────────────────────────
function mapAssessmentCompletion(row: Record<string, any>): UnifiedActivity {
  const displayName = row.full_name || row.email;
  return {
    id: `ac-${row.id}`,
    icon: ClipboardCheck,
    message: `${displayName} completed their assessment`,
    color: 'text-green-500',
    actorInitial: (displayName?.charAt(0) || 'U').toUpperCase(),
    actorLabel: row.email,
    badge: 'Assessment Done',
    badgeColor: 'bg-green-100 text-green-700',
    created_at: row.assessment_completed_at,
  };
}

// ─── User joined (accepted invite) → display ──────────────────────────────────
function mapUserJoined(row: Record<string, any>): UnifiedActivity {
  const displayName = row.full_name || row.email;
  return {
    id: `uj-${row.id}-joined`,
    icon: Users,
    message: `${displayName} joined the company portal`,
    color: 'text-blue-500',
    actorInitial: (displayName?.charAt(0) || 'U').toUpperCase(),
    actorLabel: row.email,
    badge: 'Joined',
    badgeColor: 'bg-blue-100 text-blue-700',
    created_at: row.joined_at,
  };
}

// ─── Audit log → display ─────────────────────────────────────────────────────
function mapAuditLog(row: Record<string, any>): UnifiedActivity {
  const { action, entity_type, user_email } = row;
  const userName = user_email?.split('@')[0] || 'Someone';
  const details = (typeof row.details === 'object' && row.details !== null) ? row.details as Record<string, string> : {};

  if (entity_type === 'assessment' && action === 'complete') {
    const name = details.employee_name || details.candidate_name || 'Someone';
    return { id: `al-${row.id}`, icon: ClipboardCheck, message: `${name} completed their assessment`, color: 'text-green-500', actorInitial: name.charAt(0).toUpperCase(), actorLabel: user_email, created_at: row.created_at };
  }
  if (entity_type === 'user' && action === 'invite') {
    const email = details.email || 'a new user';
    return { id: `al-${row.id}`, icon: Mail, message: `${userName} invited ${email}`, color: 'text-purple-500', actorInitial: userName.charAt(0).toUpperCase(), actorLabel: user_email, badge: 'Invited', badgeColor: 'bg-purple-100 text-purple-700', created_at: row.created_at };
  }
  if (entity_type === 'candidate' && action === 'invite') {
    const name = details.name || details.email || 'a candidate';
    return { id: `al-${row.id}`, icon: UserPlus, message: `${userName} invited ${name} as candidate`, color: 'text-blue-500', actorInitial: userName.charAt(0).toUpperCase(), actorLabel: user_email, created_at: row.created_at };
  }
  if (entity_type === 'candidate' && action === 'hire') {
    const name = details.name || 'A candidate';
    return { id: `al-${row.id}`, icon: UserCheck, message: `${name} was hired`, color: 'text-emerald-500', actorInitial: (details.name?.charAt(0) || 'C').toUpperCase(), actorLabel: user_email, badge: 'Hired', badgeColor: 'bg-emerald-100 text-emerald-700', created_at: row.created_at };
  }
  if (entity_type === 'insights' || action === 'generate_insights') {
    return { id: `al-${row.id}`, icon: Sparkles, message: `${userName} generated team insights`, color: 'text-yellow-500', actorInitial: userName.charAt(0).toUpperCase(), actorLabel: user_email, created_at: row.created_at };
  }
  if (entity_type === 'settings' || entity_type === 'company') {
    return { id: `al-${row.id}`, icon: Settings, message: `${userName} updated company settings`, color: 'text-gray-500', actorInitial: userName.charAt(0).toUpperCase(), actorLabel: user_email, created_at: row.created_at };
  }
  if (entity_type === 'api_key') {
    const keyAction = action === 'create' ? 'created an API key' : action === 'revoke' ? 'revoked an API key' : `${action} an API key`;
    return { id: `al-${row.id}`, icon: Key, message: `${userName} ${keyAction}`, color: 'text-gray-500', actorInitial: userName.charAt(0).toUpperCase(), actorLabel: user_email, created_at: row.created_at };
  }
  if (entity_type === 'payment' || entity_type === 'billing') {
    const amount = details.amount ? `$${details.amount}` : '';
    return { id: `al-${row.id}`, icon: DollarSign, message: `${amount} billing event: ${action}`, color: 'text-emerald-500', actorInitial: '$', actorLabel: 'Billing', created_at: row.created_at };
  }
  if (entity_type === 'user' && action === 'revoke') {
    const email = details.email || 'a user';
    return { id: `al-${row.id}`, icon: Activity, message: `${userName} revoked access for ${email}`, color: 'text-red-500', actorInitial: userName.charAt(0).toUpperCase(), actorLabel: user_email, created_at: row.created_at };
  }
  if (entity_type === 'user' && action === 'restore') {
    const email = details.email || 'a user';
    return { id: `al-${row.id}`, icon: RefreshCw, message: `${userName} restored access for ${email}`, color: 'text-blue-500', actorInitial: userName.charAt(0).toUpperCase(), actorLabel: user_email, created_at: row.created_at };
  }

  return {
    id: `al-${row.id}`,
    icon: Activity,
    message: `${userName} ${action} ${entity_type}`,
    color: 'text-muted-foreground',
    actorInitial: userName.charAt(0).toUpperCase(),
    actorLabel: user_email,
    created_at: row.created_at,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ActivityFeed({ companyId, maxItems = 10, onViewAll }: ActivityFeedProps) {
  const [activities, setActivities] = useState<UnifiedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - 90);
      const sinceIso = since.toISOString();
      const fetchLimit = maxItems * 3; // fetch more from each source before merging

      const [auditRes, inviteRes, completionRes, joinedRes, creditsRes, candidateActRes] = await Promise.allSettled([
        // 1. Audit logs
        supabase
          .from('audit_logs')
          .select('id, action, entity_type, entity_id, user_email, details, created_at')
          .eq('company_id', companyId)
          .gte('created_at', sinceIso)
          .order('created_at', { ascending: false })
          .limit(fetchLimit),

        // 2. User invites (from company_users)
        supabase
          .from('company_users')
          .select('id, email, full_name, role, invited_at')
          .eq('company_id', companyId)
          .not('invited_at', 'is', null)
          .gte('invited_at', sinceIso)
          .order('invited_at', { ascending: false })
          .limit(fetchLimit),

        // 3. Assessment completions (from company_users)
        supabase
          .from('company_users')
          .select('id, email, full_name, assessment_completed_at')
          .eq('company_id', companyId)
          .not('assessment_completed_at', 'is', null)
          .gte('assessment_completed_at', sinceIso)
          .order('assessment_completed_at', { ascending: false })
          .limit(fetchLimit),

        // 4. Users who joined (accepted invite)
        supabase
          .from('company_users')
          .select('id, email, full_name, joined_at')
          .eq('company_id', companyId)
          .not('joined_at', 'is', null)
          .gte('joined_at', sinceIso)
          .order('joined_at', { ascending: false })
          .limit(fetchLimit),

        // 5. Billing credits
        supabase
          .from('billing_credits')
          .select('id, amount, type, description, created_at')
          .eq('company_id', companyId)
          .gte('created_at', sinceIso)
          .order('created_at', { ascending: false })
          .limit(fetchLimit),

        // 6. Candidate activities (ATS pipeline)
        supabase
          .from('candidate_activities')
          .select('id, activity_type, title, description, performed_by_name, metadata, created_at')
          .eq('company_id', companyId)
          .gte('created_at', sinceIso)
          .order('created_at', { ascending: false })
          .limit(fetchLimit),
      ]);

      const unified: UnifiedActivity[] = [];
      const seenIds = new Set<string>();

      const addItem = (item: UnifiedActivity) => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          unified.push(item);
        }
      };

      // Map audit logs
      if (auditRes.status === 'fulfilled' && auditRes.value.data) {
        auditRes.value.data.forEach((row) => addItem(mapAuditLog(row)));
      }

      // Map user invites — skip if already present in audit_logs (same entity)
      if (inviteRes.status === 'fulfilled' && inviteRes.value.data) {
        inviteRes.value.data.forEach((row) => addItem(mapUserInvite(row)));
      }

      // Map assessment completions
      if (completionRes.status === 'fulfilled' && completionRes.value.data) {
        completionRes.value.data.forEach((row) => addItem(mapAssessmentCompletion(row)));
      }

      // Map joined users
      if (joinedRes.status === 'fulfilled' && joinedRes.value.data) {
        joinedRes.value.data.forEach((row) => addItem(mapUserJoined(row)));
      }

      // Map billing credits
      if (creditsRes.status === 'fulfilled' && creditsRes.value.data) {
        creditsRes.value.data.forEach((row) => addItem(mapBillingCredit(row)));
      }

      // Map candidate activities
      if (candidateActRes.status === 'fulfilled' && candidateActRes.value.data) {
        candidateActRes.value.data.forEach((row) => addItem(mapCandidateActivity(row)));
      }

      // Sort by date descending, take top maxItems
      unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setActivities(unified.slice(0, maxItems));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, maxItems]);

  useEffect(() => {
    fetchActivities();

    // Subscribe to realtime inserts on audit_logs to refresh on new events
    const channel = supabase
      .channel(`activity-feed-${companyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs', filter: `company_id=eq.${companyId}` },
        () => { fetchActivities(); }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'billing_credits', filter: `company_id=eq.${companyId}` },
        () => { fetchActivities(); }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'candidate_activities', filter: `company_id=eq.${companyId}` },
        () => { fetchActivities(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, maxItems, fetchActivities]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-xs">
              Latest actions across your workspace
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={fetchActivities}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[300px] pr-4">
          {loading && activities.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Loading activity...
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p>No recent activity</p>
              <p className="text-xs mt-1 opacity-70">Activity from the last 90 days will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {item.actorInitial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${item.color}`} />
                        <p className="text-sm">{item.message}</p>
                        {item.badge && (
                          <Badge className={`text-[10px] px-1.5 py-0 h-4 border-0 font-medium ${item.badgeColor}`}>
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {onViewAll && activities.length > 0 && (
          <Button
            variant="ghost"
            className="w-full mt-3 text-xs h-8"
            onClick={onViewAll}
          >
            View All Activity
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
