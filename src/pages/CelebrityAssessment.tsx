import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Sparkles, Star, User } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";

// Questions framed for assessing a celebrity/character
const celebrityQuestions = [
  {
    id: 1,
    stage: "Forming",
    question: "When building connection in a new team, this person would naturally:",
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
    question: "When navigating friction and conflict in teams, this person typically:",
    options: [
      { text: "Pushes through obstacles with decisive action", color: "yellow" },
      { text: "Reframes conflict as creative tension and opportunity", color: "red" },
      { text: "Analyzes root causes and creates systematic solutions", color: "green" },
      { text: "Listens to all perspectives and helps people find common ground", color: "blue" },
    ],
  },
  {
    id: 3,
    stage: "Norming",
    question: "When establishing flow and team norms, this person prefers to:",
    options: [
      { text: "Drive execution and maintain momentum toward goals", color: "yellow" },
      { text: "Inspire the team with vision and creative possibilities", color: "red" },
      { text: "Build logical systems and clear operational processes", color: "green" },
      { text: "Ensure everyone feels heard and supported in the process", color: "blue" },
    ],
  },
  {
    id: 4,
    stage: "Performing",
    question: "When the team is performing at high levels, this person:",
    options: [
      { text: "Pushes for even greater results and achievements", color: "yellow" },
      { text: "Celebrates success and inspires the team to dream bigger", color: "red" },
      { text: "Optimizes systems and looks for efficiency improvements", color: "green" },
      { text: "Nurtures team relationships and ensures sustainable success", color: "blue" },
    ],
  },
  {
    id: 5,
    stage: "Adjourning",
    question: "When a project or team phase is ending, this person:",
    options: [
      { text: "Quickly pivots to the next challenge or opportunity", color: "yellow" },
      { text: "Honors the journey and creates meaningful closure moments", color: "red" },
      { text: "Documents learnings and creates frameworks for the future", color: "green" },
      { text: "Focuses on maintaining relationships beyond the project", color: "blue" },
    ],
  },
  {
    id: 6,
    stage: "Decision Making",
    question: "When facing a difficult decision, this person tends to:",
    options: [
      { text: "Make quick, decisive calls and adjust as needed", color: "yellow" },
      { text: "Trust intuition and go with what feels exciting", color: "red" },
      { text: "Gather data and analyze all options thoroughly", color: "green" },
      { text: "Consider how the decision impacts everyone involved", color: "blue" },
    ],
  },
  {
    id: 7,
    stage: "Under Pressure",
    question: "When under significant pressure, this person:",
    options: [
      { text: "Becomes more focused and action-oriented", color: "yellow" },
      { text: "Energizes others and finds creative solutions", color: "red" },
      { text: "Relies on processes and systematic approaches", color: "green" },
      { text: "Seeks support and maintains team morale", color: "blue" },
    ],
  },
  {
    id: 8,
    stage: "Communication",
    question: "This person's communication style is best described as:",
    options: [
      { text: "Direct, concise, and results-focused", color: "yellow" },
      { text: "Enthusiastic, inspiring, and story-driven", color: "red" },
      { text: "Logical, detailed, and data-backed", color: "green" },
      { text: "Warm, empathetic, and relationship-oriented", color: "blue" },
    ],
  },
];

const CelebrityAssessment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const celebrityName = searchParams.get("name") || "Unknown Character";
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  useEffect(() => {
    // Redirect if no name provided
    if (!searchParams.get("name")) {
      navigate("/");
    }
  }, [searchParams, navigate]);

  const handleAnswer = (color: string) => {
    setSelectedAnswer(color);
  };

  const handleNext = () => {
    if (selectedAnswer) {
      const newAnswers = { ...answers, [currentQuestion]: selectedAnswer };
      setAnswers(newAnswers);
      setSelectedAnswer("");

      if (currentQuestion < celebrityQuestions.length - 1) {
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
          celebrityName,
          dominantColor,
          secondaryColor,
          scores: colorCounts,
          totalQuestions: celebrityQuestions.length,
          timestamp: new Date().toISOString()
        };

        // Store results in localStorage
        localStorage.setItem('celebrityAssessmentResults', JSON.stringify(results));

        // Navigate to results page
        navigate('/celebrity-results');
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

  const progress = ((currentQuestion + 1) / celebrityQuestions.length) * 100;
  const currentQ = celebrityQuestions[currentQuestion];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4 px-4 py-2">
            <Star className="w-4 h-4 mr-2" />
            Celebrity Assessment
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Analyzing: <span className="gradient-text-primary">{celebrityName}</span>
          </h1>
          <p className="text-muted-foreground">
            Answer how you think {celebrityName} would respond in each situation
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {celebrityQuestions.length}
            </span>
            <Badge variant="outline">{currentQ.stage}</Badge>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Question Card */}
        <Card className="mb-8 border-primary/20 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl md:text-2xl leading-relaxed">
              {currentQ.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedAnswer}
              onValueChange={handleAnswer}
              className="space-y-4"
            >
              {currentQ.options.map((option, index) => (
                <div
                  key={index}
                  className={`relative flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:border-primary/50 ${
                    selectedAnswer === option.color
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => handleAnswer(option.color)}
                >
                  <RadioGroupItem
                    value={option.color}
                    id={`option-${index}`}
                    className="shrink-0"
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer text-base md:text-lg leading-relaxed"
                  >
                    {option.text}
                  </Label>
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
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className="gap-2"
          >
            {currentQuestion === celebrityQuestions.length - 1 ? (
              <>
                <Sparkles className="w-4 h-4" />
                See Results
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CelebrityAssessment;
