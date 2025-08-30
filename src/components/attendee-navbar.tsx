"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logOut } from '@/lib/auth';
import { RoleSwitch } from '@/components/role-switch';
import Link from 'next/link';
import { motion } from 'framer-motion';

const AttendeeNavbar = () => {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-black/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/attendee" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-white">
              EventHive
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/attendee" 
              className="text-white hover:text-white/80 transition-colors font-medium"
            >
              Dashboard
            </Link>
            <Link 
              href="/events" 
              className="text-white/70 hover:text-white transition-colors"
            >
              Events
            </Link>
            <Link 
              href="/my-tickets" 
              className="text-white/70 hover:text-white transition-colors"
            >
              My Tickets
            </Link>
            <Link 
              href="/profile" 
              className="text-white/70 hover:text-white transition-colors"
            >
              Profile
            </Link>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <RoleSwitch />
            
            {user && (
              <div className="hidden md:flex items-center space-x-3">
                {user.photoURL && (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full border border-white/20"
                  />
                )}
                <span className="text-white/70 text-sm">
                  {user.displayName || 'User'}
                </span>
              </div>
            )}
            
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 hover:scale-105 text-white"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <RoleSwitch />
            <button
              onClick={handleSignOut}
              className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-colors text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default AttendeeNavbar;
