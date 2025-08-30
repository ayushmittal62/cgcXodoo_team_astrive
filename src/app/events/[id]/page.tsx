"use client"

import React from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { events } from "@/lib/mock-data"

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const event = events.find((e) => e.id === id)
  if (!event) return notFound()

  return (
    <main className="min-h-dvh bg-neutral-950 text-slate-200">
      <header className="border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm text-slate-300 hover:text-white">
            ← Back
          </Link>
          <Button asChild className="bg-cyan-500 text-neutral-950 hover:bg-cyan-400">
            <Link href={`/events/${id}/book`}>Book Tickets</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
              <img
                src={event.poster || "/placeholder.svg"}
                alt={`${event.title} poster`}
                className="h-64 w-full object-cover"
              />
              <div className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <img
                    src={event.logo || "/placeholder.svg"}
                    alt={`${event.title} logo`}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <div>
                    <h1 className="text-pretty text-xl font-semibold">{event.title}</h1>
                    <p className="text-xs text-slate-400">
                      {event.category} • {event.date} • {event.time} • {event.location}
                    </p>
                  </div>
                </div>
                <p className="text-pretty text-sm text-slate-300">{event.description}</p>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <h2 className="mb-2 text-sm font-semibold">Tickets</h2>
              <ul className="space-y-2 text-sm">
                {event.tickets.map((t) => (
                  <li
                    key={t.tier}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-neutral-900 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase">{t.tier}</span>
                      <span className="text-slate-300">${t.price}</span>
                    </div>
                    <span className="text-xs text-slate-400">{t.stock} left</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-3 w-full bg-cyan-500 text-neutral-950 hover:bg-cyan-400">
                <Link href={`/events/${event.id}/book`}>Book Tickets</Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <h2 className="mb-2 text-sm font-semibold">Coupons & Discounts</h2>
              <ul className="list-disc space-y-1 pl-4 text-xs text-slate-400">
                <li>Use code HIVE10 for 10% off Standard</li>
                <li>VIP early-bird ends 48h before event</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
