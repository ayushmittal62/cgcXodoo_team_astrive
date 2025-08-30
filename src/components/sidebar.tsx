"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  CalendarDays,
  PlusSquare,
  TicketPercent,
  BarChart3,
  QrCode,
  Settings,
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
} from "lucide-react"
import { Fragment } from "react"
import { RoleSwitch } from "@/components/role-switch"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { href: "/organizer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/organizer/events", label: "Events", icon: CalendarDays },
  { href: "/organizer/events/new", label: "Create Event", icon: PlusSquare },
  { href: "/organizer/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/organizer/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/organizer/scanner", label: "QR Scanner", icon: QrCode },
  { href: "/organizer/settings", label: "Settings", icon: Settings },
]

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "fixed z-40 left-0 top-0 h-dvh border-r border-border/60 bg-secondary/80 backdrop-blur supports-[backdrop-filter]:bg-secondary/60",
          "w-[72px] md:w-64 transition-[width] duration-200 ease-out",
          collapsed && "md:w-[72px]",
        )}
        aria-label="Primary"
      >
        <div className="flex items-center justify-between h-14 px-2 md:px-4">
          <Link
            href="/organizer/dashboard"
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-2 py-1.5"
          >
            <div aria-hidden className="h-6 w-6 rounded-md bg-primary/20 border border-primary/40" />
            {!collapsed && <span className="font-medium">EventOS</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggle}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="px-1 md:px-2 mt-2 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href)
            const Icon = item.icon
            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group w-full inline-flex items-center gap-3 rounded-xl px-2 md:px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
            return (
              <Fragment key={item.href}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  link
                )}
              </Fragment>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 space-y-2 border-t border-border/50">
          {/* Embed RoleSwitch for quick Attendee/Organizer toggle */}
          <div className="flex items-center justify-center">
            <RoleSwitch />
          </div>

          <div className={cn("flex items-center justify-between", collapsed && "justify-center")}>
            {!collapsed && (
              <Link
                href="/support"
                className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-1 py-1"
              >
                <LifeBuoy className="h-4 w-4" />
                Support
              </Link>
            )}
            <Badge variant="secondary" className="rounded-md text-[10px]">
              v0.1
            </Badge>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
