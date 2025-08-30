"use client"

import React from "react"

import { useMemo, useState } from "react"
import { notFound, useRouter } from "next/navigation"
import { events } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useBookings } from "@/components/use-bookings-store"

type Tier = "Basic" | "Standard" | "VIP"

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [tier, setTier] = useState<Tier>("Standard")
  const [count, setCount] = useState(1)
  const [attendees, setAttendees] = useState(
    Array.from({ length: count }, (_, i) => ({ index: i, name: "", email: "", phone: "", dob: "" })),
  )
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success">("idle")

  const event = events.find((e) => e.id === id)
  if (!event) return notFound()

  const router = useRouter()
  const { addBooking } = useBookings()

  const selectedPrice = useMemo(() => {
    return event.tickets.find((t) => t.tier === tier)?.price ?? 0
  }, [event, tier])
  const totalPrice = selectedPrice * count

  function applyCount(newCount: number) {
    const n = Math.max(1, Math.min(6, newCount))
    setCount(n)
    setAttendees((prev) => {
      const base = [...prev]
      if (n > base.length) {
        for (let i = base.length; i < n; i++) base.push({ index: i, name: "", email: "", phone: "", dob: "" })
      } else {
        base.length = n
      }
      return base
    })
  }

  async function mockPay() {
    setPaymentStatus("processing")
    await new Promise((r) => setTimeout(r, 1400))
    setPaymentStatus("success")
    addBooking({
      event: event!,
      tickets: attendees.map((a) => ({ index: a.index, tier })),
      attendees: attendees.map((a) => ({ name: a.name, email: a.email, phone: a.phone, dob: a.dob })),
      amount: totalPrice,
      payment: { provider: "Simulated (Razorpay/Stripe/UPI)", status: "paid" },
    })
    setTimeout(() => {
      router.push("/")
    }, 800)
  }

  return (
    <main className="min-h-dvh bg-neutral-950 text-slate-200">
      <header className="border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <button onClick={() => router.back()} className="text-sm text-slate-300 hover:text-white">
            ← Back
          </button>
          <div className="text-sm text-slate-300">{event.title}</div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-6">
        <Stepper step={step} />

        {step === 1 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <h2 className="mb-3 text-sm font-semibold">Select tickets</h2>
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              {(["Basic", "Standard", "VIP"] as Tier[]).map((t) => {
                const conf = event.tickets.find((x) => x.tier === t)!
                return (
                  <button
                    key={t}
                    className={cn(
                      "rounded-xl border p-3 text-left transition",
                      tier === t
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-white/10 bg-neutral-900 hover:bg-neutral-800",
                    )}
                    onClick={() => setTier(t)}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium">{t}</span>
                      <span className="text-xs text-slate-400">{conf.stock} left</span>
                    </div>
                    <div className="text-slate-300">${conf.price}</div>
                  </button>
                )
              })}
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold">Number of tickets</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20"
                  onClick={() => applyCount(count - 1)}
                >
                  -
                </Button>
                <span className="w-10 text-center text-lg font-semibold">{count}</span>
                <Button
                  className="bg-cyan-500 text-neutral-950 hover:bg-cyan-400"
                  onClick={() => applyCount(count + 1)}
                >
                  +
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-400">Max 6 per booking</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">
                Total: <span className="font-semibold text-white">${totalPrice}</span>
              </div>
              <Button className="bg-sky-500 text-neutral-950 hover:bg-sky-400" onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <h2 className="mb-3 text-sm font-semibold">Attendee information</h2>
            <div className="space-y-4">
              {attendees.map((a, i) => (
                <div key={a.index} className="rounded-lg border border-white/10 bg-neutral-900 p-3">
                  <div className="mb-2 text-xs text-slate-400">
                    Ticket {i + 1} • {tier}
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Input
                      label="Full name"
                      value={a.name}
                      onChange={(v) => updateAttendee(setAttendees, i, { name: v })}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={a.email}
                      onChange={(v) => updateAttendee(setAttendees, i, { email: v })}
                    />
                    <Input
                      label="Phone"
                      value={a.phone}
                      onChange={(v) => updateAttendee(setAttendees, i, { phone: v })}
                    />
                    <Input
                      label="Date of birth"
                      type="date"
                      value={a.dob}
                      onChange={(v) => updateAttendee(setAttendees, i, { dob: v })}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="secondary"
                className="bg-white/10 text-slate-200 hover:bg-white/20"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button className="bg-sky-500 text-neutral-950 hover:bg-sky-400" onClick={() => setStep(3)}>
                Proceed to Payment
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <h2 className="mb-3 text-sm font-semibold">Payment</h2>
            <div className="mb-3 text-sm text-slate-300">
              Provider: Razorpay / Stripe / UPI / Cards / Wallets (placeholder)
            </div>
            <div className="mb-4 rounded-lg border border-white/10 bg-neutral-900 p-3">
              <p className="text-sm">Amount payable</p>
              <p className="text-2xl font-semibold text-white">${totalPrice}</p>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                className="bg-white/10 text-slate-200 hover:bg-white/20"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button
                className="bg-cyan-500 text-neutral-950 hover:bg-cyan-400"
                onClick={mockPay}
                disabled={paymentStatus !== "idle"}
              >
                {paymentStatus === "processing" ? "Processing..." : "Pay now"}
              </Button>
            </div>

            {paymentStatus === "success" && (
              <div className="mt-4 rounded-lg border border-white/10 bg-cyan-500/10 p-3 text-sm text-cyan-200">
                Payment successful. Generating QR codes and emailing PDF tickets... Redirecting to Dashboard.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const items = ["Tickets", "Attendees", "Payment"]
  return (
    <div className="mb-4 flex items-center gap-2">
      {items.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3
        const active = step === n
        const complete = step > n
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "h-8 w-8 rounded-full text-center text-sm leading-8",
                complete
                  ? "bg-cyan-500 text-neutral-950"
                  : active
                    ? "bg-white/20 text-white"
                    : "bg-white/10 text-slate-300",
              )}
            >
              {n}
            </div>
            <span className={cn("hidden text-xs md:inline", active ? "text-white" : "text-slate-400")}>{label}</span>
            {i < items.length - 1 && <div className="h-px w-8 bg-white/10" />}
          </div>
        )
      })}
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-500"
        placeholder={label}
      />
    </label>
  )
}

function updateAttendee(
  set: React.Dispatch<
    React.SetStateAction<{ index: number; name: string; email: string; phone: string; dob: string }[]>
  >,
  i: number,
  patch: Partial<{ name: string; email: string; phone: string; dob: string }>,
) {
  set((prev) => {
    const next = [...prev]
    next[i] = { ...next[i], ...patch }
    return next
  })
}
