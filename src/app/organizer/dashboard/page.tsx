"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { KpiGrid } from "@/components/kpi-grid"
import { SalesOverview } from "@/components/dashboard/sales-overview"
import { CheckinStats } from "@/components/dashboard/checkin-stats"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { FeedbackList } from "@/components/dashboard/feedback-list"
import { useAuth } from "@/contexts/AuthContext"
import { useOrganizerData } from "@/hooks/useOrganizerData"

export default function OrganizerDashboardPage() {
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()
  const { organizer, dashboardSummary, loading: dataLoading, error } = useOrganizerData()

  const loading = authLoading || dataLoading

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (!authLoading && !user) {
      router.push('/sign-in')
      return
    }
    // No longer redirecting to KYC - allow access to dashboard without KYC verification
    // KYC will only be checked when user tries to publish an event
  }, [authLoading, user, router])

  // Calculate totals from dashboard summary
  const totals = dashboardSummary ? {
    revenue: dashboardSummary.total_revenue || 0,
    tickets: dashboardSummary.total_bookings || 0,
    avgPrice: dashboardSummary.total_bookings > 0 
      ? (dashboardSummary.total_revenue || 0) / dashboardSummary.total_bookings 
      : 0,
    activeEvents: dashboardSummary.active_events || 0,
  } : {
    revenue: 0,
    tickets: 0,
    avgPrice: 0,
    activeEvents: 0,
  }

  // Show error state
  if (error && !loading) {
    return (
      <main className="p-4 md:p-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Unable to Load Dashboard</h2>
            <p className="text-gray-600 mb-4">There was an error loading your organizer data.</p>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Show no organizer state - allow user to create organizer profile
  if (!loading && !organizer && !error) {
    return (
      <main className="p-4 md:p-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to EventHive Organizer Dashboard</h2>
            <p className="text-gray-600 mb-6">
              To get started as an event organizer, please complete your profile setup.
            </p>
            <button
              onClick={() => window.location.href = '/organizer/kyc'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Complete Organizer Setup
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {loading ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </section>
        ) : (
          <KpiGrid totals={totals} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {loading ? <Skeleton className="h-[300px] rounded-2xl" /> : <SalesOverview organizer={organizer} />}
          </div>
          <div className="lg:col-span-1">
            {loading ? <Skeleton className="h-[300px] rounded-2xl" /> : <CheckinStats organizer={organizer} />}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {loading ? <Skeleton className="h-[360px] rounded-2xl" /> : <RecentOrders organizer={organizer} />}
          </div>
          <div className="lg:col-span-1">
            {loading ? <Skeleton className="h-[360px] rounded-2xl" /> : <FeedbackList organizer={organizer} />}
          </div>
        </div>
      </div>
    </main>
  )
}
