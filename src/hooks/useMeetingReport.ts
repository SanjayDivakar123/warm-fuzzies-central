import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface MeetingSpeaker {
  id: string;
  meeting_id: string;
  detected_name: string;
  match_status: string;
  company_user_id: string | null;
  talk_time_pct: number | null;
  signal_count: number;
  dominant_rolecolor: string | null;
}

export interface MeetingReport {
  id: string;
  meeting_id: string;
  generated_at: string;
  summary: string | null;
  alignment_score: number | null;
  dominant_speaker_id: string | null;
  least_active_speaker_id: string | null;
  key_moments: Record<string, any> | null;
  action_items: Record<string, any> | null;
  recommendations: Record<string, any> | null;
  participant_dynamics: Record<string, any> | null;
  pdf_url: string | null;
}

export interface Utterance {
  id: string;
  meeting_id: string;
  speaker_id: string | null;
  text: string;
  timestamp_ms: number;
  word_count: number;
  rolecolor_signal: string | null;
  confidence: number | null;
}

export function useMeetingReport(meetingId: string | undefined) {
  const [speakers, setSpeakers] = useState<MeetingSpeaker[]>([]);
  const [report, setReport] = useState<MeetingReport | null>(null);
  const [utterances, setUtterances] = useState<Utterance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReport = useCallback(async () => {
    if (!meetingId) return;

    setLoading(true);
    setError(null);

    try {
      const [speakersRes, reportRes, utterancesRes] = await Promise.all([
        supabase
          .from('meeting_speakers')
          .select('*')
          .eq('meeting_id', meetingId),
        supabase
          .from('meeting_reports')
          .select('*')
          .eq('meeting_id', meetingId)
          .single(),
        supabase
          .from('utterances')
          .select('*')
          .eq('meeting_id', meetingId)
          .order('timestamp_ms', { ascending: true })
      ]);

      if (speakersRes.error) throw speakersRes.error;
      if (utterancesRes.error) throw utterancesRes.error;

      setSpeakers(speakersRes.data || []);
      setUtterances(utterancesRes.data || []);

      if (reportRes.data) {
        setReport(reportRes.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch report';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [meetingId, toast]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const updateSpeaker = useCallback(
    async (speakerId: string, updates: Partial<MeetingSpeaker>) => {
      try {
        const { data, error: err } = await supabase
          .from('meeting_speakers')
          .update(updates)
          .eq('id', speakerId)
          .select()
          .single();

        if (err) throw err;
        setSpeakers(prev => prev.map(s => s.id === speakerId ? data : s));
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update speaker';
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

  const createReport = useCallback(
    async (reportData: Partial<MeetingReport>) => {
      try {
        const { data, error: err } = await supabase
          .from('meeting_reports')
          .insert([reportData])
          .select()
          .single();

        if (err) throw err;
        setReport(data);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create report';
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
    speakers,
    report,
    utterances,
    loading,
    error,
    fetchReport,
    updateSpeaker,
    createReport,
  };
}
