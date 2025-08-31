"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { getOrganizerByUserId, updateOrganizerProfile, supabase } from "@/lib/supabase"

type KycStatus = "not_submitted" | "pending" | "verified" | "rejected"
const KYC_KEY = "organizer_kyc_status_v1" // legacy local key (kept for backward-compat only)

export default function OrganizerKycPage() {
  const { toast } = useToast()
  const { userProfile } = useAuth()
  const [status, setStatus] = useState<KycStatus>("not_submitted")
  const [pan, setPan] = useState("")
  const [gst, setGst] = useState("")
  const [loading, setLoading] = useState(false)
  const [docIdFile, setDocIdFile] = useState<File | null>(null)
  const [docBankFile, setDocBankFile] = useState<File | null>(null)

  // On mount, load current organizer DB state
  useEffect(() => {
    let mounted = true
    async function load() {
      if (!userProfile?.email) return
      try {
        const email = userProfile.email.toLowerCase()
        const { data, error } = await getOrganizerByUserId(email)
        if (error) {
          // if no rows, show not_submitted
          if ((error as any).code === 'PGRST116' || (error as any).message?.includes('No rows')) {
            mounted && setStatus('not_submitted')
          }
        } else if (data) {
          mounted && setStatus(data.kyc_verified ? 'verified' : 'pending')
          mounted && setPan(data.pan_number ?? '')
          // we don't store GST; reuse placeholder field
        }
      } catch {}
    }
    load()
    return () => { mounted = false }
  }, [userProfile?.email])

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

  async function submit() {
    if (!pan || !gst) {
      toast({ title: "Missing info", description: "Please provide PAN and GST for verification" })
      return
    }
    if (!userProfile?.email) {
      toast({ title: "Not signed in", description: "Sign in to submit KYC" })
      return
    }
    try {
      setLoading(true)
      const email = userProfile.email.toLowerCase()
      // Optional: upload selected documents to Supabase Storage
      try {
        const folder = `kyc/${encodeURIComponent(email)}/${Date.now()}`
        if (docIdFile) {
          const { error: up1 } = await supabase
            .storage
            .from('kyc-docs')
            .upload(`${folder}/gov-id_${docIdFile.name}`, docIdFile, {
              cacheControl: '3600', upsert: false, contentType: docIdFile.type || undefined,
            })
          if (up1) console.warn('KYC: gov-id upload failed:', up1)
        }
        if (docBankFile) {
          const { error: up2 } = await supabase
            .storage
            .from('kyc-docs')
            .upload(`${folder}/bank_${docBankFile.name}`, docBankFile, {
              cacheControl: '3600', upsert: false, contentType: docBankFile.type || undefined,
            })
          if (up2) console.warn('KYC: bank statement upload failed:', up2)
        }
      } catch (e: any) {
        console.warn('KYC: upload threw (continuing):', e?.message || String(e))
      }
      const { error } = await updateOrganizerProfile(email, {
        pan_number: pan,
        aadhaar_number: gst, // reuse as placeholder for demo
        kyc_verified: false,
      })
      if (error) throw error
      setStatus("pending")
      toast({ title: "KYC submitted", description: "Your details have been sent for approval." })
    } catch (e: any) {
      toast({ title: "Submission failed", description: e?.message ?? String(e) })
    } finally {
      setLoading(false)
    }
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
                <Input
                  id="doc-id"
                  type="file"
                  accept=".pdf,image/*"
                  className="rounded-xl bg-muted/50"
                  onChange={(e) => setDocIdFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground" htmlFor="doc-bank">
                  Bank Statement (PDF)
                </label>
                <Input
                  id="doc-bank"
                  type="file"
                  accept=".pdf"
                  className="rounded-xl bg-muted/50"
                  onChange={(e) => setDocBankFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                className="rounded-xl cursor-pointer"
                onClick={submit}
                disabled={loading || status === 'pending' || status === 'verified'}
              >
                Submit for approval
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
