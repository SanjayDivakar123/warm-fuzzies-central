import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompanyPortal } from "@/contexts/CompanyPortalContext";
import { 
  Building2, 
  LogOut, 
  Download, 
  Eye,
  Loader2,
  User,
  CheckCircle
} from "lucide-react";

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

export default function CompanyHome() {
  const { company, employee, loading, setEmployee } = useCompanyPortal();
  const navigate = useNavigate();
  const [results, setResults] = useState<Results | null>(null);

  // Load employee and results from localStorage
  useEffect(() => {
    if (company) {
      // Load employee if not in context
      if (!employee) {
        const savedEmployee = localStorage.getItem(`employee_${company.subdomain}`);
        if (savedEmployee) {
          setEmployee(JSON.parse(savedEmployee));
        } else {
          // No employee logged in, redirect to login
          navigate(`/company/${company.subdomain}/login`);
          return;
        }
      }

      // Load results
      const storedResults = localStorage.getItem(`companyAssessmentResults_${company.subdomain}`);
      if (storedResults) {
        setResults(JSON.parse(storedResults));
      }
    }
  }, [company, employee, setEmployee, navigate]);

  const handleLogout = () => {
    if (company) {
      localStorage.removeItem(`employee_${company.subdomain}`);
      localStorage.removeItem(`companyAssessmentResults_${company.subdomain}`);
      localStorage.removeItem(`assessment_progress_${company.subdomain}`);
      setEmployee(null);
      navigate(`/company/${company.subdomain}`);
    }
  };

  if (loading || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const primaryColor = company.primary_color || '#9b87f5';

  // If no results, prompt to take assessment
  if (!results) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="py-4 px-4 border-b" style={{ borderColor: `${primaryColor}20` }}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-8 w-auto" />
              ) : (
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                  <Building2 className="h-4 w-4 text-white" />
                </div>
              )}
              <span className="font-semibold">{company.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <div className="py-16 px-4">
          <div className="max-w-xl mx-auto text-center">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <User className="h-10 w-10" style={{ color: primaryColor }} />
            </div>
            <h1 className="text-3xl font-bold mb-4">Welcome!</h1>
            <p className="text-muted-foreground mb-8">
              You haven't completed your leadership assessment yet. Take the assessment to discover your leadership style.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate(`/company/${company.subdomain}/assessment`)}
              style={{ backgroundColor: primaryColor }}
            >
              Start Assessment
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-8 w-auto" />
            ) : (
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                <Building2 className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="font-semibold">{company.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {employee && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {employee.email}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
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

          {/* Dominant Color Summary Card */}
          <Card 
            className="rounded-2xl shadow-xl border-2 mb-8" 
            style={{ borderColor: `${dominantColorInfo.color}40` }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Badge 
                  style={{ backgroundColor: dominantColorInfo.color }} 
                  className="text-white text-sm px-4 py-1"
                >
                  Your Dominant Color
                </Badge>
                <div 
                  className="w-14 h-14 rounded-xl shadow-lg"
                  style={{ backgroundColor: dominantColorInfo.color }}
                />
              </div>
              <CardTitle className="text-2xl mt-4">{dominantColorInfo.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                {dominantColorInfo.description}
              </p>
              
              {/* Key Strengths */}
              <div className="mb-6">
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
              onClick={() => navigate(`/company/${company.subdomain}/results`)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Eye className="w-5 h-5" />
              View Full Report
            </Button>
            <Button 
              size="lg" 
              onClick={() => window.print()}
              className="flex items-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <Download className="w-5 h-5" />
              Download Report
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
