import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompanyPortal } from "@/contexts/CompanyPortalContext";
import { Share2, Download, Building2, CheckCircle, Loader2 } from "lucide-react";

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
  companyName?: string;
}

const colorDescriptions = {
  yellow: {
    title: "Action-Oriented Leader",
    description: "You are driven, decisive, and results-focused. You excel at executing plans and getting things done quickly.",
    strengths: ["Quick decision-making", "Goal-oriented", "Efficient execution", "Takes initiative"],
    color: "#EAB308"
  },
  red: {
    title: "Inspirational Leader",
    description: "You are passionate, enthusiastic, and people-focused. You excel at motivating teams and creating energy.",
    strengths: ["Strong communication", "Motivates others", "Builds connections", "Creates vision"],
    color: "#EF4444"
  },
  green: {
    title: "Analytical Leader",
    description: "You are logical, organized, and detail-oriented. You excel at creating structure and solving complex problems.",
    strengths: ["Systematic thinking", "Process optimization", "Data-driven", "Quality focused"],
    color: "#22C55E"
  },
  blue: {
    title: "Innovative Leader",
    description: "You are creative, visionary, and future-focused. You excel at generating new ideas and reimagining possibilities.",
    strengths: ["Creative problem-solving", "Strategic thinking", "Innovation driven", "Adaptable"],
    color: "#3B82F6"
  },
};

export default function CompanyResults() {
  const { company, loading } = useCompanyPortal();
  const navigate = useNavigate();
  const [results, setResults] = useState<Results | null>(null);

  useEffect(() => {
    if (company) {
      const storedResults = localStorage.getItem(`companyAssessmentResults_${company.subdomain}`);
      if (storedResults) {
        setResults(JSON.parse(storedResults));
      }
    }
  }, [company]);

  if (loading || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <h1 className="text-2xl font-bold mb-2">No Results Found</h1>
            <p className="text-muted-foreground mb-6">
              Please complete the assessment first.
            </p>
            <Button onClick={() => navigate(`/company/${company.subdomain}/assessment`)}>
              Take Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryColor = company.primary_color || '#9b87f5';
  const dominantColorInfo = colorDescriptions[results.dominantColor as keyof typeof colorDescriptions];
  const sortedScores = Object.entries(results.scores)
    .sort(([, a], [, b]) => b - a)
    .map(([color, score]) => ({ 
      color, 
      score, 
      percentage: (score / results.totalQuestions) * 100,
      colorHex: colorDescriptions[color as keyof typeof colorDescriptions].color
    }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-4 px-4 border-b" style={{ borderColor: `${primaryColor}20` }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-8 w-auto" />
          ) : (
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
              <Building2 className="h-4 w-4 text-white" />
            </div>
          )}
          <span className="font-semibold">{company.name}</span>
        </div>
      </header>

      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-10">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <CheckCircle className="h-8 w-8" style={{ color: primaryColor }} />
            </div>
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">
              Assessment Complete
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Your Leadership Profile
            </h1>
            <p className="text-muted-foreground">
              Based on {results.totalQuestions} questions
            </p>
          </div>

          {/* Dominant Color Card */}
          <Card className="rounded-2xl shadow-xl border-2 mb-6" style={{ borderColor: `${dominantColorInfo.color}40` }}>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Badge style={{ backgroundColor: dominantColorInfo.color }} className="text-white text-sm px-4 py-1">
                  Your Dominant Color
                </Badge>
                <div 
                  className="w-14 h-14 rounded-xl shadow-lg"
                  style={{ backgroundColor: dominantColorInfo.color }}
                />
              </div>
              <CardTitle className="text-2xl mb-2">{dominantColorInfo.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                {dominantColorInfo.description}
              </p>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Your Key Strengths:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dominantColorInfo.strengths.map((strength, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 p-3 rounded-lg"
                      style={{ backgroundColor: `${dominantColorInfo.color}10` }}
                    >
                      <span style={{ color: dominantColorInfo.color }}>✓</span>
                      <span className="text-sm">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Breakdown */}
          <Card className="rounded-2xl shadow-lg border mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Your Complete Color Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedScores.map(({ color, score, percentage, colorHex }) => (
                  <div key={color}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-6 h-6 rounded-md"
                          style={{ backgroundColor: colorHex }}
                        />
                        <span className="font-medium capitalize">{color}</span>
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {score} / {results.totalQuestions} ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${percentage}%`, backgroundColor: colorHex }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Confirmation */}
          <div className="bg-accent/50 rounded-xl p-4 mb-8 text-center">
            <p className="text-sm text-muted-foreground">
              ✓ Your results have been saved and shared with your company administrator.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.print()}
              className="flex items-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <Download className="w-5 h-5" />
              Download Report
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate(`/company/${company.subdomain}`)}
            >
              Back to Portal
            </Button>
          </div>
        </div>
      </div>

      <footer className="py-8 px-4 text-center text-muted-foreground text-sm">
        <p>Powered by RoleColorFinder</p>
      </footer>
    </div>
  );
}
