import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navigation/Navbar";
import { Download, Phone, Loader2, Save, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { exportToPDF } from "@/lib/pdfExport";
import SendToFriendCard from "@/components/reports/SendToFriendCard";
import RoleColorIdentityCard from "@/components/reports/RoleColorIdentityCard";

interface VoiceAssessmentResult {
  phone_number: string;
  dominant_color: string;
  score_yellow: number;
  score_red: number;
  score_green: number;
  score_blue: number;
  status: string;
}

const colorDescriptions = {
  yellow: {
    title: "Yellow - The Driver",
    description: "Direct, results-oriented, and decisive. You're focused on achieving goals and driving performance.",
    strengths: ["Goal-oriented", "Decisive", "Efficient", "Results-driven"],
    challenges: ["May be too direct", "Can overlook feelings", "Impatient with process"],
  },
  red: {
    title: "Red - The Inspirer",
    description: "Creative, enthusiastic, and visionary. You inspire others and bring innovative ideas to life.",
    strengths: ["Innovative", "Inspiring", "Enthusiastic", "Creative"],
    challenges: ["May lack follow-through", "Can be overly optimistic", "Resists routine"],
  },
  green: {
    title: "Green - The Analyzer",
    description: "Systematic, analytical, and detail-oriented. You build processes and ensure quality.",
    strengths: ["Analytical", "Systematic", "Quality-focused", "Thorough"],
    challenges: ["May overanalyze", "Can be rigid", "Slow to decide"],
  },
  blue: {
    title: "Blue - The Connector",
    description: "Relational, empathetic, and collaborative. You build strong teams and foster trust.",
    strengths: ["Empathetic", "Collaborative", "Trustworthy", "People-focused"],
    challenges: ["May avoid conflict", "Can be too accommodating", "Difficulty with tough decisions"],
  },
};

export const VoiceResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<VoiceAssessmentResult | null>(null);
  const [resultName, setResultName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareableCode, setShareableCode] = useState("");

  const sessionId = searchParams.get("session");
  const phoneNumber = searchParams.get("phone");
  const sharedCode = searchParams.get("share");
  const isSharedView = Boolean(sharedCode);

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
          assessment_type: 'voice',
          results: {
            name: resultName.trim(),
            dominantColor: results.dominant_color,
            scores: {
              yellow: results.score_yellow,
              red: results.score_red,
              green: results.score_green,
              blue: results.score_blue
            },
            phoneNumber: results.phone_number
          } as any
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

  useEffect(() => {
    const fetchResults = async () => {
      if (sharedCode) {
        const { data, error } = await supabase
          .from('assessment_results')
          .select('assessment_type, results, shareable_code')
          .eq('shareable_code', sharedCode)
          .maybeSingle();

        if (error || !data || data.assessment_type !== 'voice') {
          toast({
            title: "Result not found",
            description: "This shared report link is invalid or unavailable.",
            variant: "destructive",
          });
          navigate('/');
          setLoading(false);
          return;
        }

        const shared = data.results as any;
        setResults({
          phone_number: shared.phoneNumber || '',
          dominant_color: shared.dominantColor,
          score_yellow: Number(shared.scores?.yellow || 0),
          score_red: Number(shared.scores?.red || 0),
          score_green: Number(shared.scores?.green || 0),
          score_blue: Number(shared.scores?.blue || 0),
          status: 'complete',
        });
        setResultName((shared?.name as string) || '');
        setShareableCode(data.shareable_code || sharedCode);
        setLoading(false);
        return;
      }

      if (!sessionId && !phoneNumber) {
        toast({
          title: "No Assessment Found",
          description: "Please complete a voice assessment first.",
          variant: "destructive",
        });
        navigate("/voice-assessment");
        return;
      }

      try {
        let query = supabase
          .from("voice_assessments")
          .select("*")
          .eq("status", "complete");

        if (sessionId) {
          query = query.eq("session_id", sessionId);
        } else if (phoneNumber) {
          query = query.eq("phone_number", phoneNumber);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        if (!data) {
          toast({
            title: "Assessment Not Complete",
            description: "Your assessment is still in progress or hasn't been started.",
            variant: "destructive",
          });
          navigate("/voice-assessment");
          return;
        }

        setResults(data);

        if (user) {
          const { data: existingShare } = await supabase
            .from('assessment_results')
            .select('shareable_code')
            .eq('user_id', user.id)
            .eq('assessment_type', 'voice')
            .maybeSingle();

          if (existingShare?.shareable_code) {
            setShareableCode(existingShare.shareable_code);
          }
        }
      } catch (error: any) {
        console.error("Error fetching results:", error);
        toast({
          title: "Error",
          description: "Failed to load your results. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [sessionId, phoneNumber, navigate, toast, sharedCode, user]);

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

  const handleDownloadPDF = () => {
    if (!results) return;

    const colorInfo = colorDescriptions[results.dominant_color as keyof typeof colorDescriptions];
    
    exportToPDF({
      type: "Voice Assessment (Professional 25Q)",
      color: results.dominant_color,
      results: {
        dominantColor: results.dominant_color,
        score: Math.round((results[`score_${results.dominant_color}` as keyof typeof results] as number / 25) * 100),
      },
    }, `voice-assessment-${results.phone_number.replace(/\D/g, '')}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading your results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const colorInfo = colorDescriptions[results.dominant_color as keyof typeof colorDescriptions];
  const totalScore = results.score_yellow + results.score_red + results.score_green + results.score_blue;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-hero rounded-full mb-4 shadow-glow">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
              {isSharedView && resultName.trim().length > 0 ? `${resultName} Voice Assessment Results` : 'Your Voice Assessment Results'}
            </h1>
            <p className="text-muted-foreground text-lg">
              Completed via phone • Professional 25-Question Assessment
            </p>
          </div>

          {/* Dominant Color Card */}
          <Card className="mb-8 shadow-elegant border-2 border-primary/20 animate-scale-in">
            <CardHeader>
              <CardTitle className="text-2xl">{colorInfo.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-muted-foreground">{colorInfo.description}</p>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { color: "yellow", label: "Yellow", score: results.score_yellow },
                  { color: "red", label: "Red", score: results.score_red },
                  { color: "green", label: "Green", score: results.score_green },
                  { color: "blue", label: "Blue", score: results.score_blue },
                ].map((item) => (
                  <div
                    key={item.color}
                    className={`p-4 rounded-lg border-2 ${
                      item.color === results.dominant_color
                        ? "border-primary bg-primary/5"
                        : "border-border/50"
                    }`}
                  >
                    <div className="text-sm font-semibold text-muted-foreground mb-1">
                      {item.label}
                    </div>
                    <div className="text-3xl font-bold">{item.score}</div>
                    <div className="text-xs text-muted-foreground">
                      {totalScore > 0 ? Math.round((item.score / totalScore) * 100) : 0}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              <div>
                <h3 className="font-semibold mb-3">Your Strengths:</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {colorInfo.strengths.map((strength, index) => (
                    <li key={index} className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Growth Areas */}
              <div>
                <h3 className="font-semibold mb-3">Growth Areas:</h3>
                <ul className="grid grid-cols-1 gap-2">
                  {colorInfo.challenges.map((challenge, index) => (
                    <li key={index} className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isSharedView && user && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline">
                    <Save className="mr-2 h-5 w-5" />
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
            {!isSharedView && <Button size="lg" variant="outline" onClick={handleCopyShareLink}>
              <Link2 className="mr-2 h-5 w-5" />
              Copy Share Link
            </Button>}
            <Button size="lg" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-5 w-5" />
              Download PDF Report
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>

          {!isSharedView && <SendToFriendCard color={results.dominant_color} className="mt-8" />}

          {!isSharedView && <RoleColorIdentityCard
            name={user?.user_metadata?.full_name || phoneNumber}
            primaryColor={results.dominant_color}
            className="mt-8"
          />}
        </div>
      </div>
    </div>
  );
};
