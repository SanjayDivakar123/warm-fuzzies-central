import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Eye, CheckCircle, Clock, XCircle, AlertCircle, Check, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  importance: string;
  urgency: string;
  quadrant: string;
  status: string;
  created_at: string;
  due_date: string | null;
}

interface TaskHistoryPanelProps {
  companyId: string;
  tasks: Task[];
  onRefresh: () => void;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
  assigned: { label: 'Assigned', icon: AlertCircle, color: 'text-blue-600 bg-blue-100' },
  in_progress: { label: 'In Progress', icon: RefreshCw, color: 'text-purple-600 bg-purple-100' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-600 bg-red-100' }
};


export function TaskHistoryPanel({ companyId, tasks, onRefresh }: TaskHistoryPanelProps) {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Record<string, any>>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalTab, setModalTab] = useState<'outcome' | 'edit'>('outcome');
  const [outcomeStatus, setOutcomeStatus] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImportance, setEditImportance] = useState('');
  const [editUrgency, setEditUrgency] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    if (tasks.length > 0) {
      fetchAssignments();
    }
  }, [tasks]);

  const fetchAssignments = async () => {
    const taskIds = tasks.map(t => t.id);
    
    const { data } = await supabase
      .from('task_assignments')
      .select('*')
      .in('task_id', taskIds);

    if (data) {
      const assignmentMap: Record<string, any> = {};
      for (const a of data) {
        assignmentMap[a.task_id] = a;
      }
      setAssignments(assignmentMap);
    }
  };

  const openOutcomeModal = (task: Task) => {
    const assignment = assignments[task.id];
    setSelectedTask(task);
    setOutcomeStatus(assignment?.outcome_status || '');
    setOutcomeNotes(assignment?.outcome_notes || '');
    
    // Populate edit fields
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditImportance(task.importance);
    setEditUrgency(task.urgency);
    setEditDueDate(task.due_date ? task.due_date.split('T')[0] : '');
    setEditStatus(task.status);
    setModalTab('outcome');
  };

  const approveTask = async (taskId: string) => {
    const assignment = assignments[taskId];
    if (!assignment) {
      toast({
        title: 'No assignment found',
        description: 'This task has not been assigned to anyone yet.',
        variant: 'destructive'
      });
      return;
    }

    setIsApproving(taskId);
    try {
      const { error } = await supabase
        .from('task_assignments')
        .update({ approved_at: new Date().toISOString() })
        .eq('id', assignment.id);

      if (error) throw error;

      // Update task status to assigned
      await supabase
        .from('work_tasks')
        .update({ status: 'assigned' })
        .eq('id', taskId);

      toast({
        title: 'Task approved!',
        description: 'The employee can now see this task.'
      });

      onRefresh();
      fetchAssignments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve task',
        variant: 'destructive'
      });
    } finally {
      setIsApproving(null);
    }
  };

  const saveTaskEdit = async () => {
    if (!selectedTask) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('work_tasks')
        .update({
          title: editTitle,
          description: editDescription,
          importance: editImportance,
          urgency: editUrgency,
          due_date: editDueDate || null,
          status: editStatus
        })
        .eq('id', selectedTask.id);

      if (error) throw error;

      toast({
        title: 'Task updated',
        description: 'Task details have been saved.'
      });

      setSelectedTask(null);
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update task',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTask = async () => {
    if (!selectedTask) return;
    
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    setIsSaving(true);
    try {
      // First delete any assignments
      await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', selectedTask.id);

      // Then delete the task
      const { error } = await supabase
        .from('work_tasks')
        .delete()
        .eq('id', selectedTask.id);

      if (error) throw error;

      toast({
        title: 'Task deleted',
        description: 'The task has been removed.'
      });

      setSelectedTask(null);
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete task',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveOutcome = async () => {
    if (!selectedTask) return;
    
    const assignment = assignments[selectedTask.id];
    if (!assignment) return;

    setIsSaving(true);

    try {
      const { error: assignmentError } = await supabase
        .from('task_assignments')
        .update({
          outcome_status: outcomeStatus,
          outcome_notes: outcomeNotes
        })
        .eq('id', assignment.id);

      if (assignmentError) throw assignmentError;

      // Update task status if outcome indicates completion
      if (outcomeStatus === 'success' || outcomeStatus === 'completed') {
        await supabase
          .from('work_tasks')
          .update({ status: 'completed' })
          .eq('id', selectedTask.id);
      }

      toast({
        title: 'Outcome saved',
        description: 'Task outcome has been recorded'
      });

      setSelectedTask(null);
      onRefresh();
      fetchAssignments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save outcome',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No tasks created yet</p>
        <p className="text-sm text-muted-foreground">
          Create your first task to see AI-powered assignment recommendations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Task History</h3>
          <p className="text-sm text-muted-foreground">{tasks.length} tasks total</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const StatusIcon = statusConfig[task.status]?.icon || Clock;
              const assignment = assignments[task.id];

              return (
                <TableRow key={task.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {task.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs capitalize">{task.importance}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{task.urgency}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('gap-1', statusConfig[task.status]?.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig[task.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {assignment?.outcome_status ? (
                      <Badge variant="secondary">{assignment.outcome_status}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(task.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {assignment && !assignment.approved_at && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => approveTask(task.id)}
                          disabled={isApproving === task.id}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {isApproving === task.id ? 'Approving...' : 'Approve'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openOutcomeModal(task)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Task Management Modal */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Task</DialogTitle>
            <DialogDescription>
              {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={modalTab} onValueChange={(v) => setModalTab(v as 'outcome' | 'edit')} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Edit Task</TabsTrigger>
              <TabsTrigger value="outcome">Update Outcome</TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Task title"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Task description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Importance</Label>
                  <Select value={editImportance} onValueChange={setEditImportance}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select importance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select value={editUrgency} onValueChange={setEditUrgency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveTaskEdit} className="flex-1" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={deleteTask} 
                  disabled={isSaving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="outcome" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Outcome Status</Label>
                <Select value={outcomeStatus} onValueChange={setOutcomeStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="partial">Partial Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="reassigned">Reassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="Add any notes about the task outcome..."
                  rows={3}
                />
              </div>
              <Button onClick={saveOutcome} className="w-full" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Outcome'}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
