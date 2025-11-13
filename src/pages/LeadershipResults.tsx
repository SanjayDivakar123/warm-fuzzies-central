import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Home, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateResults, type AssessmentResults } from "@/lib/assessmentScoring";
import { useToast } from "@/hooks/use-toast";

interface AIAnalysis {
  profileSummary: string;
  leadershipStage: string;
  stageDescription: string;
  growthPlan: string[];
  teamFitInsight: string;
}

const COLOR_INFO = {
  Yellow: {
    bg: "bg-yellow-500",
    name: "Yellow - The Doer",
    description: "Action-oriented leaders who drive execution and results"
  },
  Red: {
    bg: "bg-red-500",
    name: "Red - The Motivator",
    description: "Visionary and motivational leaders who inspire others"
  },
  Green: {
    bg: "bg-green-500",
    name: "Green - The Thinker",
    description: "Analytical and structured leaders who solve problems logically"
  },
  Blue: {
    bg: "bg-blue-500",
    name: "Blue - The Creator",
    description: "Creative and innovative leaders who bring fresh ideas"
  }
};

const StudentReport50Q = ({ results, analysis, isLoading }: { 
  results: AssessmentResults; 
  analysis: AIAnalysis | null;
  isLoading: boolean;
}) => (
  <div className="space-y-8">
    {/* Summary */}
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Your Leadership Colors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Primary Color</h3>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${COLOR_INFO[results.primaryColor].bg}`} />
              <div>
                <p className="text-2xl font-bold">{COLOR_INFO[results.primaryColor].name}</p>
                <p className="text-sm text-muted-foreground">Score: {results.colorScores[results.primaryColor]}/100</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Secondary Color</h3>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${COLOR_INFO[results.secondaryColor].bg}`} />
              <p className="text-2xl font-bold">{COLOR_INFO[results.secondaryColor].name}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Leadership Spectrum</h3>
          <div className="relative h-8 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 rounded-full">
            <div 
              className="absolute w-4 h-4 bg-white border-4 border-foreground rounded-full top-1/2 -translate-y-1/2"
              style={{ left: `${results.spectrumPosition}%` }}
            />
          </div>
        </div>

        <div className="pt-4">
          <h3 className="font-semibold mb-2">All Color Scores</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(results.colorScores).map(([color, score]) => (
              <div key={color} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full ${COLOR_INFO[color as keyof typeof COLOR_INFO].bg}`} />
                <span className="text-sm font-medium">{color}: {score}/100</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Color Profile for Group Work */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Color in Group Projects</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Generating your personalized profile...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-3">
            {analysis.profileSummary.split('\n\n').map((para, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed">{para}</p>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Your personalized profile will appear here.</p>
        )}
      </CardContent>
    </Card>

    {/* Category Breakdown */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Leadership Strengths</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(results.categoryScores).map(([category, score]) => (
          <div key={category}>
            <div className="flex justify-between mb-2">
              <h4 className="font-semibold">{category}</h4>
              <span className="text-sm text-muted-foreground">{score}/100</span>
            </div>
            <Progress value={score} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>

    {/* Leadership Stage */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Leadership Level</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Analyzing your leadership stage...</p>
          </div>
        ) : analysis ? (
          <>
            <Badge className="text-lg py-2 px-4">{analysis.leadershipStage}</Badge>
            <p className="text-muted-foreground leading-relaxed">{analysis.stageDescription}</p>
          </>
        ) : (
          <p className="text-muted-foreground">Your leadership stage analysis will appear here.</p>
        )}
      </CardContent>
    </Card>

    {/* Growth Plan */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Growth Plan</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Creating your personalized growth plan...</p>
          </div>
        ) : analysis && analysis.growthPlan ? (
          <ul className="space-y-3">
            {analysis.growthPlan.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary font-bold text-xl">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Your growth plan will appear here.</p>
        )}
      </CardContent>
    </Card>

    {/* Team Fit */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Team Collaboration Insight</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Analyzing your team fit...</p>
          </div>
        ) : analysis ? (
          <p className="text-muted-foreground leading-relaxed">{analysis.teamFitInsight}</p>
        ) : (
          <p className="text-muted-foreground">Your team collaboration insight will appear here.</p>
        )}
      </CardContent>
    </Card>
  </div>
);

const StudentReport25Q = ({ results, analysis, isLoading }: { 
  results: AssessmentResults; 
  analysis: AIAnalysis | null;
  isLoading: boolean;
}) => (
  <div className="space-y-8">
    {/* Summary */}
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Your Leadership Colors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6 justify-center">
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-sm">Primary Color</h3>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-16 h-16 rounded-full ${COLOR_INFO[results.primaryColor].bg}`} />
              <p className="text-xl font-bold">{COLOR_INFO[results.primaryColor].name}</p>
              <p className="text-xs text-muted-foreground">{results.colorScores[results.primaryColor]}/100</p>
            </div>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-sm">Secondary Color</h3>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-16 h-16 rounded-full ${COLOR_INFO[results.secondaryColor].bg}`} />
              <p className="text-xl font-bold">{COLOR_INFO[results.secondaryColor].name}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Strength Snapshot */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Strength Snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Generating your insights...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-3">
            {analysis.profileSummary.split('\n\n').map((para, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed">{para}</p>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>

    {/* Mini Growth Plan */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Mini Growth Plan</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Creating your growth plan...</p>
          </div>
        ) : analysis && analysis.growthPlan ? (
          <ul className="space-y-3">
            {analysis.growthPlan.slice(0, 3).map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary font-bold text-xl">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  </div>
);

const TeacherReport = ({ results, analysis, isLoading, is50Q }: { 
  results: AssessmentResults; 
  analysis: AIAnalysis | null;
  isLoading: boolean;
  is50Q: boolean;
}) => (
  <div className="space-y-8">
    {/* Executive Summary */}
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">{is50Q ? 'Executive Summary' : 'Summary'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Primary Leadership Color</h3>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${COLOR_INFO[results.primaryColor].bg}`} />
              <div>
                <p className="text-2xl font-bold">{COLOR_INFO[results.primaryColor].name}</p>
                <p className="text-sm text-muted-foreground">Score: {results.colorScores[results.primaryColor]}/100</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Secondary Color</h3>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${COLOR_INFO[results.secondaryColor].bg}`} />
              <p className="text-2xl font-bold">{COLOR_INFO[results.secondaryColor].name}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Leadership Spectrum</h3>
          <div className="relative h-8 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 rounded-full">
            <div 
              className="absolute w-4 h-4 bg-white border-4 border-foreground rounded-full top-1/2 -translate-y-1/2"
              style={{ left: `${results.spectrumPosition}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Professional Profile */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Professional Leadership Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Generating your professional analysis...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-3">
            {analysis.profileSummary.split('\n\n').map((para, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed">{para}</p>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>

    {is50Q && (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(results.categoryScores).map(([category, score]) => (
            <div key={category}>
              <div className="flex justify-between mb-2">
                <h4 className="font-semibold">{category}</h4>
                <span className="text-sm text-muted-foreground">{score}/100</span>
              </div>
              <Progress value={score} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    )}

    {/* Leadership Stage */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Leadership Stage Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Analyzing your leadership stage...</p>
          </div>
        ) : analysis ? (
          <>
            <Badge className="text-lg py-2 px-4">{analysis.leadershipStage}</Badge>
            <p className="text-muted-foreground leading-relaxed">{analysis.stageDescription}</p>
          </>
        ) : null}
      </CardContent>
    </Card>

    {/* Growth Plan */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Professional Growth Plan</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Creating your professional development plan...</p>
          </div>
        ) : analysis && analysis.growthPlan ? (
          <ul className="space-y-3">
            {analysis.growthPlan.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary font-bold text-xl">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  </div>
);

const LeadershipResults = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processResults = async () => {
      try {
        const { answers } = location.state || {};
        
        if (!answers || !type) {
          toast({
            title: "No assessment data",
            description: "Please complete an assessment first.",
            variant: "destructive"
          });
          navigate("/leadership-assessment");
          return;
        }

        // Determine total questions based on assessment type
        const totalQuestions = type?.includes('25q') ? 25 : 50;

        // Build color mapping from answers (value -> color)
        const questionColors: Record<number, Record<string, "Yellow" | "Red" | "Green" | "Blue">> = {};
        
        // For all assessments, map from the actual questions
        // The answers store option values which map to colors
        Object.keys(answers).forEach((qId) => {
          const id = parseInt(qId);
          // Default mapping based on original question structure
          questionColors[id] = {
            a: "Yellow",
            b: "Red",
            c: "Green",
            d: "Blue"
          };
        });

        const calculatedResults = calculateResults(answers, questionColors, totalQuestions);
        setResults(calculatedResults);

        // Call AI analysis
        const { data, error } = await supabase.functions.invoke('analyze-leadership', {
          body: {
            assessmentType: type,
            colorScores: calculatedResults.colorScores,
            primaryColor: calculatedResults.primaryColor,
            secondaryColor: calculatedResults.secondaryColor
          }
        });

        if (error) {
          console.error('AI Analysis error:', error);
          toast({
            title: "Analysis incomplete",
            description: "We calculated your scores but couldn't generate insights. Results are still valid.",
            variant: "default"
          });
        } else if (data) {
          setAnalysis(data);
        }
        
      } catch (error) {
        console.error('Error processing results:', error);
        toast({
          title: "Error",
          description: "Failed to process assessment results.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    processResults();
  }, [location.state, type, navigate, toast]);

  const getReportTitle = () => {
    switch (type) {
      case "50q-teacher":
        return "50-Question Teacher Assessment Report";
      case "50q-student":
        return "50-Question Student Assessment Report";
      case "25q-teacher":
        return "25-Question Teacher Assessment Report";
      case "25q-student":
        return "25-Question Student Assessment Report";
      default:
        return "Assessment Report";
    }
  };

  const getReportComponent = () => {
    if (!results) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-lg text-muted-foreground">Calculating your results...</p>
          </div>
        </div>
      );
    }

    switch (type) {
      case "50q-student":
        return <StudentReport50Q results={results} analysis={analysis} isLoading={isLoading} />;
      case "50q-teacher":
        return <TeacherReport results={results} analysis={analysis} isLoading={isLoading} is50Q={true} />;
      case "25q-student":
        return <StudentReport25Q results={results} analysis={analysis} isLoading={isLoading} />;
      case "25q-teacher":
        return <TeacherReport results={results} analysis={analysis} isLoading={isLoading} is50Q={false} />;
      default:
        return <div>Invalid assessment type</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-6">
          <Button variant="ghost" onClick={() => navigate("/leadership-assessment")} className="gap-2">
            <Home className="h-4 w-4" />
            Back to Assessments
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text-primary">{getReportTitle()}</span>
          </h1>
          <p className="text-lg text-muted-foreground">Your personalized leadership color profile</p>
        </div>

        {getReportComponent()}
      </div>
    </div>
  );
};

export default LeadershipResults;
