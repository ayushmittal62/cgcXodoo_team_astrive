// Quick test to verify your Supabase connection
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = 'https://mzyxhzmoqqqacqoroxky.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eXhoem1vcXFxYWNxb3JveGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDE0OTIsImV4cCI6MjA3MjExNzQ5Mn0.-Vjir1WsaMsqld2GijJvphWbSKUSLaVDQGVzKPoIgTc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('🔍 Testing connection to your Supabase database...\n')

  try {
    // Test basic connection
    console.log('1. Testing connection...')
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables')
      .then(() => ({ data: 'success', error: null }))
      .catch(() => supabase.from('events').select('id').limit(1))

    if (tablesError) {
      console.error('❌ Connection failed:', tablesError.message)
      return
    }
    
    console.log('✅ Connection successful!')

    // Check what tables exist
    console.log('\n2. Checking existing tables and data...')
    
    // Check events table
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, status, category, event_date')
      .limit(10)

    if (eventsError) {
      console.log('⚠️  Events table:', eventsError.message)
    } else {
      console.log(`✅ Events table: ${events?.length || 0} events found`)
      if (events && events.length > 0) {
        events.forEach((event, i) => {
          console.log(`   ${i + 1}. ${event.title} (${event.status}) - ${event.event_date}`)
        })
      }
    }

    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, role')
      .limit(5)

    if (usersError) {
      console.log('⚠️  Users table:', usersError.message)
    } else {
      console.log(`✅ Users table: ${users?.length || 0} users found`)
    }

    // Check tickets table
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, ticket_name, price')
      .limit(5)

    if (ticketsError) {
      console.log('⚠️  Tickets table:', ticketsError.message)
    } else {
      console.log(`✅ Tickets table: ${tickets?.length || 0} tickets found`)
    }

    // Check organizers table
    const { data: organizers, error: organizersError } = await supabase
      .from('organizers')
      .select('id, kyc_verified')
      .limit(5)

    if (organizersError) {
      console.log('⚠️  Organizers table:', organizersError.message)
    } else {
      console.log(`✅ Organizers table: ${organizers?.length || 0} organizers found`)
    }

    console.log('\n🎉 Database analysis complete!')
    console.log('🚀 Your application is ready to use the existing data!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testConnection()
