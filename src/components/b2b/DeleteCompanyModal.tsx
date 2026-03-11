import { useState } from 'react';
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
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeleteCompanyModalProps {
  open: boolean;
  onClose: () => void;
  company: {
    id: string;
    name: string;
  };
}

export default function DeleteCompanyModal({ open, onClose, company }: DeleteCompanyModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const isConfirmed = confirmationText === company.name;

  const handleRequestDelete = async () => {
    if (!isConfirmed) return;

    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('delete-company', {
        body: { action: 'request', company_id: company.id },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Confirmation email sent',
        description: 'A secure deletion link was sent to the owner email. Open the link and type the company name to complete deletion.',
      });

      onClose();
    } catch (error: any) {
      console.error('Error requesting company deletion:', error);
      toast({
        title: 'Failed to request deletion',
        description: error.message || 'An error occurred while requesting company deletion.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Company
          </DialogTitle>
          <DialogDescription className="text-left">
            This action is <strong>permanent and irreversible</strong>. To protect your company, deletion must be approved from the owner email via a secure link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 bg-destructive/5 p-4 rounded-lg border border-destructive/20">
            <li>All company users and their invitations</li>
            <li>All assessment results</li>
            <li>All tasks and task assignments</li>
            <li>Company branding and settings</li>
          </ul>

          <div className="space-y-2">
            <Label htmlFor="confirm-name">
              Type <strong className="text-foreground">{company.name}</strong> to send deletion approval email:
            </Label>
            <Input
              id="confirm-name"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Enter company name"
              className="border-destructive/50 focus-visible:ring-destructive"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRequestDelete}
            disabled={!isConfirmed || sending}
            className="gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Send Delete Approval Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
