import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/navigation/Navbar";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, Shield, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const { toast } = useToast();
  const { signUp, signIn, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      if (error.message.includes("already registered")) {
        toast({
          title: "Account Already Exists",
          description: "An account with this email already exists. Please sign in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Check Your Email",
        description: "We've sent you a confirmation link and token. Please check your email to complete signup.",
      });
      setShowTokenDialog(true);
    }
    setLoading(false);
  };

  const handleVerifyToken = async () => {
    if (!verificationToken || !email) {
      toast({
        title: "Missing Information",
        description: "Please enter the verification token from your email.",
        variant: "destructive",
      });
      return;
    }

    setTokenLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: verificationToken,
      type: 'email',
    });

    if (error) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Your email has been verified. You can now sign in.",
      });
      setShowTokenDialog(false);
      setVerificationToken("");
    }
    setTokenLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast({
          title: "Invalid Credentials",
          description: "The email or password you entered is incorrect.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);
    const { error } = await resetPassword(email);
    
    if (error) {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset Link Sent",
        description: "Please check your email for password reset instructions.",
      });
    }
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Background */}
      <div className="relative overflow-hidden mesh-background">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/80"></div>
        
        {/* Floating elements */}
        <div className="absolute top-32 left-[15%] w-64 h-64 bg-gradient-primary rounded-full blur-3xl opacity-10 animate-bounce-gentle"></div>
        <div className="absolute bottom-32 right-[20%] w-48 h-48 bg-gradient-green rounded-full blur-2xl opacity-8 animate-bounce-gentle delay-1000"></div>
        
        <div className="relative section-padding">
          <div className="container-wide">
            <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">
              
              {/* Left Content */}
              <div className="text-center lg:text-left space-y-8">
                <div className="space-y-6 animate-fade-in">
                  <div className="inline-flex items-center gap-3 glass-card px-6 py-3 rounded-full border border-primary/30">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold text-primary tracking-wide">Welcome Back</span>
                  </div>
                  
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-balance">
                    Your Leadership
                    <br />
                    <span className="gradient-text-primary">Journey Continues</span>
                  </h1>
                  
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Access your personalized leadership assessments, track your progress, and unlock deeper insights into your unique color profile.
                  </p>
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-3 gap-6 animate-fade-in delay-300">
                  <div className="text-center">
                    <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">Secure & Private</p>
                    <p className="text-xs text-muted-foreground">Your data is protected</p>
                  </div>
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 text-green mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">Science-Based</p>
                    <p className="text-xs text-muted-foreground">Research-backed insights</p>
                  </div>
                  <div className="text-center">
                    <User className="w-12 h-12 text-yellow mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">Personalized</p>
                    <p className="text-xs text-muted-foreground">Tailored to you</p>
                  </div>
                </div>
              </div>

              {/* Right Auth Form */}
              <div className="relative max-w-md mx-auto w-full animate-fade-in delay-200">
                <div className="relative group">
                  {/* Background glow */}
                  <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                  
                  {/* Main card */}
                  <Card className="glass-card-strong rounded-3xl shadow-xl border-2 border-primary/20 relative hover-lift">
                    <CardHeader className="text-center pb-4">
                      <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-blue">
                        <img 
                          src="/lovable-uploads/role-color-finder-halloween.svg" 
                          alt="RoleColor ™️ Finder - Halloween Edition 🎃" 
                          className="w-8 h-auto"
                        />
                      </div>
                      <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
                      <CardDescription className="text-base">
                        Sign in to your account or create a new one
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="px-8 pb-8">
                      <Tabs defaultValue="signin" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 rounded-xl">
                          <TabsTrigger 
                            value="signin" 
                            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-md font-semibold"
                          >
                            Sign In
                          </TabsTrigger>
                          <TabsTrigger 
                            value="signup"
                            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-md font-semibold"
                          >
                            Sign Up
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="signin" className="mt-6">
                          <form onSubmit={handleSignIn} className="space-y-6">
                            <div className="space-y-2">
                              <Label htmlFor="signin-email" className="text-sm font-semibold">Email</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                <Input
                                  id="signin-email"
                                  type="email"
                                  placeholder="Enter your email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="pl-10 py-3 rounded-xl border-2 focus:border-primary/50"
                                  required
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="signin-password" className="text-sm font-semibold">Password</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                <Input
                                  id="signin-password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter your password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="pl-10 pr-12 py-3 rounded-xl border-2 focus:border-primary/50"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>
                            
                            <Button 
                              type="submit" 
                              variant="hero" 
                              size="lg" 
                              className="w-full py-3 font-bold group" 
                              disabled={loading}
                            >
                              {loading ? "Signing In..." : "Sign In"}
                              {!loading && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                            
                            <Button 
                              type="button" 
                              variant="glass" 
                              size="lg"
                              className="w-full" 
                              onClick={handleResetPassword}
                              disabled={resetLoading}
                            >
                              {resetLoading ? "Sending..." : "Forgot Password?"}
                            </Button>
                          </form>
                        </TabsContent>
                        
                        <TabsContent value="signup" className="mt-6">
                          <form onSubmit={handleSignUp} className="space-y-6">
                            <div className="space-y-2">
                              <Label htmlFor="signup-name" className="text-sm font-semibold">Full Name</Label>
                              <div className="relative">
                                <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                <Input
                                  id="signup-name"
                                  type="text"
                                  placeholder="Enter your full name"
                                  value={fullName}
                                  onChange={(e) => setFullName(e.target.value)}
                                  className="pl-10 py-3 rounded-xl border-2 focus:border-primary/50"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="signup-email" className="text-sm font-semibold">Email</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                <Input
                                  id="signup-email"
                                  type="email"
                                  placeholder="Enter your email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="pl-10 py-3 rounded-xl border-2 focus:border-primary/50"
                                  required
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="signup-password" className="text-sm font-semibold">Password</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                <Input
                                  id="signup-password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create a password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="pl-10 pr-12 py-3 rounded-xl border-2 focus:border-primary/50"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>
                            
                            <Button 
                              type="submit" 
                              variant="hero" 
                              size="lg" 
                              className="w-full py-3 font-bold group" 
                              disabled={loading}
                            >
                              {loading ? "Creating Account..." : "Create Account"}
                              {!loading && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                          </form>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Token Verification Dialog */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Enter Verification Token
            </DialogTitle>
            <DialogDescription>
              Enter the 6-digit token from your email to verify your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="token">Verification Token</Label>
              <Input
                id="token"
                placeholder="Enter 6-digit token"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                className="text-center text-lg tracking-widest font-mono"
                maxLength={6}
              />
            </div>
            <Button 
              onClick={handleVerifyToken} 
              className="w-full"
              disabled={tokenLoading}
            >
              {tokenLoading ? "Verifying..." : "Verify Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};