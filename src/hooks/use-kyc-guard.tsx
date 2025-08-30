"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"

const KYC_KEY = "organizer_kyc_status_v1"

// helper to read current verification state
function readVerified(): boolean {
  if (typeof window === "undefined") return false
  try {
    const v = window.localStorage.getItem(KYC_KEY)
    return v === "verified"
  } catch {
    return false
  }
}

// Return current KYC verified boolean (used by banner)
export function useKycGuard() {
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    setVerified(readVerified())
    const onStorage = (e: StorageEvent) => {
      if (e.key === KYC_KEY) {
        setVerified(readVerified())
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  return verified
}

// Small banner prompting user to complete KYC
export function useKycGuardBanner() {
  const verified = useKycGuard()
  const Banner = () => {
    if (verified) return null
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
  const verified = useKycGuard()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!verified && pathname && !pathname.startsWith("/organizer/kyc")) {
      router.replace("/organizer/kyc")
    }
  }, [verified, pathname, router])

  // Avoid flashing protected content before redirect
  if (!verified && pathname && !pathname.startsWith("/organizer/kyc")) {
    return null
  }
  return <>{children}</>
}
