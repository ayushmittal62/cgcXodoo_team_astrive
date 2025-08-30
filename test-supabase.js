// Test script to verify Supabase connection and data fetching
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection and data...\n')

  try {
    // Test connection
    console.log('1. Testing connection...')
    const { data, error } = await supabase.from('events').select('id').limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return
    }
    
    console.log('✅ Connection successful!')
    console.log(`📊 Database is accessible\n`)

    // Fetch actual events
    console.log('2. Fetching events...')
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        category,
        status,
        event_date,
        event_time,
        location,
        tickets(id, ticket_name, price, quantity),
        organizers!inner(
          users!inner(name, email)
        )
      `)
      .eq('status', 'published')
      .limit(5)

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError.message)
      return
    }

    if (!events || events.length === 0) {
      console.log('⚠️  No published events found in database')
      console.log('💡 Make sure you have events with status="published" in your events table')
      return
    }

    console.log(`✅ Found ${events.length} published events:`)
    events.forEach((event, index) => {
      console.log(`\n   ${index + 1}. 📅 ${event.title}`)
      console.log(`      📍 ${event.location || 'No location'}`)
      console.log(`      🗓️  ${event.event_date} at ${event.event_time}`)
      console.log(`      🏷️  ${event.category || 'No category'}`)
      console.log(`      🎫 ${event.tickets?.length || 0} ticket types`)
      console.log(`      👤 Organizer: ${event.organizers?.users?.name || 'Unknown'}`)
    })

    console.log('\n3. Testing ticket data...')
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .limit(3)

    if (ticketsError) {
      console.error('❌ Error fetching tickets:', ticketsError.message)
    } else {
      console.log(`✅ Found ${tickets?.length || 0} tickets in database`)
    }

    console.log('\n🎉 Supabase integration is working correctly!')
    console.log('🚀 Your application should now display the events from your database')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testSupabaseConnection()
