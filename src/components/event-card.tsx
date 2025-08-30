import Link from "next/link"
import type { ReactNode } from "react"

type TicketInfo = { tier: "Basic" | "Standard" | "VIP"; price: number; stock: number }
export type Event = {
  id: string
  poster: string
  logo: string
  title: string
  description: string
  category: string
  date: string
  time: string
  location: string
  status: "ongoing" | "upcoming" | "past"
  tickets: TicketInfo[]
}

export function EventCard({
  event,
  children,
}: {
  event: Event
  children?: ReactNode
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-cyan-500/40 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.25)] hover:shadow-cyan-500/20 backdrop-blur">
      <Link href={`/events/${event.id}`} className="block">
        <img
          src={event.poster || "/placeholder.svg"}
          alt={`${event.title} poster`}
          className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      </Link>
      <div className="p-4">
        <div className="mb-3 flex items-center gap-3">
          <img src={event.logo || "/placeholder.svg"} alt="" className="h-8 w-8 rounded-md object-cover" />
          <div>
            <h3 className="text-pretty text-sm font-semibold">{event.title}</h3>
            <p className="text-xs text-slate-400">
              {event.date} • {event.time} • {event.location}
            </p>
          </div>
        </div>
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-slate-300">
            {event.category}
          </span>
          <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-300">{event.status}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
            From <span className="font-medium text-slate-200">${Math.min(...event.tickets.map((t) => t.price))}</span>
          </div>
          {children}
        </div>
      </div>
    </article>
  )
}
