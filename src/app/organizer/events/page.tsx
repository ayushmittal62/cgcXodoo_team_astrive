"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { useOrganizerData } from "@/hooks/useOrganizerData"
import { useKycCheckForPublishing } from "@/hooks/use-kyc-guard"
import { KycStatusBanner } from "@/components/kyc-status-banner"
import type { Event } from "@/lib/supabase"
import type { EventItem } from "@/lib/organizer"
import { PlusCircle } from "lucide-react"
import { EventGrid } from "@/components/event-grid"

type StatusFilter = "all" | "draft" | "published" | "completed" | "cancelled"
type DateFilter = "all" | "today" | "7d" | "30d"

// Adapter function to convert Event to EventItem
function eventToEventItem(event: Event): EventItem {
  const startAt = `${event.event_date}T${event.event_time}`
  const endTime = new Date(startAt).getTime() + (4 * 60 * 60 * 1000) // Assume 4 hour duration
  const endAt = new Date(endTime).toISOString()
  
  return {
    id: event.id,
    title: event.title,
    category: event.category || "Other",
    startAt,
    endAt,
    location: event.location || "",
    visibility: event.event_type === "public" ? "public" : "private",
    posterUrl: event.cover_poster_url,
    logoUrl: event.logo_url,
    tickets: [], // TODO: populate with actual ticket data
    status: event.status as EventItem["status"],
    revenue: 0, // TODO: calculate from bookings
    ticketsLeft: event.total_tickets,
    sold: 0 // TODO: calculate from bookings
  }
}

function isOngoing(e: Event, now: number) {
  const start = new Date(e.event_date + ' ' + e.event_time).getTime()
  const end = new Date(e.event_date + ' ' + e.event_time).getTime() + (4 * 60 * 60 * 1000) // Assume 4 hour duration
  return e.status === "published" && start <= now && now <= end
}

function isUpcoming(e: Event, now: number) {
  const start = new Date(e.event_date + ' ' + e.event_time).getTime()
  return start > now && (e.status === "published" || e.status === "draft")
}

function isCompleted(e: Event, now: number) {
  const start = new Date(e.event_date + ' ' + e.event_time).getTime()
  const end = start + (4 * 60 * 60 * 1000) // Assume 4 hour duration
  return e.status === "completed" || end < now
}

export default function EventsListPage() {
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()
  const { organizer, getEvents, loading: organizerLoading } = useOrganizerData()
  const { checkKycBeforePublish } = useKycCheckForPublishing()
  
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [tab, setTab] = useState<"ongoing" | "upcoming" | "completed">("upcoming")

  const totalLoading = authLoading || organizerLoading

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [authLoading, user, router])

  // Fetch events when organizer is available
  useEffect(() => {
    if (organizer) {
      fetchEvents()
    } else if (!organizerLoading && !organizer) {
      setEvents([])
      setLoading(false)
    }
  }, [organizer, organizerLoading])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const eventsData = await getEvents()
      setEvents(eventsData)
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to load events')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const categories = useMemo(() => {
    const s = new Set(events.map((e) => e.category).filter((c): c is string => Boolean(c)))
    return ["all", ...Array.from(s)]
  }, [events])

  const now = Date.now()

  const tabbed = useMemo(() => {
    if (tab === "ongoing") return events.filter((e) => isOngoing(e, now))
    if (tab === "upcoming") return events.filter((e) => isUpcoming(e, now))
    return events.filter((e) => isCompleted(e, now))
  }, [events, tab, now])

  const filtered = useMemo(() => {
    let list = tabbed
    if (q.trim()) {
      const qq = q.toLowerCase()
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(qq) ||
          (e.location && e.location.toLowerCase().includes(qq)) ||
          (e.category && e.category.toLowerCase().includes(qq)),
      )
    }
    if (category !== "all") {
      list = list.filter((e) => e.category === category)
    }
    if (status !== "all") {
      list = list.filter((e) => e.status === status)
    }
    if (dateFilter !== "all") {
      const start = new Date()
      let end = new Date()
      if (dateFilter === "today") {
        // keep same day
      } else if (dateFilter === "7d") {
        end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      } else if (dateFilter === "30d") {
        end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
      const sTime = start.getTime()
      const eTime = end.getTime()
      list = list.filter((e) => {
        const st = new Date(e.event_date + ' ' + e.event_time).getTime()
        return st >= sTime && st <= eTime
      })
    }
    return list
  }, [tabbed, q, category, status, dateFilter])

  function bulkPublish(ids: string[]) {
    checkKycBeforePublish(
      () => {
        // KYC verified - proceed with publishing
        setEvents((prev) => prev.map((e) => (ids.includes(e.id) ? ({ ...e, status: "published" } as Event) : e)))
        toast.success(`${ids.length} event(s) published`)
      },
      () => {
        // KYC not verified - redirect to KYC
        toast.error("KYC verification required to publish events")
        router.push('/organizer/kyc')
      }
    )
  }

  function bulkUnpublish(ids: string[]) {
    // Allow unpublishing without KYC check
    setEvents((prev) => prev.map((e) => (ids.includes(e.id) ? ({ ...e, status: "draft" } as Event) : e)))
    toast.success(`${ids.length} event(s) set to Draft`)
  }

  function bulkCancel(ids: string[]) {
    // Allow cancelling without KYC check
    setEvents((prev) => prev.map((e) => (ids.includes(e.id) ? ({ ...e, status: "cancelled" } as Event) : e)))
    toast.success(`${ids.length} event(s) cancelled`)
  }

  function bulkExport(ids: string[]) {
    // TODO: integrate real export
    console.log("[export] events:", ids)
    toast.success(`Preparing export for ${ids.length} event(s)`)
  }

  return (
    <main className="p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-semibold">Events</h1>
          <Button asChild className="rounded-xl">
            <Link href="/organizer/events/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Event
            </Link>
          </Button>
        </div>

        <KycStatusBanner />

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
          <TabsList className="rounded-xl">
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Search by title, location, category"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-64 rounded-xl bg-muted/50"
                aria-label="Search events"
              />
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40 rounded-xl bg-muted/50">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? "All Categories" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="w-40 rounded-xl bg-muted/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {["all", "draft", "published", "completed", "cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
              <SelectTrigger className="w-40 rounded-xl bg-muted/50">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Next 7 days</SelectItem>
                <SelectItem value="30d">Next 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="ongoing" className="mt-4">
            {loading ? (
              <SkeletonGrid />
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <EventGrid
                items={filtered.map(eventToEventItem)}
                onPublish={bulkPublish}
                onUnpublish={bulkUnpublish}
                onCancel={bulkCancel}
                onExport={bulkExport}
              />
            )}
          </TabsContent>
          <TabsContent value="upcoming" className="mt-4">
            {loading ? (
              <SkeletonGrid />
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <EventGrid
                items={filtered.map(eventToEventItem)}
                onPublish={bulkPublish}
                onUnpublish={bulkUnpublish}
                onCancel={bulkCancel}
                onExport={bulkExport}
              />
            )}
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            {loading ? (
              <SkeletonGrid />
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <EventGrid
                items={filtered.map(eventToEventItem)}
                onPublish={bulkPublish}
                onUnpublish={bulkUnpublish}
                onCancel={bulkCancel}
                onExport={bulkExport}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-56 rounded-2xl" />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border/60 p-10 text-center bg-card/90">
      <div className="text-sm text-muted-foreground">No events match your filters.</div>
      <Button asChild className="mt-4 rounded-xl">
        <Link href="/organizer/events/new">Create your first event</Link>
      </Button>
    </div>
  )
}
