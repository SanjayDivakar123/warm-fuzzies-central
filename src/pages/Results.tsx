import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, Share2, Home, Download, Save, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Navbar } from "@/components/navigation/Navbar";
import SendToFriendCard from "@/components/reports/SendToFriendCard";
import RoleColorIdentityCard from "@/components/reports/RoleColorIdentityCard";

interface QuizResults {
  dominantColor: string;
  secondaryColor: string;
  scores: { yellow: number; red: number; green: number; blue: number };
  totalQuestions: number;
}

const colorData = {
  yellow: {
    name: "Fast Executor",
    description: "You're a natural action-taker who adapts by driving results when teams need momentum. Your contextual leadership shines in crisis situations and high-pressure environments where quick decisions create breakthrough moments.",
    strengths: ["Contextual crisis leadership", "Adaptive decision-making", "Results-oriented execution", "Team momentum building"],
    gradient: "bg-gradient-yellow",
    bgColor: "bg-yellow-light",
    textColor: "text-yellow-foreground",
    leadershipLevel: "Contextual Action Leader"
  },
  red: {
    name: "Creative Motivator",
    description: "You're an inspiring visionary who adapts by energizing teams with creative solutions when they need breakthrough thinking. Your contextual leadership excels during forming and storming stages, helping teams see new possibilities.",
    strengths: ["Adaptive vision casting", "Creative problem-solving", "Contextual team inspiration", "Change leadership"],
    gradient: "bg-gradient-red",
    bgColor: "bg-red-light",
    textColor: "text-red-foreground",
    leadershipLevel: "Contextual Vision Leader"
  },
  green: {
    name: "Logical Systems Thinker",
    description: "You're a methodical strategist who adapts by building the right systems when teams need structure and scalability. Your contextual leadership shines during norming and performing stages, creating sustainable frameworks for success.",
    strengths: ["Adaptive systems building", "Contextual strategic planning", "Scalable process design", "Stage-appropriate structure"],
    gradient: "bg-gradient-green",
    bgColor: "bg-green-light",
    textColor: "text-green-foreground",
    leadershipLevel: "Contextual Systems Leader"
  },
  blue: {
    name: "Empathetic Connector",
    description: "You're a natural relationship builder who adapts by creating the human connections teams need at each stage. Your contextual leadership excels in supporting others to perform at their best, knowing when to step forward and when to empower others.",
    strengths: ["Adaptive team building", "Contextual emotional support", "Stage-appropriate collaboration", "Empowering leadership"],
    gradient: "bg-gradient-blue",
    bgColor: "bg-blue-light",
    textColor: "text-blue-foreground",
    leadershipLevel: "Contextual People Leader"
  }
};

const getRoleRecommendations = (results: QuizResults) => {
  const { scores, dominantColor } = results;
  const sortedColors = Object.entries(scores).sort(([,a], [,b]) => b - a);
  const [primaryColor, primaryScore] = sortedColors[0];
  const [secondaryColor, secondaryScore] = sortedColors[1];
  
  const getLeadershipLevel = (color: string, score: number) => {
    const thresholds = {
      yellow: { high: 15, medium: 10 }, // High leadership potential
      green: { high: 18, medium: 12 },  // Mid-high leadership potential
      red: { high: 20, medium: 14 },    // Mid-low leadership potential
      blue: { high: 22, medium: 16 }    // Low leadership potential
    };
    
    const threshold = thresholds[color as keyof typeof thresholds];
    if (score >= threshold.high) return "Strong";
    if (score >= threshold.medium) return "Moderate";
    return "Developing";
  };
  
  const leadershipFit = getLeadershipLevel(primaryColor, primaryScore);
  
  // Role combinations based on primary and secondary colors with updated salary ranges
  const roleMatrix = {
    // Yellow combinations - High paying, high connections
    "yellow-red": {
      high: [
        { role: "CEO", salary: "$250k - $500k+" },
        { role: "COO", salary: "$200k - $400k+" },
        { role: "VP of Sales", salary: "$150k - $300k+" },
        { role: "Executive Director", salary: "$140k - $280k+" }
      ],
      medium: [
        { role: "Sales Director", salary: "$100k - $180k" },
        { role: "Business Development Director", salary: "$90k - $160k" },
        { role: "Regional Manager", salary: "$80k - $140k" }
      ],
      support: [
        { role: "Account Manager", salary: "$50k - $90k" },
        { role: "Sales Coordinator", salary: "$40k - $70k" },
        { role: "Business Development Rep", salary: "$45k - $80k" }
      ]
    },
    "yellow-green": {
      high: [
        { role: "CEO", salary: "$250k - $500k+" },
        { role: "COO", salary: "$200k - $400k+" },
        { role: "VP of Operations", salary: "$160k - $320k+" },
        { role: "CTO", salary: "$180k - $350k+" }
      ],
      medium: [
        { role: "Operations Director", salary: "$100k - $180k" },
        { role: "Systems Manager", salary: "$85k - $150k" },
        { role: "Process Manager", salary: "$75k - $130k" }
      ],
      support: [
        { role: "Operations Specialist", salary: "$45k - $80k" },
        { role: "Systems Analyst", salary: "$50k - $85k" },
        { role: "Process Coordinator", salary: "$40k - $70k" }
      ]
    },
    "yellow-blue": {
      high: [
        { role: "CEO", salary: "$250k - $500k+" },
        { role: "General Manager", salary: "$150k - $300k+" },
        { role: "VP of People", salary: "$140k - $280k+" },
        { role: "Regional Director", salary: "$120k - $240k" }
      ],
      medium: [
        { role: "HR Director", salary: "$80k - $140k" },
        { role: "Team Manager", salary: "$70k - $120k" },
        { role: "Customer Success Manager", salary: "$65k - $110k" }
      ],
      support: [
        { role: "HR Specialist", salary: "$40k - $70k" },
        { role: "Team Lead", salary: "$45k - $80k" },
        { role: "Customer Success Rep", salary: "$35k - $60k" }
      ]
    },
    
    // Green combinations - High paying, low connections
    "green-yellow": {
      high: [
        { role: "CTO", salary: "$200k - $400k+" },
        { role: "VP of Engineering", salary: "$180k - $350k" },
        { role: "Chief Data Officer", salary: "$170k - $320k" },
        { role: "VP of Product", salary: "$160k - $300k" }
      ],
      medium: [
        { role: "Engineering Manager", salary: "$100k - $180k" },
        { role: "Data Science Manager", salary: "$90k - $160k" },
        { role: "Product Manager", salary: "$85k - $150k" }
      ],
      support: [
        { role: "Senior Engineer", salary: "$70k - $120k" },
        { role: "Data Analyst", salary: "$55k - $95k" },
        { role: "Technical Specialist", salary: "$60k - $105k" }
      ]
    },
    "green-red": {
      high: [
        { role: "Chief Strategy Officer", salary: "$180k - $350k" },
        { role: "VP of Innovation", salary: "$160k - $320k" },
        { role: "Chief Product Officer", salary: "$170k - $330k" },
        { role: "R&D Director", salary: "$150k - $280k" }
      ],
      medium: [
        { role: "Strategy Manager", salary: "$85k - $150k" },
        { role: "Innovation Manager", salary: "$80k - $140k" },
        { role: "Product Strategy Lead", salary: "$75k - $135k" }
      ],
      support: [
        { role: "Strategy Analyst", salary: "$50k - $85k" },
        { role: "Research Specialist", salary: "$45k - $80k" },
        { role: "Innovation Coordinator", salary: "$40k - $70k" }
      ]
    },
    "green-blue": {
      high: [
        { role: "Chief Information Officer", salary: "$180k - $350k" },
        { role: "VP of Technology", salary: "$160k - $320k" },
        { role: "Head of Data Science", salary: "$150k - $280k" },
        { role: "VP of Analytics", salary: "$140k - $260k" }
      ],
      medium: [
        { role: "Data Science Manager", salary: "$90k - $160k" },
        { role: "Analytics Manager", salary: "$80k - $140k" },
        { role: "Technical Lead", salary: "$75k - $135k" }
      ],
      support: [
        { role: "Data Scientist", salary: "$65k - $115k" },
        { role: "Business Analyst", salary: "$50k - $85k" },
        { role: "Research Analyst", salary: "$45k - $80k" }
      ]
    },
    
    // Red combinations - Low paying, high connections
    "red-yellow": {
      high: [
        { role: "Creative Director", salary: "$80k - $140k" },
        { role: "Brand Director", salary: "$75k - $130k" },
        { role: "Marketing Director", salary: "$70k - $125k" },
        { role: "Communications Director", salary: "$65k - $120k" }
      ],
      medium: [
        { role: "Marketing Manager", salary: "$55k - $95k" },
        { role: "Brand Manager", salary: "$50k - $85k" },
        { role: "Creative Manager", salary: "$45k - $80k" }
      ],
      support: [
        { role: "Marketing Specialist", salary: "$35k - $60k" },
        { role: "Social Media Manager", salary: "$30k - $55k" },
        { role: "Content Creator", salary: "$25k - $50k" }
      ]
    },
    "red-green": {
      high: [
        { role: "Innovation Director", salary: "$85k - $150k" },
        { role: "UX Director", salary: "$80k - $140k" },
        { role: "Design Director", salary: "$75k - $135k" },
        { role: "Product Design Lead", salary: "$70k - $125k" }
      ],
      medium: [
        { role: "UX Manager", salary: "$60k - $105k" },
        { role: "Design Manager", salary: "$55k - $95k" },
        { role: "Product Designer", salary: "$50k - $85k" }
      ],
      support: [
        { role: "Graphic Designer", salary: "$35k - $60k" },
        { role: "UX Designer", salary: "$40k - $70k" },
        { role: "Creative Specialist", salary: "$30k - $55k" }
      ]
    },
    "red-blue": {
      high: [
        { role: "Community Director", salary: "$70k - $120k" },
        { role: "Culture Director", salary: "$65k - $115k" },
        { role: "Engagement Director", salary: "$60k - $110k" },
        { role: "Communications Director", salary: "$55k - $105k" }
      ],
      medium: [
        { role: "Community Manager", salary: "$45k - $80k" },
        { role: "Culture Manager", salary: "$40k - $75k" },
        { role: "Communications Manager", salary: "$35k - $70k" }
      ],
      support: [
        { role: "Community Specialist", salary: "$30k - $55k" },
        { role: "Social Media Coordinator", salary: "$25k - $50k" },
        { role: "Content Coordinator", salary: "$28k - $52k" }
      ]
    },
    
    // Blue combinations - Low paying, low connections
    "blue-yellow": {
      high: [
        { role: "HR Director", salary: "$80k - $140k" },
        { role: "Training Director", salary: "$75k - $130k" },
        { role: "Employee Relations Director", salary: "$70k - $125k" },
        { role: "Talent Director", salary: "$65k - $120k" }
      ],
      medium: [
        { role: "HR Manager", salary: "$50k - $85k" },
        { role: "Training Manager", salary: "$45k - $80k" },
        { role: "Talent Manager", salary: "$40k - $75k" }
      ],
      support: [
        { role: "HR Specialist", salary: "$35k - $60k" },
        { role: "Training Coordinator", salary: "$30k - $55k" },
        { role: "Recruiter", salary: "$32k - $58k" }
      ]
    },
    "blue-red": {
      high: [
        { role: "People & Culture Director", salary: "$75k - $135k" },
        { role: "Employee Experience Director", salary: "$70k - $125k" },
        { role: "Wellness Director", salary: "$65k - $115k" },
        { role: "D&I Director", salary: "$60k - $110k" }
      ],
      medium: [
        { role: "Culture Manager", salary: "$45k - $80k" },
        { role: "Employee Experience Manager", salary: "$40k - $75k" },
        { role: "Wellness Manager", salary: "$35k - $70k" }
      ],
      support: [
        { role: "Culture Specialist", salary: "$30k - $55k" },
        { role: "Employee Experience Coordinator", salary: "$28k - $52k" },
        { role: "Wellness Coordinator", salary: "$25k - $50k" }
      ]
    },
    "blue-green": {
      high: [
        { role: "Learning & Development Director", salary: "$70k - $125k" },
        { role: "Knowledge Management Director", salary: "$65k - $115k" },
        { role: "Training Director", salary: "$60k - $110k" },
        { role: "Organizational Development Director", salary: "$55k - $105k" }
      ],
      medium: [
        { role: "L&D Manager", salary: "$45k - $80k" },
        { role: "Training Manager", salary: "$40k - $75k" },
        { role: "Knowledge Manager", salary: "$35k - $70k" }
      ],
      support: [
        { role: "Training Specialist", salary: "$30k - $55k" },
        { role: "L&D Coordinator", salary: "$28k - $52k" },
        { role: "Knowledge Coordinator", salary: "$25k - $50k" }
      ]
    }
  };
  
  const colorCombo = `${primaryColor}-${secondaryColor}`;
  const roles = roleMatrix[colorCombo as keyof typeof roleMatrix];
  
  if (!roles) {
    return getSingleColorRoles(primaryColor, leadershipFit);
  }
  
  const fitLevel = leadershipFit === "Strong" ? "high" : leadershipFit === "Moderate" ? "medium" : "support";
  
  return {
    leadership: leadershipFit !== "Developing" ? roles[fitLevel === "support" ? "medium" : fitLevel] : [],
    support: roles.support,
    leadershipFit
  };
};

const getSingleColorRoles = (color: string, leadershipFit: string) => {
  const fallbackRoles = {
    yellow: {
      leadership: [
        { role: "CEO", salary: "$250k - $500k+" },
        { role: "COO", salary: "$200k - $400k+" },
        { role: "VP of Operations", salary: "$160k - $320k+" },
        { role: "Executive Director", salary: "$140k - $280k+" }
      ],
      support: [
        { role: "Operations Manager", salary: "$60k - $105k" },
        { role: "Business Analyst", salary: "$50k - $85k" },
        { role: "Project Manager", salary: "$55k - $95k" }
      ]
    },
    green: {
      leadership: [
        { role: "CTO", salary: "$200k - $400k+" },
        { role: "VP of Engineering", salary: "$180k - $350k" },
        { role: "Chief Data Officer", salary: "$170k - $320k" },
        { role: "VP of Product", salary: "$160k - $300k" }
      ],
      support: [
        { role: "Senior Engineer", salary: "$70k - $120k" },
        { role: "Data Scientist", salary: "$65k - $115k" },
        { role: "Technical Analyst", salary: "$55k - $95k" }
      ]
    },
    red: {
      leadership: [
        { role: "Creative Director", salary: "$80k - $140k" },
        { role: "Brand Director", salary: "$75k - $130k" },
        { role: "Marketing Director", salary: "$70k - $125k" },
        { role: "Communications Director", salary: "$65k - $120k" }
      ],
      support: [
        { role: "Marketing Specialist", salary: "$35k - $60k" },
        { role: "Graphic Designer", salary: "$30k - $55k" },
        { role: "Content Creator", salary: "$25k - $50k" }
      ]
    },
    blue: {
      leadership: [
        { role: "HR Director", salary: "$80k - $140k" },
        { role: "Training Director", salary: "$75k - $130k" },
        { role: "Culture Director", salary: "$70k - $125k" },
        { role: "Community Director", salary: "$65k - $115k" }
      ],
      support: [
        { role: "HR Specialist", salary: "$35k - $60k" },
        { role: "Training Coordinator", salary: "$30k - $55k" },
        { role: "Community Manager", salary: "$35k - $65k" }
      ]
    }
  };
  
  const roles = fallbackRoles[color as keyof typeof fallbackRoles];
  return {
    leadership: leadershipFit !== "Developing" ? roles.leadership : [],
    support: roles.support,
    leadershipFit
  };
};

const Results = () => {
  const [results, setResults] = useState<QuizResults | null>(null);
  const [resultName, setResultName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareableCode, setShareableCode] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const sharedCode = searchParams.get("share");
  const isSharedView = Boolean(sharedCode);

  useEffect(() => {
    if (sharedCode) {
      const fetchSharedResults = async () => {
        const { data, error } = await supabase
          .from('assessment_results')
          .select('assessment_type, results, shareable_code')
          .eq('shareable_code', sharedCode)
          .maybeSingle();

        if (error || !data || data.assessment_type !== 'quiz') {
          toast({
            title: 'Result not found',
            description: 'This shared report link is invalid or unavailable.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setResults(data.results as QuizResults);
        setShareableCode(data.shareable_code || sharedCode);
        setResultName(((data.results as any)?.name as string) || '');
      };

      fetchSharedResults();
      return;
    }

    const savedResults = localStorage.getItem('quizResults');
    if (savedResults) {
      setResults(JSON.parse(savedResults));

      if (user) {
        const fetchShareableCode = async () => {
          const { data } = await supabase
            .from('assessment_results')
            .select('shareable_code')
            .eq('user_id', user.id)
            .eq('assessment_type', 'quiz')
            .maybeSingle();

          if (data?.shareable_code) {
            setShareableCode(data.shareable_code);
          }
        };

        fetchShareableCode();
      }
    } else {
      navigate('/');
    }
  }, [navigate, sharedCode, toast, user]);

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
        .upsert({
          user_id: user.id,
          assessment_type: 'quiz',
          results: {
            name: resultName.trim(),
            dominantColor: results.dominantColor,
            secondaryColor: results.secondaryColor,
            scores: results.scores,
            totalQuestions: results.totalQuestions
          } as any
        }, {
          onConflict: 'user_id,assessment_type'
        })
        .select('shareable_code')
        .single();

      if (error) throw error;

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

  const handleShare = () => {
    const shareUrl = shareableCode
      ? `${window.location.origin}/result/${shareableCode}`
      : window.location.href;

    const shareData = {
      title: `My Leadership Color Profile - ${colorData[results!.dominantColor as keyof typeof colorData].name}`,
      text: `I'm a ${colorData[results!.dominantColor as keyof typeof colorData].name}! Take the quiz to discover your leadership style.`,
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

  const handleExportPDF = async () => {
    if (!results) return;
    
    const element = document.getElementById('results-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        height: element.scrollHeight,
        width: element.scrollWidth,
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Add header
      pdf.setFontSize(20);
      pdf.text('Leadership Color Profile Report', pdfWidth / 2, 20, { align: 'center' });
      
      const dominantColorData = colorData[results.dominantColor as keyof typeof colorData];
      
      pdf.save(`Leadership-Color-Profile-${dominantColorData.name}.pdf`);
      
      toast({
        title: "PDF exported successfully!",
        description: "Your leadership profile has been downloaded.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading your results...</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  const dominantColorData = colorData[results.dominantColor as keyof typeof colorData];
  const roleRecommendations = getRoleRecommendations(results);
  
  // Calculate percentages
  const totalResponses = results.totalQuestions;
  const colorPercentages = Object.entries(results.scores).map(([color, score]) => ({
    color,
    percentage: Math.round((score / totalResponses) * 100)
  })).sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-gradient-to-br from-background via-background to-muted py-8">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              {isSharedView && resultName.trim().length > 0 ? `${resultName} Leadership Color Profile` : 'Your Leadership Color Profile'}
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover your unique leadership style and career potential
            </p>
          </div>

          <div id="results-content">
            {/* Dominant Color Card */}
            <Card className={`${dominantColorData.bgColor} border-2 border-primary/20 shadow-glow mb-8 overflow-hidden relative`}>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/10"></div>
              <CardHeader className="text-center relative z-10">
                <div className="flex justify-center mb-4">
                  <div className={`w-20 h-20 ${dominantColorData.gradient} rounded-full flex items-center justify-center shadow-glow animate-bounce-gentle`}>
                    <span className="text-white font-bold text-2xl">🎯</span>
                  </div>
                </div>
                <CardTitle className={`text-4xl font-bold mb-4 ${dominantColorData.textColor}`}>
                  {dominantColorData.name}
                </CardTitle>
                <div className="flex justify-center mb-4">
                  <Badge variant="secondary" className="text-lg px-4 py-2 animate-fade-in">
                    {dominantColorData.leadershipLevel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-center relative z-10">
                <p className={`text-lg mb-6 ${dominantColorData.textColor} leading-relaxed`}>
                  {dominantColorData.description}
                </p>
                
                <div className="flex justify-center">
                  <Badge variant="default" className="text-lg px-6 py-3 animate-glow-pulse">
                    Leadership Assessment: {roleRecommendations.leadershipFit}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Color Breakdown */}
              <Card className="shadow-elegant border-primary/10 hover:shadow-glow transition-all duration-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${dominantColorData.gradient} animate-pulse`}></div>
                    Your Color Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {colorPercentages.map(({ color, percentage }) => (
                      <div key={color} className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-gradient-${color} shadow-sm`}></div>
                            <span className="font-medium">{colorData[color as keyof typeof colorData].name}</span>
                          </div>
                          <span className="font-bold text-lg">{percentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-${color} transition-all duration-1000 ease-out shadow-sm`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Strengths */}
              <Card className="shadow-elegant border-primary/10 hover:shadow-glow transition-all duration-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${dominantColorData.gradient} animate-pulse`}></div>
                    Your Key Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {dominantColorData.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-3 group">
                        <div className={`w-2 h-2 rounded-full ${dominantColorData.gradient} mt-2 group-hover:scale-125 transition-transform`}></div>
                        <span className="leading-relaxed group-hover:text-primary transition-colors">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Role Recommendations */}
            <Card className="shadow-elegant border-primary/10 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${dominantColorData.gradient} animate-pulse`}></div>
                  {roleRecommendations.leadershipFit === "Strong" 
                    ? "Perfect Leadership Roles for You" 
                    : roleRecommendations.leadershipFit === "Moderate" 
                    ? "Potential Leadership Roles" 
                    : "Your Ideal Contribution Roles"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {roleRecommendations.leadershipFit !== "Developing" && roleRecommendations.leadership.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span className="text-green-600">💼</span>
                        Leadership Positions
                      </h3>
                      <div className="space-y-3">
                        {roleRecommendations.leadership.map((roleData, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20 hover:shadow-md transition-all duration-300">
                            <Badge variant="default" className="text-sm font-medium">
                              {typeof roleData === 'string' ? roleData : roleData.role}
                            </Badge>
                            {typeof roleData === 'object' && (
                              <span className="text-sm font-bold text-green-600">
                                {roleData.salary}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <span className="text-blue-600">🎯</span>
                      {roleRecommendations.leadershipFit === "Developing" ? "Specialist Roles" : "Supporting Roles"}
                    </h3>
                    <div className="space-y-3">
                      {roleRecommendations.support.map((roleData, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-muted/50 to-muted/80 rounded-lg border border-muted hover:shadow-md transition-all duration-300">
                          <Badge variant="outline" className="text-sm font-medium">
                            {typeof roleData === 'string' ? roleData : roleData.role}
                          </Badge>
                          {typeof roleData === 'object' && (
                            <span className="text-sm font-bold text-blue-600">
                              {roleData.salary}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {roleRecommendations.leadershipFit === "Developing" && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <p className="text-sm leading-relaxed">
                      <strong>Remember:</strong> Not everyone needs to be a leader to be valuable! Your strengths in {dominantColorData.name.toLowerCase()} skills make you an essential team member who can drive excellence in specialized roles.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
            {!isSharedView && user && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 max-w-xs border-primary/20 hover:bg-primary/10 transition-all duration-300"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save to Account
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
            
            <Button
              onClick={handleExportPDF}
              className="flex-1 max-w-xs bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF Report
            </Button>
            
            {!isSharedView && <Button
              onClick={handleCopyShareLink}
              variant="outline"
              className="flex-1 max-w-xs border-primary/20 hover:bg-primary/10 transition-all duration-300"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Copy Share Link
            </Button>}

            {!isSharedView && <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1 max-w-xs border-primary/20 hover:bg-primary/10 transition-all duration-300"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Results
            </Button>}
            
            {!isSharedView && <Button
              onClick={() => navigate('/quiz')}
              variant="outline"
              className="flex-1 max-w-xs border-primary/20 hover:bg-primary/10 transition-all duration-300"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Quiz
            </Button>}
            
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="flex-1 max-w-xs hover:bg-primary/10 transition-all duration-300"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <div className="mt-10">
            {!isSharedView && <RoleColorIdentityCard
              name={user?.user_metadata?.full_name || user?.email?.split("@")[0]}
              primaryColor={results.dominantColor}
              secondaryColor={results.secondaryColor}
              className="mb-6"
            />}
            {!isSharedView && <SendToFriendCard color={results.dominantColor} />}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Results;