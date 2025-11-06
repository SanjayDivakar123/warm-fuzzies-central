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
    name: "Fast Executor",
    description:
      "You're a contextual action-taker who adapts by driving rapid execution when teams need momentum. Your leadership isn't a fixed identity—it's knowing when to step up with decisive action and when teams need breakthrough performance.",
    strengths: [
      "Quick decision-making",
      "Results-oriented",
      "Efficient execution",
      "Problem-solving under pressure",
      "Leadership under deadlines",
      "Goal achievement",
      "Crisis management",
      "Competitive advantage",
    ],
    developmentAreas: [
      "Patience with slower teammates",
      "Long-term strategic thinking",
      "Collaborative decision-making",
      "Emotional intelligence",
      "Systematic planning",
    ],
    idealRoles: [
      { role: "CEO", salary: "$250k - $500k+", fit: "95%", description: "Drive organizational performance and strategic execution" },
      { role: "COO", salary: "$200k - $400k+", fit: "92%", description: "Optimize operations and deliver results" },
      { role: "VP of Sales", salary: "$150k - $300k+", fit: "88%", description: "Lead high-performance sales teams" },
      { role: "Operations Director", salary: "$100k - $180k", fit: "85%", description: "Streamline processes and efficiency" },
      { role: "General Manager", salary: "$120k - $220k", fit: "83%", description: "Manage P&L and drive performance" },
    ],
    gradient: "bg-gradient-yellow",
    bgColor: "bg-yellow-light",
    textColor: "text-yellow-foreground",
    leadershipLevel: "High Leadership Potential",
    workStyle: "Fast-paced, results-driven, competitive environment",
    communication: "Direct, concise, outcome-focused",
    motivation: "Achievement, recognition, challenge, autonomy",
  },
  red: {
    name: "Creative Motivator",
    description:
      "You're a contextual visionary who adapts by inspiring breakthrough thinking when teams need creative solutions. Your leadership adapts to energize teams through different stages, knowing when to paint the vision and when to empower others to innovate.",
    strengths: [
      "Inspirational leadership",
      "Creative problem-solving",
      "Vision casting",
      "Team motivation",
      "Innovation catalyst",
      "Change management",
      "Strategic thinking",
      "Cultural transformation",
    ],
    developmentAreas: [
      "Follow-through on details",
      "Systematic planning",
      "Process optimization",
      "Financial management",
      "Operational efficiency",
    ],
    idealRoles: [
      { role: "Creative Director", salary: "$80k - $140k", fit: "95%", description: "Lead creative vision and innovation" },
      { role: "Brand Director", salary: "$75k - $130k", fit: "92%", description: "Build compelling brand experiences" },
      { role: "Marketing Director", salary: "$70k - $125k", fit: "88%", description: "Drive marketing strategy and campaigns" },
      { role: "Innovation Manager", salary: "$80k - $140k", fit: "85%", description: "Foster organizational innovation" },
      { role: "Chief Vision Officer", salary: "$150k - $280k", fit: "90%", description: "Shape organizational future and strategy" },
    ],
    gradient: "bg-gradient-red",
    bgColor: "bg-red-light",
    textColor: "text-red-foreground",
    leadershipLevel: "Mid-High Leadership Potential",
    workStyle: "Dynamic, creative, flexible, inspiring environment",
    communication: "Enthusiastic, persuasive, story-driven",
    motivation: "Purpose, creativity, recognition, impact",
  },
  green: {
    name: "Logical Systems Thinker",
    description:
      "You're a contextual strategist who adapts by building the right systems when teams need structure and scalability. Your leadership evolves from tactical execution to strategic architecture, knowing when teams need frameworks versus flexibility.",
    strengths: [
      "Strategic planning",
      "Systems thinking",
      "Quality assurance",
      "Risk management",
      "Process optimization",
      "Data analysis",
      "Technical expertise",
      "Long-term planning",
    ],
    developmentAreas: [
      "Quick decision-making",
      "Inspiring others",
      "Adaptive leadership",
      "Emotional expression",
      "Rapid change management",
    ],
    idealRoles: [
      { role: "CTO", salary: "$200k - $400k+", fit: "95%", description: "Lead technology strategy and innovation" },
      { role: "VP of Engineering", salary: "$180k - $350k", fit: "92%", description: "Build scalable technical teams" },
      { role: "Chief Data Officer", salary: "$170k - $320k", fit: "88%", description: "Drive data strategy and analytics" },
      { role: "Engineering Manager", salary: "$100k - $180k", fit: "85%", description: "Manage technical teams and delivery" },
      { role: "Chief Strategy Officer", salary: "$180k - $350k", fit: "90%", description: "Develop long-term strategic plans" },
    ],
    gradient: "bg-gradient-green",
    bgColor: "bg-green-light",
    textColor: "text-green-foreground",
    leadershipLevel: "Mid-High Leadership Potential",
    workStyle: "Structured, analytical, quality-focused environment",
    communication: "Clear, detailed, evidence-based",
    motivation: "Excellence, mastery, stability, logical challenge",
  },
  blue: {
    name: "Empathetic Connector",
    description:
      "You're a contextual relationship builder who adapts by creating the human connections teams need at each stage. Your leadership isn't fixed—it's knowing when to lead through empathy, when to facilitate, and when to empower others to shine.",
    strengths: [
      "Team building",
      "Emotional intelligence",
      "Conflict resolution",
      "Collaborative leadership",
      "Mentoring",
      "Culture building",
      "Communication",
      "Stakeholder management",
    ],
    developmentAreas: [
      "Decisive leadership",
      "Performance management",
      "Strategic thinking",
      "Competitive pressure",
      "Rapid execution",
    ],
    idealRoles: [
      { role: "HR Director", salary: "$80k - $140k", fit: "95%", description: "Lead people strategy and culture" },
      { role: "Training Director", salary: "$75k - $130k", fit: "92%", description: "Develop organizational capabilities" },
      { role: "Culture Director", salary: "$70k - $125k", fit: "88%", description: "Shape organizational culture" },
      { role: "HR Manager", salary: "$50k - $85k", fit: "85%", description: "Support team development and wellness" },
      { role: "Chief People Officer", salary: "$150k - $280k", fit: "90%", description: "Lead comprehensive people strategy" },
    ],
    gradient: "bg-gradient-blue",
    bgColor: "bg-blue-light",
    textColor: "text-blue-foreground",
    leadershipLevel: "Collaborative Leadership Potential",
    workStyle: "Collaborative, supportive, relationship-focused environment",
    communication: "Warm, empathetic, inclusive",
    motivation: "Relationships, service, harmony, personal growth",
  },
};

const calculateLeadershipScore = (data: any): number => {
  if (typeof data?.leadershipScore === 'number') return data.leadershipScore;
  const scores: Record<string, number> | undefined = data?.scores || data?.colorScores;
  if (!scores) return 0;
  const entries = Object.entries(scores);
  if (!entries.length) return 0;
  const sorted = [...entries].sort((a, b) => Number(b[1]) - Number(a[1]));
  const primary = Number(sorted[0]?.[1] || 0);
  const secondary = Number(sorted[1]?.[1] || 0);
  const total = entries.reduce((sum, [, n]) => sum + Number(n), 0);
  if (total <= 0) return 0;
  const primaryPct = primary / total;
  const secondaryPct = secondary / total;
  const weighted = primaryPct * 0.8 + secondaryPct * 0.2;
  const score = Math.round(60 + 40 * weighted);
  return Math.min(100, Math.max(60, score));
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

        <Card className={`${colorInfo.gradient} ${colorInfo.textColor} mb-6`}>
          <CardHeader>
            <CardTitle className="text-3xl">
              {colorInfo.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg opacity-90">{colorInfo.description}</p>
          </CardContent>
        </Card>

        {/* Leadership Potential Assessment */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Leadership Potential Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm ${colorInfo.gradient} text-white`}>
                  {colorInfo.leadershipLevel}
                </span>
                <span className="text-muted-foreground">{result.assessment_type?.toUpperCase()}</span>
              </div>
              <div className="text-xl font-semibold">
                Leadership Score: {calculateLeadershipScore(resultData)}%
              </div>
            </div>
          </CardContent>
        </Card>

        {result.assessment_type === 'pro' && resultData.colorDistribution && resultData.totalQuestions && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Advanced Color Blend Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resultData.colorDistribution.slice(0, 3).map(([color, score]: [string, number]) => {
                  const pct = Math.round((Number(score) / Number(resultData.totalQuestions)) * 100);
                  return (
                    <div key={color}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium capitalize">{color}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${colorData[color]?.gradient || 'bg-muted'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Color Analysis Section */}
        {(resultData.colorScores || resultData.scores) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Color Balance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const srcScores = (resultData.colorScores || resultData.scores) as Record<string, number>;
                  const total = Object.values(srcScores).reduce((sum: number, n: number) => sum + Number(n), 0);
                  return Object.entries(srcScores).map(([color, score]: [string, number]) => {
                    const pct = resultData.colorScores ? Number(score) : (total > 0 ? Math.round((Number(score) / total) * 100) : 0);
                    return (
                      <div key={color}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium capitalize">{color}</span>
                          <span className="text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${colorData[color]?.gradient || 'bg-muted'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
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
