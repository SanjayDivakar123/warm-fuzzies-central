import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function B2B() {
  const [companyName, setCompanyName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [seats, setSeats] = useState('5');
  const [assessmentType, setAssessmentType] = useState<'25q' | '50q'>('25q');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 63);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subdomain = generateSubdomain(companyName);

      // Call edge function to create company
      const { data, error } = await supabase.functions.invoke('create-company', {
        body: {
          name: companyName,
          subdomain,
          admin_email: adminEmail,
          seats_purchased: parseInt(seats),
          assessment_type: assessmentType,
        },
      });

      if (error) throw error;

      toast({
        title: 'Company created!',
        description: `Your company subdomain is: ${subdomain}.rolecolorfinder.com`,
      });

      // Navigate to dashboard
      navigate('/b2b/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error creating company',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
                  min="1"
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessmentType">Assessment Type</Label>
                <Select value={assessmentType} onValueChange={(v) => setAssessmentType(v as '25q' | '50q')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25q">25 Questions (Student)</SelectItem>
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
      </div>
    </div>
  );
}
