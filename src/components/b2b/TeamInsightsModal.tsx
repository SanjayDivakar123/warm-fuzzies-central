import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  companyId: string;
}

const colorInfo: Record<string, { label: string; color: string; bgLight: string; description: string }> = {
  yellow: { 
    label: 'Executor', 
    color: '#EAB308', 
    bgLight: 'bg-yellow-50',
    description: 'Action-oriented, results-driven' 
  },
  red: { 
    label: 'Motivator', 
    color: '#EF4444', 
    bgLight: 'bg-red-50',
    description: 'Inspiring, people-focused' 
  },
  green: { 
    label: 'Organizer', 
    color: '#22C55E', 
    bgLight: 'bg-green-50',
    description: 'Structured, detail-oriented' 
  },
  blue: { 
    label: 'Innovator', 
    color: '#3B82F6', 
    bgLight: 'bg-blue-50',
    description: 'Creative, visionary' 
  },
};

const fitScoreStyles: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  excellent: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
  good: { bg: 'bg-blue-100', text: 'text-blue-800', icon: TrendingUp },
  moderate: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle },
  mismatch: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle },
};

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
  companyId,
}: TeamInsightsModalProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const currentTeamHash = generateTeamHash(teamMembers);

  // Load cached insights when modal opens
  useEffect(() => {
    if (open) {
      loadCachedInsights();
    }
  }, [open, companyId]);

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
        // Check if team has changed since last insight generation
        if (data.team_hash === currentTeamHash) {
          // Team unchanged, use cached insights
          setInsights(data.insights as unknown as InsightData);
        } else {
          // Team changed, need to regenerate
          generateInsights();
        }
      } else {
        // No cached insights, generate new
        generateInsights();
      }
    } catch (err) {
      console.error('Error loading insights:', err);
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
      }
    } catch (err) {
      console.error('Error saving insights:', err);
    }
  };

  const generateInsights = async () => {
    setLoading(true);
    setError(null);

    try {
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
      setInsights(insightsData);
      
      // Save to database for caching
      await saveInsights(insightsData);
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

  const getDisplayName = (email: string) => {
    // First check if we have a full_name from team members
    const member = teamMembers.find(m => m.email === email);
    if (member?.full_name) return member.full_name;
    // Fallback to parsing email
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[._]/g, ' ');
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
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lightbulb className="h-6 w-6 text-primary" />
            Team Leadership Insights
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis of your team's leadership styles and role alignment
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="py-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">Analyzing team leadership profiles...</p>
                <p className="text-sm text-muted-foreground">This may take a moment</p>
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
                    <p className="text-muted-foreground leading-relaxed">{insights.overallAnalysis}</p>
                    {insights.teamDynamics && (
                      <>
                        <Separator />
                        <div>
                          <p className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Team Dynamics
                          </p>
                          <p className="text-sm text-muted-foreground">{insights.teamDynamics}</p>
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
                    {insights.memberInsights.map((member, i) => {
                      const memberData = teamMembers.find(m => m.email === member.email);
                      const memberColor = memberData?.dominantColor?.toLowerCase() || 'blue';
                      const colorData = colorInfo[memberColor] || colorInfo.blue;
                      const displayName = member.name || memberData?.full_name || getDisplayName(member.email);
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
                                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-black/5 transition-colors"
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
                                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
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
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {member.matchAnalysis}
                                  </p>
                                </div>

                                {/* Leadership Style */}
                                {member.leadershipStyle && (
                                  <div>
                                    <p className="font-medium text-sm mb-2">Leadership Style</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {member.leadershipStyle}
                                    </p>
                                  </div>
                                )}

                                {/* Workplace Contribution */}
                                {member.workplaceContribution && (
                                  <div>
                                    <p className="font-medium text-sm mb-2">Workplace Contribution</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {member.workplaceContribution}
                                    </p>
                                  </div>
                                )}

                                {/* Strengths & Development Areas */}
                                <div className="grid md:grid-cols-2 gap-4">
                                  {member.strengths && member.strengths.length > 0 && (
                                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                                      <p className="font-medium text-sm text-green-800 mb-2">Key Strengths</p>
                                      <ul className="space-y-1">
                                        {member.strengths.map((s, j) => (
                                          <li key={j} className="text-sm text-green-700 flex items-start gap-2">
                                            <span className="mt-1">•</span>
                                            <span>{s}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {member.developmentAreas && member.developmentAreas.length > 0 && (
                                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                                      <p className="font-medium text-sm text-amber-800 mb-2">Development Areas</p>
                                      <ul className="space-y-1">
                                        {member.developmentAreas.map((d, j) => (
                                          <li key={j} className="text-sm text-amber-700 flex items-start gap-2">
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
                                    <p className="text-sm text-muted-foreground">{member.potentialChallenges}</p>
                                  </div>
                                )}
                                {/* Actionable Advice */}
                                {member.actionableAdvice && (
                                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                    <p className="font-medium text-sm text-blue-800 mb-2 flex items-center gap-2">
                                      <Lightbulb className="h-4 w-4" />
                                      Actionable Advice
                                    </p>
                                    <p className="text-sm text-blue-700">{member.actionableAdvice}</p>
                                  </div>
                                )}

                                {/* Match Section */}
                                <div className={`p-4 rounded-lg border-2 ${
                                  member.fitScore === 'excellent' ? 'bg-green-50 border-green-300' :
                                  member.fitScore === 'good' ? 'bg-blue-50 border-blue-300' :
                                  member.fitScore === 'moderate' ? 'bg-amber-50 border-amber-300' :
                                  'bg-red-50 border-red-300'
                                }`}>
                                  <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Match Analysis for {member.currentRole}
                                  </p>
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className={`text-2xl font-bold ${
                                      member.fitScore === 'excellent' ? 'text-green-700' :
                                      member.fitScore === 'good' ? 'text-blue-700' :
                                      member.fitScore === 'moderate' ? 'text-amber-700' :
                                      'text-red-700'
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
                                          <Badge key={j} variant="outline" className="bg-white">
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
    </Dialog>
  );
}
