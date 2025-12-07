import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Building2, Loader2 } from "lucide-react";
import { useCompanyPortal } from "@/contexts/CompanyPortalContext";
import { shuffleArray } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { professionalQuestions25Q, professionalQuestions50Q } from "@/lib/professionalAssessmentQuestions";

export default function CompanyAssessment() {
  const { company, employee, loading, setEmployee } = useCompanyPortal();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get storage key with employee ID for per-employee state
  const getStorageKey = (prefix: string) => {
    const employeeId = employee?.id || localStorage.getItem(`current_employee_id_${company?.subdomain}`);
    return `${prefix}_${company?.subdomain}_${employeeId}`;
  };

  // Load employee if not in context
  useEffect(() => {
    if (company && !employee) {
      const savedEmployee = localStorage.getItem(`employee_${company.subdomain}`);
      if (savedEmployee) {
        const parsed = JSON.parse(savedEmployee);
        setEmployee(parsed);
        localStorage.setItem(`current_employee_id_${company.subdomain}`, parsed.id);
      }
    }
  }, [company, employee, setEmployee]);

  // Load saved progress from localStorage (per employee)
  useEffect(() => {
    if (company && employee) {
      localStorage.setItem(`current_employee_id_${company.subdomain}`, employee.id);
      const savedProgress = localStorage.getItem(getStorageKey('assessment_progress'));
      if (savedProgress) {
        const { currentQuestion: savedQ, answers: savedA } = JSON.parse(savedProgress);
        setCurrentQuestion(savedQ);
        setAnswers(savedA);
        setSelectedAnswer(savedA[savedQ] || "");
      }
    }
  }, [company, employee]);

  // Redirect if no employee or if already completed
  useEffect(() => {
    if (!loading && company) {
      if (!employee) {
        const savedEmployee = localStorage.getItem(`employee_${company.subdomain}`);
        if (!savedEmployee) {
          navigate(`/company/${company.subdomain}/login`);
          return;
        }
      }
      }
      
      // Check if assessment already completed (per employee)
      if (employee) {
        const storedResults = localStorage.getItem(`companyAssessmentResults_${company.subdomain}_${employee.id}`);
        if (storedResults) {
          navigate(`/company/${company.subdomain}/home`);
      }
    }
  }, [loading, company, employee, navigate]);

  if (loading || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const questions = company.assessment_type === '50q' ? professionalQuestions50Q : professionalQuestions25Q;
  const primaryColor = company.primary_color || '#9b87f5';

  const handleAnswer = (color: string) => {
    setSelectedAnswer(color);
  };

  const saveProgress = (newAnswers: { [key: number]: string }, newQuestion: number) => {
    localStorage.setItem(getStorageKey('assessment_progress'), JSON.stringify({
      currentQuestion: newQuestion,
      answers: newAnswers
    }));
  };

  const handleNext = async () => {
    if (selectedAnswer) {
      const newAnswers = { ...answers, [currentQuestion]: selectedAnswer };
      setAnswers(newAnswers);
      setSelectedAnswer("");

      if (currentQuestion < questions.length - 1) {
        const nextQuestion = currentQuestion + 1;
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(newAnswers[nextQuestion] || "");
        saveProgress(newAnswers, nextQuestion);
      } else {
        // Complete assessment
        setIsSubmitting(true);
        
        const colorCounts = { yellow: 0, red: 0, green: 0, blue: 0 };
        Object.values(newAnswers).forEach((color) => {
          colorCounts[color as keyof typeof colorCounts]++;
        });

        const dominantColor = Object.entries(colorCounts).reduce((a, b) =>
          colorCounts[a[0] as keyof typeof colorCounts] > colorCounts[b[0] as keyof typeof colorCounts] ? a : b
        )[0];

        const results = {
          dominantColor,
          scores: colorCounts,
          totalQuestions: questions.length,
          assessmentType: `professional_${company.assessment_type}`,
          companyId: company.id,
          companyName: company.name,
          completedAt: new Date().toISOString()
        };

        // Save results to localStorage (per employee)
        localStorage.setItem(`companyAssessmentResults_${company.subdomain}_${employee?.id}`, JSON.stringify(results));
        
        // Save to database via edge function (bypasses RLS)
        if (employee) {
          try {
            const { data, error: fnError } = await supabase.functions.invoke('save-company-assessment', {
              body: {
                employeeId: employee.id,
                companyId: company.id,
                results: results
              }
            });

            if (fnError || !data?.success) {
              console.error('Error saving assessment:', fnError || data?.message);
            } else {
              console.log('Assessment saved successfully:', data.assessmentResultId);
            }
          } catch (err) {
            console.error('Error saving assessment:', err);
          }
        }

        // Clear progress (per employee)
        localStorage.removeItem(getStorageKey('assessment_progress'));
        
        toast({
          title: "Assessment Complete!",
          description: "Your results are ready to view."
        });
        
        navigate(`/company/${company.subdomain}/home`);
        setIsSubmitting(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const prevQuestion = currentQuestion - 1;
      setCurrentQuestion(prevQuestion);
      setSelectedAnswer(answers[prevQuestion] || "");
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQuestionData = questions[currentQuestion];
  
  const shuffledOptions = useMemo(() => {
    return shuffleArray(currentQuestionData.options);
  }, [currentQuestion]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const keyMap: { [key: string]: number } = { '1': 0, '2': 1, '3': 2, '4': 3 };
      const index = keyMap[e.key];
      
      if (index !== undefined && shuffledOptions[index]) {
        handleAnswer(shuffledOptions[index].color);
      }
      
      if (e.key === 'Enter' && selectedAnswer) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestion, shuffledOptions, selectedAnswer]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-4 px-4 border-b" style={{ borderColor: `${primaryColor}20` }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-8 w-auto" />
          ) : (
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
              <Building2 className="h-4 w-4 text-white" />
            </div>
          )}
          <span className="font-semibold">{company.name}</span>
        </div>
      </header>

      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                  <span className="text-white font-bold text-lg">{currentQuestion + 1}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Professional Assessment</h2>
                  <p className="text-muted-foreground">Question {currentQuestion + 1} of {questions.length}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-base px-4 py-2">
                {Math.round(progress)}% Complete
              </Badge>
            </div>
            
            <div className="h-3 bg-muted/40 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: primaryColor }}
              />
            </div>
          </div>

          {/* Question Card */}
          <Card className="rounded-2xl shadow-lg border-2 mb-8" style={{ borderColor: `${primaryColor}20` }}>
            <CardHeader className="pb-4">
              <Badge variant="secondary" className="w-fit mb-2">{currentQuestionData.section}</Badge>
              <CardTitle className="text-xl lg:text-2xl">{currentQuestionData.question}</CardTitle>
            </CardHeader>
            
            <CardContent className="pb-6">
              <RadioGroup value={selectedAnswer} onValueChange={handleAnswer} className="space-y-3">
                {shuffledOptions.map((option, index) => (
                  <div 
                    key={index} 
                    className={`group relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedAnswer === option.color 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border/50 hover:border-primary/40'
                    }`}
                    onClick={() => handleAnswer(option.color)}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={option.color} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        <span className="text-xs text-muted-foreground mr-2">[{index + 1}]</span>
                        {option.text}
                      </Label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <p className="text-sm text-muted-foreground">
              Press 1-4 to select, Enter to continue
            </p>

            <Button
              onClick={handleNext}
              disabled={!selectedAnswer || isSubmitting}
              style={{ backgroundColor: selectedAnswer ? primaryColor : undefined }}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : currentQuestion === questions.length - 1 ? (
                'Complete'
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
