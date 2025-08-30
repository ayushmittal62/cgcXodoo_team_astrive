"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AreaChartCard } from "@/components/area-chart"
import { KpiGrid } from "@/components/kpi-grid"
import { mockEvents, mockBookings } from "@/lib/mock-data"
import { formatCurrencyINR } from "@/lib/formatters"

type Metric = "revenue" | "tickets" | "aov"
type Range = "7d" | "30d" | "90d"

function makeSeries(metric: Metric, range: Range) {
  const n = range === "7d" ? 7 : range === "30d" ? 30 : 90
  const base = metric === "revenue" ? 5000 : metric === "tickets" ? 80 : 250
  const data = Array.from({ length: n }).map((_, i) => ({
    x: `D${i + 1}`,
    y: Math.max(0, Math.round(base + Math.sin(i / 3) * (base / 4) + (i % 5) * (metric === "revenue" ? 120 : 5))),
  }))
  return data
}

export default function OrganizerAnalyticsPage() {
  const [metric, setMetric] = useState<Metric>("revenue")
  const [range, setRange] = useState<Range>("30d")

  const totals = useMemo(() => {
    const totalRevenue = mockEvents.reduce((acc, e) => acc + e.revenue, 0)
    const totalTickets = mockEvents.reduce((acc, e) => acc + e.sold, 0)
    const aov = totalTickets ? totalRevenue / totalTickets : 0
    const active = mockEvents.filter((e) => e.status === "published").length
    return { revenue: totalRevenue, tickets: totalTickets, avgPrice: aov, activeEvents: active }
  }, [])

  const series = useMemo(() => makeSeries(metric, range), [metric, range])

  const topEventsByRevenue = useMemo(
    () =>
      [...mockEvents]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((e) => ({ id: e.id, title: e.title, revenue: e.revenue, tickets: e.sold })),
    [],
  )

  return (
    <main className="p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-balance">Analytics</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl bg-transparent" onClick={() => window.print()}>
              Export PDF
            </Button>
            <Button className="rounded-xl" onClick={() => console.log("[export] CSV analytics")}>
              Export CSV
            </Button>
          </div>
        </div>

        <KpiGrid totals={totals} />

        <Card className="rounded-2xl bg-card/90 border-border/60">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Sales Overview</CardTitle>
            <div className="flex items-center gap-2">
              <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
                <TabsList className="rounded-xl">
                  <TabsTrigger value="revenue">Revenue</TabsTrigger>
                  <TabsTrigger value="tickets">Tickets</TabsTrigger>
                  <TabsTrigger value="aov">Avg Order Value</TabsTrigger>
                </TabsList>
              </Tabs>
              <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
                <TabsList className="rounded-xl">
                  <TabsTrigger value="7d">7d</TabsTrigger>
                  <TabsTrigger value="30d">30d</TabsTrigger>
                  <TabsTrigger value="90d">90d</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <AreaChartCard
              title={`${metric === "revenue" ? "Revenue" : metric === "tickets" ? "Tickets" : "Average Order Value"} (${range})`}
              data={series}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="rounded-2xl bg-card/90 border-border/60">
            <CardHeader>
              <CardTitle>Top Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topEventsByRevenue.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{e.title}</Badge>
                    <span className="text-muted-foreground">{e.tickets} tickets</span>
                  </div>
                  <div className="font-medium">{formatCurrencyINR(e.revenue)}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-card/90 border-border/60">
            <CardHeader>
              <CardTitle>Orders Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Total bookings: {mockBookings.length}. Paid volume:{" "}
              {formatCurrencyINR(
                mockBookings.filter((b) => b.paymentStatus === "paid").reduce((a, b) => a + b.amount, 0),
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
