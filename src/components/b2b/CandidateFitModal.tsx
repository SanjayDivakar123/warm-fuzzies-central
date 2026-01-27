import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, CheckCircle2, AlertTriangle, TrendingUp, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AIFollowUpChat from './AIFollowUpChat';

interface CandidateFitModalProps {
  open: boolean;
  onClose: () => void;
  candidate: {
    id: string;
    email: string;
    full_name: string | null;
    position_title: string | null;
    ideal_role_color: string | null;
    fit_score: number | null;
    fit_analysis: {
      summary?: string;
      strengths?: string[];
      concerns?: string[];
      recommendations?: string[];
      colorMatch?: {
        actual: string;
        ideal: string;
        matchPercentage: number;
      };
    } | null;
  };
}

export default function CandidateFitModal({
  open,
  onClose,
  candidate,
}: CandidateFitModalProps) {
  const analysis = candidate.fit_analysis;
  const fitScore = candidate.fit_score || 0;

  const getFitLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent Fit', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { label: 'Good Fit', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 40) return { label: 'Moderate Fit', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { label: 'Low Fit', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const fitInfo = getFitLabel(fitScore);

  const handleFollowUp = useCallback(async (
    messages: { role: 'user' | 'assistant'; content: string }[],
    question: string
  ): Promise<string> => {
    const context = {
      candidateName: candidate.full_name || candidate.email,
      positionTitle: candidate.position_title,
      idealRoleColor: candidate.ideal_role_color,
      fitScore: candidate.fit_score,
      analysis: candidate.fit_analysis,
    };

    const { data, error } = await supabase.functions.invoke('ai-follow-up', {
      body: {
        contextType: 'candidate-fit',
        context,
        messages,
        question,
      },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data.answer;
  }, [candidate]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Fit Analysis
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-6">
            {/* Candidate Info */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {candidate.full_name || candidate.email}
                </h3>
                {candidate.position_title && (
                  <p className="text-sm text-muted-foreground">
                    Applying for: {candidate.position_title}
                  </p>
                )}
              </div>
            </div>

            {/* Fit Score */}
            <Card className={`${fitInfo.bg} border-0`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className={`h-5 w-5 ${fitInfo.color}`} />
                    <span className={`font-semibold ${fitInfo.color}`}>
                      {fitInfo.label}
                    </span>
                  </div>
                  <span className={`text-3xl font-bold ${fitInfo.color}`}>
                    {fitScore}%
                  </span>
                </div>
                <Progress value={fitScore} className="h-3" />
              </CardContent>
            </Card>

            {/* Color Match */}
            {analysis?.colorMatch && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 via-red-400 to-blue-400" />
                    Color Match
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <Badge className={`capitalize bg-${analysis.colorMatch.actual}-100 text-${analysis.colorMatch.actual}-800`}>
                        {analysis.colorMatch.actual}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Candidate</p>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="text-center">
                      <Badge variant="outline" className="capitalize">
                        {analysis.colorMatch.ideal}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Ideal</p>
                    </div>
                    <div className="ml-auto text-lg font-semibold">
                      {analysis.colorMatch.matchPercentage}% match
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            {analysis?.summary && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Strengths */}
            {analysis?.strengths && analysis.strengths.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Concerns */}
            {analysis?.concerns && analysis.concerns.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Areas of Concern
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.concerns.map((concern, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                        {concern}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {analysis?.recommendations && analysis.recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Follow-up Chat */}
            <AIFollowUpChat
              contextType="candidate-fit"
              contextData={{ candidate }}
              initialContext={analysis?.summary || ''}
              onSendMessage={handleFollowUp}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}