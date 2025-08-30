"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockFeedback, mockEvents } from "@/lib/mock-data"
import { formatDateTimeISO } from "@/lib/formatters"
import { Star } from "lucide-react"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function FeedbackList() {
  const [minRating, setMinRating] = useState(0)

  const items = useMemo(() => mockFeedback.filter((f) => f.rating >= minRating), [minRating])
  const eventMap = new Map(mockEvents.map((e) => [e.id, e.title]))

  return (
    <Card className="rounded-2xl bg-card/90 border-border/60">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Ratings & Feedback</CardTitle>
        <div className="flex items-center gap-1">
          {[0, 3, 4, 5].map((r) => (
            <Button
              key={r}
              size="sm"
              variant={minRating === r ? "default" : "outline"}
              className="rounded-xl"
              onClick={() => setMinRating(r)}
              aria-pressed={minRating === r}
            >
              {r === 0 ? "All" : `${r}+`}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No feedback yet.</div>
        ) : (
          items.map((f) => (
            <div key={f.id} className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <div className="flex items-center justify-between">
                <div className="font-medium">{eventMap.get(f.eventId) ?? f.eventId}</div>
                <div className="text-xs text-muted-foreground">{formatDateTimeISO(f.createdAt)}</div>
              </div>
              <div className="mt-1 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4", i < f.rating ? "text-amber-400" : "text-muted-foreground")} />
                ))}
                <Badge variant="secondary" className="ml-2">
                  {f.rating}.0
                </Badge>
              </div>
              <p className="mt-2 text-sm text-pretty">{f.comment}</p>
              <div className="mt-1 text-xs text-muted-foreground">— {f.reviewer}</div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
