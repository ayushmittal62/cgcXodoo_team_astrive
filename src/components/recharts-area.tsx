"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { SeriesPoint } from "./area-chart"

export default function RechartsArea({
  data,
  height = 220,
  color,
}: {
  data: SeriesPoint[]
  height?: number
  color: string
}) {
  const series = data.map((d) => ({
    x: typeof d.x === "string" ? d.x : d.x instanceof Date ? d.x.toLocaleDateString("en-IN") : String(d.x),
    y: d.y,
  }))
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={series} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <XAxis dataKey="x" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} width={40} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--popover-foreground))",
              borderRadius: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="y"
            stroke={color}
            fill={color}
            fillOpacity={0.2}
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
