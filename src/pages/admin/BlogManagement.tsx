import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Trash2, Eye, PlusCircle } from "lucide-react";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  status: string;
  published_at: string | null;
  created_at: string;
  author_id: string;
}

export default function BlogManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccessAndLoadPosts();
  }, []);

  const checkAccessAndLoadPosts = async () => {
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
        .in("role", ["admin", "blogger"]);

      if (!roleData || roleData.length === 0) {
        navigate("/");
        return;
      }

      await loadPosts();
    } catch (error) {
      console.error("Error:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      console.error("Error loading posts:", error);
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive",
      });
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });

      await loadPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading blog posts...</p>
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
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
            <p className="text-gray-600 text-sm mt-1">Create and manage blog posts</p>
          </div>
          <Button onClick={() => navigate("/admin/blog/new")} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="h-4 w-4" />
            New Post
          </Button>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="font-semibold text-gray-900 text-sm">Title</TableHead>
                <TableHead className="font-semibold text-gray-900 text-sm">Status</TableHead>
                <TableHead className="font-semibold text-gray-900 text-sm">Published</TableHead>
                <TableHead className="font-semibold text-gray-900 text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-600 py-8">
                    No blog posts yet. Create your first post!
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{post.title}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${post.status === "published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {post.published_at
                        ? format(new Date(post.published_at), "MMM dd, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {post.status === "published" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            onClick={() => navigate(`/blog/${post.id}`)}
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50"
                          onClick={() => deletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
