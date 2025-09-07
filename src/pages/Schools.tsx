import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navigation/Navbar";
import { CheckCircle, XCircle, AlertCircle, Users, BookOpen, Target, Award, TrendingUp, ChevronRight } from "lucide-react";

interface QuizResponse {
  question: string;
  answer: 'yes' | 'no' | 'sometimes';
}

export default function Schools() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const questions = [
    "New initiatives often stall or lose momentum.",
    "Staff conflict usually comes from unclear roles, not effort.",
    "Teachers duplicate work or miss handoffs.",
    "PD feels disconnected from daily teamwork.",
    "There's no clear measure of staff clarity.",
    "Cross-department projects are harder than they should be."
  ];

  const handleAnswer = (answer: 'yes' | 'no' | 'sometimes') => {
    const newResponses = [...responses, { question: questions[currentQuestion], answer }];
    setResponses(newResponses);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateResult = () => {
    const yesCount = responses.filter(r => r.answer === 'yes').length;
    const sometimesCount = responses.filter(r => r.answer === 'sometimes').length;
    const totalFriction = yesCount + sometimesCount;

    if (totalFriction >= 4) {
      return {
        level: 'high',
        title: 'High Friction Detected',
        description: 'Your school shows significant mis-alignment. A Team Mix Map will reveal specific areas for improvement.',
        color: 'bg-red text-red-foreground'
      };
    } else if (totalFriction >= 1) {
      return {
        level: 'moderate',
        title: 'Moderate Friction Present',
        description: 'Some friction exists. A Mix Map will help clarify roles and improve collaboration.',
        color: 'bg-yellow text-yellow-foreground'
      };
    } else {
      return {
        level: 'low',
        title: 'Low Friction - Great Foundation',
        description: "You're in a good place, but a Mix Map can validate alignment and identify optimization opportunities.",
        color: 'bg-green text-green-foreground'
      };
    }
  };

  const scrollToQuiz = () => {
    document.getElementById('quiz-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const startQuiz = () => {
    setQuizStarted(true);
  };

  const bookTeamMixMap = () => {
    // For now, navigate to pricing or contact
    navigate('/pricing');
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <Navbar />
      
      {/* Hero Section */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-balance gradient-text mb-6">
              Is Your School Aligned for Success?
            </h1>
            <h2 className="text-xl md:text-2xl text-muted-foreground mb-8 text-balance">
              Take a 3-minute diagnostic quiz and instantly see if your staff shows alignment risks that RoleColor™ can solve.
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 shadow-colorful hover-lift"
                onClick={scrollToQuiz}
              >
                Take the Quiz
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => document.getElementById('mix-map-preview')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See a Sample Team Mix Map
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quiz Section */}
      <section id="quiz-section" className="section-padding bg-card/50">
        <div className="container-wide">
          <Card className="max-w-3xl mx-auto glass-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl md:text-3xl">
                Does your school need RoleColor™?
              </CardTitle>
              <p className="text-muted-foreground">
                Answer 6 short questions and find out.
              </p>
            </CardHeader>
            <CardContent>
              {!quizStarted ? (
                <div className="text-center">
                  <Button onClick={startQuiz} size="lg" className="px-8">
                    Start Quiz
                  </Button>
                </div>
              ) : !showResults ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Question {currentQuestion + 1} of {questions.length}
                    </span>
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-6">
                      {questions[currentQuestion]}
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => handleAnswer('yes')}
                        className="px-8"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Yes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleAnswer('sometimes')}
                        className="px-8"
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Sometimes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleAnswer('no')}
                        className="px-8"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        No
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  {(() => {
                    const result = calculateResult();
                    return (
                      <>
                        <Badge className={`${result.color} text-lg px-4 py-2`}>
                          {result.title}
                        </Badge>
                        <p className="text-lg">{result.description}</p>
                        <Button 
                          size="lg" 
                          onClick={bookTeamMixMap}
                          className="px-8"
                        >
                          Book a Team Mix Map
                        </Button>
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Problem → Promise Section */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">The Problem</h2>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <XCircle className="h-6 w-6 text-red mt-1 flex-shrink-0" />
                  Too many initiatives, not enough alignment
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-6 w-6 text-red mt-1 flex-shrink-0" />
                  Staff conflict stems from unclear roles
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-6 w-6 text-red mt-1 flex-shrink-0" />
                  No clarity scoreboard = invisible progress
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">The Promise</h2>
              <div className="p-6 bg-gradient-subtle rounded-lg">
                <p className="text-lg font-medium">
                  RoleColor™ makes alignment measurable and fixable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Mix Map Preview */}
      <section id="mix-map-preview" className="section-padding bg-card/50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Team Mix Map Preview</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how your staff's role preferences create friction points and collaboration opportunities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red rounded-full"></div>
                  Red: Directors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Drive initiatives, make quick decisions, focus on results
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue rounded-full"></div>
                  Blue: Analysts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Plan thoroughly, ensure quality, maintain standards
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green rounded-full"></div>
                  Green: Supporters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Build consensus, support teams, ensure inclusion
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              See a Sample Mix Map
            </Button>
          </div>
        </div>
      </section>

      {/* Outcomes Grid */}
      <section className="section-padding">
        <div className="container-wide">
          <h2 className="text-3xl font-bold text-center mb-12">Proven Outcomes</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card text-center">
              <CardContent className="pt-6">
                <TrendingUp className="h-12 w-12 text-green mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green mb-2">+20-35%</h3>
                <p className="text-muted-foreground">Role clarity improvement</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card text-center">
              <CardContent className="pt-6">
                <Target className="h-12 w-12 text-blue mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-blue mb-2">+15-25%</h3>
                <p className="text-muted-foreground">Faster initiative completion</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card text-center">
              <CardContent className="pt-6">
                <Award className="h-12 w-12 text-yellow mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-yellow mb-2">-25-40%</h3>
                <p className="text-muted-foreground">Fewer handoff breakdowns</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="section-padding bg-card/50">
        <div className="container-wide">
          <h2 className="text-3xl font-bold text-center mb-12">What You Get</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green" />
                    Free quiz & readiness score
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green" />
                    Team Mix Map briefing
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green" />
                    Alignment tools (handoff checklists, meeting templates)
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green" />
                    Optional PD credit alignment
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Use Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Curriculum rollout</li>
                  <li>• PLC collaboration</li>
                  <li>• Teacher retention</li>
                  <li>• Leadership onboarding</li>
                  <li>• School improvement plan execution</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing & Guarantee */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Pricing & Guarantee</h2>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <p className="text-xl mb-4">
                  <strong>Quiz + Mix Map = Free</strong> (qualified schools)
                </p>
                <Separator className="my-6" />
                <p className="text-muted-foreground">
                  <strong>Our Guarantee:</strong> If the Mix Map doesn't surface 3+ actionable insights, 
                  we'll run a second session free.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-card/50">
        <div className="container-wide">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold mb-2">How long is the quiz?</h3>
              <p className="text-muted-foreground mb-6">Just 3 minutes - 6 simple questions.</p>
              
              <h3 className="font-semibold mb-2">Do all staff take it?</h3>
              <p className="text-muted-foreground">Start with leadership team, then expand based on results.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is it PD creditable?</h3>
              <p className="text-muted-foreground mb-6">Yes, artifacts and documentation provided.</p>
              
              <h3 className="font-semibold mb-2">Privacy concerns?</h3>
              <p className="text-muted-foreground">No student data used - only staff role preferences.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-bold mb-6">
            Get Your School's Alignment Readiness Score Today
          </h2>
          <Button 
            size="lg" 
            className="text-lg px-12 py-6 shadow-rainbow hover-lift"
            onClick={scrollToQuiz}
          >
            Take the Quiz
          </Button>
        </div>
      </section>
    </div>
  );
}