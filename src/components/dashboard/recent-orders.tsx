"use client"

import { useMemo, useState, useEffect } from "react"
import { DataTable } from "@/components/data-table"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getOrganizerBookings, type Organizer, type Booking } from "@/lib/supabase"
import { formatCurrencyINR, formatDateTimeISO } from "@/lib/formatters"
import { toast } from "sonner"

interface RecentOrdersProps {
  organizer: Organizer | null
}

interface BookingWithEventTitle extends Booking {
  event_title?: string
  amountINR?: string
  createdAtFmt?: string
  user_name?: string
  user_email?: string
  user_phone?: string
  payment_status?: string
  checked_in?: boolean
}

export function RecentOrders({ organizer }: RecentOrdersProps) {
  const [selected, setSelected] = useState<BookingWithEventTitle | null>(null)
  const [bookings, setBookings] = useState<BookingWithEventTitle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizer) {
      setLoading(false)
      return
    }

    const fetchBookings = async () => {
      try {
        const { data: bookingsData, error } = await getOrganizerBookings(organizer.id)
          if (error) {
            toast("Error loading bookings", { description: error.message || String(error) });
            setBookings([]);
          } else {
            setBookings(bookingsData || []);
          }
      } catch (err) {
        console.error('Error in fetchBookings:', err)
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [organizer])

  const rows = useMemo(() => bookings, [bookings])

  function onExportCsv() {
    console.log("[export] CSV started", rows.length)
    toast("Export started", { description: "Preparing CSV for download..." })
  }
  
  function onExportXlsx() {
    console.log("[export] Excel started", rows.length)
    toast("Export started", { description: "Preparing Excel file..." })
  }

  if (loading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-muted-foreground">Recent Orders</h2>
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-muted-foreground">Recent Orders</h2>
        <div className="text-xs text-muted-foreground">Click a row to view</div>
      </div>

      <div role="region" aria-label="Recent Orders Table">
        {bookings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No orders found</p>
            <p className="text-xs mt-1">Orders will appear here when customers book your events</p>
          </div>
        ) : (
          <DataTable
            data={rows}
            columns={[
              { key: "id", label: "Order ID", render: (v) => <code className="font-mono text-xs">{String(v).slice(0, 8)}...</code> },
              { key: "event_title", label: "Event" },
              { key: "user_name", label: "Buyer" },
              { key: "quantity", label: "Qty" },
              { key: "amountINR", label: "Amount (₹)" },
              {
                key: "payment_status",
                label: "Status",
                render: (v: string) => (
                  <Badge variant={
                    v === "completed" ? "secondary" : 
                    v === "pending" ? "outline" : 
                    "destructive"
                  }>
                    {v}
                  </Badge>
                ),
              },
              { key: "createdAtFmt", label: "Created At" },
            ]}
            globalFilterKey="user_name"
            onExportCsv={onExportCsv}
            onExportXlsx={onExportXlsx}
            pageSize={5}
          />
        )}
      </div>

      {/* Order drawer (sheet) */}
      <InteractiveRowOpener onOpen={setSelected} />
      <OrderSheet booking={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </section>
  )
}

// Helper component to attach click handlers to table rows via event delegation
function InteractiveRowOpener({ onOpen }: { onOpen: (row: BookingWithEventTitle) => void }) {
  return (
    <div
      className="sr-only"
      aria-hidden
      // In a real app, you'd pass a row renderer with onClick directly.
    />
  )
}

function OrderSheet({ 
  booking, 
  onOpenChange 
}: { 
  booking: BookingWithEventTitle | null
  onOpenChange: (open: boolean) => void 
}) {
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
              <span className="font-medium">{booking.event_title || 'Unknown Event'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Buyer</span>
              <span className="font-medium">{booking.user_name || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{booking.user_email || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{booking.user_phone || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Qty</span>
              <span className="font-medium">{booking.quantity || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">{formatCurrencyINR(booking.total_amount || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium capitalize">{booking.payment_status || 'pending'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Check-in</span>
              <span className="font-medium">
                {booking.checked_in ? "Checked-in" : "Not checked-in"}
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
