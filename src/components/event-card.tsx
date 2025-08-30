"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Eye, BarChart3, Ticket, Pencil, Upload, ShieldBan } from "lucide-react"
import type { EventItem } from "@/lib/organizer"
import { formatCurrencyINR, formatDateRangeISO } from "@/lib/formatters"

export function EventCard({ event }: { event: EventItem }) {
  const href = `/organizer/events/${event.id}`
  const statusMap: Record<EventItem["status"], string> = {
    draft: "Draft",
    published: "Published",
    completed: "Completed",
    cancelled: "Cancelled",
  }

  return (
    <Card className="group overflow-hidden rounded-2xl bg-card/90 border-border/60 hover:border-border motion-safe:transition-colors">
      <CardHeader className="p-0">
        <div className="relative aspect-[21/9] w-full bg-muted">
          <Image
            src={event.posterUrl || "/placeholder.svg?height=180&width=360&query=event%20poster"}
            alt={`${event.title} poster`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={false}
          />
          <div className="absolute left-2 top-2 flex items-center gap-2">
            {event.status !== "published" && <Badge variant="secondary">{statusMap[event.status]}</Badge>}
            {event.visibility === "private" && <Badge variant="outline">Private</Badge>}
            {event.ticketsLeft <= 0 && <Badge variant="destructive">Sold Out</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 md:p-4">
        <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-ring rounded-md">
          <h3 className="text-sm md:text-base font-medium text-balance line-clamp-1">{event.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{formatDateRangeISO(event.startAt, event.endAt)}</p>
          <p className="text-xs text-muted-foreground">{event.location}</p>
        </Link>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-muted/40 px-2 py-1">
            Revenue: <span className="font-medium">{formatCurrencyINR(event.revenue)}</span>
          </div>
          <div className="rounded-lg bg-muted/40 px-2 py-1">
            Tickets Left: <span className="font-medium">{event.ticketsLeft}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3 md:p-4 flex items-center justify-between">
        <Button asChild size="sm" className="rounded-xl">
          <Link href={href}>
            <Eye className="h-4 w-4 mr-2" />
            Overview
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-xl bg-transparent" aria-label="More actions">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <a href={`${href}#analytics`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Ticket className="h-4 w-4 mr-2" />
              Ticket Inventory
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Upload className="h-4 w-4 mr-2" />
              Export Bookings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Pencil className="h-4 w-4 mr-2" />
              Modify
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ShieldBan className="h-4 w-4 mr-2" />
              Publish/Unpublish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}
