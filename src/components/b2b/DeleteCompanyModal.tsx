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
import { useAuth } from '@/contexts/AuthContext';

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
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const { signOut } = useAuth();

  const isConfirmed = confirmationText === company.name;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke('delete-company', {
        body: { company_id: company.id },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Company deleted',
        description: 'Your company and all associated data have been permanently deleted.',
      });

      // Close modal and redirect to create new company
      onClose();
      window.location.href = '/b2b';
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast({
        title: 'Failed to delete company',
        description: error.message || 'An error occurred while deleting the company.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
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
            This action is <strong>permanent and irreversible</strong>. All company data will be deleted, including:
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
              Type <strong className="text-foreground">{company.name}</strong> to confirm:
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
          <Button variant="outline" onClick={handleClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || deleting}
            className="gap-2"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Company
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
