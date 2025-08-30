// Get user profile by email
export async function getUserProfileByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  return { data, error };
}

// Create user profile
export async function createUserProfile(profile: {
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
}) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: profile.firebaseUid,
      email: profile.email,
      name: profile.displayName ?? '',
      photo_url: profile.photoUrl ?? null,
      role: 'attendee',
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  return { data, error };
}
// Get all events for an organizer
export async function getOrganizerEvents(organizerId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false });
  return { data, error };
}

// Get feedback for an organizer (stub, implement as needed)
export async function getOrganizerFeedback(organizerId: string) {
  // Example: just return empty array for now
  return { data: [], error: null };
}
// Get organizer by user id (email)
export async function getOrganizerByUserId(userId: string) {
  const { data, error } = await supabase
    .from('organizers')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
}

// Get organizer analytics (stub, implement as needed)
export async function getOrganizerAnalytics(organizerId: string) {
  // Example: count events and bookings
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id')
    .eq('organizer_id', organizerId);
  if (eventsError) return { data: null, error: eventsError };
  const eventIds = events?.map(e => e.id) ?? [];
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id')
    .in('event_id', eventIds);
  if (bookingsError) return { data: null, error: bookingsError };
  return {
    data: {
      totalEvents: eventIds.length,
      totalBookings: bookings?.length ?? 0
    },
    error: null
  };
}

// Get revenue by period (stub, implement as needed)
export async function getRevenueByPeriod(organizerId: string, period: string) {
  // Example: just return empty array for now
  return { data: [], error: null };
}

// Get dashboard summary (stub, implement as needed)
export async function getDashboardSummary(organizerId: string) {
  // Example: just return empty summary for now
  return { data: [{
    total_events: 0,
    total_revenue: 0,
    total_bookings: 0,
    total_attendees: 0,
    active_events: 0,
    draft_events: 0
  }], error: null };
}
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Event = {
  id: string
  organizer_id: string
  title: string
  description?: string
  category?: string
  event_type?: string
  location?: string
  event_date?: string
  event_time?: string
  sales_start?: string
  sales_end?: string
  total_tickets?: number
  status?: string
  created_at?: string
  updated_at?: string
}

// Add these type exports at the top or bottom of supabase.ts
export type Organizer = {
  id: string
  user_id: string
  aadhaar_number: string
  pan_number: string
  kyc_verified: boolean
  created_at: string
}

export type Booking = {
  id: string
  event_id: string
  user_id: string
  ticket_id: string
  quantity: number
  total_amount: number
  booking_status: string
  booking_reference: string
  created_at: string
  email_status?: string
  email_sent_at?: string | null
  tickets_emailed_at?: string | null
}

// Add this function to supabase.ts
export async function getOrganizerBookings(organizerId: string) {
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title')
    .eq('organizer_id', organizerId)

  if (eventsError) {
    return { data: null, error: eventsError }
  }
  const eventIds = events?.map(e => e.id) ?? []

  if (eventIds.length === 0) {
    return { data: [], error: null }
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      *,
      events(title),
      users(name, email, phone),
      payments(payment_status),
      booking_attendees(checked_in)
    `)
    .in('event_id', eventIds)
    .order('created_at', { ascending: false })

  if (bookingsError) {
    return { data: null, error: bookingsError }
  }

  const transformed = (bookings ?? []).map((booking: any) => ({
    ...booking,
    event_title: booking.events?.title ?? 'Unknown Event',
    user_name: booking.users?.name ?? '',
    user_email: booking.users?.email ?? '',
    user_phone: booking.users?.phone ?? '',
    payment_status: booking.payments?.payment_status ?? booking.booking_status,
    checked_in: Array.isArray(booking.booking_attendees)
      ? booking.booking_attendees.some((att: any) => att.checked_in)
      : false
  }))

  return { data: transformed, error: null }
}

// Database types based on your schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          role: 'admin' | 'attendee' | 'manager' | 'volunteer'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          role: 'admin' | 'attendee' | 'manager' | 'volunteer'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          role?: 'admin' | 'attendee' | 'manager' | 'volunteer'
          created_at?: string
        }
      }
      organizers: {
        Row: {
          id: string
          user_id: string
          aadhaar_number: string
          pan_number: string
          kyc_verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          aadhaar_number: string
          pan_number: string
          kyc_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          aadhaar_number?: string
          pan_number?: string
          kyc_verified?: boolean
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          organizer_id: string
          logo_url: string | null
          cover_poster_url: string | null
          title: string
          description: string | null
          category: string | null
          event_type: 'public' | 'private'
          location: string | null
          event_date: string
          event_time: string
          sales_start: string
          sales_end: string
          total_tickets: number
          status: 'draft' | 'published' | 'unpublished' | 'cancelled' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          logo_url?: string | null
          cover_poster_url?: string | null
          title: string
          description?: string | null
          category?: string | null
          event_type: 'public' | 'private'
          location?: string | null
          event_date: string
          event_time: string
          sales_start: string
          sales_end: string
          total_tickets: number
          status?: 'draft' | 'published' | 'unpublished' | 'cancelled' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          logo_url?: string | null
          cover_poster_url?: string | null
          title?: string
          description?: string | null
          category?: string | null
          event_type?: 'public' | 'private'
          location?: string | null
          event_date?: string
          event_time?: string
          sales_start?: string
          sales_end?: string
          total_tickets?: number
          status?: 'draft' | 'published' | 'unpublished' | 'cancelled' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          event_id: string
          ticket_name: string
          price: number
          quantity: number
          per_user_limit: number
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          ticket_name: string
          price?: number
          quantity: number
          per_user_limit?: number
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          ticket_name?: string
          price?: number
          quantity?: number
          per_user_limit?: number
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          event_id: string
          user_id: string
          ticket_id: string
          quantity: number
          total_amount: number
          booking_status: 'pending' | 'confirmed' | 'cancelled' | 'refunded'
          booking_reference: string
          created_at: string
          email_status: string
          email_sent_at: string | null
          tickets_emailed_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          ticket_id: string
          quantity: number
          total_amount: number
          booking_status?: 'pending' | 'confirmed' | 'cancelled' | 'refunded'
          booking_reference: string
          created_at?: string
          email_status?: string
          email_sent_at?: string | null
          tickets_emailed_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          ticket_id?: string
          quantity?: number
          total_amount?: number
          booking_status?: 'pending' | 'confirmed' | 'cancelled' | 'refunded'
          booking_reference?: string
          created_at?: string
          email_status?: string
          email_sent_at?: string | null
          tickets_emailed_at?: string | null
        }
      }
      booking_attendees: {
        Row: {
          id: string
          booking_id: string
          name: string
          email: string
          phone: string
          dob: string | null
          qr_code: string | null
          checked_in: boolean
          created_at: string
          updated_at: string
          qr_png_url: string | null
          qr_generated_at: string | null
          qr_image_url: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          name: string
          email: string
          phone: string
          dob?: string | null
          qr_code?: string | null
          checked_in?: boolean
          created_at?: string
          updated_at?: string
          qr_png_url?: string | null
          qr_generated_at?: string | null
          qr_image_url?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          name?: string
          email?: string
          phone?: string
          dob?: string | null
          qr_code?: string | null
          checked_in?: boolean
          created_at?: string
          updated_at?: string
          qr_png_url?: string | null
          qr_generated_at?: string | null
          qr_image_url?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          transaction_id: string
          payment_gateway: string | null
          amount: number
          currency: string
          payment_status: 'initiated' | 'success' | 'failed' | 'refunded'
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          transaction_id: string
          payment_gateway?: string | null
          amount: number
          currency?: string
          payment_status?: 'initiated' | 'success' | 'failed' | 'refunded'
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          transaction_id?: string
          payment_gateway?: string | null
          amount?: number
          currency?: string
          payment_status?: 'initiated' | 'success' | 'failed' | 'refunded'
          created_at?: string
        }
      }
    }
  }
}

export { createClient }
