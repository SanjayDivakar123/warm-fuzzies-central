import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Download, Share2, BookOpen, Target, Lightbulb } from "lucide-react";
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
      "Strong at organizing team efforts"
    ],
    studentGrowth: [
      "Practice patience with slower-paced teammates",
      "Allow more time for collaborative planning",
      "Balance speed with attention to detail",
      "Develop active listening skills in groups"
    ],
    careerPaths: [
      { title: "Project Manager", field: "Business" },
      { title: "Entrepreneur", field: "Startup" },
      { title: "Event Coordinator", field: "Hospitality" },
      { title: "Athletic Coach", field: "Sports" }
    ],
    studyTips: [
      "Set clear, measurable study goals",
      "Use timers to create productive sprints",
      "Break large projects into action steps",
      "Lead study groups to stay engaged"
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
      "Builds positive team dynamics"
    ],
    studentGrowth: [
      "Develop structured planning habits",
      "Focus on following through on details",
      "Balance creativity with practicality",
      "Practice analytical thinking skills"
    ],
    careerPaths: [
      { title: "Marketing Manager", field: "Marketing" },
      { title: "Teacher/Professor", field: "Education" },
      { title: "Creative Director", field: "Design" },
      { title: "Social Media Manager", field: "Digital Media" }
    ],
    studyTips: [
      "Use colorful notes and visual aids",
      "Study with friends for motivation",
      "Connect concepts to real-world stories",
      "Present your learning to others"
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
      "Natural at organizing information"
    ],
    studentGrowth: [
      "Practice flexible thinking",
      "Develop presentation and speaking skills",
      "Balance analysis with action",
      "Strengthen creative expression"
    ],
    careerPaths: [
      { title: "Data Analyst", field: "Technology" },
      { title: "Research Scientist", field: "Science" },
      { title: "Financial Analyst", field: "Finance" },
      { title: "Software Engineer", field: "Tech" }
    ],
    studyTips: [
      "Create detailed outlines and frameworks",
      "Use logic diagrams and flowcharts",
      "Research thoroughly before starting",
      "Study in quiet, organized spaces"
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
      "Supportive team collaborator"
    ],
    studentGrowth: [
      "Develop assertiveness in leadership",
      "Practice setting clear goals",
      "Build confidence in decision-making",
      "Focus on completing projects"
    ],
    careerPaths: [
      { title: "UX Designer", field: "Design" },
      { title: "Counselor", field: "Psychology" },
      { title: "Innovation Consultant", field: "Consulting" },
      { title: "Product Designer", field: "Technology" }
    ],
    studyTips: [
      "Explore creative study methods",
      "Connect with diverse study partners",
      "Allow time for reflection and ideas",
      "Use mind maps and visual thinking"
    ]
  }
};

const StudentResults = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const storedResults = localStorage.getItem('studentAssessmentResults');
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
        type: 'Student Leadership Assessment',
        color: profile.name,
        results: results,
        score: Math.round((results.scores[results.dominantColor] / results.totalQuestions) * 100),
        isStudent: true
      }, 'student-leadership-assessment.pdf');
      
      toast({
        title: "PDF Downloaded",
        description: "Your student assessment report has been downloaded successfully!",
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
              <span className="text-sm font-bold text-primary tracking-wide">Your Student Leadership Profile</span>
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
                Download Student Report
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
              <CardTitle className="text-3xl">Your Leadership Style</CardTitle>
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
                  </div>
                  {secondaryProfile && (
                    <div className="p-6 bg-accent/50 rounded-2xl border-2 border-border">
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Secondary Color</p>
                      <p className="text-2xl font-bold">{secondaryProfile.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {results.scores[results.secondaryColor]} out of {results.totalQuestions} answers
                      </p>
                    </div>
                  )}
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
              <CardTitle className="text-3xl">Potential Career Paths</CardTitle>
              <CardDescription>Based on your leadership style, these careers might align with your strengths</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {profile.careerPaths.map((career, index) => (
                  <div key={index} className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-border hover-lift">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-lg">{career.title}</h4>
                      <Badge variant="secondary">{career.field}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Study Tips */}
          <Card className="glass-card rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl">Personalized Study Tips</CardTitle>
              <CardDescription>Study strategies that match your learning style</CardDescription>
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

          {/* Assessment Details */}
          <AssessmentDetails 
            answers={results.answers}
            results={results}
            type="student"
          />

          {/* Next Steps CTA */}
          <Card className="glass-card-strong rounded-3xl shadow-xl border-2 border-primary/20 text-center">
            <CardContent className="pt-12 pb-12">
              <h3 className="text-3xl font-bold mb-4">Continue Your Leadership Journey</h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg">
                Want deeper insights? Explore our Pro assessment for comprehensive analysis and career planning.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" onClick={() => navigate('/pricing')}>
                  View All Assessments
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

export default StudentResults;
