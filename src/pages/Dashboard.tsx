import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserProfileSidebar } from "@/components/ui/user-profile-sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { FloatingHeader } from "@/components/ui/floating-header";
import { 
  Calendar, 
  Download, 
  Eye, 
  BarChart3, 
  ChevronRight,
  User,
  Settings,
  KeyRound,
  Building2,
  FileText,
  LogOut,
  Briefcase,
  Mail,
  Plus
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

interface CompanyAccess {
  id: string;
  role: 'admin' | 'employee';
  status: 'invited' | 'active' | 'revoked';
  companyName: string;
  subdomain: string;
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
  const [activeSection, setActiveSection] = useState<'overview' | 'assessments' | 'settings' | 'business'>('overview');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [companyAccessList, setCompanyAccessList] = useState<CompanyAccess[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserAssessments();
      checkCompanyAccess();
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user?.id)
        .single();

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      // Profile doesn't exist yet, that's okay
    }
  };

  const checkCompanyAccess = async () => {
    try {
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
        .eq('email', user?.email);

      if (error || !companyUsers || companyUsers.length === 0) {
        setCompanyAccessList([]);
        return;
      }

      const accessList = companyUsers
        .filter(cu => cu.companies)
        .map(cu => {
          const company = cu.companies as { id: string; name: string; subdomain: string };
          return {
            id: cu.id,
            role: cu.role as 'admin' | 'employee',
            status: cu.status as 'invited' | 'active' | 'revoked',
            companyName: company.name,
            subdomain: company.subdomain,
          };
        });

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
      case 'yellow': return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'red': return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'green': return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'blue': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      default: return 'bg-muted text-muted-foreground border-border';
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

  // Separate companies by status
  const activeCompanies = companyAccessList.filter(c => c.status === 'active');
  const pendingInvites = companyAccessList.filter(c => c.status === 'invited');
  const adminCompanies = activeCompanies.filter(c => c.role === 'admin');
  const employeeCompanies = activeCompanies.filter(c => c.role === 'employee');

  // Build nav items
  const navItems = [
    {
      icon: <User className="h-4 w-4" />,
      label: 'Overview',
      onClick: () => setActiveSection('overview'),
      isActive: activeSection === 'overview',
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: 'My Assessments',
      onClick: () => setActiveSection('assessments'),
      isActive: activeSection === 'assessments',
    },
    {
      icon: <Briefcase className="h-4 w-4" />,
      label: 'Business',
      onClick: () => setActiveSection('business'),
      isActive: activeSection === 'business',
    },
    {
      icon: <Settings className="h-4 w-4" />,
      label: 'Settings',
      onClick: () => setActiveSection('settings'),
      isActive: activeSection === 'settings',
      isSeparator: true,
    },
  ];

  const logoutItem = {
    icon: <LogOut className="h-4 w-4" />,
    label: 'Sign Out',
    onClick: signOut,
  };

  const userProfile = {
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    avatarUrl: avatarUrl,
    userId: user?.id,
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <FloatingHeader />
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
      <FloatingHeader />
      <div className="container mx-auto px-4 py-8">
        {/* Mobile Header with Sidebar Toggle */}
        <div className="lg:hidden flex items-center gap-4 mb-6">
          <MobileSidebar
            user={userProfile}
            navItems={navItems}
            logoutItem={logoutItem}
            onAvatarChange={setAvatarUrl}
          />
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>

        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block sticky top-24 h-fit">
            <UserProfileSidebar
              user={userProfile}
              navItems={navItems}
              logoutItem={logoutItem}
              activeSection={activeSection}
              onAvatarChange={setAvatarUrl}
            />
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading your dashboard...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Overview Section */}
                {activeSection === 'overview' && (
                  <>
                    <div className="mb-6">
                      <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                        Welcome back, {userProfile.name}
                      </h1>
                      <p className="text-muted-foreground mt-1">Here's an overview of your account</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card className="shadow-elegant border-border/20">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <BarChart3 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{assessments.length}</p>
                              <p className="text-sm text-muted-foreground">Total Assessments</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-elegant border-border/20">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Briefcase className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{activeCompanies.length}</p>
                              <p className="text-sm text-muted-foreground">Businesses</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-elegant border-border/20">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">
                                {assessments.filter(a => a.results.dominantColor).length}
                              </p>
                              <p className="text-sm text-muted-foreground">Completed</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Assessment */}
                    {assessments.length > 0 && assessments[0].results.dominantColor && (
                      <Card className="shadow-elegant border-border/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Latest Result
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-lg font-semibold">
                                {getAssessmentTypeLabel(assessments[0].assessment_type)}
                              </p>
                              <Badge className={getColorBadgeStyle(assessments[0].results.dominantColor)}>
                                {getColorLabel(assessments[0].results.dominantColor)}
                              </Badge>
                            </div>
                            <Button 
                              variant="outline" 
                              onClick={() => setActiveSection('assessments')}
                            >
                              View All
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Pending Invites Alert */}
                    {pendingInvites.length > 0 && (
                      <Card className="shadow-elegant border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                              <Mail className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                                You have {pendingInvites.length} pending invitation{pendingInvites.length > 1 ? 's' : ''}
                              </p>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Check your Business section to accept or decline
                              </p>
                            </div>
                            <Button 
                              variant="outline"
                              onClick={() => setActiveSection('business')}
                              className="border-yellow-400 text-yellow-700 hover:bg-yellow-100"
                            >
                              View Invites
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* Assessments Section */}
                {activeSection === 'assessments' && (
                  <>
                    <div className="mb-6">
                      <h1 className="text-3xl font-bold">My Assessments</h1>
                      <p className="text-muted-foreground mt-1">View and manage your assessment results</p>
                    </div>

                    {assessments.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {assessments.map((assessment) => {
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
                                      {assessment.results.dominantColor && (
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          onClick={() => {
                                            const storageKey = `${assessment.assessment_type}AssessmentResults`;
                                            localStorage.setItem(storageKey, JSON.stringify(assessment.results));
                                            navigate(`/${assessment.assessment_type}-results`);
                                          }}
                                        >
                                          <ChevronRight className="w-4 h-4 mr-2" />
                                          View
                                        </Button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
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
                  </>
                )}

                {/* Business Section */}
                {activeSection === 'business' && (
                  <>
                    <div className="mb-6">
                      <h1 className="text-3xl font-bold">Business</h1>
                      <p className="text-muted-foreground mt-1">Manage your business accounts and invitations</p>
                    </div>

                    {/* Pending Invites */}
                    {pendingInvites.length > 0 && (
                      <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <Mail className="h-5 w-5 text-yellow-600" />
                          Pending Invitations
                        </h2>
                        <div className="space-y-3">
                          {pendingInvites.map((invite) => (
                            <Card key={invite.id} className="shadow-elegant border-yellow-300/50 bg-yellow-50/50 dark:bg-yellow-950/10">
                              <CardContent className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-yellow-600" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold">{invite.companyName}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      Invited as {invite.role}
                                    </p>
                                  </div>
                                </div>
                                <Button onClick={() => navigate(`/company/${invite.subdomain}`)}>
                                  Accept Invite
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Your Businesses (Admin) */}
                    {adminCompanies.length > 0 && (
                      <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          Your Businesses
                        </h2>
                        <div className="space-y-3">
                          {adminCompanies.map((company) => (
                            <Card key={company.id} className="shadow-elegant border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                              <CardContent className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold">{company.companyName}</h3>
                                    <Badge variant="outline" className="mt-1 text-xs">Admin</Badge>
                                  </div>
                                </div>
                                <Button onClick={() => navigate('/b2b/company-portal')}>
                                  <Building2 className="w-4 h-4 mr-2" />
                                  Admin Dashboard
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Businesses You're Part Of (Employee) */}
                    {employeeCompanies.length > 0 && (
                      <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Businesses You're Part Of
                        </h2>
                        <div className="space-y-3">
                          {employeeCompanies.map((company) => (
                            <Card key={company.id} className="shadow-elegant border-border/20">
                              <CardContent className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold">{company.companyName}</h3>
                                    <Badge variant="secondary" className="mt-1 text-xs">Employee</Badge>
                                  </div>
                                </div>
                                <Button variant="outline" onClick={() => navigate(`/company/${company.subdomain}`)}>
                                  <User className="w-4 h-4 mr-2" />
                                  Employee Portal
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Empty State - No Businesses */}
                    {activeCompanies.length === 0 && pendingInvites.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                          <Briefcase className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-semibold mb-3">No businesses yet</h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                          Start a business account to unlock team assessments, analytics, and AI-powered work assignments for your organization.
                        </p>
                        <Button size="lg" asChild>
                          <Link to="/pricing">
                            <Plus className="w-5 h-5 mr-2" />
                            Start a Business
                          </Link>
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {/* Settings Section */}
                {activeSection === 'settings' && (
                  <>
                    <div className="mb-6">
                      <h1 className="text-3xl font-bold">Account Settings</h1>
                      <p className="text-muted-foreground mt-1">Manage your account preferences</p>
                    </div>

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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowPasswordChange(!showPasswordChange)}
                        >
                          <KeyRound className="w-4 h-4 mr-2" />
                          Change Password
                        </Button>
                        
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
                  </>
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
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
