// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  User,
  Briefcase,
  AlertTriangle
} from 'lucide-react';
import { differenceInDays, isPast, isToday, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/contexts/CompanyContext';

interface EmployeeTask {
  id: string;
  task_id: string;
  employee_status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  employee_notes: string | null;
  employee_completed_at: string | null;
  task: {
    id: string;
    title: string;
    description: string | null;
    importance: string;
    urgency: string;
    due_date: string | null;
    required_skills: string[] | null;
  };
}

// Helper to get due date status
function getDueDateStatus(dueDate: string | null, taskStatus: EmployeeTask['employee_status']) {
  if (!dueDate || taskStatus === 'completed') return null;
  
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isPast(due) && !isToday(due)) {
    return { status: 'overdue', label: 'Overdue', className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' };
  }
  
  if (isToday(due)) {
    return { status: 'today', label: 'Due Today', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' };
  }
  
  const daysUntilDue = differenceInDays(due, today);
  if (daysUntilDue <= 2) {
    return { status: 'soon', label: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' };
  }
  
  return null;
}

const statusConfig = {
  pending: {
    label: 'To Do',
    icon: ClipboardList,
    color: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600',
    badgeClass: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    color: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    badgeClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
    badgeClass: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  },
  blocked: {
    label: 'Blocked',
    icon: AlertCircle,
    color: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    badgeClass: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  },
};

export default function EmployeeTasksView() {
  const { companyUser, company } = useCompany();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<EmployeeTask | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (companyUser?.id) {
      fetchTasks();
    }
  }, [companyUser?.id]);

  const fetchTasks = async () => {
    if (!companyUser?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select(`
          id,
          task_id,
          employee_status,
          employee_notes,
          employee_completed_at,
          approved_at,
          task:work_tasks (
            id,
            title,
            description,
            importance,
            urgency,
            due_date,
            required_skills
          )
        `)
        .eq('primary_assignee_id', companyUser.id)
        .not('approved_at', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validTasks = (data || [])
        .filter(item => item.task !== null)
        .map(item => ({
          ...item,
          employee_status: (item.employee_status || 'pending') as EmployeeTask['employee_status'],
          task: item.task as EmployeeTask['task'],
        }));

      setTasks(validTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (assignmentId: string, newStatus: EmployeeTask['employee_status']) => {
    setUpdating(assignmentId);
    
    try {
      const updateData: Record<string, unknown> = {
        employee_status: newStatus,
      };
      
      if (newStatus === 'completed') {
        updateData.employee_completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('task_assignments')
        .update(updateData)
        .eq('id', assignmentId);

      if (error) throw error;

      if (newStatus === 'completed') {
        await supabase.functions.invoke('notify-task-completion', {
          body: { assignmentId },
        });
      }

      setTasks(prev => 
        prev.map(t => 
          t.id === assignmentId 
            ? { ...t, employee_status: newStatus, employee_completed_at: newStatus === 'completed' ? new Date().toISOString() : t.employee_completed_at }
            : t
        )
      );

      toast({
        title: 'Task updated',
        description: `Task moved to ${statusConfig[newStatus].label}`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleAddNote = async (assignmentId: string) => {
    if (!noteInput.trim()) return;
    
    setUpdating(assignmentId);
    try {
      const task = tasks.find(t => t.id === assignmentId);
      const existingNotes = task?.employee_notes || '';
      const timestamp = new Date().toLocaleString();
      const newNote = existingNotes 
        ? `${existingNotes}\n\n[${timestamp}]\n${noteInput.trim()}`
        : `[${timestamp}]\n${noteInput.trim()}`;

      const { error } = await supabase
        .from('task_assignments')
        .update({ employee_notes: newNote })
        .eq('id', assignmentId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t =>
          t.id === assignmentId ? { ...t, employee_notes: newNote } : t
        )
      );
      setNoteInput('');
      toast({ title: 'Note added' });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const tasksByStatus = {
    pending: tasks.filter(t => t.employee_status === 'pending'),
    in_progress: tasks.filter(t => t.employee_status === 'in_progress'),
    completed: tasks.filter(t => t.employee_status === 'completed'),
    blocked: tasks.filter(t => t.employee_status === 'blocked'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Welcome, {companyUser?.email}</CardTitle>
              <CardDescription>
                Employee at {company?.name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{tasksByStatus.pending.length}</div>
              <div className="text-xs text-muted-foreground">To Do</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
              <div className="text-2xl font-bold text-blue-600">{tasksByStatus.in_progress.length}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
              <div className="text-2xl font-bold text-green-600">{tasksByStatus.completed.length}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950">
              <div className="text-2xl font-bold text-red-600">{tasksByStatus.blocked.length}</div>
              <div className="text-xs text-muted-foreground">Blocked</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task columns */}
      {tasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-medium mb-2">No tasks assigned</h3>
            <p className="text-sm text-muted-foreground">
              You don't have any tasks assigned to you yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['pending', 'in_progress', 'completed', 'blocked'] as const).map(status => {
            const config = statusConfig[status];
            const Icon = config.icon;
            const statusTasks = tasksByStatus[status];
            
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{config.label}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {statusTasks.length}
                  </Badge>
                </div>
                
                <div className={`min-h-[200px] rounded-lg p-2 border ${config.color}`}>
                  {statusTasks.map(task => (
                    <Card 
                      key={task.id} 
                      className="mb-2 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedTask(task)}
                    >
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm mb-1 line-clamp-2">{task.task.title}</h4>
                        {task.task.due_date && (() => {
                          const dueStatus = getDueDateStatus(task.task.due_date, task.employee_status);
                          return (
                            <div className="flex items-center gap-1 text-xs">
                              {dueStatus?.status === 'overdue' ? (
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                              ) : (
                                <Calendar className="h-3 w-3" />
                              )}
                              <span className={dueStatus ? dueStatus.className + ' px-1.5 py-0.5 rounded-sm font-medium' : 'text-muted-foreground'}>
                                {dueStatus?.label || new Date(task.task.due_date).toLocaleDateString()}
                              </span>
                            </div>
                          );
                        })()}
                        <div className="flex gap-1 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {task.task.importance} importance
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task detail dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedTask?.task.title}</DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selectedTask.task.description || 'No description provided.'}
              </p>
              
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{selectedTask.task.importance} importance</Badge>
                <Badge variant="outline">{selectedTask.task.urgency} urgency</Badge>
                {selectedTask.task.due_date && (() => {
                  const dueStatus = getDueDateStatus(selectedTask.task.due_date, selectedTask.employee_status);
                  return (
                    <Badge 
                      variant="outline" 
                      className={dueStatus ? dueStatus.className + ' border-0' : ''}
                    >
                      {dueStatus?.status === 'overdue' ? (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      ) : (
                        <Calendar className="h-3 w-3 mr-1" />
                      )}
                      {dueStatus?.label || `Due: ${new Date(selectedTask.task.due_date).toLocaleDateString()}`}
                    </Badge>
                  );
                })()}
              </div>

              {selectedTask.task.required_skills && selectedTask.task.required_skills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Required Skills</p>
                  <div className="flex gap-1 flex-wrap">
                    {selectedTask.task.required_skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {(['pending', 'in_progress', 'completed', 'blocked'] as const).map(status => {
                    const config = statusConfig[status];
                    const isActive = selectedTask.employee_status === status;
                    return (
                      <Button
                        key={status}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          handleStatusChange(selectedTask.id, status);
                          setSelectedTask({ ...selectedTask, employee_status: status });
                        }}
                        disabled={updating === selectedTask.id}
                      >
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">Notes</span>
                </div>
                {selectedTask.employee_notes && (
                  <pre className="text-xs bg-muted p-2 rounded mb-2 whitespace-pre-wrap font-sans max-h-32 overflow-auto">
                    {selectedTask.employee_notes}
                  </pre>
                )}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="text-sm min-h-[60px]"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAddNote(selectedTask.id)}
                    disabled={!noteInput.trim() || updating === selectedTask.id}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
