import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, Users, CheckCircle2, Clock, BarChart3, Lightbulb } from 'lucide-react';
import AssessmentPreviewModal from './AssessmentPreviewModal';
import EmployeeResultsModal from './EmployeeResultsModal';
import TeamInsightsModal from './TeamInsightsModal';

interface AssessmentsTabProps {
  company: any;
  onSettingsSaved?: () => void;
}

interface CompletedAssessment {
  id: string;
  email: string;
  full_name: string | null;
  job_role: string | null;
  skills: string[] | null;
  assessment_completed_at: string;
  assessment_result_id: string;
  shareable_code?: string;
  results?: {
    scores: {
      yellow: number;
      red: number;
      green: number;
      blue: number;
    };
    dominantColor: string;
  };
}

const colorLabels: Record<string, { label: string; bg: string; text: string }> = {
  yellow: { label: 'Executor', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  red: { label: 'Motivator', bg: 'bg-red-100', text: 'text-red-800' },
  green: { label: 'Organizer', bg: 'bg-green-100', text: 'text-green-800' },
  blue: { label: 'Innovator', bg: 'bg-blue-100', text: 'text-blue-800' },
};

export default function AssessmentsTab({ company, onSettingsSaved }: AssessmentsTabProps) {
  const [assessmentType, setAssessmentType] = useState(company.assessment_type);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedAssessments, setCompletedAssessments] = useState<CompletedAssessment[]>([]);
  const [teamStats, setTeamStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    colorDistribution: { yellow: 0, red: 0, green: 0, blue: 0 }
  });
  const [previewType, setPreviewType] = useState<'25q' | '50q' | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<CompletedAssessment | null>(null);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAssessments();
  }, [company.id]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      // Fetch all company users with their assessment results
      const { data: users, error: usersError } = await supabase
        .from('company_users')
        .select('id, email, full_name, status, job_role, skills, assessment_completed_at, assessment_result_id')
        .eq('company_id', company.id)
        .neq('status', 'revoked');

      if (usersError) throw usersError;

      // Fetch assessment results for completed assessments
      const completedUsers = users?.filter(u => u.assessment_completed_at && u.assessment_result_id) || [];
      
      const assessmentsWithResults: CompletedAssessment[] = [];
      
      for (const user of completedUsers) {
        const { data: result } = await supabase
          .from('assessment_results')
          .select('results, shareable_code')
          .eq('id', user.assessment_result_id)
          .single();
        
        assessmentsWithResults.push({
          id: user.id,
          email: user.email,
          full_name: user.full_name || null,
          job_role: user.job_role,
          skills: user.skills,
          assessment_completed_at: user.assessment_completed_at,
          assessment_result_id: user.assessment_result_id,
          shareable_code: result?.shareable_code,
          results: result?.results as any,
        });
      }

      setCompletedAssessments(assessmentsWithResults);

      // Calculate stats
      const total = users?.length || 0;
      const completed = completedUsers.length;
      const pending = total - completed;
      
      // Calculate color distribution
      const colorDistribution = { yellow: 0, red: 0, green: 0, blue: 0 };
      assessmentsWithResults.forEach(a => {
        if (a.results?.dominantColor) {
          const color = a.results.dominantColor.toLowerCase();
          if (color in colorDistribution) {
            colorDistribution[color as keyof typeof colorDistribution]++;
          }
        }
      });

      setTeamStats({ total, completed, pending, colorDistribution });
    } catch (error: any) {
      console.error('Error fetching assessments:', error);
      toast({
        title: 'Error loading assessments',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssessmentType = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ assessment_type: assessmentType })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: 'Assessment type updated',
        description: 'Your changes have been saved.',
      });

      // Refresh company data in parent to sync with other tabs
      if (onSettingsSaved) {
        onSettingsSaved();
      }
    } catch (error: any) {
      toast({
        title: 'Error updating assessment type',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getColorBadge = (color: string) => {
    const colorInfo = colorLabels[color.toLowerCase()] || { label: color, bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <Badge className={`${colorInfo.bg} ${colorInfo.text} border-0`}>
        {colorInfo.label}
      </Badge>
    );
  };

  const ScoreBar = ({ color, score, max }: { color: string; score: number; max: number }) => {
    const percentage = max > 0 ? (score / max) * 100 : 0;
    const bgColors: Record<string, string> = {
      yellow: 'bg-yellow-400',
      red: 'bg-red-400',
      green: 'bg-green-400',
      blue: 'bg-blue-400',
    };
    
    return (
      <div className="flex items-center gap-2">
        <span className="w-16 text-sm capitalize">{color}</span>
        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full ${bgColors[color] || 'bg-primary'} transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="w-8 text-sm text-muted-foreground">{score}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Assessment Configuration */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">Assessment Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Assessment Type</Label>
            <div className="space-y-3">
              <div 
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  assessmentType === '25q' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
                }`}
                onClick={() => setAssessmentType('25q')}
              >
                <div>
                  <p className="font-medium">25 Question Assessment</p>
                  <p className="text-sm text-muted-foreground">Quick assessment (~10 minutes)</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewType('25q');
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>

              <div 
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  assessmentType === '50q' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
                }`}
                onClick={() => setAssessmentType('50q')}
              >
                <div>
                  <p className="font-medium">50 Question Assessment</p>
                  <p className="text-sm text-muted-foreground">Comprehensive assessment (~20 minutes)</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewType('50q');
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={handleSaveAssessmentType} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <AssessmentPreviewModal 
        open={previewType !== null} 
        onClose={() => setPreviewType(null)} 
        assessmentType={previewType || '25q'} 
      />

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3" data-tour="team-summary">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl font-semibold">{teamStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Team</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-semibold">{teamStats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xl font-semibold">{teamStats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-semibold">
                  {teamStats.completed > 0 ? Math.round((teamStats.completed / teamStats.total) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Color Distribution */}
      {teamStats.completed > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">Team Color Distribution</CardTitle>
            <CardDescription>Breakdown of dominant colors across your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(teamStats.colorDistribution).map(([color, count]) => (
                <div key={color} className="text-center p-3 rounded-lg bg-muted/30">
                  <div className={`w-10 h-10 mx-auto rounded-full mb-2 ${
                    color === 'yellow' ? 'bg-yellow-400' :
                    color === 'red' ? 'bg-red-400' :
                    color === 'green' ? 'bg-green-400' :
                    'bg-blue-400'
                  }`} />
                  <p className="text-xl font-semibold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{colorLabels[color]?.label || color}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Assessments Table */}
      <Card className="border-0 shadow-sm" data-tour="individual-results">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-medium">Completed Assessments</CardTitle>
            <CardDescription>
              {completedAssessments.length} team member{completedAssessments.length !== 1 ? 's' : ''} completed
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span data-tour="team-insights">
                  <Button
                    onClick={() => setShowInsightsModal(true)}
                    disabled={
                      teamStats.pending > 0 || 
                      completedAssessments.length === 0 ||
                      completedAssessments.some(a => !a.job_role)
                    }
                    className="gap-2"
                  >
                    <Lightbulb className="h-4 w-4" />
                    Insights
                  </Button>
                </span>
              </TooltipTrigger>
              {(teamStats.pending > 0 || completedAssessments.length === 0 || completedAssessments.some(a => !a.job_role)) && (
                <TooltipContent>
                  All team assessments must be completed and all team members must have a job role set
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          {completedAssessments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No completed assessments yet. Results will appear here once employees complete their assessments.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Dominant Color</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Quick Breakdown</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {completedAssessments.map((assessment) => (
                  <TableRow key={assessment.id} className="transition-colors hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {assessment.full_name || <span className="text-muted-foreground">Not set</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{assessment.email}</TableCell>
                    <TableCell>
                      {assessment.results?.dominantColor 
                        ? getColorBadge(assessment.results.dominantColor)
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(assessment.assessment_completed_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {assessment.results?.scores ? (
                        <div className="flex gap-1">
                          {Object.entries(assessment.results.scores).map(([color, score]) => (
                            <div
                              key={color}
                              className={`w-6 h-6 rounded text-xs flex items-center justify-center text-white font-medium ${
                                color === 'yellow' ? 'bg-yellow-500' :
                                color === 'red' ? 'bg-red-500' :
                                color === 'green' ? 'bg-green-500' :
                                'bg-blue-500'
                              }`}
                              title={`${color}: ${score}`}
                            >
                              {score}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedEmployee(assessment)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Employee Results Modal */}
      <EmployeeResultsModal
        open={selectedEmployee !== null}
        onClose={() => setSelectedEmployee(null)}
        email={selectedEmployee?.email || ''}
        results={selectedEmployee?.results || null}
        completedAt={selectedEmployee?.assessment_completed_at || ''}
      />

      {/* Team Insights Modal */}
      <TeamInsightsModal
        open={showInsightsModal}
        onClose={() => setShowInsightsModal(false)}
        companyId={company.id}
        teamMembers={completedAssessments
          .filter(a => a.results?.scores && a.results?.dominantColor)
          .map(a => ({
            id: a.id,
            email: a.email,
            full_name: a.full_name || null,
            job_role: a.job_role,
            skills: a.skills,
            dominantColor: a.results!.dominantColor,
            scores: a.results!.scores,
          }))}
      />
    </div>
  );
}
