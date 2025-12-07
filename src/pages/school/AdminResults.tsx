import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { TEACHER_QUESTIONS, getSchools, saveSchools } from "@/lib/teacherAssessmentQuestions";
import { studentAssessmentQuestions } from "@/lib/studentAssessmentQuestions";
import { Lock, Eye, Trash2, FileDown, Plus, X, GraduationCap, Users } from "lucide-react";
import { format } from "date-fns";

const ADMIN_CODE = "8132";

interface Answer {
  questionId: number;
  section: string;
  question: string;
  selectedOption: string;
  answerText: string;
}

interface Submission {
  id: string;
  type: "teacher" | "student";
  school: string;
  submittedAt: string;
  answers: Answer[] | Record<number, string>;
  teacherName?: string;
  schoolName?: string;
}

export default function AdminResults() {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [schools, setSchools] = useState<string[]>([]);
  const [newSchool, setNewSchool] = useState("");
  const [activeTab, setActiveTab] = useState<"teacher" | "student">("teacher");

  useEffect(() => {
    if (authenticated) {
      // Load teacher results (old format)
      const teacherResults = localStorage.getItem("teacher_assessment_results");
      const teacherSubmissions: Submission[] = teacherResults 
        ? JSON.parse(teacherResults).map((r: any) => ({
            ...r,
            type: "teacher" as const,
            school: r.schoolName,
          }))
        : [];

      // Load new unified submissions
      const unifiedSubmissions = localStorage.getItem("school_assessment_submissions");
      const newSubmissions: Submission[] = unifiedSubmissions ? JSON.parse(unifiedSubmissions) : [];

      setSubmissions([...teacherSubmissions, ...newSubmissions]);
      setSchools(getSchools());
    }
  }, [authenticated]);

  const handleLogin = () => {
    if (code === ADMIN_CODE) {
      setAuthenticated(true);
      toast({ title: "Access Granted" });
    } else {
      toast({ title: "Invalid Code", variant: "destructive" });
    }
  };

  const handleDelete = (id: string) => {
    // Remove from both storage locations
    const teacherResults = JSON.parse(localStorage.getItem("teacher_assessment_results") || "[]");
    const updatedTeacher = teacherResults.filter((r: any) => r.id !== id);
    localStorage.setItem("teacher_assessment_results", JSON.stringify(updatedTeacher));

    const unifiedSubmissions = JSON.parse(localStorage.getItem("school_assessment_submissions") || "[]");
    const updatedUnified = unifiedSubmissions.filter((r: any) => r.id !== id);
    localStorage.setItem("school_assessment_submissions", JSON.stringify(updatedUnified));

    setSubmissions(submissions.filter((s) => s.id !== id));
    setSelectedSubmission(null);
  };

  const handleAddSchool = () => {
    const trimmed = newSchool.trim();
    if (!trimmed || schools.includes(trimmed)) return;
    const updated = [...schools, trimmed];
    saveSchools(updated);
    setSchools(updated);
    setNewSchool("");
  };

  const handleRemoveSchool = (school: string) => {
    const updated = schools.filter((s) => s !== school);
    saveSchools(updated);
    setSchools(updated);
  };

  const getAnswersArray = (submission: Submission): Answer[] => {
    if (Array.isArray(submission.answers)) {
      return submission.answers;
    }
    // Convert old format to new format
    const questions = submission.type === "teacher" ? TEACHER_QUESTIONS : studentAssessmentQuestions;
    return questions.map((q) => {
      const opt = (submission.answers as Record<number, string>)[q.id] || "";
      return {
        questionId: q.id,
        section: q.section,
        question: q.question,
        selectedOption: opt,
        answerText: opt ? q.options[opt as keyof typeof q.options] : "",
      };
    });
  };

  const handleExportIndividualCSV = (submission: Submission) => {
    const answersArray = getAnswersArray(submission);
    const headers = ["Question #", "Section", "Question", "Selected Option", "Answer Text"];
    const rows = answersArray.map((a) => [
      a.questionId,
      `"${a.section}"`,
      `"${a.question.replace(/"/g, '""')}"`,
      a.selectedOption,
      `"${a.answerText}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name = submission.teacherName || submission.school || "submission";
    a.download = `${submission.type}-${name.replace(/\s+/g, "-")}-${format(new Date(submission.submittedAt), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const getSubmissionName = (submission: Submission) => {
    return submission.teacherName || submission.school || "Unknown";
  };

  const filteredSubmissions = submissions.filter((s) => s.type === activeTab);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 text-primary mx-auto mb-2" />
            <CardTitle className="text-xl text-white">Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="password" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="Enter code" className="bg-slate-700/50 border-slate-600 text-white text-center text-2xl tracking-widest" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            <Button onClick={handleLogin} className="w-full bg-primary">Access Results</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">School Assessment Admin</h1>
        <Tabs defaultValue="results" className="space-y-6">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="schools">Manage Schools</TabsTrigger>
          </TabsList>

          <TabsContent value="schools">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Schools</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={newSchool} onChange={(e) => setNewSchool(e.target.value)} placeholder="School name" className="bg-slate-700/50 border-slate-600 text-white" onKeyDown={(e) => e.key === "Enter" && handleAddSchool()} />
                  <Button onClick={handleAddSchool}><Plus className="w-4 h-4 mr-1" />Add</Button>
                </div>
                {schools.map((s) => (
                  <div key={s} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-white">{s}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveSchool(s)} className="text-slate-400 hover:text-red-400"><X className="w-4 h-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            {/* Sub-tabs for Teacher vs Student */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === "teacher" ? "default" : "outline"}
                onClick={() => { setActiveTab("teacher"); setSelectedSubmission(null); }}
                className={activeTab === "teacher" ? "" : "border-slate-600 text-slate-300"}
              >
                <Users className="w-4 h-4 mr-2" />
                Teacher Results ({submissions.filter(s => s.type === "teacher").length})
              </Button>
              <Button
                variant={activeTab === "student" ? "default" : "outline"}
                onClick={() => { setActiveTab("student"); setSelectedSubmission(null); }}
                className={activeTab === "student" ? "" : "border-slate-600 text-slate-300"}
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Student Results ({submissions.filter(s => s.type === "student").length})
              </Button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    {activeTab === "teacher" ? "Teacher Submissions" : "Student Submissions"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredSubmissions.length === 0 ? (
                    <p className="p-8 text-center text-slate-400">No {activeTab} submissions yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-300">Name/School</TableHead>
                          <TableHead className="text-slate-300">Submitted</TableHead>
                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubmissions.map((s) => (
                          <TableRow 
                            key={s.id} 
                            className={`border-slate-700 hover:bg-slate-700/30 cursor-pointer ${selectedSubmission?.id === s.id ? "bg-slate-700/50" : ""}`} 
                            onClick={() => setSelectedSubmission(s)}
                          >
                            <TableCell className="text-white">{getSubmissionName(s)}</TableCell>
                            <TableCell className="text-slate-400">{format(new Date(s.submittedAt), "MMM d, h:mm a")}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedSubmission(s); }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleExportIndividualCSV(s); }} className="text-slate-400 hover:text-green-400">
                                <FileDown className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="text-slate-400 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">
                    {selectedSubmission ? `${getSubmissionName(selectedSubmission)}'s Answers` : "Select a Submission"}
                  </CardTitle>
                  {selectedSubmission && (
                    <Button size="sm" variant="outline" onClick={() => handleExportIndividualCSV(selectedSubmission)} className="border-slate-600 text-slate-300">
                      <FileDown className="w-4 h-4 mr-1" />Export
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedSubmission ? (
                    <ScrollArea className="h-[600px] pr-4">
                      {getAnswersArray(selectedSubmission).map((a) => (
                        <div key={a.questionId} className="p-3 bg-slate-700/30 rounded-lg mb-2">
                          <span className="text-xs text-slate-500">Q{a.questionId} · {a.section}</span>
                          <p className="text-slate-200 text-sm mt-1">{a.question}</p>
                          {a.selectedOption ? (
                            <p className="text-white text-sm font-medium mt-1">{a.selectedOption}. {a.answerText}</p>
                          ) : (
                            <p className="text-slate-500 text-sm italic">No answer</p>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  ) : (
                    <p className="text-slate-500 text-center py-16">Click a submission to view answers.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
