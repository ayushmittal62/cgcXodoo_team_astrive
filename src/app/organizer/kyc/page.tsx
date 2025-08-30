"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

type KycStatus = "not_submitted" | "pending" | "verified" | "rejected"
const KYC_KEY = "organizer_kyc_status_v1"

export default function OrganizerKycPage() {
  const { toast } = useToast()
  const [status, setStatus] = useState<KycStatus>("not_submitted")
  const [pan, setPan] = useState("")
  const [gst, setGst] = useState("")

  useEffect(() => {
    const raw = localStorage.getItem(KYC_KEY)
    if (raw) setStatus(raw as KycStatus)
  }, [])
  useEffect(() => {
    localStorage.setItem(KYC_KEY, status)
  }, [status])

  const statusBadge = useMemo(() => {
    switch (status) {
      case "verified":
        return <Badge variant="secondary">Verified</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">Not submitted</Badge>
    }
  }, [status])

  function submit() {
    if (!pan || !gst) {
      toast({ title: "Missing info", description: "Please provide PAN and GST for verification" })
      return
    }
    setStatus("pending")
    toast({ title: "KYC submitted", description: "Verification will take up to 24 hours." })
  }

  function simulateVerify(next: KycStatus) {
    setStatus(next)
    toast({ title: "Status updated", description: `KYC is now ${next.replace("_", " ")}` })
  }

  return (
    <main className="p-4 md:p-6">
      <div className="max-w-[800px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">KYC Verification</h1>
          {statusBadge}
        </div>

        <Card className="rounded-2xl bg-card/90 border-border/60">
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <label htmlFor="pan" className="text-sm text-muted-foreground">
                PAN Number
              </label>
              <Input id="pan" value={pan} onChange={(e) => setPan(e.target.value)} className="rounded-xl bg-muted/50" />
            </div>
            <div className="space-y-2">
              <label htmlFor="gst" className="text-sm text-muted-foreground">
                GST Number
              </label>
              <Input id="gst" value={gst} onChange={(e) => setGst(e.target.value)} className="rounded-xl bg-muted/50" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground" htmlFor="doc-id">
                  Government ID (PDF or image)
                </label>
                <Input id="doc-id" type="file" accept=".pdf,image/*" className="rounded-xl bg-muted/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground" htmlFor="doc-bank">
                  Bank Statement (PDF)
                </label>
                <Input id="doc-bank" type="file" accept=".pdf" className="rounded-xl bg-muted/50" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-xl bg-transparent"
                onClick={() => simulateVerify("verified")}
              >
                Simulate Verify
              </Button>
              <Button
                variant="outline"
                className="rounded-xl bg-transparent"
                onClick={() => simulateVerify("rejected")}
              >
                Simulate Reject
              </Button>
              <Button className="rounded-xl" onClick={submit}>
                Submit for Review
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Note: This is a simulated KYC flow for design/testing. In production, verification happens via a partner and
          may require additional steps.
        </p>
      </div>
    </main>
  )
}
