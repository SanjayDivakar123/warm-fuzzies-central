import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Crown,
  Brain,
  Lightbulb,
  ChevronDown,
  ChevronUp,
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
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

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
      setShowDetails(true);
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

  const ScoreBar = ({ label, score, icon: Icon }: { label: string; score: number; icon: any }) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="font-medium">{score}/10</span>
      </div>
      <Progress value={score * 10} className="h-1.5" />
    </div>
  );

  return (
    <div className={cn("space-y-4", mode === "inline" && "pt-2 border-t")}>
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
        <Card className="border-2 overflow-hidden">
          <CardContent className="p-4 space-y-4">
            {/* Header with recommendation */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {(() => {
                  const config = recommendationConfig[analysis.recommendation];
                  const Icon = config.icon;
                  return (
                    <>
                      <div className={cn("p-2 rounded-full", config.color.split(" ")[0])}>
                        <Icon className={cn("h-5 w-5", config.iconColor)} />
                      </div>
                      <div>
                        <Badge className={config.color}>{config.label}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {analysis.shouldTakeAssessment
                            ? "This role would benefit from the assessment"
                            : "Assessment may not be necessary for this role"}
                        </p>
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

            {/* Scores */}
            <div className="grid gap-3 pt-2">
              <ScoreBar
                label="Team Collaboration"
                score={analysis.teamCollaborationScore}
                icon={Users}
              />
              <ScoreBar
                label="Leadership Complexity"
                score={analysis.leadershipComplexityScore}
                icon={Crown}
              />
              <ScoreBar
                label="Self-Awareness Value"
                score={analysis.selfAwarenessValueScore}
                icon={Brain}
              />
            </div>

            {/* Expandable details */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-muted-foreground"
              onClick={() => setShowDetails(!showDetails)}
            >
              <span>{showDetails ? "Hide details" : "Show details"}</span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showDetails && (
              <div className="space-y-4 pt-2 border-t">
                {/* Reasons */}
                {analysis.reasons.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Key Reasons:</p>
                    <ul className="space-y-1">
                      {analysis.reasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                {analysis.shouldTakeAssessment && analysis.benefits.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Benefits:
                    </p>
                    <ul className="space-y-1">
                      {analysis.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary">•</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested category */}
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
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
