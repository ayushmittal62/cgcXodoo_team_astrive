"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { getOrganizerByUserId } from "@/lib/supabase"

const KYC_KEY = "organizer_kyc_status_v1"
// Return current KYC verified boolean (used by banner)
export function useKycGuard() {
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const { userProfile } = useAuth()

  useEffect(() => {
    async function checkKycStatus() {
  if (!userProfile?.email) {
    console.log('KYC Check: No user profile or email')
        setVerified(false)
        setLoading(false)
        return
      }

  const email = userProfile.email.toLowerCase()
  console.log('KYC Check: Checking for user:', email, 'Role:', userProfile.role, 'UserId:', userProfile.id)

      // If user is admin, they're automatically verified
      if (userProfile.role === 'admin') {
        console.log('KYC Check: User is admin, automatically verified')
        setVerified(true)
        setLoading(false)
        return
      }

      // If users table already marks KYC verified, accept that (camelCase or snake_case)
  const up: any = userProfile
      console.log('KYC Check: UserProfile flags', { kycVerified: (up?.kycVerified ?? null), kyc_verified: (up?.kyc_verified ?? null) })
      if (up?.kycVerified === true || up?.kyc_verified === true) {
        console.log('KYC Check: users.kycVerified/kyc_verified is true — verified')
        setVerified(true)
        setLoading(false)
        return
      }

      try {
        // Check organizer profile with KYC
  console.log('KYC Check: Fetching organizer profile for:', email)
  let { data: organizer, error } = await getOrganizerByUserId(email)

        // Fallback: some rows may store user_id as the users.id instead of email
        if ((error && (error as any).code === 'PGRST116') || (!organizer)) {
          console.log('KYC Check: No organizer found by email, retrying with user id:', userProfile.id)
          const res2 = await getOrganizerByUserId(userProfile.id)
          organizer = res2.data as any
          error = res2.error as any
        }

        if (error) {
          const msg = (error as any)?.message || (error as any)?.hint || JSON.stringify(error)
          console.error('KYC Check: Error fetching organizer:', msg)
          setVerified(false)
        } else if (!organizer) {
          console.log('KYC Check: No organizer profile found for user')
          setVerified(false)
        } else {
          console.log('KYC Check: Organizer profile found:', organizer)
          console.log('KYC Check: Organizer kyc_verified:', organizer.kyc_verified)
          setVerified(organizer.kyc_verified === true)
        }
      } catch (error) {
        console.error('KYC Check: Exception during check:', error)
        setVerified(false)
      } finally {
        setLoading(false)
      }
    }

  checkKycStatus()
  }, [userProfile])

  return { verified, loading }
}

// Small banner prompting user to complete KYC
export function useKycGuardBanner() {
  const { verified, loading } = useKycGuard()
  const Banner = () => {
    if (loading || verified) return null
    return (
      <div className="border-t border-border/60 bg-background/60">
        <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-2">
          <Alert className="rounded-xl bg-muted/40 border-border/60">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle className="text-sm">KYC incomplete</AlertTitle>
            <AlertDescription className="text-xs">
              You must complete KYC to publish events and withdraw payouts.{" "}
              <Link href="/organizer/kyc" className="underline underline-offset-4">
                Complete KYC
              </Link>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }
  return Banner
}

// Route guard for /organizer pages - redirects to /organizer/kyc if not verified
export function KycGuard({ children }: { children: React.ReactNode }) {
  const { verified, loading } = useKycGuard()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return // Don't redirect while loading
    
    if (!verified && pathname && !pathname.startsWith("/organizer/kyc")) {
      console.warn('KYC Guard: Not verified, redirecting to /organizer/kyc', { pathname, verified, loading })
      router.replace("/organizer/kyc")
    } else if (verified) {
      console.log('KYC Guard: Verified — access granted', { pathname })
      if (pathname && pathname.startsWith('/organizer/kyc')) {
        console.log('KYC Guard: Verified and on KYC page — redirecting to /organizer/dashboard')
        router.replace('/organizer/dashboard')
      }
    }
  }, [verified, loading, pathname, router])

  // Show loading state while checking KYC status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking verification status...</p>
        </div>
      </div>
    )
  }

  // Avoid flashing protected content before redirect
  if (!verified && pathname && !pathname.startsWith("/organizer/kyc")) {
    return null
  }
  return <>{children}</>
}
