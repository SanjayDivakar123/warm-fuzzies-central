import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCandidatePortal } from '@/contexts/CandidatePortalContext';
import { Loader2, Building2, CheckCircle2, Award, Lightbulb, AlertTriangle, Target } from 'lucide-react';
import rcfLogo from '@/assets/rolecolor-ai-logo.svg';

const colorConfig = {
  yellow: {
    name: 'Yellow',
    title: 'The Executor',
    description: 'Action-oriented, results-driven, and focused on getting things done efficiently.',
    strengths: ['Decisive action', 'Goal-oriented', 'Pragmatic approach', 'Results-focused'],
    situations: 'You take charge in high-pressure situations and drive projects to completion with efficiency.',
    watch: 'Take time to consider others\' input before making decisions.',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-400',
    textColor: 'text-yellow-700',
    accentColor: '#EAB308',
  },
  red: {
    name: 'Red',
    title: 'The Motivator',
    description: 'Enthusiastic, inspiring, and skilled at building relationships and motivating teams.',
    strengths: ['Team motivation', 'Relationship building', 'Enthusiasm', 'Communication'],
    situations: 'You energize teams and create positive environments that bring out the best in people.',
    watch: 'Balance enthusiasm with attention to details and follow-through.',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    textColor: 'text-red-700',
    accentColor: '#EF4444',
  },
  green: {
    name: 'Green',
    title: 'The Organizer',
    description: 'Systematic, reliable, and excellent at creating structure and maintaining stability.',
    strengths: ['Organization', 'Reliability', 'Process-oriented', 'Attention to detail'],
    situations: 'You bring order to chaos and ensure consistent, quality outcomes through careful planning.',
    watch: 'Stay open to change and be flexible when situations require adaptation.',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-400',
    textColor: 'text-green-700',
    accentColor: '#22C55E',
  },
  blue: {
    name: 'Blue',
    title: 'The Innovator',
    description: 'Creative, analytical, and driven by ideas and continuous improvement.',
    strengths: ['Innovation', 'Strategic thinking', 'Problem-solving', 'Vision'],
    situations: 'You see possibilities others miss and drive innovation through creative problem-solving.',
    watch: 'Balance big-picture thinking with practical implementation steps.',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-400',
    textColor: 'text-blue-700',
    accentColor: '#3B82F6',
  },
};

export default function CandidateResults() {
  const { company, candidate, assessmentResults, loading, fetchAssessmentResults } = useCandidatePortal();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && company && candidate && !assessmentResults) {
      fetchAssessmentResults();
    }
  }, [loading, company, candidate, assessmentResults, fetchAssessmentResults]);

  useEffect(() => {
    if (!loading && company && !candidate) {
      navigate(-1);
    }
  }, [loading, company, candidate, navigate]);

  if (loading || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!candidate || !assessmentResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your results...</p>
        </div>
      </div>
    );
  }

  const primaryColor = company.primary_color || '#9b87f5';
  const dominantColor = assessmentResults.dominantColor as keyof typeof colorConfig;
  const colorData = colorConfig[dominantColor] || colorConfig.blue;
  const scores = assessmentResults.scores;
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  const sortedColors = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([color, score]) => ({
      color: color as keyof typeof colorConfig,
      score,
      percentage: Math.round((score / totalScore) * 100),
    }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-4 px-4 border-b" style={{ borderColor: `${primaryColor}20` }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-8 w-auto" />
          ) : (
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
              <Building2 className="h-4 w-4 text-white" />
            </div>
          )}
          <span className="font-semibold">{company.name}</span>
        </div>
      </header>

      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Success Header */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Assessment Complete!</h1>
            <p className="text-muted-foreground">
              Thank you for completing your assessment. Here are your results.
            </p>
          </div>

          {/* Main Result Card */}
          <Card className={`${colorData.bgColor} ${colorData.borderColor} border-2`}>
            <CardHeader className="text-center pb-4">
              <Badge className={`w-fit mx-auto mb-2 ${colorData.textColor} bg-white/50`}>
                Your Leadership Style
              </Badge>
              <CardTitle className={`text-3xl ${colorData.textColor}`}>
                {colorData.name}: {colorData.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className={`text-lg ${colorData.textColor}`}>
                {colorData.description}
              </p>
            </CardContent>
          </Card>

          {/* Key Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" style={{ color: colorData.accentColor }} />
                Key Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {colorData.strengths.map((strength, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="px-3 py-1"
                    style={{ borderColor: colorData.accentColor, color: colorData.accentColor }}
                  >
                    {strength}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How You Approach Situations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" style={{ color: colorData.accentColor }} />
                How You Approach Situations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{colorData.situations}</p>
            </CardContent>
          </Card>

          {/* Color Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" style={{ color: colorData.accentColor }} />
                Your Color Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedColors.map(({ color, percentage }) => {
                const config = colorConfig[color];
                return (
                  <div key={color} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{config.name}</span>
                      <span className="text-muted-foreground">{percentage}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`, 
                          backgroundColor: config.accentColor 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Areas to Watch */}
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
                Areas to Watch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700">{colorData.watch}</p>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="font-semibold mb-2">What Happens Next?</h3>
              <p className="text-muted-foreground mb-4">
                Your results have been shared with {company.name}. They will review your profile 
                and reach out if there's a good fit for the position.
              </p>
              <p className="text-sm text-muted-foreground">
                Thank you for taking the time to complete this assessment!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 text-center">
        <a 
          href="https://rolecolorfinder.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity text-muted-foreground"
        >
          <span className="text-sm">Powered by</span>
          <img src={rcfLogo} alt="RoleColorFinder" className="h-6 w-auto" />
        </a>
      </footer>
    </div>
  );
}
