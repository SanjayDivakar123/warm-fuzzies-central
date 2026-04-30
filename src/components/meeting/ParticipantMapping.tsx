import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Check, X } from 'lucide-react';
import { useMeetingReport } from '@/hooks/useMeetingReport';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ParticipantMappingProps {
  meetingId: string;
}

export default function ParticipantMapping({ meetingId }: ParticipantMappingProps) {
  const { speakers, loading, updateSpeaker } = useMeetingReport(meetingId);
  const { company } = useCompany();
  const { toast } = useToast();
  const [companyUsers, setCompanyUsers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [mappings, setMappings] = useState<Record<string, string | 'external' | 'skip'>>({});
  const [saving, setSaving] = useState(false);

  // Fetch company users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!company?.id) return;
      const { data } = await supabase
        .from('company_users')
        .select('id, full_name')
        .eq('company_id', company.id)
        .order('full_name');
      if (data) setCompanyUsers(data);
    };
    fetchUsers();
  }, [company?.id]);

  // Initialize mappings
  useEffect(() => {
    const initial: Record<string, string | 'external' | 'skip'> = {};
    speakers.forEach(s => {
      initial[s.id] = s.company_user_id || 'pending';
    });
    setMappings(initial);
  }, [speakers]);

  const unmappedCount = speakers.filter(s => s.match_status === 'pending').length;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      for (const speaker of speakers) {
        const mapping = mappings[speaker.id];
        if (mapping === 'pending') continue;

        const updates: Record<string, any> = {
          match_status: mapping === 'external' ? 'external' : mapping === 'skip' ? 'skipped' : 'admin_confirmed',
        };

        if (mapping !== 'external' && mapping !== 'skip') {
          updates.company_user_id = mapping;
        }

        await updateSpeaker(speaker.id, updates);
      }

      toast({
        title: 'Participants confirmed',
        description: 'Processing report...',
      });

      // Update meeting status
      await supabase
        .from('meetings')
        .update({ bot_join_status: 'processing' })
        .eq('id', meetingId);

    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to confirm participants',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>{unmappedCount}</strong> unresolved speaker{unmappedCount !== 1 ? 's' : ''}. Confirm their identities below.
        </p>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {speakers.map(speaker => {
          const mapping = mappings[speaker.id] || 'pending';
          const isResolved = mapping !== 'pending';
          const matchUser = companyUsers.find(u => u.id === mapping);

          return (
            <Card key={speaker.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm">{speaker.detected_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Detected in transcript
                    </p>
                  </div>

                  <Select
                    value={mapping}
                    onValueChange={(value) =>
                      setMappings(prev => ({ ...prev, [speaker.id]: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user or mark as..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending" disabled>
                        Unresolved
                      </SelectItem>
                      {companyUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                      <SelectItem value="external">External (Not in company)</SelectItem>
                      <SelectItem value="skip">Skip this speaker</SelectItem>
                    </SelectContent>
                  </Select>

                  {isResolved && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs text-green-700">
                      <Check className="h-3 w-3" />
                      {mapping === 'external' ? 'Marked as external' : mapping === 'skip' ? 'Will be skipped' : `Matched: ${matchUser?.full_name}`}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button
        onClick={handleConfirm}
        disabled={saving || unmappedCount > 0}
        className="w-full"
      >
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Confirm & Generate Report
      </Button>

      {unmappedCount > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Resolve all speakers before generating report
        </p>
      )}
    </div>
  );
}
