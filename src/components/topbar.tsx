"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bell, CalendarRange, ChevronDown, Search } from "lucide-react"
import { useState } from "react"
import { useKycGuardBanner } from "@/hooks/use-kyc-guard"
import { RoleSwitch } from "@/components/role-switch"
import { useKyc } from "@/hooks/use-kyc"

const DATE_PRESETS = ["Today", "7D", "30D", "Custom"] as const
type DatePreset = (typeof DATE_PRESETS)[number]

export function Topbar() {
  const [range, setRange] = useState<DatePreset>("7D")
  const Banner = useKycGuardBanner()
  const { verified } = useKyc()

  return (
    <header className="fixed top-0 left-0 right-0 md:left-auto md:right-auto border-b border-border/60 bg-secondary/80 backdrop-blur supports-[backdrop-filter]:bg-secondary/60 z-30">
      <div className="mx-auto max-w-[1400px] px-3 md:px-6 h-14 md:h-16 flex items-center gap-2">
        {/* Global Search */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            placeholder="Search events, orders, users"
            className="pl-9 rounded-xl bg-muted/50"
            aria-label="Global search"
          />
        </div>

        {/* Date Range Presets */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-xl bg-transparent">
              <CalendarRange className="h-4 w-4 mr-2" />
              {range}
              <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Date Range</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DATE_PRESETS.map((r) => (
              <DropdownMenuItem key={r} onClick={() => setRange(r)} aria-checked={range === r}>
                {r}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="rounded-xl" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>

        {/* Role Switcher */}
        <RoleSwitch />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="rounded-xl px-2" aria-haspopup="menu">
              <Avatar className="h-7 w-7">
                <AvatarFallback>AO</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline ml-2 text-sm">Acme Org</span>
              <Badge className="hidden md:inline ml-2" variant="secondary">
                {verified ? "Verified" : "KYC Pending"}
              </Badge>
              <ChevronDown className="hidden md:inline h-4 w-4 ml-2 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Organizer</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="font-mono text-xs">ID: org_1234</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/organizer/settings">Profile</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/organizer/kyc">KYC</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/organizer/settings">Billing & Payouts</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* KYC banner (blocking CTA if incomplete) */}
      <Banner />
    </header>
  )
}
