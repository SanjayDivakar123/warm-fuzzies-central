import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCompanyPortal } from '@/contexts/CompanyPortalContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building2, KeyRound, Mail, ArrowLeft } from 'lucide-react';
import rcfLogo from '@/assets/rolecolor-ai-logo.svg';
import { HelpButton } from '@/components/help';

export default function CompanyLogin() {
  const { company, loading, error, setEmployee } = useCompanyPortal();
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  useEffect(() => {
    const inviteCodeParam = searchParams.get('inviteCode');
    const emailParam = searchParams.get('email');

    if (inviteCodeParam) {
      setInviteCode(inviteCodeParam.toUpperCase().slice(0, 8));
    }

    if (emailParam) {
      setEmail(emailParam.toLowerCase());
    }
  }, [searchParams]);

  // Handle Google OAuth callback
  useEffect(() => {
    const handleGoogleCallback = async () => {
      const storedCompany = localStorage.getItem('google_sso_company');
      
      // Only process if user just returned from Google OAuth for this company
      if (!user || !company || storedCompany !== company.subdomain) {
        return;
      }

      console.log('Processing Google SSO callback for', user.email);
      setIsProcessingOAuth(true);
      localStorage.removeItem('google_sso_company');

      try {
        // Call verify-google-sso-employee to create/fetch employee
        const { data, error: fnError } = await supabase.functions.invoke('verify-google-sso-employee', {
          body: { 
            companyId: company.id,
            userEmail: user.email,
            userId: user.id
          }
        });

        if (fnError || !data?.success) {
          console.error('SSO verification failed:', fnError || data?.message);
          toast({
            title: "Access Denied",
            description: data?.message || "Unable to verify your access. Please contact your administrator.",
            variant: "destructive"
          });
          // Sign out since they couldn't be verified
          await supabase.auth.signOut();
          setIsProcessingOAuth(false);
          return;
        }

        // Success - set employee and navigate
        setEmployee(data.employee);
        
        toast({
          title: data.isNewEmployee ? "Welcome!" : "Welcome back!",
          description: data.isNewEmployee 
            ? "Your account has been created. Let's start your assessment."
            : data.employee.assessment_completed_at 
              ? "Viewing your results."
              : "Continue your assessment.",
        });

        if (data.employee.assessment_completed_at) {
          navigate(`/company/${company.subdomain}/home`);
        } else {
          navigate(`/company/${company.subdomain}/assessment`);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
        await supabase.auth.signOut();
      } finally {
        setIsProcessingOAuth(false);
      }
    };

    handleGoogleCallback();
  }, [user, company, setEmployee, navigate, toast]);

  if (loading || isProcessingOAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          {isProcessingOAuth && (
            <p className="text-muted-foreground">Verifying your access...</p>
          )}
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Company Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The company portal you're looking for doesn't exist.
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryColor = company.primary_color || '#9b87f5';
  const secondaryColor = company.secondary_color || '#7E69AB';
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !email.trim()) return;

    setIsSubmitting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-employee-invite', {
        body: { 
          inviteCode: inviteCode.toUpperCase(), 
          email: email.toLowerCase().trim(),
          companyId: company.id 
        }
      });

      if (fnError || !data.success) {
        // Check if invite expired
        if (data?.expired) {
          toast({
            title: "Invite Code Expired",
            description: "Your invite code has expired after 7 days. Please contact your administrator to request a new invite.",
            variant: "destructive",
            duration: 10000
          });
        } else {
          toast({
            title: "Login Failed",
            description: data?.message || "Invalid email or invite code combination.",
            variant: "destructive"
          });
        }
        return;
      }

      // Store employee in context (context handles localStorage session)
      setEmployee(data.employee);
      
      toast({
        title: "Welcome!",
        description: data.employee.assessment_completed_at 
          ? "Welcome back! Viewing your results."
          : "You're now logged in. Let's start your assessment.",
      });

      // Check if assessment already completed
      if (data.employee.assessment_completed_at) {
        navigate(`/company/${company.subdomain}/home`);
      } else {
        navigate(`/company/${company.subdomain}/assessment`);
      }
    } catch (err) {
      console.error('Login error:', err);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = inviteCode.length === 8 && email.includes('@');

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: `${primaryColor}15`
      }}
    >
      {/* Header */}
      <header className="py-6 px-4" style={{ borderBottom: `2px solid ${primaryColor}20` }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(`/company/${company.subdomain}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {company.logo_url ? (
            <img 
              src={company.logo_url} 
              alt={`${company.name} logo`}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <div 
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <Building2 className="h-5 w-5 text-white" />
            </div>
          )}
          <span className="font-semibold">{company.name}</span>
        </div>
      </header>

      {/* Main content */}
      <main className="py-16 px-4">
        <div className="max-w-md mx-auto">
          <Card 
            className="shadow-xl border-2 relative overflow-hidden" 
            style={{ borderColor: `${primaryColor}30` }}
          >
            {/* Card accent line */}
            <div 
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
            />
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-2xl">Employee Login</CardTitle>
              <CardDescription>
                Enter your work email and invite code to access your assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Work Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-tour="employee-email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the email address registered by your administrator
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-code" className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Invite Code
                  </Label>
                  <Input
                    id="invite-code"
                    placeholder="Enter your 8-character code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="text-center text-lg tracking-widest font-mono"
                    data-tour="employee-code"
                  />
                  <p className="text-xs text-muted-foreground">
                    Check your email for the invite code from your administrator
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  style={{ backgroundColor: primaryColor }}
                  disabled={isSubmitting || !isFormValid}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>

              {/* Google SSO Option for Employees */}
              {company.google_sso_enabled && (
                <>
                  <div className="relative my-6">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      or
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    disabled={isGoogleLoading}
                    onClick={async () => {
                      setIsGoogleLoading(true);
                      // Store company identifier so we can verify after Google auth
                      localStorage.setItem('google_sso_company', company.subdomain);
                      // Use current origin for redirect
                      const redirectUrl = `${window.location.origin}/company/${company.subdomain}/login`;
                      // Pass hosted domain to restrict Google popup to company domain
                      const { error } = await signInWithGoogle(
                        redirectUrl, 
                        company.google_workspace_domain || undefined
                      );
                      if (error) {
                        toast({
                          title: "Google Sign-In Failed",
                          description: error.message,
                          variant: "destructive"
                        });
                        localStorage.removeItem('google_sso_company');
                        setIsGoogleLoading(false);
                      }
                    }}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    )}
                    Continue with Google
                    {company.google_workspace_domain && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (@{company.google_workspace_domain})
                      </span>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-50">
        <HelpButton tourFilter={(tour) => tour.id.startsWith('employee-')} size="sm" iconOnly />
      </div>

      <footer className="py-8 px-4 text-center">
        <a 
          href="https://rolecolorfinder.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity text-muted-foreground"
        >
          <span className="text-sm">Powered by</span>
          <img 
            src={rcfLogo} 
            alt="RoleColorFinder" 
            className="h-6 w-auto"
          />
        </a>
      </footer>
    </div>
  );
}
