import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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
  Sparkles,
  Calendar
} from "lucide-react";

const colorData = {
  yellow: {
    title: "Action-Oriented Leader",
    subtitle: "The Executor",
    color: "#EAB308",
    funFacts: [
      "You make decisions 40% faster than average, trusting your gut instincts",
      "Action-oriented leaders are often the first to volunteer for challenging projects",
      "You thrive in fast-paced environments where quick thinking is valued",
      "Your energy is contagious - teams led by Executors report higher productivity",
      "Famous Executors include Elon Musk and Sheryl Sandberg"
    ]
  },
  red: {
    title: "Inspirational Leader",
    subtitle: "The Motivator",
    color: "#EF4444",
    funFacts: [
      "You naturally boost team morale by up to 35% just by being present",
      "Motivators are excellent storytellers who connect ideas to emotions",
      "Your enthusiasm helps others see possibilities they might have missed",
      "Teams led by Motivators report higher job satisfaction and engagement",
      "Famous Motivators include Oprah Winfrey and Tony Robbins"
    ]
  },
  green: {
    title: "Analytical Leader",
    subtitle: "The Organizer",
    color: "#22C55E",
    funFacts: [
      "You catch 60% more errors than average due to your attention to detail",
      "Organizers excel at creating systems that scale and improve over time",
      "Your structured approach reduces project risks significantly",
      "Teams appreciate your ability to bring clarity to complex situations",
      "Famous Organizers include Tim Cook and Mary Barra"
    ]
  },
  blue: {
    title: "Innovative Leader",
    subtitle: "The Creator",
    color: "#3B82F6",
    funFacts: [
      "You generate 3x more creative solutions than the average team member",
      "Creators often see connections others miss, leading to breakthrough ideas",
      "Your curiosity drives continuous improvement and innovation",
      "Teams led by Creators are more adaptable to change",
      "Famous Creators include Steve Jobs and Sara Blakely"
    ]
  },
};

export default function CompanyHome() {
  const { company, employee, assessmentResults, loading, setEmployee, fetchAssessmentResults } = useCompanyPortal();
  const navigate = useNavigate();

  // Fetch results when employee changes
  useEffect(() => {
    if (employee?.assessment_result_id && !assessmentResults) {
      fetchAssessmentResults();
    }
  }, [employee, assessmentResults, fetchAssessmentResults]);

  // Redirect if no employee
  useEffect(() => {
    if (!loading && company && !employee) {
      navigate(`/company/${company.subdomain}/login`);
    }
  }, [loading, company, employee, navigate]);

  const handleLogout = () => {
    if (company) {
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
  const secondaryColor = company.secondary_color || '#7E69AB';

  // If no results, prompt to take assessment
  if (!assessmentResults) {
    return (
      <div 
        className="min-h-screen"
        style={{
          background: `linear-gradient(160deg, ${primaryColor}0a 0%, ${primaryColor}05 60%, ${secondaryColor}03 100%)`
        }}
      >
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

        <div className="py-16 px-4 relative z-10">
          <div className="max-w-xl mx-auto text-center">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 relative"
              style={{ background: `linear-gradient(135deg, ${primaryColor}25, ${secondaryColor}20)` }}
            >
              <User className="h-10 w-10" style={{ color: primaryColor }} />
              {/* Small accent dot */}
              <div 
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full"
                style={{ backgroundColor: secondaryColor }}
              />
            </div>
            <h1 className="text-3xl font-bold mb-4">Welcome!</h1>
            <p className="text-muted-foreground mb-8">
              You haven't completed your leadership assessment yet. Take the assessment to discover your leadership style.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate(`/company/${company.subdomain}/assessment`)}
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              className="shadow-lg"
            >
              Start Assessment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const leaderData = colorData[assessmentResults.dominantColor as keyof typeof colorData];
  const completedDate = assessmentResults.completedAt 
    ? new Date(assessmentResults.completedAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : employee?.assessment_completed_at 
      ? new Date(employee.assessment_completed_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'Recently';

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(160deg, ${primaryColor}0a 0%, ${primaryColor}05 60%, ${secondaryColor}03 100%)`
      }}
    >
      {/* Header */}
      <header className="py-4 px-4 border-b" style={{ borderColor: `${primaryColor}20` }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-8 w-auto" />
            ) : (
              <div 
                className="h-8 w-8 rounded-lg flex items-center justify-center" 
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <Building2 className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="font-semibold">{company.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {employee && (
              <span className="text-sm hidden sm:block" style={{ color: secondaryColor }}>
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

      {/* Hero Section with Large Color Circle */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Floating Orb Container */}
          <div className="relative mb-8">
            {/* Shadow element that animates separately */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 bottom-0 w-40 sm:w-52 h-6 rounded-full blur-xl animate-float-shadow"
              style={{ backgroundColor: leaderData.color }}
            />
            
            {/* Large Color Circle with Float Animation */}
            <div 
              className="w-48 h-48 sm:w-64 sm:h-64 rounded-full mx-auto flex flex-col items-center justify-center shadow-2xl relative overflow-hidden animate-float"
              style={{ 
                backgroundColor: leaderData.color,
                boxShadow: `0 25px 50px -12px ${leaderData.color}60`
              }}
            >
              {/* Subtle inner glow */}
              <div 
                className="absolute inset-4 rounded-full opacity-30"
                style={{ 
                  background: `radial-gradient(circle, white 0%, transparent 70%)`
                }}
              />
              {/* Shimmer effect */}
              <div 
                className="absolute inset-0 rounded-full opacity-20"
                style={{ 
                  background: `linear-gradient(135deg, transparent 30%, white 50%, transparent 70%)`
                }}
              />
              <div className="relative z-10 text-white text-center px-4">
                <p className="text-sm sm:text-base font-medium opacity-90 mb-1">You are</p>
                <h2 className="text-xl sm:text-2xl font-bold leading-tight">{leaderData.subtitle}</h2>
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {leaderData.title}
          </h1>
          <p className="text-muted-foreground mb-8">
            Discover what makes you a unique leader
          </p>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate(`/company/${company.subdomain}/results`)}
              variant="outline"
              className="gap-2"
            >
              <Eye className="w-5 h-5" />
              View Full Report
            </Button>
            <Button 
              size="lg"
              onClick={() => window.print()}
              className="gap-2"
              style={{ backgroundColor: leaderData.color }}
            >
              <Download className="w-5 h-5" />
              Download Report
            </Button>
          </div>
        </div>
      </section>

      {/* Assessment History */}
      <section className="py-12 px-4" style={{ background: `linear-gradient(180deg, transparent, ${secondaryColor}08, transparent)` }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-muted-foreground" />
            <h2 className="text-2xl font-bold">Assessment History</h2>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: leaderData.color }}
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Leadership Assessment</h3>
                    <p className="text-sm text-muted-foreground">
                      {assessmentResults.totalQuestions} questions • Completed {completedDate}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    className="text-white"
                    style={{ backgroundColor: leaderData.color }}
                  >
                    {leaderData.subtitle}
                  </Badge>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="mt-6 pt-6 border-t grid grid-cols-4 gap-4">
                {Object.entries(assessmentResults.scores).map(([color, score]) => {
                  const data = colorData[color as keyof typeof colorData];
                  const percentage = Math.round((score / assessmentResults.totalQuestions) * 100);
                  return (
                    <div key={color} className="text-center">
                      <div 
                        className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: data.color }}
                      >
                        {percentage}%
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{color}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Fun Facts Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Fun Facts About {leaderData.subtitle}s</h2>

          <div className="grid gap-4">
            {leaderData.funFacts.map((fact, index) => (
              <Card 
                key={index} 
                className="shadow-sm hover:shadow-md transition-shadow border-l-4"
                style={{ borderLeftColor: leaderData.color }}
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                    style={{ backgroundColor: leaderData.color }}
                  >
                    {index + 1}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{fact}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Confirmation */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div 
          className="rounded-xl p-4 text-center border"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`,
            borderColor: `${secondaryColor}20`
          }}
        >
          <p className="text-sm text-muted-foreground">
            ✓ Your results have been saved and shared with your company administrator.
          </p>
        </div>
      </div>

      <footer className="py-8 px-4 text-center text-sm">
        <p className="text-muted-foreground">
          Powered by <span style={{ color: secondaryColor }}>RoleColorFinder</span>
        </p>
      </footer>
    </div>
  );
}
