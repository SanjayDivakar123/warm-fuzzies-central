import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, Users, CheckCircle2, Clock, BarChart3 } from 'lucide-react';
import AssessmentPreviewModal from './AssessmentPreviewModal';

interface AssessmentsTabProps {
  company: any;
}

interface CompletedAssessment {
  id: string;
  email: string;
  assessment_completed_at: string;
  assessment_result_id: string;
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

export default function AssessmentsTab({ company }: AssessmentsTabProps) {
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
        .select('id, email, status, assessment_completed_at, assessment_result_id')
        .eq('company_id', company.id)
        .neq('status', 'revoked');

      if (usersError) throw usersError;

      // Fetch assessment results for completed assessments
      const completedUsers = users?.filter(u => u.assessment_completed_at && u.assessment_result_id) || [];
      
      const assessmentsWithResults: CompletedAssessment[] = [];
      
      for (const user of completedUsers) {
        const { data: result } = await supabase
          .from('assessment_results')
          .select('results')
          .eq('id', user.assessment_result_id)
          .single();
        
        assessmentsWithResults.push({
          id: user.id,
          email: user.email,
          assessment_completed_at: user.assessment_completed_at,
          assessment_result_id: user.assessment_result_id,
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
    <div className="space-y-6">
      {/* Assessment Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Configuration</CardTitle>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{teamStats.total}</p>
                <p className="text-sm text-muted-foreground">Total Team</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{teamStats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{teamStats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {teamStats.completed > 0 ? Math.round((teamStats.completed / teamStats.total) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Color Distribution */}
      {teamStats.completed > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Color Distribution</CardTitle>
            <CardDescription>Breakdown of dominant colors across your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(teamStats.colorDistribution).map(([color, count]) => (
                <div key={color} className="text-center p-4 rounded-lg bg-muted/50">
                  <div className={`w-12 h-12 mx-auto rounded-full mb-2 ${
                    color === 'yellow' ? 'bg-yellow-400' :
                    color === 'red' ? 'bg-red-400' :
                    color === 'green' ? 'bg-green-400' :
                    'bg-blue-400'
                  }`} />
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground capitalize">{colorLabels[color]?.label || color}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Assessments</CardTitle>
          <CardDescription>
            {completedAssessments.length} team member{completedAssessments.length !== 1 ? 's' : ''} completed
          </CardDescription>
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
                  <TableHead>Email</TableHead>
                  <TableHead>Dominant Color</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Quick Breakdown</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedAssessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.email}</TableCell>
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Assessment Results</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Employee</p>
                              <p className="font-medium">{assessment.email}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Dominant Color</p>
                              <div className="mt-1">
                                {assessment.results?.dominantColor && getColorBadge(assessment.results.dominantColor)}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Score Breakdown</p>
                              <div className="space-y-2">
                                {assessment.results?.scores && Object.entries(assessment.results.scores).map(([color, score]) => {
                                  const maxScore = Math.max(...Object.values(assessment.results!.scores));
                                  return (
                                    <ScoreBar key={color} color={color} score={score as number} max={maxScore} />
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Completed</p>
                              <p className="font-medium">
                                {new Date(assessment.assessment_completed_at).toLocaleString()}
                              </p>
                            </div>
                            <Button 
                              className="w-full" 
                              onClick={() => window.open(`/result/${assessment.assessment_result_id}`, '_blank')}
                            >
                              View Full Report
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
