// @ts-nocheck
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Globe, 
  Sparkles, 
  KeyRound, 
  ClipboardCheck,
  Bell,
  Mail,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Download,
  Copy,
  Check,
  Brain
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportDashboardPdf } from '@/lib/dashboardPdfExport';
import RoleAnalysisCard from './RoleAnalysisCard';
import ActivityFeed from './ActivityFeed';

interface OverviewTabProps {
  company: any;
}

interface ReminderStats {
  total: number;
  pending: number;
  sent: number;
  cancelled: number;
}

interface TrendDataPoint {
  date: string;
  count: number;
}

interface TeamStats {
  totalUsers: number;
  activeUsers: number;
  completedAssessments: number;
  pendingInvites: number;
  seatsUsed: number;
  colorDistribution: {
    yellow: number;
    red: number;
    green: number;
    blue: number;
  };
}

export default function OverviewTab({ company }: OverviewTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<TeamStats>({
    totalUsers: 0,
    activeUsers: 0,
    completedAssessments: 0,
    pendingInvites: 0,
    seatsUsed: 0,
    colorDistribution: { yellow: 0, red: 0, green: 0, blue: 0 },
  });
  const [reminderStats, setReminderStats] = useState<ReminderStats>({
    total: 0,
    pending: 0,
    sent: 0,
    cancelled: 0,
  });
  const [adminUser, setAdminUser] = useState<any>(null);
  const [completionTrend, setCompletionTrend] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const primaryColor = company.primary_color || '#22c55e';
  const secondaryColor = company.secondary_color || '#16a34a';

  useEffect(() => {
    fetchAllStats();
  }, [company.id]);

  const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      // Fetch users and their assessment results
      const { data: users } = await supabase
        .from('company_users')
        .select('*, assessment_results:assessment_result_id(results)')
        .eq('company_id', company.id);

      // Fetch reminders
      const { data: reminders } = await supabase
        .from('scheduled_reminders')
        .select('status')
        .eq('company_id', company.id);

      if (users) {
        // Calculate color distribution from completed assessments
        const colorDistribution = { yellow: 0, red: 0, green: 0, blue: 0 };
        
        // Calculate completion trend by date
        const trendMap: Record<string, number> = {};
        
        users.forEach(u => {
          const results = u.assessment_results?.results as { dominantColor?: string } | null;
          if (results?.dominantColor) {
            const color = results.dominantColor.toLowerCase();
            if (color in colorDistribution) {
              colorDistribution[color as keyof typeof colorDistribution]++;
            }
          }
          
          // Track completions by date
          if (u.assessment_completed_at) {
            const dateStr = new Date(u.assessment_completed_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            });
            trendMap[dateStr] = (trendMap[dateStr] || 0) + 1;
          }
        });

        // Convert trend map to sorted array (last 14 days max)
        const trendData = Object.entries(trendMap)
          .map(([date, count]) => ({ date, count }))
          .slice(-14);
        
        setCompletionTrend(trendData);

        setStats({
          totalUsers: users.length,
          activeUsers: users.filter(u => u.status === 'active').length,
          completedAssessments: users.filter(u => u.assessment_completed_at).length,
          pendingInvites: users.filter(u => u.status === 'invited').length,
          seatsUsed: users.filter(u => u.status !== 'revoked').length,
          colorDistribution,
        });

        // Find admin user
        if (user) {
          const currentAdmin = users.find(u => u.user_id === user.id && u.role === 'admin');
          if (currentAdmin && !currentAdmin.invite_code) {
            const newCode = generateInviteCode();
            const { error } = await supabase
              .from('company_users')
              .update({ invite_code: newCode })
              .eq('id', currentAdmin.id);
            if (!error) {
              currentAdmin.invite_code = newCode;
            }
          }
          setAdminUser(currentAdmin);
        }
      }

      if (reminders) {
        setReminderStats({
          total: reminders.length,
          pending: reminders.filter(r => r.status === 'pending').length,
          sent: reminders.filter(r => r.status === 'sent').length,
          cancelled: reminders.filter(r => r.status === 'cancelled').length,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (adminUser?.invite_code) {
      navigator.clipboard.writeText(adminUser.invite_code);
      toast({
        title: "Copied!",
        description: "Your invite code has been copied to clipboard.",
      });
    }
  };

  const completionRate = stats.totalUsers > 0 ? Math.round((stats.completedAssessments / stats.totalUsers) * 100) : 0;
  const companyPortalUrl = `/company/${company.subdomain}`;

  const handleExportPdf = () => {
    exportDashboardPdf({
      companyName: company.name,
      seatsUsed: stats.seatsUsed,
      seatsPurchased: 0,
      totalUsers: stats.totalUsers,
      completedAssessments: stats.completedAssessments,
      pendingInvites: stats.pendingInvites,
      completionRate,
      colorDistribution: stats.colorDistribution,
      reminderStats: {
        total: reminderStats.total,
        pending: reminderStats.pending,
        sent: reminderStats.sent,
      },
      exportDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      completionTrend,
    });
    toast({
      title: "Report exported",
      description: "Your dashboard report has been downloaded as PDF.",
    });
  };

  const colorLabels = {
    yellow: { label: 'Executor', color: 'bg-yellow-500' },
    red: { label: 'Motivator', color: 'bg-red-500' },
    green: { label: 'Organizer', color: 'bg-green-500' },
    blue: { label: 'Innovator', color: 'bg-blue-500' },
  };

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportPdf} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-tour="overview-stats">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Users className="h-4 w-4" style={{ color: primaryColor }} />
              </div>
              <div>
                <p className="text-xl font-semibold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${secondaryColor}15` }}
              >
                <CheckCircle className="h-4 w-4" style={{ color: secondaryColor }} />
              </div>
              <div>
                <p className="text-xl font-semibold">{stats.completedAssessments}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xl font-semibold">{stats.pendingInvites}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-semibold">{reminderStats.pending}</p>
                <p className="text-xs text-muted-foreground">Reminders Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Assessment Progress Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Assessment Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${completionRate}%`, 
                    background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` 
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-semibold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div 
                className="text-center p-2 rounded-lg"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <p className="text-lg font-semibold" style={{ color: primaryColor }}>{stats.completedAssessments}</p>
                <p className="text-xs text-muted-foreground">Done</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-yellow-500/10">
                <p className="text-lg font-semibold text-yellow-600">{stats.totalUsers - stats.completedAssessments}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reminder Stats Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              Reminder Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div 
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ backgroundColor: `${secondaryColor}15` }}
              >
                <Mail className="h-4 w-4" style={{ color: secondaryColor }} />
                <div>
                  <p className="font-semibold">{reminderStats.sent}</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="font-semibold">{reminderStats.pending}</p>
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Total reminders</span>
              <span className="font-medium">{reminderStats.total}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed & Color Distribution */}
      <div className="space-y-4">
        {/* Color Distribution */}
        {stats.completedAssessments > 0 && (
          <Card className="border-0 shadow-sm w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                Team Color Distribution
              </CardTitle>
              <CardDescription className="text-sm">
                Leadership style breakdown across {stats.completedAssessments} completed assessments
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[140px] md:min-h-[160px]">
              <div className="grid grid-cols-4 gap-3 mt-3">
                {Object.entries(stats.colorDistribution).map(([color, count]) => {
                  const info = colorLabels[color as keyof typeof colorLabels];
                  return (
                    <div key={color} className="text-center p-3 rounded-lg bg-muted/30">
                      <div className={`w-8 h-8 mx-auto rounded-full mb-2 ${info.color}`} />
                      <p className="text-lg font-semibold">{count}</p>
                      <p className="text-xs text-muted-foreground">{info.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Feed */}
        <ActivityFeed companyId={company.id} maxItems={8} />
      </div>

      {/* Admin Assessment Card */}
      {adminUser && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                  Your Assessment
                </CardTitle>
                <CardDescription className="text-sm">
                  As an admin, you can also take the assessment
                </CardDescription>
              </div>
              {adminUser.assessment_completed_at ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge variant="outline" className="border-yellow-500/30 text-yellow-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {adminUser.assessment_completed_at ? (
              <p className="text-sm text-muted-foreground">
                You completed your assessment on {new Date(adminUser.assessment_completed_at).toLocaleDateString()}.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    Use your invite code to log in through the employee portal.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      <code className="bg-muted px-3 py-1.5 rounded-lg font-mono font-semibold tracking-wider">
                        {adminUser.invite_code || 'N/A'}
                      </code>
                    </div>
                    {adminUser.invite_code && (
                      <Button variant="outline" size="sm" onClick={copyInviteCode}>
                        Copy
                      </Button>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={() => window.open(`/company/${company.subdomain}/login`, '_blank')}
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  className="hover:opacity-90 text-white"
                >
                  Take Assessment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Role Analysis Tool */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            AI Role Analysis
          </CardTitle>
          <CardDescription className="text-sm">
            Enter a job role to see if they should take the RoleColor assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoleAnalysisCard 
            mode="standalone" 
            showCategorySelect={false}
          />
        </CardContent>
      </Card>

      {/* Company Portal Link */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="pt-4 pb-4 space-y-4">
          {/* Path-based URL (always shown) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">rolecolorfinder.com/company/{company.subdomain}</p>
                <p className="text-xs text-muted-foreground">Path-based portal URL</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`https://rolecolorfinder.com/company/${company.subdomain}/login`);
                  toast({
                    title: "URL copied",
                    description: "Portal URL copied to clipboard",
                  });
                }}
                className="gap-2"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.open(companyPortalUrl, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
