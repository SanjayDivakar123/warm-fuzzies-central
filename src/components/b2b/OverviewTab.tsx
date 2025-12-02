import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface OverviewTabProps {
  company: any;
}

export default function OverviewTab({ company }: OverviewTabProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    completedAssessments: 0,
    pendingInvites: 0,
    seatsUsed: 0,
  });

  useEffect(() => {
    fetchStats();
  }, [company.id]);

  const fetchStats = async () => {
    const { data: users } = await supabase
      .from('company_users')
      .select('*')
      .eq('company_id', company.id);

    if (users) {
      setStats({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        completedAssessments: users.filter(u => u.assessment_completed_at).length,
        pendingInvites: users.filter(u => u.status === 'invited').length,
        seatsUsed: users.filter(u => u.status !== 'revoked').length,
      });
    }
  };

  const statCards = [
    {
      title: 'Seats Used',
      value: `${stats.seatsUsed} / ${company.seats_purchased}`,
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      title: 'Completed Assessments',
      value: stats.completedAssessments,
      icon: CheckCircle,
      color: 'text-blue-500',
    },
    {
      title: 'Pending Invites',
      value: stats.pendingInvites,
      icon: Clock,
      color: 'text-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Assessment Type:</span>
            <span className="font-medium">{company.assessment_type === '25q' ? '25 Questions (Professional)' : '50 Questions (Professional)'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subdomain:</span>
            <span className="font-medium">{company.subdomain}.rolecolorfinder.com</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Google SSO:</span>
            <span className="font-medium">{company.google_sso_enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
