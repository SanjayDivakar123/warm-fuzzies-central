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

const student50Questions = [
  // Section A: Leadership & Initiative (Q1–Q10)
  {
    id: 1,
    stage: "Leadership & Initiative",
    question: "When a group project begins, my first instinct is to…",
    options: [
      { text: "Take action immediately and divide responsibilities", color: "yellow" },
      { text: "Inspire the group with a motivating idea or vision", color: "red" },
      { text: "Plan out the steps logically before starting", color: "green" },
      { text: "Suggest new, creative approaches no one has thought of yet", color: "blue" },
    ],
  },
  {
    id: 2,
    stage: "Leadership & Initiative",
    question: "I feel most satisfied in group work when…",
    options: [
      { text: "The team executes the plan efficiently", color: "yellow" },
      { text: "Everyone feels energized and connected", color: "red" },
      { text: "The process is organized and makes sense", color: "green" },
      { text: "We create something original and innovative", color: "blue" },
    ],
  },
  {
    id: 3,
    stage: "Leadership & Initiative",
    question: "When no one steps up to lead…",
    options: [
      { text: "I immediately start assigning tasks and pushing forward", color: "yellow" },
      { text: "I motivate others with encouragement and vision", color: "red" },
      { text: "I analyze the situation and build a logical framework", color: "green" },
      { text: "I propose a creative new way to move ahead", color: "blue" },
    ],
  },
  {
    id: 4,
    stage: "Leadership & Initiative",
    question: "In stressful situations, I usually…",
    options: [
      { text: "Push into action and take control", color: "yellow" },
      { text: "Rally people with energy and positivity", color: "red" },
      { text: "Slow down, think critically, and find a solution", color: "green" },
      { text: "Reframe the problem in a fresh, innovative way", color: "blue" },
    ],
  },
  {
    id: 5,
    stage: "Leadership & Initiative",
    question: "My teammates usually describe me as…",
    options: [
      { text: "The one who gets things done", color: "yellow" },
      { text: "The one who inspires and motivates", color: "red" },
      { text: "The one who organizes and solves problems", color: "green" },
      { text: "The one who brings fresh ideas", color: "blue" },
    ],
  },
  {
    id: 6,
    stage: "Leadership & Initiative",
    question: "When given a new assignment, I prefer to…",
    options: [
      { text: "Jump right in and start", color: "yellow" },
      { text: "Share my excitement and get others on board", color: "red" },
      { text: "Break it into logical steps", color: "green" },
      { text: "Brainstorm new ways of approaching it", color: "blue" },
    ],
  },
  {
    id: 7,
    stage: "Leadership & Initiative",
    question: "In leadership, I value most…",
    options: [
      { text: "Speed and efficiency", color: "yellow" },
      { text: "Passion and vision", color: "red" },
      { text: "Structure and order", color: "green" },
      { text: "Creativity and innovation", color: "blue" },
    ],
  },
  {
    id: 8,
    stage: "Leadership & Initiative",
    question: "If a teammate is stuck, I…",
    options: [
      { text: "Take over to keep things moving", color: "yellow" },
      { text: "Motivate them and remind them of the bigger picture", color: "red" },
      { text: "Walk them through logical steps", color: "green" },
      { text: "Suggest new angles to try", color: "blue" },
    ],
  },
  {
    id: 9,
    stage: "Leadership & Initiative",
    question: "The best leaders…",
    options: [
      { text: "Drive execution and results", color: "yellow" },
      { text: "Inspire and connect with people", color: "red" },
      { text: "Think analytically and structure clearly", color: "green" },
      { text: "Envision and innovate for the future", color: "blue" },
    ],
  },
  {
    id: 10,
    stage: "Leadership & Initiative",
    question: "My natural instinct is to…",
    options: [
      { text: "Act first and figure things out along the way", color: "yellow" },
      { text: "Share a vision and bring people together", color: "red" },
      { text: "Carefully analyze before moving forward", color: "green" },
      { text: "Question assumptions and explore new ideas", color: "blue" },
    ],
  },
  // Section B: Collaboration & Communication (Q11–Q20)
  {
    id: 11,
    stage: "Collaboration & Communication",
    question: "When working in a group, I tend to…",
    options: [
      { text: "Push the team to take action quickly", color: "yellow" },
      { text: "Energize and encourage everyone", color: "red" },
      { text: "Keep things organized and structured", color: "green" },
      { text: "Suggest creative approaches to improve the work", color: "blue" },
    ],
  },
  {
    id: 12,
    stage: "Collaboration & Communication",
    question: "During group discussions, I…",
    options: [
      { text: "Move things toward decisions", color: "yellow" },
      { text: "Make sure everyone feels heard", color: "red" },
      { text: "Focus on clarifying details", color: "green" },
      { text: "Ask questions that open new possibilities", color: "blue" },
    ],
  },
  {
    id: 13,
    stage: "Collaboration & Communication",
    question: "If conflict arises, I…",
    options: [
      { text: "Push the group to resolve it fast", color: "yellow" },
      { text: "Use words to motivate reconciliation", color: "red" },
      { text: "Analyze both sides logically", color: "green" },
      { text: "Suggest an alternative idea everyone can rally around", color: "blue" },
    ],
  },
  {
    id: 14,
    stage: "Collaboration & Communication",
    question: "I contribute best when…",
    options: [
      { text: "I'm driving progress", color: "yellow" },
      { text: "I'm inspiring people", color: "red" },
      { text: "I'm problem-solving logically", color: "green" },
      { text: "I'm creating new ideas", color: "blue" },
    ],
  },
  {
    id: 15,
    stage: "Collaboration & Communication",
    question: "People count on me to…",
    options: [
      { text: "Get things done under pressure", color: "yellow" },
      { text: "Lift spirits and bring energy", color: "red" },
      { text: "Keep things accurate and organized", color: "green" },
      { text: "Spot opportunities no one else sees", color: "blue" },
    ],
  },
  {
    id: 16,
    stage: "Collaboration & Communication",
    question: "My style of communication is…",
    options: [
      { text: "Direct and action-focused", color: "yellow" },
      { text: "Inspiring and expressive", color: "red" },
      { text: "Clear and detail-oriented", color: "green" },
      { text: "Conceptual and visionary", color: "blue" },
    ],
  },
  {
    id: 17,
    stage: "Collaboration & Communication",
    question: "I dislike when teammates…",
    options: [
      { text: "Waste time without acting", color: "yellow" },
      { text: "Lack enthusiasm", color: "red" },
      { text: "Skip over details", color: "green" },
      { text: "Resist new ideas", color: "blue" },
    ],
  },
  {
    id: 18,
    stage: "Collaboration & Communication",
    question: "I usually motivate others by…",
    options: [
      { text: "Showing results and progress", color: "yellow" },
      { text: "Using passion and vision", color: "red" },
      { text: "Explaining logic and structure", color: "green" },
      { text: "Sharing bold new ideas", color: "blue" },
    ],
  },
  {
    id: 19,
    stage: "Collaboration & Communication",
    question: "In a group presentation, I'd rather…",
    options: [
      { text: "Present clear actions and results", color: "yellow" },
      { text: "Tell the story and inspire the audience", color: "red" },
      { text: "Explain data and logic behind the work", color: "green" },
      { text: "Share the innovative, creative elements", color: "blue" },
    ],
  },
  {
    id: 20,
    stage: "Collaboration & Communication",
    question: "My group role is often…",
    options: [
      { text: "The driver", color: "yellow" },
      { text: "The motivator", color: "red" },
      { text: "The organizer", color: "green" },
      { text: "The idea generator", color: "blue" },
    ],
  },
  // Section C: Problem-Solving & Decision-Making (Q21–Q30)
  {
    id: 21,
    stage: "Problem-Solving & Decision-Making",
    question: "Faced with a tough decision, I…",
    options: [
      { text: "Choose quickly and take action", color: "yellow" },
      { text: "Consider how it inspires or affects others", color: "red" },
      { text: "Analyze carefully and choose logically", color: "green" },
      { text: "Brainstorm new solutions before deciding", color: "blue" },
    ],
  },
  {
    id: 22,
    stage: "Problem-Solving & Decision-Making",
    question: "When given little time to solve a problem…",
    options: [
      { text: "Act immediately and adapt later", color: "yellow" },
      { text: "Encourage the team to stay positive", color: "red" },
      { text: "Break it into smaller, logical pieces", color: "green" },
      { text: "Try to reframe the challenge creatively", color: "blue" },
    ],
  },
  {
    id: 23,
    stage: "Problem-Solving & Decision-Making",
    question: "I trust my decisions most when…",
    options: [
      { text: "I see action happening fast", color: "yellow" },
      { text: "Others feel inspired", color: "red" },
      { text: "The data and logic back it up", color: "green" },
      { text: "It feels innovative and future-oriented", color: "blue" },
    ],
  },
  {
    id: 24,
    stage: "Problem-Solving & Decision-Making",
    question: "My biggest strength in solving problems is…",
    options: [
      { text: "Speed and determination", color: "yellow" },
      { text: "Motivation and energy", color: "red" },
      { text: "Logic and analysis", color: "green" },
      { text: "Creativity and originality", color: "blue" },
    ],
  },
  {
    id: 25,
    stage: "Problem-Solving & Decision-Making",
    question: "If I make a mistake…",
    options: [
      { text: "I move quickly to fix it", color: "yellow" },
      { text: "I stay positive and reassure others", color: "red" },
      { text: "I analyze what went wrong carefully", color: "green" },
      { text: "I try a totally different approach", color: "blue" },
    ],
  },
  {
    id: 26,
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
    id: 27,
    stage: "Problem-Solving & Decision-Making",
    question: "I define success as…",
    options: [
      { text: "Achieving results quickly", color: "yellow" },
      { text: "Inspiring and energizing people", color: "red" },
      { text: "Solving problems effectively", color: "green" },
      { text: "Creating something innovative", color: "blue" },
    ],
  },
  {
    id: 28,
    stage: "Problem-Solving & Decision-Making",
    question: "In a debate, I…",
    options: [
      { text: "Push for a decision fast", color: "yellow" },
      { text: "Persuade with passion and stories", color: "red" },
      { text: "Use facts and logic", color: "green" },
      { text: "Offer new perspectives and ideas", color: "blue" },
    ],
  },
  {
    id: 29,
    stage: "Problem-Solving & Decision-Making",
    question: "My first step in solving problems is…",
    options: [
      { text: "Jump into action", color: "yellow" },
      { text: "Rally others with vision", color: "red" },
      { text: "Break down details logically", color: "green" },
      { text: "Explore creative alternatives", color: "blue" },
    ],
  },
  {
    id: 30,
    stage: "Problem-Solving & Decision-Making",
    question: "If my solution doesn't work…",
    options: [
      { text: "I immediately try something else", color: "yellow" },
      { text: "I encourage others not to give up", color: "red" },
      { text: "I reanalyze step by step", color: "green" },
      { text: "I redesign the idea in a new way", color: "blue" },
    ],
  },
  // Section D: Adaptability & Creativity (Q31–Q40)
  {
    id: 31,
    stage: "Adaptability & Creativity",
    question: "I handle sudden changes by…",
    options: [
      { text: "Acting fast to keep things moving", color: "yellow" },
      { text: "Motivating others to stay upbeat", color: "red" },
      { text: "Adjusting my plan logically", color: "green" },
      { text: "Rethinking everything with a fresh idea", color: "blue" },
    ],
  },
  {
    id: 32,
    stage: "Adaptability & Creativity",
    question: "I learn best when…",
    options: [
      { text: "I can immediately apply it", color: "yellow" },
      { text: "It connects to something inspiring", color: "red" },
      { text: "It's explained step by step", color: "green" },
      { text: "It's open for me to explore creatively", color: "blue" },
    ],
  },
  {
    id: 33,
    stage: "Adaptability & Creativity",
    question: "If I had free time, I'd rather…",
    options: [
      { text: "Build something useful", color: "yellow" },
      { text: "Share ideas or stories with others", color: "red" },
      { text: "Research or analyze something interesting", color: "green" },
      { text: "Experiment with a new creative project", color: "blue" },
    ],
  },
  {
    id: 34,
    stage: "Adaptability & Creativity",
    question: "I stay motivated when…",
    options: [
      { text: "I see quick progress", color: "yellow" },
      { text: "People around me are energized", color: "red" },
      { text: "The work is logical and structured", color: "green" },
      { text: "I get to experiment and innovate", color: "blue" },
    ],
  },
  {
    id: 35,
    stage: "Adaptability & Creativity",
    question: "My adaptability comes from…",
    options: [
      { text: "Taking fast action no matter what", color: "yellow" },
      { text: "Staying positive and inspiring others", color: "red" },
      { text: "Carefully adjusting step by step", color: "green" },
      { text: "Redesigning new approaches creatively", color: "blue" },
    ],
  },
  {
    id: 36,
    stage: "Adaptability & Creativity",
    question: "When trying new things, I…",
    options: [
      { text: "Jump in and figure it out as I go", color: "yellow" },
      { text: "Look for inspiration and share enthusiasm", color: "red" },
      { text: "Research carefully before starting", color: "green" },
      { text: "Try unconventional ways just to see what happens", color: "blue" },
    ],
  },
  {
    id: 37,
    stage: "Adaptability & Creativity",
    question: "I'm most energized by…",
    options: [
      { text: "Action and momentum", color: "yellow" },
      { text: "Vision and excitement", color: "red" },
      { text: "Order and clarity", color: "green" },
      { text: "Creativity and imagination", color: "blue" },
    ],
  },
  {
    id: 38,
    stage: "Adaptability & Creativity",
    question: "If my plan is interrupted, I…",
    options: [
      { text: "Push ahead with a new action immediately", color: "yellow" },
      { text: "Motivate others to stay flexible", color: "red" },
      { text: "Re-plan with structure", color: "green" },
      { text: "Pivot into a creative new path", color: "blue" },
    ],
  },
  {
    id: 39,
    stage: "Adaptability & Creativity",
    question: "I enjoy projects that are…",
    options: [
      { text: "Fast-paced and goal-driven", color: "yellow" },
      { text: "Energizing and people-focused", color: "red" },
      { text: "Structured and logical", color: "green" },
      { text: "Open-ended and innovative", color: "blue" },
    ],
  },
  {
    id: 40,
    stage: "Adaptability & Creativity",
    question: "I thrive when I can…",
    options: [
      { text: "Take decisive action", color: "yellow" },
      { text: "Share vision and passion", color: "red" },
      { text: "Think critically and logically", color: "green" },
      { text: "Create and innovate freely", color: "blue" },
    ],
  },
  // Section E: Self-Awareness & Reflection (Q41–Q50)
  {
    id: 41,
    stage: "Self-Awareness & Reflection",
    question: "My biggest strength is…",
    options: [
      { text: "Taking action quickly", color: "yellow" },
      { text: "Motivating others", color: "red" },
      { text: "Thinking logically", color: "green" },
      { text: "Being creative", color: "blue" },
    ],
  },
  {
    id: 42,
    stage: "Self-Awareness & Reflection",
    question: "I get frustrated when…",
    options: [
      { text: "People don't act fast enough", color: "yellow" },
      { text: "Others lack enthusiasm", color: "red" },
      { text: "Things are unclear or disorganized", color: "green" },
      { text: "New ideas are shut down", color: "blue" },
    ],
  },
  {
    id: 43,
    stage: "Self-Awareness & Reflection",
    question: "I measure my growth by…",
    options: [
      { text: "What I've accomplished", color: "yellow" },
      { text: "How many people I've inspired", color: "red" },
      { text: "What I've learned and understood", color: "green" },
      { text: "What I've created or innovated", color: "blue" },
    ],
  },
  {
    id: 44,
    stage: "Self-Awareness & Reflection",
    question: "My natural leadership style is…",
    options: [
      { text: "Action-oriented", color: "yellow" },
      { text: "Visionary and motivational", color: "red" },
      { text: "Structured and logical", color: "green" },
      { text: "Creative and future-focused", color: "blue" },
    ],
  },
  {
    id: 45,
    stage: "Self-Awareness & Reflection",
    question: "I gain energy from…",
    options: [
      { text: "Achieving goals", color: "yellow" },
      { text: "Sharing vision with others", color: "red" },
      { text: "Solving puzzles and analyzing", color: "green" },
      { text: "Imagining new possibilities", color: "blue" },
    ],
  },
  {
    id: 46,
    stage: "Self-Awareness & Reflection",
    question: "The hardest thing for me is…",
    options: [
      { text: "Waiting without acting", color: "yellow" },
      { text: "Working without inspiration", color: "red" },
      { text: "Operating without clear data", color: "green" },
      { text: "Following rigid rules", color: "blue" },
    ],
  },
  {
    id: 47,
    stage: "Self-Awareness & Reflection",
    question: "My proudest moments come when…",
    options: [
      { text: "I achieve something significant", color: "yellow" },
      { text: "I inspire or lead others", color: "red" },
      { text: "I solve a complex problem", color: "green" },
      { text: "I create something unique", color: "blue" },
    ],
  },
  {
    id: 48,
    stage: "Self-Awareness & Reflection",
    question: "People usually notice that I…",
    options: [
      { text: "Move quickly into action", color: "yellow" },
      { text: "Motivate and energize others", color: "red" },
      { text: "Think carefully and logically", color: "green" },
      { text: "Bring creative ideas", color: "blue" },
    ],
  },
  {
    id: 49,
    stage: "Self-Awareness & Reflection",
    question: "My preferred role in a team is…",
    options: [
      { text: "Driving execution", color: "yellow" },
      { text: "Inspiring and connecting people", color: "red" },
      { text: "Organizing and analyzing", color: "green" },
      { text: "Innovating and ideating", color: "blue" },
    ],
  },
  {
    id: 50,
    stage: "Self-Awareness & Reflection",
    question: "Ultimately, I want to be known as…",
    options: [
      { text: "A doer who gets results", color: "yellow" },
      { text: "A motivator who uplifts others", color: "red" },
      { text: "A thinker who solves problems", color: "green" },
      { text: "A creator who innovates", color: "blue" },
    ],
  },
];

const StudentAssessment50 = () => {
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

      if (currentQuestion < student50Questions.length - 1) {
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
          totalQuestions: student50Questions.length,
          answers: newAnswers,
          isStudent: true,
          isPro: true
        };

        // Store results in localStorage
        localStorage.setItem('student50AssessmentResults', JSON.stringify(results));

        // Save to database
        if (user) {
          try {
            await supabase
              .from('assessment_results')
              .insert({
                user_id: user.id,
                assessment_type: 'student_pro',
                results: results
              });
          } catch (error) {
            console.error('Error saving assessment results:', error);
          }
        }

        navigate('/student-pro-results');
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

  const progress = ((currentQuestion + 1) / student50Questions.length) * 100;
  const currentQuestionData = student50Questions[currentQuestion];
  
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
                  <span className="text-sm font-bold text-primary tracking-wide">Student Pro Assessment - 50 Questions</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl font-black leading-tight">
                  Deep Dive Into
                  <br />
                  <span className="gradient-text-primary">Your Leadership DNA</span>
                </h1>
                
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Comprehensive 50-question assessment for in-depth leadership analysis
                </p>
                
                <div className="flex justify-center gap-8 mt-6">
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-blue mx-auto mb-2" />
                    <p className="text-sm font-semibold">30 Minutes</p>
                  </div>
                  <div className="text-center">
                    <Sparkles className="w-8 h-8 text-yellow mx-auto mb-2" />
                    <p className="text-sm font-semibold">Deep Analysis</p>
                  </div>
                  <div className="text-center">
                    <GraduationCap className="w-8 h-8 text-green mx-auto mb-2" />
                    <p className="text-sm font-semibold">3-Page Report</p>
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
                      <h2 className="text-2xl font-bold">Student Pro Assessment</h2>
                      <p className="text-muted-foreground">Question {currentQuestion + 1} of {student50Questions.length}</p>
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
                  {currentQuestion === student50Questions.length - 1 ? 'Get Results' : 'Next Question'}
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

export default StudentAssessment50;
