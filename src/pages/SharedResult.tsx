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

        {/* Color Analysis Section */}
        {resultData.colorScores && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Color Balance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(resultData.colorScores).map(([color, score]: [string, any]) => (
                  <div key={color}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium capitalize">{color}</span>
                      <span className="text-muted-foreground">{score}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${colorData[color]?.gradient || 'from-gray-400 to-gray-500'}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Primary Color Detailed Analysis */}
        {colorInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Primary Leadership Style: {colorInfo.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {resultData.strengths && resultData.strengths.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Core Strengths</h3>
                  <ul className="space-y-2">
                    {resultData.strengths.map((strength: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {resultData.developmentAreas && resultData.developmentAreas.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Development Opportunities</h3>
                  <ul className="space-y-2">
                    {resultData.developmentAreas.map((area: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground">→</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Secondary Color Analysis */}
        {resultData.secondaryColor && colorData[resultData.secondaryColor] && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Secondary Influence: {colorData[resultData.secondaryColor].name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {colorData[resultData.secondaryColor].description}
              </p>
              {resultData.secondaryColorScore && (
                <div className="text-sm text-muted-foreground">
                  Secondary Color Strength: {resultData.secondaryColorScore}%
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ideal Career Roles */}
        {resultData.idealRoles && resultData.idealRoles.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Ideal Career Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {resultData.idealRoles.map((role: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">★</span>
                    <span>{role}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Communication Style */}
        {resultData.communicationStyle && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Communication Style</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{resultData.communicationStyle}</p>
            </CardContent>
          </Card>
        )}

        {/* Work Environment Preferences */}
        {resultData.workEnvironment && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Ideal Work Environment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{resultData.workEnvironment}</p>
            </CardContent>
          </Card>
        )}

        {/* Additional Insights */}
        {resultData.insights && resultData.insights.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Additional Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {resultData.insights.map((insight: string, index: number) => (
                  <li key={index} className="text-muted-foreground">
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        {resultData.nextSteps && resultData.nextSteps.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Next Steps for Development</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {resultData.nextSteps.map((step: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary font-semibold">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-8">
          <p className="text-muted-foreground mb-4">
            Want to discover your own leadership style?
          </p>
          <Button onClick={() => navigate("/")} size="lg">
            Take the Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}
