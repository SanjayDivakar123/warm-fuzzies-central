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
import { RefreshCw, Eye, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
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

const quadrantLabels: Record<string, string> = {
  q1: 'Q1: Do First',
  q2: 'Q2: Schedule',
  q3: 'Q3: Delegate',
  q4: 'Q4: Eliminate'
};

export function TaskHistoryPanel({ companyId, tasks, onRefresh }: TaskHistoryPanelProps) {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Record<string, any>>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [outcomeStatus, setOutcomeStatus] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
              <TableHead>Quadrant</TableHead>
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
                    <Badge variant="outline" className="text-xs">
                      {quadrantLabels[task.quadrant]}
                    </Badge>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openOutcomeModal(task)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Outcome Modal */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Outcome</DialogTitle>
            <DialogDescription>
              {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
