import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, UserPlus, Link2, Search, MoreHorizontal, Eye, UserCheck, Archive, Trash2, Sparkles, ExternalLink, Copy, Loader2, FileSpreadsheet, FileText, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import InviteCandidateModal from '@/components/b2b/InviteCandidateModal';
import CreateApplicationLinkModal from '@/components/b2b/CreateApplicationLinkModal';
import CandidateResultsModal from './CandidateResultsModal';
import CandidateFitModal from './CandidateFitModal';
import CandidateBulkImportModal from './CandidateBulkImportModal';
import CandidateDetailModal from './CandidateDetailModal';
import ResumeUpload from '@/components/b2b/ResumeUpload';

interface Candidate {
  id: string;
  email: string;
  full_name: string | null;
  position_title: string | null;
  ideal_role_color: string | null;
  status: string;
  source: string;
  assessment_category: string | null;
  assessment_type: string | null;
  assessment_completed_at: string | null;
  fit_score: number | null;
  fit_analysis: any;
  resume_url: string | null;
  created_at: string;
}

interface ApplicationLink {
  id: string;
  position_title: string;
  link_code: string;
  is_active: boolean;
  applications_count: number;
  max_applications: number | null;
  created_at: string;
}

interface CandidatesTabProps {
  company: {
    id: string;
    name: string;
    subdomain: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  invited: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  applied: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  assessment_pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  assessment_completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  hired: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  invited: 'Invited',
  applied: 'Applied',
  assessment_pending: 'Pending',
  assessment_completed: 'Completed',
  hired: 'Hired',
  archived: 'Archived',
  rejected: 'Rejected',
};

export default function CandidatesTab({ company }: CandidatesTabProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applicationLinks, setApplicationLinks] = useState<ApplicationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showFitModal, setShowFitModal] = useState(false);
  const [analyzingFit, setAnalyzingFit] = useState<string | null>(null);
  const [uploadingResumeFor, setUploadingResumeFor] = useState<string | null>(null);
  const [mobileSelectedCandidate, setMobileSelectedCandidate] = useState<Candidate | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCandidates();
    fetchApplicationLinks();
  }, [company.id]);

  // Handle file picker cancel - reset state after a delay
  // Handle file picker trigger and cancel detection
  useEffect(() => {
    if (uploadingResumeFor && resumeInputRef.current) {
      const input = resumeInputRef.current;
      
      // Trigger the file picker
      input.click();
      
      // Focus listener to detect when file dialog closes without selection
      const handleFocus = () => {
        setTimeout(() => {
          if (!input.files?.length) {
            setUploadingResumeFor(null);
          }
        }, 300);
      };
      
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [uploadingResumeFor]);

  const fetchCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching candidates:', error);
    } else {
      setCandidates(data || []);
    }
    setLoading(false);
  };

  const fetchApplicationLinks = async () => {
    const { data, error } = await supabase
      .from('candidate_application_links')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching application links:', error);
    } else {
      setApplicationLinks(data || []);
    }
  };

  const handleAnalyzeFit = async (candidate: Candidate) => {
    if (!candidate.assessment_completed_at) {
      toast({
        title: 'Assessment not completed',
        description: 'The candidate must complete their assessment before fit analysis.',
        variant: 'destructive',
      });
      return;
    }

    setAnalyzingFit(candidate.id);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-candidate-fit', {
        body: { candidateId: candidate.id },
      });

      if (error) throw error;

      toast({
        title: 'Fit analysis complete',
        description: `${candidate.full_name || candidate.email} scored ${data.fitScore}% fit.`,
      });

      fetchCandidates();
    } catch (error: any) {
      toast({
        title: 'Analysis failed',
        description: error.message || 'Failed to analyze candidate fit.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzingFit(null);
    }
  };

  const handleHireCandidate = async (candidate: Candidate) => {
    try {
      const { data, error } = await supabase.functions.invoke('convert-candidate-to-employee', {
        body: { candidateId: candidate.id },
      });

      if (error) throw error;

      toast({
        title: 'Candidate hired!',
        description: `${candidate.full_name || candidate.email} has been converted to an employee.`,
      });

      fetchCandidates();
    } catch (error: any) {
      toast({
        title: 'Failed to hire candidate',
        description: error.message || 'An error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveCandidate = async (candidate: Candidate) => {
    const { error } = await supabase
      .from('candidates')
      .update({ 
        status: 'archived', 
        archived_at: new Date().toISOString() 
      })
      .eq('id', candidate.id);

    if (error) {
      toast({
        title: 'Failed to archive',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Candidate archived' });
      fetchCandidates();
    }
  };

  const handleDeleteCandidate = async (candidate: Candidate) => {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', candidate.id);

    if (error) {
      toast({
        title: 'Failed to delete',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Candidate deleted' });
      fetchCandidates();
    }
  };

  const copyApplicationLink = (linkCode: string) => {
    const url = `https://rolecolorfinder.com/apply/${company.subdomain}/${linkCode}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied to clipboard' });
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = 
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (c.position_title?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: candidates.length,
    pending: candidates.filter(c => c.status === 'assessment_pending' || c.status === 'invited').length,
    completed: candidates.filter(c => c.status === 'assessment_completed').length,
    hired: candidates.filter(c => c.status === 'hired').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Candidates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending Assessment</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.hired}</div>
            <p className="text-sm text-muted-foreground">Hired</p>
          </CardContent>
        </Card>
      </div>

      {/* Application Links Section */}
      {applicationLinks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Public Application Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {applicationLinks.filter(l => l.is_active).map(link => (
                <div 
                  key={link.id}
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm"
                >
                  <span className="font-medium">{link.position_title}</span>
                  <Badge variant="secondary">{link.applications_count} applied</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyApplicationLink(link.link_code)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Candidates Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Candidates
              </CardTitle>
              <CardDescription>
                Manage job candidates and track their assessments
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setShowBulkImportModal(true)} className="flex-1 sm:flex-none min-w-[100px]">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Bulk </span>Import
              </Button>
              <Button variant="outline" onClick={() => setShowLinkModal(true)} className="flex-1 sm:flex-none min-w-[100px]">
                <Link2 className="h-4 w-4 mr-2" />
                Create Link
              </Button>
              <Button onClick={() => setShowInviteModal(true)} className="hidden sm:flex">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Candidate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-3 sm:flex gap-2">
              {['all', 'invited', 'assessment_completed', 'hired', 'archived'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="text-xs sm:text-sm"
                >
                  {status === 'all' ? 'All' : STATUS_LABELS[status] || status}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No candidates found</p>
              <p className="text-sm">Invite candidates or create a public application link</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-2">
                {filteredCandidates.map(candidate => (
                  <button
                    key={candidate.id}
                    onClick={() => setMobileSelectedCandidate(candidate)}
                    className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {candidate.full_name || <span className="text-muted-foreground">No name</span>}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{candidate.email}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge className={STATUS_COLORS[candidate.status] || ''}>
                          {STATUS_LABELS[candidate.status] || candidate.status}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead className="hidden md:table-cell">Assessment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fit Score</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map(candidate => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium">{candidate.full_name || 'No name'}</p>
                            <p className="text-sm text-muted-foreground">{candidate.email}</p>
                          </div>
                          {candidate.resume_url ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              title="View Resume"
                              onClick={() => window.open(candidate.resume_url!, '_blank')}
                            >
                              <FileText className="h-3 w-3 text-primary" />
                            </Button>
                          ) : (
                            <ResumeUpload
                              candidateId={candidate.id}
                              companyId={company.id}
                              onUploadComplete={() => {
                                fetchCandidates();
                                toast({
                                  title: 'Resume uploaded',
                                  description: 'Resume has been uploaded and is being parsed.',
                                });
                              }}
                              trigger={
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 border-dashed"
                                  title="Upload Resume"
                                >
                                  <Upload className="h-3 w-3" />
                                </Button>
                              }
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{candidate.position_title || '—'}</p>
                          {candidate.ideal_role_color && (
                            <Badge variant="outline" className="text-xs capitalize">
                              Ideal: {candidate.ideal_role_color}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {candidate.assessment_category && candidate.assessment_type ? (
                          <Badge variant="outline" className="text-xs capitalize">
                            {candidate.assessment_category} • {candidate.assessment_type.toUpperCase()}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[candidate.status] || ''}>
                          {STATUS_LABELS[candidate.status] || candidate.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {candidate.fit_score !== null ? (
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${
                              candidate.fit_score >= 80 ? 'text-green-600' :
                              candidate.fit_score >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {candidate.fit_score}%
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setShowFitModal(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : candidate.assessment_completed_at ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAnalyzeFit(candidate)}
                            disabled={analyzingFit === candidate.id}
                          >
                            {analyzingFit === candidate.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Sparkles className="h-3 w-3 mr-1" />
                            )}
                            Analyze
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            {candidate.resume_url ? (
                              <DropdownMenuItem onClick={() => window.open(candidate.resume_url!, '_blank')}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Resume
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setUploadingResumeFor(candidate.id);
                                }}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Resume
                              </DropdownMenuItem>
                            )}
                            {candidate.assessment_completed_at && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedCandidate(candidate);
                                setShowResultsModal(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Results
                              </DropdownMenuItem>
                            )}
                            {candidate.status === 'assessment_completed' && (
                              <>
                                <DropdownMenuItem onClick={() => handleHireCandidate(candidate)}>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Hire as Employee
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleArchiveCandidate(candidate)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCandidate(candidate)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Mobile Candidate Detail Modal */}
      <CandidateDetailModal
        candidate={mobileSelectedCandidate}
        open={!!mobileSelectedCandidate}
        onOpenChange={(open) => !open && setMobileSelectedCandidate(null)}
        analyzingFit={analyzingFit}
        onUploadResume={(candidateId) => setUploadingResumeFor(candidateId)}
        onViewResults={(c) => {
          setSelectedCandidate(c);
          setShowResultsModal(true);
          setMobileSelectedCandidate(null);
        }}
        onAnalyzeFit={(c) => {
          handleAnalyzeFit(c);
          setMobileSelectedCandidate(null);
        }}
        onViewFitAnalysis={(c) => {
          setSelectedCandidate(c);
          setShowFitModal(true);
          setMobileSelectedCandidate(null);
        }}
        onHire={(c) => {
          handleHireCandidate(c);
          setMobileSelectedCandidate(null);
        }}
        onArchive={(c) => {
          handleArchiveCandidate(c);
          setMobileSelectedCandidate(null);
        }}
        onDelete={(c) => {
          handleDeleteCandidate(c);
          setMobileSelectedCandidate(null);
        }}
      />

      {/* Modals */}
      <InviteCandidateModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        companyId={company.id}
        onInviteComplete={fetchCandidates}
      />

      <CreateApplicationLinkModal
        open={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        companyId={company.id}
        companySubdomain={company.subdomain}
        onLinkCreated={fetchApplicationLinks}
      />

      <CandidateBulkImportModal
        open={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        companyId={company.id}
        onImportComplete={fetchCandidates}
      />

      {selectedCandidate && (
        <>
          <CandidateResultsModal
            open={showResultsModal}
            onClose={() => {
              setShowResultsModal(false);
              setSelectedCandidate(null);
            }}
            onCandidateUpdate={fetchCandidates}
            candidate={{
              ...selectedCandidate,
              company_id: company.id,
            }}
          />
          <CandidateFitModal
            open={showFitModal}
            onClose={() => {
              setShowFitModal(false);
              setSelectedCandidate(null);
            }}
            candidate={selectedCandidate}
          />
        </>
      )}

      {/* Hidden file input for dropdown menu resume upload */}
      <input
        ref={resumeInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file && uploadingResumeFor) {
            const candidateId = uploadingResumeFor;
            setUploadingResumeFor(null);
            
            // Manually handle upload using same logic as ResumeUpload
            try {
              const fileExt = file.name.split('.').pop();
              const fileName = `${company.id}/${candidateId}/resume-${Date.now()}.${fileExt}`;
              
              const { error: uploadError } = await supabase.storage
                .from('candidate-resumes')
                .upload(fileName, file, { cacheControl: '3600', upsert: true });
              
              if (uploadError) throw uploadError;
              
              const { data: urlData } = await supabase.storage
                .from('candidate-resumes')
                .createSignedUrl(fileName, 60 * 60 * 24 * 365);
              
              const resumeUrl = urlData?.signedUrl || '';
              
              await supabase
                .from('candidates')
                .update({ resume_url: resumeUrl })
                .eq('id', candidateId);
              
              toast({
                title: 'Resume uploaded',
                description: 'Resume has been uploaded and is being parsed.',
              });
              
              fetchCandidates();
              
              // Trigger parsing in background
              supabase.functions.invoke('parse-resume', {
                body: { candidateId, resumeUrl },
              }).catch(err => console.error('Resume parsing failed:', err));
              
            } catch (error: any) {
              console.error('Upload error:', error);
              toast({
                title: 'Upload failed',
                description: error.message || 'Failed to upload resume.',
                variant: 'destructive',
              });
            }
          }
          // Reset the input
          e.target.value = '';
        }}
      />
    </div>
  );
}