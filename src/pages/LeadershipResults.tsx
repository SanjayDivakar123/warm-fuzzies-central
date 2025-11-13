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

const COLOR_INFO = {
  Yellow: { bg: "bg-yellow-500", name: "Yellow - The Doer" },
  Red: { bg: "bg-red-500", name: "Red - The Motivator" },
  Green: { bg: "bg-green-500", name: "Green - The Thinker" },
  Blue: { bg: "bg-blue-500", name: "Blue - The Creator" }
};

const ColorSpectrum = ({ position, colorScores }: { position: number; colorScores: Record<string, number> }) => {
  // Create gradient stops based on color scores
  const red = colorScores.Red || 0;
  const yellow = colorScores.Yellow || 0;
  const green = colorScores.Green || 0;
  const blue = colorScores.Blue || 0;
  
  // Normalize scores to create gradient
  const total = red + yellow + green + blue;
  const redPct = (red / total) * 100;
  const yellowPct = ((red + yellow) / total) * 100;
  const greenPct = ((red + yellow + green) / total) * 100;
  
  return (
    <div className="relative h-8 rounded-full overflow-hidden" style={{
      background: `linear-gradient(to right, 
        rgb(239, 68, 68) 0%, 
        rgb(239, 68, 68) ${redPct}%, 
        rgb(234, 179, 8) ${redPct}%, 
        rgb(234, 179, 8) ${yellowPct}%, 
        rgb(34, 197, 94) ${yellowPct}%, 
        rgb(34, 197, 94) ${greenPct}%, 
        rgb(59, 130, 246) ${greenPct}%, 
        rgb(59, 130, 246) 100%)`
    }}>
      <div className="absolute w-4 h-4 bg-white border-4 border-foreground rounded-full top-1/2 -translate-y-1/2 shadow-lg" style={{ left: `${position}%` }} />
    </div>
  );
};

const StudentReport50Q = ({ results, analysis, isLoading }: any) => (
  <div className="space-y-8">
    <Card>
      <CardHeader><CardTitle className="text-3xl">Your Leadership Summary</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Primary Color</h3>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${COLOR_INFO[results.primaryColor].bg} flex items-center justify-center`}>
                <span className="text-white font-semibold text-xs drop-shadow-lg">{results.colorScores[results.primaryColor]}</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{COLOR_INFO[results.primaryColor].name}</p>
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
          <ColorSpectrum position={results.spectrumPosition} colorScores={results.colorScores} />
        </div>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : analysis && (
          <>
            <div><h3 className="font-semibold mb-2">How You Show Up in Group Work</h3><p className="text-muted-foreground">{analysis.groupBehavior}</p></div>
            <div><p className="text-muted-foreground italic">{analysis.colorDescription}</p></div>
          </>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-2xl">Your Color Profile</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : analysis && (
          <>
            <div><h4 className="font-semibold mb-2">Strengths</h4>
              <ul className="space-y-2">{analysis.strengths?.map((s: string, i: number) => <li key={i} className="flex gap-2"><span className="text-primary">✓</span><span>{s}</span></li>)}</ul>
            </div>
            <div><h4 className="font-semibold mb-2">How You Communicate</h4><p className="text-muted-foreground">{analysis.communicationStyle}</p></div>
            <div><h4 className="font-semibold mb-2">How You Handle Pressure</h4><p className="text-muted-foreground">{analysis.pressureHandling}</p></div>
          </>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-2xl">Category Breakdown</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(results.categoryScores).map(([cat, score]: [string, any]) => (
          <div key={cat}>
            <div className="flex justify-between mb-2"><h4 className="font-semibold">{cat}</h4><span className="text-sm text-muted-foreground">{score}/100</span></div>
            <Progress value={score} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-2xl">Your Leadership Stage</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : analysis && (
          <><Badge className="text-lg py-2 px-4">{analysis.leadershipStage}</Badge><p className="text-muted-foreground">{analysis.stageDescription}</p></>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-2xl">Your Growth Plan</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : analysis?.growthPlan && (
          <ul className="space-y-3">{analysis.growthPlan.map((item: string, i: number) => <li key={i} className="flex gap-2"><span className="text-primary text-xl">•</span><span>{item}</span></li>)}</ul>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-2xl">Team Collaboration Map</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {analysis && <p className="text-muted-foreground">{analysis.teamFitInsight}</p>}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(results.colorScores).map(([color, score]: [string, any]) => (
            <div key={color} className="flex items-center gap-2 p-3 rounded-lg border">
              <div className={`w-8 h-8 rounded-full ${COLOR_INFO[color as keyof typeof COLOR_INFO].bg}`} />
              <div><p className="font-medium text-sm">{color}</p><p className="text-xs text-muted-foreground">{score}%</p></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const StudentReport25Q = ({ results, analysis, isLoading }: any) => (
  <div className="space-y-8">
    <Card>
      <CardHeader><CardTitle className="text-3xl">Your Leadership Color</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="text-center">
            <h3 className="font-semibold mb-4">Primary Color</h3>
            <div className="flex flex-col items-center gap-3">
              <div className={`w-20 h-20 rounded-full ${COLOR_INFO[results.primaryColor].bg} flex items-center justify-center`}>
                <span className="text-white font-bold text-sm drop-shadow-lg">{results.colorScores[results.primaryColor]}/100</span>
              </div>
              <p className="text-xl font-bold">{COLOR_INFO[results.primaryColor].name}</p>
            </div>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-4">Secondary Color</h3>
            <div className="flex flex-col items-center gap-3">
              <div className={`w-20 h-20 rounded-full ${COLOR_INFO[results.secondaryColor].bg}`} />
              <p className="text-xl font-bold">{COLOR_INFO[results.secondaryColor].name}</p>
            </div>
          </div>
        </div>
        <div><h3 className="font-semibold mb-3">Leadership Spectrum</h3><ColorSpectrum position={results.spectrumPosition} colorScores={results.colorScores} /></div>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : analysis && (
          <><Badge className="text-lg py-2 px-4">{analysis.leadershipStage}</Badge><p className="text-muted-foreground">{analysis.colorDescription}</p></>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-2xl">Strength Snapshot</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : analysis && (
          <div className="space-y-4">
            <div><h4 className="font-semibold mb-2 text-primary">Your Strengths</h4>
              <ul className="space-y-2">{analysis.strengths?.map((s: string, i: number) => <li key={i} className="flex gap-2"><span className="text-primary">✓</span><span>{s}</span></li>)}</ul>
            </div>
            <div><h4 className="font-semibold mb-2 text-amber-600">Growth Areas</h4>
              <ul className="space-y-2">{analysis.growthAreas?.map((a: string, i: number) => <li key={i} className="flex gap-2"><span className="text-amber-600">→</span><span>{a}</span></li>)}</ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-2xl">Your Group-Work Behavior</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : analysis && (
          <>
            <div><h4 className="font-semibold mb-2">How You Make Decisions</h4><p className="text-muted-foreground">{analysis.decisionMaking}</p></div>
            <div><h4 className="font-semibold mb-2">How You Help Your Team</h4><p className="text-muted-foreground">{analysis.teamHelp}</p></div>
            <div><h4 className="font-semibold mb-2">How You Handle Problems</h4><p className="text-muted-foreground">{analysis.problemHandling}</p></div>
          </>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-2xl">Mini Growth Plan</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : analysis?.growthPlan && (
          <ul className="space-y-3">{analysis.growthPlan.map((item: string, i: number) => <li key={i} className="flex gap-2"><span className="text-primary text-xl">•</span><span className="font-medium">{item}</span></li>)}</ul>
        )}
      </CardContent>
    </Card>
  </div>
);

const TeacherReport = ({ results, isLoading }: any) => (
  <div className="text-center p-8 text-muted-foreground">Teacher reports coming soon</div>
);

const LeadershipResults = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processResults = async () => {
      try {
        const { answers } = location.state || {};
        if (!answers || !type) {
          toast({ title: "No assessment data", description: "Please complete an assessment first.", variant: "destructive" });
          navigate("/leadership-assessment");
          return;
        }

        const totalQuestions = type?.includes('25q') ? 25 : 50;
        const questionColors: Record<number, Record<string, "Yellow" | "Red" | "Green" | "Blue">> = {};
        Object.keys(answers).forEach((qId) => {
          questionColors[parseInt(qId)] = { a: "Yellow", b: "Red", c: "Green", d: "Blue" };
        });

        const calculatedResults = calculateResults(answers, questionColors, totalQuestions);
        setResults(calculatedResults);

        const { data, error } = await supabase.functions.invoke('analyze-leadership', {
          body: { assessmentType: type, colorScores: calculatedResults.colorScores, primaryColor: calculatedResults.primaryColor, secondaryColor: calculatedResults.secondaryColor }
        });

        if (error) {
          console.error('AI error:', error);
          toast({ title: "Analysis incomplete", description: "Results calculated but couldn't generate insights.", variant: "default" });
        } else if (data) {
          setAnalysis(data);
        }
      } catch (error) {
        console.error('Error:', error);
        toast({ title: "Error", description: "Failed to process results.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    processResults();
  }, [location.state, type, navigate, toast]);

  const getTitle = () => {
    const titles = { "50q-teacher": "50-Question Teacher", "50q-student": "50-Question Student", "25q-teacher": "25-Question Teacher", "25q-student": "25-Question Student" };
    return titles[type as keyof typeof titles] || "Assessment";
  };

  if (!results) return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /><p className="ml-3">Calculating...</p></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-6">
          <Button variant="ghost" onClick={() => navigate("/leadership-assessment")} className="gap-2"><Home className="h-4 w-4" />Back to Assessments</Button>
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4"><span className="gradient-text-primary">{getTitle()} Report</span></h1>
          <p className="text-lg text-muted-foreground">Your personalized leadership color profile</p>
        </div>
        {type === "50q-student" && <StudentReport50Q results={results} analysis={analysis} isLoading={isLoading} />}
        {type === "25q-student" && <StudentReport25Q results={results} analysis={analysis} isLoading={isLoading} />}
        {(type === "50q-teacher" || type === "25q-teacher") && <TeacherReport results={results} isLoading={isLoading} />}
      </div>
    </div>
  );
};

export default LeadershipResults;
