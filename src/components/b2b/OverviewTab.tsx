import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Users, CheckCircle, Clock, ExternalLink, Globe, Sparkles } from 'lucide-react';

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

  const primaryColor = company.primary_color || '#9b87f5';
  const secondaryColor = company.secondary_color || '#7E69AB';

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
      gradient: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: CheckCircle,
      gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
    },
    {
      title: 'Completed',
      value: stats.completedAssessments,
      icon: Sparkles,
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    },
    {
      title: 'Pending Invites',
      value: stats.pendingInvites,
      icon: Clock,
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    },
  ];

  const companyPortalUrl = `/company/${company.subdomain}`;

  return (
    <div className="space-y-8">
      {/* Welcome Hero Section */}
      <div 
        className="rounded-2xl p-8 text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}10 100%)`,
          border: `1px solid ${primaryColor}20`,
        }}
      >
        {/* Decorative elements */}
        <div 
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30"
          style={{ background: primaryColor }}
        />
        <div 
          className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl opacity-20"
          style={{ background: secondaryColor }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Globe className="h-5 w-5" style={{ color: primaryColor }} />
            <span 
              className="text-lg font-semibold"
              style={{ color: primaryColor }}
            >
              {company.subdomain}.rolecolorfinder.com
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Manage your team's assessments, track progress, and unlock insights about your organization's leadership potential.
          </p>
          <Button 
            className="mt-6 gap-2"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            }}
            onClick={() => window.open(companyPortalUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            View Company Portal
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div 
                className="h-9 w-9 rounded-lg flex items-center justify-center"
                style={{ background: stat.gradient }}
              >
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Company Info Card */}
      <Card 
        className="overflow-hidden"
        style={{ borderColor: `${primaryColor}20` }}
      >
        <CardHeader 
          className="border-b"
          style={{ 
            borderColor: `${primaryColor}15`,
            background: `${primaryColor}05`,
          }}
        >
          <CardTitle className="flex items-center gap-2">
            <div 
              className="h-2 w-2 rounded-full"
              style={{ background: primaryColor }}
            />
            Company Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Assessment Type</span>
                <span 
                  className="font-semibold px-3 py-1 rounded-full text-sm"
                  style={{ 
                    background: `${primaryColor}15`,
                    color: primaryColor,
                  }}
                >
                  {company.assessment_type === '25q' ? '25 Questions' : '50 Questions'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Subdomain</span>
                <span className="font-mono text-sm font-medium">
                  {company.subdomain}.rolecolorfinder.com
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Google SSO</span>
                <span 
                  className={`font-semibold px-3 py-1 rounded-full text-sm ${
                    company.google_sso_enabled 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {company.google_sso_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Custom Domain</span>
                <span 
                  className={`font-semibold px-3 py-1 rounded-full text-sm ${
                    company.custom_domain 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {company.custom_domain || 'Not configured'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
