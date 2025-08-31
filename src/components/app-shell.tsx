"use client"

import { type PropsWithChildren, useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"
import { cn } from "@/lib/utils"

export function AppShell({ children }: PropsWithChildren) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem("sidebar:collapsed")
    if (saved) setCollapsed(saved === "1")
  }, [])

  function toggle() {
    setCollapsed((p) => {
      const next = !p
      try {
        window.localStorage.setItem("sidebar:collapsed", next ? "1" : "0")
      } catch {}
      return next
    })
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="flex">
        <Sidebar collapsed={collapsed} onToggle={toggle} />
        <div className={cn("flex-1 min-w-0", collapsed ? "md:ml-[72px]" : "md:ml-64")}>
          <Topbar />
          {/* account for fixed topbar */}
          <div className="pt-14 md:pt-16">{children}</div>
        </div>
      </div>
    </div>
  )
}
