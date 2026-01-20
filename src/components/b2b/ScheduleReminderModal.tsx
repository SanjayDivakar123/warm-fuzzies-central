import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Loader2, Bell, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleReminderModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  selectedUsers: { id: string; email: string; full_name: string | null }[];
  onScheduled: () => void;
}

export default function ScheduleReminderModal({
  open,
  onClose,
  companyId,
  selectedUsers,
  onScheduled,
}: ScheduleReminderModalProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState<'once' | 'daily' | 'weekly'>('once');
  const [scheduling, setScheduling] = useState(false);
  const { toast } = useToast();

  const handleSchedule = async () => {
    if (!date) {
      toast({
        title: 'Date required',
        description: 'Please select a date for the reminder',
        variant: 'destructive',
      });
      return;
    }

    setScheduling(true);

    try {
      // Combine date and time
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledFor = new Date(date);
      scheduledFor.setHours(hours, minutes, 0, 0);

      // Check if the scheduled time is in the future
      if (scheduledFor <= new Date()) {
        toast({
          title: 'Invalid time',
          description: 'Please select a future date and time',
          variant: 'destructive',
        });
        setScheduling(false);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create reminders for each selected user
      const reminders = selectedUsers.map(u => ({
        company_id: companyId,
        company_user_id: u.id,
        scheduled_for: scheduledFor.toISOString(),
        created_by: user.id,
        status: 'pending',
        recurrence,
      }));

      const { error } = await supabase
        .from('scheduled_reminders')
        .insert(reminders);

      if (error) throw error;

      const recurrenceText = recurrence === 'once' 
        ? '' 
        : ` (${recurrence} until assessment completed)`;

      toast({
        title: 'Reminders scheduled',
        description: `${selectedUsers.length} reminder${selectedUsers.length > 1 ? 's' : ''} scheduled for ${format(scheduledFor, 'PPp')}${recurrenceText}`,
      });

      onScheduled();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error scheduling reminders',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setScheduling(false);
    }
  };

  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      timeOptions.push(`${hour}:${minute}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Schedule Reminder
          </DialogTitle>
          <DialogDescription>
            Send a reminder email to {selectedUsers.length} employee{selectedUsers.length > 1 ? 's' : ''} who haven't completed their assessment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Selected Employees</Label>
            <div className="text-sm text-muted-foreground max-h-24 overflow-y-auto border rounded-md p-2">
              {selectedUsers.map(u => (
                <div key={u.id}>
                  {u.full_name || u.email}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {timeOptions.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Recurrence
            </Label>
            <RadioGroup 
              value={recurrence} 
              onValueChange={(v) => setRecurrence(v as 'once' | 'daily' | 'weekly')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="once" id="once" />
                <Label htmlFor="once" className="font-normal cursor-pointer">Once</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="font-normal cursor-pointer">Daily</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="font-normal cursor-pointer">Weekly</Label>
              </div>
            </RadioGroup>
            {recurrence !== 'once' && (
              <p className="text-xs text-muted-foreground">
                Reminders will repeat {recurrence} until the employee completes their assessment.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={scheduling || !date}>
            {scheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Schedule Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
