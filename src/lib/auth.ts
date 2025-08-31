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
      if (!user.email) {
        console.error('Google sign-up returned user without email');
        return user;
      }
      const email = user.email.toLowerCase();
      // Check if user already exists in Supabase
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (!existingUser && !fetchError) {
        // User doesn't exist, create new profile
        const { data, error } = await supabase.from('users').insert({
          email,
          name: user.displayName || '',
          phone: null,
          role: 'attendee',
          kycVerified: false,
          photoUrl: user.photoURL || null,
          created_at: new Date().toISOString()
        });
        
        if (error) {
          console.error('Error saving user to Supabase:', error);
        } else {
          console.log('User profile saved to Supabase:', data);
        }
      } else {
        console.log('User already exists in Supabase:', existingUser);
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