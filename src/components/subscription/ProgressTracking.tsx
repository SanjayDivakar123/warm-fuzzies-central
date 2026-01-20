import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ProgressEntry {
  id: string;
  assessment_type: string;
  attempt_number: number;
  results: any;
  dominant_color: string;
  scores: any;
  created_at: string;
}

const colorMap: Record<string, string> = {
  yellow: '#EAB308',
  red: '#DC2626',
  green: '#16A34A',
  blue: '#2563EB'
};

export function ProgressTracking() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_progress')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProgress(data || []);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return progress.map((entry, index) => {
      const scores = entry.scores || {};
      return {
        name: `Attempt ${index + 1}`,
        date: format(new Date(entry.created_at), 'MMM dd'),
        yellow: scores.yellow || 0,
        red: scores.red || 0,
        green: scores.green || 0,
        blue: scores.blue || 0
      };
    });
  }, [progress]);

  const latestTrend = useMemo(() => {
    if (progress.length < 2) return null;
    
    const latest = progress[progress.length - 1];
    const previous = progress[progress.length - 2];
    
    if (!latest.scores || !previous.scores) return null;

    const latestDominant = latest.dominant_color;
    const latestScore = latest.scores[latestDominant] || 0;
    const previousScore = previous.scores[latestDominant] || 0;
    const diff = latestScore - previousScore;

    return {
      color: latestDominant,
      diff,
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable'
    };
  }, [progress]);

  if (loading) {
    return (
      <Card className="shadow-elegant">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading progress...
        </CardContent>
      </Card>
    );
  }

  if (progress.length === 0) {
    return (
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Progress Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Complete assessments to track your progress over time
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Progress Tracking
          </CardTitle>
          <Badge variant="outline">
            {progress.length} assessment{progress.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {latestTrend && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            {latestTrend.direction === 'up' ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : latestTrend.direction === 'down' ? (
              <TrendingDown className="w-5 h-5 text-red-500" />
            ) : (
              <Minus className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-sm">
              Your <span className="font-medium capitalize">{latestTrend.color}</span> score 
              {latestTrend.direction === 'up' && ' increased'}
              {latestTrend.direction === 'down' && ' decreased'}
              {latestTrend.direction === 'stable' && ' stayed the same'}
              {latestTrend.diff !== 0 && ` by ${Math.abs(latestTrend.diff)} points`}
            </span>
          </div>
        )}

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="yellow" stroke={colorMap.yellow} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="red" stroke={colorMap.red} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="green" stroke={colorMap.green} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="blue" stroke={colorMap.blue} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            First assessment: {format(new Date(progress[0].created_at), 'MMM dd, yyyy')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
