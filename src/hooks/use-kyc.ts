"use client"

import { useEffect, useState } from "react"

const KEY = "eh_kyc_verified"

export function useKyc() {
  const [verified, setVerified] = useState<boolean>(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null
      setVerified(stored === "true")
    } catch {}
    setReady(true)
  }, [])

  const setKyc = (v: boolean) => {
    setVerified(v)
    try {
      window.localStorage.setItem(KEY, v ? "true" : "false")
    } catch {}
  }

  return { verified, setKyc, ready }
}
