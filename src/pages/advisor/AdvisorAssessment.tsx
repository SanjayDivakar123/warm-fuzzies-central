import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { shuffleArray } from "@/lib/utils";
import { premiumQuestions } from "@/pages/PremiumAssessment";
import { proQuestions } from "@/pages/ProAssessment";

type Question = {
  id: number;
  stage: string;
  question: string;
  options: { text: string; color: string }[];
};

const buildResult = (assessmentType: "premium" | "pro", questions: Question[], answers: Record<number, string>) => {
  const colorCounts = { yellow: 0, red: 0, green: 0, blue: 0 };
  Object.values(answers).forEach((color) => {
    colorCounts[color as keyof typeof colorCounts]++;
  });

  if (assessmentType === "premium") {
    const totalAnswers = Object.keys(answers).length || 1;
    const scores = {
      yellow: Math.round((colorCounts.yellow / totalAnswers) * 100),
      red: Math.round((colorCounts.red / totalAnswers) * 100),
      green: Math.round((colorCounts.green / totalAnswers) * 100),
      blue: Math.round((colorCounts.blue / totalAnswers) * 100),
    };
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    return {
      dominantColor: sorted[0][0],
      secondaryColor: sorted[1][0],
      scores,
      totalQuestions: questions.length,
      isPremium: true,
    };
  }

  const sortedColors = Object.entries(colorCounts).sort(([, a], [, b]) => b - a);
  return {
    dominantColor: sortedColors[0][0],
    secondaryColor: sortedColors[1][0],
    tertiaryColor: sortedColors[2][0],
    scores: colorCounts,
    totalQuestions: questions.length,
    isPro: true,
    colorDistribution: sortedColors,
  };
};

export default function AdvisorAssessment() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assessmentType, setAssessmentType] = useState<"premium" | "pro" | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const { data, error } = await supabase.functions.invoke("get-advisor-assessment-session", {
        body: { assessmentToken: token },
      });

      if (error || !data?.submission) {
        setSessionError(error?.message || data?.error || "This assessment link is unavailable.");
      } else {
        setAssessmentType(data.submission.assessmentType === "pro" ? "pro" : "premium");
      }
      setSessionLoading(false);
    };

    if (token) {
      loadSession();
    }
  }, [token]);

  const questions = useMemo<Question[]>(() => {
    if (!assessmentType) return [];
    return shuffleArray(assessmentType === "pro" ? (proQuestions as Question[]) : (premiumQuestions as Question[])).map((question) => ({
      ...question,
      options: shuffleArray(question.options),
    }));
  }, [assessmentType]);

  const finishAssessment = async (finalAnswers: Record<number, string>) => {
    if (!token || !assessmentType) return;
    setSubmitting(true);
    const results = buildResult(assessmentType, questions, finalAnswers);
    const { data, error } = await supabase.functions.invoke("complete-advisor-assessment", {
      body: { assessmentToken: token, results },
    });
    setSubmitting(false);

    if (error || !data?.guestResultUrl) {
      toast({
        title: "Could not save results",
        description: error?.message || data?.error || "Please try again.",
        variant: "destructive",
      });
      return;
    }

    sessionStorage.setItem(`advisor_result_message_${token}`, data.message || "");
    window.location.href = data.guestResultUrl;
  };

  const handleNext = () => {
    if (!selectedAnswer) return;
    const nextAnswers = { ...answers, [currentQuestion]: selectedAnswer };
    setAnswers(nextAnswers);
    setSelectedAnswer("");

    if (currentQuestion < questions.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      setSelectedAnswer(nextAnswers[nextQuestion] || "");
    } else {
      finishAssessment(nextAnswers);
    }
  };

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sessionError || !question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md text-center">
          <CardContent className="p-6">
            <h1 className="text-xl font-semibold">Assessment unavailable</h1>
            <p className="mt-2 text-muted-foreground">{sessionError || "This assessment link is invalid."}</p>
            <Button className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Advisor Assessment</p>
          <h1 className="text-3xl font-bold text-slate-950">
            {assessmentType === "pro" ? "Pro Deep Dive" : "Premium Leadership"} Assessment
          </h1>
          <Progress value={progress} className="h-3" />
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="text-sm font-medium text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length} - {question.stage}
            </div>
            <CardTitle className="leading-relaxed">{question.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} className="space-y-3">
              {question.options.map((option, index) => (
                <div
                  key={`${question.id}-${index}`}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition ${
                    selectedAnswer === option.color ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                  onClick={() => setSelectedAnswer(option.color)}
                >
                  <RadioGroupItem value={option.color} id={`option-${index}`} className="mt-1" />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer leading-relaxed">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={() => {
              const previous = Math.max(0, currentQuestion - 1);
              setCurrentQuestion(previous);
              setSelectedAnswer(answers[previous] || "");
            }}
            disabled={currentQuestion === 0 || submitting}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button onClick={handleNext} disabled={!selectedAnswer || submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {currentQuestion === questions.length - 1 ? "Submit Results" : "Next"}
            {!submitting ? <ChevronRight className="ml-2 h-4 w-4" /> : null}
          </Button>
        </div>
      </div>
    </div>
  );
}
