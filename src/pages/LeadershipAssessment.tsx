import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";

type AssessmentType = "50q-teacher" | "50q-student" | "25q-teacher" | "25q-student";

const PLACEHOLDER_QUESTIONS = [
  { id: 1, text: "Placeholder question 1 - This will be replaced with actual assessment questions" },
  { id: 2, text: "Placeholder question 2 - This will be replaced with actual assessment questions" },
  { id: 3, text: "Placeholder question 3 - This will be replaced with actual assessment questions" },
  { id: 4, text: "Placeholder question 4 - This will be replaced with actual assessment questions" },
  { id: 5, text: "Placeholder question 5 - This will be replaced with actual assessment questions" },
];

const LeadershipAssessment = () => {
  const navigate = useNavigate();
  const [assessmentType, setAssessmentType] = useState<AssessmentType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleSelectType = (type: AssessmentType) => {
    setAssessmentType(type);
  };

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion]: value });
  };

  const handleNext = () => {
    if (currentQuestion < PLACEHOLDER_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    // Navigate to results page with assessment type
    navigate(`/leadership-results/${assessmentType}`);
  };

  const progress = ((currentQuestion + 1) / PLACEHOLDER_QUESTIONS.length) * 100;

  // Type selection screen
  if (!assessmentType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-end mb-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="gradient-text-primary">RCF Teacher/Student Leadership</span> Color Assessment
            </h1>
            <p className="text-xl text-muted-foreground">Select your assessment type to begin</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
              onClick={() => handleSelectType("50q-teacher")}
            >
              <CardHeader>
                <CardTitle>50-Question Teacher Assessment</CardTitle>
                <CardDescription>Comprehensive leadership profile for educators (4-6 pages)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Full color profile, detailed category breakdown, and extensive growth plan
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
              onClick={() => handleSelectType("50q-student")}
            >
              <CardHeader>
                <CardTitle>50-Question Student Assessment</CardTitle>
                <CardDescription>Comprehensive leadership profile for students (3-5 pages)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Color profile for group work with medium-depth analysis</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
              onClick={() => handleSelectType("25q-teacher")}
            >
              <CardHeader>
                <CardTitle>25-Question Teacher Assessment</CardTitle>
                <CardDescription>Quick leadership snapshot for educators (2-3 pages)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Short-form profile with condensed category breakdown</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
              onClick={() => handleSelectType("25q-student")}
            >
              <CardHeader>
                <CardTitle>25-Question Student Assessment</CardTitle>
                <CardDescription>Quick leadership snapshot for students (1.5-2 pages)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Fun and motivating strength snapshot</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Assessment questions screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              Question {currentQuestion + 1} of {PLACEHOLDER_QUESTIONS.length}
            </h2>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{PLACEHOLDER_QUESTIONS[currentQuestion].text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={answers[currentQuestion] || ""} onValueChange={handleAnswer}>
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="strongly-disagree" id="strongly-disagree" />
                <Label htmlFor="strongly-disagree" className="flex-1 cursor-pointer">
                  Strongly Disagree
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="disagree" id="disagree" />
                <Label htmlFor="disagree" className="flex-1 cursor-pointer">
                  Disagree
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="neutral" id="neutral" />
                <Label htmlFor="neutral" className="flex-1 cursor-pointer">
                  Neutral
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="agree" id="agree" />
                <Label htmlFor="agree" className="flex-1 cursor-pointer">
                  Agree
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="strongly-agree" id="strongly-agree" />
                <Label htmlFor="strongly-agree" className="flex-1 cursor-pointer">
                  Strongly Agree
                </Label>
              </div>
            </RadioGroup>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentQuestion === PLACEHOLDER_QUESTIONS.length - 1 ? (
                <Button onClick={handleSubmit} disabled={!answers[currentQuestion]}>
                  Complete Assessment
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!answers[currentQuestion]}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadershipAssessment;
