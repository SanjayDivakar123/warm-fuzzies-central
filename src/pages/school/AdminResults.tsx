import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { TeacherResult, TEACHER_QUESTIONS, RESULTS_STORAGE_KEY, getSchools, saveSchools } from "@/lib/teacherAssessmentQuestions";
import { Lock, Eye, Download, Trash2, FileDown, Plus, X } from "lucide-react";
import { format } from "date-fns";

const ADMIN_CODE = "8132";

export default function AdminResults() {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [results, setResults] = useState<TeacherResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<TeacherResult | null>(null);
  const [schools, setSchools] = useState<string[]>([]);
  const [newSchool, setNewSchool] = useState("");

  useEffect(() => {
    if (authenticated) {
      const stored = localStorage.getItem(RESULTS_STORAGE_KEY);
      if (stored) setResults(JSON.parse(stored));
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
    const updated = results.filter((r) => r.id !== id);
    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(updated));
    setResults(updated);
    setSelectedResult(null);
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

  const handleExportIndividualCSV = (result: TeacherResult) => {
    const headers = ["Question #", "Section", "Question", "Selected Option", "Answer Text"];
    const rows = TEACHER_QUESTIONS.map((q) => {
      const opt = result.answers[q.id] || "";
      return [q.id, `"${q.section}"`, `"${q.question.replace(/"/g, '""')}"`, opt, `"${opt ? q.options[opt as keyof typeof q.options] : ""}"`];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${result.teacherName.replace(/\s+/g, "-")}-${format(new Date(result.submittedAt), "yyyy-MM-dd")}.csv`;
    a.click();
  };

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
        <h1 className="text-2xl font-bold text-white mb-6">Teacher Assessment Admin</h1>
        <Tabs defaultValue="results" className="space-y-6">
          <TabsList className="bg-slate-800"><TabsTrigger value="results">Results</TabsTrigger><TabsTrigger value="schools">Manage Schools</TabsTrigger></TabsList>
          <TabsContent value="schools">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Schools</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={newSchool} onChange={(e) => setNewSchool(e.target.value)} placeholder="School name" className="bg-slate-700/50 border-slate-600 text-white" onKeyDown={(e) => e.key === "Enter" && handleAddSchool()} />
                  <Button onClick={handleAddSchool}><Plus className="w-4 h-4 mr-1" />Add</Button>
                </div>
                {schools.map((s) => (<div key={s} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"><span className="text-white">{s}</span><Button variant="ghost" size="sm" onClick={() => handleRemoveSchool(s)} className="text-slate-400 hover:text-red-400"><X className="w-4 h-4" /></Button></div>))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="results">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader><CardTitle className="text-white">Submissions</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {results.length === 0 ? <p className="p-8 text-center text-slate-400">No submissions yet.</p> : (
                    <Table>
                      <TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">Name</TableHead><TableHead className="text-slate-300">School</TableHead><TableHead className="text-slate-300">Submitted</TableHead><TableHead className="text-slate-300 text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {results.map((r) => (
                          <TableRow key={r.id} className={`border-slate-700 hover:bg-slate-700/30 cursor-pointer ${selectedResult?.id === r.id ? "bg-slate-700/50" : ""}`} onClick={() => setSelectedResult(r)}>
                            <TableCell className="text-white">{r.teacherName}</TableCell>
                            <TableCell className="text-slate-400">{r.schoolName}</TableCell>
                            <TableCell className="text-slate-400">{format(new Date(r.submittedAt), "MMM d, h:mm a")}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedResult(r); }}><Eye className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleExportIndividualCSV(r); }} className="text-slate-400 hover:text-green-400"><FileDown className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-white">{selectedResult ? `${selectedResult.teacherName}'s Answers` : "Select a Submission"}</CardTitle>{selectedResult && <Button size="sm" variant="outline" onClick={() => handleExportIndividualCSV(selectedResult)} className="border-slate-600 text-slate-300"><FileDown className="w-4 h-4 mr-1" />Export</Button>}</CardHeader>
                <CardContent>
                  {selectedResult ? (
                    <ScrollArea className="h-[600px] pr-4">
                      {TEACHER_QUESTIONS.map((q) => {
                        const ans = selectedResult.answers[q.id];
                        return (<div key={q.id} className="p-3 bg-slate-700/30 rounded-lg mb-2"><span className="text-xs text-slate-500">Q{q.id} · {q.section}</span><p className="text-slate-200 text-sm mt-1">{q.question}</p>{ans ? <p className="text-white text-sm font-medium mt-1">{ans}. {q.options[ans as keyof typeof q.options]}</p> : <p className="text-slate-500 text-sm italic">No answer</p>}</div>);
                      })}
                    </ScrollArea>
                  ) : <p className="text-slate-500 text-center py-16">Click a submission to view answers.</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}