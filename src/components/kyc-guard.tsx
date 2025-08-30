"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useKyc } from "@/hooks/use-kyc"

export default function KycGuard({ children }: { children: React.ReactNode }) {
  const { verified, ready } = useKyc()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!ready) return
    const isKycRoute = pathname?.startsWith("/organizer/kyc")
    if (!verified && !isKycRoute) {
      router.replace("/organizer/kyc")
    }
  }, [verified, ready, router, pathname])

  if (!ready) return null
  return <>{children}</>
}
