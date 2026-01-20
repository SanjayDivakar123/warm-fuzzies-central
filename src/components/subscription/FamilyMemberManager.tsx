import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Trash2, Loader2, Mail, Check, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface FamilyMember {
  id: string;
  member_email: string;
  member_user_id: string | null;
  status: string;
  joined_at: string | null;
}

export function FamilyMemberManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('family_plan_members')
        .select('*')
        .eq('owner_user_id', user?.id)
        .in('status', ['pending', 'active']);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-family-member', {
        body: { memberEmail: inviteEmail.trim() }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message
      });

      setInviteEmail("");
      fetchMembers();
    } catch (error: any) {
      console.error('Invite error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to invite member",
        variant: "destructive"
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('family_plan_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: "Family member has been removed"
      });

      fetchMembers();
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="shadow-elegant">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading family members...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Family Members
          </CardTitle>
          <Badge variant="outline">
            {members.length}/5 slots used
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invite Form */}
        {members.length < 5 && (
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <Button onClick={handleInvite} disabled={inviting}>
              {inviting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite
                </>
              )}
            </Button>
          </div>
        )}

        {/* Members List */}
        {members.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No family members yet. Invite up to 5 people to share your plan.
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{member.member_email}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {member.status === 'active' ? (
                        <>
                          <Check className="w-3 h-3 text-green-500" />
                          Active member
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          Invitation pending
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(member.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
