import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldPlus, AlertTriangle, Shield, Users, Briefcase } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CompanyUserRole } from "@/contexts/CompanyContext";

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

type AdminRole = Exclude<CompanyUserRole, 'employee'>;

const ROLE_INFO: Record<AdminRole, { label: string; icon: typeof Shield; description: string }> = {
  admin: {
    label: 'Admin',
    icon: Shield,
    description: 'Full access to all features including settings and billing',
  },
  hr: {
    label: 'HR',
    icon: Users,
    description: 'Manage users, candidates, assessments, and reminders',
  },
  partner: {
    label: 'Partner',
    icon: Briefcase,
    description: 'View assessments and use the Work Matrix',
  },
};

export default function PromoteToAdminModal({
  open,
  onClose,
  user,
  onPromoteComplete,
}: PromoteToAdminModalProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRole>("admin");
  const { toast } = useToast();

  const handlePromote = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("promote-company-user", {
        body: {
          company_user_id: user.id,
          role: selectedRole,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const createdAuthInvite = Boolean(data?.createdAuthInvite);
      const emailSent = data?.emailSent !== false;

      toast({
        title: `User promoted to ${ROLE_INFO[selectedRole].label}`,
        description: !emailSent
          ? `${user.full_name || user.email} was promoted, but we could not send the notification email. Please retry or contact support.`
          : createdAuthInvite
            ? `${user.full_name || user.email} now has ${ROLE_INFO[selectedRole].label} access. We also sent an email with setup instructions to create a password and RCF account.`
            : `${user.full_name || user.email} now has ${ROLE_INFO[selectedRole].label} access and has been notified by email.`,
        variant: emailSent ? undefined : "destructive",
      });

      onPromoteComplete();
      setShowConfirmDialog(false);
      onClose();
    } catch (error: any) {
      toast({
        title: "Error promoting user",
        description: error?.message || "Unable to promote this user right now.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const RoleIcon = ROLE_INFO[selectedRole].icon;
  const handleClose = () => {
    setShowConfirmDialog(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldPlus className="h-5 w-5 text-primary" />
              Promote User
            </DialogTitle>
            <DialogDescription>
              Promote this employee to a management role.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{user.full_name || "No name set"}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">New Role *</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AdminRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(ROLE_INFO) as [AdminRole, typeof ROLE_INFO[AdminRole]][]).map(([role, info]) => {
                    const Icon = info.icon;
                    return (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{info.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {ROLE_INFO[selectedRole].description}
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This user will gain access to management features based on the selected role.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={() => setShowConfirmDialog(true)} disabled={loading}>
              <RoleIcon className="h-4 w-4 mr-2" />
              Promote to {ROLE_INFO[selectedRole].label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showConfirmDialog}
        onOpenChange={(nextOpen) => {
          if (!loading) {
            setShowConfirmDialog(nextOpen);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Admin Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              You are promoting <span className="font-medium">{user.full_name || user.email}</span> to{" "}
              <span className="font-medium">{ROLE_INFO[selectedRole].label}</span>.
              <br /><br />
              This will send an email to <span className="font-medium">{user.email}</span> with instructions to create a
              password and Role Color Finder account if they do not already have one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromote} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Promoting...
                </>
              ) : (
                "Send Email & Promote"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
