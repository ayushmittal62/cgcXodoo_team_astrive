"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { EventCard } from "@/components/event-card"
import { events } from "@/lib/mock-data"
import { useBookings } from "@/components/use-bookings-store"

type TabKey = "discover" | "my-bookings"
type FilterKey = "ongoing" | "upcoming" | "past"

export default function DashboardPage() {
  const [tab, setTab] = useState<TabKey>("discover")
  const [filter, setFilter] = useState<FilterKey>("ongoing")
  const { bookings } = useBookings()

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filter === "ongoing") return e.status === "ongoing"
      if (filter === "upcoming") return e.status === "upcoming"
      return e.status === "past"
    })
  }, [filter])

  const myBookings = bookings

  return (
    <main className="min-h-dvh bg-neutral-950 text-slate-200">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-sky-500" aria-hidden />
            <h1 className="text-pretty text-lg font-semibold tracking-tight">EventHive</h1>
          </div>
          <nav className="flex items-center gap-2 rounded-full bg-white/5 p-1 backdrop-blur">
            <button
              className={cn(
                "rounded-full px-4 py-1.5 text-sm transition",
                tab === "discover" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10",
              )}
              onClick={() => setTab("discover")}
              aria-pressed={tab === "discover"}
            >
              Discover
            </button>
            <button
              className={cn(
                "rounded-full px-4 py-1.5 text-sm transition",
                tab === "my-bookings" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10",
              )}
              onClick={() => setTab("my-bookings")}
              aria-pressed={tab === "my-bookings"}
            >
              My Bookings
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6">
        {tab === "discover" ? (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-pretty text-xl font-semibold">Events</h2>
                <p className="text-sm text-slate-400">Browse ongoing, upcoming, and past events.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/5 p-1 backdrop-blur">
                {(["ongoing", "upcoming", "past"] as FilterKey[]).map((k) => (
                  <button
                    key={k}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs capitalize transition",
                      filter === k ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10",
                    )}
                    onClick={() => setFilter(k)}
                    aria-pressed={filter === k}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((e) => (
                <EventCard key={e.id} event={e}>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="secondary" className="bg-white/10 text-slate-100 hover:bg-white/20">
                      <Link href={`/events/${e.id}`}>View Details</Link>
                    </Button>
                    {e.status !== "past" && (
                      <Button asChild className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950">
                        <Link href={`/events/${e.id}/book`}>Book Ticket</Link>
                      </Button>
                    )}
                  </div>
                </EventCard>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-pretty text-xl font-semibold">My Bookings</h2>
              <p className="text-sm text-slate-400">Your upcoming and past tickets with QR codes and feedback.</p>
            </div>

            {myBookings.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
                <p className="mb-3 text-sm text-slate-300">No bookings yet.</p>
                <Button asChild className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950">
                  <Link href="/">Discover Events</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {myBookings.map((b) => (
                  <div key={b.bookingId} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <div className="mb-3 flex items-center gap-3">
                      <img
                        src={b.event.logo || "/placeholder.svg"}
                        alt={`${b.event.title} logo`}
                        className="h-8 w-8 rounded-md object-cover"
                      />
                      <div>
                        <h3 className="text-pretty font-medium">{b.event.title}</h3>
                        <p className="text-xs text-slate-400">
                          {b.event.date} • {b.event.time} • {b.event.location}
                        </p>
                      </div>
                    </div>
                    <div className="mb-3 grid grid-cols-2 gap-3">
                      {b.tickets.map((t) => (
                        <div key={t.index} className="rounded-lg border border-white/10 bg-neutral-900 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs text-slate-400">Ticket {t.index + 1}</span>
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-slate-300">
                              {t.tier}
                            </span>
                          </div>
                          <img
                            src={`/qr-code-for-ticket-.png?height=120&width=120&query=qr code for ticket ${t.index + 1}`}
                            alt={`QR code for ticket ${t.index + 1}`}
                            className="h-28 w-28 rounded bg-neutral-800"
                          />
                        </div>
                      ))}
                    </div>

                    {b.event.status === "past" ? (
                      <FeedbackControls bookingId={b.bookingId} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Status</span>
                        <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-300">
                          {b.event.status}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}

function FeedbackControls({ bookingId }: { bookingId: string }) {
  const { feedbackByBookingId, submitFeedback } = useBookings()
  const feedback = feedbackByBookingId[bookingId] || { rating: 0, text: "" }

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-neutral-900 p-3">
      <p className="mb-2 text-sm font-medium">Rate this event</p>
      <div className="mb-2 flex items-center gap-1" role="radiogroup" aria-label="Rating from 1 to 5">
        {[1, 2, 3, 4, 5].map((r) => (
          <button
            key={r}
            aria-checked={feedback.rating === r}
            role="radio"
            onClick={() => submitFeedback(bookingId, { rating: r, text: feedback.text })}
            className={cn(
              "h-6 w-6 rounded-full transition",
              feedback.rating >= r ? "bg-cyan-500" : "bg-white/10 hover:bg-white/20",
            )}
            title={`${r} star${r > 1 ? "s" : ""}`}
          />
        ))}
      </div>
      <textarea
        value={feedback.text}
        onChange={(e) => submitFeedback(bookingId, { rating: feedback.rating, text: e.target.value })}
        placeholder="Share your thoughts..."
        className="mb-2 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-500"
        rows={3}
      />
      <div className="text-right">
        <Button
          type="button"
          className="bg-sky-500 text-neutral-950 hover:bg-sky-400"
          onClick={() => submitFeedback(bookingId, feedback)}
        >
          Submit Feedback
        </Button>
      </div>
    </div>
  )
}
