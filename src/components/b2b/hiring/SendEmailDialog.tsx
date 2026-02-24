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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';

interface SendEmailDialogProps {
  candidateId: string | null;
  candidateName: string;
  candidateEmail: string;
  companyName: string;
  companyId: string;
  open: boolean;
  onClose: () => void;
}

export default function SendEmailDialog({
  candidateId,
  candidateName,
  candidateEmail,
  companyName,
  companyId,
  open,
  onClose,
}: SendEmailDialogProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please enter both subject and message.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // Send through Mailgun-backed function.
      const { data, error } = await supabase.functions.invoke('send-candidate-email', {
        body: {
          to: candidateEmail,
          subject: subject.trim(),
          message: body.trim(),
          candidateName,
          companyName,
        },
      });

      if (error || (data && typeof data === 'object' && 'error' in data)) {
        throw new Error(error?.message || (data as { error?: string }).error || 'Failed to send email');
      }

      // Log the email activity
      if (candidateId) {
        await supabase.from('candidate_activities').insert({
          company_id: companyId,
          candidate_id: candidateId,
          activity_type: 'email_sent',
          title: 'Email sent',
          description: `Subject: ${subject}`,
          metadata: { subject, to: candidateEmail },
        });
      }

      toast({
        title: 'Email sent',
        description: `Email sent to ${candidateName}`,
      });

      setSubject('');
      setBody('');
      onClose();
    } catch (err: any) {
      console.error('Error sending email:', err);
      toast({
        title: 'Failed to send email',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSubject('');
    setBody('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Send an email to {candidateName} ({candidateEmail})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
