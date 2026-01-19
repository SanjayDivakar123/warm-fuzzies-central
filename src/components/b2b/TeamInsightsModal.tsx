import { useState } from 'react';
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
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  email: string;
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
  hiringRecommendations: string[];
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

export default function TeamInsightsModal({
  open,
  onClose,
  teamMembers,
  companyId,
}: TeamInsightsModalProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-team-insights', {
        body: {
          companyId,
          teamMembers: teamMembers.map(m => ({
            email: m.email,
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

      setInsights(data.insights);
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

  // Trigger generation when modal opens
  if (open && !insights && !loading && !error) {
    generateInsights();
  }

  const getEmailName = (email: string) => {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[._]/g, ' ');
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

                {/* Individual Member Insights */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Individual Leadership Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground -mt-2">
                    Detailed leadership-role alignment for each team member
                  </p>
                  
                  <div className="space-y-4">
                    {insights.memberInsights.map((member, i) => {
                      const memberColor = teamMembers.find(m => m.email === member.email)?.dominantColor?.toLowerCase() || 'blue';
                      const colorData = colorInfo[memberColor] || colorInfo.blue;
                      const fitStyle = fitScoreStyles[member.fitScore] || fitScoreStyles.moderate;
                      const FitIcon = fitStyle.icon;
                      const displayName = member.name || getEmailName(member.email);

                      return (
                        <Card key={i} className={`overflow-hidden ${colorData.bgLight}`}>
                          <CardHeader className="pb-3" style={{ borderLeft: `4px solid ${colorData.color}` }}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <div 
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                    style={{ backgroundColor: colorData.color }}
                                  >
                                    {displayName.charAt(0)}
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg">{displayName}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge 
                                    className="border-0" 
                                    style={{ backgroundColor: colorData.color, color: 'white' }}
                                  >
                                    {colorData.label}
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" />
                                    {member.currentRole}
                                  </Badge>
                                </div>
                              </div>
                              <Badge
                                className={`${fitStyle.bg} ${fitStyle.text} border-0 capitalize flex items-center gap-1`}
                              >
                                <FitIcon className="h-3 w-3" />
                                {member.fitScore} fit
                              </Badge>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-4 bg-background/80">
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

                            {/* Suggested Roles */}
                            {member.suggestedRoles && member.suggestedRoles.length > 0 && member.fitScore !== 'excellent' && (
                              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="text-sm font-medium">Alternative roles to consider:</span>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {member.suggestedRoles.map((role, j) => (
                                      <Badge key={j} variant="secondary">
                                        {role}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
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
                          </CardContent>
                        </Card>
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

                {/* Hiring Recommendations */}
                {insights.hiringRecommendations && insights.hiringRecommendations.length > 0 && (
                  <Card className="border-dashed border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Hiring Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {insights.hiringRecommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-primary mt-1">→</span>
                            <span className="text-sm leading-relaxed">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 p-4 border-t bg-muted/30">
          {insights && (
            <Button variant="outline" onClick={generateInsights} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}