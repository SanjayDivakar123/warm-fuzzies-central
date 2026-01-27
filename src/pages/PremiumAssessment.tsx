import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAssessmentProgress } from "@/hooks/useAssessmentProgress";
import { ResumeProgressModal } from "@/components/assessment/ResumeProgressModal";
import { AutoSaveIndicator } from "@/components/assessment/AutoSaveIndicator";
import { PauseButton } from "@/components/assessment/PauseButton";

// Utility function to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Use first 25 questions from the main quiz
const premiumQuestions = [
  // Forming Stage Questions (Building Connection)
  {
    id: 1,
    stage: "Forming",
    question: "When building connection in a new team, you naturally:",
    options: [
      { text: "Take charge and set clear direction from day one", color: "yellow" },
      { text: "Create energy and enthusiasm to bring people together", color: "red" },
      { text: "Analyze team dynamics and establish structured processes", color: "green" },
      { text: "Focus on understanding each person and building trust", color: "blue" },
    ],
  },
  {
    id: 2,
    stage: "Forming",
    question: "In the early stages of team formation, you prefer to:",
    options: [
      { text: "Set ambitious goals and drive toward immediate results", color: "yellow" },
      { text: "Share an inspiring vision to align everyone's energy", color: "red" },
      { text: "Create clear roles, expectations, and communication protocols", color: "green" },
      { text: "Ensure everyone feels welcomed and heard in the process", color: "blue" },
    ],
  },
  {
    id: 3,
    stage: "Forming",
    question: "When establishing team foundations, you focus on:",
    options: [
      { text: "Quick wins that build momentum and credibility", color: "yellow" },
      { text: "Creating excitement about what the team can achieve", color: "red" },
      { text: "Building systematic approaches and documentation", color: "green" },
      { text: "Creating psychological safety and open communication", color: "blue" },
    ],
  },
  {
    id: 4,
    stage: "Forming",
    question: "Your approach to initial team meetings is:",
    options: [
      { text: "Keep them brief, action-oriented, and results-focused", color: "yellow" },
      { text: "Make them energizing with big picture vision sharing", color: "red" },
      { text: "Structure them with clear agendas and follow-up plans", color: "green" },
      { text: "Use them to build relationships and understand perspectives", color: "blue" },
    ],
  },
  {
    id: 5,
    stage: "Forming",
    question: "When new team members join, you:",
    options: [
      { text: "Get them productive and contributing quickly", color: "yellow" },
      { text: "Inspire them with the team's mission and possibilities", color: "red" },
      { text: "Provide comprehensive orientation and training", color: "green" },
      { text: "Connect them personally and help them find their place", color: "blue" },
    ],
  },

  // Storming Stage Questions (Navigating Friction)
  {
    id: 6,
    stage: "Storming",
    question: "When navigating friction and conflict in teams, you typically:",
    options: [
      { text: "Push through obstacles with decisive action", color: "yellow" },
      { text: "Reframe conflict as creative tension and opportunity", color: "red" },
      { text: "Analyze root causes and create systematic solutions", color: "green" },
      { text: "Listen to all perspectives and help people find common ground", color: "blue" },
    ],
  },
  {
    id: 7,
    stage: "Storming",
    question: "When team members disagree on direction, you:",
    options: [
      { text: "Make the decision quickly to maintain momentum", color: "yellow" },
      { text: "Help the team see beyond current disagreements to future possibilities", color: "red" },
      { text: "Facilitate structured debate using data and analysis", color: "green" },
      { text: "Ensure all voices are heard before finding consensus", color: "blue" },
    ],
  },
  {
    id: 8,
    stage: "Storming",
    question: "Your approach to managing competing priorities is:",
    options: [
      { text: "Cut through complexity with clear executive decisions", color: "yellow" },
      { text: "Find creative ways to satisfy multiple objectives", color: "red" },
      { text: "Use systematic evaluation criteria to prioritize objectively", color: "green" },
      { text: "Help stakeholders understand each other's needs", color: "blue" },
    ],
  },
  {
    id: 9,
    stage: "Storming",
    question: "When personality conflicts arise, you:",
    options: [
      { text: "Address the issue directly to restore team effectiveness", color: "yellow" },
      { text: "Help people see how their differences can be complementary", color: "red" },
      { text: "Create clear behavioral guidelines and expectations", color: "green" },
      { text: "Coach individuals to understand and appreciate different styles", color: "blue" },
    ],
  },
  {
    id: 10,
    stage: "Storming",
    question: "During challenging negotiations within the team, you:",
    options: [
      { text: "Focus on reaching agreements that move things forward", color: "yellow" },
      { text: "Look for breakthrough solutions that transcend current positions", color: "red" },
      { text: "Prepare thoroughly with facts and logical frameworks", color: "green" },
      { text: "Build rapport and find mutually acceptable solutions", color: "blue" },
    ],
  },

  // Norming Stage Questions (Establishing Flow)
  {
    id: 11,
    stage: "Norming",
    question: "When establishing flow and team norms, you prefer to:",
    options: [
      { text: "Drive execution and maintain momentum toward goals", color: "yellow" },
      { text: "Inspire the team with vision and creative possibilities", color: "red" },
      { text: "Build logical systems and clear operational processes", color: "green" },
      { text: "Ensure everyone feels heard and supported in the process", color: "blue" },
    ],
  },
  {
    id: 12,
    stage: "Norming",
    question: "Your approach to creating team standards is:",
    options: [
      { text: "Set high performance benchmarks that drive results", color: "yellow" },
      { text: "Establish inspiring principles that guide creative work", color: "red" },
      { text: "Develop comprehensive quality frameworks and metrics", color: "green" },
      { text: "Build collaborative agreements that everyone can embrace", color: "blue" },
    ],
  },
  {
    id: 13,
    stage: "Norming",
    question: "When establishing communication patterns, you emphasize:",
    options: [
      { text: "Efficient information flow that supports quick decisions", color: "yellow" },
      { text: "Open sharing of ideas and creative inspiration", color: "red" },
      { text: "Structured reporting and documentation systems", color: "green" },
      { text: "Regular check-ins and relationship maintenance", color: "blue" },
    ],
  },
  {
    id: 14,
    stage: "Norming",
    question: "Your ideal team rhythm includes:",
    options: [
      { text: "Fast-paced cycles with regular performance reviews", color: "yellow" },
      { text: "Dynamic sprints balanced with creative exploration time", color: "red" },
      { text: "Consistent processes with systematic improvement cycles", color: "green" },
      { text: "Regular team building and individual development activities", color: "blue" },
    ],
  },
  {
    id: 15,
    stage: "Norming",
    question: "When team workflows need adjustment, you:",
    options: [
      { text: "Quickly implement changes that improve efficiency", color: "yellow" },
      { text: "Encourage experimentation with innovative approaches", color: "red" },
      { text: "Analyze current processes and design systematic improvements", color: "green" },
      { text: "Involve the team in co-creating better ways of working", color: "blue" },
    ],
  },

  // Performing Stage Questions (Reaching Peak Productivity)
  {
    id: 16,
    stage: "Performing",
    question: "When the team reaches peak productivity, you focus on:",
    options: [
      { text: "Pushing for even higher performance and results", color: "yellow" },
      { text: "Channeling energy toward breakthrough innovations", color: "red" },
      { text: "Optimizing systems for sustainable excellence", color: "green" },
      { text: "Maintaining team cohesion while celebrating achievements", color: "blue" },
    ],
  },
  {
    id: 17,
    stage: "Performing",
    question: "Your approach to sustaining high performance is:",
    options: [
      { text: "Continuously raise the bar and challenge the team", color: "yellow" },
      { text: "Keep the team inspired with evolving visions", color: "red" },
      { text: "Monitor metrics and fine-tune processes regularly", color: "green" },
      { text: "Invest in team development and prevent burnout", color: "blue" },
    ],
  },
  {
    id: 18,
    stage: "Performing",
    question: "When delegating to high-performing team members, you:",
    options: [
      { text: "Set clear outcomes and trust them to deliver", color: "yellow" },
      { text: "Inspire them with the bigger picture and purpose", color: "red" },
      { text: "Provide frameworks while allowing creative execution", color: "green" },
      { text: "Match assignments to individual strengths and interests", color: "blue" },
    ],
  },
  {
    id: 19,
    stage: "Performing",
    question: "Your leadership style during peak performance is:",
    options: [
      { text: "Strategic direction with operational autonomy", color: "yellow" },
      { text: "Visionary guidance with creative empowerment", color: "red" },
      { text: "Systematic oversight with quality assurance", color: "green" },
      { text: "Supportive coaching with individual development", color: "blue" },
    ],
  },
  {
    id: 20,
    stage: "Performing",
    question: "When scaling successful team practices, you:",
    options: [
      { text: "Rapidly implement proven approaches across organizations", color: "yellow" },
      { text: "Adapt and innovate practices for different contexts", color: "green" },
      { text: "Document and systematize methods for consistent replication", color: "green" },
      { text: "Help other teams understand the cultural elements behind success", color: "blue" },
    ],
  },

  // Adjourning Stage Questions (Ending with Clarity)
  {
    id: 21,
    stage: "Adjourning",
    question: "When projects or teams come to an end, you focus on:",
    options: [
      { text: "Capturing results and lessons for future efficiency", color: "yellow" },
      { text: "Celebrating achievements and inspiring future possibilities", color: "red" },
      { text: "Documenting processes and creating knowledge repositories", color: "green" },
      { text: "Honoring relationships and supporting individual transitions", color: "blue" },
    ],
  },
  {
    id: 22,
    stage: "Adjourning",
    question: "Your approach to project closure includes:",
    options: [
      { text: "Quick transition to next priorities with clear handoffs", color: "yellow" },
      { text: "Reflection on impact and vision for future endeavors", color: "red" },
      { text: "Comprehensive documentation and systematic evaluation", color: "green" },
      { text: "Team appreciation and individual career development discussions", color: "blue" },
    ],
  },
  {
    id: 23,
    stage: "Adjourning",
    question: "When team members transition to new roles, you:",
    options: [
      { text: "Ensure smooth handoffs that maintain business continuity", color: "yellow" },
      { text: "Help them envision how their experience contributes to future success", color: "red" },
      { text: "Create detailed transition plans and knowledge transfer protocols", color: "green" },
      { text: "Provide mentoring and support during their career transition", color: "blue" },
    ],
  },
  {
    id: 24,
    stage: "Adjourning",
    question: "Your legacy focus when completing major initiatives is:",
    options: [
      { text: "Measurable impact and organizational capability building", color: "yellow" },
      { text: "Cultural change and inspiration for continued innovation", color: "red" },
      { text: "Sustainable systems and institutional knowledge", color: "green" },
      { text: "Developed people and strengthened relationships", color: "blue" },
    ],
  },
  {
    id: 25,
    stage: "Adjourning",
    question: "When reflecting on team experiences, you measure success by:",
    options: [
      { text: "Achievement of concrete goals and organizational results", color: "yellow" },
      { text: "Breakthrough innovations and positive transformation", color: "red" },
      { text: "Process improvements and sustainable operational excellence", color: "green" },
      { text: "Individual growth and strengthened organizational relationships", color: "blue" },
    ],
  },
];

const PremiumAssessment = () => {
  const navigate = useNavigate();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [shuffledQuestions, setShuffledQuestions] = useState(premiumQuestions);
  const [shuffledOptions, setShuffledOptions] = useState<{ [key: number]: any[] }>({});
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Auto-save hook
  const {
    isLoading: progressLoading,
    savedProgress,
    lastSaved,
    isSaving,
    saveProgress,
    clearProgress,
    markComplete,
    hasProgress,
  } = useAssessmentProgress({
    assessmentType: 'premium',
    totalQuestions: premiumQuestions.length,
  });

  // Initialize with shuffled questions and options
  useEffect(() => {
    const shuffled = shuffleArray(premiumQuestions);
    setShuffledQuestions(shuffled);
    
    // Create shuffled options for each question
    const optionsMap: { [key: number]: any[] } = {};
    shuffled.forEach((question, index) => {
      optionsMap[index] = shuffleArray(question.options);
    });
    setShuffledOptions(optionsMap);
  }, []);

  // Show resume modal if there's saved progress
  useEffect(() => {
    if (!progressLoading && hasProgress && !initialized) {
      setShowResumeModal(true);
    } else if (!progressLoading && !hasProgress) {
      setInitialized(true);
    }
  }, [progressLoading, hasProgress, initialized]);

  // Auto-save on answer changes
  useEffect(() => {
    if (initialized && Object.keys(answers).length > 0) {
      saveProgress(currentQuestion, answers);
    }
  }, [answers, currentQuestion, initialized]);

  const handleResume = useCallback(() => {
    if (savedProgress) {
      setAnswers(savedProgress.answers);
      setCurrentQuestion(savedProgress.currentQuestion);
      setSelectedAnswer(savedProgress.answers[savedProgress.currentQuestion] || "");
    }
    setShowResumeModal(false);
    setInitialized(true);
  }, [savedProgress]);

  const handleStartFresh = useCallback(async () => {
    await clearProgress();
    setShowResumeModal(false);
    setInitialized(true);
  }, [clearProgress]);

  const handleSaveAndExit = useCallback(async () => {
    await saveProgress(currentQuestion, answers);
  }, [saveProgress, currentQuestion, answers]);

  const handleAnswer = (color: string) => {
    setSelectedAnswer(color);
  };

  const handleNext = async () => {
    if (selectedAnswer) {
      const newAnswers = { ...answers, [currentQuestion]: selectedAnswer };
      setAnswers(newAnswers);
      setSelectedAnswer("");

      if (currentQuestion < shuffledQuestions.length - 1) {
        const nextQuestion = currentQuestion + 1;
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(newAnswers[nextQuestion] || "");
      } else {
        // Calculate results based on percentages
        const colorCounts = { yellow: 0, red: 0, green: 0, blue: 0 };
        Object.values(newAnswers).forEach((color) => {
          colorCounts[color as keyof typeof colorCounts]++;
        });

        // Convert to percentages
        const totalAnswers = Object.keys(newAnswers).length;
        const percentages = {
          yellow: Math.round((colorCounts.yellow / totalAnswers) * 100),
          red: Math.round((colorCounts.red / totalAnswers) * 100),
          green: Math.round((colorCounts.green / totalAnswers) * 100),
          blue: Math.round((colorCounts.blue / totalAnswers) * 100)
        };

        const dominantColor = Object.entries(percentages).reduce((a, b) =>
          percentages[a[0] as keyof typeof percentages] > percentages[b[0] as keyof typeof percentages] ? a : b
        )[0];

        const secondaryColor = Object.entries(percentages)
          .filter(([color]) => color !== dominantColor)
          .reduce((a, b) =>
            percentages[a[0] as keyof typeof percentages] > percentages[b[0] as keyof typeof percentages] ? a : b
          )[0];

        // Mark assessment as complete
        await markComplete(dominantColor, colorCounts);

        // Store premium results
        localStorage.setItem('premiumAssessmentResults', JSON.stringify({
          dominantColor,
          secondaryColor,
          scores: percentages,
          totalQuestions: premiumQuestions.length,
          isPremium: true
        }));

        navigate('/premium-results');
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

  const progress = ((currentQuestion + 1) / shuffledQuestions.length) * 100;
  const currentQuestionData = shuffledQuestions[currentQuestion];
  
  // Shuffle options for current question
  const shuffledCurrentOptions = useMemo(() => {
    return currentQuestionData?.options ? shuffleArray(currentQuestionData.options) : [];
  }, [currentQuestion, currentQuestionData?.options]);

  // Show loading while checking for saved progress
  if (progressLoading) {
    return (
      <ProtectedRoute requiresPayment={true} assessmentType="premium">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiresPayment={true} assessmentType="premium">
      <div className="min-h-screen bg-background">
        <Navbar />
        
        {/* Resume Progress Modal */}
        <ResumeProgressModal
          open={showResumeModal}
          onResume={handleResume}
          onStartFresh={handleStartFresh}
          answeredCount={Object.keys(savedProgress?.answers || {}).length}
          totalQuestions={premiumQuestions.length}
          lastSavedAt={lastSaved}
        />

        <div className="bg-gradient-subtle py-8 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header with Progress */}
            <div className="mb-8 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-hero rounded-full flex items-center justify-center shadow-glow">
                    <Star className="text-white w-4 h-4" />
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                    Premium Leadership Assessment
                  </h1>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="text-sm text-muted-foreground">
                    Question {currentQuestion + 1} of {shuffledQuestions.length}
                  </div>
                  <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
                </div>
              </div>
              <div className="relative">
                <Progress value={progress} className="h-3 bg-muted/30" />
                <div 
                  className="absolute top-0 left-0 h-3 bg-gradient-brand rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <Card className="shadow-elegant border-2 border-border/20 animate-scale-in">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-full flex items-center justify-center animate-glow-pulse">
                    <span className="text-white font-bold text-xs">{currentQuestion + 1}</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
                    {currentQuestionData.stage} Stage • Premium Assessment
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-sm font-semibold text-primary mb-1">
                    Team Development: {currentQuestionData.stage}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentQuestionData.stage === "Forming" && "Building connection and establishing team foundation"}
                    {currentQuestionData.stage === "Storming" && "Navigating conflict and working through differences"}
                    {currentQuestionData.stage === "Norming" && "Establishing flow and creating team standards"}
                    {currentQuestionData.stage === "Performing" && "Reaching peak productivity and excellence"}
                    {currentQuestionData.stage === "Adjourning" && "Ending with clarity and reflection"}
                  </div>
                </div>
                <CardTitle className="text-xl leading-relaxed text-foreground">
                  {currentQuestionData.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={selectedAnswer} onValueChange={handleAnswer} className="space-y-3">
                  {shuffledCurrentOptions.map((option, index) => (
                    <div 
                      key={index} 
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover-scale ${
                        selectedAnswer === option.color 
                          ? 'border-primary bg-primary/5 shadow-glow' 
                          : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
                      }`}
                      onClick={() => handleAnswer(option.color)}
                    >
                      <RadioGroupItem 
                        value={option.color} 
                        id={`option-${index}`}
                        className="mt-0.5 flex-shrink-0"
                      />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="text-sm leading-relaxed cursor-pointer text-foreground font-medium"
                      >
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 animate-fade-in">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="text-center flex items-center gap-4">
                <PauseButton onSave={handleSaveAndExit} disabled={Object.keys(answers).length === 0} />
              </div>

              <Button
                onClick={handleNext}
                disabled={!selectedAnswer}
                className="flex items-center gap-2 hover-scale"
              >
                {currentQuestion === shuffledQuestions.length - 1 ? 'Get Premium Results' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default PremiumAssessment;