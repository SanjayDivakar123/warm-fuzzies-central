"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* =========================
   EVERYTHING ABOVE UNCHANGED
   (CanvasRevealEffect, DotMatrix,
    Shader, ShaderMaterial, etc.)
   ========================= */

export const SignInPage = ({ className, onSuccess }: { className?: string; onSuccess?: () => void }) => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "success">("email");
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);

  const completeSignIn = () => {
    setReverseCanvasVisible(true);
    setTimeout(() => {
      setInitialCanvasVisible(false);
    }, 50);
    setTimeout(() => {
      setStep("success");
      onSuccess?.();
    }, 1800);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      completeSignIn();
    }
  };

  return (
    <div className={cn("relative min-h-screen w-full bg-black overflow-hidden", className)}>
      {/* Background Canvas Effects */}
      <div className="absolute inset-0">
        {initialCanvasVisible && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: reverseCanvasVisible ? 0 : 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <CanvasRevealEffect
              animationSpeed={5}
              containerClassName="bg-transparent"
              colors={[[34, 197, 94], [22, 163, 74]]}
              opacities={[0.2, 0.2, 0.2, 0.3, 0.3, 0.4, 0.4, 0.5, 0.5, 0.6]}
              dotSize={2}
            />
          </motion.div>
        )}

        {reverseCanvasVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <CanvasRevealEffect
              animationSpeed={10}
              containerClassName="bg-transparent"
              colors={[[34, 197, 94], [22, 163, 74]]}
              opacities={[0.2, 0.2, 0.2, 0.3, 0.3, 0.4, 0.4, 0.5, 0.5, 0.6]}
              dotSize={2}
              reverse
            />
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-white mb-2">Welcome</h1>
                  <p className="text-gray-400">Sign in to continue</p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <button
                    type="button"
                    onClick={completeSignIn}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-white/20 text-white hover:bg-white/5 transition-colors"
                  >
                    Sign in with Google
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/20" />
                    <span className="text-gray-500 text-sm">or</span>
                    <div className="flex-1 h-px bg-white/20" />
                  </div>

                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 backdrop-blur text-white border border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border-white/30 text-center"
                      required
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      →
                    </button>
                  </div>
                </form>

                <p className="text-center text-xs text-gray-500">
                  By signing up, you agree to our Terms and Privacy Policy.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-6 text-center"
              >
                <h1 className="text-3xl font-bold text-white">You're in!</h1>
                <p className="text-gray-400">Welcome</p>

                <Link
                  to="/dashboard"
                  className="block w-full py-3 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors"
                >
                  Continue to Dashboard
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
