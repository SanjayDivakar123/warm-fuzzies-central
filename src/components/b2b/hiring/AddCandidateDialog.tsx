import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  UserPlus,
  Sparkles,
  Clipboard,
  Loader2,
  Check,
  Upload,
  FileText,
  AlertCircle,
  X,
  File,
} from 'lucide-react';

interface ParsedCandidate {
  full_name: string;
  email: string;
  phone: string;
  position_title: string;
  linkedin_url: string;
  skills: string[];
  experience_summary: string;
  education: string;
}

interface AddCandidateDialogProps {
  companyId: string;
  open: boolean;
  onClose: () => void;
  onCandidateAdded: () => void;
  preSelectedJobId?: string | null;
}

export default function AddCandidateDialog({
  companyId,
  open,
  onClose,
  onCandidateAdded,
  preSelectedJobId,
}: AddCandidateDialogProps) {
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('manual');
  const [selectedJobId, setSelectedJobId] = useState<string>(preSelectedJobId || '');
  
  // Jobs
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  
  // AI paste state
  const [pastedText, setPastedText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  
  // Resume upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  
  // Submit state
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchJobs();
      if (preSelectedJobId) {
        setSelectedJobId(preSelectedJobId);
      }
    }
  }, [open, companyId, preSelectedJobId]);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('job_postings')
      .select('id, title')
      .eq('company_id', companyId)
      .eq('status', 'open')
      .order('title');
    setJobs(data || []);
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPositionTitle('');
    setLinkedinUrl('');
    setSkills([]);
    setSkillInput('');
    setNotes('');
    setSource('manual');
    setPastedText('');
    setParsed(false);
    setResumeFile(null);
    setResumeUrl(null);
    if (!preSelectedJobId) {
      setSelectedJobId('');
    }
  };

  // Resume upload handler
  const handleResumeUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, DOC, DOCX, or TXT file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setResumeFile(file);
    setUploadingResume(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      setResumeUrl(urlData.publicUrl);
      setSource('resume_upload');

      toast({
        title: 'Resume uploaded',
        description: 'Resume has been uploaded successfully.',
      });

      // Try to extract text from PDF for AI parsing
      if (file.type === 'application/pdf' || file.type === 'text/plain') {
        try {
          const text = await extractTextFromFile(file);
          if (text) {
            setPastedText(text);
            toast({
              title: 'Text extracted',
              description: 'Click "Extract Information with AI" to auto-fill fields.',
            });
          }
        } catch (extractErr) {
          console.log('Could not extract text from resume:', extractErr);
        }
      }
    } catch (err: any) {
      console.error('Error uploading resume:', err);
      toast({
        title: 'Upload failed',
        description: err.message,
        variant: 'destructive',
      });
      setResumeFile(null);
    } finally {
      setUploadingResume(false);
    }
  };

  // Extract text from file (basic implementation)
  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === 'text/plain') {
      return await file.text();
    }
    // For PDF, we'd need a library like pdf.js - for now just return empty
    // The AI can still parse if user pastes the text manually
    return '';
  };

  const removeResume = async () => {
    if (resumeUrl) {
      try {
        // Extract path from URL
        const urlParts = resumeUrl.split('/resumes/');
        if (urlParts[1]) {
          await supabase.storage.from('resumes').remove([urlParts[1]]);
        }
      } catch (err) {
        console.error('Error removing resume:', err);
      }
    }
    setResumeFile(null);
    setResumeUrl(null);
  };

  // AI-powered text parsing
  const parseWithAI = async () => {
    if (!pastedText.trim()) {
      toast({
        title: 'No text to parse',
        description: 'Please paste candidate information first.',
        variant: 'destructive',
      });
      return;
    }

    setParsing(true);
    
    try {
      // Call the AI edge function to parse the text
      const { data, error } = await supabase.functions.invoke('parse-candidate-text', {
        body: { text: pastedText },
      });

      if (error) {
        // Fallback to local parsing if edge function fails
        const parsed = localParseText(pastedText);
        applyParsedData(parsed);
      } else {
        applyParsedData(data);
      }

      setParsed(true);
      toast({
        title: 'Text parsed successfully',
        description: 'Review the extracted information and make any corrections.',
      });
    } catch (err) {
      // Fallback to local parsing
      const parsed = localParseText(pastedText);
      applyParsedData(parsed);
      setParsed(true);
    } finally {
      setParsing(false);
    }
  };

  // Local fallback parsing (regex-based)
  const localParseText = (text: string): Partial<ParsedCandidate> => {
    const result: Partial<ParsedCandidate> = {};
    
    // Email extraction
    const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (emailMatch) {
      result.email = emailMatch[0].toLowerCase();
    }
    
    // Phone extraction (various formats)
    const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
    if (phoneMatch) {
      result.phone = phoneMatch[0].replace(/[^\d+]/g, '');
    }
    
    // LinkedIn URL
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+\/?/i);
    if (linkedinMatch) {
      result.linkedin_url = linkedinMatch[0];
    }
    
    // Name extraction (first line that looks like a name, or before email)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length > 0) {
      // Check if first line looks like a name (2-4 words, no special chars)
      const firstLine = lines[0];
      if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+){0,3}$/.test(firstLine)) {
        result.full_name = firstLine;
      } else {
        // Try to find a name pattern
        const nameMatch = text.match(/(?:^|\n)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})(?:\s*[\n|,])/);
        if (nameMatch) {
          result.full_name = nameMatch[1];
        }
      }
    }
    
    // Job title extraction (look for common patterns)
    const titlePatterns = [
      /(?:Title|Position|Role):\s*(.+)/i,
      /(?:^|\n)([A-Za-z]+ (?:Engineer|Developer|Designer|Manager|Director|Analyst|Consultant|Specialist|Lead|Senior|Junior|Intern)[^\n]*)/i,
    ];
    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.position_title = match[1].trim();
        break;
      }
    }
    
    // Skills extraction (look for skills section or comma-separated list)
    const skillsMatch = text.match(/(?:Skills?|Technologies|Tech Stack):\s*(.+?)(?:\n\n|\n[A-Z]|$)/is);
    if (skillsMatch) {
      result.skills = skillsMatch[1]
        .split(/[,;•·\n]/)
        .map(s => s.trim())
        .filter(s => s && s.length < 50);
    }
    
    // Education
    const eduMatch = text.match(/(?:Education|University|College|Degree):\s*(.+?)(?:\n\n|\n[A-Z]|$)/is);
    if (eduMatch) {
      result.education = eduMatch[1].trim();
    }
    
    // Experience summary (first paragraph or work experience section)
    const expMatch = text.match(/(?:Experience|Summary|About):\s*(.+?)(?:\n\n|$)/is);
    if (expMatch) {
      result.experience_summary = expMatch[1].trim();
    }
    
    return result;
  };

  const applyParsedData = (data: Partial<ParsedCandidate>) => {
    if (data.full_name) setFullName(data.full_name);
    if (data.email) setEmail(data.email);
    if (data.phone) setPhone(data.phone);
    if (data.position_title) setPositionTitle(data.position_title);
    if (data.linkedin_url) setLinkedinUrl(data.linkedin_url);
    if (data.skills) setSkills(data.skills);
    if (data.experience_summary || data.education) {
      const notesParts = [];
      if (data.education) notesParts.push(`Education: ${data.education}`);
      if (data.experience_summary) notesParts.push(`Experience: ${data.experience_summary}`);
      setNotes(notesParts.join('\n\n'));
    }
    setSource('paste');
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = async () => {
    // Validation
    if (!fullName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter the candidate\'s full name.',
        variant: 'destructive',
      });
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: 'Valid email required',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    if (!resumeUrl) {
      toast({
        title: 'Resume required',
        description: 'Please upload the candidate\'s resume.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      console.log('[AddCandidate] Starting save for:', { fullName, email, companyId, resumeUrl });
      
      // Check if candidate with this email already exists for this company
      const { data: existingCandidate, error: lookupError } = await supabase
        .from('candidates')
        .select('id')
        .eq('company_id', companyId)
        .eq('email', email.toLowerCase())
        .single();

      console.log('[AddCandidate] Existing candidate lookup:', { existingCandidate, lookupError });

      let candidateId: string;

      if (existingCandidate) {
        // Update existing candidate
        candidateId = existingCandidate.id;
        console.log('[AddCandidate] Updating existing candidate:', candidateId);
        const { error: updateError } = await supabase
          .from('candidates')
          .update({
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            position_title: positionTitle.trim() || null,
            required_skills: skills.length > 0 ? skills : null,
            notes: notes.trim() || null,
            source: source,
            resume_url: resumeUrl || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', candidateId);

        if (updateError) {
          console.error('[AddCandidate] Update error:', updateError);
          throw updateError;
        }
      } else {
        // Create new candidate
        const insertData = {
          company_id: companyId,
          full_name: fullName.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim() || null,
          position_title: positionTitle.trim() || null,
          required_skills: skills.length > 0 ? skills : null,
          notes: notes.trim() || null,
          source: source,
          resume_url: resumeUrl || null,
          status: 'applied' as const,
        };
        console.log('[AddCandidate] Inserting new candidate:', insertData);
        
        const { data: newCandidate, error: insertError } = await supabase
          .from('candidates')
          .insert(insertData)
          .select('id')
          .single();

        console.log('[AddCandidate] Insert result:', { newCandidate, insertError });

        if (insertError) {
          console.error('[AddCandidate] Insert error:', insertError);
          throw insertError;
        }
        candidateId = newCandidate.id;
      }

      // If a job is selected, create an application
      if (selectedJobId) {
        // Get first stage for this job
        const { data: firstStage } = await supabase
          .from('hiring_pipeline_stages')
          .select('id')
          .eq('job_posting_id', selectedJobId)
          .order('stage_order')
          .limit(1)
          .single();

        // Check if application already exists
        const { data: existingApp } = await supabase
          .from('candidate_applications')
          .select('id')
          .eq('candidate_id', candidateId)
          .eq('job_posting_id', selectedJobId)
          .single();

        if (!existingApp) {
          const { error: appError } = await supabase
            .from('candidate_applications')
            .insert({
              candidate_id: candidateId,
              job_posting_id: selectedJobId,
              current_stage_id: firstStage?.id || null,
              source: source,
            });

          if (appError) throw appError;
        }
      }

      // Log activity
      await supabase.from('candidate_activities').insert({
        company_id: companyId,
        candidate_id: candidateId,
        activity_type: 'candidate_added',
        title: 'Candidate added manually',
        description: `Added via ${source === 'paste' ? 'AI paste parsing' : 'manual entry'}`,
        metadata: { source, job_id: selectedJobId || null },
      });

      toast({
        title: 'Candidate added',
        description: `${fullName} has been added successfully.`,
      });

      resetForm();
      onCandidateAdded();
      onClose();
    } catch (err: any) {
      console.error('Error adding candidate:', err);
      toast({
        title: 'Error adding candidate',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Candidate
          </DialogTitle>
          <DialogDescription>
            Enter candidate details manually or paste their information for AI-powered extraction.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="paste" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Paste
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4 mt-4">
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clipboard className="h-4 w-4" />
                  Paste Candidate Information
                </CardTitle>
                <CardDescription>
                  Paste text from a resume, LinkedIn profile, or email. Our AI will extract the details automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    setParsed(false);
                  }}
                  placeholder={`Paste candidate information here...\n\nExample:\nJohn Smith\njohn.smith@email.com\n(555) 123-4567\nSenior Software Engineer\n\nSkills: React, TypeScript, Node.js\n\nExperience: 5+ years in full-stack development...`}
                  rows={8}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={parseWithAI}
                  disabled={parsing || !pastedText.trim()}
                  className="w-full"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Parsing with AI...
                    </>
                  ) : parsed ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Parsed - Review Below
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Extract Information with AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            {parsed && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                <Check className="h-4 w-4" />
                Information extracted! Review and edit the fields below, then click "Add Candidate".
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <div className="text-sm text-muted-foreground mb-4">
              Fill in the candidate's details manually.
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-2" />

        {/* Resume Upload - Required */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            Resume *
            {resumeUrl && (
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                <Check className="h-3 w-3 mr-1" />
                Uploaded
              </Badge>
            )}
          </Label>
          {!resumeFile ? (
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="resume-upload-common"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleResumeUpload(file);
                }}
                className="hidden"
              />
              <label
                htmlFor="resume-upload-common"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="p-3 bg-muted rounded-full">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Click to upload resume</p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, or TXT (max 10MB)
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <File className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{resumeFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {uploadingResume && <Loader2 className="h-4 w-4 animate-spin" />}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeResume}
                  disabled={uploadingResume}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* Common Form Fields */}
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Current/Desired Position</Label>
              <Input
                id="position"
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
                placeholder="Software Engineer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job">Apply to Job (Optional)</Label>
            <Select value={selectedJobId || 'none'} onValueChange={(v) => setSelectedJobId(v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a job posting..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No job selected</SelectItem>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addSkill}>
                Add
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skills.map((skill, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeSkill(skill)}
                  >
                    {skill} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the candidate..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Entry</SelectItem>
                <SelectItem value="paste">Pasted/AI Extracted</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="careers_page">Careers Page</SelectItem>
                <SelectItem value="job_board">Job Board</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Candidate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
