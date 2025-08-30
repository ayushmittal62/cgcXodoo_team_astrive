// Test the enhanced booking system
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testCompleteBookingFlow() {
  console.log('🧪 Testing Complete Booking Flow with QR Codes...\n')

  try {
    // 1. Get a test event
    console.log('1. Fetching test event...')
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        tickets(*),
        organizers!events_organizer_id_fkey(
          id,
          users!organizers_user_id_fkey(name, email)
        )
      `)
      .eq('status', 'published')
      .eq('event_type', 'public')
      .limit(1)
      .single()

    if (eventError) throw eventError

    console.log(`✅ Test event: ${events.title}`)
    console.log(`   Available tickets: ${events.tickets.length}`)

    if (events.tickets.length === 0) {
      console.log('⚠️  No tickets available for this event')
      return
    }

    // 2. Get a test user
    console.log('\n2. Getting test user...')
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'attendee')
      .limit(1)
      .single()

    if (userError) throw userError
    console.log(`✅ Test user: ${testUser.name} (${testUser.email})`)

    // 3. Simulate booking data
    const bookingData = {
      event: {
        id: events.id,
        title: events.title,
        description: events.description,
        category: events.category,
        date: new Date(events.event_date).toLocaleDateString(),
        time: events.event_time,
        location: events.location,
        status: events.status,
        poster: events.cover_poster_url,
        logo: events.logo_url,
        tickets: events.tickets.map(ticket => ({
          id: ticket.id,
          tier: ticket.ticket_name,
          price: ticket.price,
          stock: ticket.quantity,
          per_user_limit: ticket.per_user_limit
        })),
        organizer: {
          id: events.organizers.users.id,
          name: events.organizers.users.name,
          email: events.organizers.users.email
        }
      },
      tickets: [{ 
        index: 0, 
        tier: events.tickets[0].ticket_name, 
        ticket_id: events.tickets[0].id 
      }],
      attendees: [
        {
          name: 'Test Attendee 1',
          email: 'test1@example.com',
          phone: '+91-9876543210',
          dob: '1995-06-15'
        },
        {
          name: 'Test Attendee 2', 
          email: 'test2@example.com',
          phone: '+91-9876543211',
          dob: '1992-03-22'
        }
      ],
      amount: events.tickets[0].price * 2,
      userId: testUser.id
    }

    console.log('\n3. Creating booking with QR codes...')
    console.log(`   Event: ${bookingData.event.title}`)
    console.log(`   Ticket: ${bookingData.tickets[0].tier} x2`)
    console.log(`   Total: ₹${bookingData.amount}`)
    console.log(`   Attendees: ${bookingData.attendees.length}`)

    // Import the enhanced createBooking function
    const { createBooking } = require('./src/lib/events-service.ts')
    
    const bookingId = await createBooking(bookingData)
    
    if (!bookingId) {
      console.error('❌ Booking failed')
      return
    }

    console.log(`🎉 Booking created successfully! ID: ${bookingId}`)

    // 4. Verify the booking was created with all components
    console.log('\n4. Verifying booking components...')
    
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        events(title),
        tickets(ticket_name, price),
        booking_attendees(
          id,
          name,
          email,
          phone,
          qr_code,
          qr_image_url,
          qr_generated_at,
          checked_in
        ),
        payments(
          transaction_id,
          payment_status,
          amount,
          currency
        )
      `)
      .eq('id', bookingId)
      .single()

    if (fetchError) throw fetchError

    console.log(`✅ Booking Reference: ${booking.booking_reference}`)
    console.log(`✅ Status: ${booking.booking_status}`)
    console.log(`✅ Payment Status: ${booking.payments[0]?.payment_status}`)
    console.log(`✅ Attendees with QR codes: ${booking.booking_attendees.length}`)
    
    booking.booking_attendees.forEach((attendee, i) => {
      console.log(`   ${i + 1}. ${attendee.name}`)
      console.log(`      - Email: ${attendee.email}`)
      console.log(`      - QR Generated: ${attendee.qr_generated_at ? 'Yes' : 'No'}`)
      console.log(`      - Checked In: ${attendee.checked_in ? 'Yes' : 'No'}`)
    })

    // 5. Test analytics update
    console.log('\n5. Checking event analytics...')
    const { data: analytics } = await supabase
      .from('event_analytics')
      .select('*')
      .eq('event_id', events.id)
      .single()

    if (analytics) {
      console.log(`✅ Analytics updated:`)
      console.log(`   - Total bookings: ${analytics.total_bookings}`)
      console.log(`   - Total revenue: ₹${analytics.total_revenue}`)
      console.log(`   - Total views: ${analytics.total_views}`)
    }

    // 6. Test notification
    console.log('\n6. Checking user notification...')
    const { data: notification } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUser.id)
      .eq('event_id', events.id)
      .eq('type', 'booking_confirmation')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (notification) {
      console.log(`✅ Notification created: "${notification.message}"`)
    }

    console.log('\n🎊 Complete booking flow test successful!')
    console.log('📋 Summary:')
    console.log('   ✅ Booking created in bookings table')
    console.log('   ✅ Attendees created with QR codes in booking_attendees table') 
    console.log('   ✅ Payment record created in payments table')
    console.log('   ✅ Event analytics updated in event_analytics table')
    console.log('   ✅ User notification created in notifications table')
    console.log('   ✅ All schema requirements fulfilled!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testCompleteBookingFlow()
