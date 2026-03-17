import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Component as AnimatedCharactersLoginPage } from "@/components/ui/animated-characters-login-page";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function AnimatedAuth() {
  const { toast } = useToast();
  const { signIn, signInWithGoogle, signUp, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (email: string, password: string) => {
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(
        signInError.message.includes("Invalid login credentials")
          ? "The email or password you entered is incorrect."
          : signInError.message
      );
      toast({
        title: "Sign In Failed",
        description: signInError.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      setError(googleError.message);
      toast({
        title: "Google Sign In Failed",
        description: googleError.message,
        variant: "destructive",
      });
    }
    setGoogleLoading(false);
  };

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    setError("");
    if (!email || !password || !fullName) {
      setError("Please fill in your full name, email, and password.");
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(email, password, fullName);
    if (signUpError) {
      setError(signUpError.message);
      toast({
        title: "Sign Up Failed",
        description: signUpError.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check Your Email",
        description: "We sent you a confirmation link. Verify your email, then sign in.",
      });
      setMode("signin");
    }
    setLoading(false);
  };

  return (
    <AnimatedCharactersLoginPage
      onSubmit={handleSubmit}
      onSignUp={handleSignUp}
      onGoogleLogin={handleGoogleLogin}
      isLoading={loading}
      isGoogleLoading={googleLoading}
      error={error}
      brandName="RoleColorFinder"
      mode={mode}
      onModeChange={(nextMode) => {
        setError("");
        setMode(nextMode);
      }}
    />
  );
}
