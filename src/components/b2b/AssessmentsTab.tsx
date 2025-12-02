import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AssessmentsTabProps {
  company: any;
}

export default function AssessmentsTab({ company }: AssessmentsTabProps) {
  const [assessmentType, setAssessmentType] = useState(company.assessment_type);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveAssessmentType = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ assessment_type: assessmentType })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: 'Assessment type updated',
        description: 'Your changes have been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating assessment type',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assessment Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Assessment Type</Label>
            <div className="flex items-center space-x-4">
              <Button
                variant={assessmentType === '25q' ? 'default' : 'outline'}
                onClick={() => setAssessmentType('25q')}
              >
                25 Questions (Student)
              </Button>
              <Button
                variant={assessmentType === '50q' ? 'default' : 'outline'}
                onClick={() => setAssessmentType('50q')}
              >
                50 Questions (Professional)
              </Button>
            </div>
          </div>

          <Button onClick={handleSaveAssessmentType} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Team-level assessment results and detailed reports will appear here once employees complete their assessments.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration Note</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            📝 Slack integration coming in the next sprint.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
