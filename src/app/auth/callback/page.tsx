"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Processing auth callback...');
        
        // Get the session from URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/sign-in?error=auth_failed');
          return;
        }

        if (data.session) {
          console.log('Auth callback successful:', data.session.user?.email);
          // Redirect to dashboard or desired page
          router.push('/organizer/dashboard');
        } else {
          console.log('No session found, redirecting to sign-in');
          router.push('/sign-in');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/sign-in?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
