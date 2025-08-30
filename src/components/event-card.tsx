import Link from "next/link"
import type { ReactNode } from "react"

type TicketInfo = { tier: string; price: number; stock: number }
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
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ongoing':
        return {
          bg: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
          border: 'border-green-500/30',
          text: 'text-green-400',
          glow: 'shadow-green-500/20',
          pulse: 'animate-pulse'
        }
      case 'upcoming':
        return {
          bg: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          glow: 'shadow-blue-500/20',
          pulse: ''
        }
      case 'past':
        return {
          bg: 'bg-gradient-to-r from-gray-500/20 to-slate-500/20',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          glow: 'shadow-gray-500/20',
          pulse: ''
        }
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500/20 to-slate-500/20',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          glow: 'shadow-gray-500/20',
          pulse: ''
        }
    }
  }

  const getCategoryConfig = (category: string) => {
    const configs: Record<string, any> = {
      'Music': {
        bg: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        icon: '🎵'
      },
      'Conference': {
        bg: 'bg-gradient-to-r from-orange-500/20 to-red-500/20',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        icon: '🎤'
      },
      'Design': {
        bg: 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20',
        border: 'border-teal-500/30',
        text: 'text-teal-400',
        icon: '🎨'
      },
      default: {
        bg: 'bg-gradient-to-r from-slate-500/20 to-gray-500/20',
        border: 'border-slate-500/30',
        text: 'text-slate-400',
        icon: '📅'
      }
    }
    return configs[category] || configs.default
  }

  const statusConfig = getStatusConfig(event.status)
  const categoryConfig = getCategoryConfig(event.category)
  const minPrice = Math.min(...event.tickets.map((t) => t.price))
  const maxPrice = Math.max(...event.tickets.map((t) => t.price))
  const totalStock = event.tickets.reduce((sum, t) => sum + t.stock, 0)

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-sm transition-all duration-500 hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1">
      {/* Clickable Card Link Overlay */}
      <Link 
        href={`/events/${event.id}`} 
        className="absolute inset-0 z-10"
        aria-label={`View details for ${event.title}`}
      />

      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-500/[0.01] to-blue-500/[0.02] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      {/* Status Badge - Floating */}
      <div className="absolute top-3 right-3 z-20">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text} ${statusConfig.glow} ${statusConfig.pulse} shadow-lg`}>
          {event.status === 'ongoing' && <span className="mr-1">🔴</span>}
          {event.status === 'upcoming' && <span className="mr-1">📅</span>}
          {event.status === 'past' && <span className="mr-1">✓</span>}
          {event.status.toUpperCase()}
        </div>
      </div>

      {/* Image Section with Enhanced Effects */}
      <div className="relative overflow-hidden">
        <img
          src={event.poster || "/placeholder.svg"}
          alt={`${event.title} poster`}
          className="h-48 w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
        />
        {/* Image Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        
        {/* Floating Logo */}
        <div className="absolute bottom-3 left-3 z-20">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-black/50 backdrop-blur-md border border-white/20 transition-all duration-300 group-hover:scale-105 group-hover:bg-black/70">
            <img 
              src={event.logo || "/placeholder.svg"} 
              alt="" 
              className="w-8 h-8 rounded-lg object-cover" 
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative p-5 space-y-4 z-20">
        {/* Title and Category */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 group-hover:text-cyan-100 transition-colors duration-300">
              {event.title}
            </h3>
          </div>
          
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${categoryConfig.bg} ${categoryConfig.border} ${categoryConfig.text}`}>
            <span>{categoryConfig.icon}</span>
            {event.category}
          </div>
        </div>

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 gap-3">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <div className="flex items-center justify-center w-5 h-5 rounded bg-cyan-500/20">
              <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-medium">{event.date}</span>
            <span className="text-slate-400">•</span>
            <span>{event.time}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <div className="flex items-center justify-center w-5 h-5 rounded bg-purple-500/20">
              <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-neutral-800/50 to-neutral-700/30 border border-white/5">
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Tickets from</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-white">₹{minPrice}</span>
              {minPrice !== maxPrice && (
                <span className="text-sm text-slate-400">- ₹{maxPrice}</span>
              )}
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-slate-400">Available</p>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${totalStock > 50 ? 'bg-green-400' : totalStock > 10 ? 'bg-orange-400' : 'bg-red-400'}`} />
              <span className="text-sm font-semibold text-white">{totalStock} tickets</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 relative z-30">
          {children}
        </div>

        {/* Description Preview */}
        <div className="pt-2 border-t border-white/5">
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>
      </div>

      {/* Animated Border Effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-xl" />
      </div>
    </article>
  )
}
