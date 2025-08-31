"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Organizer, type Event } from "@/lib/supabase"
import { getOrganizerEvents } from "@/lib/supabase"

interface CheckinStatsProps {
  organizer: Organizer | null
}

interface EventWithStats extends Event {
  total_bookings?: number
  checked_in_count?: number
}

export function CheckinStats({ organizer }: CheckinStatsProps) {
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizer) {
      setLoading(false)
      return
    }

    const fetchEvents = async () => {
      try {
        const { data: eventsData, error } = await getOrganizerEvents(organizer.id)
        
        if (error) {
          console.error('Error fetching events:', error)
          setEvents([])
        } else {
          // Filter only published/active events
          const activeEvents = (eventsData || []).filter(event => 
            event.status === 'published' || event.status === 'active'
          )
          setEvents(activeEvents)
        }
      } catch (err) {
        console.error('Error in fetchEvents:', err)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [organizer])

  if (loading) {
    return (
      <Card className="rounded-2xl bg-card/90 border-border/60">
        <CardHeader>
          <CardTitle className="text-pretty">Check-in Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl bg-card/90 border-border/60">
      <CardHeader>
        <CardTitle className="text-pretty">Check-in Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.length === 0 ? (
          <EmptyCheckins />
        ) : (
          events.slice(0, 3).map((event) => { // Show only first 3 events to avoid overcrowding
            const sold = event.total_bookings || 0
            const checkedIn = event.checked_in_count || 0
            const pct = sold > 0 ? Math.round((checkedIn / sold) * 100) : 0
            
            return (
              <div key={event.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="truncate">{event.title}</div>
                  <div className="text-muted-foreground">
                    {checkedIn}/{sold} checked-in
                  </div>
                </div>
                <Progress value={pct} aria-label={`${event.title} ${pct}% checked-in`} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div>Sold: {sold}</div>
                  <div>Total Tickets: {event.total_tickets || 'Unlimited'}</div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

function EmptyCheckins() {
  return (
    <div className="text-sm text-muted-foreground">
      No ongoing events. Create and publish an event to start seeing check-in progress.
    </div>
  )
}
