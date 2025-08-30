import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
