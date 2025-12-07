import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { GHSResult, GHS_QUESTIONS, GHS_COLOR_MAP } from "@/lib/ghsQuestions";
import { Lock, Eye, Download, Trash2, FileDown } from "lucide-react";
import { format } from "date-fns";

const STORAGE_KEY = "ghs_teacher_results";
const ADMIN_CODE = "8132";

const getColorBg = (color: string) => {
  switch (color) {
    case "Yellow": return "bg-yellow-500";
    case "Green": return "bg-green-500";
    case "Blue": return "bg-blue-500";
    case "Red": return "bg-red-500";
    default: return "bg-slate-500";
  }
};

export default function AdminResults() {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [results, setResults] = useState<GHSResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<GHSResult | null>(null);

  useEffect(() => {
    if (authenticated) {
      loadResults();
    }
  }, [authenticated]);

  const loadResults = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setResults(JSON.parse(stored));
    }
  };

  const handleLogin = () => {
    if (code === ADMIN_CODE) {
      setAuthenticated(true);
      toast({ title: "Access Granted", description: "Welcome to the admin panel." });
    } else {
      toast({ 
        title: "Invalid Code", 
        description: "Please enter the correct 4-digit admin code.", 
        variant: "destructive" 
      });
    }
  };

  const handleDelete = (id: string) => {
    const updated = results.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setResults(updated);
    setSelectedResult(null);
    toast({ title: "Result Deleted", description: "The assessment result has been removed." });
  };

  const handleExportAllCSV = () => {
    if (results.length === 0) {
      toast({ title: "No Data", description: "No results to export.", variant: "destructive" });
      return;
    }

    // Build headers: Name, Email, Submitted, then Q1-Q150
    const headers = ["Name", "Email", "Submitted At", ...GHS_QUESTIONS.map((q) => `Q${q.id}`)];
    const rows = results.map((r) => [
      `"${r.teacherName}"`,
      r.email,
      format(new Date(r.submittedAt), "yyyy-MM-dd HH:mm"),
      ...GHS_QUESTIONS.map((q) => r.answers[q.id] || ""),
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ghs-all-results-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportIndividualCSV = (result: GHSResult) => {
    // Headers: Question #, Section, Question, Selected Answer, Answer Text, Color
    const headers = ["Question #", "Section", "Question", "Selected Option", "Answer Text", "Color"];
    const rows = GHS_QUESTIONS.map((q) => {
      const selectedOption = result.answers[q.id] || "";
      const answerText = selectedOption ? q.options[selectedOption as keyof typeof q.options] : "";
      const color = selectedOption ? GHS_COLOR_MAP[selectedOption as keyof typeof GHS_COLOR_MAP] : "";
      return [
        q.id,
        `"${q.section}"`,
        `"${q.question.replace(/"/g, '""')}"`,
        selectedOption,
        `"${answerText}"`,
        color,
      ];
    });

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.teacherName.replace(/\s+/g, "-")}-assessment-${format(new Date(result.submittedAt), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `Downloaded ${result.teacherName}'s full responses.` });
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 text-primary mx-auto mb-2" />
            <CardTitle className="text-xl text-white">Admin Access Required</CardTitle>
            <p className="text-slate-400 text-sm">Enter the 4-digit admin code to view results.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter code"
              className="bg-slate-700/50 border-slate-600 text-white text-center text-2xl tracking-widest"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full bg-primary hover:bg-primary/90">
              Access Results
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">GHS Teacher Assessment Results</h1>
            <p className="text-slate-400">{results.length} submission{results.length !== 1 ? "s" : ""}</p>
          </div>
          <Button onClick={handleExportAllCSV} variant="outline" className="border-slate-600 text-slate-300">
            <Download className="w-4 h-4 mr-2" />
            Export All CSV
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Results Table */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Submissions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {results.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No submissions yet. Results will appear here once teachers complete the assessment.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Name</TableHead>
                      <TableHead className="text-slate-300">Email</TableHead>
                      <TableHead className="text-slate-300">Submitted</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow 
                        key={result.id} 
                        className={`border-slate-700 hover:bg-slate-700/30 cursor-pointer ${selectedResult?.id === result.id ? "bg-slate-700/50" : ""}`}
                        onClick={() => setSelectedResult(result)}
                      >
                        <TableCell className="text-white font-medium">{result.teacherName}</TableCell>
                        <TableCell className="text-slate-400 text-sm">{result.email}</TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {format(new Date(result.submittedAt), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setSelectedResult(result); }}
                            className="text-slate-400 hover:text-white"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleExportIndividualCSV(result); }}
                            className="text-slate-400 hover:text-green-400"
                            title="Export Individual CSV"
                          >
                            <FileDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDelete(result.id); }}
                            className="text-slate-400 hover:text-red-400"
                            title="Delete"
                          >
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

          {/* Full Answers Panel */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white">
                {selectedResult ? `${selectedResult.teacherName}'s Answers` : "Select a Submission"}
              </CardTitle>
              {selectedResult && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportIndividualCSV(selectedResult)}
                  className="border-slate-600 text-slate-300"
                >
                  <FileDown className="w-4 h-4 mr-1" />
                  Export CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {selectedResult ? (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {GHS_QUESTIONS.map((q) => {
                      const answer = selectedResult.answers[q.id];
                      return (
                        <div key={q.id} className="p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-xs text-slate-500">Q{q.id} · {q.section}</span>
                          <p className="text-slate-200 text-sm mb-2 mt-1">{q.question}</p>
                          {answer ? (
                            <p className="text-white text-sm font-medium">
                              {answer}. {q.options[answer as keyof typeof q.options]}
                            </p>
                          ) : (
                            <p className="text-slate-500 text-sm italic">No answer</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-slate-500 text-center py-16">
                  Click on a submission to view all 150 answers.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
