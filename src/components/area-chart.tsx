"use client"

import React, { Suspense } from "react"

const LazyArea = React.lazy(() => import("./recharts-area"))

export type SeriesPoint = { x: string | number | Date; y: number }

export function AreaChartCard({
  title,
  data,
  height = 220,
  color = "var(--color-chart-1, #22d3ee)",
}: {
  title: string
  data: SeriesPoint[]
  height?: number
  color?: string
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/90">
      <div className="px-4 pt-4 text-sm text-muted-foreground">{title}</div>
      <div className="p-2">
        <Suspense fallback={<div className="h-[220px] rounded-xl bg-muted/40" aria-hidden />}>
          <LazyArea data={data} height={height} color={color} />
        </Suspense>
      </div>
    </div>
  )
}
