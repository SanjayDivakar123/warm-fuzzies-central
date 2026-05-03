// @ts-nocheck
import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskIntakeForm } from './matrix/TaskIntakeForm';
import { TaskAssignmentOutput } from './matrix/TaskAssignmentOutput';
import { TaskHistoryPanel } from './matrix/TaskHistoryPanel';
import { Badge } from '@/components/ui/badge';
import { Brain, ListTodo, History } from 'lucide-react';
import { useHelpTour } from '@/contexts/HelpTourContext';

interface Task {
  id: string;
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  urgency: 'high' | 'medium' | 'low';
  quadrant: 'q1' | 'q2' | 'q3' | 'q4';
  due_date: string | null;
  department: string | null;
  required_skills: string[];
  status: string;
  created_at: string;
}

interface Assignment {
  id: string;
  task_id: string;
  primary_assignee_id: string | null;
  secondary_assignee_id: string | null;
  reasoning: any;
  ai_score: number | null;
  approved_at: string | null;
  outcome_status: string | null;
}

export function WorkAssigningMatrixTab() {
  const { company } = useCompany();
  const { activeTour, currentStepIndex } = useHelpTour();
  const [activeTab, setActiveTab] = useState('create');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (company?.id) {
      fetchTasks();
    }
  }, [company?.id]);

  useEffect(() => {
    if (activeTour?.id !== 'admin-work-matrix') return;

    // Keep internal matrix tabs aligned with each guided step.
    if (currentStepIndex === 0 && activeTab !== 'create') {
      setActiveTab('create');
      return;
    }
    // Step 2 explains what comes next, but assignment stays unavailable
    // until a task is created.
    if (currentStepIndex === 2 && activeTab !== 'history') {
      setActiveTab('history');
    }
  }, [activeTour?.id, currentStepIndex, activeTab]);

  const fetchTasks = async () => {
    if (!company?.id) return;
    
    const { data } = await supabase
      .from('work_tasks')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setTasks(data as Task[]);
    }
  };

  const handleTaskCreated = async (task: Task, assignment: Assignment) => {
    setCurrentTask(task);
    setCurrentAssignment(assignment);
    setActiveTab('assignment');
    await fetchTasks();
  };

  const handleAssignmentApproved = async () => {
    setCurrentTask(null);
    setCurrentAssignment(null);
    setActiveTab('history');
    await fetchTasks();
  };

  if (!company) return null;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Decision-Making Matrix</CardTitle>
              <CardDescription>
                AI-powered task assignment using RoleColor, skills, and workload
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3" data-tour="matrix-tabs">
              <TabsTrigger value="create" className="flex items-center gap-2" data-tour="matrix-tab-create">
                <ListTodo className="h-4 w-4" />
                Create Task
              </TabsTrigger>
              <TabsTrigger value="assignment" className="flex items-center gap-2" disabled={!currentTask} data-tour="matrix-tab-assignment">
                <Brain className="h-4 w-4" />
                Assignment
                {currentTask && <Badge variant="secondary" className="ml-1">1</Badge>}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2" data-tour="matrix-tab-history">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-6" data-tour="matrix-create">
              <Card className="mb-4 border-primary/20 bg-primary/5" data-tour="matrix-assignment-explainer">
                <CardContent className="py-3 text-sm text-center text-muted-foreground">
                  After you create a task, the Assignment tab unlocks and shows AI recommendations for the best assignee.
                </CardContent>
              </Card>
              <TaskIntakeForm 
                companyId={company.id} 
                onTaskCreated={handleTaskCreated}
                isAnalyzing={isAnalyzing}
                setIsAnalyzing={setIsAnalyzing}
              />
            </TabsContent>

            <TabsContent value="assignment" className="mt-6" data-tour="matrix-assignment">
              {currentTask && currentAssignment ? (
                <TaskAssignmentOutput
                  task={currentTask}
                  assignment={currentAssignment}
                  companyId={company.id}
                  onApproved={handleAssignmentApproved}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Create a task first to see AI recommendations
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-6" data-tour="matrix-history">
              <TaskHistoryPanel 
                companyId={company.id} 
                tasks={tasks}
                onRefresh={fetchTasks}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
