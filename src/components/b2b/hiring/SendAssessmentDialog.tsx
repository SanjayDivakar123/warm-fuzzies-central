import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, ClipboardCheck, Sparkles } from 'lucide-react';
import { useRoleColorSuggestion } from '@/hooks/useRoleColorSuggestion';

interface SendAssessmentDialogProps {
  candidateId: string | null;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyId: string;
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}

type AssessmentCategory = 'professional' | 'entrepreneur' | 'executive' | 'manager';
type AssessmentType = '25q' | '50q';

const ASSESSMENT_CATEGORIES: { value: AssessmentCategory; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'entrepreneur', label: 'Entrepreneur' },
  { value: 'executive', label: 'Executive / Senior Leader' },
  { value: 'manager', label: 'Manager / Mid-Level Leader' },
];

const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: '25q', label: '25 Questions (Quick)' },
  { value: '50q', label: '50 Questions (Comprehensive)' },
];

const ROLE_COLORS: { value: string; label: string; color: string }[] = [
  { value: 'yellow', label: 'Yellow', color: 'bg-yellow-500' },
  { value: 'red', label: 'Red', color: 'bg-red-500' },
  { value: 'green', label: 'Green', color: 'bg-green-500' },
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
];

export default function SendAssessmentDialog({
  candidateId,
  candidateName,
  candidateEmail,
  jobTitle,
  companyId,
  open,
  onClose,
  onSent,
}: SendAssessmentDialogProps) {
  const [assessmentCategory, setAssessmentCategory] = useState<AssessmentCategory>('professional');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('25q');
  const [idealRoleColor, setIdealRoleColor] = useState<string>('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { suggestColor, suggesting } = useRoleColorSuggestion();

  const handleSuggestColor = async () => {
    if (!jobTitle) return;
    suggestColor(jobTitle, (color) => {
      setIdealRoleColor(color.toLowerCase());
    });
  };

  const handleSend = async () => {
    if (!candidateId) return;

    setSending(true);
    try {
      // Update candidate with assessment info and generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 6).toUpperCase() + 
                         Math.random().toString(36).substring(2, 6).toUpperCase();

      const { error: updateError } = await supabase
        .from('candidates')
        .update({
          status: 'assessment_pending',
          assessment_category: assessmentCategory,
          assessment_type: assessmentType,
          ideal_role_color: idealRoleColor || null,
          invite_code: inviteCode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', candidateId);

      if (updateError) throw updateError;

      // Log activity
      await supabase.from('candidate_activities').insert({
        company_id: companyId,
        candidate_id: candidateId,
        activity_type: 'assessment_invited',
        title: 'Assessment invitation sent',
        description: `${assessmentType === '25q' ? '25-question' : '50-question'} ${assessmentCategory} assessment`,
        metadata: {
          assessment_category: assessmentCategory,
          assessment_type: assessmentType,
          ideal_role_color: idealRoleColor,
          invite_code: inviteCode,
        },
      });

      // Send email notification
      try {
        const assessmentUrl = `${window.location.origin}/candidate-assessment?code=${inviteCode}`;
        
        await supabase.functions.invoke('send-email', {
          body: {
            to: candidateEmail,
            subject: `RoleColor Assessment Invitation${jobTitle ? ` - ${jobTitle}` : ''}`,
            html: `
              <h2>You're Invited to Complete Your RoleColor Assessment</h2>
              <p>Hello ${candidateName},</p>
              <p>As part of our hiring process${jobTitle ? ` for the <strong>${jobTitle}</strong> position` : ''}, we'd like you to complete a RoleColor personality assessment.</p>
              <p>This assessment will help us understand your work style and how you'd fit with our team.</p>
              <h3>Assessment Details:</h3>
              <ul>
                <li><strong>Type:</strong> ${assessmentCategory.charAt(0).toUpperCase() + assessmentCategory.slice(1)} Assessment</li>
                <li><strong>Questions:</strong> ${assessmentType === '25q' ? '25' : '50'} questions</li>
                <li><strong>Duration:</strong> Approximately ${assessmentType === '25q' ? '10-15' : '20-30'} minutes</li>
              </ul>
              <p style="margin: 24px 0;">
                <a href="${assessmentUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Start Assessment
                </a>
              </p>
              <p>Or use this code: <strong>${inviteCode}</strong></p>
              <p>Best regards,<br>The Hiring Team</p>
            `,
          },
        });
      } catch (emailErr) {
        console.error('Failed to send email:', emailErr);
      }

      toast({
        title: 'Assessment sent',
        description: `RoleColor assessment invitation sent to ${candidateName}`,
      });

      onSent();
      onClose();
    } catch (err: any) {
      console.error('Error sending assessment:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Send RoleColor Assessment
          </DialogTitle>
          <DialogDescription>
            Send a personality assessment to {candidateName} before the interview
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Assessment Category</Label>
            <Select 
              value={assessmentCategory} 
              onValueChange={(v) => setAssessmentCategory(v as AssessmentCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSESSMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Number of Questions</Label>
            <Select 
              value={assessmentType} 
              onValueChange={(v) => setAssessmentType(v as AssessmentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSESSMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ideal RoleColor for Position</Label>
              {jobTitle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSuggestColor}
                  disabled={suggesting}
                  className="text-xs"
                >
                  {suggesting ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  AI Suggest
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {ROLE_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setIdealRoleColor(color.value)}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                    idealRoleColor === color.value
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${color.color}`} />
                  <span className="text-xs">{color.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Optional: Set the ideal RoleColor for this position to calculate fit scores
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 text-sm">
            <p className="font-medium mb-1">What happens next:</p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• Candidate receives email with assessment link</li>
              <li>• They complete the {assessmentType === '25q' ? '25-question' : '50-question'} assessment</li>
              <li>• Results automatically appear in their profile</li>
              <li>• You'll see their RoleColor and fit score</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Assessment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
