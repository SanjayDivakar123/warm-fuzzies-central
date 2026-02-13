import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  stage_order: number;
  color_code: string | null;
}

interface MoveStageDialogProps {
  applicationId: string | null;
  candidateId: string | null;
  candidateName: string;
  currentStageId: string | null;
  jobId: string | null;
  companyId: string;
  open: boolean;
  onClose: () => void;
  onMoved: () => void;
}

export default function MoveStageDialog({
  applicationId,
  candidateId,
  candidateName,
  currentStageId,
  jobId,
  companyId,
  open,
  onClose,
  onMoved,
}: MoveStageDialogProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && jobId) {
      fetchStages();
    }
  }, [open, jobId]);

  const fetchStages = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hiring_pipeline_stages')
        .select('id, name, stage_order, color_code')
        .eq('job_posting_id', jobId)
        .order('stage_order');

      if (error) throw error;
      setStages(data || []);
    } catch (err) {
      console.error('Error fetching stages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async () => {
    if (!applicationId || !selectedStageId) return;

    setMoving(true);
    try {
      const { error } = await supabase
        .from('candidate_applications')
        .update({
          current_stage_id: selectedStageId,
          stage_entered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Log the stage transition
      const newStage = stages.find(s => s.id === selectedStageId);
      const oldStage = stages.find(s => s.id === currentStageId);

      if (candidateId) {
        await supabase.from('candidate_activities').insert({
          company_id: companyId,
          candidate_id: candidateId,
          activity_type: 'stage_change',
          title: `Moved to ${newStage?.name || 'new stage'}`,
          description: `Stage changed from "${oldStage?.name || 'None'}" to "${newStage?.name || 'Unknown'}"`,
          metadata: {
            from_stage_id: currentStageId,
            to_stage_id: selectedStageId,
            application_id: applicationId,
          },
        });
      }

      toast({
        title: 'Stage updated',
        description: `${candidateName} moved to ${newStage?.name}`,
      });

      onMoved();
      onClose();
    } catch (err: any) {
      console.error('Error moving stage:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setMoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move Candidate Stage</DialogTitle>
          <DialogDescription>
            Select a new pipeline stage for {candidateName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : stages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No stages configured for this job posting.
          </div>
        ) : (
          <div className="space-y-2 py-4">
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => setSelectedStageId(stage.id)}
                disabled={stage.id === currentStageId}
                className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                  stage.id === selectedStageId
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : stage.id === currentStageId
                    ? 'border-muted bg-muted/50 opacity-50 cursor-not-allowed'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color_code || '#6b7280' }}
                  />
                  <span className="font-medium">{stage.name}</span>
                </div>
                {stage.id === currentStageId && (
                  <Badge variant="secondary" className="text-xs">Current</Badge>
                )}
                {stage.id === selectedStageId && stage.id !== currentStageId && (
                  <ArrowRight className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={!selectedStageId || selectedStageId === currentStageId || moving}
          >
            {moving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Move Stage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
