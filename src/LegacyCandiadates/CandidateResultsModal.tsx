import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, FileText, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ResumeUpload from '@/components/b2b/ResumeUpload';
import { useToast } from '@/hooks/use-toast';

interface CandidateResultsModalProps {
  open: boolean;
  onClose: () => void;
  onCandidateUpdate?: () => void;
  candidate: {
    id: string;
    email: string;
    full_name: string | null;
    position_title: string | null;
    assessment_category: string | null;
    assessment_type: string | null;
    resume_url?: string | null;
    company_id?: string;
  };
}

interface AssessmentResult {
  dominantColor: string;
  scores: Record<string, number>;
  strengths?: string[];
  description?: string;
}

const COLOR_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Yellow - Action' },
  red: { bg: 'bg-red-100', text: 'text-red-800', label: 'Red - Motivation' },
  green: { bg: 'bg-green-100', text: 'text-green-800', label: 'Green - Organization' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Blue - Innovation' },
};

export default function CandidateResultsModal({
  open,
  onClose,
  onCandidateUpdate,
  candidate,
}: CandidateResultsModalProps) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(candidate.resume_url || null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && candidate.id) {
      fetchResults();
      setResumeUrl(candidate.resume_url || null);
    }
  }, [open, candidate.id, candidate.resume_url]);

  const fetchResults = async () => {
    setLoading(true);
    
    // Fetch the candidate's assessment result
    const { data: candidateData } = await supabase
      .from('candidates')
      .select('assessment_result_id')
      .eq('id', candidate.id)
      .single();

    if (candidateData?.assessment_result_id) {
      const { data: resultData } = await supabase
        .from('assessment_results')
        .select('results')
        .eq('id', candidateData.assessment_result_id)
        .single();

      if (resultData?.results) {
        setResult(resultData.results as unknown as AssessmentResult);
      }
    }
    
    setLoading(false);
  };

  const colorStyle = result?.dominantColor ? COLOR_STYLES[result.dominantColor] : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assessment Results
          </DialogTitle>
        </DialogHeader>

        {/* Candidate Info - Always shown */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">
              {candidate.full_name || candidate.email}
            </h3>
            <p className="text-sm text-muted-foreground">{candidate.email}</p>
            {candidate.position_title && (
              <p className="text-sm">Position: {candidate.position_title}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {candidate.assessment_category && candidate.assessment_type && (
              <Badge variant="outline" className="capitalize">
                {candidate.assessment_category} • {candidate.assessment_type.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* Resume Section - Always shown */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Resume:</span>
          {resumeUrl ? (
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto"
              onClick={() => window.open(resumeUrl, '_blank')}
            >
              View Resume
            </Button>
          ) : candidate.company_id ? (
            <ResumeUpload
              candidateId={candidate.id}
              companyId={candidate.company_id}
              onUploadComplete={() => {
                setResumeUrl('uploaded');
                onCandidateUpdate?.();
                toast({
                  title: 'Resume uploaded',
                  description: 'Resume has been uploaded and is being parsed.',
                });
              }}
              trigger={
                <Button variant="outline" size="sm" className="h-7">
                  <Upload className="h-3 w-3 mr-1" />
                  Upload Resume
                </Button>
              }
            />
          ) : (
            <span className="text-sm text-muted-foreground">No resume</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !result ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No assessment results found for this candidate.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {colorStyle && (
              <Card className={`${colorStyle.bg} border-0`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-lg ${colorStyle.text}`}>
                    Dominant Color: {colorStyle.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.description && (
                    <p className={`text-sm ${colorStyle.text} opacity-90`}>
                      {result.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Scores */}
            {result.scores && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Color Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(result.scores).map(([color, score]) => {
                      const style = COLOR_STYLES[color];
                      const percentage = typeof score === 'number' ? score : 0;
                      return (
                        <div key={color} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize font-medium">{color}</span>
                            <span>{percentage}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${style?.bg || 'bg-gray-300'} transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strengths */}
            {result.strengths && result.strengths.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Key Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.strengths.map((strength, idx) => (
                      <Badge key={idx} variant="secondary">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}