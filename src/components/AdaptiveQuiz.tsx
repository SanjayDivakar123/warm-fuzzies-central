import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navigation/Navbar";
import type { AudienceType } from "./AudienceSelector";

// Base questions that will be adapted based on audience
const baseQuestions = [
  {
    id: 1,
    stage: "Planning",
    base: "When working in a group, I usually",
    adaptations: {
      student: "When working with classmates on a project, I usually",
      "school-leader": "When leading staff on a new initiative, I usually", 
      teacher: "When collaborating with colleagues on lesson planning, I usually",
      entrepreneur: "When running my startup team on a launch, I usually",
      professional: "When working with colleagues on a project at work, I usually"
    },
    options: [
      { text: "like to take charge and get things moving quickly", color: "red" },
      { text: "prefer to plan everything out before starting", color: "blue" },
      { text: "focus on making sure everyone feels included", color: "green" },
      { text: "bring energy and help the team stay motivated", color: "yellow" }
    ]
  },
  {
    id: 2,
    stage: "Decision Making",
    base: "In meetings, I tend to",
    adaptations: {
      student: "In study groups, I tend to",
      "school-leader": "In faculty meetings, I tend to",
      teacher: "In team meetings, I tend to",
      entrepreneur: "In business meetings, I tend to",
      professional: "In workplace meetings, I tend to"
    },
    options: [
      { text: "push for quick decisions and action items", color: "red" },
      { text: "ask detailed questions and want thorough analysis", color: "blue" },
      { text: "make sure everyone's voice is heard", color: "green" },
      { text: "keep the mood light and encourage participation", color: "yellow" }
    ]
  },
  {
    id: 3,
    stage: "Problem Solving",
    base: "When facing challenges, I",
    adaptations: {
      student: "When facing academic challenges, I",
      "school-leader": "When facing school challenges, I",
      teacher: "When facing classroom challenges, I",
      entrepreneur: "When facing business challenges, I",
      professional: "When facing work challenges, I"
    },
    options: [
      { text: "tackle them head-on with determination", color: "red" },
      { text: "research thoroughly before taking action", color: "blue" },
      { text: "seek input from others and build consensus", color: "green" },
      { text: "look for creative solutions and stay optimistic", color: "yellow" }
    ]
  }
];

// Extended questions for premium and pro assessments
const extendedQuestions = [
  // Add more questions here - this is just a sample structure
  {
    id: 4,
    stage: "Communication",
    base: "My communication style is",
    adaptations: {
      student: "When presenting to classmates, my style is",
      "school-leader": "When addressing staff, my style is",
      teacher: "When teaching students, my style is", 
      entrepreneur: "When pitching to investors, my style is",
      professional: "When presenting to colleagues, my style is"
    },
    options: [
      { text: "direct and focused on results", color: "red" },
      { text: "detailed and well-organized", color: "blue" },
      { text: "warm and inclusive", color: "green" },
      { text: "enthusiastic and engaging", color: "yellow" }
    ]
  }
  // Add 46 more questions for the full 50-question pro assessment
];

interface AdaptiveQuizProps {
  audienceType: AudienceType;
  assessmentType: 'free' | 'premium' | 'pro';
}

export default function AdaptiveQuiz({ audienceType, assessmentType }: AdaptiveQuizProps) {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  // Get questions based on assessment type
  const questions = useMemo(() => {
    let questionSet = [...baseQuestions];
    
    if (assessmentType === 'premium') {
      // Add extended questions for 25 total (22 more)
      questionSet = [...questionSet, ...extendedQuestions.slice(0, 22)];
    } else if (assessmentType === 'pro') {
      // Add all extended questions for 50 total (47 more)
      questionSet = [...questionSet, ...extendedQuestions];
    }
    
    return questionSet;
  }, [assessmentType]);

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Get the adapted question text
  const getQuestionText = () => {
    return currentQ.adaptations[audienceType] || currentQ.base;
  };

  const handleAnswer = (color: string) => {
    setSelectedAnswer(color);
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    // Store the answer
    const newAnswers = {
      ...answers,
      [currentQ.id]: selectedAnswer
    };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer("");
    } else {
      // Quiz complete - calculate results and navigate
      const results = calculateResults(newAnswers);
      
      // Store results in localStorage with audience context
      localStorage.setItem('assessmentResults', JSON.stringify({
        ...results,
        audienceType,
        assessmentType,
        answers: Object.entries(newAnswers).map(([questionId, color]) => ({
          questionId: parseInt(questionId),
          question: questions.find(q => q.id === parseInt(questionId))?.base || '',
          answer: color
        }))
      }));

      // Navigate to appropriate results page
      switch (assessmentType) {
        case 'free':
          navigate('/free-results');
          break;
        case 'premium':
          navigate('/premium-results');
          break;
        case 'pro':
          navigate('/pro-results');
          break;
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      // Restore previous answer
      const prevAnswer = answers[questions[currentQuestion - 1].id];
      setSelectedAnswer(prevAnswer || "");
    }
  };

  const calculateResults = (answers: Record<string, string>) => {
    // Count occurrences of each color
    const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
    
    Object.values(answers).forEach(color => {
      if (color in colorCounts) {
        colorCounts[color as keyof typeof colorCounts]++;
      }
    });

    // Find dominant and secondary colors
    const sortedColors = Object.entries(colorCounts).sort(([,a], [,b]) => b - a);
    const dominantColor = sortedColors[0][0];
    const secondaryColor = sortedColors[1][0];

    return {
      dominantColor,
      secondaryColor,
      scores: colorCounts
    };
  };

  const getAudienceContextSummary = () => {
    const contexts = {
      student: "This is how your RoleColor affects group projects.",
      "school-leader": "This is how your RoleColor impacts staff alignment.",
      teacher: "This is how your RoleColor influences teaching teamwork.",
      entrepreneur: "This is how your RoleColor shapes your leadership style.",
      professional: "This is how your RoleColor guides workplace collaboration."
    };
    
    return contexts[audienceType];
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <Navbar />
      
      <div className="section-padding">
        <div className="container-wide">
          <Card className="max-w-4xl mx-auto glass-card">
            <CardHeader>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of {questions.length}
                </div>
                <Badge className="capitalize">
                  {audienceType.replace('-', ' ')} • {assessmentType}
                </Badge>
              </div>
              <Progress value={progress} className="mb-4" />
              <CardTitle className="text-xl md:text-2xl text-center">
                {getQuestionText()}
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Stage: {currentQ.stage}
              </p>
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
                    className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <RadioGroupItem 
                      value={option.color} 
                      id={`option-${index}`}
                      className="flex-shrink-0"
                    />
                    <Label 
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer text-sm md:text-base"
                    >
                      {option.text}
                    </Label>
                    <div className={`w-4 h-4 rounded-full bg-${option.color} flex-shrink-0`} />
                  </div>
                ))}
              </RadioGroup>
              
              <div className="flex justify-between mt-8">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                
                <Button 
                  onClick={handleNext}
                  disabled={!selectedAnswer}
                  className="px-8"
                >
                  {currentQuestion === questions.length - 1 ? 'Get Results' : 'Next'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}