import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";

interface AssessmentDetailsProps {
  answers?: Array<{
    question_text: string;
    answer_text: string;
    color_weight?: any;
  }>;
  results?: any;
  type: string;
}

const AssessmentDetails = ({ answers, results, type }: AssessmentDetailsProps) => {
  const [showAnswers, setShowAnswers] = useState(false);

  const getColorLabel = (color: string) => {
    switch (color) {
      case 'yellow': return 'Action-first executor';
      case 'red': return 'Vision-driven motivator';
      case 'green': return 'Logic-based architect';
      case 'blue': return 'People-first supporter';
      default: return color;
    }
  };

  const getColorBadgeStyle = (color: string) => {
    switch (color) {
      case 'yellow': return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'red': return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'green': return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'blue': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-4">
      {/* Results Summary */}
      {results && (
        <Card className="shadow-elegant border-border/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Assessment Results Summary
              <Badge variant="outline" className="border-primary/30">
                {type}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.dominantColor && (
              <div className="space-y-2">
                <h4 className="font-semibold">Primary Leadership Role:</h4>
                <Badge className={getColorBadgeStyle(results.dominantColor)}>
                  {getColorLabel(results.dominantColor)}
                </Badge>
              </div>
            )}
            
            {results.secondaryColor && (
              <div className="space-y-2">
                <h4 className="font-semibold">Secondary Role:</h4>
                <Badge className={getColorBadgeStyle(results.secondaryColor)}>
                  {getColorLabel(results.secondaryColor)}
                </Badge>
              </div>
            )}

            {results.scores && (
              <div className="space-y-2">
                <h4 className="font-semibold">Score Breakdown:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(results.scores).map(([color, score]) => (
                    <div key={color} className="flex items-center justify-between p-2 rounded border">
                      <span className="capitalize">{getColorLabel(color)}:</span>
                      <Badge variant="outline">{
                        (() => {
                          const total = results.totalQuestions || (Object.values(results.scores) as number[]).reduce((sum: number, val: number) => sum + Number(val), 0);
                          const pct = total > 0 ? Math.round(((score as number) / total) * 100) : 0;
                          return `${pct}%`;
                        })()
                      }</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Individual Responses */}
      {answers && answers.length > 0 && (
        <Card className="shadow-elegant border-border/20">
          <CardHeader>
            <Collapsible open={showAnswers} onOpenChange={setShowAnswers}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <CardTitle className="flex items-center gap-2">
                    Your Responses ({answers.length} questions)
                    {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </CardTitle>
                  {showAnswers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-4">
                <CardContent className="space-y-4 p-0">
                  {answers.map((answer, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border/30 space-y-2">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="min-w-fit">
                          Q{index + 1}
                        </Badge>
                        <div className="space-y-2 flex-1">
                          <p className="font-medium text-sm">{answer.question_text}</p>
                          <p className="text-muted-foreground text-sm border-l-2 border-primary/30 pl-3">
                            {answer.answer_text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};

export default AssessmentDetails;