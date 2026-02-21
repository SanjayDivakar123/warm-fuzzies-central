import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Trash2, Mail, Clock, RefreshCw, Send } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduledReport {
  id: string;
  name: string;
  report_type: string;
  frequency: string;
  timezone: string | null;
  recipients: string[];
  is_active: boolean;
  include_sections: string[];
  last_sent_at: string | null;
  next_send_at: string | null;
  created_at: string;
}

interface ScheduledReportsManagerProps {
  companyId: string;
}

const REPORT_SECTIONS = [
  { id: 'overview', label: 'Team Overview' },
  { id: 'color_distribution', label: 'Color Distribution' },
  { id: 'completion_trend', label: 'Completion Trends' },
  { id: 'leadership_potential', label: 'Leadership Potential' },
  { id: 'recent_assessments', label: 'Recent Assessments' },
];

export default function ScheduledReportsManager({ companyId }: ScheduledReportsManagerProps) {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sendingNow, setSendingNow] = useState<string | null>(null);
  
  const [newReport, setNewReport] = useState({
    name: '',
    report_type: 'team_summary',
    frequency: 'weekly',
    recipients: '',
    include_sections: ['overview', 'color_distribution', 'completion_trend'],
  });
  
  const { toast } = useToast();
  const adminTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const getNextDailySendAt = () => {
    const next = new Date();
    next.setHours(8, 0, 0, 0);
    if (next <= new Date()) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  };

  useEffect(() => {
    fetchReports();
  }, [companyId]);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      const dailyReportsToAlign = (data || []).filter(
        (report) => report.frequency === 'daily' && report.timezone !== adminTimezone
      );

      if (dailyReportsToAlign.length > 0) {
        const nextDailySendAtIso = getNextDailySendAt().toISOString();
        await Promise.all(
          dailyReportsToAlign.map((report) =>
            supabase
              .from('scheduled_reports')
              .update({
                timezone: adminTimezone,
                next_send_at: nextDailySendAtIso,
              })
              .eq('id', report.id)
          )
        );
      }

      setReports(data?.map(r => ({
        ...r,
        timezone: r.timezone || adminTimezone,
        include_sections: (r.include_sections as string[]) || []
      })) || []);

      if (dailyReportsToAlign.length > 0) {
        const { data: refreshedData } = await supabase
          .from('scheduled_reports')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        setReports(refreshedData?.map(r => ({
          ...r,
          timezone: r.timezone || adminTimezone,
          include_sections: (r.include_sections as string[]) || []
        })) || []);
      }
    }
    setLoading(false);
  };

  const handleCreateReport = async () => {
    if (!newReport.name.trim() || !newReport.recipients.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please enter a name and at least one recipient.',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const recipients = newReport.recipients.split(',').map(e => e.trim()).filter(Boolean);

      // Calculate next send time (8:00 AM in the admin's local timezone)
      let nextSendAt = new Date();
      switch (newReport.frequency) {
        case 'daily':
          nextSendAt.setHours(8, 0, 0, 0);
          if (nextSendAt <= new Date()) {
            nextSendAt.setDate(nextSendAt.getDate() + 1);
          }
          break;
        case 'weekly':
          nextSendAt.setDate(nextSendAt.getDate() + (7 - nextSendAt.getDay() + 1) % 7 + 1);
          nextSendAt.setHours(8, 0, 0, 0);
          break;
        case 'monthly':
          nextSendAt.setMonth(nextSendAt.getMonth() + 1);
          nextSendAt.setDate(1);
          nextSendAt.setHours(8, 0, 0, 0);
          break;
      }

      const { error } = await supabase
        .from('scheduled_reports')
        .insert({
          company_id: companyId,
          name: newReport.name,
          report_type: newReport.report_type,
          frequency: newReport.frequency,
          timezone: adminTimezone,
          recipients,
          include_sections: newReport.include_sections,
          next_send_at: nextSendAt.toISOString(),
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Report scheduled',
        description: `"${newReport.name}" will be sent ${newReport.frequency}.`,
      });

      setShowCreateModal(false);
      setNewReport({
        name: '',
        report_type: 'team_summary',
        frequency: 'weekly',
        recipients: '',
        include_sections: ['overview', 'color_distribution', 'completion_trend'],
      });
      fetchReports();
    } catch (error: any) {
      toast({
        title: 'Error creating report',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleReport = async (reportId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ is_active: isActive })
        .eq('id', reportId);

      if (error) throw error;

      setReports(reports.map(r => r.id === reportId ? { ...r, is_active: isActive } : r));
      toast({
        title: isActive ? 'Report activated' : 'Report paused',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating report',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: 'Report deleted',
      });
      fetchReports();
    } catch (error: any) {
      toast({
        title: 'Error deleting report',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSendNow = async (reportId: string) => {
    setSendingNow(reportId);
    try {
      // Update next_send_at to now to trigger the scheduled function
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ next_send_at: new Date().toISOString() })
        .eq('id', reportId);

      if (error) throw error;

      // Invoke the scheduled report function
      await supabase.functions.invoke('send-scheduled-report');

      toast({
        title: 'Report sent',
        description: 'The report has been sent to all recipients.',
      });
      fetchReports();
    } catch (error: any) {
      toast({
        title: 'Error sending report',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSendingNow(null);
    }
  };

  const toggleSection = (sectionId: string) => {
    setNewReport(prev => ({
      ...prev,
      include_sections: prev.include_sections.includes(sectionId)
        ? prev.include_sections.filter(s => s !== sectionId)
        : [...prev.include_sections, sectionId]
    }));
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Scheduled Reports
              </CardTitle>
              <CardDescription>
                Automate team summary reports delivered to your inbox
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No scheduled reports yet</p>
              <p className="text-sm">Create a report to receive automated team updates</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Next Send</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {report.frequency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {report.next_send_at 
                        ? format(new Date(report.next_send_at), 'MMM d, yyyy')
                        : 'Not scheduled'
                      }
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={report.is_active}
                        onCheckedChange={(checked) => handleToggleReport(report.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSendNow(report.id)}
                          disabled={sendingNow === report.id}
                          title="Send now"
                        >
                          {sendingNow === report.id 
                            ? <RefreshCw className="h-4 w-4 animate-spin" />
                            : <Send className="h-4 w-4" />
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReport(report.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Report Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Scheduled Report</DialogTitle>
            <DialogDescription>
              Set up automated team summary reports
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reportName">Report Name</Label>
              <Input
                id="reportName"
                placeholder="e.g., Weekly Team Summary"
                value={newReport.name}
                onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select 
                value={newReport.frequency} 
                onValueChange={(value) => setNewReport({ ...newReport, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">Recipients (comma-separated emails)</Label>
              <Input
                id="recipients"
                placeholder="email1@company.com, email2@company.com"
                value={newReport.recipients}
                onChange={(e) => setNewReport({ ...newReport, recipients: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Include Sections</Label>
              <div className="space-y-2 mt-2">
                {REPORT_SECTIONS.map((section) => (
                  <div key={section.id} className="flex items-center gap-2">
                    <Checkbox
                      id={section.id}
                      checked={newReport.include_sections.includes(section.id)}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <Label htmlFor={section.id} className="font-normal cursor-pointer">
                      {section.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReport} disabled={creating}>
              {creating ? 'Creating...' : 'Create Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
