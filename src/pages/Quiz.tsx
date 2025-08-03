import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { shuffleArray } from "@/lib/utils";

const questions = [
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
    id: 3,
    stage: "Norming",
    question: "When establishing flow and team norms, you prefer to:",
    options: [
      { text: "Drive execution and maintain momentum toward goals", color: "yellow" },
      { text: "Inspire the team with vision and creative possibilities", color: "red" },
      { text: "Build logical systems and clear operational processes", color: "green" },
      { text: "Ensure everyone feels heard and supported in the process", color: "blue" },
    ],
  },
];

const Quiz = () => {
  const navigate = useNavigate();

  // Note: This is a simplified free version with just 3 questions
  // The paid versions will have the full 25/50 question sets
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  const handleAnswer = (color: string) => {
    setSelectedAnswer(color);
  };

  const handleNext = () => {
    if (selectedAnswer) {
      const newAnswers = { ...answers, [currentQuestion]: selectedAnswer };
      setAnswers(newAnswers);
      setSelectedAnswer("");

      if (currentQuestion < questions.length - 1) {
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

        const secondaryColor = Object.entries(colorCounts)
          .filter(([color]) => color !== dominantColor)
          .reduce((a, b) =>
            colorCounts[a[0] as keyof typeof colorCounts] > colorCounts[b[0] as keyof typeof colorCounts] ? a : b
          )[0];

        // Store results in localStorage
        localStorage.setItem('quizResults', JSON.stringify({
          dominantColor,
          secondaryColor,
          scores: colorCounts,
          totalQuestions: questions.length
        }));

        navigate('/results');
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
  
  // Shuffle options for current question
  const shuffledOptions = useMemo(() => {
    return shuffleArray(currentQuestionData.options);
  }, [currentQuestion]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-gradient-subtle py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header with Progress */}
          <div className="mb-8 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-hero rounded-full flex items-center justify-center shadow-glow">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Free Leadership Preview
                </h1>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of {questions.length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round(progress)}% Complete
                </div>
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
                  {currentQuestionData.stage} Stage • Free Preview Assessment
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
                </div>
              </div>
              <CardTitle className="text-xl md:text-2xl leading-relaxed">
                {currentQuestionData.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={selectedAnswer} onValueChange={handleAnswer}>
                {shuffledOptions.map((option, index) => (
                  <div 
                    key={index} 
                    className={`group relative animate-fade-in transition-all duration-300 ${
                      selectedAnswer === option.color ? 'scale-105' : 'hover:scale-102'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center space-x-4">
                      <RadioGroupItem 
                        value={option.color} 
                        id={`option-${index}`}
                        className="border-2 border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor={`option-${index}`}
                        className={`flex-1 cursor-pointer py-4 px-6 rounded-xl border-2 transition-all duration-300 ${
                          selectedAnswer === option.color
                            ? 'border-primary bg-primary/20 shadow-md text-primary font-bold'
                            : 'border-border/30 hover:border-border hover:bg-accent/50 hover:shadow-elegant'
                        }`}
                      >
                        <span className="font-medium">{option.text}</span>
                      </Label>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-8 border-t border-border/20">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="group"
                >
                  <ChevronLeft className="w-4 h-4 mr-2 group-hover:animate-bounce-gentle" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    Press Enter to continue
                  </div>
                  <Button
                    onClick={handleNext}
                    disabled={!selectedAnswer}
                    variant={currentQuestion === questions.length - 1 ? "hero" : "default"}
                    className="group min-w-32"
                  >
                    {currentQuestion === questions.length - 1 ? (
                      <>
                        Get Preview Results
                        <div className="w-4 h-4 ml-2 bg-white/20 rounded-full animate-glow-pulse" />
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:animate-bounce-gentle" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Indicator */}
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              {Array.from({ length: questions.length }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i < currentQuestion + 1 
                      ? 'bg-gradient-hero shadow-glow' 
                      : i === currentQuestion + 1 
                      ? 'bg-muted-foreground/50 animate-pulse' 
                      : 'bg-muted-foreground/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;