import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, ShieldMinus, Trash2, Ban, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ManageAdminModalProps {
  open: boolean;
  onClose: () => void;
  admin: {
    id: string;
    email: string;
    full_name?: string;
    status: string;
  } | null;
  onActionComplete: () => void;
}

type AdminAction = 'demote' | 'revoke' | 'delete';

export default function ManageAdminModal({
  open,
  onClose,
  admin,
  onActionComplete,
}: ManageAdminModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AdminAction | null>(null);
  const { toast } = useToast();

  const handleAction = async (action: AdminAction) => {
    if (!admin) return;

    setLoading(true);
    setSelectedAction(action);
    
    try {
      let successMessage = "";
      
      if (action === 'demote') {
        // Demote admin to employee
        const { error } = await supabase
          .from("company_users")
          .update({ role: "employee" })
          .eq("id", admin.id);
        
        if (error) throw error;
        successMessage = `${admin.full_name || admin.email} has been demoted to employee`;
      } else if (action === 'revoke') {
        // Revoke access (set status to revoked)
        const { error } = await supabase
          .from("company_users")
          .update({ status: "revoked", role: "employee" })
          .eq("id", admin.id);
        
        if (error) throw error;
        successMessage = `Access revoked for ${admin.full_name || admin.email}`;
      } else if (action === 'delete') {
        // First clear any task assignments
        await supabase
          .from("task_assignments")
          .update({ primary_assignee_id: null })
          .eq("primary_assignee_id", admin.id);
        
        await supabase
          .from("task_assignments")
          .update({ secondary_assignee_id: null })
          .eq("secondary_assignee_id", admin.id);
        
        // Delete the user record
        const { error } = await supabase
          .from("company_users")
          .delete()
          .eq("id", admin.id);
        
        if (error) throw error;
        successMessage = `${admin.full_name || admin.email} has been permanently deleted`;
      }

      toast({
        title: "Action completed",
        description: successMessage,
      });

      onActionComplete();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setSelectedAction(null);
    }
  };

  if (!admin) return null;

  const isRevoked = admin.status === 'revoked';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Manage Administrator
          </DialogTitle>
          <DialogDescription>
            Choose an action for this administrator.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium">{admin.full_name || "No name set"}</p>
            <p className="text-sm text-muted-foreground">{admin.email}</p>
            <p className="text-xs text-muted-foreground mt-1">Status: {admin.status}</p>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These actions will affect the admin's access to the company portal. Proceed with caution.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            {!isRevoked && (
              <>
                {/* Demote to Employee */}
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => handleAction('demote')}
                  disabled={loading}
                >
                  {loading && selectedAction === 'demote' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldMinus className="h-4 w-4 text-yellow-500" />
                  )}
                  <div className="text-left">
                    <p className="font-medium">Demote to Employee</p>
                    <p className="text-xs text-muted-foreground">
                      Remove admin privileges. User keeps access as an employee.
                    </p>
                  </div>
                </Button>

                {/* Revoke Access */}
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3 border-destructive/50 hover:bg-destructive/10"
                  onClick={() => handleAction('revoke')}
                  disabled={loading}
                >
                  {loading && selectedAction === 'revoke' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Ban className="h-4 w-4 text-destructive" />
                  )}
                  <div className="text-left">
                    <p className="font-medium text-destructive">Revoke Access</p>
                    <p className="text-xs text-muted-foreground">
                      Suspend access completely. User will be demoted and blocked.
                    </p>
                  </div>
                </Button>
              </>
            )}

            {/* Delete Permanently */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3 border-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleAction('delete')}
              disabled={loading}
            >
              {loading && selectedAction === 'delete' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <div className="text-left">
                <p className="font-medium">Delete Permanently</p>
                <p className="text-xs opacity-80">
                  Remove user and all their data from the company.
                </p>
              </div>
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
