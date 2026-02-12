import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Sparkles, 
  Briefcase,
  Users,
  X,
  Download,
  UserPlus,
} from 'lucide-react';
import { generateRoleSkills, generateExtendedSkills, type GeneratedRole } from '@/lib/roleSkillsGenerator';

// Default roles that can be seeded for new companies
const DEFAULT_ROLES: { name: string; description: string; skills: string[] }[] = [
  {
    name: 'Software Engineer',
    description: 'Designs, develops, and maintains software applications and systems.',
    skills: ['Programming', 'Problem Solving', 'Code Review', 'Testing', 'Documentation', 'Collaboration', 'System Design', 'Debugging'],
  },
  {
    name: 'Product Manager',
    description: 'Leads product strategy, roadmap, and cross-functional team alignment.',
    skills: ['Product Strategy', 'Roadmap Planning', 'Stakeholder Management', 'Data Analysis', 'User Research', 'Prioritization', 'Communication', 'Agile Methodology'],
  },
  {
    name: 'Sales Representative',
    description: 'Drives revenue by building relationships and closing deals with customers.',
    skills: ['Prospecting', 'Negotiation', 'Relationship Building', 'CRM Management', 'Presentation', 'Objection Handling', 'Pipeline Management', 'Customer Communication'],
  },
  {
    name: 'Marketing Specialist',
    description: 'Creates and executes marketing campaigns to drive brand awareness and leads.',
    skills: ['Campaign Management', 'Content Creation', 'Analytics', 'Social Media', 'SEO/SEM', 'Email Marketing', 'Brand Strategy', 'Creative Thinking'],
  },
  {
    name: 'HR Manager',
    description: 'Oversees human resources operations including hiring, training, and employee relations.',
    skills: ['Recruitment', 'Employee Relations', 'Performance Management', 'Policy Development', 'Training & Development', 'Compliance', 'Conflict Resolution', 'Onboarding'],
  },
  {
    name: 'Customer Success Manager',
    description: 'Ensures customers achieve their goals and maximize value from products/services.',
    skills: ['Customer Onboarding', 'Account Management', 'Retention Strategies', 'Upselling', 'Problem Solving', 'Communication', 'Product Knowledge', 'Relationship Building'],
  },
  {
    name: 'Financial Analyst',
    description: 'Analyzes financial data and provides insights for business decisions.',
    skills: ['Financial Modeling', 'Data Analysis', 'Forecasting', 'Budgeting', 'Reporting', 'Excel', 'Attention to Detail', 'Business Acumen'],
  },
  {
    name: 'Project Manager',
    description: 'Plans, executes, and delivers projects on time and within scope.',
    skills: ['Project Planning', 'Risk Management', 'Resource Allocation', 'Stakeholder Communication', 'Timeline Management', 'Agile/Scrum', 'Problem Solving', 'Documentation'],
  },
  {
    name: 'UX Designer',
    description: 'Designs user-centered experiences through research and visual design.',
    skills: ['User Research', 'Wireframing', 'Prototyping', 'Usability Testing', 'Design Systems', 'Figma', 'Interaction Design', 'Visual Design'],
  },
  {
    name: 'Operations Manager',
    description: 'Optimizes processes and ensures efficient day-to-day business operations.',
    skills: ['Process Improvement', 'Resource Management', 'Vendor Relations', 'Quality Control', 'Budget Management', 'Team Leadership', 'Strategic Planning', 'Problem Solving'],
  },
];

interface Role {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  skills: string[];
  created_at: string;
  updated_at: string;
}

interface RolesTabProps {
  company: { id: string; name: string };
}

export default function RolesTab({ company }: RolesTabProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [seedingDefaults, setSeedingDefaults] = useState(false);
  const [importingFromUsers, setImportingFromUsers] = useState(false);
  
  // Bulk skills state
  const [showBulkSkillsModal, setShowBulkSkillsModal] = useState(false);
  const [bulkSkillsCount, setBulkSkillsCount] = useState(20);
  const [bulkSkillsApplying, setBulkSkillsApplying] = useState(false);
  
  // Form state
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleSkills, setRoleSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [autoGenerating, setAutoGenerating] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
  }, [company.id]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', company.id)
        .order('name');

      if (error) throw error;
      
      const fetchedRoles = data || [];
      setRoles(fetchedRoles);

      // Auto-seed from existing user job_roles if no roles exist yet
      if (fetchedRoles.length === 0) {
        await importRolesFromUsers(false);
      }
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      toast({
        title: 'Error loading roles',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Seed roles from existing user job_role values
  const importRolesFromUsers = async (manual = false) => {
    if (manual) setImportingFromUsers(true);
    try {
      const { data: users, error: usersError } = await supabase
        .from('company_users')
        .select('job_role')
        .eq('company_id', company.id)
        .not('job_role', 'is', null);

      if (usersError) throw usersError;

      console.log('Found users with job_role:', users);

      // Get unique job_role values
      const uniqueJobRoles = [...new Set(
        (users || [])
          .map(u => u.job_role?.trim())
          .filter((role): role is string => !!role && role.length > 0)
      )];

      console.log('Unique job roles:', uniqueJobRoles);

      if (uniqueJobRoles.length === 0) {
        if (manual) {
          toast({
            title: 'No roles to import',
            description: 'No employees have job roles assigned yet.',
          });
        }
        return;
      }

      // Filter out roles that already exist
      const existingRoleNames = new Set(roles.map(r => r.name.toLowerCase()));
      const newRoles = uniqueJobRoles.filter(
        role => !existingRoleNames.has(role.toLowerCase())
      );

      if (newRoles.length === 0) {
        if (manual) {
          toast({
            title: 'All roles already exist',
            description: 'All employee job roles are already in the roles list.',
          });
        }
        return;
      }

      // Generate skills for each role and insert
      const rolesToInsert = newRoles.map(roleName => {
        const generated = generateRoleSkills(roleName);
        return {
          company_id: company.id,
          name: roleName,
          description: generated.description,
          skills: generated.skills,
        };
      });

      console.log('Inserting roles:', rolesToInsert);

      const { data: insertedRoles, error: insertError } = await supabase
        .from('company_roles')
        .insert(rolesToInsert)
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Inserted roles:', insertedRoles);

      if (insertedRoles && insertedRoles.length > 0) {
        setRoles(prev => [...prev, ...insertedRoles].sort((a, b) => a.name.localeCompare(b.name)));
        toast({
          title: 'Roles imported',
          description: `${insertedRoles.length} role${insertedRoles.length === 1 ? '' : 's'} imported from employee job roles.`,
        });
      }
    } catch (err: any) {
      console.error('Error importing roles from users:', err);
      if (manual) {
        toast({
          title: 'Error importing roles',
          description: err.message,
          variant: 'destructive',
        });
      }
    } finally {
      if (manual) setImportingFromUsers(false);
    }
  };

  // Propagate skills from a role to all users with that job_role
  const propagateSkillsToUsers = async (jobRoleName: string, skills: string[]): Promise<number> => {
    try {
      // Find all users with this job_role (case-insensitive match)
      const { data: users, error: fetchError } = await supabase
        .from('company_users')
        .select('id, skills')
        .eq('company_id', company.id)
        .ilike('job_role', jobRoleName);

      if (fetchError) {
        console.error('Error fetching users for skill propagation:', fetchError);
        return 0;
      }

      if (!users || users.length === 0) return 0;

      // Update each user's skills
      let updatedCount = 0;
      for (const user of users) {
        const { error: updateError } = await supabase
          .from('company_users')
          .update({ skills })
          .eq('id', user.id);

        if (!updateError) {
          updatedCount++;
        } else {
          console.error(`Error updating user ${user.id} skills:`, updateError);
        }
      }

      return updatedCount;
    } catch (err) {
      console.error('Error propagating skills to users:', err);
      return 0;
    }
  };

  const resetForm = () => {
    setRoleName('');
    setRoleDescription('');
    setRoleSkills([]);
    setNewSkill('');
    setEditingRole(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (role: Role) => {
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setRoleSkills(role.skills || []);
    setEditingRole(role);
    setShowCreateModal(true);
  };

  const handleAutoGenerateSkills = () => {
    if (!roleName.trim()) {
      toast({
        title: 'Enter role name first',
        description: 'Please enter a role name to auto-generate skills.',
        variant: 'destructive',
      });
      return;
    }

    setAutoGenerating(true);
    
    // Simulate brief delay for UX (generation is instant)
    setTimeout(() => {
      const generated = generateRoleSkills(roleName);
      setRoleSkills(generated.skills);
      if (!roleDescription) {
        setRoleDescription(generated.description);
      }
      setAutoGenerating(false);
      
      toast({
        title: 'Skills generated',
        description: `${generated.skills.length} skills generated based on "${roleName}"`,
      });
    }, 500);
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !roleSkills.includes(trimmed)) {
      setRoleSkills([...roleSkills, trimmed]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setRoleSkills(roleSkills.filter(s => s !== skill));
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      toast({
        title: 'Role name required',
        description: 'Please enter a name for this role.',
        variant: 'destructive',
      });
      return;
    }

    // Auto-generate skills if none provided
    let finalSkills = roleSkills;
    if (finalSkills.length === 0) {
      const generated = generateRoleSkills(roleName);
      finalSkills = generated.skills;
    }

    setSaving(true);
    try {
      if (editingRole) {
        // Update existing role
        const { error } = await supabase
          .from('company_roles')
          .update({
            name: roleName.trim(),
            description: roleDescription.trim() || null,
            skills: finalSkills,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRole.id);

        if (error) throw error;

        // Propagate skills to users with this job_role
        const usersUpdated = await propagateSkillsToUsers(editingRole.name, finalSkills);
        
        toast({
          title: 'Role updated',
          description: `"${roleName}" has been updated.${usersUpdated > 0 ? ` Skills synced to ${usersUpdated} employee${usersUpdated === 1 ? '' : 's'}.` : ''}`,
        });
      } else {
        // Create new role
        const { error } = await supabase
          .from('company_roles')
          .insert({
            company_id: company.id,
            name: roleName.trim(),
            description: roleDescription.trim() || null,
            skills: finalSkills,
          });

        if (error) throw error;

        // Propagate skills to any existing users with this job_role
        const usersUpdated = await propagateSkillsToUsers(roleName.trim(), finalSkills);
        
        toast({
          title: 'Role created',
          description: `"${roleName}" has been created with ${finalSkills.length} skills.${usersUpdated > 0 ? ` Skills synced to ${usersUpdated} employee${usersUpdated === 1 ? '' : 's'}.` : ''}`,
        });
      }

      setShowCreateModal(false);
      resetForm();
      fetchRoles();
    } catch (err: any) {
      console.error('Error saving role:', err);
      toast({
        title: 'Error saving role',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;

    try {
      const { error } = await supabase
        .from('company_roles')
        .delete()
        .eq('id', deletingRole.id);

      if (error) throw error;
      
      toast({
        title: 'Role deleted',
        description: `"${deletingRole.name}" has been deleted.`,
      });
      
      setDeletingRole(null);
      fetchRoles();
    } catch (err: any) {
      console.error('Error deleting role:', err);
      toast({
        title: 'Error deleting role',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleSeedDefaultRoles = async () => {
    setSeedingDefaults(true);
    try {
      // Filter out roles that already exist (by name)
      const existingRoleNames = new Set(roles.map(r => r.name.toLowerCase()));
      const rolesToAdd = DEFAULT_ROLES.filter(
        dr => !existingRoleNames.has(dr.name.toLowerCase())
      );

      if (rolesToAdd.length === 0) {
        toast({
          title: 'Default roles already exist',
          description: 'All default roles have already been added.',
        });
        setSeedingDefaults(false);
        return;
      }

      const { error } = await supabase
        .from('company_roles')
        .insert(
          rolesToAdd.map(role => ({
            company_id: company.id,
            name: role.name,
            description: role.description,
            skills: role.skills,
          }))
        );

      if (error) throw error;

      toast({
        title: 'Default roles added',
        description: `${rolesToAdd.length} default role${rolesToAdd.length === 1 ? '' : 's'} have been added to your organization.`,
      });

      fetchRoles();
    } catch (err: any) {
      console.error('Error seeding default roles:', err);
      toast({
        title: 'Error adding default roles',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSeedingDefaults(false);
    }
  };

  const handleBulkGenerateSkills = async () => {
    if (roles.length === 0) {
      toast({
        title: 'No roles to update',
        description: 'Add some roles first before generating skills.',
        variant: 'destructive',
      });
      return;
    }

    const skillCount = Math.min(50, Math.max(1, bulkSkillsCount));
    setBulkSkillsApplying(true);

    try {
      let updatedCount = 0;
      let totalUsersUpdated = 0;

      for (const role of roles) {
        const extendedSkills = generateExtendedSkills(role.name, skillCount);
        
        const { error } = await supabase
          .from('company_roles')
          .update({
            skills: extendedSkills,
            updated_at: new Date().toISOString(),
          })
          .eq('id', role.id);

        if (error) {
          console.error(`Error updating role ${role.name}:`, error);
        } else {
          updatedCount++;
          // Propagate skills to users with this role
          const usersUpdated = await propagateSkillsToUsers(role.name, extendedSkills);
          totalUsersUpdated += usersUpdated;
        }
      }

      toast({
        title: 'Skills generated',
        description: `Updated ${updatedCount} role${updatedCount === 1 ? '' : 's'} with ${skillCount} skills each.${totalUsersUpdated > 0 ? ` Synced to ${totalUsersUpdated} employee${totalUsersUpdated === 1 ? '' : 's'}.` : ''}`,
      });

      setShowBulkSkillsModal(false);
      fetchRoles();
    } catch (err: any) {
      console.error('Error bulk generating skills:', err);
      toast({
        title: 'Error generating skills',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setBulkSkillsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Job Roles
            </CardTitle>
            <CardDescription>
              Define roles and their required skills for your organization
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => importRolesFromUsers(true)}
              disabled={importingFromUsers}
            >
              {importingFromUsers ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Import from Users
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSeedDefaultRoles}
              disabled={seedingDefaults}
            >
              {seedingDefaults ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Add Defaults
            </Button>
            {roles.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setShowBulkSkillsModal(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Bulk Add Skills
              </Button>
            )}
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No roles defined</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create job roles to help match employees with tasks and track skills.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={openCreateModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Role
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => importRolesFromUsers(true)}
                  disabled={importingFromUsers}
                >
                  {importingFromUsers ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Import from Users
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSeedDefaultRoles}
                  disabled={seedingDefaults}
                >
                  {seedingDefaults ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Add Default Roles
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {role.description || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {role.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {role.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>—</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingRole(role)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => !open && setShowCreateModal(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Edit Role' : 'Create Role'}
            </DialogTitle>
            <DialogDescription>
              {editingRole 
                ? 'Update the role details and skills.'
                : 'Define a new job role with required skills. Skills will be auto-generated if not provided.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name *</Label>
              <Input
                id="roleName"
                placeholder="e.g., Software Engineer, Product Manager"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea
                id="roleDescription"
                placeholder="Brief description of this role..."
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Skills ({roleSkills.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoGenerateSkills}
                  disabled={!roleName.trim() || autoGenerating}
                >
                  {autoGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Auto-Generate
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                />
                <Button type="button" variant="secondary" onClick={handleAddSkill}>
                  Add
                </Button>
              </div>

              {roleSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg max-h-40 overflow-y-auto">
                  {roleSkills.map((skill) => (
                    <Badge 
                      key={skill} 
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {roleSkills.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Skills will be auto-generated when you save if none are provided.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingRole} onOpenChange={(open) => !open && setDeletingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingRole?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Skills Modal */}
      <Dialog open={showBulkSkillsModal} onOpenChange={setShowBulkSkillsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Bulk Generate Skills
            </DialogTitle>
            <DialogDescription>
              Auto-generate skills for all {roles.length} role{roles.length === 1 ? '' : 's'}. 
              This will replace existing skills with newly generated ones.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="skillCount">Number of skills per role</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="skillCount"
                  type="number"
                  min={1}
                  max={50}
                  value={bulkSkillsCount}
                  onChange={(e) => setBulkSkillsCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  (max 50)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Skills are generated based on each role's name and category.
              </p>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-1">Roles to update:</p>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {roles.map((role) => (
                  <Badge key={role.id} variant="secondary" className="text-xs">
                    {role.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkSkillsModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkGenerateSkills} disabled={bulkSkillsApplying}>
              {bulkSkillsApplying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate {bulkSkillsCount} Skills Each
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
