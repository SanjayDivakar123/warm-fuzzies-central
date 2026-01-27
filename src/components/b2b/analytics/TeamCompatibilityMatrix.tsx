import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, RefreshCw, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  dominantColor: string | null;
  secondaryColor: string | null;
}

interface TeamCompatibilityMatrixProps {
  companyId: string;
}

// Compatibility scoring based on RoleColor combinations
const COMPATIBILITY_RULES: Record<string, Record<string, number>> = {
  // Same colors have moderate compatibility (70%)
  yellow: { yellow: 70, red: 95, green: 65, blue: 75 },
  red: { yellow: 95, red: 70, green: 60, blue: 80 },
  green: { yellow: 65, red: 60, green: 75, blue: 85 },
  blue: { yellow: 75, red: 80, green: 85, blue: 70 },
};

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

function calculateCompatibility(colorA: string, colorB: string): number {
  const a = colorA.toLowerCase();
  const b = colorB.toLowerCase();
  return COMPATIBILITY_RULES[a]?.[b] ?? 50;
}

function getCompatibilityColor(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 75) return 'bg-green-400';
  if (score >= 60) return 'bg-yellow-400';
  if (score >= 45) return 'bg-orange-400';
  return 'bg-red-400';
}

function getCompatibilityLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Moderate';
  if (score >= 45) return 'Challenging';
  return 'Difficult';
}

export default function TeamCompatibilityMatrix({ companyId }: TeamCompatibilityMatrixProps) {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetchTeamMembers();
  }, [companyId]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const { data: users } = await supabase
        .from('company_users')
        .select('id, full_name, email, assessment_results:assessment_result_id(results)')
        .eq('company_id', companyId)
        .not('assessment_result_id', 'is', null);

      if (users) {
        const membersWithColors = users
          .map(user => {
            const results = user.assessment_results?.results as any;
            if (!results?.dominantColor) return null;
            
            const scores = results.scores || {};
            const sortedColors = Object.entries(scores)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([color]) => color);

            return {
              id: user.id,
              full_name: user.full_name,
              email: user.email,
              dominantColor: results.dominantColor.toLowerCase(),
              secondaryColor: sortedColors[1] || null,
            };
          })
          .filter(Boolean) as TeamMember[];

        setMembers(membersWithColors);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (members.length < 2) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">Not enough data</h3>
          <p className="text-sm text-muted-foreground">
            Need at least 2 team members with completed assessments to show compatibility matrix.
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayMembers = members.slice(0, 10); // Limit to 10 for readability

  return (
    <TooltipProvider>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Team Compatibility Matrix
              </CardTitle>
              <CardDescription>
                Collaboration potential based on RoleColor combinations
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchTeamMembers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs font-medium text-muted-foreground" />
                  {displayMembers.map(member => (
                    <th key={member.id} className="p-2 text-center">
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex flex-col items-center gap-1">
                            <div 
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: COLOR_HEX[member.dominantColor || 'blue'] }}
                            />
                            <span className="text-xs truncate max-w-[60px]">
                              {member.full_name?.split(' ')[0] || member.email.split('@')[0]}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{member.full_name || member.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {COLOR_LABELS[member.dominantColor || 'blue']}
                            {member.secondaryColor && ` / ${COLOR_LABELS[member.secondaryColor]}`}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayMembers.map((memberA, rowIdx) => (
                  <tr key={memberA.id}>
                    <td className="p-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLOR_HEX[memberA.dominantColor || 'blue'] }}
                            />
                            <span className="text-xs truncate max-w-[80px]">
                              {memberA.full_name?.split(' ')[0] || memberA.email.split('@')[0]}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{memberA.full_name || memberA.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {COLOR_LABELS[memberA.dominantColor || 'blue']}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {displayMembers.map((memberB, colIdx) => {
                      if (rowIdx === colIdx) {
                        return (
                          <td key={memberB.id} className="p-1">
                            <div className="w-10 h-10 mx-auto bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                              —
                            </div>
                          </td>
                        );
                      }

                      const score = calculateCompatibility(
                        memberA.dominantColor || 'blue',
                        memberB.dominantColor || 'blue'
                      );

                      return (
                        <td key={memberB.id} className="p-1">
                          <Tooltip>
                            <TooltipTrigger>
                              <div 
                                className={cn(
                                  'w-10 h-10 mx-auto rounded flex items-center justify-center text-white text-xs font-medium',
                                  getCompatibilityColor(score)
                                )}
                              >
                                {score}%
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{getCompatibilityLabel(score)} Compatibility</p>
                              <p className="text-xs text-muted-foreground">
                                {memberA.full_name || memberA.email.split('@')[0]} × {memberB.full_name || memberB.email.split('@')[0]}
                              </p>
                              <p className="text-xs mt-1">
                                {COLOR_LABELS[memberA.dominantColor || 'blue']} + {COLOR_LABELS[memberB.dominantColor || 'blue']}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>Excellent (90%+)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-400" />
              <span>Good (75-89%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-yellow-400" />
              <span>Moderate (60-74%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-orange-400" />
              <span>Challenging (45-59%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
