import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { questionSets, type AudienceType } from "@/data/adaptiveQuestions";

const ProAssessment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get the audience type from URL parameters, default to 'professional'
  const audienceType = (searchParams.get('audience') as AudienceType) || 'professional';
  
  // Get the appropriate question set based on audience
  const proQuestions = questionSets[audienceType];
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show error if audience type not recognized
  if (!proQuestions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Invalid Assessment Type</h2>
            <p className="text-muted-foreground mb-4">
              The assessment type "{audienceType}" is not recognized.
            </p>
            <Button onClick={() => navigate('/assessment-selection?type=pro')}>
              Go Back to Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has access to pro assessment
  useEffect(() => {
    const checkAccess = () => {
      const paymentKey = `payment_verified_pro_${user?.id}`;
      const paymentData = localStorage.getItem(paymentKey);
      
      if (!paymentData) {
        navigate('/pricing');
        return;
      }
    };

    if (user) {
      checkAccess();
    }
  }, [user, navigate]);

  // Load progress when component mounts
  useEffect(() => {
    const savedProgress = localStorage.getItem(`pro_assessment_progress_${user?.id}_${audienceType}`);
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setCurrentQuestion(progress.currentQuestion || 0);
      setAnswers(progress.answers || {});
    }
  }, [user?.id, audienceType]);

  // Save progress whenever answers change
  useEffect(() => {
    if (user?.id && Object.keys(answers).length > 0) {
      const progress = {
        currentQuestion,
        answers,
        audienceType,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`pro_assessment_progress_${user?.id}_${audienceType}`, JSON.stringify(progress));
    }
  }, [currentQuestion, answers, user?.id, audienceType]);

  const currentQuestionData = proQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / proQuestions.length) * 100;

  useEffect(() => {
    setSelectedAnswer(answers[currentQuestionData?.id] || "");
  }, [currentQuestion, answers, currentQuestionData?.id]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNext = () => {
    if (selectedAnswer && currentQuestionData) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestionData.id]: selectedAnswer
      }));
      
      if (currentQuestion < proQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        handleSubmit();
      }
      setSelectedAnswer("");
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateResults = () => {
    const colorCounts = { yellow: 0, red: 0, green: 0, blue: 0 };
    
    Object.values(answers).forEach(answer => {
      const selectedOption = proQuestions
        .flatMap(q => q.options)
        .find(option => option.text === answer);
      
      if (selectedOption) {
        colorCounts[selectedOption.color]++;
      }
    });

    const totalAnswers = Object.keys(answers).length;
    const colorPercentages = {
      yellow: Math.round((colorCounts.yellow / totalAnswers) * 100),
      red: Math.round((colorCounts.red / totalAnswers) * 100),
      green: Math.round((colorCounts.green / totalAnswers) * 100),
      blue: Math.round((colorCounts.blue / totalAnswers) * 100),
    };

    const dominantColor = Object.entries(colorCounts).reduce((a, b) => 
      colorCounts[a[0] as keyof typeof colorCounts] > colorCounts[b[0] as keyof typeof colorCounts] ? a : b
    )[0];

    return {
      dominantColor,
      colorPercentages,
      colorCounts,
      totalQuestions: proQuestions.length,
      audienceType,
      timestamp: new Date().toISOString()
    };
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const results = calculateResults();
      
      const { error } = await supabase
        .from('assessment_results')
        .upsert({
          user_id: user.id,
          assessment_type: 'pro',
          results: results
        }, {
          onConflict: 'user_id,assessment_type'
        });

      if (error) {
        console.error('Error saving results:', error);
        return;
      }

      // Clear progress from localStorage
      localStorage.removeItem(`pro_assessment_progress_${user.id}_${audienceType}`);
      
      // Navigate to results with audience type
      navigate(`/pro-results?audience=${audienceType}`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentQuestionData) {
    return <div>Loading...</div>;
  }

  const getAudienceLabel = (type: AudienceType) => {
    const labels = {
      student: 'Student',
      teacher: 'Teacher/Educator', 
      professional: 'Professional',
      entrepreneur: 'Entrepreneur',
      executive: 'Executive',
      manager: 'Manager',
      coach: 'Coach/Athlete'
    };
    return labels[type] || type;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16">
          <div className="container-wide py-8 max-w-4xl mx-auto px-4">
            
            {/* Header */}
            <div className="text-center mb-8 animate-fade-in">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-yellow-500" />
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Pro Assessment
                </h1>
                <Crown className="w-6 h-6 text-yellow-500" />
              </div>
              <p className="text-muted-foreground text-lg mb-2">
                Context: <span className="font-semibold text-primary">{getAudienceLabel(audienceType)}</span>
              </p>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Comprehensive leadership assessment with advanced insights, team dynamics analysis, and strategic recommendations.
                Questions are tailored to your selected context for maximum relevance.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 animate-fade-in delay-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Question {currentQuestion + 1} of {proQuestions.length}
                </span>
                <span className="text-sm font-medium text-primary">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <Progress value={progress} className="h-3 bg-muted" />
            </div>

            {/* Question Card */}
            <Card className="glass-card-strong border-primary/20 animate-fade-in delay-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                    {currentQuestion + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                      {currentQuestionData.stage}
                    </p>
                    <CardTitle className="text-xl md:text-2xl leading-tight text-foreground">
                      {currentQuestionData.question}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <RadioGroup 
                  value={selectedAnswer} 
                  onValueChange={handleAnswerSelect}
                  className="space-y-4"
                >
                  {currentQuestionData.options.map((option, index) => (
                    <div 
                      key={index} 
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-md ${
                        selectedAnswer === option.text 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleAnswerSelect(option.text)}
                    >
                      <RadioGroupItem 
                        value={option.text} 
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

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Your progress is automatically saved
                </p>
              </div>

              <Button
                onClick={handleNext}
                disabled={!selectedAnswer || isSubmitting}
                className="flex items-center gap-2 hover-scale"
              >
                {currentQuestion === proQuestions.length - 1 ? (
                  isSubmitting ? 'Submitting...' : 'Get Pro Results'
                ) : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProAssessment;