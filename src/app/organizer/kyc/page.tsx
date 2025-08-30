"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { createOrganizer, getOrganizerByUserId } from "@/lib/supabase"
import { toast } from "sonner"

type KycStatus = "not_submitted" | "pending" | "verified" | "rejected"

export default function OrganizerKycPage() {
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()
  const [status, setStatus] = useState<KycStatus>("not_submitted")
  const [aadhaar, setAadhaar] = useState("")
  const [pan, setPan] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(true)

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (!authLoading && !user) {
      router.push('/sign-in')
      return
    }

    // Check if user already has organizer profile
    if (!authLoading && userProfile?.id) {
      checkExistingOrganizer()
    }
  }, [authLoading, user, userProfile, router])

  const checkExistingOrganizer = async () => {
    if (!userProfile?.id) return

    try {
      setCheckingExisting(true)
      const { data: organizer, error } = await getOrganizerByUserId(userProfile.id)
      
      if (error) {
        console.error('Error checking organizer:', error)
        setCheckingExisting(false)
        return
      }

      if (organizer) {
        // User already has organizer profile, redirect to dashboard
        router.push('/organizer/dashboard')
      } else {
        setCheckingExisting(false)
      }
    } catch (err) {
      console.error('Error in checkExistingOrganizer:', err)
      setCheckingExisting(false)
    }
  }

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

  const submit = async () => {
    if (!aadhaar || !pan) {
      toast.error("Missing information", { 
        description: "Please provide both Aadhaar and PAN numbers for verification" 
      })
      return
    }

    if (!userProfile?.id) {
      toast.error("User not found", { 
        description: "Please refresh the page and try again" 
      })
      return
    }

    try {
      setLoading(true)
      setStatus("pending")

      const { data: organizer, error } = await createOrganizer({
        user_id: userProfile.id,
        aadhaar_number: aadhaar,
        pan_number: pan
      })

      if (error) {
        console.error('Error creating organizer:', error)
        toast.error("Submission failed", { 
          description: "There was an error submitting your KYC. Please try again." 
        })
        setStatus("not_submitted")
        return
      }

      toast.success("KYC submitted successfully", { 
        description: "Verification will take up to 24 hours. You can access your dashboard once verified." 
      })
      
      // For demo purposes, auto-verify after a short delay
      setTimeout(async () => {
        setStatus("verified")
        toast.success("KYC Verified", { 
          description: "Your organizer account has been verified. Redirecting to dashboard..." 
        })
        
        // Redirect to dashboard after verification
        setTimeout(() => {
          router.push('/organizer/dashboard')
        }, 2000)
      }, 3000)

    } catch (err) {
      console.error('Error in submit:', err)
      toast.error("An unexpected error occurred")
      setStatus("not_submitted")
    } finally {
      setLoading(false)
    }
  }

  function simulateVerify(next: KycStatus) {
    setStatus(next)
    toast.success("Status updated", { description: `KYC is now ${next.replace("_", " ")}` })
    
    if (next === "verified") {
      setTimeout(() => {
        router.push('/organizer/dashboard')
      }, 1500)
    }
  }

  if (authLoading || checkingExisting) {
    return (
      <main className="p-4 md:p-6">
        <div className="max-w-[800px] mx-auto">
          <div className="h-64 bg-muted animate-pulse rounded-xl" />
        </div>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <div className="max-w-[800px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Organizer KYC Verification</h1>
          {statusBadge}
        </div>

        <div className="text-sm text-muted-foreground mb-4">
          Complete your KYC verification to start organizing events on our platform.
        </div>

        <Card className="rounded-2xl bg-card/90 border-border/60">
          <CardHeader>
            <CardTitle>Required Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <label htmlFor="aadhaar" className="text-sm text-muted-foreground">
                Aadhaar Number *
              </label>
              <Input 
                id="aadhaar" 
                value={aadhaar} 
                onChange={(e) => setAadhaar(e.target.value)} 
                className="rounded-xl bg-muted/50"
                placeholder="Enter your 12-digit Aadhaar number"
                disabled={loading || status === "verified"}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="pan" className="text-sm text-muted-foreground">
                PAN Number *
              </label>
              <Input 
                id="pan" 
                value={pan} 
                onChange={(e) => setPan(e.target.value.toUpperCase())} 
                className="rounded-xl bg-muted/50"
                placeholder="Enter your PAN number"
                disabled={loading || status === "verified"}
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground" htmlFor="doc-id">
                  Government ID (Optional)
                </label>
                <Input 
                  id="doc-id" 
                  type="file" 
                  accept=".pdf,image/*" 
                  className="rounded-xl bg-muted/50"
                  disabled={loading || status === "verified"} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground" htmlFor="doc-bank">
                  Bank Statement (Optional)
                </label>
                <Input 
                  id="doc-bank" 
                  type="file" 
                  accept=".pdf" 
                  className="rounded-xl bg-muted/50"
                  disabled={loading || status === "verified"} 
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2">
              {process.env.NODE_ENV === 'development' && (
                <>
                  <Button
                    variant="outline"
                    className="rounded-xl bg-transparent"
                    onClick={() => simulateVerify("verified")}
                    disabled={loading}
                  >
                    Quick Verify (Dev)
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl bg-transparent"
                    onClick={() => simulateVerify("rejected")}
                    disabled={loading}
                  >
                    Simulate Reject
                  </Button>
                </>
              )}
              <Button 
                className="rounded-xl" 
                onClick={submit}
                disabled={loading || status === "verified" || !aadhaar || !pan}
              >
                {loading ? "Submitting..." : "Submit for Review"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          * Required fields. Your information is securely stored and used only for verification purposes. 
          KYC verification typically takes up to 24 hours.
        </p>
      </div>
    </main>
  )
}
