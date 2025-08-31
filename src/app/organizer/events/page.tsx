"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useOrganizerData } from "@/hooks/useOrganizerData"
import { getOrganizerEventsOverview, getOrganizerEventsOverviewByOwnerIds, updateEventsStatus, supabase } from "@/lib/supabase"
import type { EventItem } from "@/lib/organizer"
import { PlusCircle } from "lucide-react"
import { EventGrid } from "@/components/event-grid"

type StatusFilter = "all" | "draft" | "published" | "completed" | "cancelled"
type DateFilter = "all" | "today" | "7d" | "30d"

function isOngoing(e: EventItem, now: number) {
  const start = new Date(e.startAt).getTime()
  const end = new Date(e.endAt).getTime()
  return e.status === "published" && start <= now && now <= end
}
function isUpcoming(e: EventItem, now: number) {
  const start = new Date(e.startAt).getTime()
  return start > now && (e.status === "published" || e.status === "draft")
}
function isCompleted(e: EventItem, now: number) {
  const end = new Date(e.endAt).getTime()
  return e.status === "completed" || end < now
}

export default function EventsListPage() {
  const { toast } = useToast()
  const { organizer } = useOrganizerData()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<EventItem[]>([])
  const [q, setQ] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [tab, setTab] = useState<"all" | "ongoing" | "upcoming" | "completed">("all")

  // Shared loader
  async function loadEvents() {
    try {
      setLoading(true)
      if (!organizer) {
        setEvents([])
        return
      }
      // Try both the organizer.id and the known owner keys (user id/email) to cover legacy rows
      const ownerCandidates = [organizer.id, organizer.user_id].filter(Boolean) as string[]
      const { data, error } = await getOrganizerEventsOverviewByOwnerIds(ownerCandidates)
      if (error) {
        console.error('[events] load error', error)
        toast({ title: 'Failed to load events', description: String((error as any).message || error) })
        setEvents([])
      } else {
        setEvents((data as any) || [])
      }
    } finally {
      setLoading(false)
    }
  }

  // Initial/URL-driven load
  useEffect(() => {
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizer, searchParams])

  // Realtime: subscribe to this organizer's events (by id and by user_id/email) and refetch on change
  useEffect(() => {
    if (!organizer) return
    const candidates = Array.from(new Set([organizer.id, organizer.user_id].filter(Boolean))) as string[]
    if (candidates.length === 0) return

    const channels = candidates.map((owner) =>
      supabase
        .channel(`events-realtime-${owner}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'events', filter: `organizer_id=eq.${owner}` },
          () => { loadEvents() }
        )
        .subscribe()
    )

    return () => {
      for (const ch of channels) {
        try { supabase.removeChannel(ch) } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizer?.id, organizer?.user_id])

  // Sync tab from URL if provided (?tab=all|ongoing|upcoming|completed)
  useEffect(() => {
    const t = searchParams?.get('tab') as typeof tab | null
    if (t && (t === 'all' || t === 'ongoing' || t === 'upcoming' || t === 'completed') && t !== tab) {
      setTab(t)
    }
  }, [searchParams, tab])

  const categories = useMemo(() => {
    const s = new Set(events.map((e) => e.category))
    return ["all", ...Array.from(s)]
  }, [events])

  const now = Date.now()

  const tabbed = useMemo(() => {
    if (tab === "ongoing") return events.filter((e) => isOngoing(e, now))
    if (tab === "upcoming") return events.filter((e) => isUpcoming(e, now))
    if (tab === "completed") return events.filter((e) => isCompleted(e, now))
    return events
  }, [events, tab, now])

  // If the current tab becomes empty but another tab has items, switch to a non-empty tab (prefer all > upcoming > ongoing > completed)
  useEffect(() => {
    if (!events || events.length === 0) return
    const ongoing = events.filter((e) => isOngoing(e, now))
    const upcoming = events.filter((e) => isUpcoming(e, now))
    const completed = events.filter((e) => isCompleted(e, now))
    const bucket = tab === 'ongoing' ? ongoing : tab === 'upcoming' ? upcoming : tab === 'completed' ? completed : events
    if (bucket.length === 0) {
      if (events.length > 0 && tab !== 'all') setTab('all')
      else if (upcoming.length > 0 && tab !== 'upcoming') setTab('upcoming')
      else if (ongoing.length > 0 && tab !== 'ongoing') setTab('ongoing')
      else if (completed.length > 0 && tab !== 'completed') setTab('completed')
    }
  }, [events, tab, now])

  const filtered = useMemo(() => {
    let list = tabbed
    if (q.trim()) {
      const qq = q.toLowerCase()
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(qq) ||
          e.location.toLowerCase().includes(qq) ||
          e.category.toLowerCase().includes(qq),
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
        const st = new Date(e.startAt).getTime()
        return st >= sTime && st <= eTime
      })
    }
    return list
  }, [tabbed, q, category, status, dateFilter])

  function bulkPublish(ids: string[]) {
  setEvents((prev) => prev.map((e) => (ids.includes(e.id) ? ({ ...e, status: "published" } as EventItem) : e)))
  updateEventsStatus(ids, 'published').catch(() => {})
  toast({ title: "Event published", description: `${ids.length} event(s) published` })
  }
  function bulkUnpublish(ids: string[]) {
  setEvents((prev) => prev.map((e) => (ids.includes(e.id) ? ({ ...e, status: "draft" } as EventItem) : e)))
  updateEventsStatus(ids, 'draft').catch(() => {})
  toast({ title: "Event unpublished", description: `${ids.length} event(s) set to Draft` })
  }
  function bulkCancel(ids: string[]) {
  setEvents((prev) => prev.map((e) => (ids.includes(e.id) ? ({ ...e, status: "cancelled" } as EventItem) : e)))
  updateEventsStatus(ids, 'cancelled').catch(() => {})
  toast({ title: "Event cancelled", description: `${ids.length} event(s) cancelled` })
  }
  function bulkExport(ids: string[]) {
    // TODO: integrate real export
    console.log("[export] events:", ids)
    toast({ title: "Export started", description: `Preparing export for ${ids.length} event(s)` })
  }

  return (
    <main className="p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-semibold">Events</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl bg-transparent" onClick={() => {
              // trigger a refetch by nudging search params (no navigation needed in App Router for effect)
              window.history.replaceState(null, '', window.location.pathname + '?refresh=' + Date.now())
            }}>Refresh</Button>
            <Button asChild className="rounded-xl">
              <Link href="/organizer/events/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Event
              </Link>
            </Button>
          </div>
        </div>

    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
          <TabsList className="rounded-xl">
      <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            {loading ? (
              <SkeletonGrid />
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <EventGrid
                items={filtered}
                onPublish={bulkPublish}
                onUnpublish={bulkUnpublish}
                onCancel={bulkCancel}
                onExport={bulkExport}
              />
            )}
          </TabsContent>

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
                items={filtered}
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
                items={filtered}
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
                items={filtered}
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
