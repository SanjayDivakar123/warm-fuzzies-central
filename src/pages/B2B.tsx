import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Building2, Users, Shield, Sparkles, Tag, Check, ArrowRight, Zap, BarChart3, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Navbar } from '@/components/navigation/Navbar';
import { formatCurrency } from '@/lib/countryPricing';

const PROMO_CODES = new Set([
  'LEADERSWELCOME',
  'RCFINTERNAL',
]);

const MIN_BILLABLE_SEATS = 2;
const ONE_TIME_DEPLOYMENT_FEE = 5000;
const ONBOARDING_FEE_PER_EMPLOYEE = 20;
const CORE_PLATFORM_MONTHLY = 500;
const HIRING_INTELLIGENCE_MONTHLY = 1000;
const INCLUDED_ACTIVE_JOB_ROLES = 10;
const SCALE_BLOCK_SIZE = 10;
const SCALE_BLOCK_MONTHLY = 1000;
const OUTCOME_BASED_PER_HIRE = 20;

export default function B2B() {
  const [companyName, setCompanyName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [assessmentType, setAssessmentType] = useState<'25q' | '50q'>('25q');
  const [promoCode, setPromoCode] = useState('');
  const [initialEmployeeCount, setInitialEmployeeCount] = useState(MIN_BILLABLE_SEATS);
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Pre-fill admin email when user is available
  useEffect(() => {
    if (!user) {
      setCheckingAccess(false);
      return;
    }

    if (user.email && !adminEmail) {
      setAdminEmail(user.email);
    }
    setCheckingAccess(false);
  }, [user]);

  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 63);
  };

  const isPromoValid = PROMO_CODES.has(promoCode.toUpperCase().trim());
  const employeeCount = Math.max(MIN_BILLABLE_SEATS, Number(initialEmployeeCount) || MIN_BILLABLE_SEATS);
  const oneTimeInvestment = ONE_TIME_DEPLOYMENT_FEE + (employeeCount * ONBOARDING_FEE_PER_EMPLOYEE);
  const monthlyInvestment = CORE_PLATFORM_MONTHLY + HIRING_INTELLIGENCE_MONTHLY;
  const totalPrice = isPromoValid ? 0 : oneTimeInvestment;

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require authentication
    if (!user) {
      toast({
        title: 'Please sign in first',
        description: 'You need to be logged in to create a company.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      const subdomain = generateSubdomain(companyName);

      // If promo code is valid, create company directly (free)
      if (isPromoValid) {
        const { data, error } = await supabase.functions.invoke('create-company', {
          body: {
            name: companyName,
            subdomain,
            admin_email: adminEmail,
            seats_purchased: employeeCount,
            assessment_type: assessmentType,
            user_id: user.id,
          },
        });

        if (error) {
          // Extract JSON body from non-2xx edge function responses
          if (error instanceof FunctionsHttpError) {
            const payload = await error.context.json().catch(() => null);
            if (payload?.error) throw new Error(payload.error);
          }
          throw error;
        }
        if (data?.error) throw new Error(data.error);

        toast({
          title: 'Company created!',
          description: `Promo code applied! Your portal is ready.`,
        });

        const newCompanyId = data?.company?.id;
        navigate(newCompanyId ? `/b2b/company-portal?company=${newCompanyId}` : '/b2b/company-portal');
        return;
      }

      // Otherwise, redirect to Stripe checkout
      const paymentPayload = {
        companyName,
        adminEmail,
        seats: employeeCount,
        assessmentType,
        userId: user.id,
        subdomain,
        successUrl: `${window.location.origin}/b2b/payment-success`,
        cancelUrl: `${window.location.origin}/b2b`,
      };

      const { data, error } = await supabase.functions.invoke('create-b2b-payment', {
        body: paymentPayload,
      });

      if (error) {
        if (error instanceof FunctionsHttpError) {
          const payload = await error.context.json().catch(() => null);
          if (payload?.error) throw new Error(payload.error);
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error: any) {
      const errorMessage = (error?.message || '').toString();
      console.error('Create company error:', errorMessage);

      const isIdentifierTaken =
        errorMessage.toLowerCase().includes('subdomain already taken') ||
        errorMessage.toLowerCase().includes('identifier already taken') ||
        (errorMessage.toLowerCase().includes('subdomain') &&
          errorMessage.toLowerCase().includes('taken')) ||
        (errorMessage.toLowerCase().includes('identifier') &&
          errorMessage.toLowerCase().includes('exists'));

      if (isIdentifierTaken) {
        toast({
          title: 'That company identifier already exists',
          description: 'Please try another company name.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage || 'Failed to process. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const features = [
    { icon: Building2, text: 'Custom branded portal', description: 'Your own branded company portal' },
    { icon: Users, text: 'Team assessments', description: 'Insights for your entire organization' },
    { icon: Shield, text: 'Enterprise security', description: 'SOC 2 compliant data protection' },
    { icon: Sparkles, text: 'AI-powered matching', description: 'Smart role recommendations' },
  ];

  const benefits = [
    'Unlimited team assessments',
    'Real-time analytics dashboard',
    'Custom branding & portal',
    'Priority email support',
    'Team comparison reports',
    'Export to PDF & CSV',
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
        {/* Subtle animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-role-blue/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 py-16 px-4">
          <div className="max-w-6xl mx-auto">
            
            {/* Two-column layout */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              
              {/* Left Column - Marketing Content */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:sticky lg:top-24"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">Enterprise Solution</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Transform Your Team with{' '}
                <span className="bg-gradient-to-r from-role-red via-role-yellow to-role-green bg-clip-text text-transparent">
                  RoleColor
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Unlock your team's potential with personality-driven insights. Get a custom-branded assessment portal for your organization in minutes.
              </p>

              {/* Benefits list */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {benefits.map((benefit, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              {/* Feature cards */}
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + (0.1 * index) }}
                    className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
                  >
                    <feature.icon className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold text-sm mb-1">{feature.text}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* Trust badges */}
              <div className="mt-8 pt-8 border-t border-border/50">
                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>256-bit SSL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>GDPR Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>500+ Companies</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="backdrop-blur-sm bg-card/80 border-border shadow-xl shadow-black/5">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Get Started Today</h2>
                    <p className="text-muted-foreground">Create your company portal in under 2 minutes</p>
                  </div>

                  <form onSubmit={handleCreateCompany} className="space-y-5">
                    {/* Company Name */}
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-sm font-medium">Company Name</Label>
                      <Input
                        id="companyName"
                        placeholder="Acme Corporation"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className="h-12 bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      {companyName && (
                        <p className="text-xs text-muted-foreground">
                          Your portal: <span className="font-mono text-primary font-medium">rolecolorfinder.com/company/{generateSubdomain(companyName)}</span>
                        </p>
                      )}
                    </div>

                    {/* Admin Email */}
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail" className="text-sm font-medium">Work Email</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="you@company.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        required
                        className="h-12 bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Assessment Type */}
                    <div className="space-y-2">
                      <div className="space-y-2">
                        <Label htmlFor="assessmentType" className="text-sm font-medium">Assessment</Label>
                        <Select value={assessmentType} onValueChange={(v) => setAssessmentType(v as '25q' | '50q')}>
                          <SelectTrigger className="h-12 bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25q">25 Questions</SelectItem>
                            <SelectItem value="50q">50 Questions</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Professional level</p>
                      </div>
                    </div>

                    {/* Initial Employee Count */}
                    <div className="space-y-2">
                      <Label htmlFor="initialEmployeeCount" className="text-sm font-medium">Initial Employee Onboarding Count</Label>
                      <Input
                        id="initialEmployeeCount"
                        type="number"
                        min={MIN_BILLABLE_SEATS}
                        value={initialEmployeeCount}
                        onChange={(e) => setInitialEmployeeCount(Math.max(MIN_BILLABLE_SEATS, Number(e.target.value) || MIN_BILLABLE_SEATS))}
                        className="h-12 bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <p className="text-xs text-muted-foreground">Minimum {MIN_BILLABLE_SEATS} employees at launch.</p>
                    </div>

                    {/* Promo Code - Collapsible style */}
                    <div className="space-y-2">
                      <Label htmlFor="promoCode" className="text-sm font-medium flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5" />
                        Promo Code
                      </Label>
                      <Input
                        id="promoCode"
                        placeholder="ENTER CODE"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="h-12 bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary uppercase tracking-wider"
                      />
                      {isPromoValid && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-role-green font-medium flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" /> Code applied successfully!
                        </motion.p>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border my-6" />

                    {/* Price Summary */}
                    <div className="rounded-xl bg-muted/50 p-5">
                      {isPromoValid && (
                        <div className="flex justify-end mb-3">
                          <span className="text-xs font-medium text-role-green bg-role-green/10 px-2 py-0.5 rounded-full">
                            100% OFF
                          </span>
                        </div>
                      )}
                      <div className="mb-4 space-y-1 text-xs text-muted-foreground">
                        <p>One-Time Deployment: {formatCurrency(ONE_TIME_DEPLOYMENT_FEE, 'USD')}</p>
                        <p>Employee Onboarding: {formatCurrency(ONBOARDING_FEE_PER_EMPLOYEE, 'USD')} x {employeeCount}</p>
                        <p>Monthly Core Platform Access: {formatCurrency(CORE_PLATFORM_MONTHLY, 'USD')}/month</p>
                        <p>Monthly Hiring Intelligence: {formatCurrency(HIRING_INTELLIGENCE_MONTHLY, 'USD')}/month</p>
                        <p>Includes up to {INCLUDED_ACTIVE_JOB_ROLES} active job roles and up to 1,000 applicants per role</p>
                        <p>Scaling: +{formatCurrency(SCALE_BLOCK_MONTHLY, 'USD')}/month per additional {SCALE_BLOCK_SIZE} active job roles</p>
                        <p>Outcome-Based Pricing: {formatCurrency(OUTCOME_BASED_PER_HIRE, 'USD')} per successful hire</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-medium">One-time due now</span>
                        <div className="text-right">
                          {isPromoValid ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg line-through text-muted-foreground">{formatCurrency(oneTimeInvestment, 'USD')}</span>
                              <span className="text-3xl font-bold text-role-green">$0</span>
                            </div>
                          ) : (
                            <span className="text-3xl font-bold">{formatCurrency(totalPrice, 'USD')}</span>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">Includes deployment and onboarding for {employeeCount} employees.</p>
                          <p className="text-xs text-muted-foreground">Recurring monthly investment starts at {formatCurrency(monthlyInvestment, 'USD')}/month.</p>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {isPromoValid ? 'Create Free Portal' : `Start for ${formatCurrency(totalPrice, 'USD')} one-time`}
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      No credit card required for promo codes • Monthly and outcome-based fees are billed after launch
                    </p>
                  </form>
                </CardContent>
              </Card>

              {/* Sign in link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">Already have a company account?</p>
                <Button 
                  variant="ghost" 
                  className="gap-2 text-primary hover:text-primary hover:bg-primary/5"
                  onClick={() => navigate('/b2b/signin')}
                >
                  <Building2 className="h-4 w-4" />
                  Sign in to your portal
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
