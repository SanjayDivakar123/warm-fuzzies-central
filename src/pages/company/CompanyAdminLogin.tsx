import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCompanyPortal } from '@/contexts/CompanyPortalContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building2, Mail, Lock, ArrowLeft, Shield } from 'lucide-react';

export default function CompanyAdminLogin() {
  const { company, loading: companyLoading, error } = useCompanyPortal();
  const { user, loading: authLoading, signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  // Check if user is already logged in and is admin for this company
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user || !company) return;
      
      setCheckingAdmin(true);
      try {
        const { data: adminUser, error: adminError } = await supabase
          .from('company_users')
          .select('*')
          .eq('company_id', company.id)
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .eq('status', 'active')
          .maybeSingle();

        if (adminUser && !adminError) {
          // User is already logged in and is an admin
          navigate('/b2b/company-portal');
        }
      } catch (err) {
        console.error('Error checking admin access:', err);
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (!authLoading && !companyLoading) {
      checkAdminAccess();
    }
  }, [user, company, authLoading, companyLoading, navigate]);

  if (companyLoading || authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    try {
      // First, sign in with Supabase Auth
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        toast({
          title: "Login Failed",
          description: signInError.message || "Invalid email or password.",
          variant: "destructive"
        });
        return;
      }

      // Get the newly logged in user
      const { data: { user: loggedInUser } } = await supabase.auth.getUser();
      
      if (!loggedInUser) {
        toast({
          title: "Login Failed",
          description: "Could not verify your login. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Check if user is an admin for this company
      const { data: adminUser, error: adminError } = await supabase
        .from('company_users')
        .select('*')
        .eq('company_id', company.id)
        .eq('user_id', loggedInUser.id)
        .eq('role', 'admin')
        .eq('status', 'active')
        .maybeSingle();

      if (adminError || !adminUser) {
        // Sign out the user since they're not an admin for this company
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "You are not authorized as an admin for this company.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Welcome, Admin!",
        description: "Redirecting to your dashboard...",
      });

      navigate('/b2b/company-portal');
    } catch (err) {
      console.error('Admin login error:', err);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = email.includes('@') && password.length >= 6;

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}10 0%, ${primaryColor}05 100%)`
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
          <Card className="shadow-xl border-2" style={{ borderColor: `${primaryColor}30` }}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div 
                  className="h-14 w-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Shield className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
              </div>
              <CardTitle className="text-2xl">Admin Login</CardTitle>
              <CardDescription>
                Sign in to access the {company.name} admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Admin Email
                  </Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
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
                      Signing in...
                    </>
                  ) : (
                    'Sign In as Admin'
                  )}
                </Button>
              </form>

              {/* Google SSO Option */}
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
                      const redirectUrl = `${window.location.origin}/company/${company.subdomain}/admin`;
                      const { error } = await signInWithGoogle(redirectUrl);
                      if (error) {
                        toast({
                          title: "Google Sign-In Failed",
                          description: error.message,
                          variant: "destructive"
                        });
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
                  </Button>
                </>
              )}

              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  Not an admin?{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => navigate(`/company/${company.subdomain}/login`)}
                  >
                    Go to Employee Login
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="py-8 px-4 text-center text-muted-foreground text-sm">
        <p>Powered by RoleColorFinder</p>
      </footer>
    </div>
  );
}
