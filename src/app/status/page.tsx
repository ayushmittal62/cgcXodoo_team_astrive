"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useOrganizerData } from "@/hooks/useOrganizerData"

export default function AuthStatusPage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const { organizer, loading: organizerLoading, error } = useOrganizerData()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Status</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold text-blue-800">Firebase Auth</h2>
          <p className="text-sm">Loading: {authLoading ? "Yes" : "No"}</p>
          <p className="text-sm">User: {user ? `${user.email} (${user.uid})` : "None"}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="font-semibold text-green-800">Supabase Profile</h2>
          <p className="text-sm">User Profile: {userProfile ? `${userProfile.name} (${userProfile.id})` : "None"}</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h2 className="font-semibold text-purple-800">Organizer Data</h2>
          <p className="text-sm">Loading: {organizerLoading ? "Yes" : "No"}</p>
          <p className="text-sm">Error: {error || "None"}</p>
          <p className="text-sm">Organizer: {organizer ? `Yes (KYC: ${organizer.kyc_verified})` : "None"}</p>
        </div>

        <div className="space-x-4">
          <a href="/sign-in" className="px-4 py-2 bg-blue-600 text-white rounded">Sign In</a>
          <a href="/organizer/dashboard" className="px-4 py-2 bg-green-600 text-white rounded">Dashboard</a>
          <a href="/organizer/events" className="px-4 py-2 bg-purple-600 text-white rounded">Events</a>
          <a href="/organizer/events/new" className="px-4 py-2 bg-orange-600 text-white rounded">New Event</a>
        </div>
      </div>
    </div>
  )
}
