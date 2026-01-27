import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCandidatePortal } from '@/contexts/CandidatePortalContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building2, ArrowLeft, Mail, User, Phone } from 'lucide-react';
import rcfLogo from '@/assets/rolecolor-ai-logo.svg';
import { z } from 'zod';

const applySchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

const verifySchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function CandidateLogin() {
  const { company, candidate, applicationLink, loading, error, portalMode, setCandidate } = useCandidatePortal();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState(candidate?.email || '');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !company) {
    navigate(-1);
    return null;
  }

  const primaryColor = company.primary_color || '#9b87f5';
  const secondaryColor = company.secondary_color || '#7E69AB';

  const handleVerifyInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = verifySchema.safeParse({ email });
    if (!validation.success) {
      toast({
        title: 'Invalid Input',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    if (!candidate) {
      toast({
        title: 'Error',
        description: 'No candidate found for this invite.',
        variant: 'destructive',
      });
      return;
    }

    // Verify email matches the invited email
    if (email.toLowerCase().trim() !== candidate.email.toLowerCase()) {
      toast({
        title: 'Email Mismatch',
        description: 'The email you entered does not match the invitation.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update candidate status to assessment_pending if invited
      if (candidate.status === 'invited') {
        await supabase
          .from('candidates')
          .update({ status: 'assessment_pending' })
          .eq('id', candidate.id);
      }

      toast({
        title: 'Verified!',
        description: "Let's start your assessment.",
      });

      navigate('../assessment');
    } catch (err) {
      console.error('Verification error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = applySchema.safeParse({ email, fullName, phone });
    if (!validation.success) {
      toast({
        title: 'Invalid Input',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    if (!applicationLink) {
      toast({
        title: 'Error',
        description: 'Application link not found.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if candidate already exists for this email and company
      const { data: existingCandidate } = await supabase
        .from('candidates')
        .select('*')
        .eq('company_id', company.id)
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (existingCandidate) {
        if (existingCandidate.assessment_completed_at) {
          toast({
            title: 'Already Applied',
            description: 'You have already completed an assessment for this company.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }

        // Resume existing application
        setCandidate(existingCandidate);
        toast({
          title: 'Welcome Back!',
          description: 'Continuing your application.',
        });
        navigate('../assessment');
        return;
      }

      // Create new candidate
      const { data: newCandidate, error: createError } = await supabase
        .from('candidates')
        .insert({
          company_id: company.id,
          email: email.toLowerCase().trim(),
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          position_title: applicationLink.position_title,
          source: 'public_link',
          status: 'applied',
          assessment_category: applicationLink.assessment_category,
          assessment_type: applicationLink.assessment_type,
          ideal_role_color: applicationLink.ideal_role_color,
          required_skills: applicationLink.required_skills,
        })
        .select()
        .single();

      if (createError) {
        if (createError.code === '23505') {
          toast({
            title: 'Already Applied',
            description: 'An application with this email already exists.',
            variant: 'destructive',
          });
        } else {
          throw createError;
        }
        setIsSubmitting(false);
        return;
      }

      // Increment application count
      await supabase
        .from('candidate_application_links')
        .update({ applications_count: (applicationLink.applications_count || 0) + 1 })
        .eq('id', applicationLink.id);

      setCandidate(newCandidate);
      toast({
        title: 'Application Started!',
        description: "Let's begin your assessment.",
      });

      navigate('../assessment');
    } catch (err) {
      console.error('Application error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: `${primaryColor}15` }}
    >
      {/* Header */}
      <header className="py-6 px-4" style={{ borderBottom: `2px solid ${primaryColor}20` }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-10 w-auto object-contain" />
          ) : (
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
              <Building2 className="h-5 w-5 text-white" />
            </div>
          )}
          <span className="font-semibold">{company.name}</span>
        </div>
      </header>

      {/* Main content */}
      <main className="py-16 px-4">
        <div className="max-w-md mx-auto">
          <Card className="shadow-xl border-2 relative overflow-hidden" style={{ borderColor: `${primaryColor}30` }}>
            {/* Accent line */}
            <div 
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
            />
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-2xl">
                {portalMode === 'apply' ? 'Start Your Application' : 'Verify Your Email'}
              </CardTitle>
              <CardDescription>
                {portalMode === 'apply' 
                  ? `Apply for ${applicationLink?.position_title || 'this position'} at ${company.name}`
                  : 'Enter your email to access your assessment'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={portalMode === 'apply' ? handleApply : handleVerifyInvite} className="space-y-5">
                {portalMode === 'apply' && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {portalMode === 'invite' && (
                    <p className="text-xs text-muted-foreground">
                      Enter the email address where you received the invitation
                    </p>
                  )}
                </div>

                {portalMode === 'apply' && (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number (Optional)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  style={{ backgroundColor: primaryColor }}
                  disabled={isSubmitting || !email}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {portalMode === 'apply' ? 'Submitting...' : 'Verifying...'}
                    </>
                  ) : (
                    portalMode === 'apply' ? 'Continue to Assessment' : 'Verify & Continue'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="py-8 px-4 text-center">
        <a 
          href="https://rolecolorfinder.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity text-muted-foreground"
        >
          <span className="text-sm">Powered by</span>
          <img src={rcfLogo} alt="RoleColorFinder" className="h-6 w-auto" />
        </a>
      </footer>
    </div>
  );
}
