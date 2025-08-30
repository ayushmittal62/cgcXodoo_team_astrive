"use client"

import { DataTable } from "@/components/data-table"
import { formatCurrencyINR, formatDateTimeISO } from "@/lib/formatters"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function BookingsSection({ event, rows }: { event: any; rows: any[] }) {

  function onExportCsv(selected: any[]) {
    console.log("[export] CSV bookings", selected.length)
    toast("Export started", { description: "Preparing bookings CSV..." })
  }
  function onExportXlsx(selected: any[]) {
    console.log("[export] Excel bookings", selected.length)
    toast("Export started", { description: "Preparing bookings Excel..." })
  }

  return (
    <Card id="bookings" className="rounded-2xl bg-card/90 border-border/60">
      <CardHeader>
        <CardTitle>Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          data={rows.map((b) => ({
            ...b,
            amountINR: formatCurrencyINR(b.amount),
            createdAtFmt: formatDateTimeISO(b.createdAt),
          }))}
          columns={[
            { key: "id", label: "Booking", render: (v) => <code className="font-mono">{v}</code> },
            { key: "buyerName", label: "Buyer" },
            { key: "buyerEmail", label: "Email" },
            { key: "buyerPhone", label: "Phone" },
            { key: "qty", label: "Qty" },
            { key: "amountINR", label: "Amount" },
            {
              key: "paymentStatus",
              label: "Payment",
              render: (v) => (
                <Badge variant={v === "paid" ? "secondary" : v === "pending" ? "outline" : "destructive"}>{v}</Badge>
              ),
            },
            {
              key: "checkinStatus",
              label: "Check-in",
              render: (v) => (
                <Badge variant={v === "checked_in" ? "secondary" : "outline"}>
                  {v === "checked_in" ? "Checked-in" : "Not checked-in"}
                </Badge>
              ),
            },
            { key: "createdAtFmt", label: "Created" },
          ]}
          globalFilterKey="buyerName"
          onExportCsv={onExportCsv}
          onExportXlsx={onExportXlsx}
          pageSize={10}
        />
        <div className="mt-3 flex items-center gap-2">
          <Button variant="outline" className="rounded-xl bg-transparent">
            Resend Tickets
          </Button>
          <ConfirmDialog
            title="Refund selected?"
            description="This will issue refunds for selected bookings."
            onConfirm={() => {}}
          >
            <Button variant="destructive" className="rounded-xl">
              Refund
            </Button>
          </ConfirmDialog>
          <ConfirmDialog
            title="Mark check-in?"
            description="Mark selected bookings as checked-in."
            onConfirm={() => {}}
          >
            <Button className="rounded-xl">Mark Check-in</Button>
          </ConfirmDialog>
        </div>
      </CardContent>
    </Card>
  )
}
