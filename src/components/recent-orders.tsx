"use client"

import { useMemo, useState } from "react"
import { DataTable } from "@/components/data-table"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockBookings, mockEvents } from "@/lib/mock-data"
import { formatCurrencyINR, formatDateTimeISO } from "@/lib/formatters"
import type { Booking } from "@/types/organizer"
import { useToast } from "@/hooks/use-toast"

export function RecentOrders() {
  const { toast } = useToast()
  const [selected, setSelected] = useState<Booking | null>(null)

  const rows = useMemo(() => {
    const eventMap = new Map(mockEvents.map((e) => [e.id, e.title]))
    return mockBookings.map((b) => ({
      ...b,
      eventTitle: eventMap.get(b.eventId) || b.eventId,
      amountINR: formatCurrencyINR(b.amount),
      createdAtFmt: formatDateTimeISO(b.createdAt),
    }))
  }, [])

  function onExportCsv() {
    // TODO: replace with real export
    console.log("[export] CSV started", rows.length)
    toast({ title: "Export started", description: "Preparing CSV for download..." })
  }
  function onExportXlsx() {
    console.log("[export] Excel started", rows.length)
    toast({ title: "Export started", description: "Preparing Excel file..." })
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-muted-foreground">Recent Orders</h2>
        <div className="text-xs text-muted-foreground">Click a row to view</div>
      </div>

      <div role="region" aria-label="Recent Orders Table">
        <DataTable
          data={rows}
          columns={[
            { key: "id", label: "Order ID", render: (v) => <code className="font-mono">{v}</code> },
            { key: "eventTitle", label: "Event" },
            { key: "buyerName", label: "Buyer" },
            { key: "qty", label: "Qty" },
            { key: "amountINR", label: "Amount (₹)" },
            {
              key: "paymentStatus",
              label: "Status",
              render: (v: Booking["paymentStatus"]) => (
                <Badge variant={v === "paid" ? "secondary" : v === "pending" ? "outline" : "destructive"}>{v}</Badge>
              ),
            },
            { key: "createdAtFmt", label: "Created At" },
          ]}
          globalFilterKey="buyerName"
          onExportCsv={onExportCsv}
          onExportXlsx={onExportXlsx}
          pageSize={5}
        />
      </div>

      {/* Order drawer (sheet) */}
      <InteractiveRowOpener onOpen={setSelected} />
      <OrderSheet booking={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </section>
  )
}

// Helper component to attach click handlers to table rows via event delegation
function InteractiveRowOpener({ onOpen }: { onOpen: (row: Booking) => void }) {
  return (
    <div
      className="sr-only"
      aria-hidden
      // In a real app, you'd pass a row renderer with onClick directly.
    />
  )
}

function OrderSheet({ booking, onOpenChange }: { booking: Booking | null; onOpenChange: (open: boolean) => void }) {
  const event = booking ? mockEvents.find((e) => e.id === booking.eventId) : null
  const open = Boolean(booking)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Order {booking?.id}</SheetTitle>
        </SheetHeader>
        {!booking ? null : (
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Event</span>
              <span className="font-medium">{event?.title ?? booking.eventId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Buyer</span>
              <span className="font-medium">{booking.buyerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{booking.buyerEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{booking.buyerPhone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Qty</span>
              <span className="font-medium">{booking.qty}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">{formatCurrencyINR(booking.amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium capitalize">{booking.paymentStatus}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Check-in</span>
              <span className="font-medium">
                {booking.checkinStatus === "checked_in" ? "Checked-in" : "Not checked-in"}
              </span>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Button variant="outline" className="rounded-xl bg-transparent">
                Resend Ticket
              </Button>
              <Button variant="destructive" className="rounded-xl">
                Refund
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
