import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Briefcase, 
  Check, 
  X, 
  AlertTriangle, 
  Calendar,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface HiringSubscriptionSettingsProps {
  company: {
    id: string;
    name: string;
    hiring_subscription_enabled?: boolean;
    hiring_subscription_status?: string;
    hiring_subscription_cancel_at_period_end?: boolean;
    hiring_subscription_current_period_end?: string;
  };
  onSubscriptionUpdated?: () => void;
}

export default function HiringSubscriptionSettings({ 
  company, 
  onSubscriptionUpdated 
}: HiringSubscriptionSettingsProps) {
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();

  const hasActiveSubscription = company.hiring_subscription_enabled && 
    (company.hiring_subscription_status === 'active' || company.hiring_subscription_status === 'trialing');
  
  const isCancelling = company.hiring_subscription_cancel_at_period_end;
  const periodEnd = company.hiring_subscription_current_period_end 
    ? new Date(company.hiring_subscription_current_period_end)
    : null;

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke('subscribe-hiring-tab', {
        body: { companyId: company.id },
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error subscribing:', error);
      toast({
        title: 'Subscription failed',
        description: error.message || 'Failed to start subscription',
        variant: 'destructive',
      });
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    setShowCancelDialog(false);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-hiring-subscription', {
        body: { 
          companyId: company.id,
          cancelImmediately: false, // Cancel at period end
        },
      });

      if (error) throw error;

      toast({
        title: 'Subscription will be cancelled',
        description: `Your Hiring tab access will end on ${data.periodEnd ? new Date(data.periodEnd).toLocaleDateString() : 'the end of the billing period'}`,
      });

      if (onSubscriptionUpdated) {
        onSubscriptionUpdated();
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Cancellation failed',
        description: error.message || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = () => {
    if (!hasActiveSubscription) {
      return <Badge variant="outline">Not Subscribed</Badge>;
    }
    if (isCancelling) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Cancelling</Badge>;
    }
    if (company.hiring_subscription_status === 'active') {
      return <Badge className="bg-green-500">Active</Badge>;
    }
    if (company.hiring_subscription_status === 'trialing') {
      return <Badge className="bg-blue-500">Trial</Badge>;
    }
    if (company.hiring_subscription_status === 'past_due') {
      return <Badge className="bg-red-500">Past Due</Badge>;
    }
    return <Badge variant="outline">{company.hiring_subscription_status}</Badge>;
  };

  return (
    <>
      <Card id="hiring-subscription" className="scroll-mt-20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Hiring Tab Subscription
              </CardTitle>
              <CardDescription className="mt-1">
                Manage your premium Hiring & ATS features subscription
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasActiveSubscription ? (
            <>
              {/* Active Subscription Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Monthly Subscription</span>
                  </div>
                  <span className="font-semibold">$500/month</span>
                </div>

                {periodEnd && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {isCancelling ? 'Ends on' : 'Next billing date'}
                      </span>
                    </div>
                    <span className="text-sm">{periodEnd.toLocaleDateString()}</span>
                  </div>
                )}

                {isCancelling && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-600">Subscription Cancelling</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You will lose access to the Hiring tab after {periodEnd?.toLocaleDateString()}.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Features Included */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Features Included:</p>
                <div className="grid gap-2">
                  {[
                    'Job Posting Management',
                    'Visual Pipeline Tracking',
                    'Candidate Database',
                    'Interview Scheduling',
                    'Offer Management',
                    'Email Templates',
                    'Hiring Analytics',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancel Button */}
              {!isCancelling && (
                <div className="border-t pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={cancelling}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {cancelling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel Subscription
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    You'll retain access until the end of your current billing period
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Not Subscribed */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Unlock Premium Hiring Features</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Get access to our complete ATS with job postings, pipeline tracking, 
                        interview scheduling, and advanced hiring analytics.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-semibold">$500 per month</p>
                    <p className="text-xs text-muted-foreground">Cancel anytime</p>
                  </div>
                  <Button onClick={handleSubscribe} disabled={subscribing}>
                    {subscribing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Subscribe Now'
                    )}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Payment will be processed via Stripe. Billing credits will be applied first, 
                  then your card on file will be charged.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Hiring Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your Hiring tab subscription? You will lose access 
              to all premium hiring features at the end of your current billing period 
              ({periodEnd?.toLocaleDateString()}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelSubscription}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
