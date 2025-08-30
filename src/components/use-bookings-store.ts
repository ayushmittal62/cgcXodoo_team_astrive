"use client"

import useSWR from "swr"
import type { Event } from "@/components/event-card"

export type Booking = {
  bookingId: string
  event: Event
  tickets: { index: number; tier: "Basic" | "Standard" | "VIP" }[]
  attendees: { name: string; email: string; phone: string; dob: string }[]
  amount: number
  payment: { provider: string; status: "paid" | "failed" | "pending" }
}

export type Feedback = { rating: number; text: string }

const KEY = "eventhive_bookings_v1"
const FKEY = "eventhive_feedback_v1"

export function useBookings() {
  const { data: bookings = [], mutate } = useSWR<Booking[]>(KEY, () => {
    if (typeof window === "undefined") return []
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as Booking[]) : []
    } catch {
      return []
    }
  })

  const { data: feedbackByBookingId = {} } = useSWR<Record<string, Feedback>>(FKEY, () => {
    if (typeof window === "undefined") return {}
    try {
      const raw = localStorage.getItem(FKEY)
      return raw ? (JSON.parse(raw) as Record<string, Feedback>) : {}
    } catch {
      return {}
    }
  })

  function persist(next: Booking[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem(KEY, JSON.stringify(next))
    }
    mutate(next, false)
  }

  function addBooking(b: Omit<Booking, "bookingId">) {
    const bookingId = cryptoRandom()
    const next = [{ ...b, bookingId }, ...bookings]
    persist(next)
  }

  function submitFeedback(bookingId: string, feedback: Feedback) {
    if (typeof window === "undefined") return
    const all = { ...feedbackByBookingId, [bookingId]: feedback }
    localStorage.setItem(FKEY, JSON.stringify(all))
    // SWR will auto revalidate on focus; cheap manual trigger via storage event not necessary here
  }

  return { bookings, addBooking, feedbackByBookingId, submitFeedback }
}

function cryptoRandom() {
  if (typeof window !== "undefined" && "crypto" in window) {
    const a = new Uint32Array(1)
    window.crypto.getRandomValues(a)
    return `bk_${a[0].toString(16)}`
  }
  return `bk_${Math.random().toString(16).slice(2)}`
}
