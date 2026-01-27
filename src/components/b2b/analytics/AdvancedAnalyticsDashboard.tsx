import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Calendar,
  Download,
  RefreshCw,
  Crown,
  AlertTriangle
} from 'lucide-react';

interface AdvancedAnalyticsDashboardProps {
  companyId: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface AnalyticsData {
  colorDistribution: { name: string; value: number; color: string }[];
  completionTrend: { date: string; count: number }[];
  leadershipPotential: { category: string; count: number }[];
  departmentBreakdown: { department: string; yellow: number; red: number; green: number; blue: number }[];
  weeklyActivity: { week: string; invites: number; completions: number }[];
}

const COLOR_MAP: Record<string, string> = {
  yellow: '#EAB308',
  red: '#EF4444',
  green: '#22C55E',
  blue: '#3B82F6',
};

const COLOR_LABELS: Record<string, string> = {
  yellow: 'Executor',
  red: 'Motivator',
  green: 'Organizer',
  blue: 'Innovator',
};

export default function AdvancedAnalyticsDashboard({ 
  companyId, 
  primaryColor = '#22c55e',
  secondaryColor = '#16a34a' 
}: AdvancedAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [data, setData] = useState<AnalyticsData>({
    colorDistribution: [],
    completionTrend: [],
    leadershipPotential: [],
    departmentBreakdown: [],
    weeklyActivity: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [companyId, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch users with their assessment results
      const { data: users } = await supabase
        .from('company_users')
        .select('*, assessment_results:assessment_result_id(results)')
        .eq('company_id', companyId);

      if (!users) {
        setLoading(false);
        return;
      }

      // Calculate color distribution
      const colorCounts: Record<string, number> = { yellow: 0, red: 0, green: 0, blue: 0 };
      const leadershipCounts = { high: 0, moderate: 0, limited: 0 };
      const departmentData: Record<string, Record<string, number>> = {};

      users.forEach(user => {
        const results = user.assessment_results?.results as any;
        if (results?.dominantColor) {
          const dominantColor = results.dominantColor.toLowerCase();
          colorCounts[dominantColor] = (colorCounts[dominantColor] || 0) + 1;

          // Calculate leadership potential based on Red/Yellow as primary or secondary
          const scores = results.scores || {};
          const sortedColors = Object.entries(scores)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([color]) => color);
          
          const topTwo = sortedColors.slice(0, 2);
          if (topTwo.includes('red') || topTwo.includes('yellow')) {
            if (topTwo[0] === 'red' || topTwo[0] === 'yellow') {
              leadershipCounts.high++;
            } else {
              leadershipCounts.moderate++;
            }
          } else {
            leadershipCounts.limited++;
          }

          // Department breakdown
          const dept = user.job_role || 'Unassigned';
          if (!departmentData[dept]) {
            departmentData[dept] = { yellow: 0, red: 0, green: 0, blue: 0 };
          }
          departmentData[dept][dominantColor]++;
        }
      });

      // Build completion trend
      const trendMap: Record<string, number> = {};
      const now = new Date();
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        trendMap[dateStr] = 0;
      }

      users.forEach(user => {
        if (user.assessment_completed_at) {
          const completedDate = new Date(user.assessment_completed_at);
          const diffDays = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < daysBack) {
            const dateStr = completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (trendMap[dateStr] !== undefined) {
              trendMap[dateStr]++;
            }
          }
        }
      });

      setData({
        colorDistribution: Object.entries(colorCounts).map(([name, value]) => ({
          name: COLOR_LABELS[name],
          value,
          color: COLOR_MAP[name],
        })),
        completionTrend: Object.entries(trendMap).map(([date, count]) => ({ date, count })),
        leadershipPotential: [
          { category: 'High Potential', count: leadershipCounts.high },
          { category: 'Moderate', count: leadershipCounts.moderate },
          { category: 'Limited', count: leadershipCounts.limited },
        ],
        departmentBreakdown: Object.entries(departmentData).slice(0, 8).map(([department, colors]) => ({
          department,
          yellow: colors.yellow || 0,
          red: colors.red || 0,
          green: colors.green || 0,
          blue: colors.blue || 0,
        })),
        weeklyActivity: [], // Would need more data to populate
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalAssessments = data.colorDistribution.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Advanced Analytics</h2>
          <p className="text-sm text-muted-foreground">Deep insights into team composition and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAssessments}</p>
                <p className="text-xs text-muted-foreground">Total Profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Crown className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.leadershipPotential.find(l => l.category === 'High Potential')?.count || 0}</p>
                <p className="text-xs text-muted-foreground">High Leadership</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {data.completionTrend.slice(-7).reduce((sum, d) => sum + d.count, 0)}
                </p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.departmentBreakdown.length}</p>
                <p className="text-xs text-muted-foreground">Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Completion Trend */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Completion Trend</CardTitle>
            <CardDescription>Assessment completions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.completionTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke={primaryColor}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Color Distribution Pie */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Color Distribution</CardTitle>
            <CardDescription>Team RoleColor breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.colorDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.colorDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Leadership Potential */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Leadership Potential
            </CardTitle>
            <CardDescription>Based on Red/Yellow as primary or secondary color</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.leadershipPotential} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    dataKey="category" 
                    type="category" 
                    tick={{ fontSize: 12 }} 
                    width={100}
                  />
                  <Tooltip />
                  <Bar 
                    dataKey="count" 
                    fill={primaryColor}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Breakdown */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Department Breakdown</CardTitle>
            <CardDescription>Color distribution by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.departmentBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="department" 
                    tick={{ fontSize: 10 }} 
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="yellow" stackId="a" fill={COLOR_MAP.yellow} name="Executor" />
                  <Bar dataKey="red" stackId="a" fill={COLOR_MAP.red} name="Motivator" />
                  <Bar dataKey="green" stackId="a" fill={COLOR_MAP.green} name="Organizer" />
                  <Bar dataKey="blue" stackId="a" fill={COLOR_MAP.blue} name="Innovator" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
