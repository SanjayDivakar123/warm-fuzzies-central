import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

type PaymentStatus = 'verifying' | 'creating' | 'success' | 'error';

export default function B2BPaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [companyName, setCompanyName] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      setErrorMessage('No payment session found');
      return;
    }

    verifyAndCreateCompany(sessionId);
  }, [searchParams]);

  const verifyAndCreateCompany = async (sessionId: string) => {
    try {
      setStatus('verifying');
      console.log('Verifying payment session:', sessionId);

      // Call edge function to verify payment and create company
      const { data, error } = await supabase.functions.invoke('verify-b2b-payment', {
        body: { sessionId },
      });

      if (error) {
        console.error('Verification error:', error);
        throw new Error(error.message || 'Payment verification failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.success) {
        throw new Error('Payment not completed');
      }

      setStatus('creating');
      setCompanyName(data.companyName || 'Your company');

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStatus('success');
      
      toast({
        title: 'Company created successfully!',
        description: `${data.companyName} is ready to use.`,
      });

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate('/b2b/company-portal');
      }, 3000);

    } catch (error: any) {
      console.error('Error in payment verification:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to process payment');
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to create company',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-role-green/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-role-blue/20 rounded-full blur-3xl animate-pulse delay-500" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center p-8 max-w-md mx-auto"
      >
        {status === 'verifying' && (
          <div className="space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Verifying Payment</h2>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </div>
        )}

        {status === 'creating' && (
          <div className="space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Creating Your Company</h2>
            <p className="text-muted-foreground">Setting up {companyName}...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <CheckCircle className="h-20 w-20 text-role-green mx-auto" />
            </motion.div>
            <h2 className="text-3xl font-bold">Payment Successful!</h2>
            <p className="text-muted-foreground">
              {companyName} has been created. Redirecting to your dashboard...
            </p>
            <Button onClick={() => navigate('/b2b/company-portal')} className="mt-4">
              Go to Dashboard Now
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <XCircle className="h-20 w-20 text-destructive mx-auto" />
            <h2 className="text-3xl font-bold">Something Went Wrong</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate('/b2b')}>
                Try Again
              </Button>
              <Button onClick={() => navigate('/contact')}>
                Contact Support
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}