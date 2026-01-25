import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getAssessmentQuestions, getCategoryDisplayName, type AssessmentCategory, type AssessmentType } from '@/lib/assessmentQuestionLoader';

interface AssessmentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  assessmentType: AssessmentType;
  assessmentCategory?: AssessmentCategory;
}

export default function AssessmentPreviewModal({ 
  open, 
  onClose, 
  assessmentType,
  assessmentCategory = 'professional'
}: AssessmentPreviewModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  const questions = getAssessmentQuestions(assessmentCategory, assessmentType);
  const currentQuestionData = questions[currentQuestion];
  const categoryName = getCategoryDisplayName(assessmentCategory);

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleClose = () => {
    setCurrentQuestion(0);
    onClose();
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Group questions by section for the overview
  const sections = questions.reduce((acc, q) => {
    if (!acc[q.section]) {
      acc[q.section] = [];
    }
    acc[q.section].push(q);
    return acc;
  }, {} as Record<string, typeof questions>);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              Preview: {categoryName} ({assessmentType === '25q' ? '25' : '50'}Q)
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            This is a preview only. No results will be saved.
          </p>
        </DialogHeader>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Question */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <Badge variant="secondary" className="mb-3">{currentQuestionData.section}</Badge>
            <h3 className="text-lg font-semibold mb-4">
              Q{currentQuestion + 1}. {currentQuestionData.question}
            </h3>
            
            <div className="space-y-2">
              {currentQuestionData.options.map((option, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg border bg-muted/30 flex items-start gap-3"
                >
                  <span className="font-medium text-muted-foreground min-w-[24px]">
                    {String.fromCharCode(97 + index)})
                  </span>
                  <span className="flex-1">{option.text}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs capitalize ${
                      option.color === 'yellow' ? 'border-yellow-500 text-yellow-600' :
                      option.color === 'red' ? 'border-red-500 text-red-600' :
                      option.color === 'green' ? 'border-green-500 text-green-600' :
                      'border-blue-500 text-blue-600'
                    }`}
                  >
                    {option.color}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-1">
            {Object.entries(sections).map(([section, sectionQuestions], sectionIndex) => (
              <div key={section} className="flex gap-0.5">
                {sectionQuestions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(q.id - 1)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentQuestion === q.id - 1 
                        ? 'bg-primary scale-125' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    title={`Question ${q.id}`}
                  />
                ))}
                {sectionIndex < Object.keys(sections).length - 1 && (
                  <div className="w-1" />
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={currentQuestion === questions.length - 1}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Section Overview */}
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-3">Section Overview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.entries(sections).map(([section, sectionQuestions]) => (
              <button
                key={section}
                onClick={() => setCurrentQuestion(sectionQuestions[0].id - 1)}
                className={`text-left p-3 rounded-lg border transition-all hover:bg-muted/50 ${
                  currentQuestionData.section === section ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <p className="font-medium text-sm">{section}</p>
                <p className="text-xs text-muted-foreground">
                  {sectionQuestions.length} questions (Q{sectionQuestions[0].id}-{sectionQuestions[sectionQuestions.length - 1].id})
                </p>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
