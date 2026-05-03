// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Clock, CheckCircle2, XCircle, Search, RefreshCw, CalendarClock, Repeat, Mail, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Company {
  id: string;
  name: string;
}

interface Reminder {
  id: string;
  company_id: string;
  company_user_id: string;
  scheduled_for: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  created_by: string | null;
  recurrence: string;
  delivery_status: string | null;
  employee_email?: string;
  employee_name?: string;
}

interface RemindersHistoryTabProps {
  company: Company;
}

export default function RemindersHistoryTab({ company }: RemindersHistoryTabProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const { data: remindersData, error: remindersError } = await supabase
        .from('scheduled_reminders')
        .select('*')
        .eq('company_id', company.id)
        .order('scheduled_for', { ascending: false });

      if (remindersError) throw remindersError;

      if (remindersData && remindersData.length > 0) {
        const userIds = [...new Set(remindersData.map(r => r.company_user_id))];
        const { data: usersData, error: usersError } = await supabase
          .from('company_users')
          .select('id, email, full_name')
          .in('id', userIds);

        if (usersError) throw usersError;

        const userMap = new Map(usersData?.map(u => [u.id, u]) || []);
        
        const enrichedReminders = remindersData.map(reminder => ({
          ...reminder,
          employee_email: userMap.get(reminder.company_user_id)?.email || 'Unknown',
          employee_name: userMap.get(reminder.company_user_id)?.full_name || undefined,
        }));

        setReminders(enrichedReminders);
      } else {
        setReminders([]);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reminders history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [company.id]);

  const handleCancelReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_reminders')
        .update({ status: 'cancelled' })
        .eq('id', reminderId);

      if (error) throw error;

      toast({
        title: 'Reminder cancelled',
        description: 'The scheduled reminder has been cancelled.',
      });

      fetchReminders();
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel reminder',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="font-normal">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="default" className="font-normal bg-primary/80">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="font-normal text-muted-foreground">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      case 'skipped':
        return (
          <Badge variant="outline" className="font-normal text-muted-foreground">
            Skipped
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
  };

  const getDeliveryBadge = (deliveryStatus: string | null) => {
    if (!deliveryStatus) return null;
    
    switch (deliveryStatus) {
      case 'delivered':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Mail className="h-4 w-4 text-primary" />
              </TooltipTrigger>
              <TooltipContent>Email delivered</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'failed':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </TooltipTrigger>
              <TooltipContent>Email delivery failed</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return null;
    }
  };

  const getRecurrenceBadge = (recurrence: string) => {
    if (recurrence === 'once') return null;
    
    return (
      <Badge variant="outline" className="font-normal text-xs ml-2">
        <Repeat className="h-3 w-3 mr-1" />
        {recurrence}
      </Badge>
    );
  };

  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = 
      reminder.employee_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.employee_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reminder.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status === 'pending').length,
    sent: reminders.filter(r => r.status === 'sent').length,
    recurring: reminders.filter(r => r.recurrence !== 'once' && r.status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="text-2xl font-semibold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-semibold mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sent</p>
            <p className="text-2xl font-semibold mt-1">{stats.sent}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recurring</p>
            <p className="text-2xl font-semibold mt-1">{stats.recurring}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium">Reminder History</CardTitle>
              <CardDescription className="text-sm">All scheduled and sent reminders</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchReminders}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredReminders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No reminders found</p>
              {reminders.length === 0 && (
                <p className="text-xs mt-1 opacity-70">
                  Schedule reminders from the Users tab
                </p>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-medium">Employee</TableHead>
                    <TableHead className="font-medium">Scheduled</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium">Delivery</TableHead>
                    <TableHead className="text-right font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReminders.map((reminder) => (
                    <TableRow key={reminder.id} className="transition-colors hover:bg-muted/50">
                      <TableCell>
                        <div>
                          {reminder.employee_name && (
                            <p className="font-medium text-sm">{reminder.employee_name}</p>
                          )}
                          <p className={reminder.employee_name ? 'text-xs text-muted-foreground' : 'text-sm'}>
                            {reminder.employee_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="text-sm">
                            {format(new Date(reminder.scheduled_for), 'MMM d, h:mm a')}
                          </span>
                          {getRecurrenceBadge(reminder.recurrence)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(reminder.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeliveryBadge(reminder.delivery_status)}
                          {reminder.sent_at && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(reminder.sent_at), 'MMM d, h:mm a')}
                            </span>
                          )}
                          {!reminder.sent_at && reminder.status !== 'pending' && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {reminder.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelReminder(reminder.id)}
                            className="h-8 text-xs text-muted-foreground hover:text-destructive"
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
