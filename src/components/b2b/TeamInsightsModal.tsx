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
import { Loader2, Lightbulb, AlertTriangle, ArrowRight, Users, RefreshCw } from 'lucide-react';
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

interface InsightData {
  overallAnalysis: string;
  teamStrengths: string[];
  teamChallenges: string[];
  memberInsights: {
    email: string;
    currentRole: string;
    fitScore: 'excellent' | 'good' | 'moderate' | 'mismatch';
    analysis: string;
    suggestedRoles: string[];
    reasoning: string;
  }[];
  recommendations: string[];
}

interface TeamInsightsModalProps {
  open: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  companyId: string;
}

const colorLabels: Record<string, { label: string; description: string }> = {
  yellow: { label: 'Executor', description: 'Action-oriented, results-driven' },
  red: { label: 'Motivator', description: 'Inspiring, people-focused' },
  green: { label: 'Organizer', description: 'Structured, detail-oriented' },
  blue: { label: 'Innovator', description: 'Creative, visionary' },
};

const fitScoreStyles: Record<string, { bg: string; text: string }> = {
  excellent: { bg: 'bg-green-100', text: 'text-green-800' },
  good: { bg: 'bg-blue-100', text: 'text-blue-800' },
  moderate: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  mismatch: { bg: 'bg-red-100', text: 'text-red-800' },
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
            colorLabel: colorLabels[m.dominantColor.toLowerCase()]?.label || m.dominantColor,
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

  const handleOpen = () => {
    if (!insights && !loading) {
      generateInsights();
    }
  };

  // Trigger generation when modal opens
  if (open && !insights && !loading && !error) {
    generateInsights();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Team Leadership Insights
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis of your team's leadership styles and role alignment
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing team leadership profiles...</p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
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
            <div className="space-y-6 pb-4">
              {/* Overall Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{insights.overallAnalysis}</p>
                </CardContent>
              </Card>

              {/* Strengths & Challenges */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-700">Team Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {insights.teamStrengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-amber-700">Growth Areas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {insights.teamChallenges.map((challenge, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Individual Member Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Individual Role Fit Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights.memberInsights.map((member, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{member.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Current: {member.currentRole || 'Not set'}
                          </p>
                        </div>
                        <Badge
                          className={`${fitScoreStyles[member.fitScore]?.bg || 'bg-gray-100'} ${
                            fitScoreStyles[member.fitScore]?.text || 'text-gray-800'
                          } border-0 capitalize`}
                        >
                          {member.fitScore} fit
                        </Badge>
                      </div>
                      <p className="text-sm mb-3">{member.analysis}</p>
                      {member.suggestedRoles.length > 0 && member.fitScore !== 'excellent' && (
                        <div className="flex items-center gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Suggested roles:</span>
                          <div className="flex gap-1">
                            {member.suggestedRoles.map((role, j) => (
                              <Badge key={j} variant="outline">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        {member.reasoning}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Strategic Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {insights.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {i + 1}
                        </span>
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
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
