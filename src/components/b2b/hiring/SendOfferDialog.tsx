import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileCheck, DollarSign } from 'lucide-react';
import { format, addDays } from 'date-fns';

export interface OfferCandidateOption {
  applicationId: string;
  candidateId: string | null;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
}

interface SendOfferDialogProps {
  applicationId: string | null;
  candidateId: string | null;
  candidateName: string;
  candidateEmail: string;
  companyName: string;
  jobTitle: string;
  companyId: string;
  createdByCompanyUserId?: string | null;
  open: boolean;
  onClose: () => void;
  onSent: () => void;
  candidateOptions?: OfferCandidateOption[];
  requireCandidateSelection?: boolean;
}

export default function SendOfferDialog({
  applicationId,
  candidateId,
  candidateName,
  candidateEmail,
  companyName,
  jobTitle,
  companyId,
  createdByCompanyUserId = null,
  open,
  onClose,
  onSent,
  candidateOptions = [],
  requireCandidateSelection = false,
}: SendOfferDialogProps) {
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [salary, setSalary] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [bonus, setBonus] = useState('');
  const [equity, setEquity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [probationPeriod, setProbationPeriod] = useState('');
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setSelectedApplicationId(applicationId || '');
      // Set defaults
      const defaultStart = addDays(new Date(), 14);
      const defaultExpiry = addDays(new Date(), 7);
      setStartDate(format(defaultStart, 'yyyy-MM-dd'));
      setExpiresAt(format(defaultExpiry, 'yyyy-MM-dd'));
    }
  }, [open, applicationId]);

  const selectedCandidateOption =
    candidateOptions.find((option) => option.applicationId === selectedApplicationId) || null;

  const resolvedApplicationId = applicationId || selectedCandidateOption?.applicationId || null;
  const resolvedCandidateId = candidateId || selectedCandidateOption?.candidateId || null;
  const resolvedCandidateName = candidateName || selectedCandidateOption?.candidateName || 'Candidate';
  const resolvedCandidateEmail = candidateEmail || selectedCandidateOption?.candidateEmail || '';
  const resolvedJobTitle = jobTitle || selectedCandidateOption?.jobTitle || '';
  const hasEquity = equity.trim().length > 0;
  const hasSalaryInput = salary.trim().length > 0;
  const parsedSalary = hasSalaryInput ? parseFloat(salary) : 0;
  const hasBaseSalary = hasSalaryInput && !Number.isNaN(parsedSalary) && parsedSalary > 0;
  const canSubmitCompensation = hasBaseSalary || hasEquity;

  const parseProbationPeriodInDays = (value: string): number | null => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return null;

    const match = trimmed.match(/^(\d+)\s*(day|days|week|weeks|month|months)$/);
    if (!match) return null;

    const amount = Number.parseInt(match[1], 10);
    if (!Number.isFinite(amount) || amount <= 0) return null;

    const unit = match[2];
    if (unit.startsWith('day')) return amount;
    if (unit.startsWith('week')) return amount * 7;
    if (unit.startsWith('month')) return amount * 30;
    return null;
  };

  const handleSend = async () => {
    if (requireCandidateSelection && !selectedCandidateOption) {
      toast({
        title: 'Select a candidate',
        description: 'Please select a candidate to create an offer.',
        variant: 'destructive',
      });
      return;
    }

    if (!resolvedApplicationId || !canSubmitCompensation) {
      toast({
        title: 'Missing information',
        description: 'Please select a candidate and provide a base salary or equity.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const composedNotes = [
        notes.trim(),
        probationPeriod.trim() ? `Probationary Period: ${probationPeriod.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      // Create offer record
      const { data: offer, error } = await supabase
        .from('offers')
        .insert({
          application_id: resolvedApplicationId,
          job_title: resolvedJobTitle,
          created_by: createdByCompanyUserId,
          salary: hasBaseSalary ? parsedSalary : 0,
          salary_currency: currency,
          bonus: bonus ? parseFloat(bonus) : null,
          equity: equity.trim() || null,
          start_date: startDate || null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          candidate_notes: composedNotes || null,
          status: 'draft',
          sent_at: sendEmail ? new Date().toISOString() : null,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Schedule probation reminder email for the specific admin who created this offer.
      if (probationPeriod.trim()) {
        const probationDays = parseProbationPeriodInDays(probationPeriod);

        if (!createdByCompanyUserId || !startDate || probationDays === null) {
          toast({
            title: 'Offer created, reminder not scheduled',
            description:
              'To schedule an admin probation reminder, set Start Date and Probationary Period (e.g., "90 days", "12 weeks", "3 months").',
            variant: 'destructive',
          });
        } else {
          const reminderDate = new Date(startDate);
          reminderDate.setDate(reminderDate.getDate() + probationDays);

          const { error: reminderError } = await supabase.functions.invoke('create-probation-reminder', {
            body: {
              offerId: offer.id,
              companyId,
              adminCompanyUserId: createdByCompanyUserId,
              probationPeriod: probationPeriod.trim(),
              reminderAt: reminderDate.toISOString(),
            },
          });

          if (reminderError) {
            toast({
              title: 'Offer created, reminder not scheduled',
              description: reminderError.message || 'Could not schedule probation reminder email.',
              variant: 'destructive',
            });
          }
        }
      }

      // Update the status to sent if sending email
      if (sendEmail) {
        await supabase
          .from('offers')
          .update({ status: 'sent' })
          .eq('id', offer.id);
      }

      // Log activity
      if (resolvedCandidateId) {
        await supabase.from('candidate_activities').insert({
          company_id: companyId,
          candidate_id: resolvedCandidateId,
          application_id: resolvedApplicationId,
          activity_type: 'offer_sent',
          title: 'Offer sent',
          description: hasBaseSalary
            ? `Offer sent: $${parsedSalary.toLocaleString()} ${currency}`
            : 'Offer sent: Equity-only / unpaid role',
          metadata: {
            offer_id: offer.id,
            salary: hasBaseSalary ? parsedSalary : null,
            currency,
            equity: equity.trim() || null,
            probation_period: probationPeriod.trim() || null,
          },
        });
      }

      // Send email notification if enabled
      if (sendEmail && resolvedCandidateEmail) {
        try {
          const salaryValue = hasBaseSalary ? parsedSalary : null;
          const bonusValue = bonus ? parseFloat(bonus) : null;
          const { data: emailResponse, error: emailError } = await supabase.functions.invoke('send-offer-email', {
            body: {
              to: resolvedCandidateEmail,
              candidateName: resolvedCandidateName,
              companyName,
              jobTitle: resolvedJobTitle,
              salary: salaryValue,
              currency,
              bonus: bonusValue,
              equity: equity.trim() || null,
              startDate: startDate ? format(new Date(startDate), 'MMMM d, yyyy') : null,
              offerExpires: expiresAt ? format(new Date(expiresAt), 'MMMM d, yyyy') : null,
              probationPeriod: probationPeriod.trim() || null,
              notes: notes.trim() || null,
            },
          });

          if (emailError || (emailResponse && typeof emailResponse === 'object' && 'error' in emailResponse)) {
            const message = emailError?.message || (emailResponse as { error?: string }).error || 'Failed to send offer email';
            toast({
              title: 'Offer created, but email failed',
              description: message,
              variant: 'destructive',
            });
          }
        } catch (emailErr) {
          console.error('Failed to send email:', emailErr);
          toast({
            title: 'Offer created, but email failed',
            description: 'Could not send the offer email to the candidate.',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Offer sent',
        description: `Offer sent to ${resolvedCandidateName}`,
      });

      // Reset form
      setSalary('');
      setBonus('');
      setEquity('');
      setProbationPeriod('');
      setNotes('');
      
      onSent();
      onClose();
    } catch (err: any) {
      console.error('Error sending offer:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSelectedApplicationId('');
    setSalary('');
    setBonus('');
    setEquity('');
    setProbationPeriod('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Send Offer
          </DialogTitle>
          <DialogDescription>
            {resolvedCandidateName && resolvedJobTitle
              ? `Create and send an offer to ${resolvedCandidateName} for ${resolvedJobTitle}`
              : 'Select a candidate and create an offer'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {requireCandidateSelection && (
            <div className="space-y-2">
              <Label>Select Candidate</Label>
              <Select value={selectedApplicationId} onValueChange={setSelectedApplicationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a candidate..." />
                </SelectTrigger>
                <SelectContent>
                  {candidateOptions.map((option) => (
                    <SelectItem key={option.applicationId} value={option.applicationId}>
                      {option.candidateName} - {option.jobTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {requireCandidateSelection && selectedCandidateOption && (
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Role:</span>{' '}
              <span className="font-medium">{selectedCandidateOption.jobTitle}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="salary">Base Salary (Optional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="salary"
                  type="number"
                  placeholder="Leave blank for unpaid/equity-only roles"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bonus">Signing Bonus</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="bonus"
                  type="number"
                  placeholder="10000"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="equity">Equity (Optional)</Label>
              <Input
                id="equity"
                placeholder="e.g., 0.5% vesting over 4 years"
                value={equity}
                onChange={(e) => setEquity(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="probationPeriod">Probationary Period (Optional)</Label>
              <Input
                id="probationPeriod"
                placeholder="e.g., 90 days, 12 weeks, 3 months"
                value={probationPeriod}
                onChange={(e) => setProbationPeriod(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Offer Expires</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="sendEmail" className="text-sm font-normal cursor-pointer">
              Send email notification to candidate
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || !canSubmitCompensation}>
            {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
