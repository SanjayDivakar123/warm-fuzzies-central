import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity,
  UserPlus,
  ClipboardCheck,
  Briefcase,
  Mail,
  Sparkles,
  UserCheck,
  Settings,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_email: string | null;
  details: unknown;
  created_at: string;
}

interface ActivityFeedProps {
  companyId: string;
  maxItems?: number;
  onViewAll?: () => void;
}

// Map action+entity to user-friendly messages
function getActivityMessage(item: ActivityItem): { icon: React.ElementType; message: string; color: string } {
  const { action, entity_type, details } = item;
  const userName = item.user_email?.split('@')[0] || 'Someone';
  const detailsObj = (typeof details === 'object' && details !== null) ? details as Record<string, string> : null;
  
  // Assessment completed
  if (entity_type === 'assessment' && action === 'complete') {
    const name = detailsObj?.employee_name || detailsObj?.candidate_name || 'Someone';
    return {
      icon: ClipboardCheck,
      message: `${name} completed their assessment`,
      color: 'text-green-500'
    };
  }
  
  // User invited
  if (entity_type === 'user' && action === 'invite') {
    const email = detailsObj?.email || 'a new user';
    return {
      icon: Mail,
      message: `${userName} invited ${email}`,
      color: 'text-purple-500'
    };
  }
  
  // Candidate invited
  if (entity_type === 'candidate' && action === 'invite') {
    const candidateName = detailsObj?.name || detailsObj?.email || 'a candidate';
    return {
      icon: UserPlus,
      message: `${userName} invited ${candidateName}`,
      color: 'text-blue-500'
    };
  }
  
  // Candidate hired
  if (entity_type === 'candidate' && action === 'hire') {
    const candidateName = detailsObj?.name || 'A candidate';
    return {
      icon: UserCheck,
      message: `${candidateName} was hired`,
      color: 'text-emerald-500'
    };
  }
  
  // Task assigned
  if (entity_type === 'task' && (action === 'create' || action === 'assign')) {
    const taskTitle = detailsObj?.title || 'A task';
    const assignee = detailsObj?.assignee || 'someone';
    return {
      icon: Briefcase,
      message: `${taskTitle} assigned to ${assignee}`,
      color: 'text-orange-500'
    };
  }
  
  // Insights generated
  if (entity_type === 'insights' || action === 'generate_insights') {
    return {
      icon: Sparkles,
      message: `${userName} generated team insights`,
      color: 'text-yellow-500'
    };
  }
  
  // Settings updated
  if (entity_type === 'settings' || entity_type === 'company') {
    return {
      icon: Settings,
      message: `${userName} updated company settings`,
      color: 'text-gray-500'
    };
  }
  
  // Default
  return {
    icon: Activity,
    message: `${userName} ${action} ${entity_type}`,
    color: 'text-muted-foreground'
  };
}

export default function ActivityFeed({ companyId, maxItems = 10, onViewAll }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          setActivities(prev => [payload.new as ActivityItem, ...prev].slice(0, maxItems));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, maxItems]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(maxItems);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-xs">
              Latest actions in your workspace
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={fetchActivities}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[300px] pr-4">
          {loading && activities.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Loading activity...
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((item) => {
                const { icon: Icon, message, color } = getActivityMessage(item);
                const initials = (item.user_email?.charAt(0) || 'S').toUpperCase();
                
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
                        <p className="text-sm truncate">{message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        {onViewAll && activities.length > 0 && (
          <Button 
            variant="ghost" 
            className="w-full mt-3 text-xs h-8" 
            onClick={onViewAll}
          >
            View All Activity
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
