import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, ArrowLeft, ArrowRight } from 'lucide-react';

export default function B2BSignIn() {
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subdomain.trim()) {
      toast({
        title: 'Please enter a subdomain',
        description: 'Enter your company subdomain to continue.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Check if company exists
      const { data: company, error } = await supabase
        .from('companies')
        .select('id, name, subdomain')
        .eq('subdomain', subdomain.toLowerCase().trim())
        .maybeSingle();

      if (error) throw error;

      if (!company) {
        toast({
          title: 'Company not found',
          description: 'No company exists with that subdomain. Please check and try again.',
          variant: 'destructive',
        });
        return;
      }

      // Redirect to company admin login
      navigate(`/company/${company.subdomain}/admin`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to find company. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Clean subdomain input (remove special chars, lowercase)
  const cleanSubdomain = (value: string) => {
    return value.toLowerCase().replace(/[^a-z0-9-]/g, '');
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Back button */}
        <Button 
          variant="ghost" 
          className="mb-6 gap-2"
          onClick={() => navigate('/b2b')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to B2B
        </Button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Company Sign In</h1>
          <p className="text-muted-foreground">
            Enter your company subdomain to access your admin dashboard
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Find Your Company</CardTitle>
            <CardDescription>
              Enter your company identifier to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subdomain">Company Identifier</Label>
                <div className="flex items-center">
                  <div className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-sm text-muted-foreground whitespace-nowrap">
                    rolecolorfinder.lovable.app/company/
                  </div>
                  <Input
                    id="subdomain"
                    placeholder="your-company"
                    value={subdomain}
                    onChange={(e) => setSubdomain(cleanSubdomain(e.target.value))}
                    className="rounded-l-none"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This is your company identifier from your portal URL
                </p>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={loading || !subdomain.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finding company...
                  </>
                ) : (
                  <>
                    Continue to Admin Login
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have a company account?{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto"
              onClick={() => navigate('/b2b')}
            >
              Create one here
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
