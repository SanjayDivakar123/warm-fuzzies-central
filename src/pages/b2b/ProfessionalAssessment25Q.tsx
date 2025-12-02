import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { shuffleArray } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const professionalQuestions25Q = [
  // Section A: Leadership & Initiative (Q1–Q5)
  {
    id: 1,
    section: "Leadership & Initiative",
    question: "When starting a new project, I usually…",
    options: [
      { text: "Take immediate action and assign tasks", color: "yellow" },
      { text: "Share the bigger vision and energize the team", color: "red" },
      { text: "Build a structured plan step by step", color: "green" },
      { text: "Brainstorm new and creative approaches", color: "blue" },
    ],
  },
  {
    id: 2,
    section: "Leadership & Initiative",
    question: "The best leaders…",
    options: [
      { text: "Drive execution and results", color: "yellow" },
      { text: "Inspire with passion and communication", color: "red" },
      { text: "Provide logic and clarity", color: "green" },
      { text: "Innovate and reimagine possibilities", color: "blue" },
    ],
  },
  {
    id: 3,
    section: "Leadership & Initiative",
    question: "When deadlines approach, I…",
    options: [
      { text: "Push the team into focused action", color: "yellow" },
      { text: "Rally people with encouragement and energy", color: "red" },
      { text: "Reorganize priorities logically", color: "green" },
      { text: "Find creative shortcuts to achieve goals", color: "blue" },
    ],
  },
  {
    id: 4,
    section: "Leadership & Initiative",
    question: "My colleagues usually describe me as…",
    options: [
      { text: "The one who makes things happen", color: "yellow" },
      { text: "The one who motivates and uplifts", color: "red" },
      { text: "The one who keeps things organized", color: "green" },
      { text: "The one who brings innovative ideas", color: "blue" },
    ],
  },
  {
    id: 5,
    section: "Leadership & Initiative",
    question: "I feel most accomplished when…",
    options: [
      { text: "Results are achieved quickly", color: "yellow" },
      { text: "People are inspired by my work", color: "red" },
      { text: "Systems are clear and efficient", color: "green" },
      { text: "Something new and original is created", color: "blue" },
    ],
  },
  // Section B: Collaboration & Communication (Q6–Q10)
  {
    id: 6,
    section: "Collaboration & Communication",
    question: "In team discussions, I tend to…",
    options: [
      { text: "Push toward decisions and action", color: "yellow" },
      { text: "Motivate and energize others", color: "red" },
      { text: "Clarify details and structure", color: "green" },
      { text: 'Ask bold, creative "what if" questions', color: "blue" },
    ],
  },
  {
    id: 7,
    section: "Collaboration & Communication",
    question: "My teammates rely on me for…",
    options: [
      { text: "Speed and reliability", color: "yellow" },
      { text: "Energy and encouragement", color: "red" },
      { text: "Organization and logic", color: "green" },
      { text: "Creative problem-solving", color: "blue" },
    ],
  },
  {
    id: 8,
    section: "Collaboration & Communication",
    question: "My communication style is…",
    options: [
      { text: "Direct and action-oriented", color: "yellow" },
      { text: "Enthusiastic and persuasive", color: "red" },
      { text: "Clear and precise", color: "green" },
      { text: "Conceptual and visionary", color: "blue" },
    ],
  },
  {
    id: 9,
    section: "Collaboration & Communication",
    question: "I get frustrated when…",
    options: [
      { text: "Projects stall without action", color: "yellow" },
      { text: "People lack passion or motivation", color: "red" },
      { text: "Details are overlooked", color: "green" },
      { text: "Innovation is resisted", color: "blue" },
    ],
  },
  {
    id: 10,
    section: "Collaboration & Communication",
    question: "My role in teams is usually…",
    options: [
      { text: "The driver who executes", color: "yellow" },
      { text: "The motivator who inspires", color: "red" },
      { text: "The organizer who structures", color: "green" },
      { text: "The innovator who creates", color: "blue" },
    ],
  },
  // Section C: Problem-Solving & Decision-Making (Q11–Q15)
  {
    id: 11,
    section: "Problem-Solving & Decision-Making",
    question: "When solving problems, my first step is to…",
    options: [
      { text: "Act quickly and test a solution", color: "yellow" },
      { text: "Motivate others to stay positive", color: "red" },
      { text: "Break it down into logical steps", color: "green" },
      { text: "Reframe the issue creatively", color: "blue" },
    ],
  },
  {
    id: 12,
    section: "Problem-Solving & Decision-Making",
    question: "I trust decisions when…",
    options: [
      { text: "They produce fast results", color: "yellow" },
      { text: "They inspire and energize others", color: "red" },
      { text: "They are backed by logic and data", color: "green" },
      { text: "They open new opportunities", color: "blue" },
    ],
  },
  {
    id: 13,
    section: "Problem-Solving & Decision-Making",
    question: "My problem-solving strength is…",
    options: [
      { text: "Speed and determination", color: "yellow" },
      { text: "Motivation and optimism", color: "red" },
      { text: "Structure and clarity", color: "green" },
      { text: "Creativity and originality", color: "blue" },
    ],
  },
  {
    id: 14,
    section: "Problem-Solving & Decision-Making",
    question: "In debates, I…",
    options: [
      { text: "Push for a resolution quickly", color: "yellow" },
      { text: "Persuade with passion and stories", color: "red" },
      { text: "Use facts and logic", color: "green" },
      { text: "Share new perspectives and ideas", color: "blue" },
    ],
  },
  {
    id: 15,
    section: "Problem-Solving & Decision-Making",
    question: "If my plan fails, I…",
    options: [
      { text: "Try another approach immediately", color: "yellow" },
      { text: "Encourage others not to give up", color: "red" },
      { text: "Reanalyze carefully step by step", color: "green" },
      { text: "Redesign it with creativity", color: "blue" },
    ],
  },
  // Section D: Adaptability & Innovation (Q16–Q20)
  {
    id: 16,
    section: "Adaptability & Innovation",
    question: "When unexpected changes happen, I…",
    options: [
      { text: "Adjust quickly and keep moving", color: "yellow" },
      { text: "Stay positive and encourage others", color: "red" },
      { text: "Re-plan logically", color: "green" },
      { text: "Pivot to a creative alternative", color: "blue" },
    ],
  },
  {
    id: 17,
    section: "Adaptability & Innovation",
    question: "I learn best when…",
    options: [
      { text: "I can apply it immediately", color: "yellow" },
      { text: "It connects to purpose and people", color: "red" },
      { text: "It's explained step by step", color: "green" },
      { text: "It allows me to experiment", color: "blue" },
    ],
  },
  {
    id: 18,
    section: "Adaptability & Innovation",
    question: "I'm most energized when…",
    options: [
      { text: "Projects are moving fast", color: "yellow" },
      { text: "People are motivated and connected", color: "red" },
      { text: "Work is organized and structured", color: "green" },
      { text: "There's space to innovate", color: "blue" },
    ],
  },
  {
    id: 19,
    section: "Adaptability & Innovation",
    question: "The workplace projects I enjoy most are…",
    options: [
      { text: "Goal-driven and fast-paced", color: "yellow" },
      { text: "Energizing and people-centered", color: "red" },
      { text: "Structured and methodical", color: "green" },
      { text: "Open-ended and innovative", color: "blue" },
    ],
  },
  {
    id: 20,
    section: "Adaptability & Innovation",
    question: "If plans are interrupted, I…",
    options: [
      { text: "Act quickly with a backup", color: "yellow" },
      { text: "Keep others motivated", color: "red" },
      { text: "Re-plan step by step", color: "green" },
      { text: "Pivot to a fresh idea", color: "blue" },
    ],
  },
  // Section E: Self-Awareness & Reflection (Q21–Q25)
  {
    id: 21,
    section: "Self-Awareness & Reflection",
    question: "My biggest professional strength is…",
    options: [
      { text: "Getting things done", color: "yellow" },
      { text: "Inspiring others", color: "red" },
      { text: "Thinking logically", color: "green" },
      { text: "Creating new ideas", color: "blue" },
    ],
  },
  {
    id: 22,
    section: "Self-Awareness & Reflection",
    question: "I measure success by…",
    options: [
      { text: "The results achieved", color: "yellow" },
      { text: "The people inspired", color: "red" },
      { text: "The systems improved", color: "green" },
      { text: "The innovations created", color: "blue" },
    ],
  },
  {
    id: 23,
    section: "Self-Awareness & Reflection",
    question: "I get frustrated when…",
    options: [
      { text: "Action is delayed", color: "yellow" },
      { text: "Passion is missing", color: "red" },
      { text: "Plans lack structure", color: "green" },
      { text: "Creativity is blocked", color: "blue" },
    ],
  },
  {
    id: 24,
    section: "Self-Awareness & Reflection",
    question: "My colleagues usually notice that I…",
    options: [
      { text: "Drive things into action", color: "yellow" },
      { text: "Motivate with enthusiasm", color: "red" },
      { text: "Keep things organized", color: "green" },
      { text: "Offer creative ideas", color: "blue" },
    ],
  },
  {
    id: 25,
    section: "Self-Awareness & Reflection",
    question: "Ultimately, I want to be known as…",
    options: [
      { text: "A doer who delivers results", color: "yellow" },
      { text: "A motivator who inspires others", color: "red" },
      { text: "A thinker who brings order", color: "green" },
      { text: "A creator who innovates", color: "blue" },
    ],
  },
];

const ProfessionalAssessment25Q = () => {
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

      if (currentQuestion < professionalQuestions25Q.length - 1) {
        const nextQuestion = currentQuestion + 1;
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(newAnswers[nextQuestion] || "");
      } else {
        // Calculate results
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
          totalQuestions: professionalQuestions25Q.length,
          assessmentType: 'professional_25q'
        };

        // Save to database if user is logged in
        if (user) {
          try {
            await supabase
              .from('assessment_results')
              .insert({
                user_id: user.id,
                assessment_type: 'professional_25q',
                results: results
              });
          } catch (error) {
            console.error('Error saving assessment results:', error);
          }
        }

        // Store in localStorage and navigate
        localStorage.setItem('professionalAssessmentResults', JSON.stringify(results));
        navigate('/b2b/results');
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

  const progress = ((currentQuestion + 1) / professionalQuestions25Q.length) * 100;
  const currentQuestionData = professionalQuestions25Q[currentQuestion];
  
  // Shuffle options for current question
  const shuffledOptions = useMemo(() => {
    return shuffleArray(currentQuestionData.options);
  }, [currentQuestion]);

  // Keyboard shortcuts for answer selection
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const keyMap: { [key: string]: number } = { '1': 0, '2': 1, '3': 2, '4': 3 };
      const index = keyMap[e.key];
      
      if (index !== undefined && shuffledOptions[index]) {
        handleAnswer(shuffledOptions[index].color);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestion, shuffledOptions]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
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
                    <h2 className="text-2xl font-bold text-foreground">Professional Assessment</h2>
                    <p className="text-muted-foreground">Question {currentQuestion + 1} of {professionalQuestions25Q.length}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge variant="outline" className="text-lg px-4 py-2 border-primary/40 text-primary">
                    {Math.round(progress)}% Complete
                  </Badge>
                </div>
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
                <div className="mb-4">
                  <Badge variant="secondary" className="text-sm px-4 py-1 font-semibold">
                    {currentQuestionData.section}
                  </Badge>
                </div>
                
                <CardTitle className="text-2xl lg:text-3xl leading-relaxed text-foreground text-balance">
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
                            className="text-lg leading-relaxed cursor-pointer text-foreground font-medium block"
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
                {currentQuestion === professionalQuestions25Q.length - 1 ? 'See Results' : 'Next Question'}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAssessment25Q;
