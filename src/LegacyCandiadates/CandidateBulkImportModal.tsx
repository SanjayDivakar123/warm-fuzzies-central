import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
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
  Download,
  UserPlus,
} from 'lucide-react';

interface CandidateBulkImportModalProps {
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
  positionColumn: string | null;
  idealColorColumn: string | null;
  confidence: string;
  notes: string;
}

interface ParsedCandidate {
  email: string;
  fullName: string | null;
  positionTitle: string | null;
  idealRoleColor: string | null;
  assessmentCategory: 'professional' | 'entrepreneur' | 'executive' | 'manager' | null;
  assessmentType: '25q' | '50q' | null;
  valid: boolean;
  error?: string;
  existingCandidate?: { id: string; status: string } | null;
  action?: 'invite' | 'skip';
  selected?: boolean;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export default function CandidateBulkImportModal({ open, onClose, companyId, onImportComplete }: CandidateBulkImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, string>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [aiAnalyzed, setAiAnalyzed] = useState(false);
  const [parsedCandidates, setParsedCandidates] = useState<ParsedCandidate[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
  const [existingCandidates, setExistingCandidates] = useState<Map<string, any>>(new Map());
  const [bulkAssessmentCategory, setBulkAssessmentCategory] = useState<'professional' | 'entrepreneur' | 'executive' | 'manager' | ''>('');
  const [bulkAssessmentType, setBulkAssessmentType] = useState<'25q' | '50q' | ''>('');
  const [aiSuggestingCategories, setAiSuggestingCategories] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && companyId) {
      fetchExistingCandidates();
    }
  }, [open, companyId]);

  const fetchExistingCandidates = async () => {
    const { data, error } = await supabase
      .from('candidates')
      .select('id, email, status')
      .eq('company_id', companyId);
    
    if (!error && data) {
      const candidateMap = new Map<string, any>();
      data.forEach(c => candidateMap.set(c.email.toLowerCase(), c));
      setExistingCandidates(candidateMap);
    }
  };

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setCsvContent('');
    setHeaders([]);
    setSampleData([]);
    setTotalRows(0);
    setMapping(null);
    setAiAnalyzed(false);
    setParsedCandidates([]);
    setImportResults({ success: 0, failed: 0, errors: [] });
    setBulkAssessmentCategory('');
    setBulkAssessmentType('');
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
      
      // Map the response to candidate-specific columns
      const candidateMapping: ColumnMapping = {
        emailColumn: data.mapping.emailColumn,
        fullNameColumn: data.mapping.fullNameColumn,
        firstNameColumn: data.mapping.firstNameColumn,
        lastNameColumn: data.mapping.lastNameColumn,
        positionColumn: data.mapping.jobRoleColumn, // Map job role to position
        idealColorColumn: null, // Will need manual mapping
        confidence: data.mapping.confidence,
        notes: data.mapping.notes,
      };
      
      // Try to detect ideal_color column
      const lowerHeaders = data.headers.map((h: string) => h.toLowerCase());
      const colorPatterns = ['ideal color', 'ideal_color', 'idealcolor', 'role color', 'color'];
      for (const pattern of colorPatterns) {
        const idx = lowerHeaders.findIndex((h: string) => h.includes(pattern));
        if (idx >= 0) {
          candidateMapping.idealColorColumn = data.headers[idx];
          break;
        }
      }
      
      setMapping(candidateMapping);
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

  const parseCandidatesFromCSV = () => {
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
    const positionIdx = mapping.positionColumn ? headerRow.indexOf(mapping.positionColumn) : -1;
    const colorIdx = mapping.idealColorColumn ? headerRow.indexOf(mapping.idealColorColumn) : -1;

    const candidates: ParsedCandidate[] = [];
    const seenEmails = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      const email = row[emailIdx]?.trim().toLowerCase();
      
      if (!email) continue;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(email);
      
      const isDuplicate = seenEmails.has(email);
      if (!isDuplicate) seenEmails.add(email);

      let fullName: string | null = null;
      if (fullNameIdx >= 0 && row[fullNameIdx]) {
        fullName = row[fullNameIdx].trim();
      } else if (firstNameIdx >= 0 || lastNameIdx >= 0) {
        const firstName = firstNameIdx >= 0 ? row[firstNameIdx]?.trim() : '';
        const lastName = lastNameIdx >= 0 ? row[lastNameIdx]?.trim() : '';
        fullName = [firstName, lastName].filter(Boolean).join(' ') || null;
      }

      const positionTitle = positionIdx >= 0 ? row[positionIdx]?.trim() || null : null;
      
      let idealRoleColor: string | null = null;
      if (colorIdx >= 0 && row[colorIdx]) {
        const colorValue = row[colorIdx].trim().toLowerCase();
        if (['yellow', 'red', 'green', 'blue'].includes(colorValue)) {
          idealRoleColor = colorValue;
        }
      }

      const existingCandidate = existingCandidates.get(email);
      let action: 'invite' | 'skip' = 'invite';
      let error: string | undefined;

      if (existingCandidate) {
        action = 'skip';
        error = 'Already exists';
      }

      if (!isValidEmail) {
        error = 'Invalid email format';
      } else if (isDuplicate) {
        error = 'Duplicate in CSV';
      }

      candidates.push({
        email,
        fullName,
        positionTitle,
        idealRoleColor,
        assessmentCategory: null,
        assessmentType: null,
        valid: isValidEmail && !isDuplicate && action !== 'skip',
        error,
        existingCandidate: existingCandidate || null,
        action,
        selected: true,
      });
    }

    setParsedCandidates(candidates);
    setStep('preview');
  };

  const downloadTemplate = () => {
    const template = `email,first_name,last_name,position_title,ideal_color
john.doe@example.com,John,Doe,Software Engineer,blue
jane.smith@example.com,Jane,Smith,Product Manager,yellow
bob.wilson@example.com,Bob,Wilson,Sales Director,red`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'candidate_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Template downloaded',
      description: 'Fill in the template and upload it to import candidates',
    });
  };

  const handleAiSuggestCategories = async () => {
    const candidatesWithPositions = parsedCandidates.filter(c => c.valid && c.selected && c.positionTitle);
    
    if (candidatesWithPositions.length === 0) {
      toast({
        title: 'No positions found',
        description: 'Select candidates with position titles to use AI suggestion',
        variant: 'destructive',
      });
      return;
    }

    setAiSuggestingCategories(true);
    try {
      const positions = candidatesWithPositions.map(c => c.positionTitle!);
      const uniquePositions = [...new Set(positions)];

      const { data, error } = await supabase.functions.invoke('suggest-assessment-category', {
        body: { jobRoles: uniquePositions },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const categoryMap = new Map<string, 'professional' | 'entrepreneur' | 'executive' | 'manager'>();
      for (const suggestion of data.suggestions) {
        categoryMap.set(suggestion.jobRole.toLowerCase(), suggestion.category);
      }

      setParsedCandidates(prev => prev.map(c => {
        if (c.valid && c.selected && c.positionTitle) {
          const suggestedCategory = categoryMap.get(c.positionTitle.toLowerCase());
          if (suggestedCategory) {
            return { ...c, assessmentCategory: suggestedCategory };
          }
        }
        return c;
      }));

      toast({
        title: data.aiAnalyzed ? 'AI Suggestions Applied' : 'Suggestions Applied',
        description: `Applied categories to ${candidatesWithPositions.length} candidates based on positions`,
      });
    } catch (error: any) {
      toast({
        title: 'Error getting AI suggestions',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAiSuggestingCategories(false);
    }
  };

  const applyBulkSettings = () => {
    setParsedCandidates(prev => prev.map(c => {
      if (!c.valid || !c.selected) return c;
      return {
        ...c,
        assessmentCategory: bulkAssessmentCategory || c.assessmentCategory,
        assessmentType: bulkAssessmentType || c.assessmentType,
      };
    }));
    
    toast({
      title: 'Settings applied',
      description: 'Bulk settings applied to selected candidates',
    });
  };

  const handleImport = async () => {
    const validCandidates = parsedCandidates.filter(c => c.valid && c.selected);
    if (validCandidates.length === 0) {
      toast({
        title: 'No valid candidates',
        description: 'There are no valid candidates to import',
        variant: 'destructive',
      });
      return;
    }

    setStep('importing');
    setImporting(true);
    
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const candidate of validCandidates) {
      try {
        const { data, error } = await supabase.functions.invoke('invite-candidate', {
          body: {
            company_id: companyId,
            email: candidate.email,
            full_name: candidate.fullName,
            position_title: candidate.positionTitle,
            ideal_role_color: candidate.idealRoleColor,
            assessment_category: candidate.assessmentCategory || 'professional',
            assessment_type: candidate.assessmentType || '25q',
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${candidate.email}: ${error.message}`);
      }
    }

    setImportResults(results);
    setImporting(false);
    setStep('complete');
    
    if (results.success > 0) {
      onImportComplete();
    }
  };

  const toggleSelectAll = (selected: boolean) => {
    setParsedCandidates(prev => prev.map(c => ({ ...c, selected: c.valid ? selected : false })));
  };

  const validCount = parsedCandidates.filter(c => c.valid).length;
  const selectedCount = parsedCandidates.filter(c => c.valid && c.selected).length;
  const invalidCount = parsedCandidates.filter(c => !c.valid).length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import Candidates
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple candidates at once. AI will automatically detect column mappings.
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
                    <p className="text-sm text-muted-foreground mt-1">or drag and drop</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && mapping && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {aiAnalyzed && (
                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      AI automatically detected column mappings. Review and adjust if needed.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Column *</label>
                    <Select value={mapping.emailColumn || ''} onValueChange={(v) => updateMapping('emailColumn', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- None --</SelectItem>
                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name Column</label>
                    <Select value={mapping.fullNameColumn || ''} onValueChange={(v) => updateMapping('fullNameColumn', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- None --</SelectItem>
                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name Column</label>
                    <Select value={mapping.firstNameColumn || ''} onValueChange={(v) => updateMapping('firstNameColumn', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- None --</SelectItem>
                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name Column</label>
                    <Select value={mapping.lastNameColumn || ''} onValueChange={(v) => updateMapping('lastNameColumn', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- None --</SelectItem>
                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Position Title Column</label>
                    <Select value={mapping.positionColumn || ''} onValueChange={(v) => updateMapping('positionColumn', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- None --</SelectItem>
                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ideal Color Column</label>
                    <Select value={mapping.idealColorColumn || ''} onValueChange={(v) => updateMapping('idealColorColumn', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- None --</SelectItem>
                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Sample Data Preview */}
                <div className="space-y-2">
                  <h4 className="font-medium">Sample Data ({totalRows} total rows)</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {headers.map(h => <TableHead key={h} className="text-xs">{h}</TableHead>)}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sampleData.slice(0, 3).map((row, idx) => (
                          <TableRow key={idx}>
                            {headers.map(h => (
                              <TableCell key={h} className="text-xs py-2">
                                {row[h] || '-'}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {/* Summary */}
                <div className="flex gap-4 text-sm">
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    {validCount} valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <AlertCircle className="h-3 w-3 text-destructive" />
                      {invalidCount} invalid
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {selectedCount} selected
                  </Badge>
                </div>

                {/* Bulk Settings */}
                <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Category</label>
                    <Select value={bulkAssessmentCategory} onValueChange={(v: any) => setBulkAssessmentCategory(v)}>
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Type</label>
                    <Select value={bulkAssessmentType} onValueChange={(v: any) => setBulkAssessmentType(v)}>
                      <SelectTrigger className="w-[120px] h-9">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25q">25 Questions</SelectItem>
                        <SelectItem value="50q">50 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button size="sm" variant="outline" onClick={applyBulkSettings}>
                    Apply to All
                  </Button>

                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleAiSuggestCategories}
                    disabled={aiSuggestingCategories}
                  >
                    {aiSuggestingCategories ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-1" />
                    )}
                    AI Suggest Categories
                  </Button>
                </div>

                {/* Candidates Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={selectedCount === validCount && validCount > 0}
                            onCheckedChange={(c) => toggleSelectAll(!!c)}
                          />
                        </TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedCandidates.map((candidate, idx) => (
                        <TableRow key={idx} className={!candidate.valid ? 'opacity-50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={candidate.selected}
                              disabled={!candidate.valid}
                              onCheckedChange={(c) => {
                                setParsedCandidates(prev => 
                                  prev.map((e, i) => i === idx ? { ...e, selected: !!c } : e)
                                );
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-sm">{candidate.email}</TableCell>
                          <TableCell className="text-sm">{candidate.fullName || '-'}</TableCell>
                          <TableCell className="text-sm">{candidate.positionTitle || '-'}</TableCell>
                          <TableCell>
                            {candidate.idealRoleColor ? (
                              <Badge variant="outline" className="capitalize text-xs">
                                {candidate.idealRoleColor}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={candidate.assessmentCategory || ''}
                              onValueChange={(v) => {
                                setParsedCandidates(prev =>
                                  prev.map((e, i) => i === idx ? { ...e, assessmentCategory: v as any } : e)
                                );
                              }}
                              disabled={!candidate.valid}
                            >
                              <SelectTrigger className="h-7 text-xs w-[100px]">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                                <SelectItem value="executive">Executive</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={candidate.assessmentType || ''}
                              onValueChange={(v) => {
                                setParsedCandidates(prev =>
                                  prev.map((e, i) => i === idx ? { ...e, assessmentType: v as any } : e)
                                );
                              }}
                              disabled={!candidate.valid}
                            >
                              <SelectTrigger className="h-7 text-xs w-[80px]">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="25q">25Q</SelectItem>
                                <SelectItem value="50q">50Q</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {candidate.error ? (
                              <Badge variant="destructive" className="text-xs">{candidate.error}</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">New</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Step 4: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Importing candidates...</p>
              <p className="text-sm text-muted-foreground">Please wait while invitations are sent</p>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <div className="py-8 space-y-6">
              <div className="text-center">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Import Complete</h3>
                <p className="text-muted-foreground">
                  {importResults.success} candidates invited successfully
                  {importResults.failed > 0 && `, ${importResults.failed} failed`}
                </p>
              </div>

              {importResults.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Failed imports:</p>
                    <ul className="text-sm space-y-1">
                      {importResults.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResults.errors.length > 5 && (
                        <li>...and {importResults.errors.length - 5} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={parseCandidatesFromCSV} disabled={!mapping?.emailColumn}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>Back</Button>
              <Button onClick={handleImport} disabled={selectedCount === 0}>
                <UserPlus className="mr-2 h-4 w-4" />
                Import {selectedCount} Candidates
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
