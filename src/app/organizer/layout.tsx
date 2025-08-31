import type { ReactNode } from "react"
import { AppShell } from "@/components/app-shell"
import { KycGuard } from "@/hooks/use-kyc-guard"

export default function OrganizerLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <KycGuard>{children}</KycGuard>
    </AppShell>
  )
}
