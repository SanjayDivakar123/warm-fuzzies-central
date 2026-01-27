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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
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
  X,
  Download,
  RefreshCw,
  UserPlus,
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
  skillsColumn: string | null;
  confidence: string;
  notes: string;
}

interface ParsedEmployee {
  email: string;
  fullName: string | null;
  jobRole: string | null;
  skills: string[] | null;
  assessmentCategory: 'professional' | 'entrepreneur' | 'executive' | 'manager' | null;
  assessmentType: '25q' | '50q' | null;
  valid: boolean;
  error?: string;
  existingUser?: { id: string; status: string; full_name: string | null; job_role: string | null } | null;
  action?: 'invite' | 'update' | 'skip';
  selected?: boolean;
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
  const [importResults, setImportResults] = useState<{ success: number; failed: number; updated: number; errors: string[] }>({ success: 0, failed: 0, updated: 0, errors: [] });
  const [existingUsers, setExistingUsers] = useState<Map<string, any>>(new Map());
  const [updateMode, setUpdateMode] = useState(true); // Enable update mode by default
  const [bulkAssessmentCategory, setBulkAssessmentCategory] = useState<'professional' | 'entrepreneur' | 'executive' | 'manager' | ''>('');
  const [bulkAssessmentType, setBulkAssessmentType] = useState<'25q' | '50q' | ''>('');
  const [aiSuggestingCategories, setAiSuggestingCategories] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch existing users when modal opens
  useEffect(() => {
    if (open && companyId) {
      fetchExistingUsers();
    }
  }, [open, companyId]);

  const fetchExistingUsers = async () => {
    const { data, error } = await supabase
      .from('company_users')
      .select('id, email, status, full_name, job_role')
      .eq('company_id', companyId);
    
    if (!error && data) {
      const userMap = new Map<string, any>();
      data.forEach(user => userMap.set(user.email.toLowerCase(), user));
      setExistingUsers(userMap);
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
    setParsedEmployees([]);
    setImportResults({ success: 0, failed: 0, updated: 0, errors: [] });
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
    const skillsIdx = mapping.skillsColumn ? headerRow.indexOf(mapping.skillsColumn) : -1;

    const employees: ParsedEmployee[] = [];
    const seenEmails = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      const email = row[emailIdx]?.trim().toLowerCase();
      
      if (!email) continue;

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(email);
      
      // Check for duplicates in CSV
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

      // Get skills (comma separated in the cell)
      let skills: string[] | null = null;
      if (skillsIdx >= 0 && row[skillsIdx]) {
        skills = row[skillsIdx].split(',').map(s => s.trim()).filter(Boolean);
      }

      // Check if user already exists
      const existingUser = existingUsers.get(email);
      let action: 'invite' | 'update' | 'skip' = 'invite';
      let error: string | undefined;

      if (existingUser) {
        if (existingUser.status === 'revoked') {
          action = 'invite'; // Re-invite revoked users
        } else if (updateMode) {
          action = 'update'; // Update existing active/invited users
        } else {
          action = 'skip';
          error = 'Already exists';
        }
      }

      if (!isValidEmail) {
        error = 'Invalid email format';
      } else if (isDuplicate) {
        error = 'Duplicate in CSV';
      }

      employees.push({
        email,
        fullName,
        jobRole,
        skills,
        assessmentCategory: null,
        assessmentType: null,
        valid: isValidEmail && !isDuplicate && action !== 'skip',
        error,
        existingUser: existingUser || null,
        action,
        selected: true,
      });
    }

    setParsedEmployees(employees);
    setStep('preview');
  };

  const downloadTemplate = () => {
    const template = `email,first_name,last_name,job_role,skills
john.doe@company.com,John,Doe,Senior Engineer,"UI Design, Coding, Data Analysis"
jane.smith@company.com,Jane,Smith,Product Designer,"UI Design, Branding, Content Creation"
bob.wilson@company.com,Bob,Wilson,Project Manager,"Project Management, Strategy, Client Communication"`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Template downloaded',
      description: 'Fill in the template and upload it to import employees',
    });
  };

  const handleAiSuggestCategories = async () => {
    const employeesWithJobRoles = parsedEmployees.filter(e => e.valid && e.selected && e.jobRole);
    
    if (employeesWithJobRoles.length === 0) {
      toast({
        title: 'No job roles found',
        description: 'Select users with job roles in the CSV to use AI suggestion',
        variant: 'destructive',
      });
      return;
    }

    setAiSuggestingCategories(true);
    try {
      const jobRoles = employeesWithJobRoles.map(e => e.jobRole!);
      const uniqueJobRoles = [...new Set(jobRoles)];

      const { data, error } = await supabase.functions.invoke('suggest-assessment-category', {
        body: { jobRoles: uniqueJobRoles },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Create a map of job role -> category
      const categoryMap = new Map<string, 'professional' | 'entrepreneur' | 'executive' | 'manager'>();
      for (const suggestion of data.suggestions) {
        categoryMap.set(suggestion.jobRole.toLowerCase(), suggestion.category);
      }

      // Apply categories to employees
      setParsedEmployees(prev => prev.map(e => {
        if (e.valid && e.selected && e.jobRole) {
          const suggestedCategory = categoryMap.get(e.jobRole.toLowerCase());
          if (suggestedCategory) {
            return { ...e, assessmentCategory: suggestedCategory };
          }
        }
        return e;
      }));

      toast({
        title: data.aiAnalyzed ? 'AI Suggestions Applied' : 'Suggestions Applied',
        description: `Applied categories to ${employeesWithJobRoles.length} users based on job roles`,
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
    
    const results = { success: 0, failed: 0, updated: 0, errors: [] as string[] };

    for (const employee of validEmployees) {
      try {
        if (employee.action === 'update' && employee.existingUser) {
          // Update existing user
          const updateData: Record<string, any> = {};
          if (employee.fullName && employee.fullName !== employee.existingUser.full_name) {
            updateData.full_name = employee.fullName;
          }
          if (employee.jobRole && employee.jobRole !== employee.existingUser.job_role) {
            updateData.job_role = employee.jobRole;
          }
          if (employee.skills && employee.skills.length > 0) {
            updateData.skills = employee.skills;
          }
          if (employee.assessmentCategory) {
            updateData.assessment_category = employee.assessmentCategory;
          }
          if (employee.assessmentType) {
            updateData.assessment_type = employee.assessmentType;
          }
          
          if (Object.keys(updateData).length > 0) {
            const { error } = await supabase
              .from('company_users')
              .update(updateData)
              .eq('id', employee.existingUser.id);
            
            if (error) throw error;
            results.updated++;
          } else {
            results.updated++; // Count as updated even if no changes
          }
        } else {
          // Invite new user
          const { data, error } = await supabase.functions.invoke('invite-company-user', {
            body: {
              company_id: companyId,
              email: employee.email,
              full_name: employee.fullName,
              job_role: employee.jobRole,
              skills: employee.skills,
              assessment_category: employee.assessmentCategory,
              assessment_type: employee.assessmentType,
            },
          });

          if (error) throw error;
          if (data?.error) throw new Error(data.error);

          results.success++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${employee.email}: ${error.message}`);
      }
    }

    setImportResults(results);
    setImporting(false);
    setStep('complete');
    
    if (results.success > 0 || results.updated > 0) {
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
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Supported format: CSV with headers (email required)
                </p>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
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

                <div className="space-y-2">
                  <Label>Skills Column</Label>
                  <Select value={mapping.skillsColumn || 'none'} onValueChange={(v) => updateMapping('skillsColumn', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select skills column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not mapped --</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Skills should be comma-separated</p>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="gap-1">
                    <UserPlus className="h-3 w-3 text-primary" />
                    {parsedEmployees.filter(e => e.valid && e.action === 'invite').length} new
                  </Badge>
                  {updateMode && (
                    <Badge variant="outline" className="gap-1">
                      <RefreshCw className="h-3 w-3 text-primary" />
                      {parsedEmployees.filter(e => e.valid && e.action === 'update').length} updates
                    </Badge>
                  )}
                  {parsedEmployees.filter(e => !e.valid).length > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {parsedEmployees.filter(e => !e.valid).length} invalid
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="update-mode" className="text-sm">Update existing</Label>
                  <Switch
                    id="update-mode"
                    checked={updateMode}
                    onCheckedChange={(checked) => {
                      setUpdateMode(checked);
                      // Re-parse to update actions
                      parseEmployeesFromCSV();
                    }}
                  />
                </div>
              </div>

              {/* Bulk Assessment Assignment */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm">Bulk Assessment Assignment</p>
                    <p className="text-xs text-muted-foreground">Assign the same assessment to selected users</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={parsedEmployees.filter(e => e.valid).every(e => e.selected)}
                      onCheckedChange={(checked) => {
                        setParsedEmployees(prev => prev.map(e => ({ ...e, selected: e.valid ? !!checked : e.selected })));
                      }}
                    />
                    <Label htmlFor="select-all" className="text-xs">Select all</Label>
                  </div>
                </div>
                <div className="flex gap-3 items-end flex-wrap">
                  <div className="flex-1 min-w-[140px] space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Select value={bulkAssessmentCategory} onValueChange={(v) => setBulkAssessmentCategory(v as any)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[120px] space-y-1">
                    <Label className="text-xs">Length</Label>
                    <Select value={bulkAssessmentType} onValueChange={(v) => setBulkAssessmentType(v as any)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25q">25 Questions</SelectItem>
                        <SelectItem value="50q">50 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!bulkAssessmentCategory || !bulkAssessmentType) {
                        toast({
                          title: 'Select both category and length',
                          description: 'Please select an assessment category and length to apply',
                          variant: 'destructive',
                        });
                        return;
                      }
                      const selectedCount = parsedEmployees.filter(e => e.valid && e.selected).length;
                      if (selectedCount === 0) {
                        toast({
                          title: 'No users selected',
                          description: 'Please select at least one user to apply the assessment',
                          variant: 'destructive',
                        });
                        return;
                      }
                      setParsedEmployees(prev => prev.map(e => ({
                        ...e,
                        assessmentCategory: e.selected ? bulkAssessmentCategory as any : e.assessmentCategory,
                        assessmentType: e.selected ? bulkAssessmentType as any : e.assessmentType,
                      })));
                      toast({
                        title: 'Assessment applied',
                        description: `Applied ${bulkAssessmentCategory} • ${bulkAssessmentType.toUpperCase()} to ${selectedCount} users`,
                      });
                    }}
                    disabled={!bulkAssessmentCategory || !bulkAssessmentType}
                  >
                    Apply to Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAiSuggestCategories}
                    disabled={aiSuggestingCategories}
                    className="gap-1"
                  >
                    {aiSuggestingCategories ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    AI Suggest from Job Roles
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-64 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedEmployees.map((emp, idx) => (
                      <TableRow key={idx} className={!emp.valid ? 'bg-destructive/5' : emp.action === 'update' ? 'bg-muted/30' : ''}>
                        <TableCell>
                          {emp.valid && (
                            <Checkbox
                              checked={emp.selected}
                              onCheckedChange={(checked) => {
                                setParsedEmployees(prev => prev.map((e, i) => i === idx ? { ...e, selected: !!checked } : e));
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {emp.valid ? (
                            emp.action === 'update' ? (
                              <RefreshCw className="h-4 w-4 text-primary" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{emp.email}</TableCell>
                        <TableCell className="text-sm">
                          {emp.fullName || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {emp.assessmentCategory && emp.assessmentType ? (
                            <Badge variant="outline" className="text-xs capitalize">
                              {emp.assessmentCategory} • {emp.assessmentType.toUpperCase()}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {emp.valid ? (
                            emp.action === 'update' ? (
                              <Badge variant="outline" className="text-xs">Update</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Invite</Badge>
                            )
                          ) : (
                            <Badge variant="destructive" className="text-xs">{emp.error}</Badge>
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
                    {importResults.success > 0 && `${importResults.success} invited`}
                    {importResults.success > 0 && importResults.updated > 0 && ', '}
                    {importResults.updated > 0 && `${importResults.updated} updated`}
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
                {parsedEmployees.filter(e => e.valid && e.action === 'invite').length > 0 && 
                  `Invite ${parsedEmployees.filter(e => e.valid && e.action === 'invite').length}`}
                {parsedEmployees.filter(e => e.valid && e.action === 'invite').length > 0 && 
                  parsedEmployees.filter(e => e.valid && e.action === 'update').length > 0 && ' & '}
                {parsedEmployees.filter(e => e.valid && e.action === 'update').length > 0 && 
                  `Update ${parsedEmployees.filter(e => e.valid && e.action === 'update').length}`}
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
