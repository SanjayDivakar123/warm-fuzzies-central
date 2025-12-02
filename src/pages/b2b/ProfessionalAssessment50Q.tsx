import { useState, useMemo } from "react";
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

const professionalQuestions50Q = [
  // Section A: Leadership & Initiative (Q1–Q10)
  {
    id: 1,
    section: "Leadership & Initiative",
    question: "When starting a new project, I usually…",
    options: [
      { text: "Break tasks into actions and move forward immediately", color: "yellow" },
      { text: "Share the vision and inspire the team", color: "red" },
      { text: "Build a step-by-step structure", color: "green" },
      { text: "Brainstorm innovative approaches before starting", color: "blue" },
    ],
  },
  {
    id: 2,
    section: "Leadership & Initiative",
    question: "The best leaders…",
    options: [
      { text: "Drive results through action", color: "yellow" },
      { text: "Inspire with passion and communication", color: "red" },
      { text: "Create clarity through logic and organization", color: "green" },
      { text: "Push innovation and reimagine possibilities", color: "blue" },
    ],
  },
  {
    id: 3,
    section: "Leadership & Initiative",
    question: "When a deadline is approaching, I…",
    options: [
      { text: "Push to get things done quickly", color: "yellow" },
      { text: "Rally the team with energy and motivation", color: "red" },
      { text: "Re-prioritize tasks logically", color: "green" },
      { text: "Find creative ways to meet the goal", color: "blue" },
    ],
  },
  {
    id: 4,
    section: "Leadership & Initiative",
    question: "I feel most accomplished when…",
    options: [
      { text: "A project is executed successfully", color: "yellow" },
      { text: "People are inspired by my work", color: "red" },
      { text: "Processes are optimized and efficient", color: "green" },
      { text: "We create something new and original", color: "blue" },
    ],
  },
  {
    id: 5,
    section: "Leadership & Initiative",
    question: "My colleagues usually describe me as…",
    options: [
      { text: "The one who makes things happen", color: "yellow" },
      { text: "The one who lifts morale and inspires", color: "red" },
      { text: "The one who keeps things organized", color: "green" },
      { text: "The one who brings creative ideas", color: "blue" },
    ],
  },
  {
    id: 6,
    section: "Leadership & Initiative",
    question: "In leadership, I value most…",
    options: [
      { text: "Efficiency and action", color: "yellow" },
      { text: "Energy and vision", color: "red" },
      { text: "Structure and clarity", color: "green" },
      { text: "Innovation and experimentation", color: "blue" },
    ],
  },
  {
    id: 7,
    section: "Leadership & Initiative",
    question: "When others are uncertain, I…",
    options: [
      { text: "Decide quickly and act", color: "yellow" },
      { text: "Encourage them with positivity", color: "red" },
      { text: "Provide data and logic", color: "green" },
      { text: "Suggest new ways forward", color: "blue" },
    ],
  },
  {
    id: 8,
    section: "Leadership & Initiative",
    question: "My natural instinct is to…",
    options: [
      { text: "Act first and adjust later", color: "yellow" },
      { text: "Inspire with stories and energy", color: "red" },
      { text: "Analyze carefully before moving ahead", color: "green" },
      { text: "Explore new, unconventional ideas", color: "blue" },
    ],
  },
  {
    id: 9,
    section: "Leadership & Initiative",
    question: "Success in leadership means…",
    options: [
      { text: "Achieving results consistently", color: "yellow" },
      { text: "Motivating people to reach their best", color: "red" },
      { text: "Building reliable systems", color: "green" },
      { text: "Creating a culture of innovation", color: "blue" },
    ],
  },
  {
    id: 10,
    section: "Leadership & Initiative",
    question: "When a project begins, I focus on…",
    options: [
      { text: "Defining immediate next steps", color: "yellow" },
      { text: "Sharing the vision and purpose", color: "red" },
      { text: "Establishing structure and timelines", color: "green" },
      { text: "Designing creative strategies to differentiate", color: "blue" },
    ],
  },
  // Section B: Collaboration & Communication (Q11–Q20)
  {
    id: 11,
    section: "Collaboration & Communication",
    question: "In team discussions, I…",
    options: [
      { text: "Push for decisions and action", color: "yellow" },
      { text: "Motivate others with energy", color: "red" },
      { text: "Clarify details and organize thoughts", color: "green" },
      { text: 'Ask innovative, "what if" questions', color: "blue" },
    ],
  },
  {
    id: 12,
    section: "Collaboration & Communication",
    question: "My teammates rely on me to…",
    options: [
      { text: "Get things done under pressure", color: "yellow" },
      { text: "Inspire and energize the group", color: "red" },
      { text: "Keep the project on track and structured", color: "green" },
      { text: "Spot creative opportunities", color: "blue" },
    ],
  },
  {
    id: 13,
    section: "Collaboration & Communication",
    question: "My communication style is…",
    options: [
      { text: "Direct and action-oriented", color: "yellow" },
      { text: "Enthusiastic and persuasive", color: "red" },
      { text: "Precise and logical", color: "green" },
      { text: "Conceptual and forward-looking", color: "blue" },
    ],
  },
  {
    id: 14,
    section: "Collaboration & Communication",
    question: "If conflict arises, I…",
    options: [
      { text: "Push toward a fast resolution", color: "yellow" },
      { text: "Use positivity to bring people together", color: "red" },
      { text: "Analyze both perspectives logically", color: "green" },
      { text: "Reframe with a creative solution", color: "blue" },
    ],
  },
  {
    id: 15,
    section: "Collaboration & Communication",
    question: "I contribute best when…",
    options: [
      { text: "Driving projects into action", color: "yellow" },
      { text: "Inspiring people toward goals", color: "red" },
      { text: "Creating order and clarity", color: "green" },
      { text: "Bringing fresh, creative ideas", color: "blue" },
    ],
  },
  {
    id: 16,
    section: "Collaboration & Communication",
    question: "My colleagues count on me for…",
    options: [
      { text: "Speed and reliability", color: "yellow" },
      { text: "Enthusiasm and morale-boosting", color: "red" },
      { text: "Accuracy and structure", color: "green" },
      { text: "Vision and creative problem-solving", color: "blue" },
    ],
  },
  {
    id: 17,
    section: "Collaboration & Communication",
    question: "I dislike when team members…",
    options: [
      { text: "Waste time without acting", color: "yellow" },
      { text: "Lack energy or motivation", color: "red" },
      { text: "Ignore important details", color: "green" },
      { text: "Resist new ideas", color: "blue" },
    ],
  },
  {
    id: 18,
    section: "Collaboration & Communication",
    question: "In presentations, I prefer to…",
    options: [
      { text: "Share results and progress", color: "yellow" },
      { text: "Inspire the audience with passion", color: "red" },
      { text: "Explain the logic and data clearly", color: "green" },
      { text: "Highlight innovative, creative elements", color: "blue" },
    ],
  },
  {
    id: 19,
    section: "Collaboration & Communication",
    question: "I usually motivate colleagues by…",
    options: [
      { text: "Showing momentum and results", color: "yellow" },
      { text: "Sharing an inspiring vision", color: "red" },
      { text: "Explaining clear steps", color: "green" },
      { text: "Suggesting bold new directions", color: "blue" },
    ],
  },
  {
    id: 20,
    section: "Collaboration & Communication",
    question: "My team role is often…",
    options: [
      { text: "The driver", color: "yellow" },
      { text: "The motivator", color: "red" },
      { text: "The organizer", color: "green" },
      { text: "The innovator", color: "blue" },
    ],
  },
  // Section C: Problem-Solving & Decision-Making (Q21–Q30)
  {
    id: 21,
    section: "Problem-Solving & Decision-Making",
    question: "When solving problems, I first…",
    options: [
      { text: "Jump into action to test solutions", color: "yellow" },
      { text: "Motivate others to stay positive", color: "red" },
      { text: "Break the issue into logical steps", color: "green" },
      { text: "Explore alternative, creative options", color: "blue" },
    ],
  },
  {
    id: 22,
    section: "Problem-Solving & Decision-Making",
    question: "My strength in decision-making is…",
    options: [
      { text: "Acting quickly with confidence", color: "yellow" },
      { text: "Persuading with energy and vision", color: "red" },
      { text: "Using facts and analysis", color: "green" },
      { text: "Reframing challenges innovatively", color: "blue" },
    ],
  },
  {
    id: 23,
    section: "Problem-Solving & Decision-Making",
    question: "I trust decisions when…",
    options: [
      { text: "They create fast results", color: "yellow" },
      { text: "They inspire others", color: "red" },
      { text: "They are supported by data", color: "green" },
      { text: "They open new opportunities", color: "blue" },
    ],
  },
  {
    id: 24,
    section: "Problem-Solving & Decision-Making",
    question: "When a mistake happens, I…",
    options: [
      { text: "Fix it immediately and move on", color: "yellow" },
      { text: "Keep morale high and encourage the team", color: "red" },
      { text: "Analyze carefully what went wrong", color: "green" },
      { text: "Pivot into a new solution creatively", color: "blue" },
    ],
  },
  {
    id: 25,
    section: "Problem-Solving & Decision-Making",
    question: "In high-pressure situations, I…",
    options: [
      { text: "Take control and push forward", color: "yellow" },
      { text: "Motivate others to stay calm and positive", color: "red" },
      { text: "Focus on logic and steps", color: "green" },
      { text: "Look for unconventional alternatives", color: "blue" },
    ],
  },
  {
    id: 26,
    section: "Problem-Solving & Decision-Making",
    question: "I prefer instructions that are…",
    options: [
      { text: "Clear and actionable", color: "yellow" },
      { text: "Inspirational and people-centered", color: "red" },
      { text: "Detailed and systematic", color: "green" },
      { text: "Flexible and open-ended", color: "blue" },
    ],
  },
  {
    id: 27,
    section: "Problem-Solving & Decision-Making",
    question: "I measure success by…",
    options: [
      { text: "Achieving tangible results", color: "yellow" },
      { text: "Inspiring and influencing people", color: "red" },
      { text: "Accuracy and effectiveness", color: "green" },
      { text: "Originality and innovation", color: "blue" },
    ],
  },
  {
    id: 28,
    section: "Problem-Solving & Decision-Making",
    question: "In decision-making groups, I…",
    options: [
      { text: "Push for fast decisions", color: "yellow" },
      { text: "Advocate passionately for ideas", color: "red" },
      { text: "Provide logic and structure", color: "green" },
      { text: "Introduce new perspectives", color: "blue" },
    ],
  },
  {
    id: 29,
    section: "Problem-Solving & Decision-Making",
    question: "If my idea fails, I…",
    options: [
      { text: "Try something else quickly", color: "yellow" },
      { text: "Keep others motivated to try again", color: "red" },
      { text: "Reanalyze carefully", color: "green" },
      { text: "Redesign the idea innovatively", color: "blue" },
    ],
  },
  {
    id: 30,
    section: "Problem-Solving & Decision-Making",
    question: "My biggest contribution in problem-solving is…",
    options: [
      { text: "Speed and determination", color: "yellow" },
      { text: "Inspiration and communication", color: "red" },
      { text: "Structure and clarity", color: "green" },
      { text: "Creativity and originality", color: "blue" },
    ],
  },
  // Section D: Adaptability & Innovation (Q31–Q40)
  {
    id: 31,
    section: "Adaptability & Innovation",
    question: "I handle unexpected changes by…",
    options: [
      { text: "Acting quickly to adjust", color: "yellow" },
      { text: "Keeping the team positive", color: "red" },
      { text: "Reworking plans step by step", color: "green" },
      { text: "Pivoting to a new creative solution", color: "blue" },
    ],
  },
  {
    id: 32,
    section: "Adaptability & Innovation",
    question: "I learn best when…",
    options: [
      { text: "I can apply it right away", color: "yellow" },
      { text: "It connects to people and purpose", color: "red" },
      { text: "It's structured and systematic", color: "green" },
      { text: "It's open to creative exploration", color: "blue" },
    ],
  },
  {
    id: 33,
    section: "Adaptability & Innovation",
    question: "I enjoy projects that are…",
    options: [
      { text: "Fast-paced and goal-driven", color: "yellow" },
      { text: "Inspiring and people-focused", color: "red" },
      { text: "Structured and methodical", color: "green" },
      { text: "Open-ended and innovative", color: "blue" },
    ],
  },
  {
    id: 34,
    section: "Adaptability & Innovation",
    question: "I stay motivated when…",
    options: [
      { text: "Progress is visible", color: "yellow" },
      { text: "The energy around me is high", color: "red" },
      { text: "The work is organized logically", color: "green" },
      { text: "I get to innovate and create", color: "blue" },
    ],
  },
  {
    id: 35,
    section: "Adaptability & Innovation",
    question: "My adaptability comes from…",
    options: [
      { text: "Taking decisive action", color: "yellow" },
      { text: "Staying optimistic and encouraging others", color: "red" },
      { text: "Adjusting logically step by step", color: "green" },
      { text: "Rethinking situations creatively", color: "blue" },
    ],
  },
  {
    id: 36,
    section: "Adaptability & Innovation",
    question: "When trying new methods, I…",
    options: [
      { text: "Test them quickly in practice", color: "yellow" },
      { text: "Share enthusiasm to get buy-in", color: "red" },
      { text: "Research carefully before implementing", color: "green" },
      { text: "Experiment and see what happens", color: "blue" },
    ],
  },
  {
    id: 37,
    section: "Adaptability & Innovation",
    question: "I'm most energized by…",
    options: [
      { text: "Momentum and results", color: "yellow" },
      { text: "Passion and connection", color: "red" },
      { text: "Order and structure", color: "green" },
      { text: "Creativity and vision", color: "blue" },
    ],
  },
  {
    id: 38,
    section: "Adaptability & Innovation",
    question: "If a plan fails, I…",
    options: [
      { text: "Act fast to try a new one", color: "yellow" },
      { text: "Motivate others not to give up", color: "red" },
      { text: "Re-plan carefully", color: "green" },
      { text: "Invent an alternative", color: "blue" },
    ],
  },
  {
    id: 39,
    section: "Adaptability & Innovation",
    question: "The workplace projects I enjoy most are…",
    options: [
      { text: "Execution-focused", color: "yellow" },
      { text: "People-centered and energizing", color: "red" },
      { text: "Structured and organized", color: "green" },
      { text: "Innovative and exploratory", color: "blue" },
    ],
  },
  {
    id: 40,
    section: "Adaptability & Innovation",
    question: "I thrive when I can…",
    options: [
      { text: "Take decisive action", color: "yellow" },
      { text: "Inspire and influence others", color: "red" },
      { text: "Organize systems and processes", color: "green" },
      { text: "Create and innovate freely", color: "blue" },
    ],
  },
  // Section E: Self-Awareness & Reflection (Q41–Q50)
  {
    id: 41,
    section: "Self-Awareness & Reflection",
    question: "My biggest strength is…",
    options: [
      { text: "Taking action and execution", color: "yellow" },
      { text: "Inspiring others", color: "red" },
      { text: "Logical problem-solving", color: "green" },
      { text: "Creative thinking", color: "blue" },
    ],
  },
  {
    id: 42,
    section: "Self-Awareness & Reflection",
    question: "I get frustrated when…",
    options: [
      { text: "Work stalls without action", color: "yellow" },
      { text: "Energy and passion are missing", color: "red" },
      { text: "Systems are unclear", color: "green" },
      { text: "Innovation is shut down", color: "blue" },
    ],
  },
  {
    id: 43,
    section: "Self-Awareness & Reflection",
    question: "I measure my growth by…",
    options: [
      { text: "The results I've achieved", color: "yellow" },
      { text: "The people I've inspired", color: "red" },
      { text: "The knowledge and skills I've built", color: "green" },
      { text: "The innovations I've created", color: "blue" },
    ],
  },
  {
    id: 44,
    section: "Self-Awareness & Reflection",
    question: "My leadership style is…",
    options: [
      { text: "Action-driven", color: "yellow" },
      { text: "Visionary and motivational", color: "red" },
      { text: "Structured and logical", color: "green" },
      { text: "Creative and future-focused", color: "blue" },
    ],
  },
  {
    id: 45,
    section: "Self-Awareness & Reflection",
    question: "I gain energy from…",
    options: [
      { text: "Achieving milestones", color: "yellow" },
      { text: "Connecting with and inspiring others", color: "red" },
      { text: "Solving complex problems", color: "green" },
      { text: "Imagining new possibilities", color: "blue" },
    ],
  },
  {
    id: 46,
    section: "Self-Awareness & Reflection",
    question: "The hardest thing for me is…",
    options: [
      { text: "Waiting without acting", color: "yellow" },
      { text: "Working without inspiration", color: "red" },
      { text: "Functioning without structure", color: "green" },
      { text: "Following rigid rules", color: "blue" },
    ],
  },
  {
    id: 47,
    section: "Self-Awareness & Reflection",
    question: "My proudest professional moments come when…",
    options: [
      { text: "I execute big wins", color: "yellow" },
      { text: "I inspire and uplift others", color: "red" },
      { text: "I solve complex challenges", color: "green" },
      { text: "I innovate something new", color: "blue" },
    ],
  },
  {
    id: 48,
    section: "Self-Awareness & Reflection",
    question: "Colleagues usually notice that I…",
    options: [
      { text: "Get things moving quickly", color: "yellow" },
      { text: "Bring energy and inspiration", color: "red" },
      { text: "Keep things organized", color: "green" },
      { text: "Suggest creative ideas", color: "blue" },
    ],
  },
  {
    id: 49,
    section: "Self-Awareness & Reflection",
    question: "My preferred role in a team is…",
    options: [
      { text: "Driver", color: "yellow" },
      { text: "Motivator", color: "red" },
      { text: "Organizer", color: "green" },
      { text: "Innovator", color: "blue" },
    ],
  },
  {
    id: 50,
    section: "Self-Awareness & Reflection",
    question: "Ultimately, I want to be known as…",
    options: [
      { text: "A doer who gets results", color: "yellow" },
      { text: "A motivator who inspires people", color: "red" },
      { text: "A thinker who builds order", color: "green" },
      { text: "A creator who innovates the future", color: "blue" },
    ],
  },
];

const ProfessionalAssessment50Q = () => {
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

      if (currentQuestion < professionalQuestions50Q.length - 1) {
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
          totalQuestions: professionalQuestions50Q.length,
          assessmentType: 'professional_50q'
        };

        // Save to database if user is logged in
        if (user) {
          try {
            await supabase
              .from('assessment_results')
              .insert({
                user_id: user.id,
                assessment_type: 'professional_50q',
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

  const progress = ((currentQuestion + 1) / professionalQuestions50Q.length) * 100;
  const currentQuestionData = professionalQuestions50Q[currentQuestion];
  
  // Shuffle options for current question
  const shuffledOptions = useMemo(() => {
    return shuffleArray(currentQuestionData.options);
  }, [currentQuestion]);

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
                    <p className="text-muted-foreground">Question {currentQuestion + 1} of {professionalQuestions50Q.length}</p>
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
                {currentQuestion === professionalQuestions50Q.length - 1 ? 'See Results' : 'Next Question'}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAssessment50Q;
