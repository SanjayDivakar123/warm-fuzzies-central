import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Download, Share2, BookOpen, Target, Lightbulb, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { exportToPDF } from "@/lib/pdfExport";
import { useToast } from "@/hooks/use-toast";
import AssessmentDetails from "@/components/AssessmentDetails";

const colorProfiles = {
  yellow: {
    name: "Fast Executor",
    icon: "⚡",
    tagline: "You're the doer who achieves results",
    description: "As a student, you excel at taking action quickly and getting things done. You're goal-oriented and thrive in fast-paced environments.",
    studentStrengths: [
      "Quick to start assignments and projects",
      "Natural at leading group activities",
      "Excellent at meeting deadlines",
      "Motivated by visible progress",
      "Strong at organizing team efforts",
      "Decisive under pressure",
      "Results-oriented mindset"
    ],
    studentGrowth: [
      "Practice patience with slower-paced teammates",
      "Allow more time for collaborative planning",
      "Balance speed with attention to detail",
      "Develop active listening skills in groups",
      "Consider multiple perspectives before deciding"
    ],
    careerPaths: [
      { title: "Project Manager", field: "Business", salary: "$75K-$120K" },
      { title: "Entrepreneur", field: "Startup", salary: "Variable" },
      { title: "Event Coordinator", field: "Hospitality", salary: "$45K-$70K" },
      { title: "Athletic Coach", field: "Sports", salary: "$40K-$90K" },
      { title: "Operations Manager", field: "Operations", salary: "$70K-$110K" }
    ],
    studyTips: [
      "Set clear, measurable study goals with deadlines",
      "Use Pomodoro technique (25-min sprints)",
      "Break large projects into actionable milestones",
      "Lead study groups to stay engaged",
      "Track progress visually with checklists"
    ],
    internshipTips: [
      "Seek fast-paced startup environments",
      "Look for project-based roles with clear deliverables",
      "Highlight your ability to drive results in interviews",
      "Take initiative on team projects"
    ]
  },
  red: {
    name: "Creative Motivator",
    icon: "🎨",
    tagline: "You're the motivator who uplifts others",
    description: "As a student, you bring energy and creativity to everything you do. You inspire your peers and excel in collaborative environments.",
    studentStrengths: [
      "Natural at motivating study groups",
      "Creative problem-solving approach",
      "Strong communication in presentations",
      "Enthusiastic about new ideas",
      "Builds positive team dynamics",
      "Inspiring storyteller",
      "Energizes collaborative work"
    ],
    studentGrowth: [
      "Develop structured planning habits",
      "Focus on following through on details",
      "Balance creativity with practicality",
      "Practice analytical thinking skills",
      "Build systematic approaches to tasks"
    ],
    careerPaths: [
      { title: "Marketing Manager", field: "Marketing", salary: "$65K-$115K" },
      { title: "Teacher/Professor", field: "Education", salary: "$50K-$90K" },
      { title: "Creative Director", field: "Design", salary: "$80K-$140K" },
      { title: "Social Media Manager", field: "Digital Media", salary: "$50K-$85K" },
      { title: "Brand Strategist", field: "Branding", salary: "$70K-$120K" }
    ],
    studyTips: [
      "Use colorful notes and visual aids",
      "Study with friends for motivation",
      "Connect concepts to real-world stories",
      "Present your learning to others",
      "Create mind maps and creative summaries"
    ],
    internshipTips: [
      "Target creative agencies and marketing firms",
      "Showcase your portfolio and creative work",
      "Network actively at campus events",
      "Emphasize your team motivation skills"
    ]
  },
  green: {
    name: "Logical Systems Thinker",
    icon: "🧠",
    tagline: "You're the thinker who solves problems",
    description: "As a student, you excel at analytical thinking and systematic problem-solving. You bring clarity and structure to complex challenges.",
    studentStrengths: [
      "Excellent analytical and critical thinking",
      "Strong research and data skills",
      "Methodical approach to assignments",
      "Detail-oriented and thorough",
      "Natural at organizing information",
      "Systematic problem-solver",
      "Deep focus and concentration"
    ],
    studentGrowth: [
      "Practice flexible thinking",
      "Develop presentation and speaking skills",
      "Balance analysis with action",
      "Strengthen creative expression",
      "Embrace ambiguity and experimentation"
    ],
    careerPaths: [
      { title: "Data Analyst", field: "Technology", salary: "$70K-$110K" },
      { title: "Research Scientist", field: "Science", salary: "$75K-$130K" },
      { title: "Financial Analyst", field: "Finance", salary: "$65K-$105K" },
      { title: "Software Engineer", field: "Tech", salary: "$90K-$150K" },
      { title: "Management Consultant", field: "Consulting", salary: "$85K-$145K" }
    ],
    studyTips: [
      "Create detailed outlines and frameworks",
      "Use logic diagrams and flowcharts",
      "Research thoroughly before starting",
      "Study in quiet, organized spaces",
      "Build comprehensive note systems"
    ],
    internshipTips: [
      "Target analytical roles in tech or finance",
      "Highlight your problem-solving abilities",
      "Showcase research projects and data work",
      "Prepare thoroughly for technical interviews"
    ]
  },
  blue: {
    name: "Empathetic Connector",
    icon: "💙",
    tagline: "You're the creator who innovates",
    description: "As a student, you bring fresh perspectives and creative solutions. You excel at thinking outside the box and envisioning new possibilities.",
    studentStrengths: [
      "Innovative thinking and creativity",
      "Strong empathy and emotional intelligence",
      "Excellent at building relationships",
      "Natural at finding new approaches",
      "Supportive team collaborator",
      "Visionary perspective",
      "Adaptable and open-minded"
    ],
    studentGrowth: [
      "Develop assertiveness in leadership",
      "Practice setting clear goals",
      "Build confidence in decision-making",
      "Focus on completing projects",
      "Strengthen execution and follow-through"
    ],
    careerPaths: [
      { title: "UX Designer", field: "Design", salary: "$75K-$125K" },
      { title: "Counselor", field: "Psychology", salary: "$45K-$75K" },
      { title: "Innovation Consultant", field: "Consulting", salary: "$80K-$135K" },
      { title: "Product Designer", field: "Technology", salary: "$85K-$140K" },
      { title: "Human Resources Manager", field: "HR", salary: "$70K-$115K" }
    ],
    studyTips: [
      "Explore creative study methods",
      "Connect with diverse study partners",
      "Allow time for reflection and ideas",
      "Use mind maps and visual thinking",
      "Integrate personal meaning into learning"
    ],
    internshipTips: [
      "Seek human-centered design roles",
      "Emphasize your collaborative strengths",
      "Build a diverse network",
      "Look for innovative, purpose-driven companies"
    ]
  }
};

const StudentResults50 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const storedResults = localStorage.getItem('student50AssessmentResults');
    if (!storedResults) {
      navigate('/pricing');
      return;
    }
    setResults(JSON.parse(storedResults));
  }, [navigate]);

  if (!results) return null;

  const profile = colorProfiles[results.dominantColor as keyof typeof colorProfiles];
  const secondaryProfile = results.secondaryColor ? 
    colorProfiles[results.secondaryColor as keyof typeof colorProfiles] : null;

  const handleDownloadPDF = async () => {
    try {
      await exportToPDF({
        type: 'Student Pro Leadership Assessment',
        color: profile.name,
        results: results,
        score: Math.round((results.scores[results.dominantColor] / results.totalQuestions) * 100),
        isStudent: true,
        isPro: true
      }, 'student-pro-leadership-assessment.pdf');
      
      toast({
        title: "PDF Downloaded",
        description: "Your comprehensive student pro report has been downloaded!",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    toast({
      title: "Share Feature",
      description: "Share functionality coming soon!",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Results Section */}
      <div className="relative overflow-hidden bg-gradient-hero py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/80"></div>
        
        <div className="relative container-wide">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-3 glass-card px-6 py-3 rounded-full border border-primary/30">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-primary tracking-wide">Your Comprehensive Student Leadership Profile</span>
            </div>
            
            <div className="text-6xl mb-4">{profile.icon}</div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight">
              You're a
              <br />
              <span className="gradient-text-primary">{profile.name}</span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {profile.tagline}
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <Button onClick={handleDownloadPDF} size="lg" className="gap-2">
                <Download className="w-5 h-5" />
                Download 3-Page Report
              </Button>
              <Button onClick={handleShare} variant="outline" size="lg" className="gap-2">
                <Share2 className="w-5 h-5" />
                Share Results
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-soft py-16">
        <div className="container-wide space-y-12">
          
          {/* Overview Card */}
          <Card className="glass-card-strong rounded-3xl shadow-xl border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl">Your Comprehensive Leadership Profile</CardTitle>
              <CardDescription className="text-lg">{profile.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* Color Breakdown */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Your Color Profile
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-primary/10 rounded-2xl border-2 border-primary/30">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Primary Color</p>
                    <p className="text-2xl font-bold text-primary">{profile.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {results.scores[results.dominantColor]} out of {results.totalQuestions} answers
                    </p>
                    <div className="mt-3">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${(results.scores[results.dominantColor] / results.totalQuestions) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {secondaryProfile && (
                    <div className="p-6 bg-accent/50 rounded-2xl border-2 border-border">
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Secondary Color</p>
                      <p className="text-2xl font-bold">{secondaryProfile.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {results.scores[results.secondaryColor]} out of {results.totalQuestions} answers
                      </p>
                      <div className="mt-3">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-secondary rounded-full" 
                            style={{ width: `${(results.scores[results.secondaryColor] / results.totalQuestions) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* All Color Scores */}
              <div>
                <h3 className="text-xl font-bold mb-4">Complete Color Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(results.scores).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([color, count]) => {
                    const colorProfile = colorProfiles[color as keyof typeof colorProfiles];
                    return (
                      <div key={color} className="p-4 bg-accent/30 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{colorProfile.icon}</span>
                            <span className="font-semibold">{colorProfile.name}</span>
                          </div>
                          <Badge variant="outline">{count} / {results.totalQuestions}</Badge>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-primary rounded-full transition-all" 
                            style={{ width: `${((count as number) / results.totalQuestions) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Student Strengths */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow" />
                  Your Student Strengths
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {profile.studentStrengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-accent/30 rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary text-sm font-bold">✓</span>
                      </div>
                      <span className="text-sm leading-relaxed">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Areas */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue" />
                  Areas for Growth
                </h3>
                <div className="space-y-3">
                  {profile.studentGrowth.map((area, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue text-sm">→</span>
                      </div>
                      <span className="text-sm leading-relaxed">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Career Paths for Students */}
          <Card className="glass-card rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-primary" />
                Potential Career Paths
              </CardTitle>
              <CardDescription>Based on your leadership style, these careers might align with your strengths (with typical salary ranges)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {profile.careerPaths.map((career, index) => (
                  <div key={index} className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-border hover-lift">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-lg">{career.title}</h4>
                        <Badge variant="secondary" className="mt-2">{career.field}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      <strong>Typical Salary:</strong> {career.salary}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Study Tips */}
          <Card className="glass-card rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl">Personalized Study Strategies</CardTitle>
              <CardDescription>Study techniques optimized for your learning and leadership style</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {profile.studyTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-5 bg-accent/30 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white font-bold">
                      {index + 1}
                    </div>
                    <span className="leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Internship & Interview Tips */}
          <Card className="glass-card rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl">Internship & Interview Strategy</CardTitle>
              <CardDescription>How to leverage your leadership style in the job market</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.internshipTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-5 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-border">
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 text-white font-bold">
                      {index + 1}
                    </div>
                    <span className="leading-relaxed text-lg">{tip}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assessment Details */}
          <AssessmentDetails 
            answers={results.answers}
            results={results}
            type="student-pro"
          />

          {/* Next Steps CTA */}
          <Card className="glass-card-strong rounded-3xl shadow-xl border-2 border-primary/20 text-center">
            <CardContent className="pt-12 pb-12">
              <h3 className="text-3xl font-bold mb-4">Your Leadership Journey Starts Here</h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg">
                Use these insights to guide your academic choices, career planning, and personal development.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" onClick={handleDownloadPDF}>
                  <Download className="w-5 h-5 mr-2" />
                  Download Full Report
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default StudentResults50;
