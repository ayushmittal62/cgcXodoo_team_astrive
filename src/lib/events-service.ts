import { supabase } from './supabase'

// Email automation trigger function
async function triggerEmailAutomation(bookingId: string): Promise<void> {
  try {
    console.log(`📧 Triggering email automation for booking: ${bookingId}`)
    
    // Call our Next.js API endpoint to trigger email automation
    const response = await fetch('/api/send-ticket-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingId })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Email API error: ${errorData.error || 'Unknown error'}`)
    }
    
    const result = await response.json()
    console.log('✅ Email automation result:', result.message)
    
  } catch (error) {
    console.error('❌ Failed to trigger email automation:', error)
    throw error
  }
}

export interface Event {
  id: string
  poster: string | null
  logo: string | null
  title: string
  description: string | null
  category: string | null
  date: string
  time: string
  location: string | null
  status: 'draft' | 'published' | 'unpublished' | 'cancelled' | 'completed' | 'ongoing'
  tickets: {
    id: string
    tier: string
    price: number
    stock: number
    per_user_limit: number
  }[]
  organizer?: {
    id: string
    name: string
    email: string
  }
}

export interface EventBookingData {
  event: Event
  tickets: { index: number; tier: string; ticket_id: string }[]
  attendees: { name: string; email: string; phone: string; dob: string }[]
  amount: number
  userId: string
}

// Get booking with QR codes for tickets
export async function getBookingQRCodes(bookingId: string): Promise<any> {
  try {
    const { data: attendees, error } = await supabase
      .from('booking_attendees')
      .select('id, name, qr_code, qr_image_url')
      .eq('booking_id', bookingId)
      .order('id')

    if (error) throw error
    return attendees
  } catch (error) {
    console.error('Error fetching QR codes:', error)
    return []
  }
}

// Fetch all published events with their tickets
export async function getEvents(): Promise<Event[]> {
  try {
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        tickets(*),
        organizers!events_organizer_id_fkey(
          id,
          kyc_verified,
          users!organizers_user_id_fkey(
            id,
            name,
            email
          )
        )
      `)
      .eq('status', 'published')
      .eq('event_type', 'public')  // Only show public events for attendees
      .order('event_date', { ascending: true })

    if (eventsError) throw eventsError

    return events.map((event: any) => {
      // Format date and time for display
      const eventDate = new Date(event.event_date)
      const eventTime = event.event_time
      
      // Format date as "Oct 12, 2025"
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      
      // Format time from HH:MM:SS to "7:00 PM"
      const [hours, minutes] = eventTime.split(':')
      const time = new Date()
      time.setHours(parseInt(hours), parseInt(minutes))
      const formattedTime = time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })

      // Determine status based on current date and event date
      let status = event.status
      const now = new Date()
      const eventDateTime = new Date(`${event.event_date}T${event.event_time}`)
      
      if (event.status === 'published') {
        if (eventDateTime < now) {
          status = 'completed'
        } else if (eventDateTime.toDateString() === now.toDateString()) {
          status = 'ongoing'
        }
      }

      return {
        id: event.id,
        poster: event.cover_poster_url,
        logo: event.logo_url,
        title: event.title,
        description: event.description,
        category: event.category,
        date: formattedDate,
        time: formattedTime,
        location: event.location,
        status: status as Event['status'],
        tickets: event.tickets.map((ticket: any) => ({
          id: ticket.id,
          tier: ticket.ticket_name,
          price: ticket.price,
          stock: ticket.quantity || 100, // Use quantity from your database, fallback to 100
          per_user_limit: ticket.per_user_limit || 5
        })),
        organizer: {
          id: event.organizers.users.id,
          name: event.organizers.users.name,
          email: event.organizers.users.email
        }
      }
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

// Fetch a single event by ID
export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        tickets(*),
        organizers!events_organizer_id_fkey(
          id,
          kyc_verified,
          users!organizers_user_id_fkey(
            id,
            name,
            email
          )
        )
      `)
      .eq('id', eventId)
      .single()

    if (error) throw error
    if (!event) return null

    // Format date and time
    const eventDate = new Date(event.event_date)
    const eventTime = event.event_time
    
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    
    const [hours, minutes] = eventTime.split(':')
    const time = new Date()
    time.setHours(parseInt(hours), parseInt(minutes))
    const formattedTime = time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    // Determine status
    let status = event.status
    const now = new Date()
    const eventDateTime = new Date(`${event.event_date}T${event.event_time}`)
    
    if (event.status === 'published') {
      if (eventDateTime < now) {
        status = 'completed'
      } else if (eventDateTime.toDateString() === now.toDateString()) {
        status = 'ongoing'
      }
    }

    return {
      id: event.id,
      poster: event.cover_poster_url,
      logo: event.logo_url,
      title: event.title,
      description: event.description,
      category: event.category,
      date: formattedDate,
      time: formattedTime,
      location: event.location,
      status: status as Event['status'],
      tickets: event.tickets.map((ticket: any) => ({
        id: ticket.id,
        tier: ticket.ticket_name,
        price: ticket.price,
        stock: ticket.quantity || 100, // Use quantity from your database, fallback to 100
        per_user_limit: ticket.per_user_limit || 5
      })),
      organizer: {
        id: event.organizers.users.id,
        name: event.organizers.users.name,
        email: event.organizers.users.email
      }
    }
  } catch (error) {
    console.error('Error fetching event:', error)
    return null
  }
}

// Create a new booking with full schema integration
export async function createBooking(bookingData: EventBookingData): Promise<string | null> {
  try {
    // Generate unique booking reference
    const bookingReference = `BK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    
    // Get the ticket ID for the selected tier
    const selectedTicket = bookingData.event.tickets.find(t => t.tier === bookingData.tickets[0].tier)
    if (!selectedTicket) throw new Error('Invalid ticket selection')

    console.log('Creating booking for:', {
      eventTitle: bookingData.event.title,
      ticketType: selectedTicket.tier,
      quantity: bookingData.attendees.length,
      totalAmount: bookingData.amount
    })

    // Step 1: Create the main booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        event_id: bookingData.event.id,
        user_id: bookingData.userId,
        ticket_id: selectedTicket.id,
        quantity: bookingData.attendees.length,
        total_amount: bookingData.amount,
        booking_status: 'pending', // Start as pending, will update to confirmed after payment
        booking_reference: bookingReference,
        email_status: 'pending'
      })
      .select('id, booking_reference')
      .single()

    if (bookingError) throw bookingError
    console.log('✅ Booking created:', booking.booking_reference)

    // Step 2: Create individual attendee records with QR codes
    const QRCode = require('qrcode')
    const attendeesData = []
    
    for (let i = 0; i < bookingData.attendees.length; i++) {
      const attendee = bookingData.attendees[i]
      
      // Generate compact QR code data (pipe-separated format to fit in varchar(255))
      const qrData = `${booking.id}|${i}|${bookingData.event.id}|${attendee.name}|${selectedTicket.tier}|${booking.booking_reference}|${Date.now()}`
      
      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      attendeesData.push({
        booking_id: booking.id,
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone,
        dob: attendee.dob ? new Date(attendee.dob).toISOString().split('T')[0] : null,
        qr_code: qrData,
        qr_image_url: qrCodeDataURL,
        qr_generated_at: new Date().toISOString(),
        checked_in: false
      })
    }

    // Insert all attendees
    const { data: createdAttendees, error: attendeesError } = await supabase
      .from('booking_attendees')
      .insert(attendeesData)
      .select('id, name, qr_code')

    if (attendeesError) throw attendeesError
    console.log(`✅ Created ${createdAttendees.length} attendee records with QR codes`)

    // Step 3: Create payment record
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: booking.id,
        transaction_id: transactionId,
        payment_gateway: 'razorpay', // You can change this to your preferred gateway
        amount: bookingData.amount,
        currency: 'INR',
        payment_status: 'success' // In real app, this would be 'initiated' first
      })
      .select('id, transaction_id')
      .single()

    if (paymentError) throw paymentError
    console.log('✅ Payment record created:', payment.transaction_id)

    // Step 4: Update booking status to confirmed after successful payment
    const { error: updateBookingError } = await supabase
      .from('bookings')
      .update({
        booking_status: 'confirmed',
        email_status: 'pending' // Ready for email notification
      })
      .eq('id', booking.id)

    if (updateBookingError) throw updateBookingError
    console.log('✅ Booking confirmed')

    // Step 5: Update event analytics
    try {
      // Check if analytics record exists
      const { data: existingAnalytics } = await supabase
        .from('event_analytics')
        .select('*')
        .eq('event_id', bookingData.event.id)
        .single()

      if (existingAnalytics) {
        // Update existing analytics
        const { error: analyticsUpdateError } = await supabase
          .from('event_analytics')
          .update({
            total_bookings: existingAnalytics.total_bookings + 1,
            total_revenue: parseFloat(existingAnalytics.total_revenue) + bookingData.amount,
            updated_at: new Date().toISOString()
          })
          .eq('event_id', bookingData.event.id)

        if (analyticsUpdateError) throw analyticsUpdateError
      } else {
        // Create new analytics record
        const { error: analyticsCreateError } = await supabase
          .from('event_analytics')
          .insert({
            event_id: bookingData.event.id,
            total_views: 1,
            total_bookings: 1,
            total_revenue: bookingData.amount
          })

        if (analyticsCreateError) throw analyticsCreateError
      }
      console.log('✅ Event analytics updated')
    } catch (analyticsError) {
      console.warn('⚠️ Analytics update failed:', analyticsError)
    }

    // Step 6: Create notification for user
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: bookingData.userId,
        event_id: bookingData.event.id,
        type: 'booking_confirmation',
        message: `Your booking for "${bookingData.event.title}" has been confirmed. Booking reference: ${booking.booking_reference}`,
        read: false
      })

    if (notificationError) {
      console.warn('⚠️ Notification creation failed:', notificationError.message)
    } else {
      console.log('✅ User notification created')
    }

    console.log(`🎉 Complete booking process finished! Booking ID: ${booking.id}`)
    
    // Step 7: Trigger email automation
    try {
      await triggerEmailAutomation(booking.id)
      console.log('✅ Email automation triggered successfully')
    } catch (emailError) {
      console.warn('⚠️ Email automation failed:', emailError)
      // Don't fail the booking if email fails
    }
    
    return booking.id

  } catch (error) {
    console.error('❌ Error creating booking:', error)
    return null
  }
}

// Get user's bookings
export async function getUserBookings(userId: string) {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        events(*),
        tickets(*),
        booking_attendees(*),
        payments(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return bookings.map((booking: any) => ({
      bookingId: booking.id,
      event: {
        id: booking.events.id,
        poster: booking.events.cover_poster_url,
        logo: booking.events.logo_url,
        title: booking.events.title,
        description: booking.events.description,
        category: booking.events.category,
        date: new Date(booking.events.event_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        time: booking.events.event_time,
        location: booking.events.location,
        status: booking.events.status,
        tickets: [{
          tier: booking.tickets.ticket_name,
          price: booking.tickets.price,
          stock: booking.tickets.quantity
        }]
      },
      tickets: booking.booking_attendees.map((attendee: any, index: number) => ({
        index,
        tier: booking.tickets.ticket_name,
        qrCode: attendee.qr_code,
        qrImageUrl: attendee.qr_image_url
      })),
      attendees: booking.booking_attendees.map((attendee: any) => ({
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone,
        dob: attendee.dob,
        qrCode: attendee.qr_code,
        qrImageUrl: attendee.qr_image_url
      })),
      amount: booking.total_amount,
      payment: {
        provider: booking.payments[0]?.payment_gateway || 'unknown',
        status: booking.payments[0]?.payment_status === 'success' ? 'paid' : 'pending'
      }
    }))
  } catch (error) {
    console.error('Error fetching user bookings:', error)
    return []
  }
}

// QR Code Scanning Functions
export async function scanQRCode(qrCodeData: string, scannedBy: string): Promise<{ success: boolean; message: string; attendee?: any }> {
  try {
    console.log('🔍 Scanning QR code...')
    
    // Parse QR code data (compact pipe-separated format)
    // Format: bookingId|attendeeIndex|eventId|attendeeName|ticketType|bookingRef|timestamp
    const qrParts = qrCodeData.split('|')
    if (qrParts.length < 6) {
      return { success: false, message: 'Invalid QR code format' }
    }
    
    // Find the attendee record
    const { data: attendee, error: attendeeError } = await supabase
      .from('booking_attendees')
      .select(`
        *,
        bookings!booking_attendees_booking_id_fkey(
          booking_reference,
          booking_status,
          events!bookings_event_id_fkey(
            title,
            event_date,
            event_time
          )
        )
      `)
      .eq('qr_code', qrCodeData)
      .single()

    if (attendeeError || !attendee) {
      return { success: false, message: 'Invalid QR code or attendee not found' }
    }

    // Check if already checked in
    if (attendee.checked_in) {
      return { 
        success: false, 
        message: `${attendee.name} has already been checked in at ${new Date(attendee.updated_at).toLocaleString()}` 
      }
    }

    // Check if booking is confirmed
    if (attendee.bookings.booking_status !== 'confirmed') {
      return { 
        success: false, 
        message: `Booking ${attendee.bookings.booking_reference} is not confirmed. Status: ${attendee.bookings.booking_status}` 
      }
    }

    // Perform check-in
    const { error: checkinError } = await supabase
      .from('booking_attendees')
      .update({
        checked_in: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', attendee.id)

    if (checkinError) throw checkinError

    // Record QR scan
    const { error: scanError } = await supabase
      .from('qr_scans')
      .insert({
        booking_attendee_id: attendee.id,
        scanned_by: scannedBy,
        scanned_at: new Date().toISOString(),
        valid: true
      })

    if (scanError) throw scanError

    console.log(`✅ ${attendee.name} checked in successfully`)

    return {
      success: true,
      message: `${attendee.name} checked in successfully for ${attendee.bookings.events.title}`,
      attendee: {
        name: attendee.name,
        email: attendee.email,
        event: attendee.bookings.events.title,
        checkInTime: new Date().toLocaleString()
      }
    }

  } catch (error) {
    console.error('❌ QR scan error:', error)
    return { success: false, message: 'Error processing QR code scan' }
  }
}

// Get booking details with QR codes for tickets
export async function getBookingWithQRCodes(bookingId: string): Promise<any> {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        events(
          id,
          title,
          description,
          event_date,
          event_time,
          location,
          cover_poster_url
        ),
        tickets(
          ticket_name,
          price
        ),
        booking_attendees(
          id,
          name,
          email,
          phone,
          dob,
          qr_code,
          qr_image_url,
          qr_generated_at,
          checked_in,
          updated_at
        ),
        payments(
          transaction_id,
          payment_status,
          amount,
          currency,
          created_at
        )
      `)
      .eq('id', bookingId)
      .single()

    if (error) throw error

    return {
      bookingReference: booking.booking_reference,
      status: booking.booking_status,
      totalAmount: booking.total_amount,
      quantity: booking.quantity,
      event: {
        title: booking.events.title,
        date: new Date(booking.events.event_date).toLocaleDateString(),
        time: booking.events.event_time,
        location: booking.events.location,
        poster: booking.events.cover_poster_url
      },
      ticketType: booking.tickets.ticket_name,
      attendees: booking.booking_attendees.map((attendee: any) => ({
        id: attendee.id,
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone,
        dob: attendee.dob,
        qrCode: attendee.qr_code,
        qrImageUrl: attendee.qr_image_url,
        qrGeneratedAt: attendee.qr_generated_at,
        checkedIn: attendee.checked_in,
        checkInTime: attendee.checked_in ? attendee.updated_at : null
      })),
      payment: {
        transactionId: booking.payments[0]?.transaction_id,
        status: booking.payments[0]?.payment_status,
        amount: booking.payments[0]?.amount,
        currency: booking.payments[0]?.currency,
        paidAt: booking.payments[0]?.created_at
      }
    }

  } catch (error) {
    console.error('Error fetching booking with QR codes:', error)
    return null
  }
}

// Get event analytics for organizers
export async function getEventAnalytics(eventId: string): Promise<any> {
  try {
    const { data: analytics, error } = await supabase
      .from('event_analytics')
      .select('*')
      .eq('event_id', eventId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found

    if (!analytics) {
      // Return default analytics if none exist
      return {
        totalViews: 0,
        totalBookings: 0,
        totalRevenue: 0,
        lastUpdated: null
      }
    }

    return {
      totalViews: analytics.total_views,
      totalBookings: analytics.total_bookings,
      totalRevenue: parseFloat(analytics.total_revenue),
      lastUpdated: analytics.updated_at
    }

  } catch (error) {
    console.error('Error fetching event analytics:', error)
    return {
      totalViews: 0,
      totalBookings: 0,
      totalRevenue: 0,
      lastUpdated: null
    }
  }
}

// Function to increment event views
export async function incrementEventViews(eventId: string): Promise<void> {
  try {
    const { data: existingAnalytics } = await supabase
      .from('event_analytics')
      .select('*')
      .eq('event_id', eventId)
      .single()

    if (existingAnalytics) {
      await supabase
        .from('event_analytics')
        .update({
          total_views: existingAnalytics.total_views + 1,
          updated_at: new Date().toISOString()
        })
        .eq('event_id', eventId)
    } else {
      await supabase
        .from('event_analytics')
        .insert({
          event_id: eventId,
          total_views: 1,
          total_bookings: 0,
          total_revenue: 0
        })
    }
  } catch (error) {
    console.warn('Failed to increment event views:', error)
  }
}
