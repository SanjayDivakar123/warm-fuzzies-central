import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { getCategoryDisplayName, type AssessmentCategory, type AssessmentType } from '@/lib/assessmentQuestionLoader';

interface EmployeeResultsModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
  results: {
    scores: {
      yellow: number;
      red: number;
      green: number;
      blue: number;
    };
dominantColor?: string;
dominant_color?: string;  } | null;
  completedAt: string;
  assessmentType?: AssessmentType;
  assessmentCategory?: AssessmentCategory;
}

const colorDescriptions: Record<string, {
  title: string;
  subtitle: string;
  description: string;
  workDescription: string;
  strengths: string[];
  situations: string[];
  weaknesses: { title: string; description: string; solution: string }[];
  color: string;
}> = {
  yellow: {
    title: 'The Executor',
    subtitle: 'Action-Oriented Leader',
    description: 'You are a natural doer who thrives on taking action and getting things done. Your practical approach and focus on results make you an invaluable team member who turns ideas into reality.',
    workDescription: 'You approach work with a results-first mindset. You prefer to dive in and start making progress rather than spending too much time planning. Your colleagues appreciate your ability to cut through complexity and focus on what matters most.',
    strengths: ['Results-driven execution', 'Practical problem-solving', 'Quick decision-making', 'Consistent follow-through'],
    situations: [
      'You take charge when deadlines are tight',
      'You focus on practical solutions over theoretical discussions',
      'You measure success by tangible outcomes',
      'You prefer clear action items and next steps'
    ],
    weaknesses: [
      { title: 'May rush decisions', description: 'Sometimes moves too quickly without considering all options', solution: 'Take a moment to list at least 2-3 alternatives before deciding on major issues.' },
      { title: 'Can overlook details', description: 'Focus on speed may cause important details to be missed', solution: 'Create a simple checklist for critical tasks to ensure nothing is overlooked.' },
      { title: 'Impatience with process', description: 'May become frustrated with lengthy discussions or planning', solution: 'Set personal timeboxes for planning phases to stay engaged while ensuring thoroughness.' }
    ],
    color: '#EAB308'
  },
  red: {
    title: 'The Motivator',
    subtitle: 'Inspirational Leader',
    description: 'You are a natural motivator who energizes and inspires those around you. Your enthusiasm and passion are contagious, making you the driving force that keeps teams engaged and motivated.',
    workDescription: 'You bring energy and enthusiasm to every project. Your ability to see possibilities and rally others around a vision makes you a natural leader. People are drawn to your optimism and genuine care for their success.',
    strengths: ['Inspiring communication', 'Building team morale', 'Creating enthusiasm', 'Connecting with people'],
    situations: [
      'You rally the team during challenging times',
      'You celebrate wins and recognize contributions',
      'You communicate vision in compelling ways',
      'You build strong relationships across teams'
    ],
    weaknesses: [
      { title: 'May overpromise', description: 'Enthusiasm can lead to commitments that are hard to keep', solution: 'Before committing, pause and check your current workload and realistic timelines.' },
      { title: 'Can avoid conflict', description: 'Desire to maintain harmony may delay addressing issues', solution: 'Address small issues early with a positive framing to prevent them from growing.' },
      { title: 'Difficulty with criticism', description: 'May take negative feedback personally', solution: 'Reframe feedback as opportunities for growth and ask clarifying questions.' }
    ],
    color: '#DC2626'
  },
  green: {
    title: 'The Organizer',
    subtitle: 'Strategic Planner',
    description: 'You are a natural organizer who brings structure and clarity to complex situations. Your methodical approach ensures that projects are well-planned and executed with precision.',
    workDescription: 'You excel at creating order from chaos. Your colleagues rely on you to think through the details, anticipate challenges, and create reliable systems. Your careful planning helps teams avoid pitfalls and stay on track.',
    strengths: ['Strategic planning', 'Process optimization', 'Risk management', 'Attention to detail'],
    situations: [
      'You create detailed project plans and timelines',
      'You identify potential risks before they become problems',
      'You establish efficient processes and workflows',
      'You ensure quality through systematic reviews'
    ],
    weaknesses: [
      { title: 'Analysis paralysis', description: 'May spend too much time planning instead of acting', solution: 'Set decision deadlines and accept that some uncertainty is normal.' },
      { title: 'Resistance to change', description: 'Comfort with established processes may slow adaptation', solution: 'Schedule regular reviews of processes to identify improvement opportunities.' },
      { title: 'Perfectionism', description: 'High standards may delay completion or cause stress', solution: 'Define "good enough" criteria upfront for non-critical deliverables.' }
    ],
    color: '#16A34A'
  },
  blue: {
    title: 'The Innovator',
    subtitle: 'Creative Visionary',
    description: 'You are a natural innovator who sees possibilities where others see limitations. Your creative thinking and willingness to challenge the status quo drive breakthrough solutions.',
    workDescription: 'You thrive when exploring new ideas and finding creative solutions. Your colleagues value your fresh perspectives and ability to think outside the box. You are often the one who proposes innovative approaches that others hadn\'t considered.',
    strengths: ['Creative problem-solving', 'Visionary thinking', 'Challenging assumptions', 'Driving innovation'],
    situations: [
      'You brainstorm creative solutions to complex problems',
      'You question established ways of doing things',
      'You connect ideas from different domains',
      'You envision future possibilities and opportunities'
    ],
    weaknesses: [
      { title: 'May lack follow-through', description: 'Excitement for new ideas can overshadow completing current ones', solution: 'Use a "one in, one out" rule—finish a project before starting a new initiative.' },
      { title: 'Can seem impractical', description: 'Ideas may be perceived as unrealistic by more pragmatic colleagues', solution: 'Pair innovative ideas with a simple first step to demonstrate feasibility.' },
      { title: 'Easily bored', description: 'Routine tasks may feel draining and demotivating', solution: 'Build in small creative challenges or improvements even in routine work.' }
    ],
    color: '#2563EB'
  }
};

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export default function EmployeeResultsModal({ 
  open, 
  onClose, 
  email, 
  results, 
  completedAt,
  assessmentType = '25q',
  assessmentCategory = 'professional'
}: EmployeeResultsModalProps) {
  if (!results) return null;

const dominantColor = (results.dominantColor || results.dominant_color || '').toLowerCase();  const dominantColorInfo = colorDescriptions[dominantColor];
  
  if (!dominantColorInfo) return null;

  // Calculate total and percentages
  const totalScore = Object.values(results.scores).reduce((a, b) => a + b, 0);
  
  const sortedScores = Object.entries(results.scores)
    .map(([color, score]) => ({
      color,
      score,
      percentage: totalScore > 0 ? Math.round((score / totalScore) * 100) : 0,
      info: colorDescriptions[color]
    }))
    .sort((a, b) => {
      if (a.color === dominantColor) return -1;
      if (b.color === dominantColor) return 1;
      return b.score - a.score;
    });

  const colorBgClasses: Record<string, string> = {
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500'
  };

  const categoryName = getCategoryDisplayName(assessmentCategory);
  const questionCount = assessmentType === '50q' ? '50' : '25';
  const tintStrong = hexToRgba(dominantColorInfo.color, 0.08);
  const tintSoft = hexToRgba(dominantColorInfo.color, 0.04);
  const tintBorder = hexToRgba(dominantColorInfo.color, 0.14);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      {open && (
        <style>{`html, body { overflow: hidden !important; }`}</style>
      )}
      <DialogContent
        className="flex max-h-[calc(100vh-2rem)] w-[min(56rem,calc(100vw-2rem))] flex-col overflow-hidden border p-0 sm:max-h-[90vh] sm:max-w-4xl"
        style={{
          borderColor: tintBorder,
          backgroundImage: `
            radial-gradient(circle at top left, ${tintStrong} 0, transparent 28%),
            radial-gradient(circle at bottom right, ${tintStrong} 0, transparent 28%)
          `,
          backgroundColor: 'hsl(var(--background))',
        }}
      >
        <DialogHeader
          className="shrink-0 border-b p-6 pb-4"
          style={{
            borderColor: tintBorder,
            background: `linear-gradient(180deg, ${tintSoft}, transparent 75%)`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="secondary"
              className="text-xs font-normal"
              style={{
                backgroundColor: tintSoft,
                borderColor: tintBorder,
                color: 'inherit',
              }}
            >
              {categoryName} Assessment • {questionCount}Q
            </Badge>
          </div>
          <DialogTitle className="text-xl">
            Assessment Results for {email}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Completed on {new Date(completedAt).toLocaleString()}
          </p>
        </DialogHeader>
        
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 pt-4">
          <div className="space-y-6">
            {/* Leadership Style */}
            <Card 
              className="border-2"
              style={{
                borderColor: tintBorder,
                background: `linear-gradient(180deg, ${tintSoft}, transparent 55%)`,
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: dominantColorInfo.color }}
                  />
                  <div>
                    <CardTitle className="text-lg">{dominantColorInfo.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{dominantColorInfo.subtitle}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{dominantColorInfo.description}</p>
              </CardContent>
            </Card>

            {/* Key Strengths */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dominantColorInfo.strengths.map((strength, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="text-sm"
                    >
                      {strength}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* How They Work */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">How They Approach Work</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{dominantColorInfo.workDescription}</p>
                <ul className="space-y-2">
                  {dominantColorInfo.situations.map((situation, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span 
                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: dominantColorInfo.color }}
                      />
                      {situation}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Color Profile Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Color Profile Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sortedScores.map(({ color, score, percentage, info }) => (
                  <div key={color} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${colorBgClasses[color]}`}
                        />
                        <span className="font-medium capitalize">{info?.title || color}</span>
                        {color === dominantColor && (
                          <Badge variant="outline" className="text-xs">Primary</Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{percentage}% ({score} pts)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colorBgClasses[color]} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Areas to Watch */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Areas to Watch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dominantColorInfo.weaknesses.map((weakness, index) => (
                    <div key={index} className="space-y-2">
                      <div>
                        <h4 className="font-medium">{weakness.title}</h4>
                        <p className="text-sm text-muted-foreground">{weakness.description}</p>
                      </div>
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{weakness.solution}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
