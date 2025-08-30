"use client"

import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"

type TabKey = "dashboard" | "events" | "analytics"

export default function OrganizerPage() {
  const [tab, setTab] = useState<TabKey>("dashboard")

  return (
    <main className="min-h-dvh bg-neutral-950 text-slate-200">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/attendee" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-500" aria-hidden />
            <h1 className="text-pretty text-lg font-semibold tracking-tight">EventHive Organizer</h1>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Role Switch Toggle */}
            <Link
              href="/attendee"
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-200 transition-all duration-200 hover:border-cyan-400/40 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-white hover:shadow-lg hover:shadow-cyan-500/20"
            >
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Switch to Attendee
              <svg className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <nav className="flex items-center gap-2 rounded-full bg-white/5 p-1 backdrop-blur">
              <button
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm transition",
                  tab === "dashboard" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10",
                )}
                onClick={() => setTab("dashboard")}
                aria-pressed={tab === "dashboard"}
              >
                Dashboard
              </button>
              <button
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm transition",
                  tab === "events" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10",
                )}
                onClick={() => setTab("events")}
                aria-pressed={tab === "events"}
              >
                My Events
              </button>
              <button
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm transition",
                  tab === "analytics" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10",
                )}
                onClick={() => setTab("analytics")}
                aria-pressed={tab === "analytics"}
              >
                Analytics
              </button>
            </nav>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6">
        {tab === "dashboard" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-pretty text-xl font-semibold">Organizer Dashboard</h2>
              <p className="text-sm text-slate-400">Manage your events, track performance, and engage with attendees.</p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Events</p>
                    <p className="text-2xl font-bold text-white">12</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Attendees</p>
                    <p className="text-2xl font-bold text-white">2,847</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <svg className="h-6 w-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Revenue</p>
                    <p className="text-2xl font-bold text-white">₹4,28,350</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New event created: "Tech Conference 2025"</p>
                    <p className="text-xs text-slate-400">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">45 new registrations for "Music Festival"</p>
                    <p className="text-xs text-slate-400">5 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Monthly revenue report generated</p>
                    <p className="text-xs text-slate-400">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "events" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-pretty text-xl font-semibold">My Events</h2>
              <p className="text-sm text-slate-400">Manage and monitor your created events.</p>
            </div>
            
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-400">Your events will appear here once you create them.</p>
            </div>
          </div>
        )}

        {tab === "analytics" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-pretty text-xl font-semibold">Analytics</h2>
              <p className="text-sm text-slate-400">Track performance and insights for your events.</p>
            </div>
            
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
              </div>
              <p className="text-slate-400">Analytics data will be available once you have active events.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}