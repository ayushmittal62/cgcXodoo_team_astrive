import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  role: 'admin' | 'attendee' | 'organizer' | 'manager' | 'volunteer'
  created_at?: string
}

export interface Organizer {
  id: string
  user_id: string
  aadhaar_number: string
  pan_number: string
  kyc_verified: boolean
  created_at?: string
}

export interface Event {
  id: string
  organizer_id: string
  logo_url?: string
  cover_poster_url?: string
  title: string
  description?: string
  category?: string
  event_type: 'public' | 'private'
  location?: string
  event_date: string
  event_time: string
  sales_start: string
  sales_end: string
  total_tickets: number
  status: 'draft' | 'published' | 'unpublished' | 'cancelled' | 'completed'
  created_at?: string
  updated_at?: string
}

export interface Ticket {
  id: string
  event_id: string
  ticket_name: string
  price: number
  quantity: number
  per_user_limit: number
  created_at?: string
}

export interface Booking {
  id: string
  event_id: string
  user_id: string
  ticket_id: string
  quantity: number
  total_amount: number
  booking_status: 'pending' | 'confirmed' | 'cancelled' | 'refunded'
  booking_reference: string
  created_at?: string
  email_status?: string
  email_sent_at?: string
  tickets_emailed_at?: string
}

export interface EventAnalytics {
  id: string
  event_id: string
  total_views: number
  total_bookings: number
  total_revenue: number
  updated_at?: string
}

export interface Payment {
  id: string
  booking_id: string
  transaction_id: string
  payment_gateway?: string
  amount: number
  currency: string
  payment_status: 'initiated' | 'success' | 'failed' | 'refunded'
  created_at?: string
}

export interface BookingAttendee {
  id: string
  booking_id: string
  name: string
  email: string
  phone: string
  dob?: string
  qr_code?: string
  checked_in: boolean
  created_at?: string
}

// User Functions
export const createUserProfile = async (userData: {
  firebaseUid: string
  email: string
  displayName?: string
  photoUrl?: string
}) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: userData.firebaseUid, // Use Firebase UID as the user ID
          name: userData.displayName || 'Unknown User',
          email: userData.email,
          role: 'attendee' // default role
        }
      ])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating user profile:', error)
    return { data: null, error }
  }
}

export const getUserProfileByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return { data: null, error }
  }
}

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return { data: null, error }
  }
}

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return { data: null, error }
  }
}

// Organizer Functions
export const getOrganizerByUserId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('organizers')
      .select(`
        *,
        users (*)
      `)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching organizer:', error)
    return { data: null, error }
  }
}

export const createOrganizer = async (organizerData: {
  user_id: string
  aadhaar_number: string
  pan_number: string
}) => {
  try {
    const { data, error } = await supabase
      .from('organizers')
      .insert([organizerData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating organizer:', error)
    return { data: null, error }
  }
}

export const updateOrganizerKyc = async (organizerId: string, kycVerified: boolean) => {
  try {
    const { data, error } = await supabase
      .from('organizers')
      .update({ kyc_verified: kycVerified })
      .eq('id', organizerId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating organizer KYC:', error)
    return { data: null, error }
  }
}

// Event Functions
export const getOrganizerEvents = async (organizerId: string) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching organizer events:', error)
    return { data: [], error }
  }
}

export const createEvent = async (eventData: Partial<Event>) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating event:', error)
    return { data: null, error }
  }
}

export const updateEvent = async (eventId: string, updates: Partial<Event>) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating event:', error)
    return { data: null, error }
  }
}

// Analytics Functions
export const getOrganizerAnalytics = async (organizerId: string) => {
  try {
    // Get events for this organizer
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .eq('organizer_id', organizerId)

    if (eventsError) throw eventsError

    const eventIds = events?.map(event => event.id) || []

    if (eventIds.length === 0) {
      return {
        data: {
          totalEvents: 0,
          totalBookings: 0,
          totalRevenue: 0,
          totalViews: 0
        },
        error: null
      }
    }

    // Get analytics for these events
    const { data: analytics, error: analyticsError } = await supabase
      .from('event_analytics')
      .select('*')
      .in('event_id', eventIds)

    if (analyticsError) throw analyticsError

    // Get bookings for revenue calculation
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('total_amount, booking_status')
      .in('event_id', eventIds)
      .eq('booking_status', 'confirmed')

    if (bookingsError) throw bookingsError

    const totalEvents = events?.length || 0
    const totalBookings = analytics?.reduce((sum, item) => sum + item.total_bookings, 0) || 0
    const totalRevenue = bookings?.reduce((sum, item) => sum + item.total_amount, 0) || 0
    const totalViews = analytics?.reduce((sum, item) => sum + item.total_views, 0) || 0

    return {
      data: {
        totalEvents,
        totalBookings,
        totalRevenue,
        totalViews
      },
      error: null
    }
  } catch (error) {
    console.error('Error fetching organizer analytics:', error)
    return { data: null, error }
  }
}

// Placeholder functions for missing exports
export const getDashboardSummary = async (organizerId: string) => {
  // TODO: Implement dashboard summary
  return { data: null, error: 'Not implemented' }
}

export const getRevenueByPeriod = async (organizerId: string, period: string) => {
  // TODO: Implement revenue by period
  return { data: null, error: 'Not implemented' }
}

export const getOrganizerBookings = async (organizerId: string) => {
  // TODO: Implement organizer bookings
  return { data: [], error: null }
}

export const getOrganizerFeedback = async (organizerId: string) => {
  // TODO: Implement organizer feedback
  return { data: [], error: null }
}
