import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, Users, Briefcase } from "lucide-react";
import type { CompanyUserRole } from "@/contexts/CompanyContext";
import type { AssessmentCategory, AssessmentType } from "@/lib/assessmentQuestionLoader";

interface InviteAdminModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  defaultAssessmentType: AssessmentType;
  onInviteComplete: () => void;
}

type AdminRole = Exclude<CompanyUserRole, 'employee'>;
type AdminAssessmentTypeChoice = 'default' | AssessmentType;

const DEFAULT_ASSESSMENT_CATEGORY: AssessmentCategory = 'professional';

const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: '25q', label: '25 Questions' },
  { value: '50q', label: '50 Questions' },
];

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

const INVITABLE_ROLES: AdminRole[] = ['admin', 'hr'];

export default function InviteAdminModal({
  open,
  onClose,
  companyId,
  defaultAssessmentType,
  onInviteComplete,
}: InviteAdminModalProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<AdminRole>("admin");
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<AdminAssessmentTypeChoice>('default');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtml || '';
      document.body.style.overflow = prevBody || '';
    };
  }, [open]);

  const handleInvite = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const resolvedAssessmentType = selectedAssessmentType === 'default'
        ? defaultAssessmentType
        : selectedAssessmentType;

      const { data, error } = await supabase.functions.invoke("invite-company-user", {
        body: {
          company_id: companyId,
          email: email.trim().toLowerCase(),
          full_name: fullName.trim() || null,
          role: selectedRole,
          assessment_category: DEFAULT_ASSESSMENT_CATEGORY,
          assessment_type: resolvedAssessmentType,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: `${ROLE_INFO[selectedRole].label} invited!`,
        description: `Invitation sent to ${email}`,
      });

      setEmail("");
      setFullName("");
      setSelectedRole("admin");
      setSelectedAssessmentType('default');
      onInviteComplete();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error inviting user",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const RoleIcon = ROLE_INFO[selectedRole].icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RoleIcon className="h-5 w-5 text-primary" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Invite a new team member with specific permissions to help manage this company portal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AdminRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {INVITABLE_ROLES.map((role) => {
                  const info = ROLE_INFO[role];
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
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assessmentType">Assessment Type</Label>
            <Select
              value={selectedAssessmentType}
              onValueChange={(value) => setSelectedAssessmentType(value as AdminAssessmentTypeChoice)}
            >
              <SelectTrigger id="assessmentType">
                <SelectValue placeholder="Use company default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  Company default ({defaultAssessmentType === '25q' ? '25 Questions' : '50 Questions'})
                </SelectItem>
                {ASSESSMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Admin invites use the Professional assessment category. If you do not choose a question count, the company default is applied.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name (Optional)</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RoleIcon className="h-4 w-4 mr-2" />}
            Invite {ROLE_INFO[selectedRole].label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
