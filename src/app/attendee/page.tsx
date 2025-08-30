"use client";

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { logOut } from '@/lib/auth';
import { motion } from 'framer-motion';

const Attendee = () => {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome, {user?.displayName || 'Attendee'}!</h1>
              <p className="text-white/70 text-lg">Discover and attend amazing events</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 hover:scale-105"
            >
              Sign Out
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
            >
              <h3 className="text-xl font-semibold mb-3">Upcoming Events</h3>
              <p className="text-white/70">Find events happening near you</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
            >
              <h3 className="text-xl font-semibold mb-3">My Tickets</h3>
              <p className="text-white/70">View your purchased tickets</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
            >
              <h3 className="text-xl font-semibold mb-3">Profile</h3>
              <p className="text-white/70">Manage your account settings</p>
            </motion.div>
          </div>

          {user?.photoURL && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex items-center space-x-4"
            >
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-16 h-16 rounded-full border-2 border-white/20"
              />
              <div>
                <p className="font-medium">{user.displayName}</p>
                <p className="text-white/70 text-sm">{user.email}</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </ProtectedRoute>
  );
};

export default Attendee;