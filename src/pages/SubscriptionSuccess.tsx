import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, XCircle, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshSubscription } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      handleSuccess();
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  const handleSuccess = async () => {
    try {
      // Refresh subscription status
      if (refreshSubscription) {
        await refreshSubscription();
      }
      
      setStatus('success');
      
      toast({
        title: "Subscription Activated!",
        description: "Welcome to your new plan. Enjoy your premium features!",
      });

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      setStatus('success'); // Still show success since payment went through
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full shadow-elegant">
            <CardContent className="pt-8 pb-6 text-center">
              {status === 'verifying' && (
                <>
                  <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
                  <h1 className="text-2xl font-bold mb-2">Activating Your Subscription...</h1>
                  <p className="text-muted-foreground">
                    Please wait while we set up your account
                  </p>
                </>
              )}

              {status === 'success' && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  </motion.div>
                  <h1 className="text-2xl font-bold mb-2">Subscription Activated!</h1>
                  <p className="text-muted-foreground mb-6">
                    Your subscription is now active. Enjoy unlimited access to your premium features.
                  </p>
                  <Button onClick={() => navigate('/dashboard')} className="w-full">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Redirecting automatically in 3 seconds...
                  </p>
                </>
              )}

              {status === 'error' && (
                <>
                  <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                  <h1 className="text-2xl font-bold mb-2">Something Went Wrong</h1>
                  <p className="text-muted-foreground mb-6">
                    We couldn't verify your subscription. Please try again or contact support.
                  </p>
                  <div className="space-y-2">
                    <Button onClick={() => navigate('/pricing')} className="w-full">
                      Try Again
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/contact')} className="w-full">
                      Contact Support
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
