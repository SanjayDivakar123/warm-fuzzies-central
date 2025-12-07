import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { GHSResult } from "@/lib/ghsQuestions";
import { Lock, Eye, Download, Trash2 } from "lucide-react";
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

  const handleExportCSV = () => {
    if (results.length === 0) {
      toast({ title: "No Data", description: "No results to export.", variant: "destructive" });
      return;
    }

    const headers = ["Name", "Email", "Submitted At", "Primary Color", "Secondary Color", "Yellow %", "Green %", "Blue %", "Red %"];
    const rows = results.map((r) => [
      r.teacherName,
      r.email,
      format(new Date(r.submittedAt), "yyyy-MM-dd HH:mm"),
      r.primaryColor,
      r.secondaryColor,
      r.colorScores.Yellow,
      r.colorScores.Green,
      r.colorScores.Blue,
      r.colorScores.Red,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ghs-teacher-results-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">GHS Teacher Assessment Results</h1>
            <p className="text-slate-400">{results.length} submission{results.length !== 1 ? "s" : ""}</p>
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="border-slate-600 text-slate-300">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Results Table */}
          <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
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
                      <TableHead className="text-slate-300">Primary</TableHead>
                      <TableHead className="text-slate-300">Submitted</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow 
                        key={result.id} 
                        className="border-slate-700 hover:bg-slate-700/30 cursor-pointer"
                        onClick={() => setSelectedResult(result)}
                      >
                        <TableCell className="text-white font-medium">{result.teacherName}</TableCell>
                        <TableCell className="text-slate-400">{result.email}</TableCell>
                        <TableCell>
                          <Badge className={`${getColorBg(result.primaryColor)} text-white`}>
                            {result.primaryColor}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {format(new Date(result.submittedAt), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setSelectedResult(result); }}
                            className="text-slate-400 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDelete(result.id); }}
                            className="text-slate-400 hover:text-red-400"
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

          {/* Detail Panel */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                {selectedResult ? "Result Details" : "Select a Result"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedResult ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-400 text-sm">Teacher</p>
                    <p className="text-white font-medium">{selectedResult.teacherName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Email</p>
                    <p className="text-white">{selectedResult.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Submitted</p>
                    <p className="text-white">
                      {format(new Date(selectedResult.submittedAt), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-slate-400 text-sm mb-3">Color Profile</p>
                    <div className="flex gap-2 mb-4">
                      <Badge className={`${getColorBg(selectedResult.primaryColor)} text-white`}>
                        Primary: {selectedResult.primaryColor}
                      </Badge>
                      <Badge className={`${getColorBg(selectedResult.secondaryColor)} text-white`}>
                        Secondary: {selectedResult.secondaryColor}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {(["Yellow", "Green", "Blue", "Red"] as const).map((color) => (
                        <div key={color} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getColorBg(color)}`} />
                          <span className="text-slate-300 text-sm flex-1">{color}</span>
                          <span className="text-white font-medium">
                            {selectedResult.colorScores[color]}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">
                  Click on a result to view details.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
