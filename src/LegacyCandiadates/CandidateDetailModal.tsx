import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  UserCheck, 
  Archive, 
  Trash2, 
  Sparkles, 
  FileText, 
  Upload,
  Loader2,
  Mail
} from 'lucide-react';

interface Candidate {
  id: string;
  email: string;
  full_name: string | null;
  position_title: string | null;
  ideal_role_color: string | null;
  status: string;
  source: string;
  assessment_category: string | null;
  assessment_type: string | null;
  assessment_completed_at: string | null;
  fit_score: number | null;
  fit_analysis: any;
  resume_url: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  invited: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  applied: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  assessment_pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  assessment_completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  hired: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  invited: 'Invited',
  applied: 'Applied',
  assessment_pending: 'Pending',
  assessment_completed: 'Completed',
  hired: 'Hired',
  archived: 'Archived',
  rejected: 'Rejected',
};

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analyzingFit: string | null;
  onViewResults: (candidate: Candidate) => void;
  onViewFitAnalysis: (candidate: Candidate) => void;
  onAnalyzeFit: (candidate: Candidate) => void;
  onHire: (candidate: Candidate) => void;
  onArchive: (candidate: Candidate) => void;
  onDelete: (candidate: Candidate) => void;
  onUploadResume: (candidateId: string) => void;
}

export default function CandidateDetailModal({
  candidate,
  open,
  onOpenChange,
  analyzingFit,
  onViewResults,
  onViewFitAnalysis,
  onAnalyzeFit,
  onHire,
  onArchive,
  onDelete,
  onUploadResume,
}: CandidateDetailModalProps) {
  if (!candidate) return null;

  const getStatusBadge = () => (
    <Badge className={STATUS_COLORS[candidate.status] || ''}>
      {STATUS_LABELS[candidate.status] || candidate.status}
    </Badge>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Candidate Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-lg">{candidate.full_name || 'No name'}</p>
                <p className="text-sm text-muted-foreground break-all">{candidate.email}</p>
              </div>
              {getStatusBadge()}
            </div>
          </div>

          <Separator />

          {/* Position */}
          {candidate.position_title && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Position</Label>
              <p className="text-sm font-medium">{candidate.position_title}</p>
              {candidate.ideal_role_color && (
                <Badge variant="outline" className="text-xs capitalize mt-1">
                  Ideal: {candidate.ideal_role_color}
                </Badge>
              )}
            </div>
          )}

          {/* Assessment */}
          {candidate.assessment_category && candidate.assessment_type && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Assessment Type</Label>
              <Badge variant="outline" className="capitalize">
                {candidate.assessment_category} • {candidate.assessment_type.toUpperCase()}
              </Badge>
            </div>
          )}

          {/* Fit Score */}
          {candidate.fit_score !== null && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fit Score</Label>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${
                  candidate.fit_score >= 80 ? 'text-green-600' :
                  candidate.fit_score >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {candidate.fit_score}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewFitAnalysis(candidate)}
                  className="text-xs"
                >
                  View Analysis
                </Button>
              </div>
            </div>
          )}

          {/* Source */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Source</Label>
            <p className="text-sm capitalize">{candidate.source.replace('_', ' ')}</p>
          </div>

          {/* Created Date */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Added</Label>
            <p className="text-sm">{new Date(candidate.created_at).toLocaleDateString()}</p>
          </div>

          {candidate.assessment_completed_at && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Assessment Completed</Label>
              <p className="text-sm">{new Date(candidate.assessment_completed_at).toLocaleDateString()}</p>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Actions</Label>
            <div className="grid grid-cols-2 gap-2">
              {/* Resume */}
              {candidate.resume_url ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(candidate.resume_url!, '_blank')}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View Resume
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onUploadResume(candidate.id);
                    onOpenChange(false);
                  }}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Resume
                </Button>
              )}

              {/* View Results */}
              {candidate.assessment_completed_at && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onViewResults(candidate);
                    onOpenChange(false);
                  }}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Results
                </Button>
              )}

              {/* Analyze Fit */}
              {candidate.assessment_completed_at && candidate.fit_score === null && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAnalyzeFit(candidate)}
                  disabled={analyzingFit === candidate.id}
                  className="gap-2"
                >
                  {analyzingFit === candidate.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Analyze Fit
                </Button>
              )}

              {/* Hire */}
              {candidate.status === 'assessment_completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onHire(candidate);
                    onOpenChange(false);
                  }}
                  className="gap-2 text-green-600 hover:bg-green-50"
                >
                  <UserCheck className="h-4 w-4" />
                  Hire
                </Button>
              )}

              {/* Archive */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onArchive(candidate);
                  onOpenChange(false);
                }}
                className="gap-2"
              >
                <Archive className="h-4 w-4" />
                Archive
              </Button>

              {/* Delete */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDelete(candidate);
                  onOpenChange(false);
                }}
                className="gap-2 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
