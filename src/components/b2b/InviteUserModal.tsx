import { useEffect, useState } from 'react';
import { FunctionsHttpError } from '@supabase/supabase-js';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Sparkles, ChevronDown, ChevronUp, Brain, CreditCard, AlertCircle } from 'lucide-react';
import { AssessmentCategory } from '@/lib/assessmentQuestionLoader';
import RoleAnalysisCard from './RoleAnalysisCard';

function navigateToPaymentSettings() {
  window.dispatchEvent(new CustomEvent('rcf:b2b-guide-tab-change', { detail: { tab: 'settings' } }));
  setTimeout(() => {
    document.getElementById('payment-method-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 400);
}

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
  const [paymentError, setPaymentError] = useState<{ title: string; message: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow || '';
      document.body.style.overflow = prevBodyOverflow || '';
    };
  }, [open]);

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

      if (error) {
        // Extract structured body from non-2xx edge function responses
        let payload: Record<string, any> | null = null;
        if (error instanceof FunctionsHttpError) {
          payload = await error.context.json().catch(() => null);
        }
        const errData = payload ?? data;
        if (errData?.errorCode === 'NEEDS_PAYMENT_METHOD' || errData?.needsPaymentMethod) {
          setPaymentError({
            title: 'Payment method required',
            message: 'No payment method is on file. Add one in Settings to invite users beyond your pre-paid seats.',
          });
          setLoading(false);
          return;
        }
        if (errData?.errorCode === 'CARD_DECLINED') {
          setPaymentError({
            title: 'Payment method issue',
            message: 'No valid payment method is set up. Please add or update your payment information in Settings to invite new users.',
          });
          setLoading(false);
          return;
        }
        if (errData?.errorCode === 'REQUIRES_AUTHENTICATION') {
          setPaymentError({
            title: 'Card authentication required',
            message: `${errData?.error || 'Your bank requires authentication for this card. Please update your payment method in Settings and try again.'}${errData?.declineCode ? ` (Code: ${errData.declineCode})` : ''}`,
          });
          setLoading(false);
          return;
        }
        if (errData?.errorCode === 'CHARGE_FAILED') {
          setPaymentError({
            title: 'Payment failed',
            message: `${errData?.error || 'There was an issue charging your card. Please check your payment method in Settings.'}${errData?.errorCode ? ` (Code: ${errData.errorCode})` : ''}`,
          });
          setLoading(false);
          return;
        }
        throw new Error(payload?.error || error.message);
      }

      if (data?.error) {
        if (data.errorCode === 'NEEDS_PAYMENT_METHOD' || data.needsPaymentMethod) {
          setPaymentError({
            title: 'Payment method required',
            message: 'No payment method is on file. Add one in Settings to invite users beyond your pre-paid seats.',
          });
          setLoading(false);
          return;
        }
        if (data.errorCode === 'CARD_DECLINED') {
          setPaymentError({
            title: 'Payment method issue',
            message: 'No valid payment method is set up. Please add or update your payment information in Settings to invite new users.',
          });
          setLoading(false);
          return;
        }
        if (data.errorCode === 'REQUIRES_AUTHENTICATION') {
          setPaymentError({
            title: 'Card authentication required',
            message: `${data.error || 'Your bank requires authentication for this card. Please update your payment method in Settings and try again.'}${data.declineCode ? ` (Code: ${data.declineCode})` : ''}`,
          });
          setLoading(false);
          return;
        }
        if (data.errorCode === 'CHARGE_FAILED') {
          setPaymentError({
            title: 'Payment failed',
            message: `${data.error || 'There was an issue charging your card. Please check your payment method in Settings.'}${data.errorCode ? ` (Code: ${data.errorCode})` : ''}`,
          });
          setLoading(false);
          return;
        }
        throw new Error(data.error);
      }

      const billing = data.billing;
      const proRatedAmount = billing?.proRatedAmount;
      let billingMsg = '';
      if (billing?.charged) {
        billingMsg = proRatedAmount
          ? ` (Card charged $${(proRatedAmount / 100).toFixed(2)} pro-rated)`
          : ' (Card charged)';
      } else if (billing?.usedCredits) {
        billingMsg = proRatedAmount
          ? ` (Used $${(proRatedAmount / 100).toFixed(2)} billing credit)`
          : ' (Used billing credit)';
      } else if (billing?.withinPrePaidSeats) {
        const used = (billing.seatsUsed ?? 0) + 1;
        const total = billing.seatsPurchased ?? '?';
        billingMsg = ` (Pre-paid seat ${used}/${total} — charges start after seat ${total})`;
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
    setPaymentError(null);
    onClose();
  };

  return (
    <>
    {/* Payment error modal — overlays the invite modal */}
    <Dialog open={!!paymentError} onOpenChange={(isOpen) => { if (!isOpen) setPaymentError(null); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            {paymentError?.title}
          </DialogTitle>
          <DialogDescription className="pt-1">
            {paymentError?.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => setPaymentError(null)}>
            Close
          </Button>
          <Button
            onClick={() => {
              setPaymentError(null);
              handleClose();
              navigateToPaymentSettings();
            }}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Go to Payment Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="w-[95vw] max-w-5xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite New User
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your company and take an assessment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid items-start gap-6 py-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="space-y-4 min-w-0">
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

          <div className="rounded-lg border bg-muted/20 p-4 space-y-3 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <p className="font-medium text-sm">AI Role Analysis</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setShowRoleAnalysis((prev) => !prev)}
              >
                {showRoleAnalysis ? "Hide" : "Show"}
                {showRoleAnalysis ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Get a quick recommendation on whether this role should take the test.
            </p>

            {showRoleAnalysis && (
              <RoleAnalysisCard
                mode="inline"
                initialJobRole={jobRole}
                onCategorySelect={(cat) => setAssessmentCategory(cat)}
                showCategorySelect
              />
            )}
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
    </>
  );
}
