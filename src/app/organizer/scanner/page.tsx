"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { mockBookings } from "@/lib/mock-data"
import { formatDateTimeISO } from "@/lib/formatters"

type ScanResult =
  | { status: "ok"; bookingId: string; buyer: string; created: string }
  | { status: "already"; bookingId: string }
  | { status: "invalid"; code: string }

export default function ScannerPage() {
  const [code, setCode] = useState("")
  const [history, setHistory] = useState<ScanResult[]>([])
  const [checkedIn, setCheckedIn] = useState<Record<string, boolean>>({})

  const last = history[0]

  function scan() {
    const trimmed = code.trim()
    if (!trimmed) return
    const booking = mockBookings.find((b) => b.id === trimmed)
    if (!booking) {
      setHistory((prev) => [{ status: "invalid" as const, code: trimmed }, ...prev].slice(0, 5))
      setCode("")
      return
    }
    if (checkedIn[booking.id]) {
      setHistory((prev) => [{ status: "already" as const, bookingId: booking.id }, ...prev].slice(0, 5))
      setCode("")
      return
    }
    setCheckedIn((prev) => ({ ...prev, [booking.id]: true }))
    setHistory((prev) =>
      [
        {
          status: "ok" as const,
          bookingId: booking.id,
          buyer: booking.buyerName,
          created: formatDateTimeISO(booking.createdAt),
        },
        ...prev,
      ].slice(0, 5),
    )
    setCode("")
  }

  function markManual() {
    scan()
  }

  return (
    <main className="p-4 md:p-6">
      <div className="max-w-[900px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Scanner</h1>
          <div className="text-sm text-muted-foreground">Simulated QR check-in</div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="rounded-2xl bg-card/90 border-border/60">
            <CardHeader>
              <CardTitle>Scan or Enter Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Paste or type booking code (e.g., bk_...)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && scan()}
                className="rounded-xl bg-muted/50"
                aria-label="Booking code"
              />
              <div className="flex items-center gap-2">
                <Button className="rounded-xl" onClick={scan}>
                  Validate
                </Button>
                <Button variant="outline" className="rounded-xl bg-transparent" onClick={markManual}>
                  Mark Manual Check-in
                </Button>
              </div>

              {last && (
                <div className="rounded-xl border border-border/60 p-3 text-sm">
                  {last.status === "ok" && (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Checked-in: {last.buyer}</div>
                        <div className="text-muted-foreground">
                          ID: {last.bookingId} • {last.created}
                        </div>
                      </div>
                      <Badge variant="secondary">OK</Badge>
                    </div>
                  )}
                  {last.status === "already" && (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Already checked-in</div>
                        <div className="text-muted-foreground">ID: {last.bookingId}</div>
                      </div>
                      <Badge variant="outline">Already</Badge>
                    </div>
                  )}
                  {last.status === "invalid" && (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Invalid code</div>
                        <div className="text-muted-foreground">Code: {last.code}</div>
                      </div>
                      <Badge variant="destructive">Error</Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-card/90 border-border/60">
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {history.length === 0 && <div className="text-muted-foreground">No scans yet.</div>}
              {history.map((h, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border border-border/60 p-2">
                  <div className="text-muted-foreground">
                    {h.status === "ok" && (
                      <span>
                        OK • {h.bookingId} • {h.buyer} • {h.created}
                      </span>
                    )}
                    {h.status === "invalid" && <span>Invalid • {h.code}</span>}
                    {h.status === "already" && <span>Already • {h.bookingId}</span>}
                  </div>
                  <Badge variant={h.status === "ok" ? "secondary" : h.status === "invalid" ? "destructive" : "outline"}>
                    {h.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
