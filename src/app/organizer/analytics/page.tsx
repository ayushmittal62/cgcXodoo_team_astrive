"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChartCard } from "@/components/area-chart"
import { useOrganizerData } from "@/hooks/useOrganizerData"

export default function AnalyticsPage() {
  const { dashboardSummary } = useOrganizerData()
  const totalRevenue = dashboardSummary?.total_revenue ?? 0
  const totalTickets = dashboardSummary?.total_attendees ?? 0
  const active = dashboardSummary?.active_events ?? 0

  return (
    <main className="p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl bg-card/90 border-border/60">
            <CardHeader>
              <CardTitle>Gross Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">₹{Number(totalRevenue).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-card/90 border-border/60">
            <CardHeader>
              <CardTitle>Total Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{Number(totalTickets).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-card/90 border-border/60">
            <CardHeader>
              <CardTitle>Active Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{active}</div>
            </CardContent>
          </Card>
        </div>

        <AreaChartCard
          title="Last 10 days"
          data={Array.from({ length: 10 }).map((_, i) => ({ x: `D${i + 1}`, y: Math.round((totalRevenue || 0) / 10 + i * 50) }))}
        />
      </div>
    </main>
  )
}
