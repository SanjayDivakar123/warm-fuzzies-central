import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Clock, CheckCircle2, XCircle, Search, RefreshCw, CalendarClock } from 'lucide-react';
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
      // Fetch reminders with employee info
      const { data: remindersData, error: remindersError } = await supabase
        .from('scheduled_reminders')
        .select('*')
        .eq('company_id', company.id)
        .order('scheduled_for', { ascending: false });

      if (remindersError) throw remindersError;

      // Fetch employee info for all reminders
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
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      case 'skipped':
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Skipped
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
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
    cancelled: reminders.filter(r => r.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reminders</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CalendarClock className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold text-success">{stats.sent}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-destructive">{stats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reminders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reminders History</CardTitle>
              <CardDescription>View and manage all scheduled assessment reminders</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchReminders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredReminders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reminders found</p>
              {reminders.length === 0 && (
                <p className="text-sm mt-2">
                  Schedule reminders from the Users tab to remind employees to complete their assessments.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReminders.map((reminder) => (
                    <TableRow key={reminder.id}>
                      <TableCell>
                        <div>
                          {reminder.employee_name && (
                            <p className="font-medium">{reminder.employee_name}</p>
                          )}
                          <p className={reminder.employee_name ? 'text-sm text-muted-foreground' : 'font-medium'}>
                            {reminder.employee_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(reminder.scheduled_for), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(reminder.status)}
                      </TableCell>
                      <TableCell>
                        {reminder.sent_at 
                          ? format(new Date(reminder.sent_at), 'MMM d, yyyy h:mm a')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(reminder.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        {reminder.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelReminder(reminder.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
