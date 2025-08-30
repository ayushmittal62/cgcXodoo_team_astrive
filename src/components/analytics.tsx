"use client"

import { AreaChartCard } from "@/components/area-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AnalyticsSection({ event }: { event: { id: string } }) {
  const series = Array.from({ length: 12 }).map((_, i) => ({ x: `W${i + 1}`, y: 500 + i * 75 }))
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <AreaChartCard title="Revenue over time" data={series} />
      <AreaChartCard title="Tickets sold by type" data={series.map((p) => ({ ...p, y: p.y / 5 }))} />
      <Card className="rounded-2xl bg-card/90 border-border/60 lg:col-span-2">
        <CardHeader>
          <CardTitle>Conversion funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 rounded-xl bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
            Funnel chart placeholder (Views → Checkouts → Paid)
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl bg-card/90 border-border/60">
        <CardHeader>
          <CardTitle>Top Cities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 rounded-xl bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
            Geo heatlist placeholder
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl bg-card/90 border-border/60">
        <CardHeader>
          <CardTitle>Device Split</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 rounded-xl bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
            Pie chart placeholder
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
