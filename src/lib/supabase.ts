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
  email: string;
  displayName?: string;
  photoUrl?: string;
}) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      email: profile.email,
      name: profile.displayName ?? '',
      phone: null,
      role: 'attendee',
      kycVerified: false,
      photoUrl: profile.photoUrl ?? null
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

// Update status for multiple events
export async function updateEventsStatus(
  ids: string[],
  status: 'draft' | 'published' | 'unpublished' | 'cancelled' | 'completed'
) {
  if (!ids || ids.length === 0) return { data: null, error: null }
  const { data, error } = await supabase
    .from('events')
    .update({ status })
    .in('id', ids)
    .select('id, status')
  return { data, error }
}

// Create event with ticket tiers
export async function createEventWithTickets(
  organizerId: string,
  payload: {
    title: string
    description?: string
    location?: string
    category?: string
    visibility: 'public' | 'private' | 'unlisted'
    posterUrl?: string
    startAt: string // ISO datetime
    endAt: string // ISO datetime
    status?: 'draft' | 'published' | 'unpublished' | 'cancelled' | 'completed'
    tickets: Array<{ name: string; price: number; quantity: number; perUserLimit?: number | null }>
  }
) {
  const eventType: 'public' | 'private' = payload.visibility === 'public' ? 'public' : 'private'
  const start = new Date(payload.startAt)
  const end = new Date(payload.endAt)
  const event_date = start.toISOString().slice(0, 10)
  const event_time = start.toISOString().slice(11, 19)
  const totalTickets = payload.tickets.reduce((sum, t) => sum + (t.quantity || 0), 0)

  // 1) Create event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      organizer_id: organizerId,
      title: payload.title,
      description: payload.description ?? null,
      category: payload.category ?? null,
      event_type: eventType,
      location: payload.location ?? null,
      cover_poster_url: payload.posterUrl ?? null,
      event_date,
      event_time,
      sales_start: start.toISOString(),
      sales_end: end.toISOString(),
      total_tickets: totalTickets,
      status: payload.status ?? 'published',
    })
    .select('*')
    .single()

  if (eventError || !event) {
    return { data: null, error: eventError ?? new Error('Failed to create event') }
  }

  // 2) Create tickets (best-effort)
  if (payload.tickets.length > 0) {
    const { error: ticketsError } = await supabase
      .from('tickets')
      .insert(
        payload.tickets.map((t) => ({
          event_id: event.id,
          ticket_name: t.name,
          price: Number(t.price || 0),
          quantity: Number(t.quantity || 0),
          per_user_limit: t.perUserLimit ?? 0,
        }))
      )

    if (ticketsError) {
      // Don't fail hard; return event but include error
      return { data: event, error: ticketsError }
    }
  }

  return { data: event, error: null }
}
// Get organizer by user id (email)
export async function getOrganizerByUserId(userId: string) {
  const key = (userId || '')
  const isEmail = key.includes('@')
  const primary = isEmail ? key.toLowerCase() : key

  let { data, error } = await supabase
    .from('organizers')
    .select('*')
    .eq('user_id', primary)
    .single();

  // Fallback: if looked up by email and not found, try case-insensitive match
  if ((error && (error as any).code === 'PGRST116') || (!data && isEmail)) {
    const res2 = await supabase
      .from('organizers')
      .select('*')
      .ilike('user_id', key)
      .single()
    data = res2.data as any
    error = res2.error as any
  }

  return { data, error };
}

// Create organizer profile
export async function createOrganizerProfile(userEmail: string, organizerData: {
  aadhaar_number: string;
  pan_number: string;
  kyc_verified?: boolean;
}) {
  const { data, error } = await supabase
    .from('organizers')
    .insert({
      user_id: userEmail,
      aadhaar_number: organizerData.aadhaar_number,
      pan_number: organizerData.pan_number,
      kyc_verified: organizerData.kyc_verified ?? false
    })
    .select()
    .single();
  return { data, error };
}

// Update organizer profile (creates one if missing)
export async function updateOrganizerProfile(userEmail: string, updates: Partial<{
  aadhaar_number: string;
  pan_number: string;
  kyc_verified: boolean;
}>) {
  const email = (userEmail || '').toLowerCase()
  // Try update first
  const { data: existing, error: fetchError } = await supabase
    .from('organizers')
    .select('id')
    .eq('user_id', email)
    .single()

  if (fetchError) {
    // If not found, create
    if ((fetchError as any).code === 'PGRST116' || (fetchError as any).message?.includes('No rows')) {
      return await createOrganizerProfile(email, {
        aadhaar_number: updates.aadhaar_number ?? '',
        pan_number: updates.pan_number ?? '',
        kyc_verified: updates.kyc_verified ?? false,
      })
    }
    return { data: null, error: fetchError }
  }

  const { data, error } = await supabase
    .from('organizers')
    .update({
      ...(updates.aadhaar_number !== undefined ? { aadhaar_number: updates.aadhaar_number } : {}),
      ...(updates.pan_number !== undefined ? { pan_number: updates.pan_number } : {}),
      ...(updates.kyc_verified !== undefined ? { kyc_verified: updates.kyc_verified } : {}),
    })
    .eq('user_id', email)
    .select()
    .single()

  return { data, error }
}

// Set organizer KYC verified flag
export async function setOrganizerKycVerified(userEmail: string, verified: boolean) {
  return updateOrganizerProfile(userEmail, { kyc_verified: verified })
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

// Get revenue by period using bookings totals and simple client-side aggregation
export async function getRevenueByPeriod(organizerId: string, period: 'daily' | 'weekly' | 'monthly') {
  // 1) Get organizer event IDs
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id')
    .eq('organizer_id', organizerId)

  if (eventsError) return { data: null, error: eventsError }
  const eventIds = (events ?? []).map(e => e.id)
  if (eventIds.length === 0) return { data: [], error: null }

  // 2) Determine lookback window
  const now = new Date()
  const start = new Date(now)
  if (period === 'daily') start.setDate(start.getDate() - 13) // last 14 days
  else if (period === 'weekly') start.setDate(start.getDate() - 7 * 11) // last 12 weeks
  else start.setMonth(start.getMonth() - 5) // last 6 months

  // 3) Fetch bookings within window and aggregate
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, event_id, total_amount, created_at, booking_status')
    .in('event_id', eventIds)
    .gte('created_at', start.toISOString())

  if (bookingsError) return { data: null, error: bookingsError }

  type Bucket = { period_label: string, total_revenue: number, total_bookings: number }
  const buckets = new Map<string, Bucket>()

  const toDaily = (d: Date) => d.toISOString().slice(0, 10)
  const toWeekly = (d: Date) => {
    const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    // ISO week number
    const dayNum = tmp.getUTCDay() || 7
    tmp.setUTCDate(tmp.getUTCDate() + (4 - dayNum))
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil((((tmp as any) - (yearStart as any)) / 86400000 + 1) / 7)
    const yy = tmp.getUTCFullYear()
    return `${yy}-W${String(weekNo).padStart(2, '0')}`
  }
  const toMonthly = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`

  const labelFn = period === 'daily' ? toDaily : period === 'weekly' ? toWeekly : toMonthly

  for (const b of bookings ?? []) {
    // treat confirmed bookings as revenue
    if (b.booking_status !== 'confirmed') continue
    const d = new Date(b.created_at as any)
    const label = labelFn(d)
    const entry = buckets.get(label) || { period_label: label, total_revenue: 0, total_bookings: 0 }
    entry.total_revenue += Number(b.total_amount || 0)
    entry.total_bookings += 1
    buckets.set(label, entry)
  }

  // Sort labels chronologically
  const result = Array.from(buckets.values()).sort((a, b) => a.period_label.localeCompare(b.period_label))
  return { data: result, error: null }
}

// Get dashboard summary from live tables
export async function getDashboardSummary(organizerId: string) {
  // Get events first
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, status')
    .eq('organizer_id', organizerId)

  if (eventsError) return { data: null, error: eventsError }

  const total_events = events?.length ?? 0
  const active_events = (events ?? []).filter(e => e.status === 'published').length
  const draft_events = (events ?? []).filter(e => e.status === 'draft').length
  const eventIds = (events ?? []).map(e => e.id)

  if (eventIds.length === 0) {
    return { data: [{ total_events, total_revenue: 0, total_bookings: 0, total_attendees: 0, active_events, draft_events }], error: null }
  }

  // Bookings for these events
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, total_amount, booking_status')
    .in('event_id', eventIds)

  if (bookingsError) return { data: null, error: bookingsError }

  const confirmed = (bookings ?? []).filter(b => b.booking_status === 'confirmed')
  const total_bookings = confirmed.length
  const total_revenue = confirmed.reduce((sum, b: any) => sum + Number(b.total_amount || 0), 0)

  // Attendees for those bookings
  const bookingIds = (bookings ?? []).map(b => b.id)
  let total_attendees = 0
  if (bookingIds.length > 0) {
    const { data: attendees, error: attendeesError } = await supabase
      .from('booking_attendees')
      .select('id')
      .in('booking_id', bookingIds)
    if (attendeesError) return { data: null, error: attendeesError }
    total_attendees = attendees?.length ?? 0
  }

  return { data: [{ total_events, total_revenue, total_bookings, total_attendees, active_events, draft_events }], error: null }
}

// Map DB rows to EventItem shape used by UI
function mapEventRowToEventItem(row: any, aggregates?: { sold?: number; revenue?: number; ticketsTotal?: number }) {
  const startAt = row.sales_start ?? `${row.event_date}T${row.event_time ?? '00:00:00'}`
  const endAt = row.sales_end ?? row.sales_start ?? startAt
  const sold = Number(aggregates?.sold ?? 0)
  const ticketsTotal = Number(aggregates?.ticketsTotal ?? row.total_tickets ?? 0)
  const ticketsLeft = Math.max(0, ticketsTotal - sold)
  const statusMap: Record<string, string> = {
    draft: 'draft',
    published: 'published',
    completed: 'completed',
    cancelled: 'cancelled',
    unpublished: 'draft',
  }
  return {
    id: row.id,
    title: row.title,
    category: row.category ?? 'general',
    startAt,
    endAt,
    location: row.location ?? '',
    visibility: (row.event_type === 'public' ? 'public' : 'private') as 'public' | 'private',
    posterUrl: row.cover_poster_url ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    tickets: [], // filled in detail API
    status: (statusMap[row.status] ?? 'draft') as any,
    revenue: Number(aggregates?.revenue ?? 0),
    ticketsLeft,
    sold,
  }
}

// Get organizer events with aggregated sold/revenue and tickets left
export async function getOrganizerEventsOverview(organizerId: string) {
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, category, event_type, location, cover_poster_url, logo_url, sales_start, sales_end, event_date, event_time, total_tickets, status')
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false })

  if (eventsError) return { data: null, error: eventsError }
  const eventIds = (events ?? []).map(e => e.id)
  if (eventIds.length === 0) return { data: [], error: null }

  // Fetch tickets to compute total inventory
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('event_id, quantity')
    .in('event_id', eventIds)

  if (ticketsError) return { data: null, error: ticketsError }
  const ticketsTotalByEvent = new Map<string, number>()
  for (const t of tickets ?? []) {
    ticketsTotalByEvent.set(t.event_id, (ticketsTotalByEvent.get(t.event_id) || 0) + Number(t.quantity || 0))
  }

  // Fetch confirmed bookings to compute sold and revenue
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('event_id, quantity, total_amount, booking_status')
    .in('event_id', eventIds)

  if (bookingsError) return { data: null, error: bookingsError }

  const soldByEvent = new Map<string, number>()
  const revenueByEvent = new Map<string, number>()
  for (const b of bookings ?? []) {
    if (b.booking_status !== 'confirmed') continue
    soldByEvent.set(b.event_id, (soldByEvent.get(b.event_id) || 0) + Number(b.quantity || 0))
    revenueByEvent.set(b.event_id, (revenueByEvent.get(b.event_id) || 0) + Number(b.total_amount || 0))
  }

  const mapped = (events ?? []).map((row) =>
    mapEventRowToEventItem(row, {
      sold: soldByEvent.get(row.id) || 0,
      revenue: revenueByEvent.get(row.id) || 0,
      ticketsTotal: ticketsTotalByEvent.get(row.id) ?? row.total_tickets,
    })
  )

  return { data: mapped, error: null }
}

// NEW: Fetch events by multiple possible organizer identifiers (e.g., organizer.id and organizer.user_id/email)
export async function getOrganizerEventsOverviewByOwnerIds(organizerIds: string[]) {
  const raw = Array.from(new Set((organizerIds || []).filter(Boolean)))
  if (raw.length === 0) return { data: [], error: null as any }

  const idCandidates = raw.filter(x => !x.includes('@'))
  const emailCandidates = raw.filter(x => x.includes('@')).map(x => x.toLowerCase())

  let events: any[] = []

  if (idCandidates.length > 0) {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, category, event_type, location, cover_poster_url, logo_url, sales_start, sales_end, event_date, event_time, total_tickets, status, organizer_id')
      .in('organizer_id', idCandidates)
      .order('created_at', { ascending: false })
    if (error) return { data: null, error }
    events = events.concat(data || [])
  }

  // Case-insensitive email matches, one-by-one using ilike
  for (const email of emailCandidates) {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, category, event_type, location, cover_poster_url, logo_url, sales_start, sales_end, event_date, event_time, total_tickets, status, organizer_id')
      .ilike('organizer_id', email)
      .order('created_at', { ascending: false })
    if (error) return { data: null, error }
    events = events.concat(data || [])
  }

  // Dedupe by id
  const seen = new Set<string>()
  events = events.filter((e: any) => (seen.has(e.id) ? false : (seen.add(e.id), true)))

  const eventIds = (events ?? []).map(e => e.id)
  if (eventIds.length === 0) return { data: [], error: null }

  // Fetch tickets to compute total inventory
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('event_id, quantity')
    .in('event_id', eventIds)

  if (ticketsError) return { data: null, error: ticketsError }
  const ticketsTotalByEvent = new Map<string, number>()
  for (const t of tickets ?? []) {
    ticketsTotalByEvent.set(t.event_id, (ticketsTotalByEvent.get(t.event_id) || 0) + Number(t.quantity || 0))
  }

  // Fetch confirmed bookings to compute sold and revenue
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('event_id, quantity, total_amount, booking_status')
    .in('event_id', eventIds)

  if (bookingsError) return { data: null, error: bookingsError }

  const soldByEvent = new Map<string, number>()
  const revenueByEvent = new Map<string, number>()
  for (const b of bookings ?? []) {
    if (b.booking_status !== 'confirmed') continue
    soldByEvent.set(b.event_id, (soldByEvent.get(b.event_id) || 0) + Number(b.quantity || 0))
    revenueByEvent.set(b.event_id, (revenueByEvent.get(b.event_id) || 0) + Number(b.total_amount || 0))
  }

  const mapped = (events ?? []).map((row) =>
    mapEventRowToEventItem(row, {
      sold: soldByEvent.get(row.id) || 0,
      revenue: revenueByEvent.get(row.id) || 0,
      ticketsTotal: ticketsTotalByEvent.get(row.id) ?? row.total_tickets,
    })
  )

  return { data: mapped, error: null }
}

// Get a single event with tickets and aggregates mapped to UI type
export async function getEventByIdMapped(eventId: string) {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (eventError || !event) return { data: null, error: eventError ?? new Error('Not found') }

  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('id, ticket_name, price, quantity, per_user_limit')
    .eq('event_id', eventId)

  if (ticketsError) return { data: null, error: ticketsError }

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('ticket_id, quantity, total_amount, booking_status')
    .eq('event_id', eventId)

  if (bookingsError) return { data: null, error: bookingsError }

  const soldByTicket = new Map<string, number>()
  let soldTotal = 0
  let revenue = 0
  for (const b of bookings ?? []) {
    if (b.booking_status !== 'confirmed') continue
    const q = Number(b.quantity || 0)
    soldByTicket.set(b.ticket_id, (soldByTicket.get(b.ticket_id) || 0) + q)
    soldTotal += q
    revenue += Number(b.total_amount || 0)
  }

  const tiers = (tickets ?? []).map((t) => ({
    id: t.id,
    name: t.ticket_name,
    price: Number(t.price || 0),
    quantity: Number(t.quantity || 0),
    perUserLimit: Number(t.per_user_limit || 0),
    sold: soldByTicket.get(t.id) || 0,
  }))

  const totalInventory = tiers.reduce((s, t) => s + t.quantity, 0)

  const mapped = mapEventRowToEventItem(event, { sold: soldTotal, revenue, ticketsTotal: totalInventory })
  mapped.tickets = tiers as any

  return { data: mapped, error: null }
}

// Get bookings for an event mapped to UI Booking type
export async function getEventBookingsMapped(eventId: string) {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id, event_id, user_id, ticket_id, quantity, total_amount, booking_status, created_at,
      users(name, email, phone),
      booking_attendees(checked_in)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error }

  const rows = (bookings ?? []).map((b: any) => ({
    id: b.id,
    eventId: b.event_id,
    buyerName: b.users?.name ?? '',
    buyerEmail: b.users?.email ?? '',
    buyerPhone: b.users?.phone ?? '',
    qty: Number(b.quantity || 0),
    amount: Number(b.total_amount || 0),
    paymentStatus: b.booking_status === 'confirmed' ? 'paid' : b.booking_status === 'pending' ? 'pending' : b.booking_status === 'refunded' ? 'refunded' : 'failed',
    checkinStatus: Array.isArray(b.booking_attendees) && b.booking_attendees.some((x: any) => x.checked_in) ? 'checked_in' : 'not_checked_in',
    createdAt: b.created_at,
  }))

  return { data: rows, error: null }
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

export type UserProfile = {
  id: string
  email: string
  name: string
  phone?: string | null
  role: 'admin' | 'attendee' | 'manager' | 'volunteer'
  kycVerified?: boolean
  photoUrl?: string | null
  created_at: string
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
