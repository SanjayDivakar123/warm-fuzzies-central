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
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'red': return 'bg-red-100 text-red-800 border-red-300';
      case 'green': return 'bg-green-100 text-green-800 border-green-300';
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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
                      <Badge variant="outline">{score as number}%</Badge>
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