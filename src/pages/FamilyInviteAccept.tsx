import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Heart, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/navigation/Navbar";

export default function FamilyInviteAccept() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAndAcceptInvite = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        // Check if user has a pending family invite
        const { data: invite, error: inviteError } = await supabase
          .from('family_plan_members')
          .select('*')
          .eq('member_email', user.email.toLowerCase())
          .eq('status', 'pending')
          .single();

        if (inviteError || !invite) {
          setError("No pending family plan invitation found for your email.");
          setLoading(false);
          return;
        }

        // Accept the invite by updating status
        const { error: updateError } = await supabase
          .from('family_plan_members')
          .update({
            status: 'active',
            member_user_id: user.id,
            joined_at: new Date().toISOString()
          })
          .eq('id', invite.id);

        if (updateError) {
          throw updateError;
        }

        setSuccess(true);
        toast({
          title: "Welcome to the Family Plan!",
          description: "You now have access to all family plan benefits.",
        });

        // Redirect to dashboard after a moment
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);

      } catch (err: any) {
        console.error('Error accepting invite:', err);
        setError(err.message || "Failed to accept invitation.");
      } finally {
        setLoading(false);
      }
    };

    checkAndAcceptInvite();
  }, [user, navigate, toast]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Family Plan Invitation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Please sign in or create an account to accept your family plan invitation.
              </p>
              <Button onClick={() => navigate('/auth')} className="w-full">
                Sign In / Sign Up
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Family Plan Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-muted-foreground">Processing your invitation...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-6 h-6 text-destructive" />
                </div>
                <p className="text-destructive font-medium">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </div>
            )}

            {success && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Welcome to the Family!</h3>
                <p className="text-muted-foreground mb-4">
                  You now have access to all family plan benefits including unlimited retakes and progress tracking.
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to dashboard...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
