"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getOrganizerByUserId } from "@/lib/supabase"

// Return current KYC verified boolean (used by banner)
export function useKycGuard() {
  const [verified, setVerified] = useState(false)
  const [ready, setReady] = useState(false)
  const { user, userProfile } = useAuth()

  useEffect(() => {
    const checkKycStatus = async () => {
      if (!userProfile || !user) {
        setVerified(false)
        setReady(true)
        return
      }

      try {
        // Check if user has an organizer profile and if KYC is verified
        const { data: organizer } = await getOrganizerByUserId(userProfile.id)
        const isVerified = organizer?.kyc_verified || false
        
        setVerified(isVerified)
      } catch (error) {
        console.error("Error checking KYC status:", error)
        setVerified(false)
      } finally {
        setReady(true)
      }
    }

    checkKycStatus()
  }, [user, userProfile])

  return { verified, ready }
}

// Small banner prompting user to complete KYC (non-blocking)
export function useKycGuardBanner() {
  const { verified } = useKycGuard()
  
  const Banner = () => {
    // Don't show any banner anymore - KYC is only required for publishing
    // The banner in individual pages (like events) will handle KYC messaging
    return null
  }
  
  return Banner
}

// Function to check KYC before allowing event publishing
export function useKycCheckForPublishing() {
  const { verified, ready } = useKycGuard()
  
  const checkKycBeforePublish = (onSuccess: () => void, onKycRequired: () => void) => {
    if (!ready) {
      // Still loading KYC status
      return
    }
    
    if (verified) {
      // KYC is verified, allow publishing
      onSuccess()
    } else {
      // KYC not verified, redirect to KYC
      onKycRequired()
    }
  }
  
  return { checkKycBeforePublish, verified, ready }
}

// Route guard for /organizer pages - NOW ONLY PROTECTS EVENT PUBLISHING
export function KycGuard({ children }: { children: React.ReactNode }) {
  // No longer guard organizer pages - only protect event publishing
  // KYC check will happen when user tries to publish an event
  return <>{children}</>
}
