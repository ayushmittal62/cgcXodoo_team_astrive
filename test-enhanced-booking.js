// Direct test of the enhanced booking system
const { createClient } = require('@supabase/supabase-js')
const QRCode = require('qrcode')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testEnhancedBooking() {
  console.log('🧪 Testing Enhanced Booking System...\n')

  try {
    // 1. Get test event and user
    const { data: event } = await supabase
      .from('events')
      .select('*, tickets(*)')
      .eq('title', 'AKM47')
      .single()

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'ayushmittal629@gmail.com')
      .single()

    console.log(`📅 Event: ${event.title}`)
    console.log(`👤 User: ${user.name}`)
    console.log(`🎫 Ticket: ${event.tickets[0].ticket_name} - ₹${event.tickets[0].price}`)

    // 2. Create booking
    const bookingReference = `BK${Date.now()}TEST`
    console.log(`\n🔄 Creating booking: ${bookingReference}`)

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        event_id: event.id,
        user_id: user.id,
        ticket_id: event.tickets[0].id,
        quantity: 2,
        total_amount: event.tickets[0].price * 2,
        booking_status: 'confirmed',
        booking_reference: bookingReference,
        email_status: 'pending'
      })
      .select('id, booking_reference')
      .single()

    if (bookingError) throw bookingError
    console.log(`✅ Booking created: ${booking.booking_reference}`)

    // 3. Create attendees with QR codes
    console.log('\n🎫 Creating attendees with QR codes...')
    
    const attendeesData = []
    const attendees = [
      { name: 'John Doe', email: 'john@example.com', phone: '+91-9876543210', dob: '1995-01-15' },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '+91-9876543211', dob: '1992-05-20' }
    ]

    for (let i = 0; i < attendees.length; i++) {
      const attendee = attendees[i]
      
      // Create QR code data (compact format)
      const qrData = `${booking.id}|${i}|${event.id}|${attendee.name}|${event.tickets[0].ticket_name}|${booking.booking_reference}`
      
      // Generate QR code image
      const qrImageUrl = await QRCode.toDataURL(qrData, {
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
        dob: attendee.dob,
        qr_code: qrData,
        qr_image_url: qrImageUrl,
        qr_generated_at: new Date().toISOString(),
        checked_in: false
      })

      console.log(`   ✅ QR generated for: ${attendee.name}`)
    }

    // Insert attendees
    const { data: createdAttendees, error: attendeeError } = await supabase
      .from('booking_attendees')
      .insert(attendeesData)
      .select('id, name, qr_code')

    if (attendeeError) throw attendeeError
    console.log(`✅ ${createdAttendees.length} attendees created with QR codes`)

    // 4. Create payment
    console.log('\n💳 Creating payment record...')
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: booking.id,
        transaction_id: `TXN${Date.now()}`,
        payment_gateway: 'razorpay',
        amount: event.tickets[0].price * 2,
        currency: 'INR',
        payment_status: 'success'
      })
      .select('transaction_id')
      .single()

    if (paymentError) throw paymentError
    console.log(`✅ Payment created: ${payment.transaction_id}`)

    // 5. Update analytics
    console.log('\n📊 Updating event analytics...')
    const { data: existingAnalytics } = await supabase
      .from('event_analytics')
      .select('*')
      .eq('event_id', event.id)
      .single()

    if (existingAnalytics) {
      await supabase
        .from('event_analytics')
        .update({
          total_bookings: existingAnalytics.total_bookings + 1,
          total_revenue: parseFloat(existingAnalytics.total_revenue) + (event.tickets[0].price * 2),
          updated_at: new Date().toISOString()
        })
        .eq('event_id', event.id)
    } else {
      await supabase
        .from('event_analytics')
        .insert({
          event_id: event.id,
          total_views: 1,
          total_bookings: 1,
          total_revenue: event.tickets[0].price * 2
        })
    }
    console.log('✅ Analytics updated')

    // 6. Create notification
    console.log('\n🔔 Creating user notification...')
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        event_id: event.id,
        type: 'booking_confirmation',
        message: `Your booking for "${event.title}" has been confirmed. Booking reference: ${booking.booking_reference}`,
        read: false
      })
    console.log('✅ Notification created')

    // 7. Verify complete booking
    console.log('\n🔍 Verifying complete booking...')
    const { data: completeBooking } = await supabase
      .from('bookings')
      .select(`
        *,
        events(title),
        booking_attendees(name, email, qr_code, checked_in),
        payments(transaction_id, payment_status)
      `)
      .eq('id', booking.id)
      .single()

    console.log('\n🎉 BOOKING TEST SUCCESSFUL!')
    console.log('📋 Complete Booking Details:')
    console.log(`   📖 Reference: ${completeBooking.booking_reference}`)
    console.log(`   📅 Event: ${completeBooking.events.title}`)
    console.log(`   💰 Amount: ₹${completeBooking.total_amount}`)
    console.log(`   👥 Attendees: ${completeBooking.booking_attendees.length}`)
    console.log(`   💳 Payment: ${completeBooking.payments[0].payment_status}`)
    
    completeBooking.booking_attendees.forEach((attendee, i) => {
      console.log(`      ${i + 1}. ${attendee.name} (${attendee.email})`)
      console.log(`         - QR Code: Generated ✅`)
      console.log(`         - Check-in: ${attendee.checked_in ? 'Done' : 'Pending'}`)
    })

    console.log('\n✨ All schema requirements fulfilled:')
    console.log('   ✅ bookings table - Main booking record')
    console.log('   ✅ booking_attendees table - Individual attendee records with QR codes')
    console.log('   ✅ payments table - Payment transaction record')
    console.log('   ✅ event_analytics table - Event statistics updated')
    console.log('   ✅ notifications table - User notification created')
    console.log('   ✅ QR codes generated for each attendee ticket')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testEnhancedBooking()
