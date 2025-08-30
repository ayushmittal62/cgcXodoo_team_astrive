"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentUser } from '@/lib/auth';

export default function Debug() {
  const { user, loading } = useAuth();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const firebaseUser = getCurrentUser();
    setCurrentUser(firebaseUser);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-black text-white p-8">Mounting...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Auth Debug Information</h1>
        
        <div className="space-y-4">
          <div className="bg-white/5 p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Auth Context State:</h2>
            <p>Loading: {loading ? 'true' : 'false'}</p>
            <p>User: {user ? `${user.displayName} (${user.email})` : 'null'}</p>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Firebase getCurrentUser():</h2>
            <p>{currentUser ? `${currentUser.displayName} (${currentUser.email})` : 'null'}</p>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Environment Check:</h2>
            <p>Firebase API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing'}</p>
            <p>Firebase Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing'}</p>
            <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => window.location.href = '/sign-in'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Go to Sign In
            </button>
            <button
              onClick={() => window.location.href = '/attendee'}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
            >
              Go to Attendee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
