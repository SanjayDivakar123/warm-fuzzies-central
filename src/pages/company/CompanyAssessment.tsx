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

// 25Q Questions
const questions25Q = [
  { id: 1, section: "Leadership & Initiative", question: "When starting a new project, I usually…", options: [{ text: "Take immediate action and assign tasks", color: "yellow" }, { text: "Share the bigger vision and energize the team", color: "red" }, { text: "Build a structured plan step by step", color: "green" }, { text: "Brainstorm new and creative approaches", color: "blue" }] },
  { id: 2, section: "Leadership & Initiative", question: "The best leaders…", options: [{ text: "Drive execution and results", color: "yellow" }, { text: "Inspire with passion and communication", color: "red" }, { text: "Provide logic and clarity", color: "green" }, { text: "Innovate and reimagine possibilities", color: "blue" }] },
  { id: 3, section: "Leadership & Initiative", question: "When deadlines approach, I…", options: [{ text: "Push the team into focused action", color: "yellow" }, { text: "Rally people with encouragement and energy", color: "red" }, { text: "Reorganize priorities logically", color: "green" }, { text: "Find creative shortcuts to achieve goals", color: "blue" }] },
  { id: 4, section: "Leadership & Initiative", question: "My colleagues usually describe me as…", options: [{ text: "The one who makes things happen", color: "yellow" }, { text: "The one who motivates and uplifts", color: "red" }, { text: "The one who keeps things organized", color: "green" }, { text: "The one who brings innovative ideas", color: "blue" }] },
  { id: 5, section: "Leadership & Initiative", question: "I feel most accomplished when…", options: [{ text: "Results are achieved quickly", color: "yellow" }, { text: "People are inspired by my work", color: "red" }, { text: "Systems are clear and efficient", color: "green" }, { text: "Something new and original is created", color: "blue" }] },
  { id: 6, section: "Collaboration & Communication", question: "In team discussions, I tend to…", options: [{ text: "Push toward decisions and action", color: "yellow" }, { text: "Motivate and energize others", color: "red" }, { text: "Clarify details and structure", color: "green" }, { text: 'Ask bold, creative "what if" questions', color: "blue" }] },
  { id: 7, section: "Collaboration & Communication", question: "My teammates rely on me for…", options: [{ text: "Speed and reliability", color: "yellow" }, { text: "Energy and encouragement", color: "red" }, { text: "Organization and logic", color: "green" }, { text: "Creative problem-solving", color: "blue" }] },
  { id: 8, section: "Collaboration & Communication", question: "My communication style is…", options: [{ text: "Direct and action-oriented", color: "yellow" }, { text: "Enthusiastic and persuasive", color: "red" }, { text: "Clear and precise", color: "green" }, { text: "Conceptual and visionary", color: "blue" }] },
  { id: 9, section: "Collaboration & Communication", question: "I get frustrated when…", options: [{ text: "Projects stall without action", color: "yellow" }, { text: "People lack passion or motivation", color: "red" }, { text: "Details are overlooked", color: "green" }, { text: "Innovation is resisted", color: "blue" }] },
  { id: 10, section: "Collaboration & Communication", question: "My role in teams is usually…", options: [{ text: "The driver who executes", color: "yellow" }, { text: "The motivator who inspires", color: "red" }, { text: "The organizer who structures", color: "green" }, { text: "The innovator who creates", color: "blue" }] },
  { id: 11, section: "Problem-Solving & Decision-Making", question: "When solving problems, my first step is to…", options: [{ text: "Act quickly and test a solution", color: "yellow" }, { text: "Motivate others to stay positive", color: "red" }, { text: "Break it down into logical steps", color: "green" }, { text: "Reframe the issue creatively", color: "blue" }] },
  { id: 12, section: "Problem-Solving & Decision-Making", question: "I trust decisions when…", options: [{ text: "They produce fast results", color: "yellow" }, { text: "They inspire and energize others", color: "red" }, { text: "They are backed by logic and data", color: "green" }, { text: "They open new opportunities", color: "blue" }] },
  { id: 13, section: "Problem-Solving & Decision-Making", question: "My problem-solving strength is…", options: [{ text: "Speed and determination", color: "yellow" }, { text: "Motivation and optimism", color: "red" }, { text: "Structure and clarity", color: "green" }, { text: "Creativity and originality", color: "blue" }] },
  { id: 14, section: "Problem-Solving & Decision-Making", question: "In debates, I…", options: [{ text: "Push for a resolution quickly", color: "yellow" }, { text: "Persuade with passion and stories", color: "red" }, { text: "Use facts and logic", color: "green" }, { text: "Share new perspectives and ideas", color: "blue" }] },
  { id: 15, section: "Problem-Solving & Decision-Making", question: "If my plan fails, I…", options: [{ text: "Try another approach immediately", color: "yellow" }, { text: "Encourage others not to give up", color: "red" }, { text: "Reanalyze carefully step by step", color: "green" }, { text: "Redesign it with creativity", color: "blue" }] },
  { id: 16, section: "Adaptability & Innovation", question: "When unexpected changes happen, I…", options: [{ text: "Adjust quickly and keep moving", color: "yellow" }, { text: "Stay positive and encourage others", color: "red" }, { text: "Re-plan logically", color: "green" }, { text: "Pivot to a creative alternative", color: "blue" }] },
  { id: 17, section: "Adaptability & Innovation", question: "I learn best when…", options: [{ text: "I can apply it immediately", color: "yellow" }, { text: "It connects to purpose and people", color: "red" }, { text: "It's explained step by step", color: "green" }, { text: "It allows me to experiment", color: "blue" }] },
  { id: 18, section: "Adaptability & Innovation", question: "I'm most energized when…", options: [{ text: "Projects are moving fast", color: "yellow" }, { text: "People are motivated and connected", color: "red" }, { text: "Work is organized and structured", color: "green" }, { text: "There's space to innovate", color: "blue" }] },
  { id: 19, section: "Adaptability & Innovation", question: "The workplace projects I enjoy most are…", options: [{ text: "Goal-driven and fast-paced", color: "yellow" }, { text: "Energizing and people-centered", color: "red" }, { text: "Structured and methodical", color: "green" }, { text: "Open-ended and innovative", color: "blue" }] },
  { id: 20, section: "Adaptability & Innovation", question: "If plans are interrupted, I…", options: [{ text: "Act quickly with a backup", color: "yellow" }, { text: "Keep others motivated", color: "red" }, { text: "Re-plan step by step", color: "green" }, { text: "Pivot to a fresh idea", color: "blue" }] },
  { id: 21, section: "Self-Awareness & Reflection", question: "My biggest professional strength is…", options: [{ text: "Getting things done", color: "yellow" }, { text: "Inspiring others", color: "red" }, { text: "Thinking logically", color: "green" }, { text: "Creating new ideas", color: "blue" }] },
  { id: 22, section: "Self-Awareness & Reflection", question: "I measure success by…", options: [{ text: "The results achieved", color: "yellow" }, { text: "The people inspired", color: "red" }, { text: "The systems improved", color: "green" }, { text: "The innovations created", color: "blue" }] },
  { id: 23, section: "Self-Awareness & Reflection", question: "I get frustrated when…", options: [{ text: "Action is delayed", color: "yellow" }, { text: "Passion is missing", color: "red" }, { text: "Plans lack structure", color: "green" }, { text: "Creativity is blocked", color: "blue" }] },
  { id: 24, section: "Self-Awareness & Reflection", question: "My colleagues usually notice that I…", options: [{ text: "Drive things into action", color: "yellow" }, { text: "Motivate with enthusiasm", color: "red" }, { text: "Keep things organized", color: "green" }, { text: "Offer creative ideas", color: "blue" }] },
  { id: 25, section: "Self-Awareness & Reflection", question: "Ultimately, I want to be known as…", options: [{ text: "A doer who delivers results", color: "yellow" }, { text: "A motivator who inspires others", color: "red" }, { text: "A thinker who brings order", color: "green" }, { text: "A creator who innovates", color: "blue" }] },
];

// 50Q Questions (condensed for brevity - same structure)
const questions50Q = [
  ...questions25Q,
  { id: 26, section: "Leadership & Initiative", question: "In leadership, I value most…", options: [{ text: "Efficiency and action", color: "yellow" }, { text: "Energy and vision", color: "red" }, { text: "Structure and clarity", color: "green" }, { text: "Innovation and experimentation", color: "blue" }] },
  { id: 27, section: "Leadership & Initiative", question: "When others are uncertain, I…", options: [{ text: "Decide quickly and act", color: "yellow" }, { text: "Encourage them with positivity", color: "red" }, { text: "Provide data and logic", color: "green" }, { text: "Suggest new ways forward", color: "blue" }] },
  { id: 28, section: "Leadership & Initiative", question: "My natural instinct is to…", options: [{ text: "Act first and adjust later", color: "yellow" }, { text: "Inspire with stories and energy", color: "red" }, { text: "Analyze carefully before moving ahead", color: "green" }, { text: "Explore new, unconventional ideas", color: "blue" }] },
  { id: 29, section: "Leadership & Initiative", question: "Success in leadership means…", options: [{ text: "Achieving results consistently", color: "yellow" }, { text: "Motivating people to reach their best", color: "red" }, { text: "Building reliable systems", color: "green" }, { text: "Creating a culture of innovation", color: "blue" }] },
  { id: 30, section: "Leadership & Initiative", question: "When a project begins, I focus on…", options: [{ text: "Defining immediate next steps", color: "yellow" }, { text: "Sharing the vision and purpose", color: "red" }, { text: "Establishing structure and timelines", color: "green" }, { text: "Designing creative strategies to differentiate", color: "blue" }] },
  { id: 31, section: "Collaboration & Communication", question: "If conflict arises, I…", options: [{ text: "Push toward a fast resolution", color: "yellow" }, { text: "Use positivity to bring people together", color: "red" }, { text: "Analyze both perspectives logically", color: "green" }, { text: "Reframe with a creative solution", color: "blue" }] },
  { id: 32, section: "Collaboration & Communication", question: "I contribute best when…", options: [{ text: "Driving projects into action", color: "yellow" }, { text: "Inspiring people toward goals", color: "red" }, { text: "Creating order and clarity", color: "green" }, { text: "Bringing fresh, creative ideas", color: "blue" }] },
  { id: 33, section: "Collaboration & Communication", question: "My colleagues count on me for…", options: [{ text: "Speed and reliability", color: "yellow" }, { text: "Enthusiasm and morale-boosting", color: "red" }, { text: "Accuracy and structure", color: "green" }, { text: "Vision and creative problem-solving", color: "blue" }] },
  { id: 34, section: "Collaboration & Communication", question: "I dislike when team members…", options: [{ text: "Waste time without acting", color: "yellow" }, { text: "Lack energy or motivation", color: "red" }, { text: "Ignore important details", color: "green" }, { text: "Resist new ideas", color: "blue" }] },
  { id: 35, section: "Collaboration & Communication", question: "In presentations, I prefer to…", options: [{ text: "Share results and progress", color: "yellow" }, { text: "Inspire the audience with passion", color: "red" }, { text: "Explain the logic and data clearly", color: "green" }, { text: "Highlight innovative, creative elements", color: "blue" }] },
  { id: 36, section: "Problem-Solving & Decision-Making", question: "My strength in decision-making is…", options: [{ text: "Acting quickly with confidence", color: "yellow" }, { text: "Persuading with energy and vision", color: "red" }, { text: "Using facts and analysis", color: "green" }, { text: "Reframing challenges innovatively", color: "blue" }] },
  { id: 37, section: "Problem-Solving & Decision-Making", question: "When a mistake happens, I…", options: [{ text: "Fix it immediately and move on", color: "yellow" }, { text: "Keep morale high and encourage the team", color: "red" }, { text: "Analyze carefully what went wrong", color: "green" }, { text: "Pivot into a new solution creatively", color: "blue" }] },
  { id: 38, section: "Problem-Solving & Decision-Making", question: "In high-pressure situations, I…", options: [{ text: "Take control and push forward", color: "yellow" }, { text: "Motivate others to stay calm and positive", color: "red" }, { text: "Focus on logic and steps", color: "green" }, { text: "Look for unconventional alternatives", color: "blue" }] },
  { id: 39, section: "Problem-Solving & Decision-Making", question: "I prefer instructions that are…", options: [{ text: "Clear and actionable", color: "yellow" }, { text: "Inspirational and people-centered", color: "red" }, { text: "Detailed and systematic", color: "green" }, { text: "Flexible and open-ended", color: "blue" }] },
  { id: 40, section: "Problem-Solving & Decision-Making", question: "In decision-making groups, I…", options: [{ text: "Push for fast decisions", color: "yellow" }, { text: "Advocate passionately for ideas", color: "red" }, { text: "Provide logic and structure", color: "green" }, { text: "Introduce new perspectives", color: "blue" }] },
  { id: 41, section: "Adaptability & Innovation", question: "I handle unexpected changes by…", options: [{ text: "Acting quickly to adjust", color: "yellow" }, { text: "Keeping the team positive", color: "red" }, { text: "Reworking plans step by step", color: "green" }, { text: "Pivoting to a new creative solution", color: "blue" }] },
  { id: 42, section: "Adaptability & Innovation", question: "I enjoy projects that are…", options: [{ text: "Fast-paced and goal-driven", color: "yellow" }, { text: "Inspiring and people-focused", color: "red" }, { text: "Structured and methodical", color: "green" }, { text: "Open-ended and innovative", color: "blue" }] },
  { id: 43, section: "Adaptability & Innovation", question: "I stay motivated when…", options: [{ text: "Progress is visible", color: "yellow" }, { text: "The energy around me is high", color: "red" }, { text: "The work is organized logically", color: "green" }, { text: "I get to innovate and create", color: "blue" }] },
  { id: 44, section: "Adaptability & Innovation", question: "My adaptability comes from…", options: [{ text: "Taking decisive action", color: "yellow" }, { text: "Staying optimistic and encouraging others", color: "red" }, { text: "Adjusting logically step by step", color: "green" }, { text: "Rethinking situations creatively", color: "blue" }] },
  { id: 45, section: "Adaptability & Innovation", question: "When trying new methods, I…", options: [{ text: "Test them quickly in practice", color: "yellow" }, { text: "Share enthusiasm to get buy-in", color: "red" }, { text: "Research carefully before implementing", color: "green" }, { text: "Experiment and see what happens", color: "blue" }] },
  { id: 46, section: "Self-Awareness & Reflection", question: "My biggest strength is…", options: [{ text: "Taking action and execution", color: "yellow" }, { text: "Inspiring others", color: "red" }, { text: "Logical problem-solving", color: "green" }, { text: "Creative thinking", color: "blue" }] },
  { id: 47, section: "Self-Awareness & Reflection", question: "I measure my growth by…", options: [{ text: "Goals I've achieved", color: "yellow" }, { text: "Relationships I've built", color: "red" }, { text: "Skills I've mastered", color: "green" }, { text: "Ideas I've created", color: "blue" }] },
  { id: 48, section: "Self-Awareness & Reflection", question: "Feedback is valuable when it's…", options: [{ text: "Direct and actionable", color: "yellow" }, { text: "Encouraging and motivating", color: "red" }, { text: "Logical and specific", color: "green" }, { text: "Creative and forward-looking", color: "blue" }] },
  { id: 49, section: "Self-Awareness & Reflection", question: "In five years, I hope to be…", options: [{ text: "Achieving big results", color: "yellow" }, { text: "Inspiring many people", color: "red" }, { text: "A master of my field", color: "green" }, { text: "Known for innovation", color: "blue" }] },
  { id: 50, section: "Self-Awareness & Reflection", question: "Ultimately, I want to be known as…", options: [{ text: "Someone who gets things done", color: "yellow" }, { text: "Someone who inspires others", color: "red" }, { text: "Someone who brings order", color: "green" }, { text: "Someone who creates new possibilities", color: "blue" }] },
];

export default function CompanyAssessment() {
  const { company, employee, loading, setEmployee } = useCompanyPortal();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved progress and employee from localStorage
  useEffect(() => {
    if (company) {
      const savedProgress = localStorage.getItem(`assessment_progress_${company.subdomain}`);
      if (savedProgress) {
        const { currentQuestion: savedQ, answers: savedA } = JSON.parse(savedProgress);
        setCurrentQuestion(savedQ);
        setAnswers(savedA);
        setSelectedAnswer(savedA[savedQ] || "");
      }

      // Load employee if not in context
      if (!employee) {
        const savedEmployee = localStorage.getItem(`employee_${company.subdomain}`);
        if (savedEmployee) {
          setEmployee(JSON.parse(savedEmployee));
        }
      }
    }
  }, [company, employee, setEmployee]);

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
      
      // Check if assessment already completed (one-time only)
      const storedResults = localStorage.getItem(`companyAssessmentResults_${company.subdomain}`);
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

  const questions = company.assessment_type === '50q' ? questions50Q : questions25Q;
  const primaryColor = company.primary_color || '#9b87f5';

  const handleAnswer = (color: string) => {
    setSelectedAnswer(color);
  };

  const saveProgress = (newAnswers: { [key: number]: string }, newQuestion: number) => {
    localStorage.setItem(`assessment_progress_${company.subdomain}`, JSON.stringify({
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

        // Save results to localStorage
        localStorage.setItem(`companyAssessmentResults_${company.subdomain}`, JSON.stringify(results));
        
        // Save to database and update company_users record
        if (employee) {
          try {
            // First, insert into assessment_results table
            const { data: assessmentResult, error: insertError } = await supabase
              .from('assessment_results')
              .insert({
                user_id: employee.user_id || employee.id, // Use user_id if available
                assessment_type: `professional_${company.assessment_type}`,
                results: results as any
              })
              .select('id')
              .single();

            if (insertError) {
              console.error('Error saving assessment results:', insertError);
            }

            // Then update company_users with the assessment result reference
            const { error: updateError } = await supabase
              .from('company_users')
              .update({
                assessment_completed_at: new Date().toISOString(),
                assessment_result_id: assessmentResult?.id || null,
                status: 'active'
              })
              .eq('id', employee.id);

            if (updateError) {
              console.error('Error updating employee record:', updateError);
            }
          } catch (err) {
            console.error('Error saving assessment:', err);
          }
        }

        // Clear progress
        localStorage.removeItem(`assessment_progress_${company.subdomain}`);
        
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
