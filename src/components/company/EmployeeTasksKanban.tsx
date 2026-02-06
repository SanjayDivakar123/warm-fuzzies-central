import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyPortal } from '@/contexts/CompanyPortalContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
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
  GripVertical,
  Calendar,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Flag,
  X
} from 'lucide-react';

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

const statusConfig = {
  pending: {
    label: 'To Do',
    icon: ClipboardList,
    color: 'bg-slate-100 border-slate-300',
    badgeClass: 'bg-slate-200 text-slate-700',
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    color: 'bg-blue-50 border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'bg-green-50 border-green-200',
    badgeClass: 'bg-green-100 text-green-700',
  },
  blocked: {
    label: 'Blocked',
    icon: AlertCircle,
    color: 'bg-red-50 border-red-200',
    badgeClass: 'bg-red-100 text-red-700',
  },
};

const STATUSES: Array<keyof typeof statusConfig> = ['pending', 'in_progress', 'completed', 'blocked'];

interface Props {
  primaryColor?: string;
  secondaryColor?: string;
}

export function EmployeeTasksKanban({ primaryColor = '#6366f1', secondaryColor = '#8b5cf6' }: Props) {
  const { company, employee } = useCompanyPortal();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<EmployeeTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  useEffect(() => {
    if (employee?.id) {
      fetchTasks();
    }
  }, [employee?.id]);

  const fetchTasks = async () => {
    if (!employee?.id) return;
    
    setLoading(true);
    try {
      console.log('Fetching tasks for employee:', employee.id);
      
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
        .eq('primary_assignee_id', employee.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Raw task assignments:', data);
      
      // Filter out null tasks and only show approved ones
      const validTasks = (data || [])
        .filter(item => item.task !== null && item.approved_at !== null)
        .map(item => ({
          ...item,
          employee_status: (item.employee_status || 'pending') as EmployeeTask['employee_status'],
          task: item.task as EmployeeTask['task'],
        }));
      
      console.log('Filtered valid tasks:', validTasks);
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
      const updateData: any = {
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

      // If completed, notify the assigner
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
    } catch (error: any) {
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
      const newNotes = existingNotes 
        ? `${existingNotes}\n\n[${new Date().toLocaleDateString()}]: ${noteInput}`
        : `[${new Date().toLocaleDateString()}]: ${noteInput}`;

      const { error } = await supabase
        .from('task_assignments')
        .update({ employee_notes: newNotes })
        .eq('id', assignmentId);

      if (error) throw error;

      setTasks(prev => 
        prev.map(t => t.id === assignmentId ? { ...t, employee_notes: newNotes } : t)
      );
      setNoteInput('');
      toast({ title: 'Note added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: EmployeeTask['employee_status']) => {
    e.preventDefault();
    if (draggedTask) {
      handleStatusChange(draggedTask, status);
    }
    setDraggedTask(null);
  };

  const getTasksByStatus = (status: EmployeeTask['employee_status']) => {
    return tasks.filter(t => t.employee_status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-medium mb-2">No tasks assigned</h3>
          <p className="text-sm text-muted-foreground">
            You don't have any tasks assigned to you yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Tasks</h2>
        <Badge variant="secondary">{tasks.length} total</Badge>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUSES.map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const statusTasks = getTasksByStatus(status);

          return (
            <div
              key={status}
              className={`rounded-lg border-2 p-3 min-h-[300px] ${config.color}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4" />
                <span className="font-medium text-sm">{config.label}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {statusTasks.length}
                </Badge>
              </div>

              <div className="space-y-2">
                {statusTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                      draggedTask === task.id ? 'opacity-50' : ''
                    } ${updating === task.id ? 'opacity-70' : ''}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <button 
                            onClick={() => setSelectedTask(task)}
                            className="font-medium text-sm truncate text-left hover:underline hover:text-primary transition-colors w-full"
                          >
                            {task.task.title}
                          </button>
                          
                          {task.task.due_date && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.task.due_date).toLocaleDateString()}
                            </div>
                          )}

                          <div className="flex gap-1 mt-2 flex-wrap">
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ borderColor: task.task.importance === 'high' ? '#ef4444' : undefined }}
                            >
                              {task.task.importance}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {task.task.urgency}
                            </Badge>
                          </div>

                          {/* Expand toggle */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 h-6 text-xs"
                            onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                          >
                            {expandedTask === task.id ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" /> Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" /> More
                              </>
                            )}
                          </Button>

                          {expandedTask === task.id && (
                            <div className="mt-3 space-y-3 border-t pt-3">
                              {task.task.description && (
                                <p className="text-xs text-muted-foreground">
                                  {task.task.description}
                                </p>
                              )}
                              
                              {task.employee_notes && (
                                <div className="text-xs bg-muted p-2 rounded">
                                  <p className="font-medium mb-1">Notes:</p>
                                  <p className="whitespace-pre-wrap">{task.employee_notes}</p>
                                </div>
                              )}

                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Add a note..."
                                  value={expandedTask === task.id ? noteInput : ''}
                                  onChange={(e) => setNoteInput(e.target.value)}
                                  rows={2}
                                  className="text-xs"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full h-7 text-xs"
                                  onClick={() => handleAddNote(task.id)}
                                  disabled={!noteInput.trim() || updating === task.id}
                                >
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Add Note
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-lg">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold pr-8">
                  {selectedTask.task.title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={statusConfig[selectedTask.employee_status].badgeClass}>
                    {statusConfig[selectedTask.employee_status].label}
                  </Badge>
                </div>

                {/* Due Date */}
                {selectedTask.task.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Due: {new Date(selectedTask.task.due_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    {new Date(selectedTask.task.due_date) < new Date() && selectedTask.employee_status !== 'completed' && (
                      <Badge variant="destructive" className="text-xs">Overdue</Badge>
                    )}
                  </div>
                )}

                {/* Importance & Urgency */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Flag className={`h-4 w-4 ${
                      selectedTask.task.importance === 'high' ? 'text-red-500' : 
                      selectedTask.task.importance === 'medium' ? 'text-yellow-500' : 'text-gray-400'
                    }`} />
                    <span className="text-sm">
                      Importance: <span className="font-medium capitalize">{selectedTask.task.importance}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${
                      selectedTask.task.urgency === 'high' ? 'text-red-500' : 
                      selectedTask.task.urgency === 'medium' ? 'text-yellow-500' : 'text-gray-400'
                    }`} />
                    <span className="text-sm">
                      Urgency: <span className="font-medium capitalize">{selectedTask.task.urgency}</span>
                    </span>
                  </div>
                </div>

                {/* Description */}
                {selectedTask.task.description && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Description</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg whitespace-pre-wrap">
                      {selectedTask.task.description}
                    </p>
                  </div>
                )}

                {/* Required Skills */}
                {selectedTask.task.required_skills && selectedTask.task.required_skills.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Required Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedTask.task.required_skills.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Employee Notes */}
                {selectedTask.employee_notes && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Your Notes</h4>
                    <div className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                      {selectedTask.employee_notes}
                    </div>
                  </div>
                )}

                {/* Completion Date */}
                {selectedTask.employee_completed_at && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">
                      Completed on {new Date(selectedTask.employee_completed_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  {selectedTask.employee_status !== 'completed' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        handleStatusChange(selectedTask.id, 'completed');
                        setSelectedTask(null);
                      }}
                      className="flex-1"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTask(null)}
                    className={selectedTask.employee_status === 'completed' ? 'flex-1' : ''}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
