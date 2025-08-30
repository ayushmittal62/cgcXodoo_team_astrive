"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { getOrganizerByUserId } from "@/lib/supabase"

export function useKyc() {
  const [verified, setVerified] = useState<boolean>(false)
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
        setVerified(organizer?.kyc_verified || false)
      } catch (error) {
        console.error("Error checking KYC status:", error)
        setVerified(false)
      } finally {
        setReady(true)
      }
    }

    checkKycStatus()
  }, [user, userProfile])

  const setKyc = (v: boolean) => {
    setVerified(v)
  }

  return { verified, setKyc, ready }
}
