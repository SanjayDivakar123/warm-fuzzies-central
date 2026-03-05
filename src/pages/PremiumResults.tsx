import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, Download, Share2, Trophy, Target, Lightbulb, Users, Star, ChevronRight, Save, Link2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/navigation/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { exportToPDF } from "@/lib/pdfExport";
import SendToFriendCard from "@/components/reports/SendToFriendCard";
import RoleColorIdentityCard from "@/components/reports/RoleColorIdentityCard";

interface PremiumResults {
  dominantColor: string;
  secondaryColor: string;
  scores: { yellow: number; red: number; green: number; blue: number };
  totalQuestions: number;
  isPremium: boolean;
}

const colorData = {
  yellow: {
    name: "Fast Executor",
    description: "You're a natural action-taker who thrives on getting things done quickly and efficiently. You have a talent for cutting through complexity and driving results.",
    strengths: ["Quick decision-making", "Results-oriented", "Efficient execution", "Problem-solving under pressure", "Leadership under deadlines", "Goal achievement"],
    developmentAreas: ["Patience with slower teammates", "Long-term strategic thinking", "Collaborative decision-making"],
    idealRoles: [
      { role: "CEO", salary: "$1M - $10M+", fit: "95%" },
      { role: "COO", salary: "$200k - $400k+", fit: "92%" },
      { role: "VP of Sales", salary: "$150k - $300k+", fit: "88%" },
      { role: "Operations Director", salary: "$100k - $180k", fit: "85%" }
    ],
    gradient: "bg-gradient-yellow",
    bgColor: "bg-yellow-light",
    textColor: "text-yellow-foreground",
    leadershipLevel: "High Leadership Potential"
  },
  red: {
    name: "Creative Motivator",
    description: "You're an inspiring visionary who energizes others with innovative ideas and passionate leadership. You excel at seeing possibilities and motivating teams toward bold goals.",
    strengths: ["Inspirational leadership", "Creative problem-solving", "Vision casting", "Team motivation", "Innovation catalyst", "Change management"],
    developmentAreas: ["Follow-through on details", "Systematic planning", "Process optimization"],
    idealRoles: [
      { role: "Creative Director", salary: "$80k - $140k", fit: "95%" },
      { role: "Brand Director", salary: "$75k - $130k", fit: "92%" },
      { role: "Marketing Director", salary: "$70k - $125k", fit: "88%" },
      { role: "Innovation Manager", salary: "$80k - $140k", fit: "85%" }
    ],
    gradient: "bg-gradient-red",
    bgColor: "bg-red-light",
    textColor: "text-red-foreground",
    leadershipLevel: "Mid-Low Leadership Potential"
  },
  green: {
    name: "Logical Systems Thinker",
    description: "You're a methodical strategist who excels at building systems and processes. You bring order to chaos and ensure sustainable, scalable solutions.",
    strengths: ["Strategic planning", "Systems thinking", "Quality assurance", "Risk management", "Process optimization", "Data analysis"],
    developmentAreas: ["Quick decision-making", "Inspiring others", "Adaptive leadership"],
    idealRoles: [
      { role: "CTO", salary: "$200k - $400k+", fit: "95%" },
      { role: "VP of Engineering", salary: "$180k - $350k", fit: "92%" },
      { role: "Chief Data Officer", salary: "$170k - $320k", fit: "88%" },
      { role: "Engineering Manager", salary: "$100k - $180k", fit: "85%" }
    ],
    gradient: "bg-gradient-green",
    bgColor: "bg-green-light",
    textColor: "text-green-foreground",
    leadershipLevel: "Mid-High Leadership Potential"
  },
  blue: {
    name: "Empathetic Connector",
    description: "You're a natural relationship builder who creates harmony and brings out the best in people. You excel at understanding others and building strong, collaborative teams.",
    strengths: ["Team building", "Emotional intelligence", "Conflict resolution", "Collaborative leadership", "Mentoring", "Culture building"],
    developmentAreas: ["Decisive leadership", "Performance management", "Strategic thinking"],
    idealRoles: [
      { role: "HR Director", salary: "$80k - $140k", fit: "95%" },
      { role: "Training Director", salary: "$75k - $130k", fit: "92%" },
      { role: "Culture Director", salary: "$70k - $125k", fit: "88%" },
      { role: "HR Manager", salary: "$50k - $85k", fit: "85%" }
    ],
    gradient: "bg-gradient-blue",
    bgColor: "bg-blue-light",
    textColor: "text-blue-foreground",
    leadershipLevel: "Low Leadership Potential"
  }
};

const PremiumResults = () => {
  const [results, setResults] = useState<PremiumResults | null>(null);
  const [resultName, setResultName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareableCode, setShareableCode] = useState<string>("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Calculate leadership score (calibrated): emphasize primary, keep floor at 60
  const calculateLeadershipScore = (results: PremiumResults): number => {
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
      const { data, error } = await supabase
        .from('assessment_results')
        .insert({
          user_id: user.id,
          assessment_type: 'premium',
          results: {
            name: resultName.trim(),
            dominantColor: results.dominantColor,
            secondaryColor: results.secondaryColor,
            scores: results.scores,
            totalQuestions: results.totalQuestions,
            isPremium: results.isPremium,
            leadershipScore: calculateLeadershipScore(results)
          }
        })
        .select('shareable_code')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data?.shareable_code) {
        setShareableCode(data.shareable_code);
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

  const handleExportPDF = async () => {
    if (!results) return;
    
    const dominantColorData = colorData[results.dominantColor as keyof typeof colorData];
    const secondaryColorData = colorData[results.secondaryColor as keyof typeof colorData];
    
    try {
      await exportToPDF({
        type: 'premium',
        color: results.dominantColor,
        score: calculateLeadershipScore(results),
        results: {
          dominantColor: results.dominantColor,
          secondaryColor: results.secondaryColor,
          scores: results.scores,
          score: calculateLeadershipScore(results)
        },
        strengths: dominantColorData.strengths,
        developmentAreas: dominantColorData.developmentAreas,
        description: dominantColorData.description,
        date: new Date().toISOString()
      }, `Premium-Leadership-Analysis-${dominantColorData.name.replace(' ', '-')}.pdf`);
      
      toast({
        title: "PDF Downloaded!",
        description: "Your premium leadership report has been saved.",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const savedResults = localStorage.getItem('premiumAssessmentResults');
    if (savedResults) {
      setResults(JSON.parse(savedResults));
      
      // Fetch or generate shareable code if user is logged in
      if (user) {
        const fetchOrCreateShareableCode = async () => {
          const { data, error } = await supabase
            .from('assessment_results')
            .select('shareable_code')
            .eq('user_id', user.id)
            .eq('assessment_type', 'premium')
            .maybeSingle();

          if (error) {
            console.error('Error fetching shareable code:', error);
            return;
          }

          if (data?.shareable_code) {
            setShareableCode(data.shareable_code);
          } else {
            // No saved assessment yet, code will be generated on save
            console.log('No saved assessment found - will generate code on save');
          }
        };

        fetchOrCreateShareableCode();
      }
    } else {
      navigate('/');
    }
  }, [navigate, user]);

  const handleShare = () => {
    const shareUrl = shareableCode 
      ? `${window.location.origin}/result/${shareableCode}`
      : window.location.href;
    
    const shareData = {
      title: `My Leadership Color Profile - ${colorData[results!.dominantColor as keyof typeof colorData].name}`,
      text: `I'm a ${colorData[results!.dominantColor as keyof typeof colorData].name}! Take the assessment to discover your leadership style.`,
      url: shareUrl,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: shareableCode ? "Your shareable results link has been copied!" : "Results link has been copied to your clipboard.",
      });
    }
  };

  const handleCopyShareLink = () => {
    if (!shareableCode) {
      toast({
        title: "Save Required",
        description: "Please save your assessment first to get a shareable link.",
        variant: "destructive"
      });
      return;
    }

    const shareUrl = `${window.location.origin}/result/${shareableCode}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: shareUrl,
    });
  };

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your premium results...</p>
        </Card>
      </div>
    );
  }

  const primaryColor = colorData[results.dominantColor as keyof typeof colorData];
  const secondaryColor = colorData[results.secondaryColor as keyof typeof colorData];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-gradient-subtle py-12 px-4">
        <div id="premium-results-content" className="max-w-6xl mx-auto">{/* Added ID for PDF export */}
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <Badge className="mb-4 bg-primary text-primary-foreground">
              <Star className="w-3 h-3 mr-1" />
              Premium Assessment Results
            </Badge>
            <h1 className="text-4xl font-bold mb-4">
              You're a <span className={`${primaryColor.gradient} bg-clip-text text-transparent`}>
                {primaryColor.name}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {primaryColor.description}
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {shareableCode && (
                <Button onClick={handleCopyShareLink} size="lg" className="min-w-[200px]">
                  <Link2 className="w-4 h-4 mr-2" />
                  Copy Share Link
                </Button>
              )}
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
                Download PDF Report
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
                    Based on your assessment results, you demonstrate strong leadership potential. Your {primaryColor.name.toLowerCase()} 
                    style combined with {secondaryColor.name.toLowerCase()} secondary traits creates a powerful leadership profile that 
                    excels in {primaryColor.strengths[0].toLowerCase()} and {primaryColor.strengths[1].toLowerCase()}.
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
                    <h5 className="font-semibold mb-4">Leadership Capability Assessment</h5>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Strategic Vision</span>
                          <span className="text-sm font-medium">88%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className={`h-2 rounded-full ${primaryColor.gradient}`} style={{ width: "88%" }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Team Influence</span>
                          <span className="text-sm font-medium">82%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className={`h-2 rounded-full ${secondaryColor.gradient}`} style={{ width: "82%" }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Decision Making</span>
                          <span className="text-sm font-medium">85%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className={`h-2 rounded-full ${primaryColor.gradient}`} style={{ width: "85%" }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Communication</span>
                          <span className="text-sm font-medium">79%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full" style={{ width: "79%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h6 className="font-semibold mb-2">Leadership Summary</h6>
                    <p className="text-sm text-muted-foreground">
                      Your leadership profile indicates strong capability for management and senior roles. 
                      The combination of your {primaryColor.name.toLowerCase()} drive and {secondaryColor.name.toLowerCase()} 
                      approach positions you for roles requiring both strategic thinking and tactical execution.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Primary Color Analysis */}
            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${primaryColor.gradient} rounded-full flex items-center justify-center`}>
                    <Trophy className="text-white w-4 h-4" />
                  </div>
                  Primary Color: {primaryColor.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Core Strengths
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {primaryColor.strengths.map((strength, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Development Areas
                  </h4>
                  <div className="space-y-2">
                    {primaryColor.developmentAreas.map((area, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Secondary Color */}
            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${secondaryColor.gradient} rounded-full flex items-center justify-center`}>
                    <Users className="text-white w-4 h-4" />
                  </div>
                  Secondary Color: {secondaryColor.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Supporting Strengths</h4>
                  <div className="space-y-2">
                    {secondaryColor.strengths.slice(0, 4).map((strength, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-secondary rounded-full"></div>
                        <span>{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Color Balance Section */}
          <Card className="animate-scale-in mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Your Color Balance</CardTitle>
              <p className="text-muted-foreground">Distribution of your leadership color traits</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(results.scores).map(([color, score]) => (
                  <div key={color} className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 bg-gradient-${color} rounded-full`}></div>
                      <span className="font-medium capitalize">{color}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-${color} rounded-full transition-all duration-500`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold w-12 text-right">{score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Recommendations */}
          <Card className="animate-scale-in mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Ideal Career Roles</CardTitle>
              <p className="text-muted-foreground">Based on your color profile and leadership potential</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {primaryColor.idealRoles.map((role, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <h4 className="font-semibold mb-2">{role.role}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{role.salary}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Fit Score</span>
                      <Badge variant="secondary">{role.fit}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Steps */}
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle>Next Steps for Your Development</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Leverage Your Strengths</h4>
                  <p className="text-sm text-muted-foreground">Focus on opportunities that utilize your natural {primaryColor.name.toLowerCase()} abilities.</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Develop Growth Areas</h4>
                  <p className="text-sm text-muted-foreground">Work on {primaryColor.developmentAreas[0].toLowerCase()} to become a more well-rounded leader.</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Build Your Network</h4>
                  <p className="text-sm text-muted-foreground">Connect with leaders in {primaryColor.idealRoles[0].role.toLowerCase()} roles for mentorship.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Leadership Profile Analysis - MOVED TO END */}
          <Card className="animate-scale-in mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Comprehensive Leadership Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/20 p-6 rounded-lg border-l-4 border-primary">
                <h3 className="font-semibold text-xl mb-3 text-foreground">Your Leadership Profile Analysis</h3>
                <p className="mb-4">
                  As a <strong className={`${primaryColor.gradient} bg-clip-text text-transparent`}>{primaryColor.name}</strong>, 
                  you bring a unique blend of natural talents that make you particularly effective in fast-paced, results-driven environments. 
                  Your ability to {primaryColor.strengths[0].toLowerCase()} sets you apart from other leadership styles and positions you 
                  for significant impact in executive roles.
                </p>
                
                <p className="mb-4">
                  Your secondary color profile as a <strong className={`${secondaryColor.gradient} bg-clip-text text-transparent`}>{secondaryColor.name}</strong> 
                  adds valuable depth to your leadership approach. This combination means you can {primaryColor.strengths[1].toLowerCase()} 
                  while also being able to {secondaryColor.strengths[0].toLowerCase()}, creating a well-rounded leadership presence 
                  that adapts to various organizational needs.
                </p>
                
                <p>
                  The synergy between these two dominant traits positions you exceptionally well for roles that require both 
                  {primaryColor.strengths[0].toLowerCase()} and {secondaryColor.strengths[0].toLowerCase()}. This dual capability 
                  is particularly valuable in today's complex business environment where leaders must navigate multiple competing 
                  priorities while maintaining team engagement and driving sustainable results.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade to Pro */}
          <div className="text-center mt-12 p-8 bg-muted/30 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">Want Even Deeper Insights?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Upgrade to our Pro Deep Dive assessment for advanced color blending analysis, 3-page comprehensive report, and personalized career roadmap.
            </p>
            <Link to="/pricing">
              <Button size="lg">
                Try Pro Assessment
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <RoleColorIdentityCard
            name={user?.user_metadata?.full_name || user?.email?.split("@")[0]}
            primaryColor={results.dominantColor}
            secondaryColor={results.secondaryColor}
            className="mt-8"
          />

          <SendToFriendCard color={results.dominantColor} className="mt-8" />
        </div>
      </div>
    </div>
  );
};

export default PremiumResults;