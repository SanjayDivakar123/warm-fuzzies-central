import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TruncatedText } from '@/components/ui/truncated-text';
import { Check, User, Users, Brain, Target, Briefcase, Activity, Lightbulb, Mail, Bell, BellOff, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TaskEmailModal } from './TaskEmailModal';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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

interface EmployeeOption {
  id: string;
  email: string;
  full_name: string | null;
  dominantColor: string;
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


export function TaskAssignmentOutput({ task, assignment, companyId, onApproved }: TaskAssignmentOutputProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isApproving, setIsApproving] = useState(false);
  const [employees, setEmployees] = useState<Record<string, any>>({});
  const [allEmployees, setAllEmployees] = useState<EmployeeOption[]>([]);
  const [currentUserCompanyId, setCurrentUserCompanyId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [useManualSelection, setUseManualSelection] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState<{ id: string; email: string; full_name?: string } | null>(null);
  const [notifyOnCompletion, setNotifyOnCompletion] = useState(true);

  useEffect(() => {
    fetchEmployeeDetails();
    fetchAllEmployees();
    fetchCurrentUserCompanyId();
  }, [assignment, companyId]);

  // Fetch current user's company_users record to prevent self-assignment
  const fetchCurrentUserCompanyId = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('company_users')
      .select('id')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .single();
    if (data) {
      setCurrentUserCompanyId(data.id);
    }
  };

  // Filter out current user from assignable employees (can't assign work to yourself)
  const assignableEmployees = allEmployees.filter(emp => emp.id !== currentUserCompanyId);

  const fetchAllEmployees = async () => {
    const { data } = await supabase
      .from('company_users')
      .select('id, email, full_name, assessment_result_id')
      .eq('company_id', companyId)
      .eq('status', 'active');

    if (data) {
      const employeesWithColors: EmployeeOption[] = [];
      for (const emp of data) {
        let dominantColor = 'unknown';
        if (emp.assessment_result_id) {
          const { data: resultData } = await supabase
            .from('assessment_results')
            .select('results')
            .eq('id', emp.assessment_result_id)
            .single();
          const results = resultData?.results as Record<string, any> | null;
          dominantColor = results?.dominantColor || 'unknown';
        }
        employeesWithColors.push({
          id: emp.id,
          email: emp.email,
          full_name: emp.full_name,
          dominantColor
        });
      }
      setAllEmployees(employeesWithColors);
    }
  };

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
    
    const finalAssigneeId = useManualSelection ? selectedEmployeeId : assignment.primary_assignee_id;
    if (!finalAssigneeId) {
      toast({
        title: 'No assignee selected',
        description: 'Please select an employee or use the AI recommendation',
        variant: 'destructive'
      });
      return;
    }

    // Prevent self-assignment
    if (finalAssigneeId === currentUserCompanyId) {
      toast({
        title: 'Cannot assign to yourself',
        description: 'You cannot assign work to yourself. Please select a different team member.',
        variant: 'destructive'
      });
      return;
    }

    setIsApproving(true);

    try {
      const updateData: any = {
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        notify_on_completion: notifyOnCompletion
      };

      // If manual selection, update the primary assignee
      if (useManualSelection && selectedEmployeeId) {
        updateData.primary_assignee_id = selectedEmployeeId;
      }

      const { error: assignError } = await supabase
        .from('task_assignments')
        .update(updateData)
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

  const getSelectedEmployee = (): EmployeeOption | null => {
    if (useManualSelection && selectedEmployeeId) {
      return allEmployees.find(e => e.id === selectedEmployeeId) || null;
    }
    return null;
  };

  const reasoning = assignment.reasoning || {};
  const primaryEmployee = assignment.primaryAssignee || (assignment.primary_assignee_id ? employees[assignment.primary_assignee_id] : null);
  const secondaryEmployee = assignment.secondaryAssignee || (assignment.secondary_assignee_id ? employees[assignment.secondary_assignee_id] : null);
  const manuallySelectedEmployee = getSelectedEmployee();
  const finalAssignee = useManualSelection ? manuallySelectedEmployee : primaryEmployee;

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
            <Badge variant="secondary">Importance: {task.importance}</Badge>
            <Badge variant="secondary">Urgency: {task.urgency}</Badge>
            {task.required_skills.map(skill => (
              <Badge key={skill} variant="outline">{skill}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Selection Toggle */}
      <Card className="border-accent/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-accent-foreground" />
              <CardTitle className="text-sm font-medium">Assignment Method</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="manual-selection" className="text-sm cursor-pointer">
                {useManualSelection ? 'Manual Selection' : 'AI Recommendation'}
              </Label>
              <Switch
                id="manual-selection"
                checked={useManualSelection}
                onCheckedChange={setUseManualSelection}
              />
            </div>
          </div>
        </CardHeader>
        {useManualSelection && (
          <CardContent>
            <div className="space-y-2">
              <Label>Select Employee</Label>
              <p className="text-xs text-muted-foreground">You cannot assign work to yourself</p>
              <Select value={selectedEmployeeId || ''} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {assignableEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'h-3 w-3 rounded-full',
                          emp.dominantColor && roleColorInfo[emp.dominantColor]?.color || 'bg-muted'
                        )} />
                        <span>{emp.full_name || emp.email}</span>
                        {emp.full_name && (
                          <span className="text-muted-foreground text-xs">({emp.email})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {manuallySelectedEmployee && (
                <div className="flex items-center gap-3 mt-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className={cn(
                      'text-white',
                      manuallySelectedEmployee.dominantColor && roleColorInfo[manuallySelectedEmployee.dominantColor]?.color
                    )}>
                      {getDisplayName(manuallySelectedEmployee).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <TruncatedText 
                      text={getDisplayName(manuallySelectedEmployee)} 
                      maxWidth="200px"
                      className="font-medium"
                    />
                    <TruncatedText 
                      text={manuallySelectedEmployee.email} 
                      maxWidth="200px"
                      className="text-xs text-muted-foreground"
                    />
                    {manuallySelectedEmployee.dominantColor && roleColorInfo[manuallySelectedEmployee.dominantColor] && (
                      <p className="text-xs text-muted-foreground">
                        {roleColorInfo[manuallySelectedEmployee.dominantColor].label}: {roleColorInfo[manuallySelectedEmployee.dominantColor].description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* AI Recommendations */}
      {!useManualSelection && (
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
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className={cn(
                      'text-white',
                      primaryEmployee.dominantColor && roleColorInfo[primaryEmployee.dominantColor]?.color
                    )}>
                      {getDisplayName(primaryEmployee).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <TruncatedText 
                      text={getDisplayName(primaryEmployee)} 
                      maxWidth="180px"
                      className="font-medium"
                    />
                    <TruncatedText 
                      text={primaryEmployee.email} 
                      maxWidth="180px"
                      className="text-xs text-muted-foreground"
                    />
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
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className={cn(
                      'text-white',
                      secondaryEmployee.dominantColor && roleColorInfo[secondaryEmployee.dominantColor]?.color
                    )}>
                      {getDisplayName(secondaryEmployee).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <TruncatedText 
                      text={getDisplayName(secondaryEmployee)} 
                      maxWidth="180px"
                      className="font-medium"
                    />
                    <TruncatedText 
                      text={secondaryEmployee.email} 
                      maxWidth="180px"
                      className="text-xs text-muted-foreground"
                    />
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
      )}

      {/* Reasoning Panel - only show when using AI recommendation */}
      {!useManualSelection && (
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
      )}

      {/* Notification Preference for this assignment */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
        <div className="flex items-center gap-3">
          {notifyOnCompletion ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <Label htmlFor="notifyOnCompletion" className="font-medium cursor-pointer">
              Email me when completed
            </Label>
            <p className="text-xs text-muted-foreground">
              Receive a notification when the assignee marks this task as done
            </p>
          </div>
        </div>
        <Switch
          id="notifyOnCompletion"
          checked={notifyOnCompletion}
          onCheckedChange={setNotifyOnCompletion}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={handleApprove} 
          className="flex-1" 
          size="lg"
          disabled={isApproving || (!finalAssignee)}
        >
          <Check className="mr-2 h-4 w-4" />
          {isApproving ? 'Approving...' : 'Approve Assignment'}
        </Button>
        
        {finalAssignee && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setEmailRecipient({
                id: finalAssignee.id,
                email: finalAssignee.email,
                full_name: finalAssignee.full_name,
              });
              setEmailModalOpen(true);
            }}
          >
            <Mail className="mr-2 h-4 w-4" />
            Email Assignee
          </Button>
        )}
      </div>

      {/* Email Modal */}
      {emailRecipient && (
        <TaskEmailModal
          open={emailModalOpen}
          onClose={() => {
            setEmailModalOpen(false);
            setEmailRecipient(null);
          }}
          task={{
            id: task.id,
            title: task.title,
            description: task.description,
            importance: task.importance,
            urgency: task.urgency,
            required_skills: task.required_skills,
          }}
          assignee={emailRecipient}
          reasoning={reasoning}
        />
      )}
    </div>
  );
}
