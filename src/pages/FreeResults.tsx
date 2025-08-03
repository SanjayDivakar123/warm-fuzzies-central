import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Lock, Star, ChevronRight, Eye, Gift, Save, Share2, Download, Copy, Mail, Users, Heart } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FreeResults {
  dominantColor: string;
  scores: { yellow: number; red: number; green: number; blue: number };
  totalQuestions: number;
  isPreview: boolean;
}

const colorPreviewData = {
  yellow: {
    name: "Fast Executor",
    emoji: "⚡",
    description: "You're a natural action-taker who thrives on getting things done quickly and efficiently.",
    previewStrengths: ["Quick decision-making", "Results-oriented"],
    gradient: "bg-gradient-yellow",
    bgColor: "bg-yellow-light",
    textColor: "text-yellow-foreground",
  },
  red: {
    name: "Creative Motivator",
    emoji: "🔥", 
    description: "You're an inspiring visionary who energizes others with innovative ideas and passionate leadership.",
    previewStrengths: ["Inspirational leadership", "Creative problem-solving"],
    gradient: "bg-gradient-red",
    bgColor: "bg-red-light",
    textColor: "text-red-foreground",
  },
  green: {
    name: "Logical Systems Thinker",
    emoji: "🧠",
    description: "You're a methodical strategist who excels at building systems and processes.",
    previewStrengths: ["Strategic planning", "Systems thinking"],
    gradient: "bg-gradient-green",
    bgColor: "bg-green-light", 
    textColor: "text-green-foreground",
  },
  blue: {
    name: "Empathetic Connector",
    emoji: "💙",
    description: "You're a natural relationship builder who creates harmony and brings out the best in people.",
    previewStrengths: ["Team building", "Emotional intelligence"],
    gradient: "bg-gradient-blue",
    bgColor: "bg-blue-light",
    textColor: "text-blue-foreground",
  }
};

const FreeResults = () => {
  const [results, setResults] = useState<FreeResults | null>(null);
  const [resultName, setResultName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const resultCardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSaveResult = async () => {
    if (!user || !results || !resultName.trim()) {
      toast({
        title: "Save Failed",
        description: !user ? "Please sign in to save results" : "Please enter a name for your assessment",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('assessment_results')
        .insert({
          user_id: user.id,
          assessment_type: 'free',
          results: {
            name: resultName.trim(),
            dominantColor: results.dominantColor,
            scores: results.scores,
            totalQuestions: results.totalQuestions,
            isPreview: results.isPreview
          }
        });

      if (error) throw error;

      toast({
        title: "Assessment Saved!",
        description: `"${resultName}" has been saved to your account.`
      });
      setIsDialogOpen(false);
      setResultName("");
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingEmail(true);
    try {
      // Save email to database for follow-up
      const { error } = await supabase
        .from('email_signups')
        .insert({
          email: email.trim(),
          source: 'free_quiz_deep_dive',
          metadata: {
            color: results?.dominantColor,
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;

      toast({
        title: "Success! 🎉",
        description: "Your 3-page deep dive report will be sent to your email within 24 hours!"
      });
      
      setIsEmailDialogOpen(false);
      setEmail("");
    } catch (error) {
      console.error('Error saving email:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const generateShareText = () => {
    if (!results) return "";
    const colorData = colorPreviewData[results.dominantColor as keyof typeof colorPreviewData];
    return `I just found out I'm a ${colorData.emoji} ${colorData.name}. What color are you? Take the RoleColorFinder test 👇\n${window.location.origin}\n#MyColorRole #LeadershipStyle #RoleColorFinder`;
  };

  const handleCopyShare = () => {
    const shareText = generateShareText();
    navigator.clipboard.writeText(shareText);
    toast({
      title: "Copied! 📋",
      description: "Share text copied to clipboard - paste it anywhere!"
    });
  };

  const handleDownloadCard = async () => {
    if (!resultCardRef.current) return;

    try {
      // Dynamic import of html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(resultCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        width: 600,
        height: 400
      });
      
      const link = document.createElement('a');
      link.download = `my-color-role-${results?.dominantColor}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast({
        title: "Downloaded! 📸",
        description: "Your color badge is ready to share on social media!"
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Please try again or screenshot your results.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const savedResults = localStorage.getItem('freeAssessmentResults');
    if (savedResults) {
      setResults(JSON.parse(savedResults));
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your preview results...</p>
        </Card>
      </div>
    );
  }

  const colorData = colorPreviewData[results.dominantColor as keyof typeof colorPreviewData];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-gradient-subtle py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Promo Banner */}
          <div className="mb-8 animate-fade-in">
            <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-200 dark:border-green-800">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Gift className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-green-700 dark:text-green-400">Special Offer!</h3>
                </div>
                <p className="text-lg mb-2">
                  Use code <Badge className="bg-green-600 text-white mx-1 px-3 py-1 text-base font-bold">FREE499</Badge> 
                  to get <span className="font-bold text-green-600">$4.99 off</span> your first order
                </p>
                <p className="text-sm text-muted-foreground">
                  Limited time offer - Apply at checkout
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Eye className="w-3 h-3 mr-1" />
              Free Preview Results
            </Badge>
            <h1 className="text-4xl font-bold mb-4">
              You're a <span className={`${colorData.gradient} bg-clip-text text-transparent`}>
                {colorData.name}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              This is just a preview based on 3 questions. Get your complete analysis with our full assessment.
            </p>
            
            {/* Viral Share Section */}
            <div className="mt-8 space-y-4">
              <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800" ref={resultCardRef}>
                <CardContent className="p-6 text-center">
                  <div className="text-6xl mb-3">{colorData.emoji}</div>
                  <h3 className="text-2xl font-bold mb-2">I'm a {colorData.name}!</h3>
                  <p className="text-muted-foreground mb-4">Leadership isn't a fixed identity - it's adapting your strengths to what your team needs.</p>
                  <Badge className="bg-purple-600 text-white">RoleColorFinder.com</Badge>
                </CardContent>
              </Card>

              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={handleCopyShare} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Share2 className="w-4 h-4 mr-2" />
                  🔗 Share Your Color
                </Button>
                <Button onClick={handleDownloadCard} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Save Badge
                </Button>
                <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                      <Mail className="w-4 h-4 mr-2" />
                      Get Deep Dive PDF
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Get Your 3-Page Deep Dive Report</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Want the complete breakdown of your {colorData.name} profile? Get your detailed 3-page PDF report with:
                      </p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Complete leadership style analysis</li>
                        <li>• Specific role recommendations</li>
                        <li>• Career development strategies</li>
                        <li>• Team dynamics insights</li>
                      </ul>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email..."
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleEmailSubmit} disabled={isSubmittingEmail || !email.trim()}>
                          {isSubmittingEmail ? "Sending..." : "Send My Report"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Copyable Share Text */}
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <Label className="text-sm font-medium">📱 Copy & paste to share:</Label>
                  <Textarea 
                    value={generateShareText()} 
                    readOnly 
                    className="mt-2 text-sm"
                    rows={3}
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-muted-foreground">
                      <Users className="w-3 h-3 inline mr-1" />
                      Tag 3 friends who should take it!
                    </p>
                    <Button size="sm" variant="ghost" onClick={handleCopyShare}>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {user && (
              <div className="flex justify-center mt-6">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg">
                      <Save className="w-4 h-4 mr-2" />
                      Save Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Your Assessment Preview</DialogTitle>
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
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Preview Results */}
            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${colorData.gradient} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  Preview Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Your Leadership Style Preview</h4>
                  <p className="text-muted-foreground">{colorData.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Sample Strengths</h4>
                  <div className="space-y-2">
                    {colorData.previewStrengths.map((strength, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm">{strength}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 opacity-50">
                      <Lock className="w-3 h-3" />
                      <span className="text-sm">And much more in the full assessment...</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Unlock Your Complete Profile
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Detailed leadership potential analysis</li>
                    <li>• Specific role recommendations with salaries</li>
                    <li>• Complete strengths & development areas</li>
                    <li>• Career transition strategies</li>
                    <li>• Downloadable PDF report</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Options */}
            <div className="space-y-6">
              <Card className="border-primary/20 shadow-glow animate-scale-in">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Premium Assessment</CardTitle>
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                  <div className="text-3xl font-bold">$19 <span className="text-sm font-normal text-muted-foreground">one-time</span></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      Complete 25-question assessment
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      Full color profile analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      Role recommendations with salaries
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      Leadership potential assessment
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      Downloadable PDF report
                    </li>
                  </ul>
                  <Link to="/pricing">
                    <Button className="w-full" size="lg">
                      Get Premium Assessment
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="animate-scale-in">
                <CardHeader>
                  <CardTitle className="text-xl">Pro Deep Dive</CardTitle>
                  <div className="text-3xl font-bold">$49 <span className="text-sm font-normal text-muted-foreground">one-time</span></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      Extended 50-question deep assessment
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      Advanced color blending analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      3-page comprehensive report
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      Career transition roadmap
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      Leadership development plan
                    </li>
                  </ul>
                  <Link to="/pricing">
                    <Button variant="outline" className="w-full" size="lg">
                      Get Pro Analysis
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button variant="ghost" onClick={() => navigate('/')}>
                  ← Back to Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeResults;