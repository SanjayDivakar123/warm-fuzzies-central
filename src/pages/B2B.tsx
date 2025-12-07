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
import { Loader2 } from 'lucide-react';

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
      toast({
        title: 'Error creating company',
        description: error.message || 'Failed to create company. Please try again.',
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

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">RoleColorFinder B2B</h1>
          <p className="text-muted-foreground">
            Create your company's assessment portal
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Company Account</CardTitle>
            <CardDescription>
              Set up your company's branded assessment portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCompany} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Acme Corporation"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
                {companyName && (
                  <p className="text-sm text-muted-foreground">
                    Subdomain: {generateSubdomain(companyName)}.rolecolorfinder.com
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@company.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seats">Number of Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  min="2"
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Minimum 2 seats • $20 per employee (one-time)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessmentType">Assessment Type</Label>
                <Select value={assessmentType} onValueChange={(v) => setAssessmentType(v as '25q' | '50q')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25q">25 Questions (Professional)</SelectItem>
                    <SelectItem value="50q">50 Questions (Professional)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Company Portal
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sign in to existing account section */}
        <div className="mt-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Already have a company account?
              </span>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="mt-6 gap-2"
            onClick={() => navigate('/b2b/signin')}
          >
            Sign in to your Company
          </Button>
        </div>
      </div>
    </div>
  );
}
