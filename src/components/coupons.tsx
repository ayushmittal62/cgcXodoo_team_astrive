"use client"

import { useMemo, useState } from "react"
import type { Coupon } from "@/lib/organizer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ConfirmDialog } from "@/components/confirm-dialog"

const seedCoupons: Coupon[] = [
  {
    id: "cp_rock10",
    code: "ROCK10",
    type: "percent",
    value: 10,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 7 * 864e5).toISOString(),
    maxUses: 200,
    used: 35,
    active: true,
  },
]

export function CouponsSection({ eventId }: { eventId: string }) {
  const [coupons, setCoupons] = useState<Coupon[]>(seedCoupons.map((c) => ({ ...c, eventId })))

  function add() {
    const id = Math.random().toString(36).slice(2, 10)
    setCoupons((prev) => [
      ...prev,
      {
        id,
        code: "NEWCODE",
        type: "flat",
        value: 100,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 864e5).toISOString(),
        used: 0,
        maxUses: 100,
        active: true,
        eventId,
      },
    ])
  }

  function update(id: string, patch: Partial<Coupon>) {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  function remove(id: string) {
    setCoupons((prev) => prev.filter((c) => c.id !== id))
  }

  const rows = useMemo(() => coupons, [coupons])

  return (
    <Card className="rounded-2xl bg-card/90 border-border/60">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Coupons</CardTitle>
        <Button onClick={add} className="rounded-xl">
          Add Coupon
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[160px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => {
                const windowLabel = `${new Date(c.startsAt).toLocaleDateString()} → ${new Date(c.endsAt).toLocaleDateString()}`
                const usageLabel = typeof c.maxUses === "number" ? `${c.used}/${c.maxUses}` : `${c.used}`
                return (
                  <TableRow key={c.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Input
                        value={c.code}
                        onChange={(e) => update(c.id, { code: e.target.value.toUpperCase() })}
                        className="rounded-xl bg-muted/50"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={c.type} onValueChange={(v: "flat" | "percent") => update(c.id, { type: v })}>
                        <SelectTrigger className="rounded-xl bg-muted/50">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat">Flat</SelectItem>
                          <SelectItem value="percent">Percent</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={c.value}
                        onChange={(e) => update(c.id, { value: Number(e.target.value) || 0 })}
                        className="rounded-xl bg-muted/50"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{windowLabel}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{usageLabel}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={c.active ? "secondary" : "outline"}>{c.active ? "Active" : "Inactive"}</Badge>
                        <Switch
                          checked={!!c.active}
                          onCheckedChange={(checked) => update(c.id, { active: checked })}
                          aria-label="Toggle active"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="rounded-xl bg-transparent"
                          onClick={() =>
                            update(c.id, {
                              startsAt: new Date().toISOString(),
                              endsAt: new Date(Date.now() + 7 * 864e5).toISOString(),
                            })
                          }
                        >
                          Extend 7d
                        </Button>
                        <ConfirmDialog
                          title="Delete coupon?"
                          description="This will remove the coupon. This action cannot be undone."
                          onConfirm={() => remove(c.id)}
                        >
                          <Button variant="destructive" className="rounded-xl">
                            Delete
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    No coupons yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
