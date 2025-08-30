import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database - matching your existing users table
export interface UserProfile {
  id: string
  name?: string
  email: string
  phone?: string
  role?: string
  created_at?: string
}

// Function to create or update user profile in Supabase
export const createUserProfile = async (userData: {
  firebaseUid: string
  email: string
  displayName?: string
  photoUrl?: string
}) => {
  try {
    // First check if user already exists by email
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userData.email)
      .single()

    if (existingUser) {
      // User exists, update their info
      const { data, error } = await supabase
        .from('users')
        .update({
          name: userData.displayName || existingUser.name,
        })
        .eq('email', userData.email)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } else {
      // User doesn't exist, create new record
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: userData.displayName,
          email: userData.email,
          role: 'attendee' // Default role
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error)
    return { data: null, error }
  }
}

// Function to get user profile from Supabase by email
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

// Function to get user profile from Supabase by ID
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
