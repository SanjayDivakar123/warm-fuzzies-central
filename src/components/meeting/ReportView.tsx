import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Quote } from 'lucide-react';
import { useMeetingReport } from '@/hooks/useMeetingReport';
import { useCompany } from '@/contexts/CompanyContext';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface ReportViewProps {
  meetingId: string;
}

const ROLECOLOR_STYLES = {
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
};

export default function ReportView({ meetingId }: ReportViewProps) {
  const { report, speakers, loading } = useMeetingReport(meetingId);
  const { company } = useCompany();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Report not found</p>
        </CardContent>
      </Card>
    );
  }

  const handleExportPDF = async () => {
    try {
      // Create PDF export - placeholder for now
      const element = document.getElementById('report-content');
      if (!element) return;

      const canvas = await import('html2canvas').then(m => m.default(element));
      const pdf = await import('jspdf').then(m => new m.jsPDF());
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save(`meeting-report-${meetingId}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  const getRolecolorLabel = (color: string) => {
    const labels: Record<string, string> = {
      red: 'Directive',
      yellow: 'Action-Oriented',
      green: 'Process-Focused',
      blue: 'Strategic',
    };
    return labels[color] || color;
  };

  return (
    <div id="report-content" className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Meeting Report</h2>
        <p className="text-sm text-muted-foreground">
          Generated {format(new Date(report.generated_at), 'PPpp')}
        </p>
      </div>

      {/* Summary */}
      {report.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/90">
              {report.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-semibold">ALIGNMENT SCORE</p>
              <p className="text-3xl font-bold">{report.alignment_score || 0}%</p>
              <p className="text-xs text-muted-foreground">Team decision alignment</p>
            </div>
          </CardContent>
        </Card>

        {report.participant_dynamics && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-semibold">DOMINANT VOICE</p>
                  <Badge className="bg-red-100 text-red-800">
                    {getRolecolorLabel(report.participant_dynamics.dominantColor || 'red')}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Most common behavior</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-semibold">SECONDARY VOICE</p>
                  <Badge className="bg-blue-100 text-blue-800">
                    {getRolecolorLabel(report.participant_dynamics.secondaryColor || 'blue')}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Second common behavior</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Talk Time */}
      {speakers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Participant Talk Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {speakers
              .filter(s => s.talk_time_pct !== null && s.talk_time_pct > 0)
              .sort((a, b) => (b.talk_time_pct || 0) - (a.talk_time_pct || 0))
              .map(speaker => {
                const pct = speaker.talk_time_pct || 0;
                const color = speaker.dominant_rolecolor || 'gray';
                const styles = ROLECOLOR_STYLES[color as keyof typeof ROLECOLOR_STYLES];

                return (
                  <div key={speaker.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{speaker.detected_name}</p>
                        {speaker.dominant_rolecolor && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {getRolecolorLabel(speaker.dominant_rolecolor)}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm font-semibold">{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          color === 'red'
                            ? 'bg-red-500'
                            : color === 'yellow'
                            ? 'bg-yellow-500'
                            : color === 'green'
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      {/* Key Moments */}
      {report.key_moments && Array.isArray(report.key_moments) && report.key_moments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Moments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.key_moments.map((moment: any, idx: number) => {
              const color = moment.rolecolor || 'gray';
              const styles = ROLECOLOR_STYLES[color as keyof typeof ROLECOLOR_STYLES];

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${styles.border} ${styles.bg}`}
                >
                  <div className="flex items-start gap-3">
                    <Quote className={`h-4 w-4 flex-shrink-0 mt-1 ${styles.text}`} />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{moment.speaker}</p>
                        <Badge className={styles.badge}>
                          {getRolecolorLabel(color)}
                        </Badge>
                      </div>
                      <p className="text-sm italic">&quot;{moment.text}&quot;</p>
                      {moment.timestampMs && (
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(moment.timestampMs / 1000)}s
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {report.action_items && Array.isArray(report.action_items) && report.action_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {report.action_items.map((item: any, idx: number) => (
                <li key={idx} className="flex gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 flex-shrink-0"
                    disabled
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.task}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.owner && <span className="text-xs text-muted-foreground">Owner: {item.owner}</span>}
                      {item.rolecolor && (
                        <Badge variant="outline" className="text-xs">
                          {getRolecolorLabel(item.rolecolor)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {report.recommendations && Array.isArray(report.recommendations) && report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Coaching Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-sm text-blue-900">{rec.speaker}</p>
                <p className="text-sm text-blue-800 mt-1">{rec.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      <Button onClick={handleExportPDF} className="w-full" size="lg">
        <Download className="h-4 w-4 mr-2" />
        Export as PDF
      </Button>
    </div>
  );
}
