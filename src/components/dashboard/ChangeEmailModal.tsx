import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2 } from 'lucide-react';

interface ChangeEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}

export const ChangeEmailModal = ({ open, onOpenChange, currentEmail }: ChangeEmailModalProps) => {
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter a new email address.',
        variant: 'destructive',
      });
      return;
    }

    if (newEmail === currentEmail) {
      toast({
        title: 'Same Email',
        description: 'The new email is the same as your current email.',
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Confirmation Email Sent',
        description: 'Please check both your old and new email addresses to confirm the change.',
      });
      
      setNewEmail('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error changing email:', error);
      toast({
        title: 'Email Change Failed',
        description: error.message || 'Failed to change email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Change Email Address
          </DialogTitle>
          <DialogDescription>
            Enter your new email address. You'll need to confirm the change via both your old and new email.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleChangeEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-email">Current Email</Label>
            <Input
              id="current-email"
              type="email"
              value={currentEmail}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-email">New Email</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="Enter new email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewEmail('');
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Change Email'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
