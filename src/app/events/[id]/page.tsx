"use client"

import React, { useEffect, useRef, useState } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { events } from "@/lib/mock-data"

// You'll need to add this to your environment variables
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

// Check if API key is valid (not a URL or placeholder)
const isValidApiKey = (key: string) => {
  return key && 
         key !== "YOUR_API_KEY_HERE" && 
         !key.startsWith("http") && 
         !key.includes("google.com") &&
         key.length > 10
}

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: any
    googleMapsLoaded: boolean
  }
}

// Google Maps component with error handling
function GoogleMap({ location }: { location: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if we have a valid API key
    if (!isValidApiKey(GOOGLE_MAPS_API_KEY)) {
      setMapError("Google Maps API key not configured properly")
      setIsLoading(false)
      return
    }

    const initMap = async () => {
      try {
        // Check if Google Maps is already loaded
        if (!window.google && !window.googleMapsLoaded) {
          // Mark as loading to prevent multiple script loads
          window.googleMapsLoaded = true
          
          const script = document.createElement('script')
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`
          script.async = true
          script.defer = true
          
          // Global callback for Google Maps
          ;(window as any).initGoogleMaps = () => {
            initializeMap()
          }
          
          script.onerror = () => {
            setMapError("Failed to load Google Maps")
            setIsLoading(false)
          }
          
          document.head.appendChild(script)
        } else if (window.google) {
          initializeMap()
        }
      } catch (error) {
        setMapError("Error initializing Google Maps")
        setIsLoading(false)
      }
    }

    const initializeMap = () => {
      if (!mapRef.current || !window.google) {
        setMapError("Google Maps not available")
        setIsLoading(false)
        return
      }

      try {
        // Geocode the location
        const geocoder = new window.google.maps.Geocoder()
        
        geocoder.geocode({ address: location }, (results: any, status: any) => {
          if (status === 'OK' && results?.[0]) {
            const position = results[0].geometry.location
            
            const map = new window.google.maps.Map(mapRef.current!, {
              zoom: 15,
              center: position,
              styles: [
                {
                  featureType: "all",
                  elementType: "geometry.fill",
                  stylers: [{ color: "#1f2937" }]
                },
                {
                  featureType: "all",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#e5e7eb" }]
                },
                {
                  featureType: "water",
                  elementType: "geometry.fill",
                  stylers: [{ color: "#374151" }]
                },
                {
                  featureType: "road",
                  elementType: "geometry.fill",
                  stylers: [{ color: "#4b5563" }]
                }
              ]
            })

            // Add marker
            new window.google.maps.Marker({
              position: position,
              map: map,
              title: location,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#06b6d4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
              }
            })

            mapInstanceRef.current = map
            setIsLoading(false)
          } else {
            setMapError("Location not found")
            setIsLoading(false)
          }
        })
      } catch (error) {
        setMapError("Error geocoding location")
        setIsLoading(false)
      }
    }

    initMap()
  }, [location])

  const openInGoogleMaps = () => {
    const encodedLocation = encodeURIComponent(location)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank')
  }

  const getDirections = () => {
    const encodedLocation = encodeURIComponent(location)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`, '_blank')
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
          <svg className="w-5 h-5 md:w-6 md:h-6 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Event Location
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={getDirections}
            size="sm"
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
            variant="outline"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
            </svg>
            Directions
          </Button>
          <Button
            onClick={openInGoogleMaps}
            size="sm"
            className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30"
            variant="outline"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in Maps
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-slate-300 text-sm md:text-base flex items-start gap-2">
          <svg className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {location}
        </p>
      </div>

      <div 
        ref={mapRef} 
        className="w-full h-64 md:h-80 rounded-xl bg-neutral-800/50 border border-white/5 relative overflow-hidden"
      >
        {mapError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-slate-400 p-6">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm mb-2">Map unavailable</p>
              <p className="text-xs text-slate-500">{mapError}</p>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  onClick={openInGoogleMaps}
                  size="sm"
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30"
                  variant="outline"
                >
                  View on Google Maps
                </Button>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <svg className="w-8 h-8 mx-auto mb-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-sm">Loading map...</p>
            </div>
          </div>
        ) : null}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Click and drag to pan
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Scroll to zoom
        </span>
      </div>
    </div>
  )
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const event = events.find((e) => e.id === id)
  if (!event) return notFound()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'past':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-white/10 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </Link>
          <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-lg transition-all duration-200">
            <Link href={`/events/${id}/book`}>Book Tickets</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent z-10"></div>
        <img
          src={event.poster || "/placeholder.svg"}
          alt={`${event.title} poster`}
          className="w-full h-80 md:h-96 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
              <img
                src={event.logo || "/placeholder.svg"}
                alt={`${event.title} logo`}
                className="h-16 w-16 md:h-20 md:w-20 rounded-2xl object-cover border-2 border-white/20 shadow-2xl flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                  <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(event.status)}`}>
                    {event.status.toUpperCase()}
                  </span>
                  <span className="px-2 md:px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    {event.category}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-slate-300 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium truncate">{event.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Description Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                About This Event
              </h2>
              <p className="text-slate-300 leading-relaxed text-base md:text-lg">{event.description}</p>
            </div>

            {/* Event Details Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Event Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-neutral-800/50 rounded-xl border border-white/5">
                    <div className="p-2 bg-cyan-500/20 rounded-lg flex-shrink-0">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-400">Date</p>
                      <p className="text-white font-semibold truncate">{event.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-neutral-800/50 rounded-xl border border-white/5">
                    <div className="p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-400">Time</p>
                      <p className="text-white font-semibold truncate">{event.time}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-neutral-800/50 rounded-xl border border-white/5">
                    <div className="p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-400">Location</p>
                      <p className="text-white font-semibold truncate">{event.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-neutral-800/50 rounded-xl border border-white/5">
                    <div className="p-2 bg-orange-500/20 rounded-lg flex-shrink-0">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-400">Category</p>
                      <p className="text-white font-semibold truncate">{event.category}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Maps Location */}
            <GoogleMap location={event.location} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Tickets Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Ticket Prices
              </h2>
              <div className="space-y-3">
                {event.tickets.map((ticket) => (
                  <div
                    key={ticket.tier}
                    className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors duration-200"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-1 text-xs font-semibold bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30">
                          {ticket.tier}
                        </span>
                        {ticket.stock <= 10 && ticket.stock > 0 && (
                          <span className="text-xs text-orange-400">Low Stock!</span>
                        )}
                        {ticket.stock === 0 && (
                          <span className="text-xs text-red-400">Sold Out</span>
                        )}
                      </div>
                      <p className="text-xl md:text-2xl font-bold text-white">₹{ticket.price}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm text-slate-400">
                        {ticket.stock > 0 ? `${ticket.stock} left` : 'Sold Out'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button asChild className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-lg transition-all duration-200 py-3">
                <Link href={`/events/${id}/book`} className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Book Your Tickets
                </Link>
              </Button>
            </div>

            {/* Offers Card */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Special Offers
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                  <p className="text-green-300 font-semibold text-sm">🎟️ HIVE10</p>
                  <p className="text-xs text-green-200">10% off on Standard tickets</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <p className="text-blue-300 font-semibold text-sm">⏰ Early Bird</p>
                  <p className="text-xs text-blue-200">VIP early-bird ends 48h before event</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
