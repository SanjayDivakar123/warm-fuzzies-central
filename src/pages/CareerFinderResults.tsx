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
  ArrowLeft,
  ArrowRight, 
  Sparkles, 
  Target, 
  TrendingUp,
  Users,
  Loader2,
  Building2,
  DollarSign,
  Star,
  Lightbulb,
  Shield,
  Download,
  Upload,
  FileText
} from "lucide-react";
import { getCareerProfile, ColorCareerProfile } from "@/lib/careerData";
import ResumeCareerUpload from "@/components/career/ResumeCareerUpload";
import SendToFriendCard from "@/components/reports/SendToFriendCard";

export default function CareerFinderResults() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [secondaryColor, setSecondaryColor] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [profile, setProfile] = useState<ColorCareerProfile | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      checkAccessAndLoadData();
    } else if (!authLoading && !user) {
      navigate('/career-finder');
    }
  }, [user, authLoading]);

  const checkAccessAndLoadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Check for career report access
      const careerAccessKey = `career_access_${user.id}`;
      const careerAccess = localStorage.getItem(careerAccessKey);
      
      if (!careerAccess || !JSON.parse(careerAccess).verified) {
        // No access - redirect back to career finder
        navigate('/career-finder');
        return;
      }
      
      setHasAccess(true);
      
      // Load ALL assessment results to find one with color data
      const { data: assessments, error } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Career Finder Results - Found assessments:', assessments);

      if (error) {
        console.error('Error loading assessment:', error);
        return;
      }

      const completedAssessment = assessments?.find(a => {
        const results = a.results as any;
        const assessmentType = a.assessment_type;
        
        // Skip free assessments
        if (assessmentType === 'free') return false;
        
        // Check for various naming conventions used in different assessment types
        return results?.primaryColor || results?.dominantColor || 
               (results?.colorScores && Object.keys(results.colorScores).length > 0) ||
               (results?.scores && Object.keys(results.scores).length > 0);
      });

      if (completedAssessment) {
        const results = completedAssessment.results as any;
        // Handle both naming conventions: primaryColor (leadership/pro) and dominantColor (premium)
        const color = results?.primaryColor || results?.dominantColor;
        const secondary = results?.secondaryColor;
        console.log('Found color:', color, 'secondary:', secondary);
        setPrimaryColor(color);
        setSecondaryColor(secondary);
        
        const careerProfile = getCareerProfile(color);
        setProfile(careerProfile);
      }
    } catch (error) {
      console.error('Error loading career data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading your career recommendations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Career Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find your assessment results. Please complete an assessment first.
          </p>
          <Button onClick={() => navigate('/career-finder')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Career Finder
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/career-finder')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Career Finder
          </Button>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center text-6xl shadow-lg">
              {profile.emoji}
            </div>
            <div className="flex-1">
              <Badge variant="outline" className="mb-2">
                <Briefcase className="w-3 h-3 mr-1" />
                Career Report
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Top Careers for {profile.archetype}s
              </h1>
              <p className="text-lg text-muted-foreground">
                {profile.tagline}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Your RoleColor Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">{profile.description}</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  Core Strengths
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.coreStrengths.map((strength, i) => (
                    <Badge key={i} variant="secondary">{strength}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  Ideal Work Environment
                </h4>
                <p className="text-sm text-muted-foreground">{profile.workEnvironment}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                Leadership Style
              </h4>
              <p className="text-sm text-muted-foreground">{profile.leadershipStyle}</p>
            </div>
          </CardContent>
        </Card>

        {/* Career Recommendations */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Your Top 8 Career Matches
          </h2>
          
          <div className="grid gap-4">
            {profile.careers.map((career, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Fit Badge */}
                    <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-6 flex flex-col items-center justify-center md:w-32 border-b md:border-b-0 md:border-r">
                      <div className="relative">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-muted/30"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${career.fitPercentage * 1.76} 176`}
                            className="text-primary"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">{career.fitPercentage}%</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">Fit Score</span>
                    </div>
                    
                    {/* Career Details */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold">{career.title}</h3>
                            {index < 3 && (
                              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                                <Star className="w-3 h-3 mr-1" />
                                Top Match
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground">{career.description}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full flex-shrink-0">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-600 whitespace-nowrap">{career.salaryRange}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Key Skills Required:</h4>
                        <div className="flex flex-wrap gap-2">
                          {career.skills.map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Resume Analysis Section */}
        {user && primaryColor && (
          <div className="space-y-6">
            <div className="text-center">
              <Badge variant="outline" className="mb-3 gap-1">
                <Sparkles className="w-3 h-3" />
                AI-Powered Insight
              </Badge>
              <h2 className="text-2xl font-bold mb-2">
                Want Personalized Career Matches?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Upload your resume and our AI will analyze your experience, skills, and background 
                to give you career recommendations tailored specifically to you.
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <ResumeCareerUpload primaryColor={primaryColor} userId={user.id} />
            </div>

            {/* Check if user has existing analysis */}
            {localStorage.getItem(`career_resume_analysis_${user.id}`) && (
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/career-finder/resume-results')}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View Your Resume Analysis
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Action Tips */}
        <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Next Steps for Your Career Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">1</span>
                </div>
                <div>
                  <h4 className="font-semibold">Research Your Top Matches</h4>
                  <p className="text-sm text-muted-foreground">
                    Explore job postings and company cultures for your top 3 career matches.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">Develop Key Skills</h4>
                  <p className="text-sm text-muted-foreground">
                    Focus on the skills that appear across multiple career recommendations.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">3</span>
                </div>
                <div>
                  <h4 className="font-semibold">Network Strategically</h4>
                  <p className="text-sm text-muted-foreground">
                    Connect with professionals in your target roles to learn about their experiences.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">4</span>
                </div>
                <div>
                  <h4 className="font-semibold">Leverage Your Strengths</h4>
                  <p className="text-sm text-muted-foreground">
                    Highlight your {profile.archetype.toLowerCase()} strengths in applications and interviews.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4">Ready to Take the Next Step?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Share your career profile with mentors, career coaches, or use it to refine your job search strategy.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              View Dashboard
            </Button>
            <Button onClick={() => window.print()}>
              <Download className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          </div>
        </div>

        <SendToFriendCard color={primaryColor} className="mt-8" />
      </div>
    </div>
  );
}
