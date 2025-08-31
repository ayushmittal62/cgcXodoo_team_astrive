"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AreaChartCard, type SeriesPoint } from "@/components/area-chart"
import { useOrganizerData } from "@/hooks/useOrganizerData"
import { getRevenueByPeriod } from "@/lib/supabase"

export function SalesOverview() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-muted-foreground">Sales Overview</h2>
      </div>
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="rounded-xl">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-3">
          <GranularityCharts type="revenue" formatter="₹" />
        </TabsContent>
        <TabsContent value="tickets" className="mt-3">
          <GranularityCharts type="tickets" formatter="" />
        </TabsContent>
      </Tabs>
    </section>
  )
}

function GranularityCharts({ type, formatter }: { type: 'revenue' | 'tickets'; formatter: string }) {
  const { organizer } = useOrganizerData()
  const [dailyData, setDailyData] = useState<SeriesPoint[]>([])
  const [weeklyData, setWeeklyData] = useState<SeriesPoint[]>([])
  const [monthlyData, setMonthlyData] = useState<SeriesPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizer) {
      setDailyData([])
      setWeeklyData([])
      setMonthlyData([])
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const [d, w, m] = await Promise.all([
          getRevenueByPeriod(organizer.id, 'daily'),
          getRevenueByPeriod(organizer.id, 'weekly'),
          getRevenueByPeriod(organizer.id, 'monthly'),
        ])
        const tx = (arr: any[]) => (arr || []).map((it: any, i: number) => ({
          x: it.period_label || `P${i + 1}`,
          y: type === 'revenue' ? (it.total_revenue || 0) : (it.total_bookings || 0),
        }))
        setDailyData(tx(d.data || []))
        setWeeklyData(tx(w.data || []))
        setMonthlyData(tx(m.data || []))
      } catch (e) {
        console.error('[SalesOverview] fetch error', e)
        setDailyData([])
        setWeeklyData([])
        setMonthlyData([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [organizer?.id, type])

  if (loading) {
    return <div className="h-64 bg-muted animate-pulse rounded-xl" />
  }

  const hasAny = dailyData.length + weeklyData.length + monthlyData.length > 0
  if (!hasAny) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/90 p-6 text-center text-sm text-muted-foreground">
        No activity yet. Your {type === 'revenue' ? 'revenue' : 'tickets'} will appear here once you get bookings.
      </div>
    )
  }

  return (
    <Tabs defaultValue="weekly" className="w-full">
      <TabsList className="rounded-xl">
        <TabsTrigger value="daily">Daily</TabsTrigger>
        <TabsTrigger value="weekly">Weekly</TabsTrigger>
        <TabsTrigger value="monthly">Monthly</TabsTrigger>
      </TabsList>

      <TabsContent value="daily" className="mt-3">
        <AreaChartCard title={`Daily (${formatter})`} data={dailyData} />
      </TabsContent>
      <TabsContent value="weekly" className="mt-3">
        <AreaChartCard title={`Weekly (${formatter})`} data={weeklyData} />
      </TabsContent>
      <TabsContent value="monthly" className="mt-3">
        <AreaChartCard title={`Monthly (${formatter})`} data={monthlyData} />
      </TabsContent>
    </Tabs>
  )
}
