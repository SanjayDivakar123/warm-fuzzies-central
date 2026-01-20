import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Loader2, Sparkles, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TaskIntakeFormProps {
  companyId: string;
  onTaskCreated: (task: any, assignment: any) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;
}

export function TaskIntakeForm({ companyId, onTaskCreated, isAnalyzing, setIsAnalyzing }: TaskIntakeFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState<'high' | 'medium' | 'low'>('medium');
  const [urgency, setUrgency] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [department, setDepartment] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const calculateQuadrant = (imp: string, urg: string): 'q1' | 'q2' | 'q3' | 'q4' => {
    const isImportant = imp === 'high';
    const isUrgent = urg === 'high';
    
    if (isImportant && isUrgent) return 'q1';
    if (isImportant && !isUrgent) return 'q2';
    if (!isImportant && isUrgent) return 'q3';
    return 'q4';
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setIsAnalyzing(true);

    try {
      const quadrant = calculateQuadrant(importance, urgency);
      
      // Create the task
      const { data: taskData, error: taskError } = await supabase
        .from('work_tasks')
        .insert({
          company_id: companyId,
          title: title.trim(),
          description: description.trim(),
          importance,
          urgency,
          quadrant,
          due_date: dueDate?.toISOString() || null,
          department: department.trim() || null,
          required_skills: skills,
          created_by: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Call AI to get assignment recommendations
      const { data: aiData, error: aiError } = await supabase.functions.invoke('analyze-task-assignment', {
        body: {
          taskId: taskData.id,
          companyId,
          title: title.trim(),
          description: description.trim(),
          quadrant,
          importance,
          urgency,
          skills,
          department: department.trim() || null
        }
      });

      if (aiError) throw aiError;

      // Create assignment record
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskData.id,
          company_id: companyId,
          primary_assignee_id: aiData.primaryAssignee?.id || null,
          secondary_assignee_id: aiData.secondaryAssignee?.id || null,
          reasoning: aiData.reasoning,
          ai_score: aiData.score
        })
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      toast({
        title: 'Task analyzed',
        description: 'AI has generated assignment recommendations'
      });

      onTaskCreated(taskData, { ...assignmentData, ...aiData });

      // Reset form
      setTitle('');
      setDescription('');
      setImportance('medium');
      setUrgency('medium');
      setDueDate(undefined);
      setDepartment('');
      setSkills([]);
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to analyze task',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task in detail..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Importance *</Label>
              <Select value={importance} onValueChange={(v: 'high' | 'medium' | 'low') => setImportance(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Urgency *</Label>
              <Select value={urgency} onValueChange={(v: 'high' | 'medium' | 'low') => setUrgency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department (Optional)</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., Marketing, Engineering"
            />
          </div>

          <div className="space-y-2">
            <Label>Required Skills (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addSkill}>
                Add
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={!title.trim() || isAnalyzing}>
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing with AI...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze & Get Recommendations
          </>
        )}
      </Button>
    </form>
  );
}
