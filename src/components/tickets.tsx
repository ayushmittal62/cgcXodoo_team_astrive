"use client"

import { useState } from "react"
import type { EventItem, TicketTier } from "@/lib/organizer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, ArrowDown, ArrowUp, Trash } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { toast } from "sonner"
import { formatCurrencyINR } from "@/lib/formatters"

export function TicketsSection({
  event,
  onChange,
}: { event: EventItem; onChange: (patch: Partial<EventItem>) => void }) {
  const [tiers, setTiers] = useState<TicketTier[]>(event.tickets)

  function persist(next: TicketTier[]) {
    setTiers(next)
    onChange({ tickets: next })
    toast("Inventory updated", { description: "Ticket tiers updated" })
  }
  function addTier() {
    const id = Math.random().toString(36).slice(2, 8)
    persist([...tiers, { id, name: "New Tier", price: 999, quantity: 50, perUserLimit: 4, sold: 0 }])
  }

  function removeTier(id: string) {
    persist(tiers.filter((t) => t.id !== id))
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...tiers]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    persist(next)
  }

  function update(id: string, patch: Partial<TicketTier>) {
    persist(tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  return (
    <Card id="tickets" className="rounded-2xl bg-card/90 border-border/60">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Tickets</CardTitle>
        <Button onClick={addTier} className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" /> Add Tier
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price (₹)</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Per-user limit</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((t, idx) => (
                <TableRow key={t.id} className="hover:bg-muted/40">
                  <TableCell>
                    <Input
                      value={t.name}
                      onChange={(e) => update(t.id, { name: e.target.value })}
                      className="rounded-xl bg-muted/50"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={t.price}
                      onChange={(e) => update(t.id, { price: Number(e.target.value) || 0 })}
                      className="rounded-xl bg-muted/50"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={t.quantity}
                      onChange={(e) => update(t.id, { quantity: Number(e.target.value) || 0 })}
                      className="rounded-xl bg-muted/50"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={t.perUserLimit ?? 0}
                      onChange={(e) => update(t.id, { perUserLimit: Number(e.target.value) || 0 })}
                      className="rounded-xl bg-muted/50"
                    />
                  </TableCell>
                  <TableCell>{t.sold}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl bg-transparent"
                        onClick={() => move(idx, -1)}
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl bg-transparent"
                        onClick={() => move(idx, 1)}
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <ConfirmDialog title="Remove tier?" onConfirm={() => removeTier(t.id)}>
                        <Button variant="destructive" size="icon" className="rounded-xl" aria-label="Delete">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </ConfirmDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {tiers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No ticket tiers yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Total potential revenue:{" "}
          <span className="font-medium">
            {formatCurrencyINR(tiers.reduce((acc, t) => acc + t.price * t.quantity, 0))}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
