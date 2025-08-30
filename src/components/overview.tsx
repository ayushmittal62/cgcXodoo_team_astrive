"use client"

import { KpiGrid } from "@/components/kpi-grid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { EventItem, Booking } from "@/lib/organizer"
import { AreaChartCard } from "@/components/area-chart"
import { DataTable } from "@/components/data-table"
import { formatCurrencyINR, formatDateTimeISO } from "@/lib/formatters"
import { Badge } from "@/components/ui/badge"

export function OverviewSection({ event, bookings }: { event: EventItem; bookings: Booking[] }) {
  const totals = {
    revenue: event.revenue,
    tickets: event.sold,
    avgPrice: event.sold > 0 ? event.revenue / event.sold : 0,
    activeEvents: event.status === "published" ? 1 : 0,
  }

  return (
    <div className="space-y-6">
      <KpiGrid totals={totals} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AreaChartCard
            title="Sales Sparkline"
            data={Array.from({ length: 10 }).map((_, i) => ({
              x: `D${i + 1}`,
              y: Math.round(event.revenue / 10 + i * 50),
            }))}
          />
        </div>
        <Card className="rounded-2xl bg-card/90 border-border/60">
          <CardHeader>
            <CardTitle>Inventory Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {event.tickets.map((t) => {
              const left = t.quantity - t.sold
              return (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{t.name}</Badge>
                    <span className="text-muted-foreground">{formatCurrencyINR(t.price)}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {t.sold}/{t.quantity} sold • {left} left
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl bg-card/90 border-border/60">
          <CardHeader>
            <CardTitle>Latest Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={bookings.slice(0, 5).map((b) => ({
                ...b,
                amountINR: formatCurrencyINR(b.amount),
                createdAtFmt: formatDateTimeISO(b.createdAt),
              }))}
              columns={[
                { key: "id", label: "Order", render: (v) => <code className="font-mono">{v}</code> },
                { key: "buyerName", label: "Buyer" },
                { key: "qty", label: "Qty" },
                { key: "amountINR", label: "Amount" },
                { key: "createdAtFmt", label: "Created" },
              ]}
              globalFilterKey="buyerName"
              pageSize={5}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card/90 border-border/60">
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">No feedback for this event yet.</CardContent>
        </Card>
      </div>
    </div>
  )
}
