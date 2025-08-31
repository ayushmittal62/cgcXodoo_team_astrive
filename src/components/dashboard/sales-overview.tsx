"use client"

import { useEffect, useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AreaChartCard, type SeriesPoint } from "@/components/area-chart"
import { getRevenueByPeriod } from "@/lib/supabase"
import { type Organizer } from "@/lib/supabase"

interface SalesOverviewProps {
  organizer: Organizer | null
}

export function SalesOverview({ organizer }: SalesOverviewProps) {
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
          <GranularityCharts organizer={organizer} type="revenue" formatter="₹" />
        </TabsContent>
        <TabsContent value="tickets" className="mt-3">
          <GranularityCharts organizer={organizer} type="tickets" formatter="" />
        </TabsContent>
      </Tabs>
    </section>
  )
}

function GranularityCharts({ 
  organizer, 
  type, 
  formatter 
}: { 
  organizer: Organizer | null
  type: 'revenue' | 'tickets'
  formatter: string 
}) {
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
        
        // Fetch data for different periods
        const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
          getRevenueByPeriod(organizer.id, 'daily'),
          getRevenueByPeriod(organizer.id, 'weekly'),
          getRevenueByPeriod(organizer.id, 'monthly')
        ])

        // Transform data to chart format
        const transformData = (data: any[]) => 
          (data || []).map((item: any, index: number) => ({
            x: item.period_label || `P${index + 1}`,
            y: type === 'revenue' ? item.total_revenue || 0 : item.total_bookings || 0
          }))

          setDailyData(transformData(dailyRes.data || []))
          setWeeklyData(transformData(weeklyRes.data || []))
          setMonthlyData(transformData(monthlyRes.data || []))
      } catch (error) {
        console.error('Error fetching chart data:', error)
          // Keep empty on error
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

    const hasAnyData = (dailyData.length + weeklyData.length + monthlyData.length) > 0
    if (!hasAnyData) {
      return (
        <div className="rounded-2xl border border-border/60 bg-card/90 p-6 text-center text-sm text-muted-foreground">
          No activity yet. Your sales and tickets will appear here once you get bookings.
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

// No mock fallback
