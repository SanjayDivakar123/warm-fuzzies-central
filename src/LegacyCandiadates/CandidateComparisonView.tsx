import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Users, Check, X, Crown, Target, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Candidate {
  id: string;
  email: string;
  full_name: string | null;
  position_title: string | null;
  ideal_role_color: string | null;
  status: string;
  fit_score: number | null;
  fit_analysis: any;
  assessment_completed_at: string | null;
  dominantColor?: string;
  scores?: Record<string, number>;
}

interface CandidateComparisonViewProps {
  companyId: string;
}

const COLOR_LABELS: Record<string, string> = {
  yellow: 'Executor',
  red: 'Motivator',
  green: 'Organizer',
  blue: 'Innovator',
};

const COLOR_HEX: Record<string, string> = {
  yellow: '#EAB308',
  red: '#EF4444',
  green: '#22C55E',
  blue: '#3B82F6',
};

export default function CandidateComparisonView({ companyId }: CandidateComparisonViewProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, [companyId]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('candidates')
        .select('*, assessment_results:assessment_result_id(results)')
        .eq('company_id', companyId)
        .not('assessment_completed_at', 'is', null)
        .order('fit_score', { ascending: false, nullsFirst: false });

      if (data) {
        const enrichedCandidates = data.map(c => {
          const results = c.assessment_results?.results as any;
          return {
            ...c,
            dominantColor: results?.dominantColor?.toLowerCase(),
            scores: results?.scores,
          };
        });
        setCandidates(enrichedCandidates);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), candidateId];
      }
      return [...prev, candidateId];
    });
  };

  const selectedCandidateData = candidates.filter(c => selectedCandidates.includes(c.id));

  const hasLeadershipPotential = (candidate: Candidate) => {
    if (!candidate.scores) return false;
    const sortedColors = Object.entries(candidate.scores)
      .sort(([, a], [, b]) => b - a)
      .map(([color]) => color);
    const topTwo = sortedColors.slice(0, 2);
    return topTwo.includes('red') || topTwo.includes('yellow');
  };

  const getScoreBar = (score: number, max: number = 100) => {
    const percentage = (score / max) * 100;
    return (
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (candidates.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No completed assessments</h3>
          <p className="text-sm text-muted-foreground">
            Candidates must complete their assessments before comparison.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Candidate Selector */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Candidate Comparison
          </CardTitle>
          <CardDescription>
            Select up to 4 candidates to compare side-by-side
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {candidates.map(candidate => (
              <Button
                key={candidate.id}
                variant={selectedCandidates.includes(candidate.id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSelectCandidate(candidate.id)}
                className="gap-2"
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLOR_HEX[candidate.dominantColor || 'blue'] }}
                />
                {candidate.full_name || candidate.email.split('@')[0]}
                {candidate.fit_score && (
                  <Badge variant="secondary" className="ml-1">
                    {candidate.fit_score}%
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Grid */}
      {selectedCandidateData.length > 0 && (
        <div className={cn(
          'grid gap-4',
          selectedCandidateData.length === 1 && 'grid-cols-1',
          selectedCandidateData.length === 2 && 'grid-cols-2',
          selectedCandidateData.length === 3 && 'grid-cols-3',
          selectedCandidateData.length === 4 && 'grid-cols-2 lg:grid-cols-4',
        )}>
          {selectedCandidateData.map(candidate => (
            <Card key={candidate.id} className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-medium">
                      {candidate.full_name || candidate.email}
                    </CardTitle>
                    <CardDescription>{candidate.position_title || 'No position'}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleSelectCandidate(candidate.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fit Score */}
                <div className="text-center py-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                      {candidate.fit_score ?? '—'}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Fit Score</p>
                </div>

                {/* Dominant Color */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div 
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: COLOR_HEX[candidate.dominantColor || 'blue'] }}
                  />
                  <div>
                    <p className="font-medium">{COLOR_LABELS[candidate.dominantColor || 'blue']}</p>
                    <p className="text-xs text-muted-foreground">Primary Color</p>
                  </div>
                </div>

                {/* Leadership Potential */}
                <div className="flex items-center gap-2">
                  {hasLeadershipPotential(candidate) ? (
                    <>
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-600">High Leadership Potential</span>
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Standard Profile</span>
                    </>
                  )}
                </div>

                {/* Color Scores */}
                {candidate.scores && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Color Distribution</p>
                    {Object.entries(candidate.scores).map(([color, score]) => (
                      <div key={color} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: COLOR_HEX[color] }}
                            />
                            {COLOR_LABELS[color]}
                          </span>
                          <span>{score}%</span>
                        </div>
                        {getScoreBar(score)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Key Fit Insights */}
                {candidate.fit_analysis?.strengths && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Key Strengths</p>
                    <div className="flex flex-wrap gap-1">
                      {candidate.fit_analysis.strengths.slice(0, 3).map((strength: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedCandidateData.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Select candidates to compare</h3>
            <p className="text-sm text-muted-foreground">
              Click on candidate names above to add them to the comparison.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
