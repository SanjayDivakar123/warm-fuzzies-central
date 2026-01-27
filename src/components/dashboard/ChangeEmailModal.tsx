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
import { Mail, Loader2, KeyRound, UserPlus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChangeEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}

type Step = 'enter-email' | 'verify-existing' | 'create-password';

export const ChangeEmailModal = ({ open, onOpenChange, currentEmail }: ChangeEmailModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('enter-email');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const resetModal = () => {
    setStep('enter-email');
    setNewEmail('');
    setPassword('');
    setConfirmPassword('');
    setEmailExists(false);
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkEmailExists = async (): Promise<boolean> => {
    // We can check if email exists by trying to sign in with a fake password
    // If the error is "Invalid login credentials", the email exists
    // If the error is something else or no user found, email doesn't exist
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: newEmail,
        password: 'checking-existence-only-' + Date.now(), // Random password that won't work
      });
      
      // If we get "Invalid login credentials", email exists with password
      if (error?.message?.includes('Invalid login credentials')) {
        return true;
      }
      
      // If we get "Email not confirmed", email exists
      if (error?.message?.includes('Email not confirmed')) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
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

    if (!validateEmail(newEmail)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const exists = await checkEmailExists();
      setEmailExists(exists);
      
      if (exists) {
        setStep('verify-existing');
      } else {
        setStep('create-password');
      }
    } catch (error: any) {
      console.error('Error checking email:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyExisting = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast({
        title: 'Password Required',
        description: 'Please enter the password for the existing account.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Try to sign in with the new email and provided password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: newEmail,
        password: password,
      });

      if (signInError) {
        toast({
          title: 'Incorrect Password',
          description: 'The password you entered is incorrect for this account.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Password verified! Now sign back in as current user and update email
      // First, we need to sign out of the verified account
      await supabase.auth.signOut();

      // The user will need to sign back in - we'll show them a success message
      toast({
        title: 'Account Verified',
        description: 'The existing account has been verified. You will need to merge your accounts manually or contact support.',
      });
      
      handleClose();
    } catch (error: any) {
      console.error('Error verifying account:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Failed to verify account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({
        title: 'Password Required',
        description: 'Please enter and confirm a password.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords Don\'t Match',
        description: 'Please make sure both passwords are identical.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Update user email - Supabase will send confirmation
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
        password: password, // Also set/update password
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Confirmation Email Sent',
        description: 'Please check both your old and new email addresses to confirm the change. Your new password will also be set once confirmed.',
      });
      
      handleClose();
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'enter-email' && <Mail className="h-5 w-5" />}
            {step === 'verify-existing' && <KeyRound className="h-5 w-5" />}
            {step === 'create-password' && <UserPlus className="h-5 w-5" />}
            {step === 'enter-email' && 'Change Email Address'}
            {step === 'verify-existing' && 'Verify Account Ownership'}
            {step === 'create-password' && 'Create Password'}
          </DialogTitle>
          <DialogDescription>
            {step === 'enter-email' && 'Enter your new email address.'}
            {step === 'verify-existing' && 'This email is already linked to an existing RoleColorFinder account. Enter the password to verify ownership.'}
            {step === 'create-password' && 'Create a password for your account with the new email.'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Step 1: Enter new email */}
        {step === 'enter-email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Step 2a: Verify existing account */}
        {step === 'verify-existing' && (
          <form onSubmit={handleVerifyExisting} className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                An account already exists with <strong>{newEmail}</strong>. Enter the password for that account to verify ownership.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="verify-password">Password for {newEmail}</Label>
              <Input
                id="verify-password"
                type="password"
                placeholder="Enter password for existing account"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep('enter-email');
                  setPassword('');
                }}
                disabled={loading}
              >
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Step 2b: Create password for new account */}
        {step === 'create-password' && (
          <form onSubmit={handleCreatePassword} className="space-y-4">
            <Alert>
              <UserPlus className="h-4 w-4" />
              <AlertDescription>
                Create a password for your new email <strong>{newEmail}</strong>. You'll receive confirmation emails at both addresses.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="create-password">New Password</Label>
              <Input
                id="create-password"
                type="password"
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm Password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep('enter-email');
                  setPassword('');
                  setConfirmPassword('');
                }}
                disabled={loading}
              >
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Change Email'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
