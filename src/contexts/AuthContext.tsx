"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { onAuthStateChange, getCurrentUser } from "@/lib/auth";
import { getUserProfileByEmail, createUserProfile, type UserProfile } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const unsubscribe = onAuthStateChange(async (user) => {
      if (!mounted) return;
      
      console.log("Auth state changed:", user ? `User signed in: ${user.email}` : "User signed out");
      setUser(user);
      
  if (user && user.email) {
        const email = user.email.toLowerCase();
        // Fetch Supabase user profile by email
        try {
          console.log("Fetching user profile for:", email);
          let { data: profile, error } = await getUserProfileByEmail(email);
          
          if (error || !profile) {
            console.log("User profile not found, creating new profile...");
            // User doesn't exist, create a new profile
            const { data: newProfile, error: createError } = await createUserProfile({
              email,
              displayName: user.displayName || undefined,
              photoUrl: user.photoURL || undefined
            });
            
            if (createError) {
              console.error("Error creating user profile:", createError);
              setUserProfile(null);
            } else {
              console.log("New user profile created:", newProfile);
              setUserProfile(newProfile);
            }
          } else {
            console.log("User profile found:", profile);
            setUserProfile(profile);
          }
        } catch (err) {
          console.error("Error in user profile fetch/create:", err);
          setUserProfile(null);
        }
      } else {
        console.warn('No Firebase user or user.email is null — cannot fetch/create profile');
        setUserProfile(null);
      }
      
      if (mounted) {
        setLoading(false);
      }
    });

    // Fallback timeout to prevent infinite loading and to verify email once
    const timeout = setTimeout(() => {
      if (!mounted) return;
      try {
        const current = getCurrentUser();
        if (current) {
          console.warn("Auth init fallback: using currentUser", { email: current.email });
          setUser(current);
        } else {
          console.warn("Auth init fallback: no currentUser");
        }
      } catch (e) {
        console.error("Auth init fallback error", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 2000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
