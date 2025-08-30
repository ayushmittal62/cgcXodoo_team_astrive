"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AreaChartCard, type SeriesPoint } from "@/components/area-chart"
import { useOrganizerData } from "@/hooks/useOrganizerData"
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
  const { getRevenueData } = useOrganizerData()
  const [dailyData, setDailyData] = useState<SeriesPoint[]>([])
  const [weeklyData, setWeeklyData] = useState<SeriesPoint[]>([])
  const [monthlyData, setMonthlyData] = useState<SeriesPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizer) {
      // Use fallback mock data if no organizer
      setDailyData(buildFallbackSeries(14, type === 'revenue' ? 1200 : 120, 0.3))
      setWeeklyData(buildFallbackSeries(12, type === 'revenue' ? 6000 : 600, 0.2))
      setMonthlyData(buildFallbackSeries(6, type === 'revenue' ? 24000 : 2400, 0.15))
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch data for different periods
        const [daily, weekly, monthly] = await Promise.all([
          getRevenueData('daily'),
          getRevenueData('weekly'),
          getRevenueData('monthly')
        ])

        // Transform data to chart format
        const transformData = (data: any[], valueKey: string) => 
          data.map((item, index) => ({
            x: item.period_label || `P${index + 1}`,
            y: type === 'revenue' ? item.total_revenue || 0 : item.total_bookings || 0
          }))

        setDailyData(transformData(daily, type))
        setWeeklyData(transformData(weekly, type))
        setMonthlyData(transformData(monthly, type))
      } catch (error) {
        console.error('Error fetching chart data:', error)
        // Fallback to mock data on error
        setDailyData(buildFallbackSeries(14, type === 'revenue' ? 1200 : 120, 0.3))
        setWeeklyData(buildFallbackSeries(12, type === 'revenue' ? 6000 : 600, 0.2))
        setMonthlyData(buildFallbackSeries(6, type === 'revenue' ? 24000 : 2400, 0.15))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [organizer, type, getRevenueData])

  if (loading) {
    return <div className="h-64 bg-muted animate-pulse rounded-xl" />
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

// Fallback function for mock data when real data is not available
function buildFallbackSeries(len = 12, base = 1000, variance = 0.25) {
  const out: SeriesPoint[] = []
  let last = base
  for (let i = 0; i < len; i++) {
    const delta = (Math.random() - 0.5) * variance * base
    last = Math.max(0, last + delta)
    out.push({ x: `P${i + 1}`, y: Math.round(last) })
  }
  return out
}
