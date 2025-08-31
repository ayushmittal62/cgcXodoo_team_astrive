"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "./ui";
import { signUpWithGoogle } from "@/lib/auth";

interface SignUpProps {
  className?: string;
  onGoogleSignUp?: () => void;
}

export function SignUp({ className, onGoogleSignUp }: SignUpProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignUp = async () => {
    if (onGoogleSignUp) {
      onGoogleSignUp();
      return;
    }

    setIsLoading(true);
    try {
      const user = await signUpWithGoogle();
      if (user) {
        // Redirect to attendee dashboard on successful sign-up
        router.push("/attendee");
      }
    } catch (error) {
      console.error("Sign-up error:", error);
      // You can add error handling/toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedBackground 
      variant="dark" 
      animationSpeed={3}
      colors={[[255, 255, 255], [255, 255, 255]]}
      dotSize={6}
      className={className}
    >
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8 text-center"
          >
            <div className="space-y-2">
              <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">
                Join{" "}
                <Link 
                  href="/attendee" 
                  className="text-white hover:text-white/80 transition-colors cursor-pointer"
                >
                  EventHive
                </Link>
              </h1>
              <p className="text-[1.5rem] text-white/70 font-light">
                Create your account
              </p>
            </div>
            
            <div className="space-y-6">
              <motion.button 
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                className="backdrop-blur-[2px] w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white border border-white/20 rounded-full py-4 px-6 transition-all duration-300 hover:scale-[1.02] disabled:hover:scale-100"
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="font-medium">Creating account...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-medium">Continue with Google</span>
                  </>
                )}
              </motion.button>
            </div>
            
            <div className="pt-8">
              <p className="text-sm text-white/50">
                Already have an account?{" "}
                <Link 
                  href="/sign-in" 
                  className="text-white hover:text-white/80 underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
            
            <div className="pt-4">
              <p className="text-xs text-white/40">
                By signing up, you agree to our{" "}
                <Link href="#" className="underline hover:text-white/60 transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="underline hover:text-white/60 transition-colors">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedBackground>
  );
}