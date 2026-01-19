import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Building2, Users, Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function B2B() {
  const [companyName, setCompanyName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [seats, setSeats] = useState('2'); // Min 2 per spec
  const [assessmentType, setAssessmentType] = useState<'25q' | '50q'>('25q');
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user already has company access
  useEffect(() => {
    const checkExistingAccess = async () => {
      if (!user) {
        setCheckingAccess(false);
        return;
      }

      const { data: companyUser } = await supabase
        .from('company_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (companyUser) {
        // User already has company access, redirect to dashboard
        navigate('/b2b/company-portal');
        return;
      }

      // Pre-fill admin email
      if (user.email && !adminEmail) {
        setAdminEmail(user.email);
      }
      setCheckingAccess(false);
    };

    checkExistingAccess();
  }, [user, navigate]);

  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 63);
  };

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

    // Validate minimum seats
    const seatCount = parseInt(seats);
    if (seatCount < 2) {
      toast({
        title: 'Minimum 2 seats required',
        description: 'Please enter at least 2 seats.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const subdomain = generateSubdomain(companyName);

      // Call edge function to create company with user_id
      const { data, error } = await supabase.functions.invoke('create-company', {
        body: {
          name: companyName,
          subdomain,
          admin_email: adminEmail,
          seats_purchased: seatCount,
          assessment_type: assessmentType,
          user_id: user.id, // Link to current user
        },
      });

      if (error) throw error;
      
      // Check for error in response body
      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Company created!',
        description: `Your company subdomain is: ${subdomain}.rolecolorfinder.com`,
      });

      // Navigate to company portal
      navigate('/b2b/company-portal');
    } catch (error: any) {
      console.error('Create company error:', error);
      
      // Parse the error message from edge function response
      let errorMessage = 'Failed to create company. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error creating company',
        description: errorMessage,
        variant: 'destructive',
      });
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
    { icon: Building2, text: 'Custom branded portal' },
    { icon: Users, text: 'Team assessments & insights' },
    { icon: Shield, text: 'Secure & private data' },
    { icon: Sparkles, text: 'AI-powered work matching' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-role-red/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-role-blue/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-role-yellow/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-role-green/15 rounded-full blur-3xl animate-pulse delay-500" />
      
      <div className="relative z-10 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with animation */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Enterprise Solution</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              RoleColorFinder B2B
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock your team's potential with personality-driven insights and AI-powered work assignment
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/60 backdrop-blur-sm border border-border/50 shadow-sm"
              >
                <feature.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Glass card form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="backdrop-blur-xl bg-background/70 border-border/50 shadow-2xl shadow-primary/5">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">Create Company Account</CardTitle>
                <CardDescription className="text-base">
                  Set up your company's branded assessment portal in minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCompany} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-sm font-medium">Company Name</Label>
                      <Input
                        id="companyName"
                        placeholder="Acme Corporation"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                      />
                      {companyName && (
                        <p className="text-xs text-muted-foreground">
                          Subdomain: <span className="font-mono text-primary">{generateSubdomain(companyName)}</span>.rolecolorfinder.com
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminEmail" className="text-sm font-medium">Admin Email</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="admin@company.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        required
                        className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seats" className="text-sm font-medium">Number of Seats</Label>
                      <Input
                        id="seats"
                        type="number"
                        min="2"
                        value={seats}
                        onChange={(e) => setSeats(e.target.value)}
                        required
                        className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum 2 seats • <span className="text-primary font-medium">$20</span> per employee (one-time)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assessmentType" className="text-sm font-medium">Assessment Type</Label>
                      <Select value={assessmentType} onValueChange={(v) => setAssessmentType(v as '25q' | '50q')}>
                        <SelectTrigger className="h-11 bg-background/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25q">25 Questions (Professional)</SelectItem>
                          <SelectItem value="50q">50 Questions (Professional)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25" 
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {loading ? 'Creating Portal...' : 'Create Company Portal'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sign in section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 text-center"
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent backdrop-blur-sm px-4 text-muted-foreground">
                  Already have a company account?
                </span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="mt-6 gap-2 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80"
              onClick={() => navigate('/b2b/signin')}
            >
              <Building2 className="h-4 w-4" />
              Sign in to your Company
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
