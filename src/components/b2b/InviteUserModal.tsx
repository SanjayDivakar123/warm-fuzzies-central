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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Sparkles, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { AssessmentCategory, getCategoryDisplayName } from '@/lib/assessmentQuestionLoader';
import RoleAnalysisCard from './RoleAnalysisCard';

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  onInviteComplete: () => void;
  onCompanyUpdate?: () => void;
  availableSeats?: number; // deprecated - no longer used
  isUnlimitedCompany?: boolean; // deprecated - no longer used
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

export default function InviteUserModal({
  open,
  onClose,
  companyId,
  onInviteComplete,
  onCompanyUpdate,
}: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [assessmentCategory, setAssessmentCategory] = useState<AssessmentCategory>('professional');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('25q');
  const [loading, setLoading] = useState(false);
  const [suggestingCategory, setSuggestingCategory] = useState(false);
  const [showRoleAnalysis, setShowRoleAnalysis] = useState(false);
  const { toast } = useToast();

  const handleSuggestCategory = async () => {
    if (!jobRole.trim()) {
      toast({
        title: 'Job role required',
        description: 'Please enter a job role to get AI suggestion',
        variant: 'destructive',
      });
      return;
    }

    setSuggestingCategory(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-assessment-category', {
        body: { jobRole: jobRole.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAssessmentCategory(data.category);
      toast({
        title: data.aiAnalyzed ? 'AI Suggestion Applied' : 'Suggestion Applied',
        description: `${data.reason} (${data.confidence} confidence)`,
      });
    } catch (error: any) {
      toast({
        title: 'Error getting suggestion',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSuggestingCategory(false);
    }
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('invite-company-user', {
        body: {
          company_id: companyId,
          email: email.trim().toLowerCase(),
          full_name: fullName.trim() || null,
          job_role: jobRole.trim() || null,
          assessment_category: assessmentCategory,
          assessment_type: assessmentType,
        },
      });

      if (error) throw error;

      if (data?.error) {
        if (data.errorCode === 'NEEDS_PAYMENT_METHOD' || data.needsPaymentMethod) {
          toast({
            title: 'Payment method required',
            description: 'Please add a payment method in Settings before inviting users.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        if (data.errorCode === 'CHARGE_FAILED') {
          toast({
            title: 'Payment failed',
            description: data.error || 'Failed to charge for this seat. Please check your payment method.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        throw new Error(data.error);
      }

      const proRatedAmount = data.billing?.proRatedAmount;
      let billingMsg = '';
      if (data.billing?.charged) {
        billingMsg = proRatedAmount
          ? ` (Card charged $${(proRatedAmount / 100).toFixed(2)} pro-rated)`
          : ' (Card charged)';
      } else if (data.billing?.usedCredits) {
        billingMsg = proRatedAmount
          ? ` (Used $${(proRatedAmount / 100).toFixed(2)} credit pro-rated)`
          : ' (Used billing credit)';
      }

      toast({
        title: 'User invited!',
        description: `Invitation sent to ${email}${billingMsg}`,
      });

      setEmail('');
      setFullName('');
      setAssessmentCategory('professional');
      setAssessmentType('25q');
      onInviteComplete();
      if (onCompanyUpdate) onCompanyUpdate();
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      toast({
        title: 'Error inviting user',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setFullName('');
    setJobRole('');
    setAssessmentCategory('professional');
    setAssessmentType('25q');
    setShowRoleAnalysis(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite New User
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your company and take an assessment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name (optional)</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobRole">Job Role (optional)</Label>
            <Input
              id="jobRole"
              type="text"
              placeholder="e.g., Senior Engineer, Sales Manager"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              disabled={loading}
            />
            
            {/* AI Role Analysis Section */}
            <Collapsible open={showRoleAnalysis} onOpenChange={setShowRoleAnalysis}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary px-0"
                  type="button"
                >
                  <HelpCircle className="h-3 w-3" />
                  Should this role take the test?
                  {showRoleAnalysis ? (
                    <ChevronUp className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <RoleAnalysisCard
                  mode="inline"
                  initialJobRole={jobRole}
                  onCategorySelect={(cat) => setAssessmentCategory(cat)}
                  showCategorySelect
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Assessment Category *</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSuggestCategory}
                disabled={loading || suggestingCategory || !jobRole.trim()}
                className="h-7 text-xs gap-1 text-primary hover:text-primary"
              >
                {suggestingCategory ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Use AI to find category
              </Button>
            </div>
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={loading || !email.trim()}
          >
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
