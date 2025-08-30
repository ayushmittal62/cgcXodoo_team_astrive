"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AreaChartCard, type SeriesPoint } from "@/components/area-chart"

function buildSeries(len = 12, base = 1000, variance = 0.25) {
  const out: SeriesPoint[] = []
  let last = base
  for (let i = 0; i < len; i++) {
    const delta = (Math.random() - 0.5) * variance * base
    last = Math.max(0, last + delta)
    out.push({ x: `W${i + 1}`, y: Math.round(last) })
  }
  return out
}

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
          <GranularityCharts base={1200} formatter="₹" />
        </TabsContent>
        <TabsContent value="tickets" className="mt-3">
          <GranularityCharts base={120} formatter="" />
        </TabsContent>
      </Tabs>
    </section>
  )
}

function GranularityCharts({ base, formatter }: { base: number; formatter: string }) {
  const daily = buildSeries(14, base, 0.3)
  const weekly = buildSeries(12, base * 5, 0.2)
  const monthly = buildSeries(6, base * 20, 0.15)

  return (
    <Tabs defaultValue="weekly" className="w-full">
      <TabsList className="rounded-xl">
        <TabsTrigger value="daily">Daily</TabsTrigger>
        <TabsTrigger value="weekly">Weekly</TabsTrigger>
        <TabsTrigger value="monthly">Monthly</TabsTrigger>
      </TabsList>

      <TabsContent value="daily" className="mt-3">
        <AreaChartCard title={`Daily (${formatter})`} data={daily} />
      </TabsContent>
      <TabsContent value="weekly" className="mt-3">
        <AreaChartCard title={`Weekly (${formatter})`} data={weekly} />
      </TabsContent>
      <TabsContent value="monthly" className="mt-3">
        <AreaChartCard title={`Monthly (${formatter})`} data={monthly} />
      </TabsContent>
    </Tabs>
  )
}
