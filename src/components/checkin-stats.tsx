"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockEvents } from "@/lib/mock-data"

export function CheckinStats() {
  const ongoing = mockEvents.filter((e) => e.status === "published")

  return (
    <Card className="rounded-2xl bg-card/90 border-border/60">
      <CardHeader>
        <CardTitle className="text-pretty">Check-in Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ongoing.length === 0 ? (
          <EmptyCheckins />
        ) : (
          ongoing.map((e) => {
            const total = e.tickets.reduce((acc, t) => acc + t.quantity, 0)
            const sold = e.sold
            const checkedIn = Math.round(sold * 0.62) // simulated
            const pct = Math.min(100, Math.round((checkedIn / sold) * 100))
            return (
              <div key={e.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="truncate">{e.title}</div>
                  <div className="text-muted-foreground">
                    {checkedIn}/{sold} checked-in
                  </div>
                </div>
                <Progress value={pct} aria-label={`${e.title} ${pct}% checked-in`} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div>Sold: {sold}</div>
                  <div>Total: {total}</div>
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
