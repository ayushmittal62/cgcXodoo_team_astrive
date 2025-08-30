"use client"

import { useState, useEffect } from 'react'
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
    if (user && userProfile?.id) {
      fetchOrganizerData()
    }
  }, [user, userProfile])

  const fetchOrganizerData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!userProfile?.id) {
        setError('No user profile available')
        return
      }

      // Get organizer details
      const { data: organizerData, error: organizerError } = await getOrganizerByUserId(userProfile.id)
      
      if (organizerError) {
        setError('Failed to fetch organizer data')
        return
      }

      setOrganizer(organizerData)

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

  const getRevenueData = async (period: 'daily' | 'weekly' | 'monthly'): Promise<RevenueData[]> => {
    if (!organizer) return []
    
    try {
      const { data, error } = await getRevenueByPeriod(organizer.id, period)
      if (error) {
        console.error('Error fetching revenue data:', error)
        return []
      }
      return data || []
    } catch (err) {
      console.error('Error in getRevenueData:', err)
      return []
    }
  }

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
