import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, KeyRound, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ============ Canvas Reveal Effect Components ============

type Uniforms = {
  [key: string]: {
    value: number[] | number[][] | number;
    type: string;
  };
};

const CanvasRevealEffect = ({
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => {
  return (
    <div className={cn("h-full relative w-full", containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors ?? [[0, 255, 255]]}
          dotSize={dotSize ?? 3}
          opacities={opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]}
          shader={`
            float animation_speed_factor = ${animationSpeed.toFixed(1)};
            float intro_offset = distance(u_resolution / 2.0 / u_total_size, st2) * 0.01 + (random(st2) * 0.15);
            intro_offset *= animation_speed_factor;
            
            ${reverse 
              ? `float time_progress = clamp(1.0 - (u_time * animation_speed_factor - intro_offset), 0.0, 1.0);`
              : `float time_progress = clamp(u_time * animation_speed_factor - intro_offset, 0.0, 1.0);`
            }
            
            opacity *= time_progress;
          `}
          center={["x", "y"]}
        />
      </div>
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      )}
    </div>
  );
};

interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string;
  center?: ("x" | "y")[];
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
}) => {
  const uniforms = useMemo(() => {
    let colorsArray = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]];
    if (colors.length === 2) {
      colorsArray = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]];
    } else if (colors.length === 3) {
      colorsArray = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]];
    }
    return {
      u_colors: {
        value: colorsArray.map((color) => [color[0] / 255, color[1] / 255, color[2] / 255]),
        type: "uniform3fv",
      },
      u_opacities: { value: opacities, type: "uniform1fv" },
      u_total_size: { value: totalSize, type: "uniform1f" },
      u_dot_size: { value: dotSize, type: "uniform1f" },
    };
  }, [colors, opacities, totalSize, dotSize]);

  return (
    <Shader
      source={`
        precision mediump float;
        in vec2 fragCoord;
        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        out vec4 fragColor;
        
        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }
        void main() {
            vec2 st = fragCoord.xy;
            ${center.includes("x") ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));" : ""}
            ${center.includes("y") ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));" : ""}
            float opacity = step(0.0, st.x);
            opacity *= step(0.0, st.y);
            
            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));
            
            float frequency = 5.0;
            float show_offset = random(st2);
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency) + 1.0);
            opacity *= u_opacities[int(rand * 10.0)];
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));
            
            vec3 color = u_colors[int(rand * 6.0)];
            
            ${shader}
            
            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a;
        }
      `}
      uniforms={uniforms}
      maxFps={60}
    />
  );
};

const ShaderMaterial = ({ source, uniforms }: { source: string; uniforms: Uniforms; maxFps?: number }) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const material = ref.current.material as THREE.ShaderMaterial;
    material.uniforms.u_time.value = clock.getElapsedTime();
  });

  const getUniforms = () => {
    const preparedUniforms: Record<string, any> = {};
    for (const uniformName in uniforms) {
      const uniform = uniforms[uniformName];
      switch (uniform.type) {
        case "uniform1f":
          preparedUniforms[uniformName] = { value: uniform.value };
          break;
        case "uniform1fv":
          preparedUniforms[uniformName] = { value: uniform.value };
          break;
        case "uniform3fv":
          preparedUniforms[uniformName] = {
            value: (uniform.value as number[][]).map((v) => new THREE.Vector3().fromArray(v)),
          };
          break;
        default:
          break;
      }
    }
    preparedUniforms["u_time"] = { value: 0 };
    preparedUniforms["u_resolution"] = { value: new THREE.Vector2(size.width * 2, size.height * 2) };
    return preparedUniforms;
  };

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        precision mediump float;
        uniform vec2 u_resolution;
        out vec2 fragCoord;
        void main(){
          gl_Position = vec4(position.x, position.y, 0.0, 1.0);
          fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
          fragCoord.y = u_resolution.y - fragCoord.y;
        }
      `,
      fragmentShader: source,
      uniforms: getUniforms(),
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    });
  }, [size.width, size.height, source]);

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader = ({ source, uniforms, maxFps = 60 }: { source: string; uniforms: Uniforms; maxFps?: number }) => {
  return (
    <Canvas className="absolute inset-0 h-full w-full">
      <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
    </Canvas>
  );
};

// ============ Auth Page Component ============

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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const { toast } = useToast();
  const { signUp, signIn, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      toast({
        title: error.message.includes("already registered") ? "Account Already Exists" : "Sign Up Failed",
        description: error.message.includes("already registered") 
          ? "An account with this email already exists. Please sign in instead."
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Check Your Email", description: "We've sent you a confirmation link. Please check your email." });
      setShowTokenDialog(true);
    }
    setLoading(false);
  };

  const handleVerifyToken = async () => {
    if (!verificationToken || !email) {
      toast({ title: "Missing Information", description: "Please enter the verification token.", variant: "destructive" });
      return;
    }
    setTokenLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: verificationToken, type: 'email' });
    if (error) {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "Your email has been verified. You can now sign in." });
      setShowTokenDialog(false);
      setVerificationToken("");
    }
    setTokenLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Missing Information", description: "Please enter your email and password.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({
        title: error.message.includes("Invalid login credentials") ? "Invalid Credentials" : "Sign In Failed",
        description: error.message.includes("Invalid login credentials") 
          ? "The email or password you entered is incorrect."
          : error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast({ title: "Email Required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setResetLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      toast({ title: "Reset Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reset Link Sent", description: "Please check your email for password reset instructions." });
    }
    setResetLoading(false);
  };

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* Canvas Background */}
      <div className="absolute inset-0">
        <CanvasRevealEffect
          animationSpeed={5}
          containerClassName="bg-transparent"
          colors={[[34, 197, 94], [22, 163, 74]]}
          opacities={[0.15, 0.15, 0.2, 0.2, 0.25, 0.3, 0.3, 0.35, 0.4, 0.5]}
          dotSize={2}
          reverse={false}
        />
      </div>

      {/* Back to Home Link */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Home</span>
      </Link>

      {/* Content Layer */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <img 
                    src="/lovable-uploads/2842bc15-73da-4523-b9c9-228cb076346e.png" 
                    alt="RoleColor™ Finder" 
                    className="w-8 h-auto"
                  />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {mode === "signin" ? "Welcome Back" : "Create Account"}
                </h1>
                <p className="text-gray-400">
                  {mode === "signin" ? "Sign in to continue your journey" : "Start your leadership journey"}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/80">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 py-3 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 py-3 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={mode === "signin" ? "Enter your password" : "Create a password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-12 py-3 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-3 bg-white text-black font-semibold hover:bg-white/90 rounded-full group"
                  disabled={loading}
                >
                  {loading 
                    ? (mode === "signin" ? "Signing In..." : "Creating Account...") 
                    : (mode === "signin" ? "Sign In" : "Create Account")
                  }
                  {!loading && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </Button>

                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="w-full text-center text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {resetLoading ? "Sending..." : "Forgot Password?"}
                  </button>
                )}
              </form>

              {/* Toggle Mode */}
              <div className="text-center">
                <button
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  {mode === "signin" 
                    ? "Don't have an account? Sign Up" 
                    : "Already have an account? Sign In"
                  }
                </button>
              </div>

              {/* Terms */}
              <p className="text-center text-xs text-gray-600">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Token Verification Dialog */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Enter Verification Token
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the 6-digit token from your email to verify your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-white/80">Verification Token</Label>
              <Input
                id="token"
                placeholder="Enter 6-digit token"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                className="text-center text-lg tracking-widest font-mono bg-white/5 border-white/10 text-white"
                maxLength={6}
              />
            </div>
            <Button 
              onClick={handleVerifyToken} 
              className="w-full bg-white text-black hover:bg-white/90"
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
