import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompanyPortal } from "@/contexts/CompanyPortalContext";
import { Download, Building2, CheckCircle, Loader2, AlertTriangle, Target, Lightbulb, Users } from "lucide-react";

const colorDescriptions = {
  yellow: {
    title: "Action-Oriented Leader",
    subtitle: "The Executor",
    description: "You are driven, decisive, and results-focused. You excel at executing plans and getting things done quickly.",
    workDescription: "As an Action-Oriented Leader, your approach to work is characterized by a relentless drive toward results. You naturally take charge of situations, cutting through complexity to focus on what truly matters. In meetings, you're often the one pushing for decisions and next steps rather than endless discussion. Your colleagues rely on you to turn ideas into action, and you thrive when given challenging goals with clear metrics for success. Your pragmatic mindset helps teams avoid getting stuck in analysis paralysis, making you invaluable during crunch times and high-stakes projects.",
    situations: [
      { title: "Crisis Management", description: "When deadlines are tight or problems arise, you step up to take decisive action and rally the team." },
      { title: "Project Kickoffs", description: "You quickly establish clear goals, timelines, and accountability to get momentum going fast." },
      { title: "Cutting Through Red Tape", description: "You identify unnecessary obstacles and find efficient paths to achieve objectives." },
      { title: "Performance Reviews", description: "You focus on measurable outcomes and give direct, actionable feedback to help others improve." }
    ],
    weaknesses: [
      { title: "Impatience with Process", description: "You may skip important steps or overlook details when rushing toward results." },
      { title: "Overwhelming Others", description: "Your fast pace can leave teammates feeling pressured or unable to keep up." },
      { title: "Dismissing Input", description: "In your drive for efficiency, you might not fully consider others' perspectives or ideas." },
      { title: "Burnout Risk", description: "Your constant push for achievement can lead to exhaustion for yourself and your team." }
    ],
    color: "#EAB308"
  },
  red: {
    title: "Inspirational Leader",
    subtitle: "The Motivator",
    description: "You are passionate, enthusiastic, and people-focused. You excel at motivating teams and creating energy.",
    workDescription: "As an Inspirational Leader, you bring energy and enthusiasm to everything you do. Your natural charisma draws people in, making you the heart of any team. You excel at painting compelling visions that get others excited about possibilities. In the workplace, you're often the one lifting spirits during tough times and celebrating wins with genuine joy. Your ability to connect emotionally with colleagues creates strong bonds and loyalty. You understand that people perform best when they feel valued and inspired, and you naturally create environments where creativity and passion can flourish.",
    situations: [
      { title: "Team Building", description: "You create inclusive, energetic environments where everyone feels valued and motivated to contribute." },
      { title: "Change Management", description: "You help others see the positive possibilities in change and get excited about new directions." },
      { title: "Client Presentations", description: "Your enthusiasm and storytelling ability captivate audiences and build strong relationships." },
      { title: "Conflict Resolution", description: "You use empathy and positivity to find common ground and restore team harmony." }
    ],
    weaknesses: [
      { title: "Avoiding Difficult Conversations", description: "Your desire to maintain positivity may cause you to delay addressing problems." },
      { title: "Over-Promising", description: "Your enthusiasm can lead to commitments that are difficult to deliver on." },
      { title: "Lack of Follow-Through", description: "Excitement about new ideas may distract you from completing current projects." },
      { title: "Sensitivity to Criticism", description: "Negative feedback can affect you more deeply, impacting your confidence." }
    ],
    color: "#EF4444"
  },
  green: {
    title: "Analytical Leader",
    subtitle: "The Organizer",
    description: "You are logical, organized, and detail-oriented. You excel at creating structure and solving complex problems.",
    workDescription: "As an Analytical Leader, you bring order and precision to everything you touch. Your methodical approach ensures nothing falls through the cracks, and your colleagues trust you to catch errors others might miss. You excel at breaking down complex problems into manageable components and creating systems that improve efficiency. In the workplace, you're the one who documents processes, maintains quality standards, and ensures consistency. Your data-driven mindset means decisions are based on facts rather than assumptions, providing a solid foundation for long-term success and continuous improvement.",
    situations: [
      { title: "Strategic Planning", description: "You develop comprehensive plans with clear milestones, risk assessments, and contingencies." },
      { title: "Quality Assurance", description: "You establish standards and checkpoints that ensure consistent, high-quality deliverables." },
      { title: "Process Improvement", description: "You identify inefficiencies and design systematic solutions that scale effectively." },
      { title: "Data Analysis", description: "You transform raw data into actionable insights that drive informed decision-making." }
    ],
    weaknesses: [
      { title: "Analysis Paralysis", description: "Your need for complete information may delay decisions when speed is needed." },
      { title: "Resistance to Change", description: "You may struggle when established systems need to be disrupted for innovation." },
      { title: "Perfectionism", description: "High standards can lead to spending too much time on details that don't matter." },
      { title: "Difficulty with Ambiguity", description: "Undefined situations or lack of clear guidelines can cause stress and hesitation." }
    ],
    color: "#22C55E"
  },
  blue: {
    title: "Innovative Leader",
    subtitle: "The Creator",
    description: "You are creative, visionary, and future-focused. You excel at generating new ideas and reimagining possibilities.",
    workDescription: "As an Innovative Leader, you see possibilities where others see limitations. Your creative mind constantly generates new ideas and approaches, making you invaluable for solving complex challenges in unconventional ways. You're naturally curious, always exploring new concepts and technologies that could benefit your team. In the workplace, you're the one asking 'what if?' and challenging assumptions that others take for granted. Your ability to think outside the box and connect disparate ideas creates breakthrough solutions that drive organizational growth and competitive advantage.",
    situations: [
      { title: "Brainstorming Sessions", description: "You generate diverse ideas and help others think beyond conventional solutions." },
      { title: "Product Development", description: "You envision innovative features and experiences that differentiate offerings in the market." },
      { title: "Problem-Solving", description: "When traditional approaches fail, you find creative alternatives that others haven't considered." },
      { title: "Future Planning", description: "You anticipate trends and help organizations prepare for emerging opportunities." }
    ],
    weaknesses: [
      { title: "Difficulty with Routine", description: "Repetitive tasks or maintaining established processes can feel draining and boring." },
      { title: "Starting Without Finishing", description: "Excitement for new ideas may cause you to abandon projects before completion." },
      { title: "Overlooking Practicalities", description: "Creative solutions may not always account for budget, timeline, or resource constraints." },
      { title: "Frustration with Constraints", description: "Rules and limitations can feel stifling, leading to friction with more structured colleagues." }
    ],
    color: "#3B82F6"
  },
};

export default function CompanyResults() {
  const { company, employee, assessmentResults, loading, fetchAssessmentResults } = useCompanyPortal();
  const navigate = useNavigate();

  // Fetch results when component mounts
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

  if (loading || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!assessmentResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h1 className="text-xl font-bold mb-2">Loading Results...</h1>
            <p className="text-muted-foreground">
              Please wait while we fetch your assessment results.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryColor = company.primary_color || '#9b87f5';
  const dominantColorInfo = colorDescriptions[assessmentResults.dominantColor as keyof typeof colorDescriptions];
  
  // Sort scores with dominant color always first
  const sortedScores = Object.entries(assessmentResults.scores)
    .sort(([colorA], [colorB]) => {
      if (colorA === assessmentResults.dominantColor) return -1;
      if (colorB === assessmentResults.dominantColor) return 1;
      return assessmentResults.scores[colorB as keyof typeof assessmentResults.scores] - 
             assessmentResults.scores[colorA as keyof typeof assessmentResults.scores];
    })
    .map(([color, score]) => ({ 
      color, 
      score, 
      percentage: (score / assessmentResults.totalQuestions) * 100,
      colorHex: colorDescriptions[color as keyof typeof colorDescriptions].color
    }));

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: `${primaryColor}15` }}
    >
      {/* Header */}
      <header className="py-4 px-4 border-b bg-background/80 backdrop-blur-sm" style={{ borderColor: `${primaryColor}20` }}>
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
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: dominantColorInfo.color }}
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">
              Assessment Complete
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              You are: {dominantColorInfo.title}
            </h1>
            <p className="text-xl text-muted-foreground">
              {dominantColorInfo.subtitle}
            </p>
          </div>

          {/* Leadership Style Description */}
          <Card className="rounded-2xl shadow-xl border-2 mb-6" style={{ borderColor: `${dominantColorInfo.color}40` }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: dominantColorInfo.color }}
                >
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl">Your Leadership Style</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed text-base">
                {dominantColorInfo.workDescription}
              </p>
            </CardContent>
          </Card>

          {/* How You Approach Situations */}
          <Card className="rounded-2xl shadow-lg border mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: dominantColorInfo.color }}
                >
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">How You Approach Situations</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    As a {dominantColorInfo.subtitle}, here's how you naturally handle key scenarios
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dominantColorInfo.situations.map((situation, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-xl border-l-4"
                    style={{ 
                      borderLeftColor: dominantColorInfo.color,
                      backgroundColor: `${dominantColorInfo.color}08`
                    }}
                  >
                    <h4 className="font-semibold mb-2">{situation.title}</h4>
                    <p className="text-sm text-muted-foreground">{situation.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Profile */}
          <Card className="rounded-2xl shadow-lg border mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Users className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl">Your Complete Color Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedScores.map(({ color, score, percentage, colorHex }, index) => (
                  <div key={color}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: colorHex }}
                        >
                          {index === 0 && (
                            <span className="text-white text-xs font-bold">★</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium capitalize">{color}</span>
                          {index === 0 && (
                            <Badge className="ml-2 text-xs" style={{ backgroundColor: colorHex }}>
                              Dominant
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-muted-foreground text-sm font-medium">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                    <div className="h-3 bg-muted/40 rounded-full overflow-hidden">
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

          {/* Potential Weak Spots */}
          <Card className="rounded-2xl shadow-lg border mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500"
                >
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Areas to Watch</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Every leadership style has potential blind spots to be aware of
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dominantColorInfo.weaknesses.map((weakness, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                  >
                    <h4 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">
                      {weakness.title}
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {weakness.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Confirmation */}
          <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 mb-8 text-center border">
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
              style={{ backgroundColor: dominantColorInfo.color }}
            >
              <Download className="w-5 h-5" />
              Download Report
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-background"
              onClick={() => navigate(`/company/${company.subdomain}/home`)}
            >
              Go to Dashboard
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
