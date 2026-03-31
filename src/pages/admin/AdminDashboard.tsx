import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, UserPlus, PenSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBlogPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Access Denied",
          description: "Please log in to access the admin dashboard",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadStats();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get total users with auth access
      const { count: userCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true });

      // Get blog post stats
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("status");

      setStats({
        totalUsers: userCount || 0,
        totalBlogPosts: posts?.length || 0,
        publishedPosts: posts?.filter(p => p.status === "published").length || 0,
        draftPosts: posts?.filter(p => p.status === "draft").length || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-10 px-6 max-w-6xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">System overview and quick access to management tools</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Total Users</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Total Posts</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBlogPosts}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Published</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.publishedPosts}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
            <p className="text-blue-700 text-sm font-medium">Drafts</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.draftPosts}</p>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/admin/users")}
            className="p-5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all text-left"
          >
            <Users className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 text-sm">Users</h3>
            <p className="text-xs text-gray-600 mt-1">Manage accounts</p>
          </button>

          <button
            onClick={() => navigate("/admin/blogs")}
            className="p-5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all text-left"
          >
            <FileText className="h-6 w-6 text-emerald-600 mb-3" />
            <h3 className="font-semibold text-gray-900 text-sm">Blog Posts</h3>
            <p className="text-xs text-gray-600 mt-1">View all posts</p>
          </button>

          <button
            onClick={() => navigate("/admin/blog/new")}
            className="p-5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all text-left"
          >
            <PenSquare className="h-6 w-6 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 text-sm">New Post</h3>
            <p className="text-xs text-gray-600 mt-1">Create article</p>
          </button>

          <button
            onClick={() => navigate("/admin/proposals")}
            className="p-5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all text-left"
          >
            <Send className="h-6 w-6 text-orange-600 mb-3" />
            <h3 className="font-semibold text-gray-900 text-sm">Proposals</h3>
            <p className="text-xs text-gray-600 mt-1">Client proposals</p>
          </button>
        </div>
      </div>
    </div>
  );
}
