import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, GraduationCap, Clock, Sparkles } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { shuffleArray } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const studentQuestions = [
  {
    id: 1,
    stage: "Leadership & Initiative",
    question: "When starting a group project, I usually…",
    options: [
      { text: "Jump in and assign roles", color: "yellow" },
      { text: "Share a vision or inspiring idea", color: "red" },
      { text: "Plan the process step by step", color: "green" },
      { text: "Suggest new, creative approaches", color: "blue" },
    ],
  },
  {
    id: 2,
    stage: "Leadership & Initiative",
    question: "I feel best when I…",
    options: [
      { text: "See fast results", color: "yellow" },
      { text: "Inspire others to take part", color: "red" },
      { text: "Solve problems with logic", color: "green" },
      { text: "Come up with unique ideas", color: "blue" },
    ],
  },
  {
    id: 3,
    stage: "Leadership & Initiative",
    question: "If no one leads, I…",
    options: [
      { text: "Take control immediately", color: "yellow" },
      { text: "Motivate someone else to step up", color: "red" },
      { text: "Create structure for the group", color: "green" },
      { text: "Pitch a new direction to get moving", color: "blue" },
    ],
  },
  {
    id: 4,
    stage: "Leadership & Initiative",
    question: "In stressful situations, I…",
    options: [
      { text: "Push forward with action", color: "yellow" },
      { text: "Keep others positive", color: "red" },
      { text: "Slow down to analyze carefully", color: "green" },
      { text: "Reframe with a fresh idea", color: "blue" },
    ],
  },
  {
    id: 5,
    stage: "Leadership & Initiative",
    question: "The best leaders…",
    options: [
      { text: "Drive execution and results", color: "yellow" },
      { text: "Inspire and energize people", color: "red" },
      { text: "Think logically and provide clarity", color: "green" },
      { text: "Envision and innovate for the future", color: "blue" },
    ],
  },
  {
    id: 6,
    stage: "Collaboration & Communication",
    question: "In group discussions, I…",
    options: [
      { text: "Push for a decision", color: "yellow" },
      { text: "Make sure everyone feels heard", color: "red" },
      { text: "Clarify details and structure", color: "green" },
      { text: "Ask creative, \"what if\" questions", color: "blue" },
    ],
  },
  {
    id: 7,
    stage: "Collaboration & Communication",
    question: "People count on me to…",
    options: [
      { text: "Get things done under pressure", color: "yellow" },
      { text: "Bring energy and enthusiasm", color: "red" },
      { text: "Keep things organized and clear", color: "green" },
      { text: "Spot new opportunities", color: "blue" },
    ],
  },
  {
    id: 8,
    stage: "Collaboration & Communication",
    question: "My style of communication is…",
    options: [
      { text: "Direct and action-oriented", color: "yellow" },
      { text: "Inspiring and expressive", color: "red" },
      { text: "Clear and logical", color: "green" },
      { text: "Creative and forward-looking", color: "blue" },
    ],
  },
  {
    id: 9,
    stage: "Collaboration & Communication",
    question: "I usually motivate others by…",
    options: [
      { text: "Showing progress and results", color: "yellow" },
      { text: "Sharing vision and passion", color: "red" },
      { text: "Explaining with facts and logic", color: "green" },
      { text: "Introducing bold, new ideas", color: "blue" },
    ],
  },
  {
    id: 10,
    stage: "Collaboration & Communication",
    question: "In a group project, my role is often…",
    options: [
      { text: "The driver", color: "yellow" },
      { text: "The motivator", color: "red" },
      { text: "The organizer", color: "green" },
      { text: "The idea generator", color: "blue" },
    ],
  },
  {
    id: 11,
    stage: "Problem-Solving & Decision-Making",
    question: "When faced with a tough decision, I…",
    options: [
      { text: "Act quickly", color: "yellow" },
      { text: "Think about how it affects others", color: "red" },
      { text: "Analyze logically", color: "green" },
      { text: "Brainstorm alternatives", color: "blue" },
    ],
  },
  {
    id: 12,
    stage: "Problem-Solving & Decision-Making",
    question: "My strength in solving problems is…",
    options: [
      { text: "Speed and determination", color: "yellow" },
      { text: "Energy and optimism", color: "red" },
      { text: "Logic and analysis", color: "green" },
      { text: "Creativity and originality", color: "blue" },
    ],
  },
  {
    id: 13,
    stage: "Problem-Solving & Decision-Making",
    question: "I prefer instructions that are…",
    options: [
      { text: "Short and actionable", color: "yellow" },
      { text: "Inspiring and motivating", color: "red" },
      { text: "Detailed and structured", color: "green" },
      { text: "Open-ended and flexible", color: "blue" },
    ],
  },
  {
    id: 14,
    stage: "Problem-Solving & Decision-Making",
    question: "In a debate, I…",
    options: [
      { text: "Push for quick resolution", color: "yellow" },
      { text: "Persuade with passion", color: "red" },
      { text: "Use facts and logic", color: "green" },
      { text: "Share new perspectives", color: "blue" },
    ],
  },
  {
    id: 15,
    stage: "Problem-Solving & Decision-Making",
    question: "If my solution doesn't work, I…",
    options: [
      { text: "Try something else immediately", color: "yellow" },
      { text: "Encourage others not to give up", color: "red" },
      { text: "Reanalyze step by step", color: "green" },
      { text: "Redesign it in a new way", color: "blue" },
    ],
  },
  {
    id: 16,
    stage: "Adaptability & Creativity",
    question: "I handle sudden changes by…",
    options: [
      { text: "Acting fast to adjust", color: "yellow" },
      { text: "Motivating others to stay positive", color: "red" },
      { text: "Re-planning logically", color: "green" },
      { text: "Rethinking creatively", color: "blue" },
    ],
  },
  {
    id: 17,
    stage: "Adaptability & Creativity",
    question: "I learn best when…",
    options: [
      { text: "I can apply it right away", color: "yellow" },
      { text: "It connects to inspiration or people", color: "red" },
      { text: "It's explained step by step", color: "green" },
      { text: "It allows me to explore freely", color: "blue" },
    ],
  },
  {
    id: 18,
    stage: "Adaptability & Creativity",
    question: "Free time is best spent…",
    options: [
      { text: "Building something useful", color: "yellow" },
      { text: "Sharing ideas and connecting", color: "red" },
      { text: "Researching or analyzing", color: "green" },
      { text: "Experimenting with creativity", color: "blue" },
    ],
  },
  {
    id: 19,
    stage: "Adaptability & Creativity",
    question: "I stay motivated when…",
    options: [
      { text: "Progress is visible", color: "yellow" },
      { text: "Energy is high around me", color: "red" },
      { text: "The work is structured", color: "green" },
      { text: "I can innovate", color: "blue" },
    ],
  },
  {
    id: 20,
    stage: "Adaptability & Creativity",
    question: "I thrive when I can…",
    options: [
      { text: "Take decisive action", color: "yellow" },
      { text: "Share vision and passion", color: "red" },
      { text: "Solve problems logically", color: "green" },
      { text: "Create and innovate freely", color: "blue" },
    ],
  },
  {
    id: 21,
    stage: "Self-Awareness & Reflection",
    question: "My biggest strength is…",
    options: [
      { text: "Taking action", color: "yellow" },
      { text: "Motivating others", color: "red" },
      { text: "Thinking logically", color: "green" },
      { text: "Being creative", color: "blue" },
    ],
  },
  {
    id: 22,
    stage: "Self-Awareness & Reflection",
    question: "I get frustrated when…",
    options: [
      { text: "Things move too slowly", color: "yellow" },
      { text: "People lack enthusiasm", color: "red" },
      { text: "Work is disorganized", color: "green" },
      { text: "Ideas are shut down", color: "blue" },
    ],
  },
  {
    id: 23,
    stage: "Self-Awareness & Reflection",
    question: "I measure growth by…",
    options: [
      { text: "What I've accomplished", color: "yellow" },
      { text: "How I've inspired others", color: "red" },
      { text: "What I've learned", color: "green" },
      { text: "What I've created", color: "blue" },
    ],
  },
  {
    id: 24,
    stage: "Self-Awareness & Reflection",
    question: "People usually notice that I…",
    options: [
      { text: "Act quickly", color: "yellow" },
      { text: "Energize others", color: "red" },
      { text: "Think carefully", color: "green" },
      { text: "Offer creative ideas", color: "blue" },
    ],
  },
  {
    id: 25,
    stage: "Self-Awareness & Reflection",
    question: "Ultimately, I want to be known as…",
    options: [
      { text: "A doer who achieves results", color: "yellow" },
      { text: "A motivator who uplifts others", color: "red" },
      { text: "A thinker who solves problems", color: "green" },
      { text: "A creator who innovates", color: "blue" },
    ],
  },
];

const StudentAssessment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  const handleAnswer = (color: string) => {
    setSelectedAnswer(color);
  };

  const handleNext = async () => {
    if (selectedAnswer) {
      const newAnswers = { ...answers, [currentQuestion]: selectedAnswer };
      setAnswers(newAnswers);
      setSelectedAnswer("");

      if (currentQuestion < studentQuestions.length - 1) {
        const nextQuestion = currentQuestion + 1;
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(newAnswers[nextQuestion] || "");
      } else {
        // Calculate results
        const colorCounts = { yellow: 0, red: 0, green: 0, blue: 0 };
        Object.values(newAnswers).forEach((color) => {
          colorCounts[color as keyof typeof colorCounts]++;
        });

        const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
        const dominantColor = sortedColors[0][0];
        const secondaryColor = sortedColors[1][0];

        const results = {
          dominantColor,
          secondaryColor,
          scores: colorCounts,
          totalQuestions: studentQuestions.length,
          answers: newAnswers,
          isStudent: true
        };

        // Store results in localStorage
        localStorage.setItem('studentAssessmentResults', JSON.stringify(results));

        // Save to database
        if (user) {
          try {
            await supabase
              .from('assessment_results')
              .insert({
                user_id: user.id,
                assessment_type: 'student',
                results: results
              });
          } catch (error) {
            console.error('Error saving assessment results:', error);
          }
        }

        navigate('/student-results');
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

  const progress = ((currentQuestion + 1) / studentQuestions.length) * 100;
  const currentQuestionData = studentQuestions[currentQuestion];
  
  const shuffledOptions = useMemo(() => {
    return shuffleArray(currentQuestionData.options);
  }, [currentQuestion]);

  const stageIcons = {
    "Leadership & Initiative": "🎯",
    "Collaboration & Communication": "🤝",
    "Problem-Solving & Decision-Making": "💡",
    "Adaptability & Creativity": "🚀",
    "Self-Awareness & Reflection": "🌟"
  };

  const currentIcon = stageIcons[currentQuestionData.stage as keyof typeof stageIcons];

  return (
    <ProtectedRoute requiresPayment={true} assessmentType="student">
      <div className="min-h-screen bg-background">
        <Navbar />
        
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-hero">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/80"></div>
          
          <div className="relative py-12">
            <div className="container-wide">
              <div className="text-center space-y-4 animate-fade-in">
                <div className="inline-flex items-center gap-3 glass-card px-6 py-3 rounded-full border border-primary/30">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold text-primary tracking-wide">Student Leadership Assessment</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl font-black leading-tight">
                  Discover Your
                  <br />
                  <span className="gradient-text-primary">Leadership Style</span>
                </h1>
                
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  25 questions designed specifically for students to uncover your unique leadership potential
                </p>
                
                <div className="flex justify-center gap-8 mt-6">
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-blue mx-auto mb-2" />
                    <p className="text-sm font-semibold">15 Minutes</p>
                  </div>
                  <div className="text-center">
                    <Sparkles className="w-8 h-8 text-yellow mx-auto mb-2" />
                    <p className="text-sm font-semibold">Student-Focused</p>
                  </div>
                  <div className="text-center">
                    <GraduationCap className="w-8 h-8 text-green mx-auto mb-2" />
                    <p className="text-sm font-semibold">Career Ready</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Content */}
        <div className="bg-gradient-soft py-16">
          <div className="container-wide">
            <div className="max-w-4xl mx-auto">
              
              {/* Progress Header */}
              <div className="mb-12 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-blue">
                      <span className="text-white font-bold text-lg">{currentQuestion + 1}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Student Assessment</h2>
                      <p className="text-muted-foreground">Question {currentQuestion + 1} of {studentQuestions.length}</p>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="text-lg px-4 py-2 border-primary/40 text-primary">
                    {Math.round(progress)}% Complete
                  </Badge>
                </div>
                
                <div className="relative">
                  <div className="h-4 bg-muted/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out shadow-blue" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Question Card */}
              <Card className="glass-card-strong rounded-3xl shadow-xl border-2 border-primary/20 mb-12 animate-scale-in hover-lift">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center text-3xl shadow-blue">
                      {currentIcon}
                    </div>
                    <div className="flex-1">
                      <Badge variant="secondary" className="text-sm px-4 py-1 font-semibold mb-2">
                        {currentQuestionData.stage}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl lg:text-3xl leading-relaxed text-balance">
                    {currentQuestionData.question}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="px-8 pb-8">
                  <RadioGroup value={selectedAnswer} onValueChange={handleAnswer} className="space-y-4">
                    {shuffledOptions.map((option, index) => (
                      <div 
                        key={index} 
                        className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer hover-lift ${
                          selectedAnswer === option.color 
                            ? 'border-primary bg-primary/5 shadow-colorful' 
                            : 'border-border/50 hover:border-primary/40 hover:bg-accent/30'
                        }`}
                        onClick={() => handleAnswer(option.color)}
                      >
                        <div className="flex items-start gap-4">
                          <RadioGroupItem 
                            value={option.color} 
                            id={`option-${index}`}
                            className="mt-1 flex-shrink-0 scale-125"
                          />
                          <div className="flex-1">
                            <Label 
                              htmlFor={`option-${index}`} 
                              className="text-lg leading-relaxed cursor-pointer font-medium block"
                            >
                              {option.text}
                            </Label>
                          </div>
                          
                          {selectedAnswer === option.color && (
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">✓</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between items-center animate-fade-in">
                <Button
                  variant="glass"
                  size="lg"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="flex items-center gap-3 px-8 py-4"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </Button>

                <Button
                  variant="default"
                  size="lg"
                  onClick={handleNext}
                  disabled={!selectedAnswer}
                  className="flex items-center gap-3 px-8 py-4 font-bold group"
                >
                  {currentQuestion === studentQuestions.length - 1 ? 'Get Results' : 'Next Question'}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default StudentAssessment;
