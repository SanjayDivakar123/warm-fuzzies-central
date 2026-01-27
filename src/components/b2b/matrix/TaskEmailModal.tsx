import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Sparkles, Send, Edit3 } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';

interface TaskEmailModalProps {
  open: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    description: string;
    importance: string;
    urgency: string;
    due_date?: string | null;
    required_skills: string[];
  };
  assignee: {
    id: string;
    email: string;
    full_name?: string;
  };
  reasoning?: any;
}

export function TaskEmailModal({ open, onClose, task, assignee, reasoning }: TaskEmailModalProps) {
  const { toast } = useToast();
  const { company } = useCompany();
  const [step, setStep] = useState<'details' | 'draft' | 'sending'>('details');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('draft-task-email', {
        body: {
          task: {
            title: task.title,
            description: task.description,
            importance: task.importance,
            urgency: task.urgency,
            dueDate: task.due_date,
            requiredSkills: task.required_skills,
          },
          additionalDetails,
          assigneeName: assignee.full_name || assignee.email.split('@')[0],
          companyName: company?.name || 'the company',
          reasoning: reasoning?.behavioralReasoning || '',
        },
      });

      if (error) throw error;

      setEmailSubject(data.subject || `Task Assignment: ${task.title}`);
      setEmailBody(data.body || '');
      setStep('draft');
    } catch (error: any) {
      console.error('Error generating email draft:', error);
      toast({
        title: 'Error generating draft',
        description: error.message || 'Failed to generate email draft',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-task-assignment-email', {
        body: {
          to: assignee.email,
          subject: emailSubject,
          body: emailBody,
          taskId: task.id,
          assigneeId: assignee.id,
          companyName: company?.name || 'Role Color Finder',
        },
      });

      if (error) throw error;

      toast({
        title: 'Email sent!',
        description: `Task assignment email sent to ${assignee.full_name || assignee.email}`,
      });

      handleClose();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error sending email',
        description: error.message || 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setStep('details');
    setAdditionalDetails('');
    setEmailSubject('');
    setEmailBody('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {step === 'details' ? 'Compose Task Email' : 'Review & Send Email'}
          </DialogTitle>
          <DialogDescription>
            {step === 'details' 
              ? `Add details for ${assignee.full_name || assignee.email} about their new task`
              : 'Review the AI-drafted email and make any edits before sending'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'details' ? (
          <div className="space-y-4 py-4">
            {/* Task summary */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium">{task.title}</h4>
              <p className="text-sm text-muted-foreground">{task.description}</p>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-0.5 bg-background rounded">Importance: {task.importance}</span>
                <span className="px-2 py-0.5 bg-background rounded">Urgency: {task.urgency}</span>
              </div>
            </div>

            {/* Recipient info */}
            <div className="p-3 border rounded-lg flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {(assignee.full_name || assignee.email).charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{assignee.full_name || 'No name'}</p>
                <p className="text-sm text-muted-foreground">{assignee.email}</p>
              </div>
            </div>

            {/* Additional details */}
            <div className="space-y-2">
              <Label htmlFor="details">Additional Details for Email</Label>
              <Textarea
                id="details"
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Add any specific instructions, context, deadlines, or expectations you want to communicate to the assignee..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                The AI will use this information along with the task details to draft a professional email.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Email preview/edit */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="body">Email Body</Label>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Edit3 className="h-3 w-3" /> Editable
                </span>
              </div>
              <Textarea
                id="body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm">
              <p><strong>To:</strong> {assignee.email}</p>
              <p><strong>From:</strong> {company?.name || 'Role Color Finder'}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'details' ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerateDraft} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Drafting...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Draft
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('details')}>
                Back to Details
              </Button>
              <Button onClick={handleSendEmail} disabled={isSending || !emailSubject || !emailBody}>
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
