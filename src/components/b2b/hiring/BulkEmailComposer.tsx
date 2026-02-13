import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Mail,
  Send,
  Users,
  FileText,
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
} from 'lucide-react';

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  job_title?: string;
  current_stage?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
}

interface BulkEmailComposerProps {
  companyId: string;
  companyName: string;
  preSelectedCandidates?: string[];
  onClose: () => void;
  open: boolean;
}

export default function BulkEmailComposer({
  companyId,
  companyName,
  preSelectedCandidates = [],
  onClose,
  open,
}: BulkEmailComposerProps) {
  // Step state
  const [step, setStep] = useState<'select' | 'compose' | 'preview' | 'sending' | 'done'>('select');
  
  // Candidate selection
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(preSelectedCandidates));
  const [candidateSearch, setCandidateSearch] = useState('');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  
  // Email composition
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [campaignName, setCampaignName] = useState('');
  
  // Jobs and stages for filtering
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [stages, setStages] = useState<{ id: string; name: string }[]>([]);
  
  // Sending state
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendResults, setSendResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchData();
      if (preSelectedCandidates.length > 0) {
        setSelectedIds(new Set(preSelectedCandidates));
      }
    }
  }, [open, companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch candidates with applications
      const { data: candidatesData } = await supabase
        .from('candidate_applications')
        .select(`
          id,
          candidate:candidates(id, full_name, email),
          job_posting:job_postings(id, title),
          current_stage:hiring_pipeline_stages(id, name)
        `)
        .eq('job_postings.company_id', companyId)
        .is('rejected_at', null)
        .is('withdrawn_at', null);

      const mappedCandidates = (candidatesData || [])
        .filter((c: any) => c.candidate?.email)
        .map((c: any) => ({
          id: c.candidate.id,
          full_name: c.candidate.full_name,
          email: c.candidate.email,
          job_title: c.job_posting?.title,
          current_stage: c.current_stage?.name,
        }));

      // Deduplicate by candidate ID
      const uniqueCandidates = Array.from(
        new Map(mappedCandidates.map((c: Candidate) => [c.id, c])).values()
      );
      setCandidates(uniqueCandidates);

      // Fetch jobs
      const { data: jobsData } = await supabase
        .from('job_postings')
        .select('id, title')
        .eq('company_id', companyId);
      setJobs(jobsData || []);

      // Fetch templates
      const { data: templatesData } = await supabase
        .from('email_templates')
        .select('id, name, subject, body_html')
        .eq('company_id', companyId)
        .eq('is_active', true);
      setTemplates((templatesData || []) as EmailTemplate[]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter candidates
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = !candidateSearch ||
      c.full_name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(candidateSearch.toLowerCase());
    const matchesJob = jobFilter === 'all' || c.job_title === jobFilter;
    return matchesSearch && matchesJob;
  });

  const toggleCandidate = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCandidates.map(c => c.id)));
    }
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body_html);
      setSelectedTemplate(templateId);
    }
  };

  // Replace variables in text
  const replaceVariables = (text: string, candidate: Candidate) => {
    return text
      .replace(/\{\{candidate_name\}\}/g, candidate.full_name)
      .replace(/\{\{candidate_email\}\}/g, candidate.email)
      .replace(/\{\{position\}\}/g, candidate.job_title || 'the position')
      .replace(/\{\{company\}\}/g, companyName);
  };

  const sendEmails = async () => {
    if (selectedIds.size === 0 || !subject || !body) {
      toast({
        title: 'Missing information',
        description: 'Please select recipients and compose your email.',
        variant: 'destructive',
      });
      return;
    }

    setStep('sending');
    setSending(true);
    setSendProgress(0);
    setSendResults({ success: 0, failed: 0 });

    const selectedCandidates = candidates.filter(c => selectedIds.has(c.id));
    let success = 0;
    let failed = 0;

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .insert({
        company_id: companyId,
        name: campaignName || `Bulk Email - ${new Date().toLocaleDateString()}`,
        subject,
        body_html: body,
        template_id: selectedTemplate || null,
        status: 'sending',
        total_recipients: selectedCandidates.length,
      })
      .select('id')
      .single();

    if (campaignError) {
      toast({
        title: 'Error creating campaign',
        description: campaignError.message,
        variant: 'destructive',
      });
      setSending(false);
      return;
    }

    // Send to each candidate
    for (let i = 0; i < selectedCandidates.length; i++) {
      const candidate = selectedCandidates[i];
      
      try {
        // Create recipient record
        await supabase.from('email_campaign_recipients').insert({
          campaign_id: campaign.id,
          candidate_id: candidate.id,
          email: candidate.email,
          name: candidate.full_name,
          status: 'pending',
        });

        // Call send-email edge function
        const { error: sendError } = await supabase.functions.invoke('send-email', {
          body: {
            to: candidate.email,
            subject: replaceVariables(subject, candidate),
            html: replaceVariables(body, candidate),
          },
        });

        if (sendError) throw sendError;

        // Update recipient status
        await supabase
          .from('email_campaign_recipients')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('campaign_id', campaign.id)
          .eq('candidate_id', candidate.id);

        // Log activity
        await supabase.from('candidate_activities').insert({
          company_id: companyId,
          candidate_id: candidate.id,
          activity_type: 'email_sent',
          title: 'Bulk email sent',
          description: subject,
          metadata: { campaign_id: campaign.id },
        });

        success++;
      } catch (err) {
        console.error('Error sending to', candidate.email, err);
        failed++;
      }

      setSendProgress(Math.round(((i + 1) / selectedCandidates.length) * 100));
      setSendResults({ success, failed });
    }

    // Update campaign status
    await supabase
      .from('email_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: success,
      })
      .eq('id', campaign.id);

    setSending(false);
    setStep('done');
  };

  const resetAndClose = () => {
    setStep('select');
    setSelectedIds(new Set());
    setSubject('');
    setBody('');
    setCampaignName('');
    setSelectedTemplate('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Bulk Email Campaign
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && 'Select candidates to receive the email'}
            {step === 'compose' && 'Compose your email message'}
            {step === 'preview' && 'Preview and send your campaign'}
            {step === 'sending' && 'Sending emails...'}
            {step === 'done' && 'Campaign complete'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-2">
          {['select', 'compose', 'preview', 'done'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step === s || ['select', 'compose', 'preview', 'done'].indexOf(step) > i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                  }`}
              >
                {i + 1}
              </div>
              {i < 3 && (
                <div className={`w-12 h-0.5 mx-1 ${
                  ['select', 'compose', 'preview', 'done'].indexOf(step) > i
                    ? 'bg-primary'
                    : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Step 1: Select Candidates */}
          {step === 'select' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search candidates..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="flex-1"
                />
                <Select value={jobFilter} onValueChange={setJobFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {jobs.map(job => (
                      <SelectItem key={job.id} value={job.title}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm">Select All</span>
                </label>
                <Badge variant="secondary">
                  {selectedIds.size} selected
                </Badge>
              </div>

              <ScrollArea className="h-64 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Stage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map(candidate => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(candidate.id)}
                            onCheckedChange={() => toggleCandidate(candidate.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{candidate.full_name}</TableCell>
                        <TableCell>{candidate.email}</TableCell>
                        <TableCell>{candidate.job_title || '-'}</TableCell>
                        <TableCell>
                          {candidate.current_stage && (
                            <Badge variant="outline">{candidate.current_stage}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {/* Step 2: Compose Email */}
          {step === 'compose' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campaign Name</Label>
                  <Input
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., Interview Follow-up"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Use Template</Label>
                  <Select value={selectedTemplate} onValueChange={loadTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject line..."
                />
              </div>

              <div className="space-y-2">
                <Label>Body *</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email content..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-xs font-medium mb-2">Available Variables:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['{{candidate_name}}', '{{candidate_email}}', '{{position}}', '{{company}}'].map(v => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-muted"
                      onClick={() => setBody(body + ' ' + v)}
                    >
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedIds.size} recipients</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{subject}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Email Preview
                  </CardTitle>
                  <CardDescription>
                    Preview with sample data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="font-medium mb-2">Subject: {replaceVariables(subject, {
                      id: '1',
                      full_name: 'John Doe',
                      email: 'john@example.com',
                      job_title: 'Software Engineer',
                    })}</p>
                    <div className="prose prose-sm max-w-none" 
                      dangerouslySetInnerHTML={{ 
                        __html: replaceVariables(body, {
                          id: '1',
                          full_name: 'John Doe',
                          email: 'john@example.com',
                          job_title: 'Software Engineer',
                        })
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Sending */}
          {step === 'sending' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium mb-2">Sending emails...</p>
              <div className="w-64 bg-muted rounded-full h-2 mb-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${sendProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {sendResults.success + sendResults.failed} of {selectedIds.size} sent
              </p>
            </div>
          )}

          {/* Step 5: Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-xl font-medium mb-2">Campaign Complete!</p>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-green-500">{sendResults.success}</p>
                  <p className="text-sm text-muted-foreground">Sent</p>
                </div>
                {sendResults.failed > 0 && (
                  <div>
                    <p className="text-3xl font-bold text-red-500">{sendResults.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'select' && (
            <>
              <Button variant="outline" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep('compose')}
                disabled={selectedIds.size === 0}
              >
                Next: Compose Email
              </Button>
            </>
          )}
          {step === 'compose' && (
            <>
              <Button variant="outline" onClick={() => setStep('select')}>
                Back
              </Button>
              <Button
                onClick={() => setStep('preview')}
                disabled={!subject || !body}
              >
                Next: Preview
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('compose')}>
                Back
              </Button>
              <Button onClick={sendEmails}>
                <Send className="h-4 w-4 mr-2" />
                Send to {selectedIds.size} Recipients
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={resetAndClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
