import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompanyPortal } from '@/contexts/CompanyPortalContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building2, KeyRound, Mail, ArrowLeft } from 'lucide-react';

export default function CompanyLogin() {
  const { company, loading, error, setEmployee } = useCompanyPortal();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
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

  const handleInviteCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsSubmitting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-employee-invite', {
        body: { inviteCode: inviteCode.toUpperCase(), companyId: company.id }
      });

      if (fnError || !data.success) {
        toast({
          title: "Invalid Invite Code",
          description: data?.message || "The invite code is invalid or has expired.",
          variant: "destructive"
        });
        return;
      }

      // Store employee data and navigate to assessment
      setEmployee(data.employee);
      localStorage.setItem(`employee_${company.subdomain}`, JSON.stringify(data.employee));
      
      toast({
        title: "Welcome!",
        description: "You're now logged in. Let's start your assessment.",
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      // Check if email exists in company_users
      const { data: employeeData, error: lookupError } = await supabase
        .from('company_users')
        .select('*')
        .eq('company_id', company.id)
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (lookupError || !employeeData) {
        toast({
          title: "Email Not Found",
          description: "This email is not registered with this company. Please check with your administrator.",
          variant: "destructive"
        });
        return;
      }

      if (employeeData.status === 'revoked') {
        toast({
          title: "Access Revoked",
          description: "Your access to this assessment has been revoked. Please contact your administrator.",
          variant: "destructive"
        });
        return;
      }

      // For simplicity, allow login by email for now (passwordless)
      // In production, you'd send a magic link
      setEmployee(employeeData);
      localStorage.setItem(`employee_${company.subdomain}`, JSON.stringify(employeeData));
      
      toast({
        title: "Welcome!",
        description: "You're now logged in. Let's start your assessment.",
      });

      if (employeeData.assessment_completed_at) {
        navigate(`/company/${company.subdomain}/home`);
      } else {
        navigate(`/company/${company.subdomain}/assessment`);
      }
    } catch (err) {
      console.error('Email login error:', err);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <CardTitle className="text-2xl">Employee Login</CardTitle>
              <CardDescription>
                Access your leadership assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="invite" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="invite" className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Invite Code
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="invite">
                  <form onSubmit={handleInviteCodeLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-code">Invite Code</Label>
                      <Input
                        id="invite-code"
                        placeholder="Enter your 8-character code"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        maxLength={8}
                        className="text-center text-lg tracking-widest font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Check your email for the invite code from your administrator
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      style={{ backgroundColor: primaryColor }}
                      disabled={isSubmitting || inviteCode.length < 8}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Continue with Invite Code'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="email">
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Work Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use the email address registered by your administrator
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      style={{ backgroundColor: primaryColor }}
                      disabled={isSubmitting || !email.includes('@')}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Continue with Email'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
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
