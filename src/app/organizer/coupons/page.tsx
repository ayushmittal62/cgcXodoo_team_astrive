"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockEvents } from "@/lib/mock-data"
import type { Coupon } from "@/lib/organizer"
import { useToast } from "@/hooks/use-toast"

function seed(eventId: string): Coupon[] {
  return [
    {
      id: `cp_${eventId}_10`,
      code: "SAVE10",
      type: "percent",
      value: 10,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 5 * 864e5).toISOString(),
      used: Math.floor(Math.random() * 50),
      maxUses: 200,
      active: true,
      eventId,
    },
  ]
}

export default function OrganizerCouponsPage() {
  const { toast } = useToast()
  const initial = useMemo(() => mockEvents.flatMap((e) => seed(e.id)), [])
  const [rows, setRows] = useState<(Coupon & { eventTitle: string; window: string })[]>(
    initial.map((c) => {
      const ev = mockEvents.find((e) => e.id === c.eventId)
      return {
        ...c,
        eventTitle: ev?.title || c.eventId,
        window: `${new Date(c.startsAt).toLocaleDateString()} → ${new Date(c.endsAt).toLocaleDateString()}`,
      }
    }),
  )

  function onExportCsv(selected: any[]) {
    console.log("[export] CSV coupons", selected.length)
    toast({ title: "Export started", description: "Preparing coupons CSV..." })
  }
  function onExportXlsx(selected: any[]) {
    console.log("[export] Excel coupons", selected.length)
    toast({ title: "Export started", description: "Preparing coupons Excel..." })
  }

  function toggleActive(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)))
  }

  return (
    <main className="p-4 md:p-6">
      <div className="max-w-[1200px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Coupons</h1>
          <Button className="rounded-xl" onClick={() => toast({ title: "Create coupon", description: "Stub action" })}>
            Create Coupon
          </Button>
        </div>

        <Card className="rounded-2xl bg-card/90 border-border/60">
          <CardHeader>
            <CardTitle>All Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={rows}
              columns={[
                { key: "code", label: "Code" },
                { key: "eventTitle", label: "Event" },
                {
                  key: "type",
                  label: "Type",
                  render: (v) => (
                    <Badge variant="secondary" className="capitalize">
                      {v}
                    </Badge>
                  ),
                },
                { key: "value", label: "Value" },
                { key: "window", label: "Active Window" },
                {
                  key: "used",
                  label: "Usage",
                  render: (_v, row) => (row.maxUses ? `${row.used}/${row.maxUses}` : row.used),
                },
                {
                  key: "active",
                  label: "Status",
                  render: (v, row) => (
                    <Button
                      variant="outline"
                      className="rounded-xl bg-transparent"
                      onClick={() => toggleActive(row.id)}
                    >
                      {v ? "Active" : "Inactive"}
                    </Button>
                  ),
                },
              ]}
              globalFilterKey="code"
              onExportCsv={onExportCsv}
              onExportXlsx={onExportXlsx}
              pageSize={10}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
