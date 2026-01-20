import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldPlus, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PromoteToAdminModalProps {
  open: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    full_name?: string;
  } | null;
  onPromoteComplete: () => void;
}

export default function PromoteToAdminModal({
  open,
  onClose,
  user,
  onPromoteComplete,
}: PromoteToAdminModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePromote = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("company_users")
        .update({ role: "admin" })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "User promoted to admin",
        description: `${user.full_name || user.email} is now an administrator`,
      });

      onPromoteComplete();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error promoting user",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldPlus className="h-5 w-5 text-primary" />
            Promote to Admin
          </DialogTitle>
          <DialogDescription>
            Promote this employee to an administrator role.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium">{user.full_name || "No name set"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Admins have full access to manage users, view all assessments, configure company settings, and manage billing. This action cannot be undone from the UI.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handlePromote} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldPlus className="h-4 w-4 mr-2" />}
            Promote to Admin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
