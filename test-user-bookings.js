require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testBookingData() {
  console.log('🧪 Testing User Booking Data with QR Codes\n')
  
  try {
    // First, let's see what bookings exist
    const { data: allBookings, error: allError } = await supabase
      .from('bookings')
      .select(`
        id,
        user_id,
        booking_reference,
        events(title),
        booking_attendees(name, qr_code, qr_image_url)
      `)
      .limit(5)

    if (allError) throw allError

    console.log(`📋 Found ${allBookings.length} total bookings in database:`)
    
    allBookings.forEach((booking, index) => {
      console.log(`\n🎫 Booking ${index + 1}:`)
      console.log(`   User ID: ${booking.user_id}`)
      console.log(`   Reference: ${booking.booking_reference}`)
      console.log(`   Event: ${booking.events.title}`)
      console.log(`   Attendees with QR: ${booking.booking_attendees.length}`)
      
      if (booking.booking_attendees.length > 0) {
        const attendee = booking.booking_attendees[0]
        console.log(`   Sample QR: ${attendee.qr_code.substring(0, 50)}...`)
        console.log(`   QR Image: ${attendee.qr_image_url ? 'Available' : 'Missing'}`)
      }
    })

    // Use the first user ID we found
    if (allBookings.length > 0) {
      const testUserId = allBookings[0].user_id
      console.log(`\n🔍 Testing with actual user ID: ${testUserId}`)
      
      const { data: userBookings, error: userError } = await supabase
        .from('bookings')
        .select(`
          *,
          events(*),
          tickets(*),
          booking_attendees(*),
          payments(*)
        `)
        .eq('user_id', testUserId)
        .order('created_at', { ascending: false })

      if (userError) throw userError

      console.log(`\n✅ Found ${userBookings.length} bookings for this user`)
      
      userBookings.forEach((booking) => {
        console.log(`\n📱 QR Codes for ${booking.events.title}:`)
        booking.booking_attendees.forEach((attendee, i) => {
          console.log(`   ${i + 1}. ${attendee.name}: ${attendee.qr_code}`)
        })
      })
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testBookingData()
