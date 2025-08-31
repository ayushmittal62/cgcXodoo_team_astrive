"use client"

import { useEffect, useState } from "react"

export type Role = "attendee" | "organizer"
const KEY = "eh_role"

export function useRole() {
  const [role, setRole] = useState<Role>("attendee")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = (typeof window !== "undefined" && window.localStorage.getItem(KEY)) as Role | null
      if (stored === "attendee" || stored === "organizer") setRole(stored)
    } catch {}
    setReady(true)
  }, [])

  const switchRole = (next: Role) => {
    setRole(next)
    try {
      window.localStorage.setItem(KEY, next)
    } catch {}
  }

  return { role, switchRole, ready }
}
