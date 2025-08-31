"use client"

import { useRouter, usePathname } from "next/navigation"
import { useRole } from "@/hooks/use-role"
import { useKyc } from "@/hooks/use-kyc"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, User } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function RoleSwitch() {
  const router = useRouter()
  const pathname = usePathname()
  const { role, switchRole, ready } = useRole()
  const { verified } = useKyc()
  const [open, setOpen] = useState(false)

  if (!ready) return null

  const toAttendee = () => {
    switchRole("attendee")
    if (pathname?.startsWith("/organizer")) router.push("/")
  }

  const toOrganizer = () => {
    if (!verified) {
      setOpen(true)
      return
    }
    switchRole("organizer")
    if (!pathname?.startsWith("/organizer")) router.push("/organizer/dashboard")
  }

  return (
    <div className="flex items-center gap-1 md:gap-2">
      <Button
        variant={role === "attendee" ? "default" : "secondary"}
        size="sm"
        className="rounded-xl gap-2"
        onClick={toAttendee}
      >
        <User className="size-4" aria-hidden />
        <span className="hidden sm:inline">Attendee</span>
      </Button>
      <Button
        variant={role === "organizer" ? "default" : "secondary"}
        size="sm"
        className="rounded-xl gap-2"
        onClick={toOrganizer}
      >
        <ShieldCheck className="size-4" aria-hidden />
        <span className="hidden sm:inline">Organizer</span>
        {!verified && (
          <Badge variant="secondary" className="ml-1">
            KYC
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete KYC to continue</DialogTitle>
            <DialogDescription>Verify your identity and bank details to access organizer features.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOpen(false)
                switchRole("organizer")
                router.push("/organizer/kyc")
              }}
            >
              Start KYC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
