import { useEffect, useState } from 'react';
import { useHiringSubscribeInFlight } from '@/lib/hiringSubscribeLock';
import { subscribeHiring } from '@/lib/subscribeHiring';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, 
  Users, 
  GitBranch, 
  Calendar, 
  FileCheck, 
  Mail, 
  BarChart3,
  Plus,
  Lock,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, ShieldAlert, ExternalLink, CreditCard, Loader2 } from 'lucide-react';
import { useHelpTour } from '@/contexts/HelpTourContext';
import HiringUnlockedModal from '@/components/b2b/HiringUnlockedModal';

// Import hiring sub-components
import JobPostingsTab from './JobPostingsTab';
import HiringPipelineView from './HiringPipelineView';
import HiringCandidatesTab from './HiringCandidatesTab';
import InterviewsTab from './InterviewsTab';
import OffersTab from './OffersTab';
import EmailTemplatesTab from './EmailTemplatesTab';
import HiringAnalyticsTab from './HiringAnalyticsTab';
import LegacyCandidatesTab from './LegacyCandidatesTab';

interface HiringSectionProps {
  company: { 
    id: string; 
    name: string;
    subdomain?: string;
    credit_balance?: number;
    hiring_subscription_enabled?: boolean;
    hiring_subscription_status?: string;
    hiring_subscription_cancel_at_period_end?: boolean;
    hiring_subscription_current_period_end?: string;
    hiring_ever_subscribed?: boolean;
    portal_billing_next_renewal_at?: string | null;
  };
  companyUser: { id: string; role: string } | null;
  onSubscriptionUpdated?: () => void;
}

type HiringTab = 'jobs' | 'pipeline' | 'candidates' | 'interviews' | 'offers' | 'templates' | 'analytics' | 'legacy';

export default function HiringSection({ company, companyUser, onSubscriptionUpdated }: HiringSectionProps) {
  const { activeTour, currentStepIndex, startTour } = useHelpTour();
  const [activeTab, setActiveTab] = useState<HiringTab>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const subscribing = useHiringSubscribeInFlight(company.id);

  const [subscribeError, setSubscribeError] = useState<{
    type: 'no_payment_method' | 'card_declined' | 'auth_required' | 'generic';
    title: string;
    description: string;
    actionUrl?: string;
  } | null>(null);
  const [showUnlockedModal, setShowUnlockedModal] = useState(false);
  const [resubscribing, setResubscribing] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [showSubscribeConfirm, setShowSubscribeConfirm] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'subscribe' | 'resubscribe'>('subscribe');

  const creditBalance = company.credit_balance || 0; // In dollars

  // Proration: always charge the remaining fraction of the billing cycle (days ÷ 30 × $500)
  const portalRenewalAt = company.portal_billing_next_renewal_at
    ? new Date(company.portal_billing_next_renewal_at)
    : null;
  const daysUntilPortalRenewal = portalRenewalAt
    ? (portalRenewalAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    : null;
  const isProrated = daysUntilPortalRenewal !== null && daysUntilPortalRenewal > 0;
  // 7-day clause: if < 7 days remain, lock cancellation until portfolio renewal
  const isShortWindow = isProrated && daysUntilPortalRenewal! < 7;
  const proratedCost = isProrated
    ? Math.round((daysUntilPortalRenewal! / 30) * 500 * 100) / 100
    : 500;
  const effectiveCreditContribution = Math.min(creditBalance, proratedCost);
  const effectiveCardCharge = proratedCost - effectiveCreditContribution;
  // Aliases used by the welcome-back card
  const hiringCost = proratedCost;
  const creditContribution = effectiveCreditContribution;
  const cardCharge = effectiveCardCharge;
  const isHROrAdmin = companyUser?.role === 'admin' || companyUser?.role === 'hr';
  const hasPaidHiringSubscription = company.hiring_subscription_enabled && 
    (company.hiring_subscription_status === 'active' || company.hiring_subscription_status === 'trialing');
  const hasHiringAccess = company.hiring_subscription_enabled && 
    (company.hiring_subscription_status === 'active' || company.hiring_subscription_status === 'trialing' || company.hiring_subscription_status === 'admin_override');

  // Check for tutorial flag after subscription success reload
  useEffect(() => {
    if (!hasHiringAccess) return;
    
    const shouldStartTutorial = localStorage.getItem('rcf_start_hiring_tutorial');
    if (shouldStartTutorial === 'true') {
      localStorage.removeItem('rcf_start_hiring_tutorial');
      // Start tutorial after a brief delay to ensure UI is ready
      setTimeout(() => {
        startTour('admin-hiring-unlocked');
      }, 1000);
    } else if (shouldStartTutorial === 'false') {
      localStorage.removeItem('rcf_start_hiring_tutorial');
    }
  }, [hasHiringAccess, startTour]);

  useEffect(() => {
    if (activeTour?.id !== 'admin-hiring-unlocked') return;

    const stepId = activeTour.steps[currentStepIndex]?.id || '';
    const tabByPrefix: Array<{ prefix: string; tab: HiringTab }> = [
      { prefix: 'jobs-', tab: 'jobs' },
      { prefix: 'pipeline-', tab: 'pipeline' },
      { prefix: 'candidates-', tab: 'candidates' },
      { prefix: 'interviews-', tab: 'interviews' },
      { prefix: 'offers-', tab: 'offers' },
      { prefix: 'templates-', tab: 'templates' },
      { prefix: 'analytics-', tab: 'analytics' },
      { prefix: 'legacy-', tab: 'legacy' },
    ];

    const matched = tabByPrefix.find(({ prefix }) => stepId.startsWith(prefix));
    if (matched && activeTab !== matched.tab) {
      setActiveTab(matched.tab);
    }
  }, [activeTour, currentStepIndex, activeTab]);

  const classifySubscribeError = (msg: string, step?: string): typeof subscribeError => {
    const m = (msg || '').toLowerCase();
    if (step === 'no_default_payment_method' || m.includes('no payment method') || m.includes('no default payment')) {
      return {
        type: 'no_payment_method',
        title: 'No Payment Method on File',
        description: 'You need to add a payment method before subscribing. Go to Settings → Subscriptions to add a card.',
      };
    }
    if (step === 'already_processing' || m.includes('already being processed')) {
      return {
        type: 'generic',
        title: 'Subscription Already Processing',
        description: 'A subscription request is already in progress. Please wait a few seconds and try again.',
      };
    }
    if (m.includes('idempotent requests')) {
      return {
        type: 'generic',
        title: 'Subscription Already Processing',
        description: 'A subscription request is already in progress. Please wait a few seconds and try again.',
      };
    }
    if (step === 'card_declined' || m.includes('declined') || m.includes('insufficient funds')) {
      return {
        type: 'card_declined',
        title: 'Transaction Declined',
        description: 'Your card was declined. This may be due to insufficient funds, a frozen card, or your bank blocking the charge. Please update your payment method and try again.',
      };
    }
    if (step === 'requires_authentication' || m.includes('requires') || m.includes('authentication')) {
      return {
        type: 'auth_required',
        title: 'Card Requires Verification',
        description: 'Your bank requires additional verification before this payment can go through. Click below to complete the authentication step, then return here.',
      };
    }
    return {
      type: 'generic',
      title: 'Subscription Failed',
      description: msg || 'Something went wrong processing your subscription. Please try again or contact support.',
    };
  };

  const handleSubscribe = async () => {
    setSubscribeError(null);
    try {
      const data = await subscribeHiring(company.id);

      if (data?.requiresAction) {
        setSubscribeError({
          type: 'auth_required',
          title: 'Card Requires Verification',
          description: 'Your bank requires additional verification before this payment can go through. Click below to complete the authentication step, then return here.',
          actionUrl: data.actionUrl,
        });
        return;
      }

      if (data?.error) {
        setSubscribeError(classifySubscribeError(data.error, data.step));
        return;
      }

      if (data?.success) {
        // Refresh company data first to unlock the hiring tab
        if (onSubscriptionUpdated) {
          onSubscriptionUpdated();
        }
        // Show success modal after a brief delay to ensure tab is rendered
        setTimeout(() => {
          setShowUnlockedModal(true);
        }, 500);
      }
    } catch (err: unknown) {
      console.error('Error subscribing to hiring tab:', err);
      const message = err instanceof Error ? err.message : '';
      setSubscribeError(classifySubscribeError(message));
    }
  };

  const handleResubscribe = async () => {
    setResubscribing(true);
    try {
      // If there's a subscription set to cancel at period end, reactivate it
      if (company.hiring_subscription_cancel_at_period_end) {
        const { data, error } = await supabase.functions.invoke('resubscribe-hiring', {
          body: { companyId: company.id },
        });

        if (error) throw error;

        // Check for requiresAction (3D Secure / bank authentication)
        if (data?.requiresAction) {
          setSubscribeError({
            type: 'auth_required',
            title: 'Card Requires Verification',
            description: 'Your bank requires additional verification before this payment can go through. Click below to complete the authentication step, then return here.',
            actionUrl: data.actionUrl,
          });
          return;
        }

        // Check for error with classification
        if (data?.error) {
          setSubscribeError(classifySubscribeError(data.error, data.step));
          return;
        }

        if (data?.success) {
          // Refresh company data first to unlock the hiring tab
          if (onSubscriptionUpdated) {
            onSubscriptionUpdated();
          }
          // Show success modal after a brief delay to ensure tab is rendered
          setTimeout(() => {
            setShowUnlockedModal(true);
          }, 500);
          return;
        }
      }

      // Otherwise, create a new subscription (e.g., after super admin removed access)
      // Don't set resubscribing to false here - let the finally block handle it
      const data = await subscribeHiring(company.id);

      if (data?.requiresAction) {
        setSubscribeError({
          type: 'auth_required',
          title: 'Card Requires Verification',
          description: 'Your bank requires additional verification before this payment can go through. Click below to complete the authentication step, then return here.',
          actionUrl: data.actionUrl,
        });
        return;
      }

      if (data?.error) {
        setSubscribeError(classifySubscribeError(data.error, data.step));
        return;
      }

      if (data?.success) {
        // Refresh company data first to unlock the hiring tab
        if (onSubscriptionUpdated) {
          onSubscriptionUpdated();
        }
        // Show success modal after a brief delay to ensure tab is rendered
        setTimeout(() => {
          setShowUnlockedModal(true);
        }, 500);
      }
    } catch (err: unknown) {
      console.error('Error resubscribing to hiring tab:', err);
      const message = err instanceof Error ? err.message : '';
      setSubscribeError(classifySubscribeError(message));
    } finally {
      setResubscribing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setReactivating(true);
    try {
      const { data, error } = await supabase.functions.invoke('resubscribe-hiring', {
        body: { companyId: company.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.success && onSubscriptionUpdated) {
        onSubscriptionUpdated();
      }
    } catch (err: unknown) {
      console.error('Error reactivating subscription:', err);
      const message = err instanceof Error ? err.message : '';
      setSubscribeError(classifySubscribeError(message));
    } finally {
      setReactivating(false);
    }
  };

  // Show paywall if no access
  if (!hasHiringAccess) {
    // Returning subscriber - show blurred/locked view with resubscribe button
    if (company.hiring_ever_subscribed) {
      return (
        <div className="space-y-6 relative">
          {/* Blurred background tabs */}
          <div className="filter blur-sm pointer-events-none select-none" aria-hidden="true">
            <Tabs value="jobs">
              <div className="overflow-x-auto pb-1">
              <TabsList className="inline-flex min-w-max opacity-50">
                <TabsTrigger value="jobs" className="flex items-center gap-1.5 px-3">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Jobs</span>
                </TabsTrigger>
                <TabsTrigger value="pipeline" className="flex items-center gap-1.5 px-3">
                  <GitBranch className="h-4 w-4" />
                  <span className="hidden sm:inline">Pipeline</span>
                </TabsTrigger>
                <TabsTrigger value="candidates" className="flex items-center gap-1.5 px-3">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Candidates</span>
                </TabsTrigger>
                <TabsTrigger value="interviews" className="flex items-center gap-1.5 px-3">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Interviews</span>
                </TabsTrigger>
                <TabsTrigger value="offers" className="flex items-center gap-1.5 px-3">
                  <FileCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Offers</span>
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-1.5 px-3">
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Templates</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-1.5 px-3">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="legacy" className="flex items-center gap-1.5 px-3">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Legacy</span>
                </TabsTrigger>
              </TabsList>
              </div>
            </Tabs>

            <div className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sample Content</CardTitle>
                  <CardDescription>This is what your hiring platform looks like</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-12 bg-muted rounded" />
                    <div className="h-12 bg-muted rounded" />
                    <div className="h-12 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Centered resubscribe overlay */}
          <div className="absolute top-14 left-0 right-0 flex items-center justify-center z-10 p-4">
            <Card className="border-2 border-primary shadow-2xl max-w-lg w-full">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">Welcome Back!</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Your subscription has expired. Resubscribe now to regain instant access to your hiring platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {isProrated ? `Prorated charge (${Math.ceil(daysUntilPortalRenewal!)} days)` : 'Monthly Subscription'}
                    </span>
                    <span className="text-3xl font-bold">${hiringCost.toFixed(2)}</span>
                  </div>
                  {creditContribution > 0 && (
                    <div className="flex items-center justify-between text-sm border-t border-border/50 pt-2">
                      <span className="text-muted-foreground">Billing credits applied</span>
                      <span className="text-green-600 font-medium">-${creditContribution.toFixed(2)}</span>
                    </div>
                  )}
                  {cardCharge > 0 && (
                    <div className="flex items-baseline justify-between border-t border-border pt-3">
                      <span className="text-sm font-medium">Card charge</span>
                      <span className="text-2xl font-bold">${cardCharge.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {isHROrAdmin && (
                  <Button 
                    size="lg" 
                    onClick={() => { setConfirmAction('resubscribe'); setShowSubscribeConfirm(true); }}
                    disabled={resubscribing || subscribing}
                    className="w-full h-12"
                  >
                    {(resubscribing || subscribing) ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Resubscribe Now
                      </>
                    )}
                  </Button>
                )}

                {!isHROrAdmin && (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">
                      Contact your company admin to resubscribe to this feature
                    </p>
                  </div>
                )}

                <p className="text-xs text-center text-muted-foreground leading-relaxed pt-1">
                  Same great features, same pricing. Resume where you left off.
                </p>
              </CardContent>
            </Card>
          </div>

          <Dialog open={subscribing || resubscribing} onOpenChange={() => {}}>
            <DialogContent
              className="max-w-sm [&>button]:hidden"
              onEscapeKeyDown={(event) => event.preventDefault()}
              onPointerDownOutside={(event) => event.preventDefault()}
              onInteractOutside={(event) => event.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle>Processing Subscription</DialogTitle>
                <DialogDescription>
                  Please wait while we process your subscription. Do not close this window.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={!!subscribeError} onOpenChange={(open) => { if (!open) setSubscribeError(null); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-1">
                  {subscribeError?.type === 'auth_required' ? (
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="h-5 w-5 text-amber-500" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                  )}
                  <DialogTitle className="text-left">{subscribeError?.title}</DialogTitle>
                </div>
                <DialogDescription className="text-left text-sm leading-relaxed">
                  {subscribeError?.description}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 pt-2">
                {subscribeError?.type === 'auth_required' && subscribeError.actionUrl && (
                  <Button className="w-full" onClick={() => { window.location.href = subscribeError.actionUrl!; }}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Complete Bank Authentication
                  </Button>
                )}
                {(subscribeError?.type === 'no_payment_method' || subscribeError?.type === 'card_declined') && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSubscribeError(null);
                      window.dispatchEvent(new CustomEvent('rcf:b2b-guide-tab-change', { detail: { tab: 'settings' } }));
                      setTimeout(() => {
                        document.getElementById('payment-method-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 400);
                    }}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Update Payment Method
                  </Button>
                )}
                <Button
                  variant={subscribeError?.type === 'auth_required' ? 'outline' : 'default'}
                  className="w-full"
                  onClick={() => setSubscribeError(null)}
                >
                  {subscribeError?.type === 'auth_required' ? 'Dismiss' : 'Close'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    // New subscriber - show full paywall with features
    return (
      <div className="space-y-6">
        <Card className="border-2 border-primary/20" data-tour="hiring-locked-overview">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Unlock Premium Hiring Features
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Get access to our complete Applicant Tracking System (ATS) and advanced hiring tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features List */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Briefcase className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Job Posting Management</p>
                  <p className="text-xs text-muted-foreground">Create and manage job postings with custom pipelines</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <GitBranch className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Visual Pipeline</p>
                  <p className="text-xs text-muted-foreground">Track candidates through customizable stages</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Candidate Management</p>
                  <p className="text-xs text-muted-foreground">Centralized candidate database and screening</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Interview Scheduling</p>
                  <p className="text-xs text-muted-foreground">Schedule and manage interviews seamlessly</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <FileCheck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Offer Management</p>
                  <p className="text-xs text-muted-foreground">Create and track job offers</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <BarChart3 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Hiring Analytics</p>
                  <p className="text-xs text-muted-foreground">Track hiring metrics and pipeline performance</p>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t pt-6" data-tour="hiring-pricing">
              <div className="text-center space-y-4">
                <div>
                  <p className="text-3xl font-bold">$500<span className="text-base font-normal text-muted-foreground">/month</span></p>
                  <p className="text-sm text-muted-foreground mt-1">Cancel anytime</p>
                </div>
                
                {isHROrAdmin && (
                  <Button 
                    size="lg" 
                    onClick={() => { setConfirmAction('subscribe'); setShowSubscribeConfirm(true); }}
                    disabled={subscribing}
                    className="w-full max-w-md"
                  >
                    {subscribing ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Subscribe Now
                      </>
                    )}
                  </Button>
                )}
                
                {!isHROrAdmin && (
                  <p className="text-sm text-muted-foreground">
                    Contact your company admin to subscribe to this feature
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              {creditContribution > 0
                ? `$${creditContribution.toFixed(2)} in billing credits will be applied. Your card will be charged $${cardCharge.toFixed(2)}.`
                : 'Payment will be processed securely via Stripe. Billing credits will be applied first if available.'
              }
            </p>
          </CardContent>
        </Card>

        <Dialog open={subscribing || resubscribing} onOpenChange={() => {}}>
          <DialogContent
            className="max-w-sm [&>button]:hidden"
            onEscapeKeyDown={(event) => event.preventDefault()}
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Processing Subscription</DialogTitle>
              <DialogDescription>
                Please wait while we process your subscription. Do not close this window.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </DialogContent>
        </Dialog>

        {/* Subscribe Error Modal */}
        <Dialog open={!!subscribeError} onOpenChange={(open) => { if (!open) setSubscribeError(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                {subscribeError?.type === 'auth_required' ? (
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                )}
                <DialogTitle className="text-left">{subscribeError?.title}</DialogTitle>
              </div>
              <DialogDescription className="text-left text-sm leading-relaxed">
                {subscribeError?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-2">
              {subscribeError?.type === 'auth_required' && subscribeError.actionUrl && (
                <Button className="w-full" onClick={() => { window.location.href = subscribeError.actionUrl!; }}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Complete Bank Authentication
                </Button>
              )}
              {(subscribeError?.type === 'no_payment_method' || subscribeError?.type === 'card_declined') && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSubscribeError(null);
                    window.dispatchEvent(new CustomEvent('rcf:b2b-guide-tab-change', { detail: { tab: 'settings' } }));
                    setTimeout(() => {
                      document.getElementById('payment-method-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 400);
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>
              )}
              <Button
                variant={subscribeError?.type === 'auth_required' ? 'outline' : 'default'}
                className="w-full"
                onClick={() => setSubscribeError(null)}
              >
                {subscribeError?.type === 'auth_required' ? 'Dismiss' : 'Close'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Navigate to pipeline for a specific job
  const handleViewPipeline = (jobId: string) => {
    setSelectedJobId(jobId);
    setActiveTab('pipeline');
  };

  // Navigate to candidates filtered by job
  const handleViewJobCandidates = (jobId: string) => {
    setSelectedJobId(jobId);
    setActiveTab('candidates');
  };

  // Show subscription warning if cancelling at period end
  const showCancellationWarning = company.hiring_subscription_cancel_at_period_end && 
    company.hiring_subscription_current_period_end;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as HiringTab)}>
        {/* Keep the nav bar position fixed across sub-tabs */}
        <div className="mb-2 overflow-x-auto pb-1">
          <TabsList className="inline-flex min-w-max justify-start">
            <TabsTrigger value="jobs" className="flex items-center gap-1.5 px-3" data-tour="hiring-tab-jobs">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-1.5 px-3" data-tour="hiring-tab-pipeline">
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Pipeline</span>
            </TabsTrigger>
            <TabsTrigger value="candidates" className="flex items-center gap-1.5 px-3" data-tour="hiring-tab-candidates">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Candidates</span>
            </TabsTrigger>
            <TabsTrigger value="interviews" className="flex items-center gap-1.5 px-3" data-tour="hiring-tab-interviews">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Interviews</span>
            </TabsTrigger>
            <TabsTrigger value="offers" className="flex items-center gap-1.5 px-3" data-tour="hiring-tab-offers">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Offers</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1.5 px-3" data-tour="hiring-tab-templates">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5 px-3" data-tour="hiring-tab-analytics">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="legacy" className="flex items-center gap-1.5 px-3" data-tour="hiring-tab-legacy">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Legacy</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="jobs" className="mt-0">
          <JobPostingsTab 
            company={company}
            companyUser={companyUser}
            showCreateModal={showCreateJob}
            onOpenCreateModal={() => setShowCreateJob(true)}
            onCloseCreateModal={() => setShowCreateJob(false)}
            onViewPipeline={handleViewPipeline}
            onViewCandidates={handleViewJobCandidates}
          />
        </TabsContent>

        <TabsContent value="pipeline" className="mt-0">
          <HiringPipelineView 
            company={company}
            companyUser={companyUser}
            selectedJobId={selectedJobId}
            onSelectJob={setSelectedJobId}
            onNavigateToInterviews={() => setActiveTab('interviews')}
            onNavigateToOffers={() => setActiveTab('offers')}
          />
        </TabsContent>

        <TabsContent value="candidates" className="mt-0">
          <HiringCandidatesTab 
            company={company}
            companyUser={companyUser}
            selectedJobId={selectedJobId}
          />
        </TabsContent>

        <TabsContent value="interviews" className="mt-0">
          <InterviewsTab 
            company={company}
            companyUser={companyUser}
            isActive={activeTab === 'interviews'}
          />
        </TabsContent>

        <TabsContent value="offers" className="mt-0">
          <OffersTab 
            company={company}
            companyUser={companyUser}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-0">
          <EmailTemplatesTab 
            company={company}
            companyUser={companyUser}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <HiringAnalyticsTab 
            company={company}
            companyUser={companyUser}
          />
        </TabsContent>

        <TabsContent value="legacy" className="mt-0">
          <LegacyCandidatesTab company={company} />
        </TabsContent>
      </Tabs>

      {/* Subscription Ending Warning Banner */}
      {showCancellationWarning && (
        <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Subscription ending on {new Date(company.hiring_subscription_current_period_end!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                  You'll retain access until then. Reactivate in Settings to continue using the Hiring Platform.
                </p>
              </div>
              {isHROrAdmin && (
                <Button
                  onClick={handleReactivateSubscription}
                  disabled={reactivating}
                  size="sm"
                  variant="default"
                  className="flex-shrink-0"
                >
                  {reactivating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Renewing...
                    </>
                  ) : (
                    'Renew Subscription'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscribe Error Modal */}
      <Dialog open={!!subscribeError} onOpenChange={(open) => { if (!open) setSubscribeError(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              {subscribeError?.type === 'auth_required' ? (
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              )}
              <DialogTitle className="text-left">{subscribeError?.title}</DialogTitle>
            </div>
            <DialogDescription className="text-left text-sm leading-relaxed">
              {subscribeError?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            {subscribeError?.type === 'auth_required' && subscribeError.actionUrl && (
              <Button className="w-full" onClick={() => { window.location.href = subscribeError.actionUrl!; }}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Complete Bank Authentication
              </Button>
            )}
            {(subscribeError?.type === 'no_payment_method' || subscribeError?.type === 'card_declined') && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSubscribeError(null);
                  window.dispatchEvent(new CustomEvent('rcf:b2b-guide-tab-change', { detail: { tab: 'settings' } }));
                  setTimeout(() => {
                    document.getElementById('payment-method-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 400);
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Update Payment Method
              </Button>
            )}
            <Button
              variant={subscribeError?.type === 'auth_required' ? 'outline' : 'default'}
              className="w-full"
              onClick={() => setSubscribeError(null)}
            >
              {subscribeError?.type === 'auth_required' ? 'Dismiss' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pre-purchase Confirmation Dialog */}
      <Dialog open={showSubscribeConfirm} onOpenChange={(open) => { if (!open) { setShowSubscribeConfirm(false); setShowLearnMore(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subscribe to Hiring Tab</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1">
                {isProrated ? (
                  <p className="text-sm leading-relaxed">
                    Your portal renews on {portalRenewalAt!.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ({Math.ceil(daysUntilPortalRenewal!)} day{Math.ceil(daysUntilPortalRenewal!) !== 1 ? 's' : ''} away).
                    Today's charge is prorated to{' '}
                    <strong>${proratedCost.toFixed(2)}</strong>. Your first full <strong>$500/month</strong> renewal is on that date.
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed">
                    You'll be charged <strong>$500/month</strong> starting today. Billing credits are applied first.
                  </p>
                )}

                {effectiveCreditContribution > 0 && (
                  <div className="rounded-md bg-muted/60 p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Today's cost</span>
                      <span className="font-medium">${proratedCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span>Credits applied</span>
                      <span>−${effectiveCreditContribution.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-semibold">
                      <span>Card charge</span>
                      <span>${effectiveCardCharge.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {isShortWindow && (
                  <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-800">
                    <strong>Note: </strong>Cancellation is unavailable until{' '}
                    {portalRenewalAt!.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {' '}because your subscription started within 7 days of your portal renewal.
                  </div>
                )}

                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowLearnMore((v) => !v)}
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showLearnMore ? 'rotate-180' : ''}`} />
                  {showLearnMore ? 'Hide details' : 'Learn more about billing'}
                </button>

                {showLearnMore && (
                  <div className="rounded-md border p-3 text-xs text-muted-foreground space-y-2">
                    {isProrated ? (
                      <>
                        <p><strong>Why am I charged a partial amount?</strong> Your first payment is prorated to cover only the days remaining until your portal renewal ({Math.ceil(daysUntilPortalRenewal!)} days ÷ 30 × $500).</p>
                        <p><strong>When is the next $500 charge?</strong> On {portalRenewalAt!.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, when your portal renews. A standard $500/month Hiring cycle begins from that date.</p>
                        {isShortWindow && <p><strong>Why can't I cancel right away?</strong> With fewer than 7 days until renewal, you're committing through that renewal date so you get at least one full monthly cycle.</p>}
                        <p><strong>How do credits work?</strong> Billing credits are applied to today's prorated charge. Future renewals use the normal credit-first flow.</p>
                      </>
                    ) : (
                      <>
                        <p><strong>When am I billed?</strong> $500 is charged today and every month on the same date. Billing credits are applied before your card is charged.</p>
                        <p><strong>Can I cancel?</strong> Yes, at any time. You'll retain access through the end of your current billing period.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full"
              onClick={() => { setShowSubscribeConfirm(false); setShowLearnMore(false); confirmAction === 'resubscribe' ? handleResubscribe() : handleSubscribe(); }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isProrated
                ? `Confirm — $${proratedCost.toFixed(2)} today`
                : `Confirm — $${effectiveCardCharge > 0 ? effectiveCardCharge.toFixed(2) : '0.00'} card${effectiveCreditContribution > 0 ? ` + $${effectiveCreditContribution.toFixed(2)} credits` : ''}`}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => { setShowSubscribeConfirm(false); setShowLearnMore(false); }}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hiring Unlocked Success Modal */}
      <HiringUnlockedModal
        open={showUnlockedModal}
        onClose={() => {
          setShowUnlockedModal(false);
        }}
        onStartTutorial={() => {
          setShowUnlockedModal(false);
          // Start tutorial after brief delay
          setTimeout(() => {
            startTour('admin-hiring-unlocked');
          }, 300);
        }}
      />
    </div>
  );
}
