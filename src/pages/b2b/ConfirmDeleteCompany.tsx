import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function ConfirmDeleteCompany() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const handleConfirmDelete = async () => {
    if (!token || !companyName.trim()) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('delete-company', {
        body: {
          action: 'confirm',
          token,
          company_name_confirmation: companyName.trim(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Company deleted',
        description: 'The company and all associated data were permanently deleted.',
      });

      navigate('/b2b');
    } catch (error: any) {
      toast({
        title: 'Deletion failed',
        description: error?.message || 'Could not complete company deletion.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Invalid Deletion Link</CardTitle>
            <CardDescription>The deletion token is missing. Please use the link from your email.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/b2b/signin')}>Go to B2B Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>You must sign in as the company owner to complete deletion.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/b2b/signin')}>Go to B2B Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirm Company Deletion
          </CardTitle>
          <CardDescription>
            This is permanent and irreversible. Type the company name exactly as requested in your email to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name-confirm">Company Name</Label>
            <Input
              id="company-name-confirm"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Type company name to confirm"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/b2b/company-portal?tab=settings')} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleConfirmDelete}
              disabled={submitting || !companyName.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Company
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
