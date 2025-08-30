"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getOrganizerFeedback, type Organizer } from "@/lib/supabase"
import { formatDateTimeISO } from "@/lib/formatters"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface Feedback {
  id: string
  rating: number
  comment?: string
  created_at?: string
  user_name?: string
}

interface FeedbackListProps {
  organizer: Organizer | null
}

interface FeedbackWithEvent extends Feedback {
  event_title?: string
}

export function FeedbackList({ organizer }: FeedbackListProps) {
  const [minRating, setMinRating] = useState(0)
  const [feedback, setFeedback] = useState<FeedbackWithEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizer) {
      setLoading(false)
      return
    }

    const fetchFeedback = async () => {
      try {
        const { data: feedbackData, error } = await getOrganizerFeedback(organizer.id)
        
        if (error) {
          console.error('Error fetching feedback:', error)
          setFeedback([])
        } else {
          setFeedback(feedbackData || [])
        }
      } catch (err) {
        console.error('Error in fetchFeedback:', err)
        setFeedback([])
      } finally {
        setLoading(false)
      }
    }

    fetchFeedback()
  }, [organizer])

  const filteredItems = useMemo(() => 
    feedback.filter((f) => f.rating >= minRating), 
    [feedback, minRating]
  )

  if (loading) {
    return (
      <Card className="rounded-2xl bg-card/90 border-border/60">
        <CardHeader>
          <CardTitle>Ratings & Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

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
        {filteredItems.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {feedback.length === 0 
              ? "No feedback yet. Feedback will appear here when attendees rate your events."
              : "No feedback matches the current rating filter."
            }
          </div>
        ) : (
          filteredItems.slice(0, 5).map((f) => ( // Show only first 5 feedback items
            <div key={f.id} className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <div className="flex items-center justify-between">
                <div className="font-medium">{f.event_title || 'Unknown Event'}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDateTimeISO(f.created_at || '')}
                </div>
              </div>
              <div className="mt-1 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={cn(
                      "h-4 w-4", 
                      i < f.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"
                    )} 
                  />
                ))}
                <Badge variant="secondary" className="ml-2">
                  {f.rating}.0
                </Badge>
              </div>
              {f.comment && (
                <p className="mt-2 text-sm text-pretty">{f.comment}</p>
              )}
              <div className="mt-1 text-xs text-muted-foreground">
                — {f.user_name || 'Anonymous'}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
