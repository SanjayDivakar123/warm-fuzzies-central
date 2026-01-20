import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navigation/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Download, 
  Eye, 
  Clock, 
  BarChart3, 
  FileText,
  ChevronRight,
  User,
  Settings,
  KeyRound,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { exportToPDF } from "@/lib/pdfExport";
import AssessmentDetails from "@/components/AssessmentDetails";

interface AssessmentResult {
  id: string;
  assessment_type: string;
  results: any;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const Dashboard = () => {
  const { user, updatePassword, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [companyAccessList, setCompanyAccessList] = useState<Array<{
    id: string;
    role: 'admin' | 'employee';
    companyName: string;
    subdomain: string;
  }>>([]);

  useEffect(() => {
    if (user) {
      fetchUserAssessments();
      checkCompanyAccess();
    }
  }, [user]);

  const checkCompanyAccess = async () => {
    try {
      // Fetch all company user records for this email
      const { data: companyUsers, error } = await supabase
        .from('company_users')
        .select(`
          id, 
          role, 
          status,
          company_id,
          companies:company_id (
            id,
            name,
            subdomain
          )
        `)
        .eq('email', user?.email)
        .eq('status', 'active');

      if (error || !companyUsers || companyUsers.length === 0) {
        setCompanyAccessList([]);
        return;
      }

      // Build list of all companies with access
      const accessList = companyUsers
        .filter(cu => cu.companies)
        .map(cu => {
          const company = cu.companies as { id: string; name: string; subdomain: string };
          return {
            id: cu.id,
            role: cu.role as 'admin' | 'employee',
            companyName: company.name,
            subdomain: company.subdomain,
          };
        });

      // Sort: admins first, then by company name
      accessList.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return a.companyName.localeCompare(b.companyName);
      });

      setCompanyAccessList(accessList);
    } catch (error) {
      console.error('Error checking company access:', error);
    }
  };

  const fetchUserAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your assessments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAssessmentTypeLabel = (type: string) => {
    switch (type) {
      case 'free': return 'Free Preview';
      case 'premium': return 'Premium Assessment';
      case 'pro': return 'Pro Assessment';
      default: return 'Assessment';
    }
  };

  const getColorLabel = (color: string) => {
    switch (color) {
      case 'yellow': return 'Action-first executor';
      case 'red': return 'Vision-driven motivator';
      case 'green': return 'Logic-based architect';
      case 'blue': return 'People-first supporter';
      default: return color;
    }
  };

  const getColorBadgeStyle = (color: string) => {
    switch (color) {
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'red': return 'bg-red-100 text-red-800 border-red-300';
      case 'green': return 'bg-green-100 text-green-800 border-green-300';
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleDownloadReport = async (assessment: AssessmentResult) => {
    try {
      const reportData = {
        type: assessment.assessment_type,
        results: assessment.results,
        date: assessment.created_at,
      };
      const filename = `${assessment.assessment_type}-assessment-${format(new Date(assessment.created_at), 'yyyy-MM-dd')}.pdf`;

      await exportToPDF(reportData, filename);
      
      toast({
        title: "Download Complete",
        description: "Your report has been downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate the report",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    const { error } = await updatePassword(newPassword);
    
    if (error) {
      toast({
        title: "Password Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordChange(false);
    }
    setPasswordLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view your dashboard</h1>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-gradient-subtle py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center shadow-glow">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Your Dashboard
                </h1>
                <p className="text-muted-foreground">Welcome back, {user.email}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading your assessments...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* B2B Portal Access */}
              {companyAccessList.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="w-6 h-6" />
                    Company Portals
                  </h2>
                  <div className="space-y-3">
                    {companyAccessList.map((access) => (
                      <Card key={access.id} className="shadow-elegant border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                        <CardContent className="flex items-center justify-between py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {access.companyName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {access.role === 'admin' 
                                  ? 'Admin access' 
                                  : 'Employee access'}
                              </p>
                            </div>
                          </div>
                          {access.role === 'admin' ? (
                            <Button onClick={() => navigate('/b2b/company-portal')}>
                              <Building2 className="w-4 h-4 mr-2" />
                              Admin Dashboard
                            </Button>
                          ) : (
                            <Button onClick={() => navigate(`/company/${access.subdomain}`)}>
                              <User className="w-4 h-4 mr-2" />
                              Employee Portal
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Account Settings */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-6 h-6" />
                  Account Settings
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="shadow-elegant border-border/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <KeyRound className="w-5 h-5" />
                        Password & Security
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Manage your account password and security settings
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowPasswordChange(!showPasswordChange)}
                        >
                          <KeyRound className="w-4 h-4 mr-2" />
                          Change Password
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={signOut}
                        >
                          Sign Out
                        </Button>
                      </div>
                      
                      {showPasswordChange && (
                        <form onSubmit={handlePasswordChange} className="space-y-3 pt-4 border-t">
                          <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                              id="new-password"
                              type="password"
                              placeholder="Enter new password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                              id="confirm-password"
                              type="password"
                              placeholder="Confirm new password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" size="sm" disabled={passwordLoading}>
                              {passwordLoading ? "Updating..." : "Update Password"}
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setShowPasswordChange(false);
                                setNewPassword("");
                                setConfirmPassword("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </section>
              {/* Assessment Results */}
              {assessments.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6" />
                    Assessment Results
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assessments.map((assessment) => {
                      // Check if assessment is completed (has actual results vs just payment status)
                      const isCompleted = assessment.results.dominantColor || assessment.results.scores;
                      const isPurchasedOnly = assessment.results.status === 'payment_completed' && !isCompleted;
                      
                      return (
                        <Card key={assessment.id} className="shadow-elegant border-border/20">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">
                                  {getAssessmentTypeLabel(assessment.assessment_type)}
                                </CardTitle>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Calendar className="w-4 h-4" />
                                  {format(new Date(assessment.created_at), 'MMM dd, yyyy')}
                                </div>
                              </div>
                              <Badge variant="outline" className="border-primary/30">
                                {isPurchasedOnly ? 'Not Started' : assessment.assessment_type}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {isPurchasedOnly ? (
                              <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                  Assessment purchased but not yet completed
                                </p>
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  asChild
                                  className="w-full"
                                >
                                  <Link to={`/${assessment.assessment_type}-assessment`}>
                                    <ChevronRight className="w-4 h-4 mr-2" />
                                    Start Assessment
                                  </Link>
                                </Button>
                              </div>
                            ) : (
                              <>
                                {assessment.results.dominantColor && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">Primary Role:</p>
                                    <Badge className={getColorBadgeStyle(assessment.results.dominantColor)}>
                                      {getColorLabel(assessment.results.dominantColor)}
                                    </Badge>
                                  </div>
                                )}
                                <div className="flex gap-2 pt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleDownloadReport(assessment)}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setSelectedAssessment(assessment)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Details
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => {
                                      // Store the assessment data in localStorage before navigating
                                      const storageKey = `${assessment.assessment_type}AssessmentResults`;
                                      localStorage.setItem(storageKey, JSON.stringify(assessment.results));
                                      navigate(`/${assessment.assessment_type}-results`);
                                    }}
                                  >
                                    <ChevronRight className="w-4 h-4 mr-2" />
                                    View
                                  </Button>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Empty State */}
              {assessments.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No assessments yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Take your first assessment to discover your leadership color role
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button asChild>
                      <Link to="/free-assessment">
                        Start Free Assessment
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/pricing">View All Options</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assessment Details Modal */}
          {selectedAssessment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center">
                  <h2 className="text-xl font-bold">Assessment Details</h2>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAssessment(null)}>
                    ✕
                  </Button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <AssessmentDetails
                    results={selectedAssessment.results}
                    type={selectedAssessment.assessment_type}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;