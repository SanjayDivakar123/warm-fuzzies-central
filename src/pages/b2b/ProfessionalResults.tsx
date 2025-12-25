import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navigation/Navbar";
import { Share2, FileText } from "lucide-react";
import { exportProfessional50QPDF } from "@/lib/professional50QPdfExport";

interface Results {
  dominantColor: string;
  scores: {
    yellow: number;
    red: number;
    green: number;
    blue: number;
  };
  totalQuestions: number;
  assessmentType: string;
}

const colorDescriptions = {
  yellow: {
    title: "Action-Oriented Leader",
    description: "You are driven, decisive, and results-focused. You excel at executing plans and getting things done quickly.",
    strengths: ["Quick decision-making", "Goal-oriented", "Efficient execution", "Takes initiative"],
  },
  red: {
    title: "Inspirational Leader",
    description: "You are passionate, enthusiastic, and people-focused. You excel at motivating teams and creating energy.",
    strengths: ["Strong communication", "Motivates others", "Builds connections", "Creates vision"],
  },
  green: {
    title: "Analytical Leader",
    description: "You are logical, organized, and detail-oriented. You excel at creating structure and solving complex problems.",
    strengths: ["Systematic thinking", "Process optimization", "Data-driven", "Quality focused"],
  },
  blue: {
    title: "Innovative Leader",
    description: "You are creative, visionary, and future-focused. You excel at generating new ideas and reimagining possibilities.",
    strengths: ["Creative problem-solving", "Strategic thinking", "Innovation driven", "Adaptable"],
  },
};

const ProfessionalResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<Results | null>(null);

  useEffect(() => {
    const storedResults = localStorage.getItem('professionalAssessmentResults');
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    } else {
      navigate('/b2b/company-portal');
    }
  }, [navigate]);

  if (!results) {
    return null;
  }

  const dominantColorInfo = colorDescriptions[results.dominantColor as keyof typeof colorDescriptions];
  const sortedScores = Object.entries(results.scores)
    .sort(([, a], [, b]) => b - a)
    .map(([color, score]) => ({ color, score, percentage: (score / results.totalQuestions) * 100 }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="bg-gradient-soft py-16">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-12 animate-fade-in">
              <Badge variant="secondary" className="mb-4 text-lg px-6 py-2">
                Assessment Complete
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Your Professional Leadership Profile
              </h1>
              <p className="text-xl text-muted-foreground">
                Based on {results.totalQuestions} questions
              </p>
            </div>

            {/* Dominant Color Card */}
            <Card className="glass-card-strong rounded-3xl shadow-xl border-2 border-primary/20 mb-8 animate-scale-in">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="default" className="text-lg px-6 py-2">
                    Your Dominant Color
                  </Badge>
                  <div className={`w-16 h-16 bg-${results.dominantColor} rounded-2xl shadow-${results.dominantColor}`}></div>
                </div>
                <CardTitle className="text-3xl mb-2">{dominantColorInfo.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-muted-foreground mb-6">
                  {dominantColorInfo.description}
                </p>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">Your Key Strengths:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dominantColorInfo.strengths.map((strength, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-accent/50">
                        <span className="text-primary">✓</span>
                        <span>{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Color Breakdown */}
            <Card className="glass-card-strong rounded-3xl shadow-xl border-2 border-primary/20 mb-8 animate-scale-in">
              <CardHeader>
                <CardTitle className="text-2xl">Your Complete Color Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedScores.map(({ color, score, percentage }) => (
                    <div key={color}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 bg-${color} rounded-lg`}></div>
                          <span className="font-semibold capitalize">{color}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {score} / {results.totalQuestions} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <div className="h-3 bg-muted/40 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-${color} rounded-full transition-all duration-700`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Button 
                size="lg" 
                variant="default"
                onClick={() => {
                  exportProfessional50QPDF({
                    dominantColor: results.dominantColor,
                    scores: results.scores,
                    totalQuestions: results.totalQuestions,
                    participantName: localStorage.getItem('participantName') || undefined,
                    organization: localStorage.getItem('organizationName') || undefined,
                    assessmentDate: new Date().toLocaleDateString()
                  });
                }}
                className="flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Download Full Report (PDF)
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.print()}
                className="flex items-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Quick Print
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/b2b/company-portal')}
              >
                Back to Company Portal
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalResults;
