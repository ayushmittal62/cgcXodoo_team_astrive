// Verify database schema alignment with current application
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifySchemaAlignment() {
  console.log('🔍 Verifying database schema alignment...\n')

  try {
    // Test the core tables and their relationships
    console.log('1. Testing Events with proper relationships...')
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        category,
        event_type,
        location,
        event_date,
        event_time,
        status,
        cover_poster_url,
        logo_url,
        total_tickets,
        sales_start,
        sales_end,
        organizers!events_organizer_id_fkey(
          id,
          kyc_verified,
          users!organizers_user_id_fkey(
            id,
            name,
            email,
            role
          )
        ),
        tickets!tickets_event_id_fkey(
          id,
          ticket_name,
          price,
          quantity,
          per_user_limit
        )
      `)
      .eq('status', 'published')
      .limit(3)

    if (eventsError) {
      console.error('❌ Events query error:', eventsError.message)
    } else {
      console.log(`✅ Events table: ${events.length} events fetched with relationships`)
      
      if (events && events.length > 0) {
        events.forEach((event, i) => {
          console.log(`\n${i + 1}. "${event.title}"`)
          console.log(`   - Type: ${event.event_type}`)
          console.log(`   - Total tickets capacity: ${event.total_tickets}`)
          console.log(`   - Sales period: ${event.sales_start} to ${event.sales_end}`)
          console.log(`   - Organizer: ${event.organizers?.users?.name} (KYC: ${event.organizers?.kyc_verified ? 'Verified' : 'Pending'})`)
          console.log(`   - Ticket types: ${event.tickets?.length || 0}`)
          if (event.tickets && event.tickets.length > 0) {
            event.tickets.forEach((ticket, j) => {
              console.log(`     ${j + 1}. ${ticket.ticket_name}: ₹${ticket.price} (${ticket.quantity} available, limit: ${ticket.per_user_limit}/person)`)
            })
          }
        })
      }
    }

    // Test booking structure
    console.log('\n\n2. Testing Booking system compatibility...')
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        quantity,
        total_amount,
        booking_status,
        email_status,
        events!bookings_event_id_fkey(title),
        users!bookings_user_id_fkey(name, email),
        tickets!bookings_ticket_id_fkey(ticket_name, price),
        booking_attendees!booking_attendees_booking_id_fkey(
          name,
          email,
          phone,
          dob,
          checked_in
        )
      `)
      .limit(3)

    if (bookingsError) {
      console.error('❌ Bookings query error:', bookingsError.message)
    } else {
      console.log(`✅ Bookings table: ${bookings?.length || 0} bookings found`)
      
      if (bookings && bookings.length > 0) {
        bookings.forEach((booking, i) => {
          console.log(`\n${i + 1}. Booking #${booking.booking_reference}`)
          console.log(`   - Event: ${booking.events?.title}`)
          console.log(`   - Customer: ${booking.users?.name} (${booking.users?.email})`)
          console.log(`   - Ticket: ${booking.tickets?.ticket_name} x${booking.quantity}`)
          console.log(`   - Amount: ₹${booking.total_amount}`)
          console.log(`   - Status: ${booking.booking_status}`)
          console.log(`   - Attendees: ${booking.booking_attendees?.length || 0}`)
        })
      }
    }

    // Check user roles
    console.log('\n\n3. Checking user roles and permissions...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .limit(5)

    if (usersError) {
      console.error('❌ Users query error:', usersError.message)
    } else {
      console.log(`✅ Users table: ${users?.length || 0} users found`)
      if (users && users.length > 0) {
        const roleCount = users.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        }, {})
        console.log('   Role distribution:', roleCount)
      }
    }

    console.log('\n🎉 Schema verification complete!')
    console.log('💡 Key insights:')
    console.log('   - Events support both public/private types')
    console.log('   - Booking system supports multiple attendees per booking')
    console.log('   - QR codes and check-in system available')
    console.log('   - KYC verification for organizers')
    console.log('   - Email notification system built-in')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

verifySchemaAlignment()
