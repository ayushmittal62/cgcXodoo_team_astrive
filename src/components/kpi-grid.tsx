"use client"

import { KPIStat } from "@/components/kpi-stat"
import { formatCurrencyINR } from "@/lib/formatters"

export function KpiGrid({
  totals,
}: { totals: { revenue: number; tickets: number; avgPrice: number; activeEvents: number } }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KPIStat
        title="Total Revenue"
        value={formatCurrencyINR(totals.revenue)}
        delta={{ value: "+8.2%", positive: true }}
        sparkline={[10, 12, 14, 11, 16, 18, 20]}
        subtitle="Selected range"
      />
      <KPIStat
        title="Tickets Sold"
        value={String(totals.tickets)}
        delta={{ value: "+3.4%", positive: true }}
        sparkline={[120, 125, 130, 140, 138, 150, 160]}
        subtitle="Selected range"
      />
      <KPIStat
        title="Avg Ticket Price"
        value={formatCurrencyINR(totals.avgPrice)}
        delta={{ value: "-1.1%", positive: false }}
        sparkline={[900, 880, 860, 870, 865, 855, 850]}
        subtitle="Weighted"
      />
      <KPIStat
        title="Active Events"
        value={String(totals.activeEvents)}
        delta={{ value: "0%", positive: true }}
        sparkline={[2, 2, 2, 2, 2, 2, 2]}
        subtitle="Ongoing"
      />
    </section>
  )
}
