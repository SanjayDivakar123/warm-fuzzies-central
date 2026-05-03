// @ts-nocheck
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleAnalysis {
  shouldTakeAssessment: boolean;
  recommendation: "highly_recommended" | "recommended" | "optional" | "not_recommended";
  confidence: "high" | "medium" | "low";
  reasons: string[];
  benefits: string[];
  suggestedCategory: "professional" | "entrepreneur" | "executive" | "manager";
  teamCollaborationScore: number;
  leadershipComplexityScore: number;
  selfAwarenessValueScore: number;
  aiAnalyzed?: boolean;
}

interface RoleAnalysisCardProps {
  mode?: "inline" | "standalone";
  onCategorySelect?: (category: "professional" | "entrepreneur" | "executive" | "manager") => void;
  initialJobRole?: string;
  showCategorySelect?: boolean;
}

const recommendationConfig = {
  highly_recommended: {
    label: "Highly Recommended",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
    iconColor: "text-green-500",
  },
  recommended: {
    label: "Recommended",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: CheckCircle2,
    iconColor: "text-blue-500",
  },
  optional: {
    label: "Optional",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    icon: AlertCircle,
    iconColor: "text-amber-500",
  },
  not_recommended: {
    label: "Not Recommended",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: XCircle,
    iconColor: "text-red-500",
  },
};

const categoryLabels = {
  professional: "Professional",
  entrepreneur: "Entrepreneur",
  executive: "Executive",
  manager: "Manager",
};

export default function RoleAnalysisCard({
  mode = "standalone",
  onCategorySelect,
  initialJobRole = "",
  showCategorySelect = true,
}: RoleAnalysisCardProps) {
  const [jobRole, setJobRole] = useState(initialJobRole);
  const [teamSize, setTeamSize] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RoleAnalysis | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setJobRole(initialJobRole || "");
  }, [initialJobRole]);

  const getOneWordVerdict = (recommendation: RoleAnalysis["recommendation"]) => {
    if (recommendation === "not_recommended") return "No";
    if (recommendation === "optional") return "Maybe";
    return "Yes";
  };

  const getConfidenceScore = (analysisData: RoleAnalysis) => {
    const confidenceBase: Record<RoleAnalysis["confidence"], number> = {
      high: 9,
      medium: 7,
      low: 5,
    };

    const scoreAverage =
      (analysisData.teamCollaborationScore +
        analysisData.leadershipComplexityScore +
        analysisData.selfAwarenessValueScore) /
      3;
    const blended = Math.round((confidenceBase[analysisData.confidence] + scoreAverage) / 2);
    return Math.max(1, Math.min(10, blended));
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return "High";
    if (score >= 5) return "Medium";
    return "Low";
  };

  const getSummaryBullets = (analysisData: RoleAnalysis) => [
    `Collaboration: ${getScoreLabel(analysisData.teamCollaborationScore)} (${analysisData.teamCollaborationScore}/10)`,
    `Leadership complexity: ${getScoreLabel(analysisData.leadershipComplexityScore)} (${analysisData.leadershipComplexityScore}/10)`,
    `Self-awareness value: ${getScoreLabel(analysisData.selfAwarenessValueScore)} (${analysisData.selfAwarenessValueScore}/10)`,
  ];

  const handleAnalyze = async () => {
    if (!jobRole.trim()) {
      toast({
        title: "Enter a job role",
        description: "Please enter a job role/title to analyze",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-role-assessment-need", {
        body: {
          jobRole: jobRole.trim(),
          teamSize: teamSize ? parseInt(teamSize) : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAnalysis(data);
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseCategory = () => {
    if (analysis && onCategorySelect) {
      onCategorySelect(analysis.suggestedCategory);
      toast({
        title: "Category applied",
        description: `Set to ${categoryLabels[analysis.suggestedCategory]} assessment`,
      });
    }
  };

  return (
    <div className={cn("space-y-4 w-full max-w-full", mode === "inline" && "pt-2 border-t")}>
      {mode === "standalone" && (
        <div className="flex items-center gap-2 mb-2">
          {/* <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Role Analysis</h3> */}
        </div>
      )}

      <div className="grid gap-3">
        <div className="space-y-2">
          <Label htmlFor="roleAnalysis">Job Role / Title</Label>
          <Input
            id="roleAnalysis"
            placeholder="e.g., Product Manager, Software Engineer, Sales Director"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
        </div>

        {mode === "standalone" && (
          <div className="space-y-2">
            <Label htmlFor="teamSize">Team Size (optional)</Label>
            <Input
              id="teamSize"
              type="number"
              placeholder="e.g., 5"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              min="0"
            />
          </div>
        )}

        <Button
          onClick={handleAnalyze}
          disabled={loading || !jobRole.trim()}
          className="gap-2"
          variant={mode === "inline" ? "outline" : "default"}
          size={mode === "inline" ? "sm" : "default"}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {analysis ? "Re-analyze" : "Should They Take the Test?"}
            </>
          )}
        </Button>
      </div>

      {analysis && (
        <Card className="border-2 overflow-hidden w-full max-w-full">
          <CardContent className="p-4 space-y-4">
            {/* Initial basic answer */}
            <div className="flex items-start justify-between gap-3 pb-2">
              <div className="flex items-center gap-3 min-w-0">
                {(() => {
                  const config = recommendationConfig[analysis.recommendation];
                  const verdict = getOneWordVerdict(analysis.recommendation);
                  const confidenceScore = getConfidenceScore(analysis);
                  return (
                    <>
                      <div className="space-y-2 min-w-0">
                        <Badge className={config.color}>{verdict}</Badge>
                        <p className="text-sm mt-1">
                          Confidence: <span className="font-medium">{confidenceScore}/10</span>
                        </p>
                        <ul className="space-y-1 pt-1">
                          {getSummaryBullets(analysis).map((point, idx) => (
                            <li key={`${idx}-${point}`} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-primary mt-0.5">•</span>
                              <span className="block min-w-0 leading-4">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  );
                })()}
              </div>
              {analysis.aiAnalyzed && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI
                </Badge>
              )}
            </div>

            {showCategorySelect && analysis.shouldTakeAssessment && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <p className="text-sm font-medium">Suggested Assessment:</p>
                  <p className="text-sm text-muted-foreground">
                    {categoryLabels[analysis.suggestedCategory]}
                  </p>
                </div>
                {onCategorySelect && (
                  <Button size="sm" variant="outline" onClick={handleUseCategory}>
                    Use This Category
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
