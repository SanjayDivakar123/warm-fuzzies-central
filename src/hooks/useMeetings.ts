import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Meeting {
  id: string;
  company_id: string;
  title: string;
  platform: string;
  meeting_url: string;
  calendar_event_id: string | null;
  source: string;
  bot_id: string | null;
  bot_join_status: string;
  chat_message_sent: boolean;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export function useMeetings(companyId: string | undefined) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMeetings = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('meetings')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setMeetings(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch meetings';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const createMeeting = useCallback(
    async (meetingData: Partial<Meeting>) => {
      try {
        const { data, error: err } = await supabase
          .from('meetings')
          .insert([meetingData])
          .select()
          .single();

        if (err) throw err;
        setMeetings(prev => [data, ...prev]);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create meeting';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const updateMeeting = useCallback(
    async (id: string, updates: Partial<Meeting>) => {
      try {
        const { data, error: err } = await supabase
          .from('meetings')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (err) throw err;
        setMeetings(prev => prev.map(m => m.id === id ? data : m));
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update meeting';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const deleteMeeting = useCallback(
    async (id: string) => {
      try {
        const { error: err } = await supabase
          .from('meetings')
          .delete()
          .eq('id', id);

        if (err) throw err;
        setMeetings(prev => prev.filter(m => m.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete meeting';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  return {
    meetings,
    loading,
    error,
    fetchMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
  };
}
