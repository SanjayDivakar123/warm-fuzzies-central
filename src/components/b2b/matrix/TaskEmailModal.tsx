import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Sparkles, Send, Edit3, Palette, Eye, Code, Type } from 'lucide-react';
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

interface EmailDesign {
  headerColor: string;
  accentColor: string;
  tone: 'professional' | 'friendly' | 'urgent' | 'casual';
  includeTaskDetails: boolean;
  includeDeadline: boolean;
  includeSkills: boolean;
  signOff: string;
  senderName: string;
}

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-like' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'urgent', label: 'Urgent', description: 'Direct and action-oriented' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
];

type EditMode = 'text' | 'html';

// Helper to parse first and last name from full_name
const parseNames = (fullName?: string, email?: string) => {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
    };
  }
  // Fallback to email prefix
  const emailPrefix = email?.split('@')[0] || '';
  return { firstName: emailPrefix, lastName: '' };
};

export function TaskEmailModal({ open, onClose, task, assignee, reasoning }: TaskEmailModalProps) {
  const { toast } = useToast();
  const { company } = useCompany();
  
  const { firstName, lastName } = parseNames(assignee.full_name, assignee.email);
  
  const [step, setStep] = useState<'design' | 'details' | 'draft' | 'preview'>('design');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [editMode, setEditMode] = useState<EditMode>('text');
  const [customHtml, setCustomHtml] = useState('');
  
  // Email design state
  const [design, setDesign] = useState<EmailDesign>({
    headerColor: company?.primary_color || '#6366f1',
    accentColor: company?.secondary_color || '#8b5cf6',
    tone: 'professional',
    includeTaskDetails: true,
    includeDeadline: true,
    includeSkills: false,
    signOff: 'Best regards',
    senderName: '',
  });

  // Replace template variables in content
  const replaceVariables = (content: string) => {
    return content
      .replace(/\{\{first_name\}\}/gi, firstName)
      .replace(/\{\{last_name\}\}/gi, lastName);
  };

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
          design: {
            tone: design.tone,
            includeTaskDetails: design.includeTaskDetails,
            includeDeadline: design.includeDeadline,
            includeSkills: design.includeSkills,
            signOff: design.signOff,
            senderName: design.senderName,
          },
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
      // Replace variables before sending
      const processedSubject = replaceVariables(emailSubject);
      const processedBody = editMode === 'html' ? null : replaceVariables(emailBody);
      const processedHtml = editMode === 'html' ? replaceVariables(customHtml) : null;

      const { data, error } = await supabase.functions.invoke('send-task-assignment-email', {
        body: {
          to: assignee.email,
          subject: processedSubject,
          body: processedBody,
          customHtml: processedHtml,
          taskId: task.id,
          assigneeId: assignee.id,
          companyName: company?.name || 'Role Color Finder',
          design: {
            headerColor: design.headerColor,
            accentColor: design.accentColor,
          },
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
    setStep('design');
    setAdditionalDetails('');
    setEmailSubject('');
    setEmailBody('');
    setEditMode('text');
    setCustomHtml('');
    onClose();
  };

  // Generate default HTML template for custom editing (uses {{first_name}} by default)
  const generateDefaultHtml = () => {
    return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: ${design.headerColor};">Task Assignment: ${task.title}</h2>
  
  <p>Hi {{first_name}},</p>
  
  <p>${emailBody}</p>
  
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <strong>Task Details:</strong>
    <p style="margin: 8px 0 0 0;">${task.description}</p>
  </div>
  
  <p>${design.signOff},<br/>${design.senderName || 'The Team'}</p>
</div>`;
  };

  const switchToHtmlMode = () => {
    if (!customHtml) {
      setCustomHtml(generateDefaultHtml());
    }
    setEditMode('html');
  };

  // Email preview component
  const EmailPreview = () => (
    <div className="border rounded-lg overflow-hidden bg-white text-gray-800">
      {/* Header */}
      <div 
        className="p-4"
        style={{ background: `linear-gradient(135deg, ${design.headerColor} 0%, ${design.accentColor} 100%)` }}
      >
        <h3 className="text-white font-semibold text-lg">{company?.name || 'Company'}</h3>
        <p className="text-white/80 text-sm">Task Assignment</p>
      </div>
      
      {/* Body */}
      <div className="p-4 space-y-3">
        <p className="text-sm">Hi {firstName || assignee.email.split('@')[0]},</p>
        
        {design.includeTaskDetails && (
          <div className="bg-gray-50 p-3 rounded border-l-4" style={{ borderColor: design.headerColor }}>
            <p className="font-medium text-sm">{task.title}</p>
            <p className="text-xs text-gray-600 mt-1">{task.description.slice(0, 100)}...</p>
          </div>
        )}
        
        {design.includeDeadline && task.due_date && (
          <p className="text-sm">
            <strong>Due:</strong> {new Date(task.due_date).toLocaleDateString()}
          </p>
        )}
        
        {design.includeSkills && task.required_skills.length > 0 && (
          <p className="text-sm">
            <strong>Skills:</strong> {task.required_skills.join(', ')}
          </p>
        )}
        
        <p className="text-sm text-gray-600 italic">
          [Your additional details will appear here]
        </p>
        
        <p className="text-sm mt-4">
          {design.signOff},<br />
          {design.senderName || 'The Team'}
        </p>
      </div>
      
      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 text-center text-xs text-gray-500">
        Sent via {company?.name || 'Role Color Finder'}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {step === 'design' ? 'Design Your Email' : 
             step === 'details' ? 'Add Details' : 
             step === 'preview' ? 'Preview Email' : 'Review & Edit'}
          </DialogTitle>
          <DialogDescription>
            {step === 'design' ? 'Customize the look and tone of your task assignment email' :
             step === 'details' ? `Add context for ${assignee.full_name || assignee.email}` :
             step === 'preview' ? 'See how your email will look' :
             'Review the AI-drafted email and make any edits'}
          </DialogDescription>
        </DialogHeader>

        {step === 'design' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Design Controls */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email Tone</Label>
                <Select 
                  value={design.tone} 
                  onValueChange={(v) => setDesign({ ...design, tone: v as EmailDesign['tone'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div>
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{opt.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="headerColor">Header Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="headerColor"
                      type="color"
                      value={design.headerColor}
                      onChange={(e) => setDesign({ ...design, headerColor: e.target.value })}
                      className="w-12 h-9 p-1 cursor-pointer"
                    />
                    <Input
                      value={design.headerColor}
                      onChange={(e) => setDesign({ ...design, headerColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={design.accentColor}
                      onChange={(e) => setDesign({ ...design, accentColor: e.target.value })}
                      className="w-12 h-9 p-1 cursor-pointer"
                    />
                    <Input
                      value={design.accentColor}
                      onChange={(e) => setDesign({ ...design, accentColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-sm font-medium">Include in Email</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeTask" className="text-sm font-normal">Task details box</Label>
                    <Switch
                      id="includeTask"
                      checked={design.includeTaskDetails}
                      onCheckedChange={(v) => setDesign({ ...design, includeTaskDetails: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeDeadline" className="text-sm font-normal">Due date</Label>
                    <Switch
                      id="includeDeadline"
                      checked={design.includeDeadline}
                      onCheckedChange={(v) => setDesign({ ...design, includeDeadline: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeSkills" className="text-sm font-normal">Required skills</Label>
                    <Switch
                      id="includeSkills"
                      checked={design.includeSkills}
                      onCheckedChange={(v) => setDesign({ ...design, includeSkills: v })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signOff">Sign Off</Label>
                <Input
                  id="signOff"
                  value={design.signOff}
                  onChange={(e) => setDesign({ ...design, signOff: e.target.value })}
                  placeholder="Best regards"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senderName">Your Name (optional)</Label>
                <Input
                  id="senderName"
                  value={design.senderName}
                  onChange={(e) => setDesign({ ...design, senderName: e.target.value })}
                  placeholder="Leave blank for 'The Team'"
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Live Preview
              </Label>
              <EmailPreview />
            </div>
          </div>
        )}

        {step === 'details' && (
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
                placeholder="Add any specific instructions, context, deadlines, or expectations you want to communicate..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                The AI will use this along with your design choices to craft the perfect email.
              </p>
            </div>
          </div>
        )}

        {step === 'draft' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            {/* Edit Mode Toggle */}
            <div className="flex items-center justify-between">
              <Label>Edit Mode</Label>
              <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                <Button
                  variant={editMode === 'text' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setEditMode('text')}
                  className="h-7 px-3"
                >
                  <Type className="h-3 w-3 mr-1" />
                  Text
                </Button>
                <Button
                  variant={editMode === 'html' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={switchToHtmlMode}
                  className="h-7 px-3"
                >
                  <Code className="h-3 w-3 mr-1" />
                  HTML
                </Button>
              </div>
            </div>

            {editMode === 'text' ? (
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
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use <code className="bg-muted px-1 rounded">{"{{first_name}}"}</code> and <code className="bg-muted px-1 rounded">{"{{last_name}}"}</code> as variables.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="htmlBody">Custom HTML</Label>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Code className="h-3 w-3" /> Advanced
                  </span>
                </div>
                <Textarea
                  id="htmlBody"
                  value={customHtml}
                  onChange={(e) => setCustomHtml(e.target.value)}
                  rows={12}
                  className="font-mono text-xs"
                  placeholder="Enter custom HTML for your email body..."
                />
                <p className="text-xs text-muted-foreground">
                  Use <code className="bg-muted px-1 rounded">{"{{first_name}}"}</code> and <code className="bg-muted px-1 rounded">{"{{last_name}}"}</code> as variables. The RCF logo will always appear in the footer.
                </p>
              </div>
            )}

            {/* Live HTML Preview */}
            {editMode === 'html' && customHtml && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  HTML Preview
                </Label>
                <div className="border rounded-lg p-4 bg-white text-gray-800 max-h-48 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: customHtml }} />
                  {/* RCF Footer Preview */}
                  <div className="mt-4 pt-4 border-t text-center">
                    <p className="text-xs text-gray-500">
                      Powered by <span className="text-primary font-medium">RoleColorFinder</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 bg-muted rounded-lg text-sm">
              <p><strong>To:</strong> {assignee.email}</p>
              <p><strong>From:</strong> {company?.name || 'Role Color Finder'}</p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === 'design' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep('details')}>
                <Palette className="mr-2 h-4 w-4" />
                Continue to Details
              </Button>
            </>
          )}
          
          {step === 'details' && (
            <>
              <Button variant="outline" onClick={() => setStep('design')}>
                Back to Design
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
          )}
          
          {step === 'draft' && (
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
