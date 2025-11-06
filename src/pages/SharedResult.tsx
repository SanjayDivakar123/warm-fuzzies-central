import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Navbar } from "@/components/navigation/Navbar";

interface AssessmentResult {
  id: string;
  assessment_type: string;
  results: any;
  shareable_code: string;
  created_at: string;
}

const colorData: Record<string, any> = {
  yellow: {
    name: "Yellow - The Inspirer",
    emoji: "☀️",
    description: "Enthusiastic, optimistic, and people-oriented. You inspire and motivate others with your positive energy.",
    gradient: "from-yellow-400 to-amber-500",
    textColor: "text-yellow-900",
  },
  red: {
    name: "Red - The Driver",
    emoji: "🔥",
    description: "Results-focused, decisive, and action-oriented. You drive progress and get things done.",
    gradient: "from-red-500 to-rose-600",
    textColor: "text-white",
  },
  green: {
    name: "Green - The Harmonizer",
    emoji: "🌿",
    description: "Calm, supportive, and steady. You create harmony and build strong, lasting relationships.",
    gradient: "from-green-500 to-emerald-600",
    textColor: "text-white",
  },
  blue: {
    name: "Blue - The Analyzer",
    emoji: "🔷",
    description: "Analytical, detail-oriented, and precise. You ensure quality and accuracy in everything you do.",
    gradient: "from-blue-500 to-indigo-600",
    textColor: "text-white",
  },
};

export default function SharedResult() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    if (code) {
      fetchResult(code);
    }
  }, [code]);

  const fetchResult = async (shareableCode: string) => {
    try {
      const { data, error } = await supabase
        .from("assessment_results")
        .select("*")
        .eq("shareable_code", shareableCode)
        .single();

      if (error) throw error;

      if (data) {
        setResult(data);
      } else {
        toast.error("Result not found");
        navigate("/");
      }
    } catch (error) {
      console.error("Error fetching result:", error);
      toast.error("Failed to load result");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Leadership Assessment Result",
          text: `Check out my leadership style assessment: ${result?.results?.dominantColor || ""}`,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const resultData = result.results;
  const dominantColor = resultData.dominantColor || resultData.dominant_color;
  const colorInfo = colorData[dominantColor] || colorData.yellow;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Shared Assessment Result</h1>
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        <Card className={`bg-gradient-to-br ${colorInfo.gradient} ${colorInfo.textColor} mb-6`}>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <span className="text-4xl">{colorInfo.emoji}</span>
              {colorInfo.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg opacity-90">{colorInfo.description}</p>
            {resultData.leadershipScore && (
              <div className="mt-4 text-xl font-semibold">
                Leadership Score: {resultData.leadershipScore}/100
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Badge */}
        <Card className="mb-6 border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                <span className="text-sm font-semibold">Preview Only</span>
              </div>
              <p className="text-muted-foreground mb-2">
                This is a preview of the assessment results. 
              </p>
              <p className="text-sm text-muted-foreground">
                Take your own assessment to see your complete leadership profile including:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>✓ Detailed strengths analysis</li>
                <li>✓ Personalized development areas</li>
                <li>✓ Career role recommendations</li>
                <li>✓ Complete leadership breakdown</li>
                <li>✓ Downloadable PDF report</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 space-y-4">
          <p className="text-lg font-semibold">
            Ready to discover your own leadership style?
          </p>
          <Button onClick={() => navigate("/")} size="lg" className="min-w-[200px]">
            Take Your Free Assessment
          </Button>
          <p className="text-sm text-muted-foreground">
            Quick 5-minute assessment • Instant results • No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
