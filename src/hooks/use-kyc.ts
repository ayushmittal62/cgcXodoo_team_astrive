"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { getOrganizerByUserId } from "@/lib/supabase"

export function useKyc() {
  const [verified, setVerified] = useState<boolean>(false)
  const [ready, setReady] = useState(false)
  const { userProfile } = useAuth()

  useEffect(() => {
    async function checkKycStatus() {
  if (!userProfile?.email) {
  console.log('KYC Hook: No user profile/email; not verified')
        setVerified(false)
        setReady(true)
        return
      }

      // Accept users.kycVerified or users.kyc_verified directly
      const up: any = userProfile
      console.log('KYC Hook: UserProfile flags', { kycVerified: (up?.kycVerified ?? null), kyc_verified: (up?.kyc_verified ?? null) })
      if (up?.kycVerified === true || up?.kyc_verified === true) {
        console.log('KYC Hook: users.kycVerified/kyc_verified is true')
        setVerified(true)
        setReady(true)
        return
      }

      try {
        // Check organizer profile with KYC
  const email = userProfile.email.toLowerCase()
  console.log('KYC Hook: Fetching organizer by email', email)
  let { data: organizer, error } = await getOrganizerByUserId(email)
        if ((error && (error as any).code === 'PGRST116') || (!organizer)) {
          console.log('KYC Hook: Not found by email, retrying with user id', userProfile.id)
          const res2 = await getOrganizerByUserId(userProfile.id)
          organizer = res2.data as any
          error = res2.error as any
        }
        if (error) {
          const msg = (error as any)?.message || (error as any)?.hint || JSON.stringify(error)
          console.error('KYC Hook: Error checking organizer status:', msg)
          setVerified(false)
        } else if (organizer && organizer.kyc_verified === true) {
          console.log('KYC Hook: Organizer found and verified')
          setVerified(true)
        } else {
          console.log('KYC Hook: Organizer not verified')
          setVerified(false)
        }
      } catch (error) {
        console.error('KYC Hook: Exception checking KYC status:', error)
        setVerified(false)
      } finally {
        setReady(true)
      }
    }

    checkKycStatus()
  }, [userProfile])

  // This function can be used to manually set KYC status (e.g., after completing KYC process)
  const setKyc = async (v: boolean) => {
    setVerified(v)
    // Note: In a real implementation, you'd also update the database here
    // For now, this just updates the local state
  }

  return { verified, setKyc, ready }
}
