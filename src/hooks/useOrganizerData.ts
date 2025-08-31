"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  getOrganizerByUserId,
  getOrganizerAnalytics,
  getRevenueByPeriod,
  getDashboardSummary
} from '@/lib/supabase'
import type { Organizer } from '@/lib/supabase'

interface DashboardSummary {
  total_events: number
  total_revenue: number
  total_bookings: number
  total_attendees: number
  active_events: number
  draft_events: number
}

interface RevenueData {
  period_label: string
  total_revenue: number
  total_bookings: number
}

interface TicketData {
  period_label: string
  total_tickets: number
}

export function useOrganizerData() {
  const { user, userProfile } = useAuth()
  const [organizer, setOrganizer] = useState<Organizer | null>(null)
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && userProfile?.email) {
      fetchOrganizerData()
    }
  }, [user, userProfile])

  const fetchOrganizerData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!userProfile?.email) {
        setError('No user profile email available')
        return
      }

      // Get organizer details (email first, then fallback to user id)
      const email = userProfile.email.toLowerCase()
      console.log('[useOrganizerData] Fetching organizer by email', email)
      let { data: organizerData, error: organizerError }: any = await getOrganizerByUserId(email)

      if ((organizerError && organizerError.code === 'PGRST116') || !organizerData) {
        console.log('[useOrganizerData] No organizer by email, retry with user id', userProfile.id)
        const res2: any = await getOrganizerByUserId(userProfile.id)
        organizerData = res2.data
        organizerError = res2.error
      }

      if (organizerError && organizerError.code !== 'PGRST116') {
        console.error('[useOrganizerData] Organizer fetch error', organizerError?.message || JSON.stringify(organizerError))
        setError('Failed to fetch organizer data')
        return
      }

      if (!organizerData) {
        console.log('[useOrganizerData] Organizer not found; proceeding without organizer')
        setOrganizer(null)
      } else {
        setOrganizer(organizerData)
      }

      // Get dashboard summary if organizer exists
  if (organizerData) {
        const { data: summaryData, error: summaryError } = await getDashboardSummary(organizerData.id)
        
        if (summaryError) {
          console.error('Error fetching dashboard summary:', summaryError)
        } else {
          setDashboardSummary(summaryData?.[0] || null)
        }
      }
    } catch (err) {
      console.error('Error in fetchOrganizerData:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getRevenueData = useCallback(async (period: 'daily' | 'weekly' | 'monthly'): Promise<RevenueData[]> => {
    if (!organizer?.id) return []

    try {
      const { data, error } = await getRevenueByPeriod(organizer.id, period)
      if (error) {
        console.error('Error fetching revenue data:', error?.message || JSON.stringify(error))
        return []
      }
      return data || []
    } catch (err: any) {
      console.error('Error in getRevenueData:', err?.message || JSON.stringify(err))
      return []
    }
  }, [organizer?.id])

  // getEvents function removed because getOrganizerEvents is not available

  return {
    organizer,
    dashboardSummary,
    loading,
    error,
    refetch: fetchOrganizerData,
    getRevenueData
  }
}
