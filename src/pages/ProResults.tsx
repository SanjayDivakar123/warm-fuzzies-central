import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, Download, Share2, Trophy, Target, Lightbulb, Users, TrendingUp, Brain, MapPin, Calendar, Star, ChevronRight, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/navigation/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { exportToPDF } from "@/lib/pdfExport";

interface ProResults {
  dominantColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  scores: { yellow: number; red: number; green: number; blue: number };
  totalQuestions: number;
  isPro: boolean;
  colorDistribution: [string, number][];
}

const colorData = {
  yellow: {
    name: "Fast Executor",
    description: "You're a contextual action-taker who adapts by driving rapid execution when teams need momentum. Your leadership isn't a fixed identity—it's knowing when to step up with decisive action and when teams need breakthrough performance.",
    strengths: ["Quick decision-making", "Results-oriented", "Efficient execution", "Problem-solving under pressure", "Leadership under deadlines", "Goal achievement", "Crisis management", "Competitive advantage"],
    developmentAreas: ["Patience with slower teammates", "Long-term strategic thinking", "Collaborative decision-making", "Emotional intelligence", "Systematic planning"],
    idealRoles: [
      { role: "CEO", salary: "$250k - $500k+", fit: "95%", description: "Drive organizational performance and strategic execution" },
      { role: "COO", salary: "$200k - $400k+", fit: "92%", description: "Optimize operations and deliver results" },
      { role: "VP of Sales", salary: "$150k - $300k+", fit: "88%", description: "Lead high-performance sales teams" },
      { role: "Operations Director", salary: "$100k - $180k", fit: "85%", description: "Streamline processes and efficiency" },
      { role: "General Manager", salary: "$120k - $220k", fit: "83%", description: "Manage P&L and drive performance" }
    ],
    gradient: "bg-gradient-yellow",
    bgColor: "bg-yellow-light",
    textColor: "text-yellow-foreground",
    leadershipLevel: "High Leadership Potential",
    workStyle: "Fast-paced, results-driven, competitive environment",
    communication: "Direct, concise, outcome-focused",
    motivation: "Achievement, recognition, challenge, autonomy"
  },
  red: {
    name: "Creative Motivator",
    description: "You're a contextual visionary who adapts by inspiring breakthrough thinking when teams need creative solutions. Your leadership adapts to energize teams through different stages, knowing when to paint the vision and when to empower others to innovate.",
    strengths: ["Inspirational leadership", "Creative problem-solving", "Vision casting", "Team motivation", "Innovation catalyst", "Change management", "Strategic thinking", "Cultural transformation"],
    developmentAreas: ["Follow-through on details", "Systematic planning", "Process optimization", "Financial management", "Operational efficiency"],
    idealRoles: [
      { role: "Creative Director", salary: "$80k - $140k", fit: "95%", description: "Lead creative vision and innovation" },
      { role: "Brand Director", salary: "$75k - $130k", fit: "92%", description: "Build compelling brand experiences" },
      { role: "Marketing Director", salary: "$70k - $125k", fit: "88%", description: "Drive marketing strategy and campaigns" },
      { role: "Innovation Manager", salary: "$80k - $140k", fit: "85%", description: "Foster organizational innovation" },
      { role: "Chief Vision Officer", salary: "$150k - $280k", fit: "90%", description: "Shape organizational future and strategy" }
    ],
    gradient: "bg-gradient-red",
    bgColor: "bg-red-light",
    textColor: "text-red-foreground",
    leadershipLevel: "Mid-High Leadership Potential",
    workStyle: "Dynamic, creative, flexible, inspiring environment",
    communication: "Enthusiastic, persuasive, story-driven",
    motivation: "Purpose, creativity, recognition, impact"
  },
  green: {
    name: "Logical Systems Thinker",
    description: "You're a contextual strategist who adapts by building the right systems when teams need structure and scalability. Your leadership evolves from tactical execution to strategic architecture, knowing when teams need frameworks versus flexibility.",
    strengths: ["Strategic planning", "Systems thinking", "Quality assurance", "Risk management", "Process optimization", "Data analysis", "Technical expertise", "Long-term planning"],
    developmentAreas: ["Quick decision-making", "Inspiring others", "Adaptive leadership", "Emotional expression", "Rapid change management"],
    idealRoles: [
      { role: "CTO", salary: "$200k - $400k+", fit: "95%", description: "Lead technology strategy and innovation" },
      { role: "VP of Engineering", salary: "$180k - $350k", fit: "92%", description: "Build scalable technical teams" },
      { role: "Chief Data Officer", salary: "$170k - $320k", fit: "88%", description: "Drive data strategy and analytics" },
      { role: "Engineering Manager", salary: "$100k - $180k", fit: "85%", description: "Manage technical teams and delivery" },
      { role: "Chief Strategy Officer", salary: "$180k - $350k", fit: "90%", description: "Develop long-term strategic plans" }
    ],
    gradient: "bg-gradient-green",
    bgColor: "bg-green-light",
    textColor: "text-green-foreground",
    leadershipLevel: "Mid-High Leadership Potential",
    workStyle: "Structured, analytical, quality-focused environment",
    communication: "Clear, detailed, evidence-based",
    motivation: "Excellence, mastery, stability, logical challenge"
  },
  blue: {
    name: "Empathetic Connector",
    description: "You're a contextual relationship builder who adapts by creating the human connections teams need at each stage. Your leadership isn't fixed—it's knowing when to lead through empathy, when to facilitate, and when to empower others to shine.",
    strengths: ["Team building", "Emotional intelligence", "Conflict resolution", "Collaborative leadership", "Mentoring", "Culture building", "Communication", "Stakeholder management"],
    developmentAreas: ["Decisive leadership", "Performance management", "Strategic thinking", "Competitive pressure", "Rapid execution"],
    idealRoles: [
      { role: "HR Director", salary: "$80k - $140k", fit: "95%", description: "Lead people strategy and culture" },
      { role: "Training Director", salary: "$75k - $130k", fit: "92%", description: "Develop organizational capabilities" },
      { role: "Culture Director", salary: "$70k - $125k", fit: "88%", description: "Shape organizational culture" },
      { role: "HR Manager", salary: "$50k - $85k", fit: "85%", description: "Support team development and wellness" },
      { role: "Chief People Officer", salary: "$150k - $280k", fit: "90%", description: "Lead comprehensive people strategy" }
    ],
    gradient: "bg-gradient-blue",
    bgColor: "bg-blue-light",
    textColor: "text-blue-foreground",
    leadershipLevel: "Collaborative Leadership Potential",
    workStyle: "Collaborative, supportive, relationship-focused environment",
    communication: "Warm, empathetic, inclusive",
    motivation: "Relationships, service, harmony, personal growth"
  }
};

const ProResults = () => {
  const [results, setResults] = useState<ProResults | null>(null);
  const [resultName, setResultName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Calculate leadership score (calibrated): emphasize primary, keep floor at 60
  const calculateLeadershipScore = (results: ProResults): number => {
    const { scores } = results;
    const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]);
    const [, primary] = sorted[0] || ["", 0];
    const [, secondary] = sorted[1] || ["", 0];

    // Total across all colors (handles both counts and normalized values)
    const total = Object.values(scores).reduce((sum, n) => sum + n, 0);
    if (total <= 0) return 0;

    const primaryPct = Number(primary) / total;
    const secondaryPct = Number(secondary) / total;

    // Weighted dominance mapping to keep scores meaningful (60–100 range)
    const weighted = primaryPct * 0.8 + secondaryPct * 0.2;
    const score = Math.round(60 + 40 * weighted);
    return Math.min(100, Math.max(60, score));
  };

  const handleSaveResult = async () => {
    if (!results || !resultName.trim()) {
      toast({
        title: "Save Failed",
        description: "Please enter a name for your assessment",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to save your assessment results",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('assessment_results')
        .upsert({
          user_id: user.id,
          assessment_type: 'pro',
          results: {
            name: resultName.trim(),
            dominantColor: results.dominantColor,
            secondaryColor: results.secondaryColor,
            tertiaryColor: results.tertiaryColor,
            scores: results.scores,
            totalQuestions: results.totalQuestions,
            isPro: results.isPro,
            colorDistribution: results.colorDistribution,
            leadershipScore: calculateLeadershipScore(results)
          }
        }, {
          onConflict: 'user_id,assessment_type'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Assessment Saved!",
        description: `"${resultName}" has been saved to your account.`
      });
      setIsDialogOpen(false);
      setResultName("");
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      toast({
        title: "Save Failed",
        description: error?.message || "There was an error saving your assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const savedResults = localStorage.getItem('proAssessmentResults');
    if (savedResults) {
      setResults(JSON.parse(savedResults));
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleExportPDF = async () => {
    if (!results) return;
    
    const primaryColor = colorData[results.dominantColor as keyof typeof colorData];
    const secondaryColor = colorData[results.secondaryColor as keyof typeof colorData];
    
    try {
      await exportToPDF({
        type: 'pro',
        color: results.dominantColor,
        score: calculateLeadershipScore(results),
        results: {
          dominantColor: results.dominantColor,
          secondaryColor: results.secondaryColor,
          tertiaryColor: results.tertiaryColor,
          scores: results.scores,
          colorDistribution: results.colorDistribution,
          score: calculateLeadershipScore(results)
        },
        strengths: primaryColor.strengths,
        developmentAreas: primaryColor.developmentAreas,
        description: primaryColor.description,
        date: new Date().toISOString()
      }, `Pro-Leadership-Analysis-${primaryColor.name.replace(' ', '-')}.pdf`);
      
      toast({
        title: "PDF Downloaded!",
        description: "Your comprehensive leadership report has been saved.",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    }
  };

  const handleShare = () => {
    if (!results) return;
    const primaryColor = colorData[results.dominantColor as keyof typeof colorData];
    
    const shareData = {
      title: `My Pro Leadership Analysis - ${primaryColor.name}`,
      text: `I completed the Pro Deep Dive assessment and I'm a ${primaryColor.name}! Discover your leadership style.`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Link copied!",
        description: "Pro results link has been copied to your clipboard.",
      });
    }
  };
  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your comprehensive pro results...</p>
        </Card>
      </div>
    );
  }

  const primaryColor = colorData[results.dominantColor as keyof typeof colorData];
  const secondaryColor = colorData[results.secondaryColor as keyof typeof colorData];
  const tertiaryColor = colorData[results.tertiaryColor as keyof typeof colorData];

  const calculateBlendProfile = () => {
    const [primary, primaryScore] = results.colorDistribution[0];
    const [secondary, secondaryScore] = results.colorDistribution[1];
    const [tertiary, tertiaryScore] = results.colorDistribution[2];
    
    const primaryPercentage = Math.round((primaryScore / results.totalQuestions) * 100);
    const secondaryPercentage = Math.round((secondaryScore / results.totalQuestions) * 100);
    const tertiaryPercentage = Math.round((tertiaryScore / results.totalQuestions) * 100);
    
    return { primaryPercentage, secondaryPercentage, tertiaryPercentage };
  };

  const { primaryPercentage, secondaryPercentage, tertiaryPercentage } = calculateBlendProfile();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-gradient-subtle py-12 px-4" id="pro-results-content">
        <div className="max-w-7xl mx-auto">
          {/* PAGE 1: Executive Summary */}
          <div className="mb-16" id="page-1">
            {/* Header */}
            <div className="text-center mb-12 animate-fade-in">
              <Badge className="mb-4 bg-gradient-hero text-white border-0 px-4 py-2">
                <Crown className="w-4 h-4 mr-2" />
                Pro Deep Dive Analysis
              </Badge>
              <h1 className="text-5xl font-bold mb-6">
                You're a <span className={`${primaryColor.gradient} bg-clip-text text-transparent`}>
                  {primaryColor.name}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8">
                {primaryColor.description}
              </p>
              
              <div className="flex justify-center gap-4 mb-8">
                {user && (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="lg">
                        <Save className="w-4 h-4 mr-2" />
                        Save Assessment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Your Assessment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="result-name">Assessment Name</Label>
                          <Input
                            id="result-name"
                            placeholder="Enter a name for this assessment..."
                            value={resultName}
                            onChange={(e) => setResultName(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveResult} disabled={isSaving || !resultName.trim()}>
                            {isSaving ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <Button onClick={handleShare} variant="outline" size="lg">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Results
                </Button>
                <Button onClick={handleExportPDF} variant="outline" size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download Professional Report
                </Button>
              </div>
            </div>

            {/* Leadership Potential - MOVED TO START AS MAIN SUBJECT */}
            <Card className="mb-8 animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-3xl">
                  <div className={`w-12 h-12 ${primaryColor.gradient} rounded-lg flex items-center justify-center`}>
                    <Crown className="text-white w-6 h-6" />
                  </div>
                  Leadership Potential Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className={`${primaryColor.gradient} text-white border-0`}>
                        {primaryColor.leadershipLevel}
                      </Badge>
                      <span className="text-2xl font-bold">{calculateLeadershipScore(results)}% Leadership Score</span>
                    </div>
                    <p className="text-lg leading-relaxed mb-6">
                      Your assessment reveals a <strong>Contextual Leadership</strong> profile. Your {primaryColor.name.toLowerCase()} 
                      style combined with {secondaryColor.name.toLowerCase()} secondary traits creates adaptive leadership that 
                      knows when to lead and when to support. Leadership isn't your fixed identity—it's how you adapt your strengths to what teams need at each stage.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                          <Star className="w-4 h-4 text-primary" />
                          Core Leadership Strengths
                        </h5>
                        <div className="grid grid-cols-2 gap-2">
                          {primaryColor.strengths.slice(0, 4).map((strength, index) => (
                            <div key={index} className="text-sm bg-muted/50 p-2 rounded">
                              • {strength}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4 text-secondary" />
                          Growth Opportunities
                        </h5>
                        <div className="space-y-1">
                          {primaryColor.developmentAreas.slice(0, 3).map((area, index) => (
                            <div key={index} className="text-sm text-muted-foreground">
                              • {area}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-semibold mb-4">Leadership Capability Radar</h5>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Strategic Vision</span>
                            <span className="text-sm font-medium">95%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className={`h-2 rounded-full ${primaryColor.gradient}`} style={{ width: "95%" }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Team Influence</span>
                            <span className="text-sm font-medium">88%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className={`h-2 rounded-full ${secondaryColor.gradient}`} style={{ width: "88%" }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Decision Making</span>
                            <span className="text-sm font-medium">92%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className={`h-2 rounded-full ${primaryColor.gradient}`} style={{ width: "92%" }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Communication</span>
                            <span className="text-sm font-medium">{85 + secondaryPercentage / 4}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className={`h-2 rounded-full ${tertiaryColor.gradient}`} style={{ width: `${85 + secondaryPercentage / 4}%` }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Adaptability</span>
                            <span className="text-sm font-medium">{75 + tertiaryPercentage}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full" style={{ width: `${75 + tertiaryPercentage}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h6 className="font-semibold mb-2">Executive Summary</h6>
                      <p className="text-sm text-muted-foreground">
                        Your leadership profile indicates exceptional capability for senior executive roles. 
                        The combination of your {primaryColor.name.toLowerCase()} drive and {secondaryColor.name.toLowerCase()} 
                        approach positions you for roles requiring both strategic thinking and tactical execution.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Executive Summary Grid */}
            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              {/* Color Blend Analysis */}
              <Card className="lg:col-span-2 animate-scale-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className={`w-10 h-10 ${primaryColor.gradient} rounded-lg flex items-center justify-center`}>
                      <Brain className="text-white w-5 h-5" />
                    </div>
                    Advanced Color Blend Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className={`w-16 h-16 ${primaryColor.gradient} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                        <span className="text-white font-bold text-xl">{primaryPercentage}%</span>
                      </div>
                      <h4 className="font-bold text-lg mb-2">Primary: {primaryColor.name}</h4>
                      <p className="text-sm text-muted-foreground">{primaryColor.workStyle}</p>
                    </div>
                    <div className="text-center">
                      <div className={`w-16 h-16 ${secondaryColor.gradient} rounded-full mx-auto mb-4 flex items-center justify-center opacity-80`}>
                        <span className="text-white font-bold text-xl">{secondaryPercentage}%</span>
                      </div>
                      <h4 className="font-bold text-lg mb-2">Secondary: {secondaryColor.name}</h4>
                      <p className="text-sm text-muted-foreground">{secondaryColor.communication}</p>
                    </div>
                    <div className="text-center">
                      <div className={`w-16 h-16 ${tertiaryColor.gradient} rounded-full mx-auto mb-4 flex items-center justify-center opacity-60`}>
                        <span className="text-white font-bold text-xl">{tertiaryPercentage}%</span>
                      </div>
                      <h4 className="font-bold text-lg mb-2">Tertiary: {tertiaryColor.name}</h4>
                      <p className="text-sm text-muted-foreground">{tertiaryColor.motivation}</p>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-6 rounded-lg">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Your Unique Leadership Blend
                    </h4>
                    <p className="text-sm leading-relaxed">
                      Your {primaryPercentage}% {primaryColor.name.toLowerCase()} primary style gives you {primaryColor.strengths[0].toLowerCase()} and {primaryColor.strengths[1].toLowerCase()}. 
                      Combined with your {secondaryPercentage}% {secondaryColor.name.toLowerCase()} secondary traits, you bring {secondaryColor.strengths[0].toLowerCase()} to your leadership approach.
                      Your {tertiaryPercentage}% {tertiaryColor.name.toLowerCase()} influence adds {tertiaryColor.strengths[0].toLowerCase()}, making you a uniquely versatile leader.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <Card className="animate-scale-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-primary" />
                    Leadership Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Leadership Potential</span>
                      <Badge variant="secondary">{primaryColor.leadershipLevel}</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "92%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Adaptability Score</span>
                      <span className="text-sm font-bold">{85 + secondaryPercentage / 4}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-secondary h-2 rounded-full" style={{ width: `${85 + secondaryPercentage / 4}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Team Compatibility</span>
                      <span className="text-sm font-bold">{75 + tertiaryPercentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full" style={{ width: `${75 + tertiaryPercentage}%` }}></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h5 className="font-semibold mb-2">Best Match Industries</h5>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">• Technology & Innovation</div>
                      <div className="text-xs text-muted-foreground">• Consulting & Strategy</div>
                      <div className="text-xs text-muted-foreground">• Financial Services</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* PAGE 2: Detailed Analysis */}
          <div className="mb-16" id="page-2">
            <h2 className="text-3xl font-bold text-center mb-12">Comprehensive Leadership Analysis</h2>
            
            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              {/* Strengths & Development */}
              <Card className="animate-scale-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Target className="w-6 h-6 text-primary" />
                    Core Competencies & Growth Areas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <h4 className="font-semibold mb-4 text-lg text-green-600">💪 Peak Strengths</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {primaryColor.strengths.slice(0, 8).map((strength, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span>{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4 text-lg text-orange-600">🎯 Development Opportunities</h4>
                    <div className="space-y-3">
                      {primaryColor.developmentAreas.map((area, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                          <Lightbulb className="w-4 h-4 text-orange-500 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium">{area}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Focus area for leadership growth
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Communication & Work Style */}
              <Card className="animate-scale-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-primary" />
                    Communication & Collaboration Style
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-700">Communication Approach</h4>
                    <p className="text-sm text-blue-600">{primaryColor.communication}</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-purple-700">Optimal Work Environment</h4>
                    <p className="text-sm text-purple-600">{primaryColor.workStyle}</p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-green-700">Key Motivators</h4>
                    <p className="text-sm text-green-600">{primaryColor.motivation}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Team Collaboration Tips</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Leverage your {primaryColor.strengths[0].toLowerCase()} in group settings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Partner with {secondaryColor.name.toLowerCase()}s for balanced perspectives</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Practice {primaryColor.developmentAreas[0].toLowerCase()} for team growth</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Career Roadmap */}
            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <MapPin className="w-8 h-8 text-primary" />
                  Personalized Career Transition Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-3 gap-8">
                  <div>
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      Next 6 Months
                    </h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="font-medium text-sm">Skill Development</div>
                        <div className="text-xs text-muted-foreground">Focus on {primaryColor.developmentAreas[0].toLowerCase()}</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="font-medium text-sm">Network Building</div>
                        <div className="text-xs text-muted-foreground">Connect with {primaryColor.idealRoles[0].role} professionals</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Next 12 Months
                    </h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium text-sm">Leadership Role</div>
                        <div className="text-xs text-muted-foreground">Seek {primaryColor.idealRoles[1].role} opportunities</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium text-sm">Strategic Projects</div>
                        <div className="text-xs text-muted-foreground">Lead initiatives using your {primaryColor.strengths[2].toLowerCase()}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      Long-term Vision
                    </h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="font-medium text-sm">Executive Role</div>
                        <div className="text-xs text-muted-foreground">Target {primaryColor.idealRoles[0].role} position</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="font-medium text-sm">Industry Impact</div>
                        <div className="text-xs text-muted-foreground">Become known for {primaryColor.strengths[0].toLowerCase()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PAGE 3: Action Plan & Resources */}
          <div className="mb-16" id="page-3">
            <h2 className="text-3xl font-bold text-center mb-12">Strategic Action Plan & Resources</h2>
            
            {/* Ideal Roles Matrix */}
            <Card className="animate-scale-in mb-12">
              <CardHeader>
                <CardTitle className="text-2xl">Perfect-Fit Career Roles</CardTitle>
                <p className="text-muted-foreground">Roles that align with your unique color blend and leadership potential</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {primaryColor.idealRoles.map((role, index) => (
                    <Card key={index} className="border-2 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <Badge className="bg-primary/10 text-primary">{role.fit}</Badge>
                          <div className={`w-8 h-8 ${primaryColor.gradient} rounded-full`}></div>
                        </div>
                        <h4 className="font-bold text-lg mb-2">{role.role}</h4>
                        <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                        <div className="text-lg font-bold text-primary">{role.salary}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Steps & Resources */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="animate-scale-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Target className="w-6 h-6 text-primary" />
                    Immediate Action Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                      <div>
                        <h5 className="font-semibold">Leverage Your {primaryColor.strengths[0]}</h5>
                        <p className="text-sm text-muted-foreground">Take on projects that showcase your natural {primaryColor.strengths[0].toLowerCase()} abilities</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 bg-secondary/5 rounded-lg">
                      <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                      <div>
                        <h5 className="font-semibold">Develop {primaryColor.developmentAreas[0]}</h5>
                        <p className="text-sm text-muted-foreground">Focus on improving your {primaryColor.developmentAreas[0].toLowerCase()} through training and practice</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 bg-accent/5 rounded-lg">
                      <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                      <div>
                        <h5 className="font-semibold">Build Strategic Network</h5>
                        <p className="text-sm text-muted-foreground">Connect with professionals in {primaryColor.idealRoles[0].role.toLowerCase()} roles for mentorship and opportunities</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-scale-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-primary" />
                    Recommended Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-semibold mb-3">📚 Leadership Development</h5>
                      <div className="space-y-2 text-sm">
                        <div>• "The {primaryColor.name} Leader" - Advanced strategies</div>
                        <div>• Executive coaching for {primaryColor.strengths[0].toLowerCase()}</div>
                        <div>• {primaryColor.leadershipLevel} masterclass</div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold mb-3">🎯 Skill Building</h5>
                      <div className="space-y-2 text-sm">
                        <div>• {primaryColor.developmentAreas[0]} workshop</div>
                        <div>• {secondaryColor.strengths[0]} certification</div>
                        <div>• Advanced {primaryColor.workStyle.split(',')[0].toLowerCase()} training</div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold mb-3">🌐 Networking</h5>
                      <div className="space-y-2 text-sm">
                        <div>• {primaryColor.idealRoles[0].role} professional groups</div>
                        <div>• Industry associations for {primaryColor.name.toLowerCase()}s</div>
                        <div>• Leadership circles in your field</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProResults;