import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SavedProgress {
  id?: string;
  currentQuestion: number;
  answers: { [key: number]: string };
  assessmentType: string;
  totalQuestions: number;
  lastSavedAt: string;
}

interface UseAssessmentProgressOptions {
  assessmentType: string;
  totalQuestions: number;
  autoSaveInterval?: number; // in milliseconds, default 5000ms
}

export function useAssessmentProgress({
  assessmentType,
  totalQuestions,
  autoSaveInterval = 5000,
}: UseAssessmentProgressOptions) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Storage key for localStorage fallback (non-logged-in users)
  const localStorageKey = `assessment_progress_${assessmentType}`;

  // Load saved progress on mount
  useEffect(() => {
    loadProgress();
  }, [user, assessmentType]);

  const loadProgress = async () => {
    setIsLoading(true);
    try {
      if (user) {
        // Load from database for logged-in users
        const { data, error } = await supabase
          .from('assessment_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('assessment_type', assessmentType)
          .is('dominant_color', null) // Only get incomplete assessments
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error loading progress:', error);
        } else if (data) {
          const progress: SavedProgress = {
            id: data.id,
            currentQuestion: (data.results as any)?.currentQuestion ?? 0,
            answers: (data.results as any)?.answers ?? {},
            assessmentType: data.assessment_type,
            totalQuestions: (data.results as any)?.totalQuestions ?? totalQuestions,
            lastSavedAt: data.created_at || new Date().toISOString(),
          };
          setSavedProgress(progress);
          setLastSaved(new Date(progress.lastSavedAt));
        }
      } else {
        // Load from localStorage for non-logged-in users
        const localData = localStorage.getItem(localStorageKey);
        if (localData) {
          const progress = JSON.parse(localData) as SavedProgress;
          setSavedProgress(progress);
          setLastSaved(new Date(progress.lastSavedAt));
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = useCallback(async (
    currentQuestion: number,
    answers: { [key: number]: string }
  ) => {
    if (isSaving) return;
    
    // Don't save if no answers yet
    if (Object.keys(answers).length === 0) return;

    setIsSaving(true);
    const now = new Date();
    
    try {
      const progressData: SavedProgress = {
        id: savedProgress?.id,
        currentQuestion,
        answers,
        assessmentType,
        totalQuestions,
        lastSavedAt: now.toISOString(),
      };

      if (user) {
        // Save to database for logged-in users
        const results = {
          currentQuestion,
          answers,
          totalQuestions,
          status: 'in_progress',
        };

        if (savedProgress?.id) {
          // Update existing record
          const { error } = await supabase
            .from('assessment_progress')
            .update({
              results,
            })
            .eq('id', savedProgress.id);

          if (error) throw error;
        } else {
          // Create new record
          const { data, error } = await supabase
            .from('assessment_progress')
            .insert({
              user_id: user.id,
              assessment_type: assessmentType,
              results,
              scores: null,
              dominant_color: null,
            })
            .select('id')
            .single();

          if (error) throw error;
          progressData.id = data.id;
        }

        setSavedProgress(progressData);
        setLastSaved(now);
      } else {
        // Save to localStorage for non-logged-in users
        localStorage.setItem(localStorageKey, JSON.stringify(progressData));
        setSavedProgress(progressData);
        setLastSaved(now);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user, assessmentType, totalQuestions, savedProgress?.id, isSaving, localStorageKey]);

  const clearProgress = useCallback(async () => {
    try {
      if (user && savedProgress?.id) {
        // Delete from database
        await supabase
          .from('assessment_progress')
          .delete()
          .eq('id', savedProgress.id);
      }
      
      // Always clear localStorage
      localStorage.removeItem(localStorageKey);
      setSavedProgress(null);
      setLastSaved(null);
    } catch (error) {
      console.error('Error clearing progress:', error);
    }
  }, [user, savedProgress?.id, localStorageKey]);

  const markComplete = useCallback(async (
    dominantColor: string,
    scores: { [key: string]: number }
  ) => {
    try {
      if (user && savedProgress?.id) {
        // Update the progress record with final scores
        await supabase
          .from('assessment_progress')
          .update({
            dominant_color: dominantColor,
            scores,
            results: {
              ...savedProgress,
              status: 'complete',
            },
          })
          .eq('id', savedProgress.id);
      }
      
      // Clear localStorage
      localStorage.removeItem(localStorageKey);
      setSavedProgress(null);
    } catch (error) {
      console.error('Error marking complete:', error);
    }
  }, [user, savedProgress, localStorageKey]);

  return {
    isLoading,
    savedProgress,
    lastSaved,
    isSaving,
    saveProgress,
    clearProgress,
    markComplete,
    hasProgress: savedProgress !== null && Object.keys(savedProgress.answers).length > 0,
  };
}
