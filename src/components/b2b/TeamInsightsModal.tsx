import { useState, useEffect, useCallback } from 'react';
import { logAuditEvent, AUDIT_ENTITIES } from '@/lib/auditLogger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Loader2, 
  Lightbulb, 
  AlertTriangle, 
  ArrowRight, 
  Users, 
  RefreshCw, 
  CheckCircle2, 
  Target,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Clock,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AIFollowUpChat from './AIFollowUpChat';
import { ExpandableText, ExpandableOverview } from '@/components/ui/expandable-text';
import { InsightUsageMeter, type InsightUsage } from './InsightUsageMeter';
import InsightPaywallModal from './InsightPaywallModal';
import { getInsightUsage, incrementInsightUsage } from '@/lib/insightMetering';

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  job_role: string | null;
  skills: string[] | null;
  dominantColor: string;
  scores: {
    yellow: number;
    red: number;
    green: number;
    blue: number;
  };
}

interface PendingTeamMember {
  id: string;
  email: string;
  full_name: string | null;
  job_role: string | null;
}

interface MemberInsight {
  email: string;
  name?: string;
  currentRole: string;
  dominantColor: string;
  fitScore: 'excellent' | 'good' | 'moderate' | 'mismatch';
  matchPercentage: number;
  matchAnalysis: string;
  strengths: string[];
  developmentAreas: string[];
  suggestedRoles: string[];
  leadershipStyle: string;
  workplaceContribution: string;
  potentialChallenges: string;
  actionableAdvice: string;
}

interface InsightData {
  overallAnalysis: string;
  teamStrengths: string[];
  teamChallenges: string[];
  teamDynamics: string;
  memberInsights: MemberInsight[];
  recommendations: string[];
}

interface TeamInsightsModalProps {
  open: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  pendingMembers?: PendingTeamMember[];
  companyId: string;
  onBillingUpdated?: () => void;
}

const colorInfo: Record<string, { label: string; color: string; bgLight: string; description: string }> = {
  yellow: { 
    label: 'Executor', 
    color: '#EAB308', 
    bgLight: 'bg-yellow-50 dark:bg-yellow-950/30',
    description: 'Action-oriented, results-driven' 
  },
  red: { 
    label: 'Motivator', 
    color: '#EF4444', 
    bgLight: 'bg-red-50 dark:bg-red-950/30',
    description: 'Inspiring, people-focused' 
  },
  green: { 
    label: 'Organizer', 
    color: '#22C55E', 
    bgLight: 'bg-green-50 dark:bg-green-950/30',
    description: 'Structured, detail-oriented' 
  },
  blue: { 
    label: 'Innovator', 
    color: '#3B82F6', 
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
    description: 'Creative, visionary' 
  },
};

const fitScoreStyles: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  excellent: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-300', icon: CheckCircle2 },
  good: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-800 dark:text-blue-300', icon: TrendingUp },
  moderate: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-800 dark:text-yellow-300', icon: AlertCircle },
  mismatch: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-300', icon: AlertTriangle },
};

const loadingStages = [
  { label: 'Analyzing team data', progress: 18 },
  { label: 'Comparing role-color patterns', progress: 38 },
  { label: 'Calculating match scores', progress: 58 },
  { label: 'Generating individual insights', progress: 78 },
  { label: 'Finalizing recommendations', progress: 92 },
];

// Generate a hash of team members to detect changes (includes scores to detect assessment changes)
function generateTeamHash(teamMembers: TeamMember[]): string {
  const sortedMembers = [...teamMembers].sort((a, b) => a.email.localeCompare(b.email));
  const hashData = sortedMembers.map(m => 
    `${m.email}:${m.job_role}:${m.dominantColor}:${m.scores.yellow}-${m.scores.red}-${m.scores.green}-${m.scores.blue}`
  ).join('|');
  return btoa(hashData);
}

export default function TeamInsightsModal({
  open,
  onClose,
  teamMembers,
  pendingMembers = [],
  companyId,
  onBillingUpdated,
}: TeamInsightsModalProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [usage, setUsage] = useState<InsightUsage | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [cachedHash, setCachedHash] = useState<string | null>(null);
  const [newMembersCount, setNewMembersCount] = useState(0);
  const [removedMembersCount, setRemovedMembersCount] = useState(0);
  const [hasTeamChanges, setHasTeamChanges] = useState(false);
  const [showRedoConfirm, setShowRedoConfirm] = useState(false);
  const [processingPaidRedo, setProcessingPaidRedo] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMode, setLoadingMode] = useState<'standard' | 'quick-replay'>('standard');
  const { toast } = useToast();

  const toDisplayLimit = (used: number) => Math.max(3, used);
  const normalizeEmail = (email: string) => email.trim().toLowerCase();

  const getCoverageCounts = useCallback((cachedInsights: InsightData | null | undefined) => {
    const cachedEmails = new Set(
      (cachedInsights?.memberInsights || []).map((member) => normalizeEmail(member.email))
    );
    const currentEmails = new Set(
      teamMembers.map((member) => normalizeEmail(member.email))
    );

    const notIncludedCount = teamMembers.filter(
      (member) => !cachedEmails.has(normalizeEmail(member.email))
    ).length;
    const removedCount = (cachedInsights?.memberInsights || []).filter(
      (member) => !currentEmails.has(normalizeEmail(member.email))
    ).length;

    return { notIncludedCount, removedCount };
  }, [teamMembers]);

  const currentTeamHash = generateTeamHash(teamMembers);
  const hasMatchingCachedTeam =
    !!cachedHash &&
    cachedHash === currentTeamHash &&
    newMembersCount === 0 &&
    removedMembersCount === 0;

  // Load cached insights when modal opens
  useEffect(() => {
    if (open) {
      loadCachedInsights();
    }
  }, [open, companyId]);

  // Lock background scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow || '';
      document.body.style.overflow = prevBodyOverflow || '';
    };
  }, [open]);

  useEffect(() => {
    if (!loading) {
      setLoadingStageIndex(0);
      setLoadingProgress(0);
      setLoadingMode('standard');
      return;
    }

    const stageDurationMs = loadingMode === 'quick-replay' ? 240 : 2200;
    setLoadingStageIndex(0);
    setLoadingProgress(loadingMode === 'quick-replay' ? 8 : loadingStages[0].progress);
    let nextIndex = 0;
    const intervalId = window.setInterval(() => {
      nextIndex = Math.min(nextIndex + 1, loadingStages.length - 1);
      setLoadingStageIndex(nextIndex);
      const targetProgress = loadingStages[nextIndex].progress;
      setLoadingProgress(
        loadingMode === 'quick-replay'
          ? Math.min(98, targetProgress + 6)
          : targetProgress
      );
    }, stageDurationMs);

    return () => window.clearInterval(intervalId);
  }, [loading, loadingMode]);

  const loadCachedInsights = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('team_insights')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is expected for first time
        console.error('Error loading cached insights:', fetchError);
        return;
      }

      if (data) {
        setCachedHash(data.team_hash || null);
        const cachedInsights = data.insights as unknown as InsightData;
        setInsights(cachedInsights);

        const teamChanged = data.team_hash !== currentTeamHash;
        const { notIncludedCount, removedCount } = getCoverageCounts(cachedInsights);
        setNewMembersCount(notIncludedCount);
        setRemovedMembersCount(removedCount);
        setHasTeamChanges(teamChanged || notIncludedCount > 0 || removedCount > 0);
      } else {
        // No cached insights, generate new
        setHasTeamChanges(false);
        setNewMembersCount(0);
        setRemovedMembersCount(0);
        generateInsights();
      }
    } catch (err) {
      console.error('Error loading insights:', err);
      setHasTeamChanges(false);
      setNewMembersCount(0);
      setRemovedMembersCount(0);
      generateInsights();
    }
  };

  const saveInsights = async (insightsData: InsightData) => {
    try {
      // Check if record exists first
      const { data: existing } = await supabase
        .from('team_insights')
        .select('id')
        .eq('company_id', companyId)
        .single();

      const insightsJson = JSON.parse(JSON.stringify(insightsData));

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('team_insights')
          .update({
            insights: insightsJson,
            team_hash: currentTeamHash,
            updated_at: new Date().toISOString(),
          })
          .eq('company_id', companyId);

        if (updateError) {
          console.error('Error updating insights:', updateError);
        }
        setCachedHash(currentTeamHash);
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('team_insights')
          .insert([{
            company_id: companyId,
            insights: insightsJson,
            team_hash: currentTeamHash,
          }]);

        if (insertError) {
          console.error('Error inserting insights:', insertError);
        }
        setCachedHash(currentTeamHash);
      }
    } catch (err) {
      console.error('Error saving insights:', err);
    }
  };

  const generateInsights = async (skipUsageCheck = false, forceRegenerate = false) => {
    // First, check if we have cached insights with matching hash
    // This prevents re-generating (and charging) when nothing has changed
    // Skip this check if forceRegenerate is true
    if (!forceRegenerate) {
      try {
        const { data: cachedData } = await supabase
          .from('team_insights')
          .select('*')
          .eq('company_id', companyId)
          .single();
        
        if (cachedData && cachedData.team_hash === currentTeamHash) {
          const cachedInsights = cachedData.insights as unknown as InsightData;
          const { notIncludedCount, removedCount } = getCoverageCounts(cachedInsights);
          if (notIncludedCount === 0 && removedCount === 0) {
            // Team unchanged and cached insights cover everyone.
            setInsights(cachedInsights);
            setNewMembersCount(0);
            setRemovedMembersCount(0);
            setHasTeamChanges(false);
            toast({
              title: 'Using cached insights',
              description: 'Your team composition hasn\'t changed. Showing previously generated insights.',
            });
            return;
          }
        }
      } catch {
        // No cached data found, proceed with generation
      }
    }

    // Check usage limits before generating (unless loading from cache)
    if (!skipUsageCheck) {
      const currentUsage = await getInsightUsage(companyId);
      setUsage(currentUsage);
      
      if (!currentUsage.canGenerate) {
        setShowPaywall(true);
        return;
      }
      
      if (currentUsage.requiresPayment) {
        setShowPaywall(true);
        return;
      }
    }
    
    setLoadingMode('standard');
    setLoading(true);
    setError(null);

    try {
      // Increment usage count before generating
      if (!skipUsageCheck) {
        const result = await incrementInsightUsage(companyId);
        if (!result.success) {
          if (result.needsPayment) {
            setShowPaywall(true);
            return;
          }
          throw new Error('Failed to record usage');
        }
        setUsage(result.usage);
      }
      
      const { data, error: fnError } = await supabase.functions.invoke('generate-team-insights', {
        body: {
          companyId,
          teamMembers: teamMembers.map(m => ({
            email: m.email,
            fullName: m.full_name,
            jobRole: m.job_role,
            skills: m.skills,
            dominantColor: m.dominantColor,
            colorLabel: colorInfo[m.dominantColor.toLowerCase()]?.label || m.dominantColor,
            scores: m.scores,
          })),
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const insightsData = data.insights as InsightData;

      // Backfill any members the AI omitted so every team member has an entry
      const returnedEmails = new Set(
        (insightsData.memberInsights || []).map((m) => normalizeEmail(m.email))
      );
      const missing = teamMembers.filter(
        (m) => !returnedEmails.has(normalizeEmail(m.email))
      );
      if (missing.length > 0) {
        console.warn(`AI omitted ${missing.length} member(s), backfilling with defaults`);
        for (const m of missing) {
          const color = m.dominantColor?.toLowerCase() || 'blue';
          insightsData.memberInsights.push({
            email: m.email,
            name: m.full_name || m.email.split('@')[0] || 'User',
            currentRole: m.job_role || 'Not assigned',
            dominantColor: color,
            fitScore: 'moderate',
            matchPercentage: 60,
            matchAnalysis: 'This member was not fully analyzed due to response limits. Click Re-Do to regenerate a complete analysis.',
            strengths: [],
            developmentAreas: [],
            suggestedRoles: [],
            leadershipStyle: '',
            workplaceContribution: '',
            potentialChallenges: '',
            actionableAdvice: '',
          });
        }
      }

      setInsights(insightsData);
      setHasTeamChanges(false);
      setNewMembersCount(0);
      setRemovedMembersCount(0);
      
      // Save to database for caching
      await saveInsights(insightsData);

      logAuditEvent({
        companyId,
        action: 'generate_insights',
        entityType: AUDIT_ENTITIES.USER,
        details: { member_count: String(teamMembers.length) },
      });
    } catch (err: any) {
      console.error('Error generating insights:', err);
      setError(err.message || 'Failed to generate insights');
      toast({
        title: 'Error generating insights',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const replayCachedInsights = async () => {
    setLoadingMode('quick-replay');
    setLoading(true);
    setError(null);

    try {
      // Simulate all loading stages quickly for cached replays.
      const minVisualDurationMs = loadingStages.length * 240;
      const fetchPromise = supabase
        .from('team_insights')
        .select('insights, team_hash')
        .eq('company_id', companyId)
        .single();
      const [fetchResult] = await Promise.all([
        fetchPromise,
        new Promise((resolve) => setTimeout(resolve, minVisualDurationMs)),
      ]);
      const { data, error: fetchError } = fetchResult;

      if (fetchError) throw fetchError;
      if (!data?.insights) throw new Error('No cached insights found');

      setLoadingProgress(100);
      setInsights(data.insights as unknown as InsightData);
      setCachedHash(data.team_hash || null);
      toast({
        title: 'Insights re-do complete',
        description: 'Your insights have been refreshed successfully.',
      });
    } catch (err: any) {
      console.error('Error replaying cached insights:', err);
      setError(err.message || 'Failed to reload cached insights');
      toast({
        title: 'Error loading insights',
        description: err.message || 'Failed to reload cached insights',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const runPaidRedo = async () => {
    setProcessingPaidRedo(true);
    try {
      const { data, error: chargeError } = await supabase.functions.invoke('charge-insight-redo', {
        body: { company_id: companyId },
      });

      if (chargeError) throw chargeError;
      if (data?.needsPaymentMethod) {
        toast({
          title: 'Payment method required',
          description: 'No card is on file. Please add a payment method in billing settings to continue.',
          variant: 'destructive',
        });
        return;
      }
      if (data?.error) throw new Error(data.error);

      const refreshedUsage = await getInsightUsage(companyId);
      const previousUsed = usage?.used ?? 0;
      const nextUsed = Math.max(refreshedUsage.used, previousUsed + 1);
      setUsage({
        ...refreshedUsage,
        used: nextUsed,
        limit: toDisplayLimit(nextUsed),
        remaining: Math.max(0, 3 - nextUsed),
      });
      onBillingUpdated?.();

      if (hasMatchingCachedTeam) {
        await replayCachedInsights();
      } else {
        await generateInsights(true, true);
      }
    } catch (err: any) {
      console.error('Error processing paid re-do:', err);
      toast({
        title: 'Payment failed',
        description: err.message || 'Unable to process the $5 insight charge.',
        variant: 'destructive',
      });
    } finally {
      setProcessingPaidRedo(false);
    }
  };

  const runFreeRedoWithCachedReplay = async () => {
    setProcessingPaidRedo(true);
    try {
      const result = await incrementInsightUsage(companyId);
      if (!result.success) {
        if (result.needsPayment) {
          await runPaidRedo();
          return;
        }
        throw new Error('Failed to record usage');
      }

      setUsage(result.usage);
      await replayCachedInsights();
    } catch (err: any) {
      console.error('Error processing re-do usage:', err);
      toast({
        title: 'Unable to re-do insights',
        description: err.message || 'Failed to process insight usage.',
        variant: 'destructive',
      });
    } finally {
      setProcessingPaidRedo(false);
    }
  };

  const handleConfirmRedo = async () => {
    setShowRedoConfirm(false);

    const currentUsage = await getInsightUsage(companyId);
    setUsage(currentUsage);

    if (currentUsage.used >= currentUsage.limit) {
      await runPaidRedo();
      return;
    }

    if (hasMatchingCachedTeam) {
      await runFreeRedoWithCachedReplay();
      return;
    }

    await generateInsights(false, true);
  };

  const toTitleCase = (value: string) => {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

  const getDisplayName = (email: string, preferredName?: string | null) => {
    const sourceName = preferredName?.trim();
    if (sourceName) {
      const firstName = sourceName.split(/\s+/)[0] || '';
      if (firstName) return toTitleCase(firstName);
    }

    const localPart = email.split('@')[0] || '';
    const firstToken = localPart
      .split(/[._+-]/)[0]
      ?.replace(/\d+$/g, '')
      ?.trim();

    return toTitleCase(firstToken || localPart || 'User');
  };

  const toggleMember = (email: string) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(email)) {
      newExpanded.delete(email);
    } else {
      newExpanded.add(email);
    }
    setExpandedMembers(newExpanded);
  };

  const getMatchBadge = (fitScore: string, matchPercentage?: number) => {
    const percentage = matchPercentage || (fitScore === 'excellent' ? 95 : fitScore === 'good' ? 80 : fitScore === 'moderate' ? 60 : 40);
    const fitStyle = fitScoreStyles[fitScore] || fitScoreStyles.moderate;
    
    return (
      <div className={`px-3 py-1 rounded-full ${fitStyle.bg} ${fitStyle.text} text-sm font-medium flex items-center gap-1`}>
        <TrendingUp className="h-3 w-3" />
        {percentage}% Match
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 [&>button]:top-2 [&>button]:right-2">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Lightbulb className="h-6 w-6 text-primary" />
                Team Leadership Insights
              </DialogTitle>
              <DialogDescription>
                AI-powered analysis of your team's leadership styles and role alignment
              </DialogDescription>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {insights && !loading && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRedoConfirm(true)}
                  disabled={loading || processingPaidRedo}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-Do
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    aria-label="AI insights info"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 text-xs leading-relaxed">
                  Free AI insights reset at the beginning of each calendar month. If you run out, you can purchase additional insights for $5 USD each.
                </PopoverContent>
              </Popover>
              <div className="w-52 sm:w-56">
                <InsightUsageMeter 
                  companyId={companyId} 
                  onUsageChange={setUsage}
                  usageOverride={usage}
                />
              </div>
            </div>
          </div>
          {insights && hasTeamChanges && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">These insights are based on an earlier team snapshot.</p>
                  <p className="mt-1">
                    {(() => {
                      const parts: string[] = [];
                      if (newMembersCount > 0)
                        parts.push(`${newMembersCount} team member${newMembersCount === 1 ? ' is' : 's are'} not included in this analysis`);
                      if (removedMembersCount > 0)
                        parts.push(`${removedMembersCount} previously analyzed member${removedMembersCount === 1 ? ' is' : 's are'} no longer on the team`);
                      if (parts.length > 0)
                        return `${parts.join(', and ')}. Click Re-Do to refresh.`;
                      return 'Your team data changed after this analysis. Click Re-Do when you are ready to refresh insights.';
                    })()}
                  </p>
                </div>
              </div>
            </div>
          )}
          {pendingMembers.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">
                    {pendingMembers.length} invited team member{pendingMembers.length === 1 ? '' : 's'} {pendingMembers.length === 1 ? 'has' : 'have'} not completed the assessment yet.
                  </p>
                  <p className="mt-1">
                    Their individual analysis is locked until they complete the assessment. Re-Do insights after completion to include them.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Re-Do confirmation when team hasn't changed */}
        <AlertDialog open={showRedoConfirm} onOpenChange={setShowRedoConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Redo insights?</AlertDialogTitle>
              <AlertDialogDescription>
                {usage && usage.used >= usage.limit
                  ? 'You have used all free AI insights this month. Re-doing now will charge your card on file via Stripe in your local pricing currency (using any available insight credits first). Do you want to continue?'
                  : hasMatchingCachedTeam
                  ? 'Your team composition hasn\'t changed. Re-doing now will use one free AI insight credit and reload the same saved insights with the same percentages and analysis.'
                  : 'Your team composition has changed. Re-generating insights will use one of your free AI insights credits. Do you want to continue?'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmRedo}>
                {usage && usage.used >= usage.limit ? 'Yes, charge and re-do' : 'Yes, re-do insights'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ScrollArea className="flex-1 px-6">
          <div className="py-4">
            {loading && (
              <div className="mx-auto max-w-xl py-16 space-y-5">
                <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground font-medium">{loadingStages[loadingStageIndex].label}...</p>
                  <p className="text-sm text-muted-foreground">We are building your team insights now</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{loadingProgress}%</span>
                  </div>
                  <Progress value={loadingProgress} className="h-2" />
                </div>
                <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                  {loadingStages.map((stage, idx) => (
                    <div
                      key={stage.label}
                      className={`text-sm ${idx < loadingStageIndex ? 'text-foreground' : idx === loadingStageIndex ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      {idx < loadingStageIndex ? '✓' : idx === loadingStageIndex ? '•' : '○'} {stage.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <p className="text-destructive font-medium">Failed to generate insights</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button onClick={generateInsights} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}

            {insights && !loading && (
              <div className="space-y-8">
                {/* Team Overview */}
                <Card className="border-2 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Team Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ExpandableOverview 
                      text={insights.overallAnalysis} 
                      className="text-muted-foreground leading-relaxed" 
                    />
                    {insights.teamDynamics && (
                      <>
                        <Separator />
                        <div>
                          <p className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Team Dynamics
                          </p>
                          <ExpandableText 
                            text={insights.teamDynamics} 
                            className="text-sm text-muted-foreground" 
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Strengths & Challenges */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-green-700 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Team Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {insights.teamStrengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                            <span className="text-sm leading-relaxed">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-amber-700 flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Growth Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {insights.teamChallenges.map((challenge, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm leading-relaxed">{challenge}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Individual Member Insights - Collapsible */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Individual Leadership Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground -mt-2">
                    Click on a team member to see their detailed analysis
                  </p>
                  
                  <div className="space-y-3">
                    {pendingMembers.map((member) => {
                      const displayName = getDisplayName(member.email, member.full_name);

                      return (
                        <Card
                          key={`pending-${member.id}`}
                          className="relative overflow-hidden border-dashed bg-muted/30 pointer-events-none select-none"
                        >
                          <div className="blur-[1px]">
                            <div className="px-4 py-3 flex items-center justify-between border-l-4 border-l-muted-foreground/40">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 bg-muted-foreground/70">
                                  {displayName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold">{displayName}</p>
                                    <Badge variant="secondary" className="text-xs">
                                      Assessment Pending
                                    </Badge>
                                    {member.job_role && (
                                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                        <Briefcase className="h-3 w-3" />
                                        {member.job_role}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate lowercase">{member.email.trim()}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
                                <Clock className="h-3 w-3 mr-1" />
                                Insights Locked
                              </Badge>
                            </div>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center bg-background/45">
                            <span className="rounded-md border bg-background/90 px-2 py-1 text-xs font-medium text-muted-foreground">
                              Complete assessment to unlock
                            </span>
                          </div>
                        </Card>
                      );
                    })}
                    {(() => {
                      const analyzedEmails = new Set(
                        insights.memberInsights.map((m) => normalizeEmail(m.email))
                      );
                      const unanalyzedMembers = teamMembers.filter(
                        (m) => !analyzedEmails.has(normalizeEmail(m.email))
                      );

                      return [...insights.memberInsights.map((member) => {
                        const memberData = teamMembers.find(
                          (m) => normalizeEmail(m.email) === normalizeEmail(member.email)
                        );
                        return { type: 'analyzed' as const, member, memberData };
                      }), ...unanalyzedMembers.map((m) => ({
                        type: 'unanalyzed' as const,
                        member: null,
                        memberData: m,
                      }))];
                    })().map((entry, i) => {
                      if (entry.type === 'unanalyzed') {
                        const m = entry.memberData!;
                        const memberColor = m.dominantColor?.toLowerCase() || 'blue';
                        const colorData = colorInfo[memberColor] || colorInfo.blue;
                        const displayName = getDisplayName(m.email, m.full_name);

                        return (
                          <Card key={`unanalyzed-${i}`} className={`overflow-hidden transition-all opacity-70 ${colorData.bgLight}`}>
                            <div
                              className="px-4 py-3 flex items-center justify-between"
                              style={{ borderLeft: `4px solid ${colorData.color}` }}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                                  style={{ backgroundColor: colorData.color }}
                                >
                                  {displayName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold">{displayName}</p>
                                    <Badge
                                      className="border-0 text-xs"
                                      style={{ backgroundColor: colorData.color, color: 'white' }}
                                    >
                                      {colorData.label}
                                    </Badge>
                                    {m.job_role && (
                                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                        <Briefcase className="h-3 w-3" />
                                        {m.job_role}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate lowercase">{m.email.trim()}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
                                <Clock className="h-3 w-3 mr-1" />
                                Not yet analyzed
                              </Badge>
                            </div>
                          </Card>
                        );
                      }

                      const member = entry.member!;
                      const memberData = entry.memberData;
                      const memberColor = memberData?.dominantColor?.toLowerCase() || 'blue';
                      const colorData = colorInfo[memberColor] || colorInfo.blue;
                      const displayName = getDisplayName(member.email, memberData?.full_name || member.name);
                      const isExpanded = expandedMembers.has(member.email);

                      return (
                        <Collapsible
                          key={i}
                          open={isExpanded}
                          onOpenChange={() => toggleMember(member.email)}
                        >
                          <Card className={`overflow-hidden transition-all ${colorData.bgLight}`}>
                            <CollapsibleTrigger className="w-full text-left">
                              <div 
                                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                style={{ borderLeft: `4px solid ${colorData.color}` }}
                              >
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                                    style={{ backgroundColor: colorData.color }}
                                  >
                                    {displayName.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-semibold">{displayName}</p>
                                      <Badge 
                                        className="border-0 text-xs" 
                                        style={{ backgroundColor: colorData.color, color: 'white' }}
                                      >
                                        {colorData.label}
                                      </Badge>
                                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                        <Briefcase className="h-3 w-3" />
                                        {member.currentRole}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate lowercase">{member.email.trim()}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {getMatchBadge(member.fitScore, member.matchPercentage)}
                                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <CardContent className="space-y-4 bg-background/80 pt-4">
                                {/* Leadership Style & Match Analysis */}
                                <div>
                                  <p className="font-medium text-sm mb-2">Leadership-Role Match Analysis</p>
                                  <ExpandableText 
                                    text={member.matchAnalysis} 
                                    className="text-sm text-muted-foreground leading-relaxed" 
                                  />
                                </div>

                                {/* Leadership Style */}
                                {member.leadershipStyle && (
                                  <div>
                                    <p className="font-medium text-sm mb-2">Leadership Style</p>
                                    <ExpandableText 
                                      text={member.leadershipStyle} 
                                      className="text-sm text-muted-foreground leading-relaxed" 
                                    />
                                  </div>
                                )}

                                {/* Workplace Contribution */}
                                {member.workplaceContribution && (
                                  <div>
                                    <p className="font-medium text-sm mb-2">Workplace Contribution</p>
                                    <ExpandableText 
                                      text={member.workplaceContribution} 
                                      className="text-sm text-muted-foreground leading-relaxed" 
                                    />
                                  </div>
                                )}

                                {/* Strengths & Development Areas */}
                                <div className="grid md:grid-cols-2 gap-4">
                                  {member.strengths && member.strengths.length > 0 && (
                                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
                                      <p className="font-medium text-sm text-green-800 dark:text-green-300 mb-2">Key Strengths</p>
                                      <ul className="space-y-1">
                                        {member.strengths.map((s, j) => (
                                          <li key={j} className="text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                                            <span className="mt-1">•</span>
                                            <span>{s}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {member.developmentAreas && member.developmentAreas.length > 0 && (
                                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                                      <p className="font-medium text-sm text-amber-800 dark:text-amber-300 mb-2">Development Areas</p>
                                      <ul className="space-y-1">
                                        {member.developmentAreas.map((d, j) => (
                                          <li key={j} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                            <span className="mt-1">•</span>
                                            <span>{d}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>

                                {/* Potential Challenges */}
                                {member.potentialChallenges && (
                                  <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="font-medium text-sm mb-2">Potential Challenges</p>
                                    <ExpandableText 
                                      text={member.potentialChallenges} 
                                      className="text-sm text-muted-foreground" 
                                    />
                                  </div>
                                )}
                                {/* Actionable Advice */}
                                {member.actionableAdvice && (
                                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                                    <p className="font-medium text-sm text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                      <Lightbulb className="h-4 w-4" />
                                      Actionable Advice
                                    </p>
                                    <ExpandableText 
                                      text={member.actionableAdvice} 
                                      className="text-sm text-blue-700 dark:text-blue-400" 
                                    />
                                  </div>
                                )}

                                {/* Match Section */}
                                <div className={`p-4 rounded-lg border-2 ${
                                  member.fitScore === 'excellent' ? 'bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-700' :
                                  member.fitScore === 'good' ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700' :
                                  member.fitScore === 'moderate' ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700' :
                                  'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700'
                                }`}>
                                  <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Match Analysis for {member.currentRole}
                                  </p>
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className={`text-2xl font-bold ${
                                      member.fitScore === 'excellent' ? 'text-green-700 dark:text-green-400' :
                                      member.fitScore === 'good' ? 'text-blue-700 dark:text-blue-400' :
                                      member.fitScore === 'moderate' ? 'text-amber-700 dark:text-amber-400' :
                                      'text-red-700 dark:text-red-400'
                                    }`}>
                                      {member.matchPercentage || (member.fitScore === 'excellent' ? 92 : member.fitScore === 'good' ? 78 : member.fitScore === 'moderate' ? 58 : 35)}% Match
                                    </div>
                                    <Badge className={`${
                                      member.fitScore === 'excellent' ? 'bg-green-600' :
                                      member.fitScore === 'good' ? 'bg-blue-600' :
                                      member.fitScore === 'moderate' ? 'bg-amber-600' :
                                      'bg-red-600'
                                    } text-white`}>
                                      {member.fitScore === 'excellent' ? 'Excellent Fit' :
                                       member.fitScore === 'good' ? 'Good Fit' :
                                       member.fitScore === 'moderate' ? 'Moderate Fit' :
                                       'Consider Reassignment'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">{member.matchAnalysis}</p>
                                  
                                  {member.fitScore !== 'excellent' && member.suggestedRoles && member.suggestedRoles.length > 0 && (
                                    <div className="pt-3 border-t border-current/10">
                                      <p className="font-medium text-sm mb-2">Stronger Matches for This Person:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {member.suggestedRoles.map((role, j) => (
                                          <Badge key={j} variant="outline" className="bg-white dark:bg-background">
                                            {role}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      );
                    })}
                  </div>
                </div>

                {/* Strategic Recommendations */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Strategic Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {insights.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {i + 1}
                          </span>
                          <span className="text-sm leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>

                {/* Follow-up Chat */}
                <AIFollowUpChat
                  contextType="team-insights"
                  contextData={{ insights, teamMembers }}
                  initialContext={insights.overallAnalysis}
                  onSendMessage={async (messages, question) => {
                    const context = {
                      overallAnalysis: insights.overallAnalysis,
                      teamDynamics: insights.teamDynamics,
                      teamStrengths: insights.teamStrengths,
                      teamChallenges: insights.teamChallenges,
                      recommendations: insights.recommendations,
                      memberSummaries: insights.memberInsights.map(m => ({
                        name: m.name || m.email,
                        role: m.currentRole,
                        dominantColor: m.dominantColor,
                        fitScore: m.fitScore,
                        matchPercentage: m.matchPercentage,
                      })),
                    };

                    const { data, error } = await supabase.functions.invoke('ai-follow-up', {
                      body: {
                        contextType: 'team-insights',
                        context,
                        messages,
                        question,
                      },
                    });

                    if (error) throw error;
                    if (data?.error) throw new Error(data.error);
                    return data.answer;
                  }}
                />

              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
      
      <InsightPaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPurchaseComplete={() => {
          setShowPaywall(false);
          onBillingUpdated?.();
          generateInsights();
        }}
        companyId={companyId}
        insightCredits={usage?.remaining ?? 0}
      />
    </Dialog>
  );
}
