import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus, Gift } from "lucide-react";

type UserRole = "admin" | "blogger" | "user";

interface UserData {
  id: string;
  email: string;
  roles: UserRole[];
  created_at: string;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("user");
  const [selectedUserForAssessment, setSelectedUserForAssessment] = useState<string | null>(null);
  const [assessmentType, setAssessmentType] = useState<string>("free");

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  const checkAdminAndLoadUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        navigate("/");
        return;
      }

      await loadUsers();
    } catch (error) {
      console.error("Error:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (!rolesData) return;

      // Group roles by user_id
      const userRolesMap = new Map<string, UserRole[]>();
      rolesData.forEach(({ user_id, role }) => {
        if (!userRolesMap.has(user_id)) {
          userRolesMap.set(user_id, []);
        }
        userRolesMap.get(user_id)!.push(role as UserRole);
      });

      // Since we can't access auth.users directly, we'll work with what we have
      const usersArray: UserData[] = Array.from(userRolesMap.entries()).map(([userId, roles]) => ({
        id: userId,
        email: "User " + userId.substring(0, 8), // Simplified since we can't query auth.users
        roles,
        created_at: new Date().toISOString(),
      }));

      setUsers(usersArray);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const addRole = async (userId: string, role: UserRole) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: role,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${role} role to user`,
      });

      await loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add role",
        variant: "destructive",
      });
    }
  };

  const removeRole = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Removed ${role} role from user`,
      });

      await loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove role",
        variant: "destructive",
      });
    }
  };

  const grantFreeAssessment = async (userId: string, type: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("free_assessments")
        .insert({
          user_id: userId,
          assessment_type: type,
          granted_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Granted free ${type} assessment to user`,
      });

      setSelectedUserForAssessment(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to grant assessment",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-10 px-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="h-9 w-9 p-0 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 text-gray-700" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600 text-sm mt-1">Manage user roles and permissions</p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="font-semibold text-gray-900 text-sm">User ID</TableHead>
                <TableHead className="font-semibold text-gray-900 text-sm">Roles</TableHead>
                <TableHead className="font-semibold text-gray-900 text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <TableCell className="font-mono text-sm text-gray-600">{user.id.substring(0, 12)}...</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.roles.map((role) => (
                        <Badge key={role} className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-100">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select onValueChange={(value) => addRole(user.id, value as UserRole)}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Add role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="blogger">Blogger</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => setSelectedUserForAssessment(user.id)}
                          >
                            <Gift className="h-3.5 w-3.5" />
                            Grant
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Grant Free Assessment</DialogTitle>
                            <DialogDescription>
                              Select an assessment type to grant to this user
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Assessment Type</Label>
                              <Select value={assessmentType} onValueChange={setAssessmentType}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free Assessment</SelectItem>
                                  <SelectItem value="premium">Premium (25Q)</SelectItem>
                                  <SelectItem value="pro">Pro (50Q)</SelectItem>
                                  <SelectItem value="leadership">Leadership</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => grantFreeAssessment(user.id, assessmentType)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Grant Assessment
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
