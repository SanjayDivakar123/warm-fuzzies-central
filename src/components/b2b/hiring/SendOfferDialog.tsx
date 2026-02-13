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

interface SendOfferDialogProps {
  applicationId: string | null;
  candidateId: string | null;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyId: string;
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}

export default function SendOfferDialog({
  applicationId,
  candidateId,
  candidateName,
  candidateEmail,
  jobTitle,
  companyId,
  open,
  onClose,
  onSent,
}: SendOfferDialogProps) {
  const [salary, setSalary] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [bonus, setBonus] = useState('');
  const [equity, setEquity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // Set defaults
      const defaultStart = addDays(new Date(), 14);
      const defaultExpiry = addDays(new Date(), 7);
      setStartDate(format(defaultStart, 'yyyy-MM-dd'));
      setExpiresAt(format(defaultExpiry, 'yyyy-MM-dd'));
    }
  }, [open]);

  const handleSend = async () => {
    if (!salary || !applicationId) {
      toast({
        title: 'Missing information',
        description: 'Please enter the salary amount.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // Create offer record
      const { data: offer, error } = await supabase
        .from('offers')
        .insert({
          application_id: applicationId,
          job_title: jobTitle,
          salary: parseFloat(salary),
          salary_currency: currency,
          bonus: bonus ? parseFloat(bonus) : null,
          equity: equity.trim() || null,
          start_date: startDate || null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          candidate_notes: notes.trim() || null,
          status: 'draft',
          sent_at: sendEmail ? new Date().toISOString() : null,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Update the status to sent if sending email
      if (sendEmail) {
        await supabase
          .from('offers')
          .update({ status: 'sent' })
          .eq('id', offer.id);
      }

      // Log activity
      if (candidateId) {
        await supabase.from('candidate_activities').insert({
          company_id: companyId,
          candidate_id: candidateId,
          application_id: applicationId,
          activity_type: 'offer_sent',
          title: 'Offer sent',
          description: `Offer sent: $${parseFloat(salary).toLocaleString()} ${currency}`,
          metadata: {
            offer_id: offer.id,
            salary,
            currency,
          },
        });
      }

      // Send email notification if enabled
      if (sendEmail && candidateEmail) {
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: candidateEmail,
              subject: `Job Offer: ${jobTitle}`,
              html: `
                <h2>Congratulations!</h2>
                <p>Dear ${candidateName},</p>
                <p>We are pleased to extend an offer for the position of <strong>${jobTitle}</strong>.</p>
                <h3>Offer Details:</h3>
                <ul>
                  <li><strong>Base Salary:</strong> $${parseFloat(salary).toLocaleString()} ${currency}</li>
                  ${bonus ? `<li><strong>Signing Bonus:</strong> $${parseFloat(bonus).toLocaleString()} ${currency}</li>` : ''}
                  ${equity ? `<li><strong>Equity:</strong> ${equity}</li>` : ''}
                  ${startDate ? `<li><strong>Start Date:</strong> ${format(new Date(startDate), 'MMMM d, yyyy')}</li>` : ''}
                </ul>
                ${expiresAt ? `<p><em>This offer expires on ${format(new Date(expiresAt), 'MMMM d, yyyy')}.</em></p>` : ''}
                ${notes ? `<p><strong>Additional Notes:</strong><br>${notes}</p>` : ''}
                <p>Please review the offer and let us know your decision.</p>
                <p>Best regards,<br>The Hiring Team</p>
              `,
            },
          });
        } catch (emailErr) {
          console.error('Failed to send email:', emailErr);
        }
      }

      toast({
        title: 'Offer sent',
        description: `Offer sent to ${candidateName}`,
      });

      // Reset form
      setSalary('');
      setBonus('');
      setEquity('');
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
    setSalary('');
    setBonus('');
    setEquity('');
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
            Create and send an offer to {candidateName} for {jobTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="salary">Base Salary *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="salary"
                  type="number"
                  placeholder="100000"
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
          <Button onClick={handleSend} disabled={sending || !salary}>
            {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
