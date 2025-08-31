export function formatCurrencyINR(amount: number, opts?: Intl.NumberFormatOptions) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
      ...opts,
    }).format(amount)
  } catch {
    return `₹${Math.round(amount).toLocaleString("en-IN")}`
  }
}

export function formatDateRangeISO(startISO: string, endISO?: string) {
  const start = new Date(startISO)
  const end = endISO ? new Date(endISO) : undefined
  const sameDay = end && start.toDateString() === end.toDateString()
  const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" })
  if (!end) return `${dateFmt.format(start)} • ${timeFmt.format(start)}`
  if (sameDay) return `${dateFmt.format(start)} • ${timeFmt.format(start)}–${timeFmt.format(end)}`
  return `${dateFmt.format(start)} → ${dateFmt.format(end)}`
}

export function formatDateTimeISO(iso: string) {
  const d = new Date(iso)
  const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" })
  return `${dateFmt.format(d)} • ${timeFmt.format(d)}`
}
