"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventHeader } from "@/components/header"
import { OverviewSection } from "@/components/overview"
import { AnalyticsSection } from "@/components/analytics"
import { TicketsSection } from "@/components/tickets"
import { BookingsSection } from "@/components/bookings"
import { CouponsSection } from "@/components/coupons"
import { SettingsSection } from "@/components/settings"
import type { EventItem } from "@/lib/organizer"
import { getEventByIdMapped, getEventBookingsMapped } from "@/lib/supabase"
import type { Booking } from "@/lib/organizer"

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<EventItem | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    async function load() {
      if (!eventId) return
      const { data: ev } = await getEventByIdMapped(String(eventId))
      setEvent((ev as any) ?? null)
      if (ev) {
        const { data: b } = await getEventBookingsMapped(String(eventId))
        setBookings((b as any) ?? [])
      }
    }
    load()
  }, [eventId])

  if (!event) {
    return (
      <main className="p-4 md:p-6">
        <div className="max-w-[1400px] mx-auto space-y-4">
          <div className="rounded-2xl border border-border/60 p-8 text-center bg-card/90">
            <div className="text-sm text-muted-foreground">Event not found.</div>
            <button
              className="mt-4 inline-flex items-center px-3 py-2 rounded-xl border border-border/60 bg-transparent text-sm"
              onClick={() => router.push("/organizer/events")}
            >
              Back to Events
            </button>
          </div>
        </div>
      </main>
    )
  }

  function updateEvent(partial: Partial<EventItem>) {
    if (!event) return
    setEvent({ ...event, ...partial })
    // TODO: persist specific fields to Supabase when inline editing is supported
  }

  return (
    <main className="p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <EventHeader event={event} onChange={updateEvent} />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="rounded-xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-6">
            <TabsContent value="overview" className="m-0">
              <OverviewSection event={event} bookings={bookings} />
            </TabsContent>

            <TabsContent value="analytics" className="m-0">
              <AnalyticsSection event={event} />
            </TabsContent>

            <TabsContent value="tickets" className="m-0">
              <TicketsSection event={event} onChange={updateEvent} />
            </TabsContent>

            <TabsContent value="bookings" className="m-0">
              <BookingsSection event={event} rows={bookings} />
            </TabsContent>

            <TabsContent value="coupons" className="m-0">
              <CouponsSection eventId={event.id} />
            </TabsContent>

            <TabsContent value="settings" className="m-0">
              <SettingsSection event={event} onChange={updateEvent} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>
  )
}
