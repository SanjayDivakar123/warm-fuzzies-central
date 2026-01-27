import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, UserPlus, Link2, Search, MoreHorizontal, Eye, UserCheck, Archive, Trash2, Sparkles, ExternalLink, Copy, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import InviteCandidateModal from './InviteCandidateModal';
import CreateApplicationLinkModal from './CreateApplicationLinkModal';
import CandidateResultsModal from './CandidateResultsModal';
import CandidateFitModal from './CandidateFitModal';

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
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showFitModal, setShowFitModal] = useState(false);
  const [analyzingFit, setAnalyzingFit] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCandidates();
    fetchApplicationLinks();
  }, [company.id]);

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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowLinkModal(true)}>
                <Link2 className="h-4 w-4 mr-2" />
                Create Link
              </Button>
              <Button onClick={() => setShowInviteModal(true)}>
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
            <div className="flex gap-2">
              {['all', 'invited', 'assessment_completed', 'hired', 'archived'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
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
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fit Score</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map(candidate => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{candidate.full_name || 'No name'}</p>
                          <p className="text-sm text-muted-foreground">{candidate.email}</p>
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
                      <TableCell>
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
          )}
        </CardContent>
      </Card>

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

      {selectedCandidate && (
        <>
          <CandidateResultsModal
            open={showResultsModal}
            onClose={() => {
              setShowResultsModal(false);
              setSelectedCandidate(null);
            }}
            candidate={selectedCandidate}
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
    </div>
  );
}