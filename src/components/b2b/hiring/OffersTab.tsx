import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  Send,
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  Download,
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { format, addDays } from 'date-fns';
import SendOfferDialog, { OfferCandidateOption } from './SendOfferDialog';

type Offer = Database['public']['Tables']['offers']['Row'];
type OfferStatus = Database['public']['Enums']['offer_status'];

interface OfferWithDetails extends Offer {
  candidate_application: {
    id: string;
    candidate: {
      id: string;
      full_name: string | null;
      email: string;
    };
    job_posting: {
      id: string;
      title: string;
    };
  };
}

interface OffersTabProps {
  company: { id: string; name: string };
  companyUser: { id: string; role: string } | null;
}

interface PendingOfferAction {
  offerId: string;
  action: 'status' | 'delete';
  nextStatus?: OfferStatus;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
}

const OFFER_STATUS_CONFIG: Record<OfferStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: React.ReactNode }> = {
  draft: { variant: 'outline', label: 'Draft', icon: <FileText className="h-4 w-4" /> },
  sent: { variant: 'default', label: 'Sent', icon: <Send className="h-4 w-4" /> },
  accepted: { variant: 'default', label: 'Accepted', icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
  declined: { variant: 'destructive', label: 'Declined', icon: <XCircle className="h-4 w-4" /> },
  expired: { variant: 'secondary', label: 'Expired', icon: <Clock className="h-4 w-4" /> },
  rescinded: { variant: 'destructive', label: 'Rescinded', icon: <XCircle className="h-4 w-4" /> },
};

export default function OffersTab({
  company,
  companyUser,
}: OffersTabProps) {
  const [offers, setOffers] = useState<OfferWithDetails[]>([]);
  const [offerCandidateOptions, setOfferCandidateOptions] = useState<OfferCandidateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithDetails | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingOfferAction | null>(null);
  const [statusFilter, setStatusFilter] = useState<OfferStatus | 'all'>('all');

  const { toast } = useToast();
  const isHROrAdmin = companyUser?.role === 'admin' || companyUser?.role === 'hr';

  useEffect(() => {
    fetchOffers();
  }, [company.id]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      // First get all job IDs for this company
      const { data: jobsData } = await supabase
        .from('job_postings')
        .select('id')
        .eq('company_id', company.id);

      const jobIds = jobsData?.map(j => j.id) || [];

      if (jobIds.length === 0) {
        setOffers([]);
        setLoading(false);
        return;
      }

      // Get applications for those jobs
      const { data: appsData } = await supabase
        .from('candidate_applications')
        .select(`
          id,
          candidate_id,
          hired_at,
          rejected_at,
          withdrawn_at,
          candidate:candidates (
            id,
            full_name,
            email
          ),
          job_posting:job_postings (
            id,
            title
          )
        `)
        .in('job_posting_id', jobIds);

      const appIds = appsData?.map((a: any) => a.id) || [];

      const options = (appsData || [])
        .filter((app: any) => !app.hired_at && !app.rejected_at && !app.withdrawn_at && app.candidate?.email)
        .map((app: any) => ({
          applicationId: app.id,
          candidateId: app.candidate_id,
          candidateName: app.candidate?.full_name || app.candidate?.email?.split('@')[0] || 'Candidate',
          candidateEmail: app.candidate.email,
          jobTitle: app.job_posting?.title || 'Unknown Role',
        }));
      setOfferCandidateOptions(options);

      if (appIds.length === 0) {
        setOffers([]);
        setLoading(false);
        return;
      }

      // Get offers
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          candidate_application:candidate_applications (
            id,
            candidate:candidates (
              id,
              full_name,
              email
            ),
            job_posting:job_postings (
              id,
              title
            )
          )
        `)
        .in('application_id', appIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data as OfferWithDetails[] || []);
    } catch (err: any) {
      console.error('Error fetching offers:', err);
      toast({
        title: 'Error loading offers',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOfferStatus = async (offerId: string, status: OfferStatus) => {
    try {
      const updates: any = { status };
      const now = new Date().toISOString();
      
      if (status === 'sent') {
        updates.sent_at = now;
      } else if (status === 'accepted') {
        updates.responded_at = now;
        updates.signed_at = now;
      } else if (status === 'declined') {
        updates.responded_at = now;
      }

      const { error } = await supabase
        .from('offers')
        .update(updates)
        .eq('id', offerId);

      if (error) throw error;

      toast({
        title: 'Offer updated',
        description: `Status changed to ${OFFER_STATUS_CONFIG[status].label}.`,
      });

      // If accepted, mark the candidate as hired
      if (status === 'accepted') {
        const offer = offers.find(o => o.id === offerId);
        if (offer) {
          await supabase
            .from('candidate_applications')
            .update({
              hired_at: new Date().toISOString(),
              rejected_at: null,
              rejection_reason: null,
            })
            .eq('id', offer.application_id);
        }
      }

      fetchOffers();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const deleteOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);

      if (error) throw error;

      toast({
        title: 'Offer deleted',
        description: 'The offer has been removed.',
      });

      fetchOffers();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const requestStatusUpdate = (offer: OfferWithDetails, status: OfferStatus) => {
    const candidateName = offer.candidate_application?.candidate?.full_name || 'this candidate';
    const statusLabel = OFFER_STATUS_CONFIG[status].label;
    setPendingAction({
      offerId: offer.id,
      action: 'status',
      nextStatus: status,
      title: `Confirm ${statusLabel}`,
      description: `Are you sure you want to mark the offer for ${candidateName} as ${statusLabel.toLowerCase()}?`,
      confirmLabel: `Mark ${statusLabel}`,
      destructive: status === 'declined' || status === 'rescinded',
    });
  };

  const requestDeleteOffer = (offer: OfferWithDetails) => {
    const candidateName = offer.candidate_application?.candidate?.full_name || 'this candidate';
    setPendingAction({
      offerId: offer.id,
      action: 'delete',
      title: 'Delete Offer',
      description: `Are you sure you want to delete the offer for ${candidateName}? This action cannot be undone.`,
      confirmLabel: 'Delete Offer',
      destructive: true,
    });
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    const actionToRun = pendingAction;
    setPendingAction(null);

    if (actionToRun.action === 'status' && actionToRun.nextStatus) {
      await updateOfferStatus(actionToRun.offerId, actionToRun.nextStatus);
      return;
    }

    if (actionToRun.action === 'delete') {
      await deleteOffer(actionToRun.offerId);
    }
  };

  const filteredOffers = offers.filter(offer => {
    if (statusFilter !== 'all' && offer.status !== statusFilter) return false;
    return true;
  });

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const formatSalary = (amount: number | null, currency: string | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Stats
  const pendingCount = offers.filter(o => o.status === 'sent' || o.status === 'draft').length;
  const acceptedCount = offers.filter(o => o.status === 'accepted').length;
  const declinedCount = offers.filter(o => o.status === 'declined').length;
  const acceptanceRate = offers.filter(o => o.status === 'accepted' || o.status === 'declined').length > 0
    ? Math.round((acceptedCount / (acceptedCount + declinedCount)) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-tour="hiring-offers-overview">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-tour="hiring-offers-stats">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Offers</p>
                <p className="text-2xl font-bold">{offers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold">{acceptedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acceptance Rate</p>
                <p className="text-2xl font-bold">{acceptanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4" data-tour="hiring-offers-controls">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="rescinded">Rescinded</SelectItem>
          </SelectContent>
        </Select>

        {isHROrAdmin && (
          <Button onClick={() => setShowCreateDialog(true)} disabled={offerCandidateOptions.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Create Offer
          </Button>
        )}
      </div>

      {/* Offers Table */}
      <Card data-tour="hiring-offers-table">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOffers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No offers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOffers.map(offer => {
                  const candidate = offer.candidate_application?.candidate;
                  const job = offer.candidate_application?.job_posting;
                  const statusConfig = OFFER_STATUS_CONFIG[offer.status];

                  return (
                    <TableRow key={offer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {candidate ? getInitials(candidate.full_name, candidate.email) : '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {candidate?.full_name || candidate?.email?.split('@')[0] || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {candidate?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{job?.title || 'Unknown'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {formatSalary(offer.salary, offer.salary_currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {offer.start_date ? format(new Date(offer.start_date), 'MMM d, yyyy') : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {offer.expires_at ? format(new Date(offer.expires_at), 'MMM d, yyyy') : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant} className="flex items-center gap-1 w-fit">
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onFocus={(e) => {
                                e.currentTarget.blur();
                              }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedOffer(offer);
                              setShowViewDialog(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {isHROrAdmin && (
                              <>
                                {offer.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => requestStatusUpdate(offer, 'sent')}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Mark as Sent
                                  </DropdownMenuItem>
                                )}
                                {offer.status === 'sent' && (
                                  <>
                                    <DropdownMenuItem onClick={() => requestStatusUpdate(offer, 'accepted')}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark Accepted
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => requestStatusUpdate(offer, 'declined')}>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Mark Declined
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                {offer.status === 'draft' && (
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {['draft', 'accepted', 'declined', 'rescinded'].includes(offer.status) && (
                                  <DropdownMenuItem 
                                    onClick={() => requestDeleteOffer(offer)}
                                    className="text-destructive"
                                  >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                                {offer.status === 'sent' && (
                                  <DropdownMenuItem 
                                    onClick={() => requestStatusUpdate(offer, 'rescinded')}
                                    className="text-destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rescind Offer
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SendOfferDialog
        applicationId={null}
        candidateId={null}
        candidateName=""
        candidateEmail=""
        companyName={company.name}
        jobTitle=""
        companyId={company.id}
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSent={() => {
          fetchOffers();
          setShowCreateDialog(false);
        }}
        candidateOptions={offerCandidateOptions}
        requireCandidateSelection
      />

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Offer Details</DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {selectedOffer.candidate_application?.candidate 
                      ? getInitials(
                          selectedOffer.candidate_application.candidate.full_name,
                          selectedOffer.candidate_application.candidate.email
                        )
                      : '??'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedOffer.candidate_application?.candidate?.full_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOffer.candidate_application?.job_posting?.title}
                  </p>
                </div>
                <Badge 
                  variant={OFFER_STATUS_CONFIG[selectedOffer.status].variant}
                  className="ml-auto"
                >
                  {OFFER_STATUS_CONFIG[selectedOffer.status].label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Salary</p>
                  <p className="font-medium">
                    {formatSalary(selectedOffer.salary, selectedOffer.salary_currency)}
                  </p>
                </div>
                {selectedOffer.bonus && (
                  <div>
                    <p className="text-sm text-muted-foreground">Bonus</p>
                    <p className="font-medium">
                      {formatSalary(selectedOffer.bonus, selectedOffer.salary_currency)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {selectedOffer.start_date 
                      ? format(new Date(selectedOffer.start_date), 'MMM d, yyyy')
                      : 'TBD'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="font-medium">
                    {selectedOffer.expires_at 
                      ? format(new Date(selectedOffer.expires_at), 'MMM d, yyyy')
                      : 'No expiration'}
                  </p>
                </div>
                {selectedOffer.equity && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Equity</p>
                    <p className="font-medium">{selectedOffer.equity}</p>
                  </div>
                )}
              </div>

              {selectedOffer.internal_notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Internal Notes</p>
                  <p className="text-sm">{selectedOffer.internal_notes}</p>
                </div>
              )}

              {selectedOffer.candidate_notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Candidate Response</p>
                  <p className="text-sm">{selectedOffer.candidate_notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingAction} onOpenChange={(isOpen) => !isOpen && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>{pendingAction?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={pendingAction?.destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}
            >
              {pendingAction?.confirmLabel || 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
