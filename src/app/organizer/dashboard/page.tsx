"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { KpiGrid } from "@/components/kpi-grid"
import { SalesOverview } from "@/components/dashboard/sales-overview"
import { CheckinStats } from "@/components/dashboard/checkin-stats"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { FeedbackList } from "@/components/dashboard/feedback-list"
import { useOrganizerData } from "@/hooks/useOrganizerData"

export default function OrganizerDashboardPage() {
  const { organizer, dashboardSummary, loading, error, refetch } = useOrganizerData()

  useEffect(() => {
    if (!loading) {
      console.log('[Dashboard] Organizer', organizer)
      console.log('[Dashboard] Summary', dashboardSummary)
      if (error) console.error('[Dashboard] Error', error)
    }
  }, [loading, organizer, dashboardSummary, error])

  const totals = {
    revenue: dashboardSummary?.total_revenue ?? 0,
    tickets: dashboardSummary?.total_bookings ?? 0,
    avgPrice: (dashboardSummary?.total_revenue ?? 0) / Math.max(1, dashboardSummary?.total_bookings ?? 0),
    activeEvents: dashboardSummary?.active_events ?? 0,
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
      {loading ? <Skeleton className="h-[300px] rounded-2xl" /> : <CheckinStats organizer={organizer}/>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
      {loading ? <Skeleton className="h-[360px] rounded-2xl" /> : <RecentOrders organizer={organizer} />}
          </div>
          <div className="lg:col-span-1">
            {loading ? <Skeleton className="h-[360px] rounded-2xl" /> : <FeedbackList organizer={null}/>}
          </div>
        </div>
      </div>
    </main>
  )
}
