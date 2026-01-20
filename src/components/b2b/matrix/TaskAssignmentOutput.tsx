import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Check, User, Users, Brain, Target, Briefcase, Activity, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TaskAssignmentOutputProps {
  task: {
    id: string;
    title: string;
    description: string;
    importance: string;
    urgency: string;
    quadrant: string;
    required_skills: string[];
  };
  assignment: {
    id: string;
    primary_assignee_id: string | null;
    secondary_assignee_id: string | null;
    reasoning: any;
    ai_score: number | null;
    primaryAssignee?: any;
    secondaryAssignee?: any;
  };
  companyId: string;
  onApproved: () => void;
}

const roleColorInfo: Record<string, { label: string; color: string; description: string }> = {
  yellow: { 
    label: 'Yellow', 
    color: 'bg-yellow-500', 
    description: 'Action, execution, speed' 
  },
  red: { 
    label: 'Red', 
    color: 'bg-red-500', 
    description: 'Communication, persuasion, creative direction' 
  },
  green: { 
    label: 'Green', 
    color: 'bg-green-500', 
    description: 'Analysis, logic, systems, precision' 
  },
  blue: { 
    label: 'Blue', 
    color: 'bg-blue-500', 
    description: 'Strategy, vision, innovation, research' 
  }
};

const quadrantInfo: Record<string, { label: string; color: string; description: string }> = {
  q1: { label: 'Q1: Do First', color: 'text-red-600', description: 'Important + Urgent' },
  q2: { label: 'Q2: Schedule', color: 'text-blue-600', description: 'Important + Not Urgent' },
  q3: { label: 'Q3: Delegate', color: 'text-yellow-600', description: 'Urgent + Not Important' },
  q4: { label: 'Q4: Eliminate', color: 'text-gray-600', description: 'Not Urgent + Not Important' }
};

export function TaskAssignmentOutput({ task, assignment, companyId, onApproved }: TaskAssignmentOutputProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isApproving, setIsApproving] = useState(false);
  const [employees, setEmployees] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchEmployeeDetails();
  }, [assignment]);

  const fetchEmployeeDetails = async () => {
    const ids = [assignment.primary_assignee_id, assignment.secondary_assignee_id].filter(Boolean);
    if (ids.length === 0) return;

    const { data } = await supabase
      .from('company_users')
      .select('id, email, full_name, assessment_result_id')
      .in('id', ids);

    if (data) {
      const employeeMap: Record<string, any> = {};
      for (const emp of data) {
        if (emp.assessment_result_id) {
          const { data: resultData } = await supabase
            .from('assessment_results')
            .select('results')
            .eq('id', emp.assessment_result_id)
            .single();
          
          const results = resultData?.results as Record<string, any> | null;
          
          employeeMap[emp.id] = {
            ...emp,
            dominantColor: results?.dominantColor || 'unknown'
          };
        } else {
          employeeMap[emp.id] = { ...emp, dominantColor: 'unknown' };
        }
      }
      setEmployees(employeeMap);
    }
  };

  const handleApprove = async () => {
    if (!user) return;
    setIsApproving(true);

    try {
      const { error: assignError } = await supabase
        .from('task_assignments')
        .update({
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', assignment.id);

      if (assignError) throw assignError;

      const { error: taskError } = await supabase
        .from('work_tasks')
        .update({ status: 'assigned' })
        .eq('id', task.id);

      if (taskError) throw taskError;

      toast({
        title: 'Assignment approved',
        description: 'The task has been assigned successfully'
      });

      onApproved();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve assignment',
        variant: 'destructive'
      });
    } finally {
      setIsApproving(false);
    }
  };

  const reasoning = assignment.reasoning || {};
  const primaryEmployee = assignment.primaryAssignee || (assignment.primary_assignee_id ? employees[assignment.primary_assignee_id] : null);
  const secondaryEmployee = assignment.secondaryAssignee || (assignment.secondary_assignee_id ? employees[assignment.secondary_assignee_id] : null);

  const getDisplayName = (employee: any) => {
    if (employee?.full_name) return employee.full_name;
    return employee?.email || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Task Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{task.title}</CardTitle>
          <CardDescription>{task.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn(quadrantInfo[task.quadrant]?.color)}>
              {quadrantInfo[task.quadrant]?.label}
            </Badge>
            <Badge variant="secondary">Importance: {task.importance}</Badge>
            <Badge variant="secondary">Urgency: {task.urgency}</Badge>
            {task.required_skills.map(skill => (
              <Badge key={skill} variant="outline">{skill}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary Assignee */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">Primary Recommendation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {primaryEmployee ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={cn(
                    'text-white',
                    primaryEmployee.dominantColor && roleColorInfo[primaryEmployee.dominantColor]?.color
                  )}>
                    {getDisplayName(primaryEmployee).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getDisplayName(primaryEmployee)}</p>
                  <p className="text-xs text-muted-foreground">{primaryEmployee.email}</p>
                  {primaryEmployee.dominantColor && roleColorInfo[primaryEmployee.dominantColor] && (
                    <p className="text-xs text-muted-foreground">
                      {roleColorInfo[primaryEmployee.dominantColor].label}: {roleColorInfo[primaryEmployee.dominantColor].description}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No suitable candidate found</p>
            )}
          </CardContent>
        </Card>

        {/* Secondary Assignee */}
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Secondary Recommendation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {secondaryEmployee ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={cn(
                    'text-white',
                    secondaryEmployee.dominantColor && roleColorInfo[secondaryEmployee.dominantColor]?.color
                  )}>
                    {getDisplayName(secondaryEmployee).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getDisplayName(secondaryEmployee)}</p>
                  <p className="text-xs text-muted-foreground">{secondaryEmployee.email}</p>
                  {secondaryEmployee.dominantColor && roleColorInfo[secondaryEmployee.dominantColor] && (
                    <p className="text-xs text-muted-foreground">
                      {roleColorInfo[secondaryEmployee.dominantColor].label}: {roleColorInfo[secondaryEmployee.dominantColor].description}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No backup candidate identified</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reasoning Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Reasoning</CardTitle>
          </div>
          {assignment.ai_score && (
            <CardDescription>
              Confidence Score: {(assignment.ai_score * 100).toFixed(0)}%
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quadrant Explanation */}
          {reasoning.quadrantExplanation && (
            <div className="flex gap-3">
              <Target className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Quadrant Analysis</p>
                <p className="text-sm text-muted-foreground">{reasoning.quadrantExplanation}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* RoleColor Justification */}
          {reasoning.roleColorJustification && (
            <div className="flex gap-3">
              <div className={cn(
                'h-5 w-5 rounded-full shrink-0 mt-0.5',
                reasoning.recommendedColor && roleColorInfo[reasoning.recommendedColor]?.color
              )} />
              <div>
                <p className="font-medium text-sm">RoleColor Match</p>
                <p className="text-sm text-muted-foreground">{reasoning.roleColorJustification}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Skill Match */}
          {reasoning.skillMatchNotes && (
            <div className="flex gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Skill Alignment</p>
                <p className="text-sm text-muted-foreground">{reasoning.skillMatchNotes}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Workload Considerations */}
          {reasoning.workloadConsiderations && (
            <div className="flex gap-3">
              <Activity className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Workload & Availability</p>
                <p className="text-sm text-muted-foreground">{reasoning.workloadConsiderations}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Behavioral Reasoning */}
          {reasoning.behavioralReasoning && (
            <div className="flex gap-3">
              <Lightbulb className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Behavioral Suitability</p>
                <p className="text-sm text-muted-foreground">{reasoning.behavioralReasoning}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Button */}
      <Button 
        onClick={handleApprove} 
        className="w-full" 
        size="lg"
        disabled={isApproving || !primaryEmployee}
      >
        <Check className="mr-2 h-4 w-4" />
        {isApproving ? 'Approving...' : 'Approve Assignment'}
      </Button>
    </div>
  );
}
