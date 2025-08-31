"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SparklineProps = {
  points?: number[]
}

function InlineSparkline({ points }: SparklineProps) {
  if (!points || points.length < 2) return <div className="h-8 rounded bg-muted/40" aria-hidden />
  const w = 120
  const h = 32
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const path = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - ((v - min) / span) * h
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="text-primary/80">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function KPIStat(props: {
  title: string
  value: string
  delta?: { value: string; positive?: boolean }
  sparkline?: number[]
  className?: string
  subtitle?: string
}) {
  const { title, value, delta, sparkline, className, subtitle } = props
  return (
    <Card className={cn("rounded-2xl bg-card/90 border-border/60", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
          {delta && (
            <div
              className={cn("mt-1 text-xs", delta.positive === false ? "text-red-400" : "text-emerald-400")}
              aria-label="Change vs previous period"
            >
              {delta.value}
            </div>
          )}
        </div>
        <div className="shrink-0">
          <InlineSparkline points={sparkline} />
        </div>
      </CardContent>
    </Card>
  )
}
