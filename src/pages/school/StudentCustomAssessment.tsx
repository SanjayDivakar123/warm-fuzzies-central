import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSchools } from "@/lib/teacherAssessmentQuestions";
import { studentAssessmentQuestions, studentSections } from "@/lib/studentAssessmentQuestions";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

interface Answer {
  questionId: number;
  section: string;
  question: string;
  selectedOption: string;
  answerText: string;
}

const StudentCustomAssessment = () => {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [completed, setCompleted] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [schools, setSchools] = useState<string[]>([]);

  useEffect(() => {
    setSchools(getSchools());
  }, []);

  const question = studentAssessmentQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / studentAssessmentQuestions.length) * 100;
  const currentSection = question?.section;
  const currentSectionIndex = studentSections.indexOf(currentSection) + 1;

  const handleNext = () => {
    if (!selectedOption) return;

    const answer: Answer = {
      questionId: question.id,
      section: question.section,
      question: question.question,
      selectedOption,
      answerText: question.options[selectedOption as keyof typeof question.options],
    };

    const newAnswers = [...answers.filter(a => a.questionId !== question.id), answer];
    setAnswers(newAnswers);

    if (currentQuestion < studentAssessmentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      const existingAnswer = newAnswers.find(a => a.questionId === studentAssessmentQuestions[currentQuestion + 1].id);
      setSelectedOption(existingAnswer?.selectedOption || "");
    } else {
      const submission = {
        id: Date.now().toString(),
        type: "student",
        school: selectedSchool,
        submittedAt: new Date().toISOString(),
        answers: newAnswers,
      };

      const existingSubmissions = JSON.parse(localStorage.getItem("school_assessment_submissions") || "[]");
      existingSubmissions.push(submission);
      localStorage.setItem("school_assessment_submissions", JSON.stringify(existingSubmissions));

      setCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const existingAnswer = answers.find(a => a.questionId === studentAssessmentQuestions[currentQuestion - 1].id);
      setSelectedOption(existingAnswer?.selectedOption || "");
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardHeader>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Assessment Complete!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Thank you for completing the Custom Student Assessment Builder. Your responses have been recorded.
            </p>
            <Button onClick={() => window.location.reload()}>
              Submit Another Response
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">
              RoleColorFinder — Custom Student Assessment Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-center">
              This assessment contains 150 questions across 10 sections designed to help customize student assessments for your school.
            </p>

            <div className="space-y-2">
              <Label>Select Your School</Label>
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a school..." />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school} value={school}>
                      {school}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {schools.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No schools available. Please contact an administrator to add schools.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Sections:</h3>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                {studentSections.map((section, index) => (
                  <li key={index}>{section}</li>
                ))}
              </ol>
            </div>

            <Button 
              onClick={() => setStarted(true)} 
              className="w-full"
              disabled={!selectedSchool}
            >
              Begin Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Section {currentSectionIndex} of 10: {currentSection}</span>
            <span>Question {currentQuestion + 1} of {studentAssessmentQuestions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {question.id}. {question.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-3">
              {Object.entries(question.options).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={key} id={`option-${key}`} />
                  <Label htmlFor={`option-${key}`} className="flex-1 cursor-pointer">
                    <span className="font-semibold mr-2">{key}.</span>
                    {value}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button onClick={handleNext} disabled={!selectedOption}>
                {currentQuestion === studentAssessmentQuestions.length - 1 ? "Complete" : "Next"}
                {currentQuestion < studentAssessmentQuestions.length - 1 && (
                  <ChevronRight className="w-4 h-4 ml-2" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentCustomAssessment;
