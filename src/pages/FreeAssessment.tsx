import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Sparkles, Clock, Gift, Star } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { shuffleArray } from "@/lib/utils";

const freeQuestions = [
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

const FreeAssessment = () => {
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

      if (currentQuestion < freeQuestions.length - 1) {
        const nextQuestion = currentQuestion + 1;
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(newAnswers[nextQuestion] || "");
      } else {
        // Calculate basic results
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
          totalQuestions: freeQuestions.length,
          isPreview: true
        };

        // Store preview results in localStorage
        localStorage.setItem('freeAssessmentResults', JSON.stringify(results));

        navigate('/free-results');
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

  const progress = ((currentQuestion + 1) / freeQuestions.length) * 100;
  const currentQuestionData = freeQuestions[currentQuestion];
  
  // Shuffle options for current question
  const shuffledOptions = useMemo(() => {
    return shuffleArray(currentQuestionData.options);
  }, [currentQuestionData.options]);

  const stageInfo = {
    "Forming": { icon: "🤝", desc: "Building connection and establishing team foundation", color: "red" },
    "Storming": { icon: "⚡", desc: "Navigating conflict and working through differences", color: "yellow" },
    "Norming": { icon: "⚙️", desc: "Establishing flow and creating team standards", color: "green" },
    "Performing": { icon: "🚀", desc: "Reaching peak productivity", color: "blue" },
    "Adjourning": { icon: "🎯", desc: "Ending with clarity and reflection", color: "brand" }
  };

  const currentStage = stageInfo[currentQuestionData.stage as keyof typeof stageInfo];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Header */}
      <div className="relative overflow-hidden mesh-background">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/80"></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-[10%] w-32 h-32 bg-gradient-primary rounded-full blur-2xl opacity-20 animate-bounce-gentle"></div>
        <div className="absolute bottom-20 right-[15%] w-24 h-24 bg-gradient-green rounded-full blur-xl opacity-15 animate-bounce-gentle delay-1000"></div>
        
        <div className="relative py-16">
          <div className="container-wide">
            <div className="text-center space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-3 glass-card px-6 py-3 rounded-full border border-primary/30">
                <Gift className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-primary tracking-wide">Free Preview Assessment</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-balance">
                Discover Your
                <br />
                <span className="gradient-text-primary">Leadership Color</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Take our 3-question preview to get a taste of your unique leadership style. 
                <strong className="text-foreground"> Based on proven team development psychology.</strong>
              </p>
              
              {/* Quick stats */}
              <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mt-8">
                <div className="text-center min-w-[80px]">
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-semibold text-foreground">3 Minutes</p>
                  <p className="text-xs text-muted-foreground">Quick & Easy</p>
                </div>
                <div className="text-center min-w-[80px]">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-semibold text-foreground">Science-Based</p>
                  <p className="text-xs text-muted-foreground">Research-backed</p>
                </div>
                <div className="text-center min-w-[80px]">
                  <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-green mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-semibold text-foreground">Completely Free</p>
                  <p className="text-xs text-muted-foreground">Email to view</p>
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
            <div className="mb-8 md:mb-12 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-blue">
                    <span className="text-white font-bold text-base sm:text-lg">{currentQuestion + 1}</span>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-foreground">Free Leadership Preview</h2>
                    <p className="text-sm text-muted-foreground">Question {currentQuestion + 1} of {freeQuestions.length}</p>
                  </div>
                </div>
                
                <Badge variant="outline" className="text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2 border-primary/40 text-primary">
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
            <Card className="glass-card-strong rounded-2xl sm:rounded-3xl shadow-xl border-2 border-primary/20 mb-8 sm:mb-12 animate-scale-in hover-lift">
              <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4 sm:mb-6">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-${currentStage.color} rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-${currentStage.color} flex-shrink-0`}>
                    {currentStage.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <Badge variant="secondary" className="text-xs sm:text-sm px-3 sm:px-4 py-1 font-semibold">
                        {currentQuestionData.stage} Stage
                      </Badge>
                      <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1 hidden sm:inline-flex">
                        Team Development Psychology
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {currentStage.desc}
                    </p>
                  </div>
                </div>
                
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl leading-relaxed text-foreground text-balance">
                  {currentQuestionData.question}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8">
                <RadioGroup value={selectedAnswer} onValueChange={handleAnswer} className="space-y-3 sm:space-y-4">
                  {shuffledOptions.map((option, index) => (
                    <div 
                      key={index} 
                      className={`group relative p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 cursor-pointer hover-lift ${
                        selectedAnswer === option.color 
                          ? 'border-primary bg-primary/5 shadow-colorful' 
                          : 'border-border/50 hover:border-primary/40 hover:bg-accent/30'
                      }`}
                      onClick={() => handleAnswer(option.color)}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <RadioGroupItem 
                          value={option.color} 
                          id={`option-${index}`}
                          className="mt-1 flex-shrink-0 scale-110 sm:scale-125"
                        />
                        <div className="flex-1 min-w-0">
                          <Label 
                            htmlFor={`option-${index}`} 
                            className="text-base sm:text-lg leading-relaxed cursor-pointer text-foreground font-medium block"
                          >
                            {option.text}
                          </Label>
                        </div>
                        
                        {selectedAnswer === option.color && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-xs sm:text-sm">✓</span>
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
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
              <Button
                variant="glass"
                size="lg"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 w-full sm:w-auto order-2 sm:order-1"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                Previous
              </Button>

              <div className="text-center hidden md:block order-1 sm:order-2">
                <p className="text-sm text-muted-foreground mb-1">
                  This is a free preview assessment
                </p>
                <p className="text-xs text-muted-foreground">
                  Full assessment has 25+ comprehensive questions
                </p>
              </div>

              <Button
                variant="default"
                size="lg"
                onClick={handleNext}
                disabled={!selectedAnswer}
                className="flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 font-bold group w-full sm:w-auto order-1 sm:order-3"
              >
                {currentQuestion === freeQuestions.length - 1 ? 'See Preview Results' : 'Next Question'}
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            {/* Bottom CTA */}
            <div className="text-center mt-16 p-8 glass-card rounded-2xl border border-primary/20">
              <h3 className="text-xl font-bold text-foreground mb-2">Want the Complete Picture?</h3>
              <p className="text-muted-foreground mb-4">
                Upgrade to our full 25-question assessment for detailed insights, personalized recommendations, and comprehensive reports.
              </p>
              <Button variant="outline" size="lg" asChild>
                <a href="/pricing">View Premium Options</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeAssessment;