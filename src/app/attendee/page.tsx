"use client"
import Link from "next/link"
import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { EventCard } from "@/components/event-card"
import { getEvents, getUserBookings, type Event } from "@/lib/events-service"
import { useBookings } from "@/components/use-bookings-store"
import jsPDF from 'jspdf'

type TabKey = "discover" | "my-bookings"
type FilterKey = "ongoing" | "upcoming" | "past"

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<TabKey>("discover")
  const [filter, setFilter] = useState<FilterKey>("ongoing")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [events, setEvents] = useState<Event[]>([])
  const [realBookings, setRealBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [ticketModal, setTicketModal] = useState<{
    isOpen: boolean
    tickets: Array<{index: number, tier: string, qrCode?: string, qrImageUrl?: string}>
    attendees: Array<{name: string, email: string, phone: string, dob: string, qrCode?: string, qrImageUrl?: string}>
    currentIndex: number
    bookingId: string
    eventTitle: string
  }>({
    isOpen: false,
    tickets: [],
    attendees: [],
    currentIndex: 0,
    bookingId: "",
    eventTitle: ""
  })
  const { bookings } = useBookings()

  // Fetch events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true)
      try {
        const fetchedEvents = await getEvents()
        setEvents(fetchedEvents)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Fetch real bookings from Supabase
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoadingBookings(true)
      try {
        // Use the actual user ID that has bookings with proper QR codes
        const mockUserId = '00000000-0000-0000-0000-000000000001'
        const userBookings = await getUserBookings(mockUserId)
        setRealBookings(userBookings)
        console.log('📱 Loaded bookings with QR codes:', userBookings)
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setIsLoadingBookings(false)
      }
    }

    if (tab === 'my-bookings') {
      fetchBookings()
    }
  }, [tab])

  // Check URL parameter for initial tab
  useEffect(() => {
    const urlTab = searchParams.get('tab')
    if (urlTab === 'my-bookings') {
      setTab('my-bookings')
    }
  }, [searchParams])

  // Check for success message
  const showSuccessMessage = searchParams.get('success') === 'booking-complete'

  // Get unique categories from events
  const categories = useMemo(() => {
    const allCategories = events.map((event: Event) => event.category).filter(Boolean) as string[]
    const uniqueCategories = Array.from(new Set(allCategories)).sort()
    return ["All", ...uniqueCategories]
  }, [events])

  const filteredEvents = useMemo(() => {
    return events.filter((e: Event) => {
      // Status filter - map old status to new schema
      const statusMatch = 
        filter === "ongoing" ? e.status === "ongoing" :
        filter === "upcoming" ? (e.status === "published" || e.status === "ongoing") :
        e.status === "completed"

      // Category filter
      const categoryMatch = selectedCategory === "All" || e.category === selectedCategory

      // Search filter with null checks
      const searchMatch = searchQuery === "" || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.category && e.category.toLowerCase().includes(searchQuery.toLowerCase()))

      return statusMatch && categoryMatch && searchMatch
    })
  }, [events, filter, selectedCategory, searchQuery])

  const myBookings = realBookings.length > 0 ? realBookings : bookings

  // Ticket Modal handlers
  const openTicketModal = (booking: any, ticketIndex: number) => {
    setTicketModal({
      isOpen: true,
      tickets: booking.tickets,
      attendees: booking.attendees,
      currentIndex: ticketIndex,
      bookingId: booking.bookingId,
      eventTitle: booking.event.title
    })
  }

  const closeTicketModal = () => {
    setTicketModal(prev => ({ ...prev, isOpen: false }))
  }

  const nextTicket = () => {
    setTicketModal(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.tickets.length
    }))
  }

  const previousTicket = () => {
    setTicketModal(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.tickets.length - 1 : prev.currentIndex - 1
    }))
  }

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!ticketModal.isOpen) return
      
      switch (e.key) {
        case 'Escape':
          closeTicketModal()
          break
        case 'ArrowLeft':
          if (ticketModal.tickets.length > 1) previousTicket()
          break
        case 'ArrowRight':
          if (ticketModal.tickets.length > 1) nextTicket()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [ticketModal.isOpen, ticketModal.tickets.length])

  // Download all tickets from card view
  const downloadAllTicketsFromCard = async (booking: any) => {
    try {
      if (booking.tickets.length === 1) {
        // For single ticket, download as PNG
        await downloadSingleTicket(booking, 0)
        return
      }

      // For multiple tickets, create PDF
      const pdf = new jsPDF()
      let isFirstPage = true

      for (let i = 0; i < booking.tickets.length; i++) {
        const ticket = booking.tickets[i]
        
        if (!isFirstPage) {
          pdf.addPage()
        }
        isFirstPage = false

        // Create QR code - use the actual QR image from Supabase
        const currentTicket = booking.tickets[i]
        const qrImageUrl = currentTicket.qrImageUrl || booking.attendees[i]?.qrImageUrl || 
          `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${currentTicket.qrCode || `TICKET-${booking.bookingId}-${currentTicket.index}`}&format=png`
        
        // Create canvas for this ticket
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) continue

        // Set canvas dimensions (A4 proportions in pixels)
        canvas.width = 595
        canvas.height = 842

        // Background
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Header background
        const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 120)
        headerGradient.addColorStop(0, '#06b6d4')
        headerGradient.addColorStop(1, '#3b82f6')
        ctx.fillStyle = headerGradient
        ctx.fillRect(0, 0, canvas.width, 120)

        // Event title
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 24px Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(booking.event.title, canvas.width / 2, 40)

        // Ticket info
        ctx.font = 'bold 18px Arial, sans-serif'
        ctx.fillText(`Ticket #${ticket.index + 1}`, canvas.width / 2, 70)
        
        ctx.font = '14px Arial, sans-serif'
        ctx.fillText(`Tier: ${ticket.tier}`, canvas.width / 2, 95)
        
        ctx.font = '12px Arial, sans-serif'
        ctx.fillText(`Booking ID: ${booking.bookingId}`, canvas.width / 2, 115)

        // Load QR code
        try {
          const qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error('Failed to load QR code'))
            img.src = qrImageUrl
          })

          // White background for QR
          ctx.fillStyle = '#ffffff'
          const qrSize = 200
          const qrX = (canvas.width - qrSize) / 2
          const qrY = 180
          ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20)
          
          // Draw QR code
          ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

        } catch (error) {
          // Fallback: draw a placeholder box if QR fails
          ctx.fillStyle = '#ffffff'
          ctx.fillRect((canvas.width - 200) / 2 - 10, 170, 220, 220)
          ctx.fillStyle = '#666666'
          ctx.font = '14px Arial, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('QR Code Unavailable', canvas.width / 2, 280)
        }

        // Add text below QR
        ctx.fillStyle = '#ffffff'
        ctx.font = '16px Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('EventHive Digital Ticket', canvas.width / 2, 420)
        
        ctx.font = '12px Arial, sans-serif'
        ctx.fillStyle = '#a0a0a0'
        ctx.fillText('Present this QR code at the venue entrance', canvas.width / 2, 445)
        ctx.fillText('Please arrive 30 minutes before event time', canvas.width / 2, 465)

        // Border
        ctx.strokeStyle = '#06b6d4'
        ctx.lineWidth = 2
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)

        // Convert canvas to image data
        const imgData = canvas.toDataURL('image/png', 1.0)
        
        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297) // A4 size in mm
      }

      // Download PDF
      pdf.save(`EventHive_${booking.event.title.replace(/[^a-zA-Z0-9]/g, '_')}_All_Tickets.pdf`)

    } catch (error) {
      console.error('Error downloading tickets:', error)
      alert('Failed to download tickets. Please try again.')
    }
  }

  // Download all tickets functionality
  const downloadAllTickets = async () => {
    try {
      if (ticketModal.tickets.length === 1) {
        // For single ticket, download as PNG
        await downloadTicket()
        return
      }

      // For multiple tickets, create PDF
      const pdf = new jsPDF()
      let isFirstPage = true

      for (let i = 0; i < ticketModal.tickets.length; i++) {
        const ticket = ticketModal.tickets[i]
        
        if (!isFirstPage) {
          pdf.addPage()
        }
        isFirstPage = false

        // Create QR code - use the actual QR image from Supabase
        const currentTicket = ticketModal.tickets[i]
        const qrImageUrl = currentTicket.qrImageUrl || ticketModal.attendees[i]?.qrImageUrl || 
          `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${currentTicket.qrCode || `TICKET-${ticketModal.bookingId}-${currentTicket.index}`}&format=png`
        
        // Create canvas for this ticket
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) continue

        // Set canvas dimensions (A4 proportions in pixels)
        canvas.width = 595
        canvas.height = 842

        // Background
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Header background
        const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 120)
        headerGradient.addColorStop(0, '#06b6d4')
        headerGradient.addColorStop(1, '#3b82f6')
        ctx.fillStyle = headerGradient
        ctx.fillRect(0, 0, canvas.width, 120)

        // Event title
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 24px Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(ticketModal.eventTitle, canvas.width / 2, 40)

        // Ticket info
        ctx.font = 'bold 18px Arial, sans-serif'
        ctx.fillText(`Ticket #${ticket.index + 1}`, canvas.width / 2, 70)
        
        ctx.font = '14px Arial, sans-serif'
        ctx.fillText(`Tier: ${ticket.tier}`, canvas.width / 2, 95)
        
        ctx.font = '12px Arial, sans-serif'
        ctx.fillText(`Booking ID: ${ticketModal.bookingId}`, canvas.width / 2, 115)

        // Load QR code
        try {
          const qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error('Failed to load QR code'))
            img.src = qrImageUrl
          })

          // White background for QR
          ctx.fillStyle = '#ffffff'
          const qrSize = 200
          const qrX = (canvas.width - qrSize) / 2
          const qrY = 180
          ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20)
          
          // Draw QR code
          ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

        } catch (error) {
          // Fallback: draw a placeholder box if QR fails
          ctx.fillStyle = '#ffffff'
          ctx.fillRect((canvas.width - 200) / 2 - 10, 170, 220, 220)
          ctx.fillStyle = '#666666'
          ctx.font = '14px Arial, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('QR Code Unavailable', canvas.width / 2, 280)
        }

        // Add text below QR
        ctx.fillStyle = '#ffffff'
        ctx.font = '16px Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('EventHive Digital Ticket', canvas.width / 2, 420)
        
        ctx.font = '12px Arial, sans-serif'
        ctx.fillStyle = '#a0a0a0'
        ctx.fillText('Present this QR code at the venue entrance', canvas.width / 2, 445)
        ctx.fillText('Please arrive 30 minutes before event time', canvas.width / 2, 465)

        // Border
        ctx.strokeStyle = '#06b6d4'
        ctx.lineWidth = 2
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)

        // Convert canvas to image data
        const imgData = canvas.toDataURL('image/png', 1.0)
        
        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297) // A4 size in mm
      }

      // Download PDF
      pdf.save(`EventHive_${ticketModal.eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_All_Tickets.pdf`)

    } catch (error) {
      console.error('Error downloading tickets:', error)
      alert('Failed to download tickets. Please try again.')
    }
  }

  // Download ticket functionality
  const downloadTicket = async () => {
    try {
      const currentTicket = ticketModal.tickets[ticketModal.currentIndex]
      if (!currentTicket) return

      // Use actual QR code from Supabase
      const qrImageUrl = currentTicket.qrImageUrl || ticketModal.attendees[ticketModal.currentIndex]?.qrImageUrl || 
        `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${currentTicket.qrCode || `TICKET-${ticketModal.bookingId}-${currentTicket.index}`}&format=png`
      
      // Create canvas for ticket
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.error('Canvas context not available')
        return
      }

      // Set canvas dimensions
      canvas.width = 600
      canvas.height = 800

      // Background
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Header background
      const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 150)
      headerGradient.addColorStop(0, '#06b6d4')
      headerGradient.addColorStop(1, '#3b82f6')
      ctx.fillStyle = headerGradient
      ctx.fillRect(0, 0, canvas.width, 150)

      // Event title
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(ticketModal.eventTitle, canvas.width / 2, 50)

      // Ticket info
      ctx.font = 'bold 20px Arial, sans-serif'
      ctx.fillText(`Ticket #${currentTicket.index + 1}`, canvas.width / 2, 85)
      
      ctx.font = '16px Arial, sans-serif'
      ctx.fillText(`Tier: ${currentTicket.tier}`, canvas.width / 2, 110)
      
      ctx.font = '14px Arial, sans-serif'
      ctx.fillText(`Booking ID: ${ticketModal.bookingId}`, canvas.width / 2, 135)

      // QR Code section
      const qrImage = new Image()
      qrImage.crossOrigin = 'anonymous'
      
      // Use Promise to handle image loading
      const imageLoaded = new Promise<void>((resolve, reject) => {
        qrImage.onload = () => {
          try {
            // White background for QR
            ctx.fillStyle = '#ffffff'
            const qrSize = 300
            const qrX = (canvas.width - qrSize) / 2
            const qrY = 200
            ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20)
            
            // Draw QR code
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
            
            resolve()
          } catch (err) {
            reject(err)
          }
        }
        qrImage.onerror = () => reject(new Error('Failed to load QR code'))
      })

      // Set QR code source
      qrImage.src = qrImageUrl

      // Wait for image to load
      await imageLoaded

      // Add text below QR
      ctx.fillStyle = '#ffffff'
      ctx.font = '18px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('EventHive Digital Ticket', canvas.width / 2, 550)
      
      ctx.font = '14px Arial, sans-serif'
      ctx.fillStyle = '#a0a0a0'
      ctx.fillText('Present this QR code at the venue entrance', canvas.width / 2, 580)
      ctx.fillText('Please arrive 30 minutes before event time', canvas.width / 2, 610)

      // Border
      ctx.strokeStyle = '#06b6d4'
      ctx.lineWidth = 3
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Failed to create blob')
          return
        }
        
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `EventHive_${ticketModal.eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Ticket_${currentTicket.index + 1}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/png', 1.0)

    } catch (error) {
      console.error('Error downloading ticket:', error)
      alert('Failed to download ticket. Please try again.')
    }
  }

  // Download single ticket from card view
  const downloadSingleTicket = async (booking: any, ticketIndex: number) => {
    try {
      const ticket = booking.tickets[ticketIndex]
      if (!ticket) return

      // Use actual QR code from Supabase
      const qrImageUrl = ticket.qrImageUrl || booking.attendees[ticketIndex]?.qrImageUrl || 
        `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${ticket.qrCode || `TICKET-${booking.bookingId}-${ticket.index}`}&format=png`
      
      // Create canvas for ticket
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        console.error('Canvas context not available')
        return
      }
      // Set canvas dimensions
      canvas.width = 600
      canvas.height = 800

      // Background
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Header background
      const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 150)
      headerGradient.addColorStop(0, '#06b6d4')
      headerGradient.addColorStop(1, '#3b82f6')
      ctx.fillStyle = headerGradient
      ctx.fillRect(0, 0, canvas.width, 150)

      // Event title
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(booking.event.title, canvas.width / 2, 50)

      // Ticket info
      ctx.font = 'bold 20px Arial, sans-serif'
      ctx.fillText(`Ticket #${ticket.index + 1}`, canvas.width / 2, 85)
      
      ctx.font = '16px Arial, sans-serif'
      ctx.fillText(`Tier: ${ticket.tier}`, canvas.width / 2, 110)
      
      ctx.font = '14px Arial, sans-serif'
      ctx.fillText(`Booking ID: ${booking.bookingId}`, canvas.width / 2, 135)

      // QR Code section
      const qrImage = new Image()
      qrImage.crossOrigin = 'anonymous'
    
      // Use Promise to handle image loading
      const imageLoaded = new Promise<void>((resolve, reject) => {
        qrImage.onload = () => {
          try {
            // White background for QR
            ctx.fillStyle = '#ffffff'
            const qrSize = 300
            const qrX = (canvas.width - qrSize) / 2
            const qrY = 200
            ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20)
            
            // Draw QR code
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
            
            resolve()
          } catch (err) {
            reject(err)
          }
        }
        qrImage.onerror = () => reject(new Error('Failed to load QR code'))
      })
      // Set QR code source
      qrImage.src = qrImageUrl

      // Wait for image to load
      await imageLoaded
      // Add text below QR
      ctx.fillStyle = '#ffffff'
      ctx.font = '18px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('EventHive Digital Ticket', canvas.width / 2, 550)
      ctx.font = '14px Arial, sans-serif'
      ctx.fillStyle = '#a0a0a0'
      ctx.fillText('Present this QR code at the venue entrance', canvas.width / 2, 580)
      ctx.fillText(`Event: ${booking.event.date} • ${booking.event.time}`, canvas.width / 2, 610)
      ctx.fillText(`Location: ${booking.event.location}`, canvas.width / 2, 630)
      // Border
      ctx.strokeStyle = '#06b6d4'
      ctx.lineWidth = 3
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Failed to create blob')
          return
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `EventHive_${booking.event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Ticket_${ticket.index + 1}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/png', 1.0)
    } catch (error) {
      console.error('Error downloading ticket:', error)
      alert('Failed to download ticket. Please try again.')

    }
  }

  // Show loading while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if no user after loading is complete
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-white/70 mb-6">
            You need to sign in to access the attendee dashboard.
          </p>
          <button
            onClick={() => window.location.href = '/sign-in'}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors font-medium"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (

    <main className="min-h-dvh bg-neutral-950 text-slate-200">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/attendee" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-500 to-black-600 flex items-center justify-center overflow-hidden" aria-hidden>
              <img src="/logo.png" alt="EventHive Logo" className="h-full w-full" />
            </div>
            <h1 className="text-pretty text-lg font-semibold tracking-tight">EventHive</h1>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Role Switch Toggle */}
            <Link
              href="/organizer"
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 px-4 py-2 text-sm font-medium text-purple-200 transition-all duration-200 hover:border-purple-400/40 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 hover:text-white hover:shadow-lg hover:shadow-purple-500/20"
            >
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Switch to Organizer
              <svg className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <nav className="flex items-center gap-2 rounded-full bg-white/5 p-1 backdrop-blur">
              <button
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm transition",
                  tab === "discover" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10",
                )}
                onClick={() => setTab("discover")}
                aria-pressed={tab === "discover"}
              >
                Discover
              </button>
              <button
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm transition",
                  tab === "my-bookings" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10",
                )}
                onClick={() => setTab("my-bookings")}
                aria-pressed={tab === "my-bookings"}
              >
                My Bookings
              </button>
            </nav>

          </div>
        </div>
      </header>


      {/* Success Message Banner */}
      {showSuccessMessage && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="rounded-2xl border border-green-500/30 bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/30">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-green-400 font-semibold">Booking Successful! 🎉</h3>
                <p className="text-green-300/80 text-sm">Your tickets have been booked successfully. You can find them in your bookings below.</p>
              </div>
              <button 
                onClick={() => {
                  // Remove success parameter from URL
                  const url = new URL(window.location.href)
                  url.searchParams.delete('success')
                  window.history.replaceState({}, '', url.toString())
                }}
                className="text-green-400 hover:text-green-300 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      )}

      <section className="mx-auto max-w-6xl px-4 py-6">
        {tab === "discover" ? (
          <>
            <div className="mb-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-pretty text-xl font-semibold">Discover Events</h2>
                  <p className="text-sm text-slate-400">Find and explore amazing events happening around you.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>{filteredEvents.length} events found</span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search events, locations, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/40 focus:bg-white/10 transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Category Filters */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-300">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category as string)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                        selectedCategory === category
                          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-200 shadow-lg shadow-cyan-500/10"
                          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white"
                      )}
                    >
                      {category}
                      {category !== "All" && (
                        <span className="ml-2 text-xs opacity-70">
                          {events.filter((e: Event) => e.category === category).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filters */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-300">Status</h3>
                  <div className="flex items-center gap-2 rounded-full bg-white/5 p-1 backdrop-blur">
                    {(["ongoing", "upcoming", "past"] as FilterKey[]).map((k) => (
                      <button
                        key={k}
                        className={cn(
                          "rounded-full px-4 py-2 text-sm font-medium capitalize transition-all duration-200",
                          filter === k 
                            ? "bg-white/15 text-white shadow-lg" 
                            : "text-slate-300 hover:bg-white/10 hover:text-white",
                        )}
                        onClick={() => setFilter(k)}
                        aria-pressed={filter === k}
                      >
                        {k}
                        <span className="ml-2 text-xs opacity-70">
                          {events.filter((e: Event) => {
                            if (k === "ongoing") return e.status === "ongoing"
                            if (k === "upcoming") return e.status === "published" || e.status === "ongoing"
                            return e.status === "completed"
                          }).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {(searchQuery || selectedCategory !== "All") && (
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedCategory("All")
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Events Grid */}
            {isLoading ? (
              // Loading State
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white/5 rounded-2xl p-4 space-y-3">
                      <div className="bg-white/10 h-48 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="bg-white/10 h-4 rounded w-3/4"></div>
                        <div className="bg-white/10 h-3 rounded w-1/2"></div>
                        <div className="bg-white/10 h-3 rounded w-2/3"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="bg-white/10 h-8 rounded flex-1"></div>
                        <div className="bg-white/10 h-8 rounded flex-1"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((e) => (
                  <EventCard key={e.id} event={e}>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <Button 
                        asChild 
                        variant="secondary" 
                        className="flex-1 bg-gradient-to-r from-white/10 to-white/5 text-slate-100 hover:from-white/20 hover:to-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
                      >
                        <Link href={`/events/${e.id}`} className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          View Details
                        </Link>
                      </Button>
                      {e.status !== "completed" && e.status !== "cancelled" && (
                        <Button 
                          asChild 
                          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 border-0"
                        >
                          <Link href={`/events/${e.id}/book`} className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                            Book Now
                          </Link>
                        </Button>
                      )}
                      {(e.status === "completed" || e.status === "cancelled") && (
                        <Button 
                          disabled
                          className="flex-1 bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-400 cursor-not-allowed"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {e.status === "completed" ? "Event Ended" : "Event Cancelled"}
                        </Button>
                      )}
                    </div>
                  </EventCard>
                ))}
              </div>
            ) : (
              // No Events Found State
              <div className="text-center py-12">
                <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                  <svg className="h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No events found</h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  We couldn't find any events matching your criteria. Try adjusting your search or filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("All")
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-full font-medium transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/25"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    My Bookings
                  </h2>
                  <p className="text-sm text-slate-400">Manage your tickets with QR codes and event feedback</p>
                </div>
              </div>

              {/* Success Banner */}
              {showSuccessMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-300">Booking Confirmed!</h3>
                      <p className="text-sm text-green-400/80">Your tickets have been generated successfully.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Stats */}
              {myBookings.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 backdrop-blur">
                    <div className="text-2xl font-bold text-blue-400">{myBookings.length}</div>
                    <div className="text-xs text-slate-400">Total Bookings</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 backdrop-blur">
                    <div className="text-2xl font-bold text-green-400">
                      {myBookings.filter(b => b.event.status === "published" || b.event.status === "ongoing").length}
                    </div>
                    <div className="text-xs text-slate-400">Upcoming</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20 backdrop-blur">
                    <div className="text-2xl font-bold text-orange-400">
                      {myBookings.filter(b => b.event.status === "ongoing").length}
                    </div>
                    <div className="text-xs text-slate-400">Ongoing</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur">
                    <div className="text-2xl font-bold text-purple-400">
                      {myBookings.reduce((sum, b) => sum + b.tickets.length, 0)}
                    </div>
                    <div className="text-xs text-slate-400">Total Tickets</div>
                  </div>
                </div>
              )}
            </div>

            {myBookings.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-32 w-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                  <svg className="h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-300 mb-4">No bookings yet</h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  Start discovering amazing events and create your first booking to see them here.
                </p>
                <Button 
                  asChild 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300"
                >
                  <Link href="/attendee" onClick={() => setTab("discover")}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Discover Events
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {myBookings.map((b, index) => (
                  <div 
                    key={b.bookingId} 
                    className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur transition-all duration-300 hover:border-white/20 hover:from-white/10 hover:to-white/5 hover:shadow-2xl hover:shadow-black/20"
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    {/* Event Header */}
                    <div className="mb-6 flex items-start gap-4">
                      <div className="relative">
                        <img
                          src={b.event.logo || "/placeholder.svg"}
                          alt={`${b.event.title} logo`}
                          className="h-16 w-16 rounded-2xl object-cover shadow-lg"
                        />
                        <div className={cn(
                          "absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                          b.event.status === "ongoing" 
                            ? "bg-green-500 text-white" 
                            : (b.event.status === "published")
                            ? "bg-blue-500 text-white"
                            : "bg-gray-500 text-gray-300"
                        )}>
                          {b.tickets.length}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                              {b.event.title}
                            </h3>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {b.event.date} • {b.event.time}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {b.event.location}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider",
                              b.event.status === "ongoing" 
                                ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                                : (b.event.status === "published")
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                            )}>
                              {b.event.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tickets Grid */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-slate-300">Your Tickets</h4>
                        <span className="text-sm text-slate-400">{b.tickets.length} ticket{b.tickets.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {b.tickets.map((t) => (
                          <div 
                            key={t.index} 
                            className="group/ticket relative p-4 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-medium text-slate-400">
                                Ticket #{t.index + 1}
                              </span>
                              <span className="px-2 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-xs font-medium text-cyan-300 border border-cyan-500/20">
                                {t.tier}
                              </span>
                            </div>
                            
                            <div className="relative mb-3 mx-auto w-fit">
                              <button
                                onClick={() => openTicketModal(b, t.index)}
                                className="relative group/qr block focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-neutral-900 rounded-xl"
                              >
                                <img
                                  src={b.attendees[t.index]?.qrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${b.attendees[t.index]?.qrCode || `TICKET-${b.bookingId}-${t.index}`}`}
                                  alt={`QR code for ticket ${t.index + 1}`}
                                  className="h-24 w-24 rounded-xl bg-white p-1 group-hover/ticket:scale-105 group-hover/qr:scale-110 transition-transform duration-300 cursor-pointer"
                                />
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-transparent opacity-0 group-hover/qr:opacity-100 transition-opacity duration-300" />
                                <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/50 opacity-0 group-hover/qr:opacity-100 transition-opacity duration-300">
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                              </button>
                            </div>
                            
                            <div className="text-center">
                              <button 
                                onClick={() => downloadSingleTicket(b, t.index)}
                                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                              >
                                Download Ticket
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons & Feedback */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center gap-3">
                        <Button
                          asChild
                          variant="outline"
                          className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-200"
                        >
                          <Link href={`/events/${b.event.id}`} className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Event Details
                          </Link>
                        </Button>
                        {b.tickets.length > 1 && (
                          <Button
                            onClick={() => downloadAllTicketsFromCard(b)}
                            variant="outline"
                            className="bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/30 hover:text-cyan-300 transition-all duration-200"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download All ({b.tickets.length}) PDF
                          </Button>
                        )}
                      </div>
                      
                      {b.event.status === "completed" && (
                        <div className="flex items-center gap-2 text-sm text-amber-400">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          Rate this event
                        </div>
                      )}
                    </div>

                    {/* Enhanced Feedback Section */}
                    {b.event.status === "completed" && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <EnhancedFeedbackControls bookingId={b.bookingId} eventTitle={b.event.title} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Ticket Modal */}
      {ticketModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeTicketModal}
          />
          
          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-lg mx-auto">
            <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl p-6 border border-white/10 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{ticketModal.eventTitle}</h3>
                  <p className="text-sm text-slate-400">
                    Ticket #{ticketModal.currentIndex + 1} of {ticketModal.tickets.length}
                    {ticketModal.tickets[ticketModal.currentIndex] && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs">
                        {ticketModal.tickets[ticketModal.currentIndex].tier}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={closeTicketModal}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* QR Code Display */}
              <div className="relative mb-6">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <img
                      src={ticketModal.tickets[ticketModal.currentIndex]?.qrImageUrl || ticketModal.attendees[ticketModal.currentIndex]?.qrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticketModal.attendees[ticketModal.currentIndex]?.qrCode || `TICKET-${ticketModal.bookingId}-${ticketModal.currentIndex}`}`}
                      alt={`QR code for ticket ${ticketModal.currentIndex + 1}`}
                      className="w-80 h-80 rounded-2xl bg-white p-4 shadow-lg"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/10 to-transparent" />
                  </div>
                </div>

                {/* Navigation Arrows - Only show if multiple tickets */}
                {ticketModal.tickets.length > 1 && (
                  <>
                    <button
                      onClick={previousTicket}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200 backdrop-blur-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextTicket}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200 backdrop-blur-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Ticket Indicators - Only show if multiple tickets */}
              {ticketModal.tickets.length > 1 && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  {ticketModal.tickets.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setTicketModal(prev => ({ ...prev, currentIndex: index }))}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-200",
                        index === ticketModal.currentIndex
                          ? "bg-cyan-400 scale-125"
                          : "bg-white/30 hover:bg-white/50"
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={downloadAllTickets}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-cyan-500/25"
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {ticketModal.tickets.length === 1 ? 'Download Ticket' : `Download All (${ticketModal.tickets.length}) Tickets`}
                </button>
                <button 
                  onClick={() => {
                    const currentTicket = ticketModal.tickets[ticketModal.currentIndex]
                    const currentAttendee = ticketModal.attendees[ticketModal.currentIndex]
                    
                    // Use actual QR image if available, otherwise generate with real QR code data
                    const qrImageUrl = currentTicket?.qrImageUrl || currentAttendee?.qrImageUrl
                    const qrData = currentAttendee?.qrCode || `TICKET-${ticketModal.bookingId}-${currentTicket.index}`
                    
                    if (qrImageUrl) {
                      // Download the actual QR image from database
                      const link = document.createElement('a')
                      link.href = qrImageUrl
                      link.download = `QR_Code_Ticket_${currentTicket.index + 1}.png`
                      link.click()
                    } else {
                      // Generate QR with actual data
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${qrData}&download=1`
                      const link = document.createElement('a')
                      link.href = qrUrl
                      link.download = `QR_Code_Ticket_${currentTicket.index + 1}.png`
                      link.click()
                    }
                  }}
                  className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-200"
                  title="Download QR Code Only"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              </div>

              {/* Keyboard Shortcuts Hint */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-400">ESC</kbd>
                    Close
                  </span>
                  {ticketModal.tickets.length > 1 && (
                    <>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-400">←</kbd>
                        Previous
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-400">→</kbd>
                        Next
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function EnhancedFeedbackControls({ bookingId, eventTitle }: { bookingId: string; eventTitle: string }) {
  const { feedbackByBookingId, submitFeedback } = useBookings()
  const feedback = feedbackByBookingId[bookingId] || { rating: 0, text: "" }
  const [isExpanded, setIsExpanded] = useState(false)

  const handleRatingClick = (rating: number) => {
    submitFeedback(bookingId, { rating, text: feedback.text })
    if (!isExpanded) setIsExpanded(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="font-medium text-slate-300">Rate your experience</h4>
          {feedback.rating > 0 && (
            <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
              {feedback.rating}/5 ⭐
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => handleRatingClick(rating)}
            className={cn(
              "group relative p-1 rounded-full transition-all duration-200",
              feedback.rating >= rating 
                ? "text-amber-400 scale-110" 
                : "text-slate-500 hover:text-amber-300 hover:scale-105"
            )}
            title={`Rate ${rating} star${rating > 1 ? "s" : ""}`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <div className="absolute inset-0 rounded-full bg-amber-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>
        ))}
        <span className="ml-3 text-sm text-slate-400">
          {feedback.rating === 0 ? "Click to rate" : 
           feedback.rating === 1 ? "Poor" :
           feedback.rating === 2 ? "Fair" :
           feedback.rating === 3 ? "Good" :
           feedback.rating === 4 ? "Very Good" : "Excellent"}
        </span>
      </div>


      {/* Expanded Feedback Form */}
      {isExpanded && (
        <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-white/10">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tell us about your experience with "{eventTitle}"
            </label>
            <textarea
              value={feedback.text}
              onChange={(e) => submitFeedback(bookingId, { rating: feedback.rating, text: e.target.value })}
              placeholder="Share your thoughts, suggestions, or feedback..."
              className="w-full h-24 px-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 resize-none outline-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="recommend"
                  className="rounded border-white/20 bg-neutral-900 text-cyan-500 focus:ring-cyan-500/50"
                />
                <label htmlFor="recommend" className="text-sm text-slate-400">
                  I'd recommend this event
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="updates"
                  className="rounded border-white/20 bg-neutral-900 text-cyan-500 focus:ring-cyan-500/50"
                />
                <label htmlFor="updates" className="text-sm text-slate-400">
                  Notify me of similar events
                </label>
              </div>
            </div>
            
            <Button
              onClick={() => {
                submitFeedback(bookingId, feedback)
                setIsExpanded(false)
              }}
              disabled={feedback.rating === 0}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-cyan-500/25"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Submit Feedback
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function FeedbackControls({ bookingId }: { bookingId: string }) {
  const { feedbackByBookingId, submitFeedback } = useBookings()
  const feedback = feedbackByBookingId[bookingId] || { rating: 0, text: "" }

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-neutral-900 p-3">
      <p className="mb-2 text-sm font-medium">Rate this event</p>
      <div className="mb-2 flex items-center gap-1" role="radiogroup" aria-label="Rating from 1 to 5">
        {[1, 2, 3, 4, 5].map((r) => (
          <button
            key={r}
            aria-checked={feedback.rating === r}
            role="radio"
            onClick={() => submitFeedback(bookingId, { rating: r, text: feedback.text })}
            className={cn(
              "h-6 w-6 rounded-full transition",
              feedback.rating >= r ? "bg-cyan-500" : "bg-white/10 hover:bg-white/20",
            )}
            title={`${r} star${r > 1 ? "s" : ""}`}
          />
        ))}
      </div>
      <textarea
        value={feedback.text}
        onChange={(e) => submitFeedback(bookingId, { rating: feedback.rating, text: e.target.value })}
        placeholder="Share your thoughts..."
        className="mb-2 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-500"
        rows={3}
      />
      <div className="text-right">
        <Button
          type="button"
          className="bg-sky-500 text-neutral-950 hover:bg-sky-400"
          onClick={() => submitFeedback(bookingId, feedback)}
        >
          Submit Feedback
        </Button>
      </div>
    </div>
  )
}
