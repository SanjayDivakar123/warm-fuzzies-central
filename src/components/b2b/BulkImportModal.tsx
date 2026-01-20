import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  onImportComplete: () => void;
}

interface ColumnMapping {
  emailColumn: string | null;
  fullNameColumn: string | null;
  firstNameColumn: string | null;
  lastNameColumn: string | null;
  jobRoleColumn: string | null;
  confidence: string;
  notes: string;
}

interface ParsedEmployee {
  email: string;
  fullName: string | null;
  jobRole: string | null;
  valid: boolean;
  error?: string;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export default function BulkImportModal({ open, onClose, companyId, onImportComplete }: BulkImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, string>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [aiAnalyzed, setAiAnalyzed] = useState(false);
  const [parsedEmployees, setParsedEmployees] = useState<ParsedEmployee[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setCsvContent('');
    setHeaders([]);
    setSampleData([]);
    setTotalRows(0);
    setMapping(null);
    setAiAnalyzed(false);
    setParsedEmployees([]);
    setImportResults({ success: 0, failed: 0, errors: [] });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    const content = await selectedFile.text();
    setCsvContent(content);
    
    // Analyze the CSV
    await analyzeCSV(content);
  };

  const analyzeCSV = async (content: string) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-csv-import', {
        body: { csvContent: content, sampleRows: 5 },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setHeaders(data.headers);
      setSampleData(data.sampleData);
      setTotalRows(data.totalRows);
      setMapping(data.mapping);
      setAiAnalyzed(data.aiAnalyzed);
      setStep('mapping');
    } catch (error: any) {
      toast({
        title: 'Error analyzing CSV',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const updateMapping = (field: keyof ColumnMapping, value: string | null) => {
    if (!mapping) return;
    setMapping({ ...mapping, [field]: value === 'none' ? null : value });
  };

  const parseEmployeesFromCSV = () => {
    if (!mapping?.emailColumn) {
      toast({
        title: 'Email column required',
        description: 'Please select which column contains email addresses',
        variant: 'destructive',
      });
      return;
    }

    const lines = csvContent.trim().split('\n');
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headerRow = parseCSVLine(lines[0]);
    const emailIdx = headerRow.indexOf(mapping.emailColumn);
    const fullNameIdx = mapping.fullNameColumn ? headerRow.indexOf(mapping.fullNameColumn) : -1;
    const firstNameIdx = mapping.firstNameColumn ? headerRow.indexOf(mapping.firstNameColumn) : -1;
    const lastNameIdx = mapping.lastNameColumn ? headerRow.indexOf(mapping.lastNameColumn) : -1;
    const jobRoleIdx = mapping.jobRoleColumn ? headerRow.indexOf(mapping.jobRoleColumn) : -1;

    const employees: ParsedEmployee[] = [];
    const seenEmails = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      const email = row[emailIdx]?.trim().toLowerCase();
      
      if (!email) continue;

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(email);
      
      // Check for duplicates
      const isDuplicate = seenEmails.has(email);
      if (!isDuplicate) seenEmails.add(email);

      // Build full name
      let fullName: string | null = null;
      if (fullNameIdx >= 0 && row[fullNameIdx]) {
        fullName = row[fullNameIdx].trim();
      } else if (firstNameIdx >= 0 || lastNameIdx >= 0) {
        const firstName = firstNameIdx >= 0 ? row[firstNameIdx]?.trim() : '';
        const lastName = lastNameIdx >= 0 ? row[lastNameIdx]?.trim() : '';
        fullName = [firstName, lastName].filter(Boolean).join(' ') || null;
      }

      // Get job role
      const jobRole = jobRoleIdx >= 0 ? row[jobRoleIdx]?.trim() || null : null;

      employees.push({
        email,
        fullName,
        jobRole,
        valid: isValidEmail && !isDuplicate,
        error: !isValidEmail ? 'Invalid email format' : isDuplicate ? 'Duplicate email' : undefined,
      });
    }

    setParsedEmployees(employees);
    setStep('preview');
  };

  const handleImport = async () => {
    const validEmployees = parsedEmployees.filter(e => e.valid);
    if (validEmployees.length === 0) {
      toast({
        title: 'No valid employees',
        description: 'There are no valid employees to import',
        variant: 'destructive',
      });
      return;
    }

    setStep('importing');
    setImporting(true);
    
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const employee of validEmployees) {
      try {
        const { data, error } = await supabase.functions.invoke('invite-company-user', {
          body: {
            company_id: companyId,
            email: employee.email,
            full_name: employee.fullName,
            job_role: employee.jobRole,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${employee.email}: ${error.message}`);
      }
    }

    setImportResults(results);
    setImporting(false);
    setStep('complete');
    
    if (results.success > 0) {
      onImportComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import Employees
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple employees at once. AI will automatically detect column mappings.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <div 
                className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                {analyzing ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div>
                      <p className="font-medium">Analyzing CSV...</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center mt-1">
                        <Sparkles className="h-3 w-3" /> Using AI to detect columns
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="font-medium">Click to upload CSV file</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or drag and drop
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground">
                Supported format: CSV with headers (email required)
              </p>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && mapping && (
            <div className="space-y-6">
              {aiAnalyzed && (
                <Alert className="border-primary/50 bg-primary/5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <AlertDescription className="flex items-center gap-2">
                    <span>AI analyzed your CSV and detected {mapping.confidence} confidence mappings.</span>
                    {mapping.notes && <span className="text-muted-foreground">— {mapping.notes}</span>}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Column *</Label>
                  <Select value={mapping.emailColumn || 'none'} onValueChange={(v) => updateMapping('emailColumn', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select email column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not mapped --</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Full Name Column</Label>
                  <Select value={mapping.fullNameColumn || 'none'} onValueChange={(v) => updateMapping('fullNameColumn', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select name column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not mapped --</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>First Name Column</Label>
                  <Select value={mapping.firstNameColumn || 'none'} onValueChange={(v) => updateMapping('firstNameColumn', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select first name column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not mapped --</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Last Name Column</Label>
                  <Select value={mapping.lastNameColumn || 'none'} onValueChange={(v) => updateMapping('lastNameColumn', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select last name column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not mapped --</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Job Role Column</Label>
                  <Select value={mapping.jobRoleColumn || 'none'} onValueChange={(v) => updateMapping('jobRoleColumn', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job role column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not mapped --</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm font-medium mb-3">Sample Data Preview ({sampleData.length} of {totalRows} rows)</p>
                <ScrollArea className="h-48">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map(h => (
                          <TableHead key={h} className="text-xs whitespace-nowrap">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sampleData.map((row, idx) => (
                        <TableRow key={idx}>
                          {headers.map(h => (
                            <TableCell key={h} className="text-xs py-2">{row[h]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  {parsedEmployees.filter(e => e.valid).length} valid
                </Badge>
                {parsedEmployees.filter(e => !e.valid).length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {parsedEmployees.filter(e => !e.valid).length} invalid
                  </Badge>
                )}
              </div>

              <ScrollArea className="h-80 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Job Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedEmployees.map((emp, idx) => (
                      <TableRow key={idx} className={!emp.valid ? 'bg-destructive/5' : ''}>
                        <TableCell>
                          {emp.valid ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{emp.email}</TableCell>
                        <TableCell>{emp.fullName || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>{emp.jobRole || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>
                          {emp.valid ? (
                            <Badge variant="outline" className="text-green-600">Ready</Badge>
                          ) : (
                            <Badge variant="destructive">{emp.error}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {/* Step 4: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="font-medium">Importing employees...</p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <div className="space-y-6 py-8">
              <div className="flex flex-col items-center gap-4">
                <div className={`p-4 rounded-full ${importResults.failed === 0 ? 'bg-green-100' : 'bg-amber-100'}`}>
                  {importResults.failed === 0 ? (
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  ) : (
                    <AlertCircle className="h-12 w-12 text-amber-600" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold">Import Complete</p>
                  <p className="text-muted-foreground mt-1">
                    {importResults.success} employee{importResults.success !== 1 ? 's' : ''} imported successfully
                    {importResults.failed > 0 && `, ${importResults.failed} failed`}
                  </p>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="border rounded-lg p-4 bg-destructive/5">
                  <p className="font-medium text-destructive mb-2">Errors:</p>
                  <ScrollArea className="h-32">
                    <ul className="text-sm space-y-1">
                      {importResults.errors.map((err, idx) => (
                        <li key={idx} className="text-muted-foreground">{err}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={resetState}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={parseEmployeesFromCSV} disabled={!mapping?.emailColumn}>
                Preview Import
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Back to Mapping
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={parsedEmployees.filter(e => e.valid).length === 0}
              >
                Import {parsedEmployees.filter(e => e.valid).length} Employees
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
