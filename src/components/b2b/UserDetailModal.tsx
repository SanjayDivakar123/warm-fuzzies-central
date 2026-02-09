import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Trash2, 
  Copy, 
  Check, 
  Shield, 
  ShieldPlus,
  Settings,
  RotateCcw,
  RefreshCw,
  Loader2,
  Bell,
  Sparkles,
  X,
  Plus
} from 'lucide-react';

interface UserDetailModalProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  superAdminId: string | undefined;
  isSuperAdmin: boolean;
  allJobRoles: string[];
  predefinedSkills: string[];
  copiedId: string | null;
  resendingId: string | null;
  savingUserId: string | null;
  suggestingSkillsFor: string | null;
  suggestedSkills: Record<string, string[]>;
  onCopyCode: (id: string, code: string) => void;
  onResendInvite: (id: string) => void;
  onPromoteUser: (user: { id: string; email: string; full_name?: string }) => void;
  onManageAdmin: (user: { id: string; email: string; full_name?: string; status: string; role: string }) => void;
  onRevokeAccess: (id: string) => void;
  onRestoreAccess: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onRequestRetake: (user: { id: string; email: string; full_name?: string }) => void;
  onSaveUserDetails: (userId: string, fullName: string, jobRole: string, skills: string[]) => void;
  onSuggestSkills: (userId: string) => void;
  canResend: (user: any) => boolean;
  getResendTooltip: (user: any) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  cancelledReminders: Record<string, number>;
  canPromoteUsers?: boolean;
  canManageAllRoles?: boolean;
}

export default function UserDetailModal({
  user,
  open,
  onOpenChange,
  superAdminId,
  isSuperAdmin,
  allJobRoles,
  predefinedSkills,
  copiedId,
  resendingId,
  savingUserId,
  suggestingSkillsFor,
  suggestedSkills,
  onCopyCode,
  onResendInvite,
  onPromoteUser,
  onManageAdmin,
  onRevokeAccess,
  onRestoreAccess,
  onDeleteUser,
  onRequestRetake,
  onSaveUserDetails,
  onSuggestSkills,
  canResend,
  getResendTooltip,
  getStatusBadge,
  cancelledReminders,
  canPromoteUsers = true,
  canManageAllRoles = true,
}: UserDetailModalProps) {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [jobRole, setJobRole] = useState(user?.job_role || '');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');

  if (!user) return null;

  const handleAddSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSave = () => {
    onSaveUserDetails(user.id, fullName, jobRole, skills);
  };

  const getRoleBadge = () => {
    const roleConfig = {
      admin: { label: 'Admin', className: 'bg-primary/10 text-primary border-primary/20' },
      hr: { label: 'HR', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      partner: { label: 'Partner', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
      employee: { label: 'Employee', className: '' },
    };
    const config = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.employee;
    return (
      <Badge variant={user.role === 'employee' ? 'secondary' : 'default'} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>Team Member Details</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user.full_name || 'No name set'}</p>
                <p className="text-sm text-muted-foreground break-all">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {getRoleBadge()}
                {user.role === 'admin' && user.id === superAdminId && (
                  <Badge variant="outline" className="text-xs">Owner</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(user.status)}
              {cancelledReminders[user.id] && user.assessment_completed_at && (
                <Badge variant="outline" className="gap-1 text-xs border-primary/30 text-primary">
                  <Bell className="h-3 w-3" />
                  Auto-cancelled
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Invite Code */}
          {user.invite_code && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Invite Code</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
                  {user.invite_code}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onCopyCode(user.id, user.invite_code)}
                >
                  {copiedId === user.id ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Assessment Info */}
          {user.assessment_category && user.assessment_type && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Assessment</Label>
              <Badge variant="outline" className="capitalize">
                {user.assessment_category} • {user.assessment_type.toUpperCase()}
              </Badge>
            </div>
          )}

          {/* Current Job Role */}
          {user.job_role && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Job Role</Label>
              <p className="text-sm font-medium">{user.job_role}</p>
            </div>
          )}

          {/* Current Skills */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Current Skills</Label>
            {user.skills && user.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {user.skills.map((skill: string) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills assigned</p>
            )}
          </div>

          {/* Invited Date */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Invited</Label>
            <p className="text-sm">{new Date(user.invited_at).toLocaleDateString()}</p>
          </div>

          <Separator />

          {/* Editable Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label>Job Role</Label>
              <Select value={jobRole} onValueChange={setJobRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job role" />
                </SelectTrigger>
                <SelectContent>
                  {allJobRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Skills</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSuggestSkills(user.id)}
                  disabled={suggestingSkillsFor === user.id}
                  className="h-7 text-xs"
                >
                  {suggestingSkillsFor === user.id ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  AI Suggest
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {suggestedSkills[user.id] && suggestedSkills[user.id].length > 0 && (
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">Suggested skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestedSkills[user.id].map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/40 border-purple-200"
                        onClick={() => handleAddSkill(skill)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Select value="" onValueChange={(value) => handleAddSkill(value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add skill..." />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedSkills
                      .filter((s) => !skills.includes(s))
                      .map((skill) => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full"
              disabled={savingUserId === user.id}
            >
              {savingUserId === user.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Actions</Label>
            <div className="grid grid-cols-2 gap-2">
              {user.status === 'invited' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (canResend(user)) {
                      onResendInvite(user.id);
                    }
                  }}
                  disabled={resendingId === user.id || !canResend(user)}
                  className="gap-2"
                >
                  {resendingId === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Resend Invite
                </Button>
              )}

              {user.role !== 'admin' && user.status === 'active' && canPromoteUsers && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPromoteUser({ id: user.id, email: user.email, full_name: user.full_name })}
                  className="gap-2"
                >
                  <ShieldPlus className="h-4 w-4" />
                  Promote
                </Button>
              )}

              {user.role !== 'employee' && isSuperAdmin && user.id !== superAdminId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onManageAdmin({
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    status: user.status,
                    role: user.role,
                  })}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Manage
                </Button>
              )}

              {user.role === 'employee' && user.status === 'active' && user.assessment_completed_at && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRequestRetake({ id: user.id, email: user.email, full_name: user.full_name })}
                  className="gap-2 text-amber-600 hover:bg-amber-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Request Retake
                </Button>
              )}

              {user.status === 'revoked' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRestoreAccess(user.id)}
                  className="gap-2 text-green-600 hover:bg-green-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore
                </Button>
              )}

              {user.role === 'employee' && user.status !== 'revoked' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onRevokeAccess(user.id);
                    onOpenChange(false);
                  }}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Revoke
                </Button>
              )}

              {user.status === 'revoked' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onDeleteUser(user.id);
                    onOpenChange(false);
                  }}
                  className="gap-2 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
