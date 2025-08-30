"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card } from "@/components/ui/card"
import { Eye, MoreVertical, Unplug, PlugZap } from "lucide-react"
import type { EventItem } from "@/lib/organizer"
import Link from "next/link"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { toast } from "sonner"

export function EventHeader({ event, onChange }: { event: EventItem; onChange: (patch: Partial<EventItem>) => void }) {
  const isPublished = event.status === "published"

  function togglePublish() {
    onChange({ status: isPublished ? "draft" : "published" })
    toast(isPublished ? "Event unpublished" : "Event published", {
      description: `${event.title} is now ${isPublished ? "Draft" : "Published"}`,
    })
  }

  return (
    <Card className="rounded-2xl bg-card/90 border-border/60 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-[360px] aspect-[21/9] md:aspect-auto md:h-40 bg-muted">
          <Image
            src={event.posterUrl || "/placeholder.svg?height=180&width=360&query=event%20poster"}
            alt={`${event.title} poster`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 360px"
          />
        </div>
        <div className="flex-1 p-4 md:p-5 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-semibold">{event.title}</h1>
              <Badge variant="secondary" className="capitalize">
                {event.status}
              </Badge>
              {event.visibility === "private" && <Badge variant="outline">Private</Badge>}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{event.location}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-xl bg-transparent">
              <Link href={`/events/${event.id}`} prefetch={false}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Link>
            </Button>
            <Button onClick={togglePublish} className="rounded-xl">
              {isPublished ? <Unplug className="h-4 w-4 mr-2" /> : <PlugZap className="h-4 w-4 mr-2" />}
              {isPublished ? "Unpublish" : "Publish"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl bg-transparent" aria-label="More">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <a href="#tickets">Manage Tickets</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#bookings">Bookings</a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <ConfirmDialog
                  title="Cancel event?"
                  description="This will mark the event as cancelled. You can’t sell tickets after cancellation."
                  onConfirm={() => onChange({ status: "cancelled" })}
                >
                  <DropdownMenuItem className="text-red-400">Cancel Event</DropdownMenuItem>
                </ConfirmDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  )
}
