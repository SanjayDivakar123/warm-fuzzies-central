import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft,
  Sparkles, 
  Target, 
  TrendingUp,
  Loader2,
  Building2,
  DollarSign,
  Star,
  Lightbulb,
  CheckCircle,
  Briefcase,
  GraduationCap,
  User,
  FileText,
  Zap,
  ArrowUpRight
} from "lucide-react";
import { getCareerProfile } from "@/lib/careerData";
import SendToFriendCard from "@/components/reports/SendToFriendCard";

interface CareerMatch {
  title: string;
  matchScore: number;
  reasoning: string;
  relevantExperience: string[];
  skillsToLeverage: string[];
  growthPath: string;
}

interface ResumeAnalysis {
  extractedProfile: {
    name: string;
    currentRole: string;
    yearsExperience: number;
    topSkills: string[];
    education: string;
    industries: string[];
  };
  careerMatches: CareerMatch[];
  strengthsFromResume: string[];
  developmentAreas: string[];
  personalizedAdvice: string;
  colorProfile: {
    color: string;
    archetype: string;
  };
}

export default function CareerResumeResults() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadAnalysis();
    } else if (!authLoading && !user) {
      navigate('/career-finder');
    }
  }, [user, authLoading]);

  const loadAnalysis = () => {
    if (!user) return;
    
    const analysisKey = `career_resume_analysis_${user.id}`;
    const stored = localStorage.getItem(analysisKey);
    
    if (!stored) {
      // No analysis found - redirect back
      navigate('/career-finder/results');
      return;
    }

    try {
      const data = JSON.parse(stored);
      setAnalysis(data.analysis);
      setFileName(data.fileName);
      setAnalyzedAt(data.analyzedAt);
    } catch (e) {
      console.error('Failed to parse analysis:', e);
      navigate('/career-finder/results');
      return;
    }
    
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100 dark:bg-green-900/30";
    if (score >= 80) return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
    if (score >= 70) return "text-amber-600 bg-amber-100 dark:bg-amber-900/30";
    return "text-gray-600 bg-gray-100 dark:bg-gray-900/30";
  };

  const getColorBg = (color: string) => {
    switch (color?.toLowerCase()) {
      case 'yellow': return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
      case 'red': return 'from-red-500/20 to-red-600/10 border-red-500/30';
      case 'green': return 'from-green-500/20 to-green-600/10 border-green-500/30';
      case 'blue': return 'from-blue-500/20 to-blue-600/10 border-blue-500/30';
      default: return 'from-primary/20 to-purple-500/10 border-primary/30';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading your analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">No Analysis Found</h1>
          <p className="text-muted-foreground mb-6">
            Please upload your resume to get personalized career insights.
          </p>
          <Button onClick={() => navigate('/career-finder/results')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Career Results
          </Button>
        </div>
      </div>
    );
  }

  const profile = analysis.colorProfile?.color ? getCareerProfile(analysis.colorProfile.color) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <div className={`bg-gradient-to-br ${getColorBg(analysis.colorProfile?.color)} py-12`}>
        <div className="max-w-6xl mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/career-finder/results')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Career Report
          </Button>

          <div className="text-center mb-8">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Resume Analysis
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Personalized Career Insights
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Based on your resume and {analysis.colorProfile?.color} ({analysis.colorProfile?.archetype}) profile
            </p>
          </div>

          {/* Profile Summary Card */}
          <Card className="max-w-3xl mx-auto border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {analysis.extractedProfile.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U'}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <h2 className="text-2xl font-bold">{analysis.extractedProfile.name || 'Your Profile'}</h2>
                  <p className="text-muted-foreground">{analysis.extractedProfile.currentRole}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="gap-1">
                      <Briefcase className="w-3 h-3" />
                      {analysis.extractedProfile.yearsExperience} years experience
                    </Badge>
                    {analysis.extractedProfile.industries?.slice(0, 2).map((industry, i) => (
                      <Badge key={i} variant="secondary">{industry}</Badge>
                    ))}
                  </div>
                </div>
                {profile && (
                  <div className="text-center px-4 py-3 bg-muted/50 rounded-lg">
                    <span className="text-3xl">{profile.emoji}</span>
                    <p className="text-sm font-medium mt-1">{profile.archetype}</p>
                  </div>
                )}
              </div>
              {fileName && (
                <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  Analyzed from: {fileName}
                  {analyzedAt && (
                    <span className="ml-auto">
                      {new Date(analyzedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Personalized Advice */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Your Personalized Career Advice</h3>
                <p className="text-muted-foreground leading-relaxed">{analysis.personalizedAdvice}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Career Matches */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Your Top Career Matches</h2>
          </div>
          
          <div className="space-y-4">
            {analysis.careerMatches.map((career, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Score indicator */}
                    <div className={`md:w-32 p-6 flex flex-col items-center justify-center ${getScoreColor(career.matchScore)}`}>
                      <span className="text-3xl font-bold">{career.matchScore}%</span>
                      <span className="text-xs uppercase tracking-wide">Match</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            {career.title}
                            {index === 0 && (
                              <Badge className="bg-green-500 text-white">Best Match</Badge>
                            )}
                          </h3>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-4">{career.reasoning}</p>
                      
                      {/* Relevant Experience */}
                      {career.relevantExperience?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Your Relevant Experience
                          </h4>
                          <ul className="grid sm:grid-cols-2 gap-1">
                            {career.relevantExperience.map((exp, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary">•</span>
                                {exp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Skills to Leverage */}
                      {career.skillsToLeverage?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {career.skillsToLeverage.map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Growth Path */}
                      {career.growthPath && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
                            <div>
                              <span className="text-sm font-medium">Growth Path: </span>
                              <span className="text-sm text-muted-foreground">{career.growthPath}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Skills & Strengths Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Your Top Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.extractedProfile.topSkills?.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="py-1.5">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strengths from Resume */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Key Strengths Identified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.strengthsFromResume?.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Development Areas */}
        {analysis.developmentAreas?.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                Areas for Development
              </CardTitle>
              <CardDescription>
                Consider developing these areas to expand your career options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {analysis.developmentAreas.map((area, i) => (
                  <Badge key={i} variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400 py-1.5">
                    {area}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to Results */}
        <div className="text-center pt-8">
          <Button variant="outline" onClick={() => navigate('/career-finder/results')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            View General Career Recommendations
          </Button>
        </div>

        <SendToFriendCard color={analysis.colorProfile?.color} className="mt-8" />
      </div>
    </div>
  );
}
