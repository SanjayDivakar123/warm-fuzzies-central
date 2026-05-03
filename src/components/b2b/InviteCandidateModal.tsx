// @ts-nocheck
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRoleColorSuggestion } from '@/hooks/useRoleColorSuggestion';
import { Loader2, UserPlus, Sparkles } from 'lucide-react';
import { AssessmentCategory } from '@/lib/assessmentQuestionLoader';

interface InviteCandidateModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  onInviteComplete: () => void;
}

type AssessmentType = '25q' | '50q';

const ASSESSMENT_CATEGORIES: { value: AssessmentCategory; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'entrepreneur', label: 'Entrepreneur' },
  { value: 'executive', label: 'Executive / Senior Leader' },
  { value: 'manager', label: 'Manager / Mid-Level Leader' },
];

const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: '25q', label: '25 Questions' },
  { value: '50q', label: '50 Questions' },
];

const ROLE_COLORS = ['yellow', 'red', 'green', 'blue'];

export default function InviteCandidateModal({
  open,
  onClose,
  companyId,
  onInviteComplete,
}: InviteCandidateModalProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [idealRoleColor, setIdealRoleColor] = useState<string>('');
  const [assessmentCategory, setAssessmentCategory] = useState<AssessmentCategory>('professional');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('25q');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { suggestColor, suggesting } = useRoleColorSuggestion();

  const handleInvite = async () => {
    if (!email.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: 'Invalid email format',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('invite-candidate', {
        body: {
          company_id: companyId,
          email: email.trim().toLowerCase(),
          full_name: fullName.trim() || null,
          position_title: positionTitle.trim() || null,
          ideal_role_color: idealRoleColor || null,
          assessment_category: assessmentCategory,
          assessment_type: assessmentType,
          notes: notes.trim() || null,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Candidate invited!',
        description: `Invitation sent to ${email}`,
      });

      // Reset form
      setEmail('');
      setFullName('');
      setPositionTitle('');
      setIdealRoleColor('');
      setAssessmentCategory('professional');
      setAssessmentType('25q');
      setNotes('');
      onInviteComplete();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error inviting candidate',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setFullName('');
    setPositionTitle('');
    setIdealRoleColor('');
    setAssessmentCategory('professional');
    setAssessmentType('25q');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Candidate
          </DialogTitle>
          <DialogDescription>
            Send an invitation to a job candidate to take an assessment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="candidate@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position Title</Label>
              <Input
                id="position"
                type="text"
                placeholder="Software Engineer"
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ideal Role Color</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-primary hover:text-primary"
                  onClick={() => suggestColor(positionTitle, setIdealRoleColor)}
                  disabled={loading || suggesting || !positionTitle.trim()}
                >
                  {suggesting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Auto-select
                </Button>
              </div>
              <Select
                value={idealRoleColor}
                onValueChange={setIdealRoleColor}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any color</SelectItem>
                  {ROLE_COLORS.map((color) => (
                    <SelectItem key={color} value={color} className="capitalize">
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assessment Category *</Label>
              <Select
                value={assessmentCategory}
                onValueChange={(v) => setAssessmentCategory(v as AssessmentCategory)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
              <Label>Assessment Length *</Label>
              <Select
                value={assessmentType}
                onValueChange={(v) => setAssessmentType(v as AssessmentType)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (internal)</Label>
            <Textarea
              id="notes"
              placeholder="Any notes about this candidate..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={loading || !email.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Inviting...
              </>
            ) : (
              'Send Invite'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}