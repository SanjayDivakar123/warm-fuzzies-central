import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Briefcase, 
  Lock, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Target, 
  TrendingUp,
  Users,
  AlertCircle,
  Loader2,
  ChevronRight
} from "lucide-react";
import { PaymentButton } from "@/components/payment/PaymentButton";
import { careerProfiles, getCareerProfile } from "@/lib/careerData";

interface AssessmentStatus {
  hasCompletedAssessment: boolean;
  assessmentType: string | null;
  primaryColor: string | null;
  hasCareerAccess: boolean;
}

export default function CareerFinder() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus>({
    hasCompletedAssessment: false,
    assessmentType: null,
    primaryColor: null,
    hasCareerAccess: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      checkAssessmentStatus();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const checkAssessmentStatus = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Check for career report access first (from localStorage)
      const careerAccessKey = `career_access_${user.id}`;
      const careerAccess = localStorage.getItem(careerAccessKey);
      
      // Check for ALL assessments for this user (not just specific types)
      const { data: assessments, error } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Career Finder - Found assessments:', assessments);

      if (error) {
        console.error('Error checking assessment status:', error);
        setLoading(false);
        return;
      }

      // Find a completed assessment with actual color results (not just payment records)
      // We're checking for any assessment that has color data, regardless of type
      const completedAssessment = assessments?.find(a => {
        const results = a.results as any;
        const assessmentType = a.assessment_type;
        
        // Skip free assessments - they don't qualify
        if (assessmentType === 'free') return false;
        
        // Check for various naming conventions used in different assessment types
        const hasColorData = results?.primaryColor || results?.dominantColor || 
                           (results?.colorScores && Object.keys(results.colorScores).length > 0) ||
                           (results?.scores && Object.keys(results.scores).length > 0);
        
        console.log(`Assessment ${a.id} (${assessmentType}):`, { hasColorData, results });
        return hasColorData;
      });

      if (completedAssessment) {
        const results = completedAssessment.results as any;
        // Handle both naming conventions: primaryColor (leadership/pro) and dominantColor (premium)
        const color = results?.primaryColor || results?.dominantColor || null;
        console.log('Found completed assessment with color:', color);
        setAssessmentStatus({
          hasCompletedAssessment: true,
          assessmentType: completedAssessment.assessment_type,
          primaryColor: color,
          hasCareerAccess: careerAccess ? JSON.parse(careerAccess).verified : false
        });
      } else {
        // Check if user has paid but not completed assessment
        const paymentRecord = assessments?.find(a => {
          const results = a.results as any;
          return results?.status === 'payment_completed' && 
                 ['premium', 'pro'].includes(a.assessment_type);
        });
        
        if (paymentRecord) {
          console.log('Found payment record, but no completed assessment');
        }
        
        setAssessmentStatus({
          hasCompletedAssessment: false,
          assessmentType: null,
          primaryColor: null,
          hasCareerAccess: false
        });
      }
    } catch (error) {
      console.error('Error checking assessment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = () => {
    if (assessmentStatus.primaryColor) {
      navigate('/career-finder/results');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Career Finder</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              What Career Matches Your RoleColor?
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover careers that align with your natural working style and strengths
            </p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to access the Career Finder
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => navigate('/auth')}>
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Don't have an account? Sign up for free
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // User hasn't completed a qualifying assessment
  if (!assessmentStatus.hasCompletedAssessment) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Briefcase className="w-3 h-3 mr-1" />
              Career Finder
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              What Career Matches Your RoleColor?
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover careers that align with your natural working style and strengths
            </p>
          </div>

          {/* Requirement Notice */}
          <Card className="max-w-2xl mx-auto mb-8 border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Assessment Required</h3>
                  <p className="text-muted-foreground mb-4">
                    To get personalized career recommendations based on your RoleColor, you need to complete a 25-question or 50-question assessment first.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <PaymentButton productType="premium" variant="default" size="lg">
                      Get Premium Assessment ($124.99)
                    </PaymentButton>
                    <PaymentButton productType="pro" variant="outline" size="lg">
                      Get Pro Assessment ($199.99)
                    </PaymentButton>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview of what you'll get */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  What You'll Discover
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-sm">Top 8 careers matched to your RoleColor</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-sm">Salary ranges for each career path</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-sm">Role fit percentages based on your profile</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-sm">Key skills needed for each role</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-sm">Ideal work environment insights</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Career Preview by Color
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(careerProfiles).slice(0, 4).map(([color, profile]) => (
                  <div key={color} className="flex items-center gap-3">
                    <span className="text-2xl">{profile.emoji}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{profile.archetype}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile.careers[0].title}, {profile.careers[1].title}...
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // User has completed assessment - show career finder access
  const profile = assessmentStatus.primaryColor ? getCareerProfile(assessmentStatus.primaryColor) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Briefcase className="w-3 h-3 mr-1" />
            Career Finder
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Your Career Matches Are Ready!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Based on your {assessmentStatus.assessmentType === 'pro' ? '50-question' : '25-question'} assessment results
          </p>
        </div>

        {/* User's Color Profile Summary */}
        {profile && (
          <Card className="max-w-2xl mx-auto mb-8 border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center text-4xl">
                  {profile.emoji}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your RoleColor</p>
                  <h3 className="text-2xl font-bold">{profile.colorName} - {profile.archetype}</h3>
                  <p className="text-muted-foreground">{profile.tagline}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Career Report Access */}
        {assessmentStatus.hasCareerAccess ? (
          <Card className="max-w-2xl mx-auto border-green-500/50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Career Report Unlocked!</h3>
              <p className="text-muted-foreground mb-6">
                Your personalized career recommendations are ready to view.
              </p>
              <Button size="lg" onClick={handleViewResults} className="gap-2">
                View Career Recommendations
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Unlock Your Career Report</h3>
                <p className="text-muted-foreground">
                  Get personalized career recommendations based on your RoleColor profile
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  What's included in your Career Report:
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm">8 top careers for your color</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Salary ranges & fit percentages</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Required skills breakdown</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Ideal work environment guide</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Leadership style insights</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Core strengths alignment</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="mb-4">
                  <span className="text-4xl font-bold">$19</span>
                  <span className="text-muted-foreground ml-2">one-time</span>
                </div>
                <PaymentButton 
                  productType="career" 
                  size="lg" 
                  className="w-full sm:w-auto gap-2"
                >
                  Unlock Career Report
                  <ChevronRight className="w-4 h-4" />
                </PaymentButton>
                <p className="text-xs text-muted-foreground mt-4">
                  Instant access after payment. No subscription required.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Career Preview Cards */}
        {profile && !assessmentStatus.hasCareerAccess && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-center mb-6">Preview: Top Careers for {profile.archetype}s</h3>
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {profile.careers.slice(0, 3).map((career, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
                  <CardContent className="p-4 relative">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{career.fitPercentage}% fit</Badge>
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold">{career.title}</h4>
                    <p className="text-sm text-muted-foreground blur-sm">
                      {career.description}
                    </p>
                    <p className="text-sm font-medium text-primary mt-2 blur-sm">
                      {career.salaryRange}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-4 text-sm">
              Unlock your career report to see all 8 careers with full details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
