import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/aceternity-sidebar";
import { FloatingHeader } from "@/components/ui/floating-header";

import { motion } from "framer-motion";
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
  Plus,
  Play,
  Clock,
  Camera,
  Loader2,
  Crown
} from "lucide-react";
import { format } from "date-fns";
import { exportToPDF } from "@/lib/pdfExport";
import AssessmentDetails from "@/components/AssessmentDetails";
import { cn } from "@/lib/utils";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus";
import { SubscriptionUpgradeCTA } from "@/components/subscription/SubscriptionUpgradeCTA";
import { SubscriptionRenewalBanner } from "@/components/subscription/SubscriptionRenewalBanner";
import { ProgressTracking } from "@/components/subscription/ProgressTracking";
import { FamilyMemberManager } from "@/components/subscription/FamilyMemberManager";

interface AssessmentResult {
  id: string;
  assessment_type: string;
  results: any;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface InProgressAssessment {
  id: string;
  assessment_type: string;
  currentQuestion: number;
  answeredCount: number;
  totalQuestions: number;
  created_at: string;
}

interface CompanyAccess {
  id: string;
  role: 'admin' | 'employee';
  status: 'invited' | 'active' | 'revoked';
  companyName: string;
  subdomain: string;
}

const Dashboard = () => {
  const { user, updatePassword, signOut, signInWithGoogle, subscription, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [inProgressAssessments, setInProgressAssessments] = useState<InProgressAssessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'assessments' | 'subscription' | 'settings' | 'business'>('overview');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [companyAccessList, setCompanyAccessList] = useState<CompanyAccess[]>([]);
  const [googleLinking, setGoogleLinking] = useState(false);

  // Check if user has Google linked
  const hasGoogleLinked = user?.app_metadata?.providers?.includes('google') || 
    user?.identities?.some((identity: any) => identity.provider === 'google');

  const handleLinkGoogle = async () => {
    setGoogleLinking(true);
    try {
      const { error } = await supabase.auth.linkIdentity({ provider: 'google' });
      if (error) {
        toast({ title: "Failed to link Google", description: error.message, variant: "destructive" });
      }
      // User will be redirected to Google, no need to handle success here
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setGoogleLinking(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserAssessments();
      fetchInProgressAssessments();
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

  const fetchInProgressAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_progress')
        .select('*')
        .eq('user_id', user?.id)
        .is('dominant_color', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const inProgress: InProgressAssessment[] = (data || []).map(item => ({
        id: item.id,
        assessment_type: item.assessment_type,
        currentQuestion: (item.results as any)?.currentQuestion ?? 0,
        answeredCount: Object.keys((item.results as any)?.answers || {}).length,
        totalQuestions: (item.results as any)?.totalQuestions ?? 25,
        created_at: item.created_at || '',
      })).filter(item => item.answeredCount > 0);
      
      setInProgressAssessments(inProgress);
    } catch (error) {
      console.error('Error fetching in-progress assessments:', error);
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

  // Build sidebar links for Aceternity sidebar
  const sidebarLinks = [
    {
      label: 'Overview',
      href: '#',
      icon: <User className="h-5 w-5 flex-shrink-0 text-muted-foreground" />,
      onClick: () => setActiveSection('overview'),
    },
    {
      label: 'My Assessments',
      href: '#',
      icon: <BarChart3 className="h-5 w-5 flex-shrink-0 text-muted-foreground" />,
      onClick: () => setActiveSection('assessments'),
    },
    {
      label: 'Subscription',
      href: '#',
      icon: <Crown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />,
      onClick: () => setActiveSection('subscription'),
    },
    {
      label: 'Business',
      href: '#',
      icon: <Briefcase className="h-5 w-5 flex-shrink-0 text-muted-foreground" />,
      onClick: () => setActiveSection('business'),
    },
    {
      label: 'Settings',
      href: '#',
      icon: <Settings className="h-5 w-5 flex-shrink-0 text-muted-foreground" />,
      onClick: () => setActiveSection('settings'),
    },
  ];

  const logoutLink = {
    label: 'Sign Out',
    href: '#',
    icon: <LogOut className="h-5 w-5 flex-shrink-0 text-destructive" />,
    onClick: signOut,
  };

  const userProfile = {
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    avatarUrl: avatarUrl,
    userId: user?.id,
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const newAvatarUrl = `${publicUrl}?t=${Date.now()}`;

      await supabase.from('profiles').upsert({
        user_id: user.id,
        avatar_url: newAvatarUrl,
      }, { onConflict: 'user_id' });

      setAvatarUrl(newAvatarUrl);
      toast({ title: "Avatar updated", description: "Your profile picture has been updated" });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({ title: "Upload failed", description: "Failed to upload avatar. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      <FloatingHeader />
      
      <div className="flex flex-1 w-full">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {/* User Profile with Avatar Upload */}
              <div className="flex items-center gap-3 mb-6">
                <div className="relative group">
                  {userProfile.avatarUrl ? (
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.name}
                      className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                      {userProfile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <motion.div
                  animate={{
                    display: sidebarOpen ? "block" : "none",
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  className="overflow-hidden"
                >
                  <p className="font-medium text-sm text-foreground truncate">{userProfile.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
                </motion.div>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col gap-2">
                {sidebarLinks.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>
            </div>

            {/* Logout at bottom */}
            <div className="border-t border-border pt-4">
              <SidebarLink link={logoutLink} />
            </div>
          </SidebarBody>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 md:p-8 overflow-auto">
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
                      <h1 className="text-3xl font-bold text-foreground">
                        Welcome back, {userProfile.name}
                      </h1>
                      <p className="text-muted-foreground mt-1">Here's an overview of your account</p>
                    </div>

                    {/* Subscription Renewal Banner */}
                    {subscription.isSubscribed && (
                      <SubscriptionRenewalBanner subscriptionEnd={subscription.subscriptionEnd} />
                    )}

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

                    {/* In-Progress Assessments */}
                    {inProgressAssessments.length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-primary" />
                          Continue Where You Left Off
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                          {inProgressAssessments.map((progress) => (
                            <Card key={progress.id} className="shadow-elegant border-primary/30 bg-primary/5">
                              <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <h3 className="font-semibold">{getAssessmentTypeLabel(progress.assessment_type)}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {progress.answeredCount} of {progress.totalQuestions} questions answered
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="border-primary/50 text-primary">
                                    {Math.round((progress.answeredCount / progress.totalQuestions) * 100)}%
                                  </Badge>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 mb-4">
                                  <div
                                    className="bg-primary h-2 rounded-full transition-all"
                                    style={{ width: `${(progress.answeredCount / progress.totalQuestions) * 100}%` }}
                                  />
                                </div>
                                <Button 
                                  className="w-full flex items-center gap-2"
                                  onClick={() => navigate(`/${progress.assessment_type}-assessment`)}
                                >
                                  <Play className="w-4 h-4" />
                                  Resume Assessment
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

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
                                            // Handle B2B/professional assessment types
                                            if (assessment.assessment_type.startsWith('professional_')) {
                                              localStorage.setItem('professionalAssessmentResults', JSON.stringify(assessment.results));
                                              navigate('/b2b/results');
                                            } else {
                                              const storageKey = `${assessment.assessment_type}AssessmentResults`;
                                              localStorage.setItem(storageKey, JSON.stringify(assessment.results));
                                              navigate(`/${assessment.assessment_type}-results`);
                                            }
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

                {/* Subscription Section */}
                {activeSection === 'subscription' && (
                  <>
                    <div className="mb-6">
                      <h1 className="text-3xl font-bold">Subscription</h1>
                      <p className="text-muted-foreground mt-1">Manage your subscription and benefits</p>
                    </div>

                    {subscription.isSubscribed ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Subscription Status */}
                        <SubscriptionStatus 
                          tier={subscription.tier} 
                          subscriptionEnd={subscription.subscriptionEnd} 
                          onRefresh={refreshSubscription}
                        />

                        {/* Progress Tracking (if feature enabled) */}
                        {subscription.features?.progressTracking && (
                          <ProgressTracking />
                        )}

                        {/* Family Member Manager (if family plan) */}
                        {subscription.features?.familyMembers > 0 && (
                          <div className="md:col-span-2">
                            <FamilyMemberManager />
                          </div>
                        )}

                        {/* Subscription Benefits Summary */}
                        <Card className="md:col-span-2 shadow-elegant border-border/20">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Crown className="w-5 h-5 text-primary" />
                              Your Benefits
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                              <div className={cn(
                                "p-4 rounded-lg border",
                                subscription.features?.unlimitedRetakes 
                                  ? "bg-primary/5 border-primary/20" 
                                  : "bg-muted/50 border-border"
                              )}>
                                <p className="font-medium text-sm">Unlimited Retakes</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {subscription.features?.unlimitedRetakes ? "Included" : "Not included"}
                                </p>
                              </div>
                              <div className={cn(
                                "p-4 rounded-lg border",
                                subscription.features?.progressTracking 
                                  ? "bg-primary/5 border-primary/20" 
                                  : "bg-muted/50 border-border"
                              )}>
                                <p className="font-medium text-sm">Progress Tracking</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {subscription.features?.progressTracking ? "Included" : "Not included"}
                                </p>
                              </div>
                              <div className={cn(
                                "p-4 rounded-lg border",
                                subscription.features?.allAssessments 
                                  ? "bg-primary/5 border-primary/20" 
                                  : "bg-muted/50 border-border"
                              )}>
                                <p className="font-medium text-sm">All Assessments</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {subscription.features?.allAssessments ? "Unlocked" : "Not included"}
                                </p>
                              </div>
                              <div className={cn(
                                "p-4 rounded-lg border",
                                subscription.features?.aiJobMatching 
                                  ? "bg-primary/5 border-primary/20" 
                                  : "bg-muted/50 border-border"
                              )}>
                                <p className="font-medium text-sm">AI Job Matching</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {subscription.features?.aiJobMatching ? "Included" : "Not included"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2">
                        <SubscriptionUpgradeCTA />
                        
                        <Card className="shadow-elegant border-border/20">
                          <CardHeader>
                            <CardTitle className="text-lg">Why Subscribe?</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                              Unlock the full potential of your leadership journey with a subscription:
                            </p>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                Retake assessments anytime to track growth
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                See how your results evolve over time
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                Access all assessment types
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                Share with family members
                              </li>
                            </ul>
                            <Button asChild className="w-full">
                              <Link to="/pricing">View All Plans</Link>
                            </Button>
                          </CardContent>
                        </Card>
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

                    {/* Email Settings Card */}
                    <Card className="shadow-elegant border-border/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Mail className="w-5 h-5" />
                          Email Address
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-medium">{user?.email}</p>
                        <p className="text-sm text-muted-foreground">Your current email address</p>
                      </CardContent>
                    </Card>

                    {/* Password & Security Card */}
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

                    {/* Link Google Account Card */}
                    <Card className="shadow-elegant border-border/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Google Account
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {hasGoogleLinked ? (
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            Google account linked
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-muted-foreground">
                              Link your Google account for easier sign-in
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleLinkGoogle}
                              disabled={googleLinking}
                            >
                              {googleLinking ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Connecting...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                    <path
                                      fill="currentColor"
                                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                      fill="currentColor"
                                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                      fill="currentColor"
                                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                      fill="currentColor"
                                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                  </svg>
                                  Link Google Account
                                </>
                              )}
                            </Button>
                          </>
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
    );
  };

export default Dashboard;
