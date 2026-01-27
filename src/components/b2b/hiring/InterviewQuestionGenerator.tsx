import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Copy, Check, MessageSquare, Target } from 'lucide-react';

interface InterviewQuestion {
  question: string;
  purpose: string;
  idealResponse: string;
  colorAlignment: string;
}

interface InterviewQuestionGeneratorProps {
  companyId: string;
}

const COLOR_OPTIONS = [
  { value: 'yellow', label: 'Yellow (Executor)', description: 'Action-oriented, results-driven' },
  { value: 'red', label: 'Red (Motivator)', description: 'Inspiring, persuasive, energetic' },
  { value: 'green', label: 'Green (Organizer)', description: 'Methodical, detail-oriented' },
  { value: 'blue', label: 'Blue (Innovator)', description: 'Creative, strategic, analytical' },
];

export default function InterviewQuestionGenerator({ companyId }: InterviewQuestionGeneratorProps) {
  const [positionTitle, setPositionTitle] = useState('');
  const [idealColor, setIdealColor] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!positionTitle || !idealColor) {
      toast({
        title: 'Missing information',
        description: 'Please enter a position title and select an ideal RoleColor.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-interview-questions', {
        body: {
          positionTitle,
          idealColor,
          additionalContext,
        },
      });

      if (error) throw error;

      if (data?.questions) {
        setQuestions(data.questions);
        toast({
          title: 'Questions generated!',
          description: `Created ${data.questions.length} behavioral interview questions.`,
        });
      }
    } catch (error: any) {
      console.error('Error generating questions:', error);
      toast({
        title: 'Generation failed',
        description: error.message || 'Failed to generate interview questions.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (index: number, question: string) => {
    await navigator.clipboard.writeText(question);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: 'Copied!',
      description: 'Question copied to clipboard.',
    });
  };

  const handleCopyAll = async () => {
    const allQuestions = questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n\n');
    await navigator.clipboard.writeText(allQuestions);
    toast({
      title: 'All questions copied!',
      description: 'All questions have been copied to clipboard.',
    });
  };

  const getColorBadge = (color: string) => {
    const colorMap: Record<string, string> = {
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return colorMap[color.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Interview Question Generator
          </CardTitle>
          <CardDescription>
            Generate behavioral interview questions tailored to your ideal RoleColor profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position Title</Label>
              <Input
                id="position"
                placeholder="e.g., Product Manager, Software Engineer"
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Ideal RoleColor Profile</Label>
              <Select value={idealColor} onValueChange={setIdealColor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ideal color..." />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (optional)</Label>
            <Textarea
              id="context"
              placeholder="Any specific skills, team dynamics, or challenges to consider..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={2}
            />
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Questions...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Interview Questions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Questions */}
      {questions.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Generated Questions
                </CardTitle>
                <CardDescription>
                  {questions.length} behavioral questions for {positionTitle}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyAll}>
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((q, index) => (
              <div key={index} className="p-4 rounded-lg border bg-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Q{index + 1}</span>
                      <Badge className={getColorBadge(q.colorAlignment)} variant="secondary">
                        {q.colorAlignment}
                      </Badge>
                    </div>
                    <p className="font-medium">{q.question}</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Purpose:</strong> {q.purpose}</p>
                      <p><strong>Look for:</strong> {q.idealResponse}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(index, q.question)}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
