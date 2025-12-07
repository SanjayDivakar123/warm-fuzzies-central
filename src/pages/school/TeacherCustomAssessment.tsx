import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { TEACHER_QUESTIONS, TeacherResult, RESULTS_STORAGE_KEY, getSchoolByCode } from "@/lib/teacherAssessmentQuestions";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

export default function TeacherCustomAssessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"info" | "quiz" | "complete">("info");
  const [teacherName, setTeacherName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const question = TEACHER_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / TEACHER_QUESTIONS.length) * 100;
  const currentSection = question?.section;

  const sections = [...new Set(TEACHER_QUESTIONS.map(q => q.section))];
  const currentSectionIndex = sections.indexOf(currentSection);

  const handleStartQuiz = () => {
    if (!teacherName.trim() || !email.trim()) {
      toast({
        title: "Required Fields",
        description: "Please fill in your name and email.",
        variant: "destructive",
      });
      return;
    }

    if (schoolCode.length !== 4) {
      toast({
        title: "Invalid School Code",
        description: "Please enter a valid 4-digit school code.",
        variant: "destructive",
      });
      return;
    }

    const school = getSchoolByCode(schoolCode);
    if (!school) {
      toast({
        title: "School Not Found",
        description: "No school found with this code. Please check with your administrator.",
        variant: "destructive",
      });
      return;
    }

    setSchoolName(school.name);
    setStep("quiz");
  };

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleNext = () => {
    if (!answers[question.id]) {
      toast({
        title: "Please select an answer",
        description: "You must select an option before continuing.",
        variant: "destructive",
      });
      return;
    }

    if (currentQuestion < TEACHER_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const newResult: TeacherResult = {
      id: crypto.randomUUID(),
      teacherName,
      email,
      schoolName,
      submittedAt: new Date().toISOString(),
      answers,
    };

    const existingResults = JSON.parse(localStorage.getItem(RESULTS_STORAGE_KEY) || "[]");
    existingResults.push(newResult);
    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(existingResults));

    setStep("complete");
    toast({
      title: "Assessment Complete!",
      description: "Your responses have been submitted successfully.",
    });
  };

  useEffect(() => {
    if (step !== "quiz") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") handleAnswer("A");
      else if (e.key === "2") handleAnswer("B");
      else if (e.key === "3") handleAnswer("C");
      else if (e.key === "4") handleAnswer("D");
      else if (e.key === "Enter" && answers[question?.id]) handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, currentQuestion, answers, question]);

  if (step === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-800/50 border-slate-700">
          <CardContent className="pt-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
            <p className="text-slate-300 mb-6">
              Your Custom Teacher Assessment has been submitted successfully.
            </p>
            <Button 
              onClick={() => navigate("/")}
              className="bg-primary hover:bg-primary/90"
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "info") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Custom Teacher Assessment Builder
            </CardTitle>
            <p className="text-slate-400 mt-2">
              150 questions across 10 sections to build your customized teacher report.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="schoolCode" className="text-slate-200">School Code</Label>
              <Input
                id="schoolCode"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Enter 4-digit school code"
                maxLength={4}
                className="bg-slate-700/50 border-slate-600 text-white text-center text-xl tracking-widest"
              />
              <p className="text-xs text-slate-500 mt-1">
                Contact your school administrator to get the school code.
              </p>
            </div>
            <div>
              <Label htmlFor="name" className="text-slate-200">Your Name</Label>
              <Input
                id="name"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Enter your full name"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-slate-200">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <Button 
              onClick={handleStartQuiz}
              className="w-full bg-primary hover:bg-primary/90 mt-4"
            >
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>Section {currentSectionIndex + 1} of {sections.length}: {currentSection}</span>
            <span>Question {currentQuestion + 1} of {TEACHER_QUESTIONS.length}</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-700" />
        </div>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              {question.id}. {question.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[question.id] || ""}
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {(["A", "B", "C", "D"] as const).map((option, idx) => (
                <div
                  key={option}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                    answers[question.id] === option
                      ? "border-primary bg-primary/10"
                      : "border-slate-600 hover:border-slate-500 bg-slate-700/30"
                  }`}
                  onClick={() => handleAnswer(option)}
                >
                  <RadioGroupItem value={option} id={`option-${option}`} />
                  <Label 
                    htmlFor={`option-${option}`} 
                    className="text-slate-200 cursor-pointer flex-1"
                  >
                    <span className="text-slate-400 mr-2">{idx + 1}.</span>
                    {question.options[option]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-slate-500 mt-4">
              Tip: Press 1-4 to select, Enter to continue
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentQuestion === 0}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            className="bg-primary hover:bg-primary/90"
          >
            {currentQuestion === TEACHER_QUESTIONS.length - 1 ? "Submit" : "Next"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}