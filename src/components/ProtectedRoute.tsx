"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = "/sign-in" 
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("Auth loading state timeout - possible infinite loading");
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (mounted && !loading && !user) {
      console.log("No user found, redirecting to:", redirectTo);
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo, mounted]);

  // Don't render anything until mounted (avoid hydration mismatch)
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-white flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-lg">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-white flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-lg">Verifying authentication...</p>
          <p className="text-sm text-white/60">This should only take a moment</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show loading while redirect happens
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-white flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-lg">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
