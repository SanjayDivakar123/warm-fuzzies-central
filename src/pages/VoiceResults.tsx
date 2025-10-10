import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navigation/Navbar";
import { Download, Phone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportToPDF } from "@/lib/pdfExport";

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
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<VoiceAssessmentResult | null>(null);

  const sessionId = searchParams.get("session");
  const phoneNumber = searchParams.get("phone");

  useEffect(() => {
    const fetchResults = async () => {
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
  }, [sessionId, phoneNumber, navigate, toast]);

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
              Your Voice Assessment Results
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
            <Button size="lg" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-5 w-5" />
              Download PDF Report
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
