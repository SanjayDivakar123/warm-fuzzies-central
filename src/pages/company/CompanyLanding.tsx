import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCompanyPortal } from '@/contexts/CompanyPortalContext';
import { Loader2, ClipboardList, Building2, AlertCircle } from 'lucide-react';

export default function CompanyLanding() {
  const { company, loading, error } = useCompanyPortal();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading company portal...</p>
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
            <h1 className="text-2xl font-bold mb-2">Company Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The company portal you're looking for doesn't exist or may have been removed.
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Apply company branding
  const primaryColor = company.primary_color || '#9b87f5';
  const secondaryColor = company.secondary_color || '#7E69AB';

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}10 100%)`
      }}
    >
      {/* Header with company branding */}
      <header 
        className="py-6 px-4"
        style={{ borderBottom: `2px solid ${primaryColor}20` }}
      >
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {company.logo_url ? (
            <img 
              src={company.logo_url} 
              alt={`${company.name} logo`}
              className="h-12 w-auto object-contain"
            />
          ) : (
            <div 
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <Building2 className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{company.name}</h1>
            <p className="text-sm text-muted-foreground">Leadership Assessment Portal</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge 
              variant="secondary" 
              className="mb-4 text-sm px-4 py-1"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            >
              {company.assessment_type === '25q' ? '25 Questions' : '50 Questions'} Assessment
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Discover Your Leadership Style
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Welcome to {company.name}'s leadership assessment. Complete this assessment to understand 
              your professional strengths and how you contribute to your team.
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
              <CardTitle className="text-2xl">Ready to Begin?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 text-muted-foreground">
                <div className="flex items-start gap-3">
                  <span className="font-bold" style={{ color: primaryColor }}>1.</span>
                  <span>Login with your invite code or company email</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-bold" style={{ color: primaryColor }}>2.</span>
                  <span>Answer {company.assessment_type === '25q' ? '25' : '50'} questions about your work style</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-bold" style={{ color: primaryColor }}>3.</span>
                  <span>Receive your personalized leadership profile</span>
                </div>
              </div>

              {/* Important Warning */}
              <div 
                className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-amber-600 text-lg">⚠️</span>
                  <div>
                    <p className="font-semibold text-amber-800 mb-1">Important: One-Time Assessment</p>
                    <p className="text-sm text-amber-700">
                      Please take your time. You can only complete this assessment <strong>once</strong> per invite code. 
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
                  onClick={() => navigate(`/company/${company.subdomain}/login`)}
                >
                  Login to Take Assessment
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Takes approximately {company.assessment_type === '25q' ? '5-10' : '10-15'} minutes to complete
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 text-center space-y-3">
        <p className="text-muted-foreground text-sm">Powered by RoleColorFinder</p>
        <button 
          onClick={() => navigate(`/company/${company.subdomain}/admin`)}
          className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
        >
          Admin Login
        </button>
      </footer>
    </div>
  );
}
