import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCandidatePortal } from '@/contexts/CandidatePortalContext';
import { Loader2, ClipboardList, Building2, AlertCircle, Briefcase } from 'lucide-react';
import rcfLogo from '@/assets/rolecolor-ai-logo.svg';

export default function CandidateLanding() {
  const { company, candidate, applicationLink, loading, error, portalMode } = useCandidatePortal();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Link Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "This link doesn't exist or may have expired."}
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
  const positionTitle = portalMode === 'apply' 
    ? applicationLink?.position_title 
    : candidate?.position_title;
  const assessmentType = portalMode === 'apply'
    ? applicationLink?.assessment_type
    : candidate?.assessment_type;

  // If candidate already completed, redirect to results
  if (candidate?.assessment_completed_at) {
    return (
      <div 
        className="min-h-screen"
        style={{ background: `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}10 100%)` }}
      >
        <header className="py-6 px-4" style={{ borderBottom: `2px solid ${primaryColor}20` }}>
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-12 w-auto object-contain" />
            ) : (
              <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                <Building2 className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{company.name}</h1>
              <p className="text-sm text-muted-foreground">Candidate Portal</p>
            </div>
          </div>
        </header>

        <main className="py-16 px-4">
          <Card className="max-w-xl mx-auto shadow-xl border-2" style={{ borderColor: `${primaryColor}30` }}>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-green-100">
                <ClipboardList className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Assessment Complete!</h2>
              <p className="text-muted-foreground mb-6">
                You have already completed your assessment. View your results below.
              </p>
              <Button 
                size="lg"
                style={{ backgroundColor: primaryColor }}
                onClick={() => navigate('results')}
              >
                View Your Results
              </Button>
            </CardContent>
          </Card>
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

  return (
    <div 
      className="min-h-screen"
      style={{ background: `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}10 100%)` }}
    >
      {/* Header */}
      <header className="py-6 px-4" style={{ borderBottom: `2px solid ${primaryColor}20` }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-12 w-auto object-contain" />
          ) : (
            <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
              <Building2 className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{company.name}</h1>
            <p className="text-sm text-muted-foreground">Candidate Portal</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            {positionTitle && (
              <Badge 
                variant="secondary" 
                className="mb-4 text-sm px-4 py-1 gap-2"
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              >
                <Briefcase className="h-3.5 w-3.5" />
                {positionTitle}
              </Badge>
            )}
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              {portalMode === 'apply' ? 'Apply for This Position' : 'Complete Your Assessment'}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {portalMode === 'apply' 
                ? `Join ${company.name}! Complete our behavioral assessment to help us understand your working style.`
                : `Welcome! ${company.name} has invited you to complete a behavioral assessment as part of the hiring process.`
              }
            </p>
          </div>

          <Card className="max-w-xl mx-auto shadow-xl border-2" style={{ borderColor: `${primaryColor}30` }}>
            <CardHeader className="text-center">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: primaryColor }}
              >
                <ClipboardList className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">
                {portalMode === 'apply' ? 'Start Your Application' : 'Ready to Begin?'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 text-muted-foreground">
                <div className="flex items-start gap-3">
                  <span className="font-bold" style={{ color: primaryColor }}>1.</span>
                  <span>
                    {portalMode === 'apply' 
                      ? 'Enter your details to create your application'
                      : 'Verify your email to access your assessment'
                    }
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-bold" style={{ color: primaryColor }}>2.</span>
                  <span>Answer {assessmentType === '50q' ? '50' : '25'} questions about your work style</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-bold" style={{ color: primaryColor }}>3.</span>
                  <span>Receive your personalized leadership profile</span>
                </div>
              </div>

              {/* Important Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <span className="text-amber-600 text-lg">⚠️</span>
                  <div>
                    <p className="font-semibold text-amber-800 mb-1">Important: One-Time Assessment</p>
                    <p className="text-sm text-amber-700">
                      Please take your time. You can only complete this assessment <strong>once</strong>. 
                      Your answers cannot be changed after submission.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  size="lg" 
                  className="w-full text-lg py-6"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => navigate('login')}
                >
                  {portalMode === 'apply' ? 'Start Application' : 'Continue'}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Takes approximately {assessmentType === '50q' ? '10-15' : '5-10'} minutes to complete
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
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
