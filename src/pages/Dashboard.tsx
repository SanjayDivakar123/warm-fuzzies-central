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
import { Navbar } from "@/components/navigation/Navbar";

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
  Shield,
  Target,
  Sparkles,
  Lock,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Star,
  Upload
} from "lucide-react";
import { format } from "date-fns";
import { exportToPDF } from "@/lib/pdfExport";
import AssessmentDetails from "@/components/AssessmentDetails";
import { cn } from "@/lib/utils";
import { PaymentButton } from "@/components/payment/PaymentButton";
import { careerProfiles, getCareerProfile } from "@/lib/careerData";
import ResumeCareerUpload from "@/components/career/ResumeCareerUpload";
import PublicRoleColorProfileSettings from "@/components/profile/PublicRoleColorProfileSettings";

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
  companyId: string;
  role: 'admin' | 'hr' | 'partner' | 'employee';
  status: 'invited' | 'active' | 'revoked';
  companyName: string;
  subdomain: string;
}

// Career Finder Section Component
interface CareerFinderSectionProps {
  user: any;
  assessments: AssessmentResult[];
  navigate: (path: string) => void;
}

const CareerFinderSection = ({ user, assessments, navigate }: CareerFinderSectionProps) => {
  const [loading, setLoading] = useState(true);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [hasCareerAccess, setHasCareerAccess] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      checkCareerStatus();
    }
  }, [user, assessments]);

  const checkCareerStatus = () => {
    // Check for career report access from localStorage
    const careerAccessKey = `career_access_${user.id}`;
    const careerAccess = localStorage.getItem(careerAccessKey);
    setHasCareerAccess(careerAccess ? JSON.parse(careerAccess).verified : false);

    // Find a completed assessment with color results
    const completedAssessment = assessments?.find(a => {
      const results = a.results as any;
      const assessmentType = a.assessment_type;
      if (assessmentType === 'free') return false;
      return results?.primaryColor || results?.dominantColor || 
             (results?.colorScores && Object.keys(results.colorScores).length > 0) ||
             (results?.scores && Object.keys(results.scores).length > 0);
    });

    if (completedAssessment) {
      const results = completedAssessment.results as any;
      const color = results?.primaryColor || results?.dominantColor || null;
      setPrimaryColor(color);
      setHasCompletedAssessment(true);
      if (color) {
        setProfile(getCareerProfile(color));
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // User hasn't completed a qualifying assessment
  if (!hasCompletedAssessment) {
    return (
      <>
        {/* Section Header */}
        <div className="relative mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent border border-primary/20">
          <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white">
                <Target className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              Career Finder
            </h1>
            <p className="text-muted-foreground mt-2">
              Discover careers that match your RoleColor
            </p>
          </div>
        </div>

        {/* Requirement Notice */}
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Assessment Required</h3>
                <p className="text-muted-foreground mb-4">
                  To get personalized career recommendations based on your RoleColor, complete a 25-question or 50-question assessment first.
                </p>
                <div className="flex flex-wrap gap-3">
                  <PaymentButton productType="premium" variant="default" size="lg">
                    Get Premium Assessment ($124.99)
                  </PaymentButton>
                  <PaymentButton productType="pro" variant="outline" size="lg">
                    Get Pro Assessment ($199.99)
                  </PaymentButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                What You'll Discover
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['Top 8 careers matched to your RoleColor', 'Salary ranges for each career path', 'Role fit percentages based on your profile', 'Key skills needed for each role', 'Ideal work environment insights'].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Career Preview by Color
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(careerProfiles).slice(0, 4).map(([color, prof]) => (
                <div key={color} className="flex items-center gap-3">
                  <span className="text-2xl">{prof.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{prof.archetype}</p>
                    <p className="text-xs text-muted-foreground">
                      {prof.careers[0].title}, {prof.careers[1].title}...
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // User has completed assessment - show career finder
  return (
    <>
      {/* Section Header */}
      <div className="relative mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent border border-primary/20">
        <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white">
              <Target className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            Career Finder
          </h1>
          <p className="text-muted-foreground mt-2">
            {hasCareerAccess 
              ? `Career recommendations for ${profile?.archetype}s` 
              : 'Unlock your personalized career recommendations'}
          </p>
        </div>
      </div>

      {/* User's Color Profile Summary */}
      {profile && (
        <Card className="mb-6 border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center text-4xl">
                {profile.emoji}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Your RoleColor</p>
                <h3 className="text-2xl font-bold">{profile.colorName} - {profile.archetype}</h3>
                <p className="text-muted-foreground">{profile.tagline}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasCareerAccess ? (
        <>
          {/* Career Report Unlocked */}
          <Card className="mb-6 border-green-500/50">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Career Report Unlocked!</h3>
              <p className="text-muted-foreground mb-4">
                View your personalized career recommendations and AI-powered resume analysis.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={() => navigate('/career-finder/results')} className="gap-2">
                  View Career Matches
                  <ChevronRight className="w-4 h-4" />
                </Button>
                {localStorage.getItem(`career_resume_analysis_${user?.id}`) && (
                  <Button variant="outline" onClick={() => navigate('/career-finder/resume-results')} className="gap-2">
                    <FileText className="w-4 h-4" />
                    View Resume Analysis
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resume Upload Section */}
          {user && primaryColor && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Upload Resume for AI Analysis
              </h3>
              <ResumeCareerUpload primaryColor={primaryColor} userId={user.id} />
            </div>
          )}

          {/* Career Preview */}
          {profile && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Top Careers for {profile.archetype}s</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {profile.careers.slice(0, 4).map((career: any, index: number) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{career.fitPercentage}% fit</Badge>
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <DollarSign className="w-3 h-3" />
                          {career.salaryRange}
                        </div>
                      </div>
                      <h4 className="font-semibold">{career.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{career.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button 
                variant="link" 
                onClick={() => navigate('/career-finder/results')} 
                className="mt-4 gap-2"
              >
                View all 8 career matches
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Unlock Career Report */}
          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Unlock Your Career Report</h3>
                <p className="text-muted-foreground">
                  Get personalized career recommendations and AI-powered resume analysis
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  What's included:
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {['8 top careers for your color', 'Salary ranges & fit %', 'Required skills breakdown', 'Ideal work environment', 'AI resume analysis', 'Personalized advice'].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <div className="mb-4">
                  <span className="text-4xl font-bold">$19</span>
                  <span className="text-muted-foreground ml-2">one-time</span>
                </div>
                <PaymentButton productType="career" size="lg" className="gap-2">
                  Unlock Career Report
                  <ChevronRight className="w-4 h-4" />
                </PaymentButton>
                <p className="text-xs text-muted-foreground mt-4">
                  Instant access after payment
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview Cards */}
          {profile && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Preview: Top Careers for {profile.archetype}s</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {profile.careers.slice(0, 3).map((career: any, index: number) => (
                  <Card key={index} className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
                    <CardContent className="p-4 relative">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{career.fitPercentage}% fit</Badge>
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <h4 className="font-semibold">{career.title}</h4>
                      <p className="text-sm text-muted-foreground blur-sm">{career.description}</p>
                      <p className="text-sm font-medium text-primary mt-2 blur-sm">{career.salaryRange}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-center text-muted-foreground mt-4 text-sm">
                Unlock to see all 8 careers with full details
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
};

const Dashboard = () => {
  const { user, updatePassword, signOut, signInWithGoogle } = useAuth();
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
  const [activeSection, setActiveSection] = useState<'overview' | 'assessments' | 'settings' | 'business' | 'career'>('overview');
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
    if (!user) {
      setCompanyAccessList([]);
      return;
    }

    try {
      const userEmail = (user.email || '').trim();
      const accessFilter = userEmail
        ? `user_id.eq.${user.id},email.ilike.${userEmail}`
        : `user_id.eq.${user.id}`;

      const { data: companyUsers, error } = await supabase
        .from('company_users')
        .select(`
          id, 
          role, 
          status,
          user_id,
          email,
          company_id,
          companies:company_id (
            id,
            name,
            subdomain
          )
        `)
        .in('status', ['active', 'invited'])
        .or(accessFilter);

      if (error || !companyUsers || companyUsers.length === 0) {
        setCompanyAccessList([]);
        return;
      }

      const rowsToLink = companyUsers.filter(
        (cu) => !cu.user_id && typeof cu.email === 'string' && cu.email.toLowerCase() === userEmail.toLowerCase(),
      );

      if (rowsToLink.length > 0) {
        await Promise.all(
          rowsToLink.map((cu) =>
            supabase
              .from('company_users')
              .update({
                user_id: user.id,
                joined_at: new Date().toISOString(),
              })
              .eq('id', cu.id),
          ),
        );
      }

      const accessList = companyUsers
        .filter(cu => cu.companies)
        .map(cu => {
          const company = cu.companies as { id: string; name: string; subdomain: string };
          return {
            id: cu.id,
            companyId: company.id,
            role: cu.role as 'admin' | 'hr' | 'partner' | 'employee',
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
  // Admin, HR, and Partner roles can access the admin dashboard
  const adminCompanies = activeCompanies.filter(c => ['admin', 'hr', 'partner'].includes(c.role));
  const employeeCompanies = activeCompanies.filter(c => c.role === 'employee');
  const isRcfSuperAdmin = ['sanjay@rolecolorfinder.com', 'tristan@rolecolorfinder.com', 'aaron@rolecolor.com', 'kody@rolecolor.com'].includes((user?.email || '').toLowerCase());

  // Get role display label
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return { label: 'Admin', color: 'bg-green-500/20 text-green-700 dark:text-green-300' };
      case 'hr': return { label: 'HR', color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300' };
      case 'partner': return { label: 'Partner', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-300' };
      default: return { label: 'Employee', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300' };
    }
  };

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
      label: 'Business',
      href: '#',
      icon: <Briefcase className="h-5 w-5 flex-shrink-0 text-muted-foreground" />,
      onClick: () => setActiveSection('business'),
    },
    {
      label: 'Career Finder',
      href: '#',
      icon: <Target className="h-5 w-5 flex-shrink-0 text-muted-foreground" />,
      onClick: () => setActiveSection('career'),
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
      <div className="min-h-screen bg-background pt-20">
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

      const uploadBuckets = ['avatars', 'public-profile-photos', 'company-logos'];
      let selectedBucket: string | null = null;
      let lastError: any = null;

      for (const bucket of uploadBuckets) {
        const result = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { upsert: true });

        if (!result.error) {
          selectedBucket = bucket;
          break;
        }

        lastError = result.error;
        const message = (result.error.message || '').toLowerCase();
        if (!message.includes('bucket') && !message.includes('not found')) {
          break;
        }
      }

      let newAvatarUrl = '';
      if (!selectedBucket) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newAvatarUrl = dataUrl;
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from(selectedBucket)
          .getPublicUrl(filePath);
        newAvatarUrl = `${publicUrl}?t=${Date.now()}`;
      }

      await supabase.from('profiles').upsert({
        user_id: user.id,
        avatar_url: newAvatarUrl,
      }, { onConflict: 'user_id' });

      setAvatarUrl(newAvatarUrl);
      toast({
        title: "Avatar updated",
        description: selectedBucket
          ? (selectedBucket === 'avatars'
              ? "Your profile picture has been updated"
              : `Your profile picture was saved using ${selectedBucket}`)
          : "Your profile picture was saved without storage bucket dependency.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: (error as any)?.message || "Failed to upload avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col w-full overflow-x-hidden pt-20">
      <Navbar />
      
      {/* Mobile Dashboard Header - shown only on mobile */}
      <div className="md:hidden flex items-center h-12 px-4 bg-card border-b border-border w-full gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-accent rounded-md"
          aria-label="Toggle sidebar"
        >
          {/* Sidebar toggle icon */}
          <svg className="h-5 w-5 text-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h6M4 12h10M4 18h6" />
          </svg>
        </button>
        <span className="text-sm font-medium text-foreground">Dashboard</span>
      </div>
      
      <div className="flex flex-1 w-full overflow-hidden">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
          <SidebarBody className="justify-between gap-10 md:my-2 md:mr-2 md:rounded-2xl">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {/* User Profile with Avatar Upload */}
              <div className="flex items-center mb-6 min-h-8">
                <div className="relative group shrink-0">
                  {userProfile.avatarUrl ? (
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
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
                  initial={false}
                  animate={{
                    opacity: sidebarOpen ? 1 : 0,
                    width: sidebarOpen ? 190 : 0,
                    x: sidebarOpen ? 0 : -6,
                  }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="ml-3 overflow-hidden whitespace-nowrap"
                  aria-hidden={!sidebarOpen}
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
        <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-8 overflow-x-hidden overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading your dashboard...</p>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                {/* Overview Section */}
                {activeSection === 'overview' && (
                  <>
                    {/* Welcome Banner with Gradient */}
                    <div className="relative mb-6 sm:mb-8 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-24 sm:w-48 h-24 sm:h-48 bg-gradient-to-tr from-green-500/10 to-transparent rounded-full blur-3xl" />
                      <div className="relative z-10">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
                          Welcome back, {userProfile.name} 👋
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-base md:text-lg">Here's an overview of your account and recent activity</p>
                      </div>
                    </div>

                    {/* Quick Stats - Colorful Gradient Cards */}
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                        <CardContent className="pt-4 sm:pt-6 relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-3xl sm:text-4xl font-bold">{assessments.length}</p>
                              <p className="text-xs sm:text-sm text-white/80 mt-1">Total Assessments</p>
                            </div>
                            <div className="p-2 sm:p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/20 hover:shadow-xl hover:shadow-yellow-500/30 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                        <CardContent className="pt-4 sm:pt-6 relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-3xl sm:text-4xl font-bold">{activeCompanies.length}</p>
                              <p className="text-xs sm:text-sm text-white/80 mt-1">Active Businesses</p>
                            </div>
                            <div className="p-2 sm:p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 hover:-translate-y-1 sm:col-span-2 md:col-span-1">
                        <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                        <CardContent className="pt-4 sm:pt-6 relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-3xl sm:text-4xl font-bold">
                                {assessments.filter(a => a.results.dominantColor).length}
                              </p>
                              <p className="text-xs sm:text-sm text-white/80 mt-1">Completed</p>
                            </div>
                            <div className="p-2 sm:p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Assessment - Enhanced Card */}
                    {assessments.length > 0 && assessments[0].results.dominantColor && (
                      <Card className="relative overflow-hidden shadow-lg border-border/20 bg-gradient-to-r from-background to-muted/30">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full" />
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                              <BarChart3 className="h-5 w-5 text-blue-500" />
                            </div>
                            Latest Result
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <p className="text-lg font-semibold">
                                {getAssessmentTypeLabel(assessments[0].assessment_type)}
                              </p>
                              <Badge className={`${getColorBadgeStyle(assessments[0].results.dominantColor)} text-sm px-3 py-1`}>
                                {getColorLabel(assessments[0].results.dominantColor)}
                              </Badge>
                            </div>
                            <Button 
                              variant="outline" 
                              onClick={() => setActiveSection('assessments')}
                              className="group"
                            >
                              View All
                              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Pending Invites Alert - Enhanced */}
                    {pendingInvites.length > 0 && (
                      <Card className="relative overflow-hidden border-yellow-400/50 bg-gradient-to-r from-yellow-50 to-amber-50/50 dark:from-yellow-950/30 dark:to-amber-950/20 shadow-lg shadow-yellow-500/10">
                        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-bl from-yellow-400/10 to-transparent rounded-full" />
                        <CardContent className="pt-4 sm:pt-6 relative z-10">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/30 flex-shrink-0">
                              <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-base sm:text-lg text-yellow-800 dark:text-yellow-200">
                                {pendingInvites.length} Pending Invitation{pendingInvites.length > 1 ? 's' : ''}
                              </p>
                              <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                                Check your Business section to accept or decline
                              </p>
                            </div>
                            <Button 
                              onClick={() => setActiveSection('business')}
                              className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 hover:from-yellow-600 hover:to-amber-600 shadow-lg shadow-yellow-500/25 w-full sm:w-auto"
                            >
                              View Invites
                              <ChevronRight className="h-4 w-4 ml-2" />
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
                    {/* Section Header with Gradient */}
                    <div className="relative mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/20">
                      <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl" />
                      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            My Assessments
                          </h1>
                          <p className="text-muted-foreground mt-2 text-sm sm:text-base">View and manage your assessment results</p>
                        </div>
                        <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600 w-full sm:w-auto">
                          <Link to="/pricing">
                            <Plus className="w-4 h-4 mr-2" />
                            New Assessment
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* In-Progress Assessments - Enhanced */}
                    {inProgressAssessments.length > 0 && (
                      <div className="mb-6 sm:mb-8">
                        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-orange-500/10">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                          </div>
                          Continue Where You Left Off
                        </h2>
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                          {inProgressAssessments.map((progress) => (
                            <Card key={progress.id} className="relative overflow-hidden border-orange-400/30 bg-gradient-to-br from-orange-50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/10 shadow-lg hover:shadow-xl transition-all duration-300">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-400/10 to-transparent rounded-full" />
                              <CardContent className="pt-6 relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <h3 className="font-bold text-lg">{getAssessmentTypeLabel(progress.assessment_type)}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {progress.answeredCount} of {progress.totalQuestions} questions answered
                                    </p>
                                  </div>
                                  <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
                                    {Math.round((progress.answeredCount / progress.totalQuestions) * 100)}%
                                  </Badge>
                                </div>
                                <div className="w-full bg-orange-200/50 dark:bg-orange-900/30 rounded-full h-3 mb-4 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all"
                                    style={{ width: `${(progress.answeredCount / progress.totalQuestions) * 100}%` }}
                                  />
                                </div>
                                <Button 
                                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25"
                                  onClick={() => navigate(`/${progress.assessment_type}-assessment`)}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Resume Assessment
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {assessments.length > 0 ? (
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        {assessments.map((assessment) => {
                          const isCompleted = assessment.results.dominantColor || assessment.results.scores;
                          const isPurchasedOnly = assessment.results.status === 'payment_completed' && !isCompleted;
                          
                          // Get color for card accent based on dominant color
                          const getCardAccent = () => {
                            const color = assessment.results.dominantColor;
                            if (!color || isPurchasedOnly) return 'from-gray-500/10 to-transparent border-gray-300/30';
                            if (color === 'red') return 'from-red-500/10 to-transparent border-red-300/30';
                            if (color === 'yellow') return 'from-yellow-500/10 to-transparent border-yellow-300/30';
                            if (color === 'green') return 'from-green-500/10 to-transparent border-green-300/30';
                            if (color === 'blue') return 'from-blue-500/10 to-transparent border-blue-300/30';
                            return 'from-gray-500/10 to-transparent border-gray-300/30';
                          };
                          
                          return (
                            <Card key={assessment.id} className={`relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${getCardAccent()}`}>
                              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-4 translate-x-4" />
                              <CardHeader className="pb-3 relative z-10">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-lg font-bold">
                                      {getAssessmentTypeLabel(assessment.assessment_type)}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                      <Calendar className="w-4 h-4" />
                                      {format(new Date(assessment.created_at), 'MMM dd, yyyy')}
                                    </div>
                                  </div>
                                  <Badge variant={isPurchasedOnly ? "secondary" : "outline"} className={isPurchasedOnly ? "bg-gray-100 text-gray-600" : "border-primary/30"}>
                                    {isPurchasedOnly ? 'Not Started' : assessment.assessment_type}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3 relative z-10">
                                {isPurchasedOnly ? (
                                  <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                      Assessment purchased but not yet completed
                                    </p>
                                    <Button 
                                      size="sm" 
                                      asChild
                                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600"
                                    >
                                      <Link to={`/${assessment.assessment_type}-assessment`}>
                                        <Play className="w-4 h-4 mr-2" />
                                        Start Assessment
                                      </Link>
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    {assessment.results.dominantColor && (
                                      <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">Primary Role:</p>
                                        <Badge className={`${getColorBadgeStyle(assessment.results.dominantColor)} px-3 py-1`}>
                                          {getColorLabel(assessment.results.dominantColor)}
                                        </Badge>
                                      </div>
                                    )}
                                    <div className="flex gap-2 pt-2 flex-wrap">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleDownloadReport(assessment)}
                                        className="hover:bg-primary/5"
                                      >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setSelectedAssessment(assessment)}
                                        className="hover:bg-primary/5"
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
                                          className="hover:bg-primary/5"
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
                      <div className="text-center py-16 px-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                          <BarChart3 className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">No assessments yet</h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                          Take your first assessment to discover your leadership color role and unlock personalized insights
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                          <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25">
                            <Link to="/free-assessment">
                              Start Free Assessment
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="lg" asChild>
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
                    {/* Section Header with Gradient */}
                    <div className="relative mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-500/20">
                      <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-full blur-3xl" />
                      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 text-white">
                              <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            Business
                          </h1>
                          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your business accounts and team invitations</p>
                        </div>
                        <Button asChild className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 hover:from-yellow-600 hover:to-amber-600 w-full sm:w-auto">
                          <Link to="/pricing#for-teams">
                            <Plus className="w-4 h-4 mr-2" />
                            Start Business
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Pending Invites */}
                    {pendingInvites.length > 0 && (
                      <section className="mb-6 sm:mb-8">
                        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-yellow-500/10">
                            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                          </div>
                          Pending Invitations
                          <Badge className="bg-yellow-500 text-white">{pendingInvites.length}</Badge>
                        </h2>
                        <div className="space-y-3">
                          {pendingInvites.map((invite) => (
                            <Card key={invite.id} className="relative overflow-hidden shadow-lg border-yellow-400/30 bg-gradient-to-br from-yellow-50 to-amber-50/50 dark:from-yellow-950/20 dark:to-amber-950/10 hover:shadow-xl transition-all duration-300">
                              <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-bl from-yellow-400/10 to-transparent rounded-full" />
                              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 sm:py-5 relative z-10">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-base sm:text-lg">{invite.companyName}</h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                      Invited as <span className="font-medium text-yellow-600 dark:text-yellow-400">{invite.role}</span>
                                    </p>
                                  </div>
                                </div>
                                <Button onClick={() => navigate(`/company/${invite.subdomain}`)} className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 hover:from-yellow-600 hover:to-amber-600 shadow-lg shadow-yellow-500/25 w-full sm:w-auto">
                                  Accept Invite
                                  <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Your Businesses (Admin) */}
                    {adminCompanies.length > 0 && (
                      <section className="mb-6 sm:mb-8">
                        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-green-500/10">
                            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                          </div>
                          Your Businesses
                        </h2>
                        <div className="space-y-3">
                          {adminCompanies.map((company) => (
                            <Card key={company.id} className="relative overflow-hidden shadow-lg border-green-400/30 bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/10 hover:shadow-xl transition-all duration-300">
                              <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-bl from-green-400/10 to-transparent rounded-full" />
                              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 sm:py-5 relative z-10">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-base sm:text-lg">{company.companyName}</h3>
                                    <Badge className={`mt-1 border-0 ${getRoleBadge(company.role).color}`}>{getRoleBadge(company.role).label}</Badge>
                                  </div>
                                </div>
                                <Button onClick={() => navigate(`/b2b/company-portal?company=${company.companyId}`)} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/25 w-full sm:w-auto">
                                  <Building2 className="w-4 h-4 mr-2" />
                                  {company.role === 'admin' ? 'Admin Dashboard' : company.role === 'hr' ? 'HR Portal' : 'Partner Portal'}
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* RCF Super Admin Dashboard */}
                    {isRcfSuperAdmin && (
                      <section className="mb-6 sm:mb-8">
                        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-violet-500/10">
                            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                          </div>
                          Role Color Finder Admin
                        </h2>
                        <Card className="relative overflow-hidden shadow-lg border-violet-400/30 bg-gradient-to-br from-violet-50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/10 hover:shadow-xl transition-all duration-300">
                          <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-bl from-violet-400/10 to-transparent rounded-full" />
                          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 sm:py-5 relative z-10">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-base sm:text-lg">RCF Super-Admin Portal</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  View all B2B companies, company users, platform accounts, and contact queries
                                </p>
                              </div>
                            </div>
                            <Button onClick={() => navigate('/admin/rcf-b2b')} className="bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white border-0 hover:from-violet-600 hover:to-fuchsia-700 shadow-lg shadow-violet-500/25 w-full sm:w-auto">
                              <Shield className="w-4 h-4 mr-2" />
                              Admin Dashboard
                            </Button>
                          </CardContent>
                        </Card>
                      </section>
                    )}

                    {/* Businesses You're Part Of (Employee) */}
                    {employeeCompanies.length > 0 && (
                      <section className="mb-6 sm:mb-8">
                        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-blue-500/10">
                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          </div>
                          Businesses You're Part Of
                        </h2>
                        <div className="space-y-3">
                          {employeeCompanies.map((company) => (
                            <Card key={company.id} className="relative overflow-hidden shadow-lg border-blue-400/30 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 hover:shadow-xl transition-all duration-300">
                              <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-full" />
                              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 sm:py-5 relative z-10">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-base sm:text-lg">{company.companyName}</h3>
                                    <Badge className="mt-1 bg-blue-500/20 text-blue-700 dark:text-blue-300 border-0">Employee</Badge>
                                  </div>
                                </div>
                                <Button variant="outline" onClick={() => navigate(`/company/${company.subdomain}`)} className="border-blue-400/50 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 w-full sm:w-auto">
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
                      <div className="text-center py-16 px-8">
                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                          <Briefcase className="w-12 h-12 text-yellow-600" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">No businesses yet</h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                          Start a business account to unlock team assessments, analytics, and AI-powered work assignments for your organization.
                        </p>
                        <Button size="lg" asChild className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 hover:from-yellow-600 hover:to-amber-600 shadow-lg shadow-yellow-500/25">
                          <Link to="/pricing#for-teams">
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
                    {/* Section Header with Gradient */}
                    <div className="relative mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-500/10 via-slate-500/5 to-transparent border border-gray-500/20">
                      <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-gradient-to-bl from-gray-500/5 to-transparent rounded-full blur-3xl" />
                      <div className="relative z-10">
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-gray-600 to-slate-700 text-white">
                            <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          Account Settings
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your account preferences and security</p>
                      </div>
                    </div>

                    <div className="grid gap-6">
                    {/* Email Settings Card */}
                    <Card className="relative overflow-hidden shadow-lg border-blue-400/20 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-400/5 to-transparent rounded-full" />
                      <CardHeader className="pb-3 relative z-10">
                        <CardTitle className="text-lg flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <Mail className="w-5 h-5 text-blue-500" />
                          </div>
                          Email Address
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <p className="text-base font-semibold">{user?.email}</p>
                        <p className="text-sm text-muted-foreground">Your current email address</p>
                      </CardContent>
                    </Card>

                    {/* Password & Security Card */}
                    <Card className="relative overflow-hidden shadow-lg border-purple-400/20 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-400/5 to-transparent rounded-full" />
                      <CardHeader className="pb-3 relative z-10">
                        <CardTitle className="text-lg flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-500/10">
                            <KeyRound className="w-5 h-5 text-purple-500" />
                          </div>
                          Password & Security
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 relative z-10">
                        <div className="text-sm text-muted-foreground">
                          Manage your account password and security settings
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowPasswordChange(!showPasswordChange)}
                          className="border-purple-400/50 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                        >
                          <KeyRound className="w-4 h-4 mr-2" />
                          {showPasswordChange ? 'Hide' : 'Change Password'}
                        </Button>
                        
                        {showPasswordChange && (
                          <form onSubmit={handlePasswordChange} className="space-y-4 pt-4 border-t border-purple-200/50 dark:border-purple-800/30">
                            <div className="space-y-2">
                              <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                              <Input
                                id="new-password"
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="border-purple-200/50 focus:border-purple-400"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                              <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="border-purple-200/50 focus:border-purple-400"
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button type="submit" size="sm" disabled={passwordLoading} className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 hover:from-purple-600 hover:to-purple-700">
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
                    <Card className="relative overflow-hidden shadow-lg border-red-400/20 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-400/5 to-transparent rounded-full" />
                      <CardHeader className="pb-3 relative z-10">
                        <CardTitle className="text-lg flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-red-500/10">
                            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24">
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
                          </div>
                          Google Account
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 relative z-10">
                        {hasGoogleLinked ? (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              Google account linked successfully
                            </span>
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
                              className="border-red-400/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
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

                    <PublicRoleColorProfileSettings
                      userId={user.id}
                      userEmail={user.email}
                      displayName={user.user_metadata?.full_name || user.email?.split('@')[0]}
                      defaultAvatarUrl={avatarUrl}
                      assessments={assessments}
                    />
                    </div>
                  </>
                )}

                {/* Career Finder Section */}
                {activeSection === 'career' && (
                  <CareerFinderSection 
                    user={user}
                    assessments={assessments}
                    navigate={navigate}
                  />
                )}
              </div>
            )}

            {/* Assessment Details Modal */}
            {selectedAssessment && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-border/50">
                  <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-transparent flex justify-between items-center">
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
