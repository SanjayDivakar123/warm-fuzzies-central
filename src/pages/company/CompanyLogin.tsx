import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
        toast({
          title: "Login Failed",
          description: data?.message || "Invalid email or invite code combination.",
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

  const isFormValid = inviteCode.length === 8 && email.includes('@');

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
