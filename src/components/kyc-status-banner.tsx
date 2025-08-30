"use client"

import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react"
import { useOrganizerData } from "@/hooks/useOrganizerData"

export function KycStatusBanner() {
  const router = useRouter()
  const { organizer, loading } = useOrganizerData()
  
  if (loading) return null

  // If no organizer profile, show setup message
  if (!organizer) {
    return (
      <Alert className="border-blue-200 bg-blue-50 mb-6">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Complete your organizer profile:</strong> Set up your profile to start creating and publishing events.{" "}
          <Button 
            variant="link" 
            className="p-0 h-auto text-blue-800 underline" 
            onClick={() => router.push("/organizer/kyc")}
          >
            Complete setup
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // If KYC verified, show success
  if (organizer.kyc_verified) {
    return (
      <Alert className="border-green-200 bg-green-50 mb-6">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>KYC Verified:</strong> Your account is verified and you can publish events.
        </AlertDescription>
      </Alert>
    )
  }

  // If KYC not verified, show informational message (not blocking)
  return (
    <Alert className="border-amber-200 bg-amber-50 mb-6">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <strong>KYC Pending:</strong> You can view data and create draft events. Complete KYC verification to publish events.{" "}
        <Button 
          variant="link" 
          className="p-0 h-auto text-amber-800 underline" 
          onClick={() => router.push("/organizer/kyc")}
        >
          Complete KYC verification
        </Button>
      </AlertDescription>
    </Alert>
  )
}

interface KycStatusIndicatorProps {
  isVerified: boolean
  size?: "sm" | "md"
  showText?: boolean
}

export function KycStatusIndicator({ 
  isVerified, 
  size = "sm", 
  showText = true 
}: KycStatusIndicatorProps) {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4"
  
  if (isVerified) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle2 className={iconSize} />
        {showText && <span className="text-xs">Verified</span>}
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-1 text-amber-600">
      <Clock className={iconSize} />
      {showText && <span className="text-xs">Pending KYC</span>}
    </div>
  )
}
