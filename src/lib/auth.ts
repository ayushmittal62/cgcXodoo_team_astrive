"use client";

import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth, provider } from "./firebaseConfig";
import { createClient} from "./supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Sign in with Google
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Sign up with Google and save to Supabase
export const signUpWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    if (user) {
      // Save user data to Supabase using your existing users table
      // Import your Supabase URL and anon key from environment or config
      
      const { data, error } = await createClient(supabaseUrl, supabaseAnonKey).from('users').insert({
        firebaseUid: user.uid, // We still pass this but don't store it in the table
        email: user.email || '',
        displayName: user.displayName || undefined,
        photoUrl: user.photoURL || undefined
      });
      
      if (error) {
        console.error('Error saving user to Supabase:', error);
        // Don't throw error here to allow user to continue even if Supabase fails
      } else {
        console.log('User profile saved to Supabase:', data);
      }
    }
    
    return user;
  } catch (error) {
    console.error("Error signing up with Google:", error);
    throw error;
  }
};

// Sign out
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};