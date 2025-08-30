export type TicketTier = {
  id: string
  name: string // Basic/Standard/VIP
  price: number // in INR
  quantity: number
  perUserLimit?: number
  sold: number
}

export type Coupon = {
  id: string
  code: string
  type: "flat" | "percent"
  value: number // ₹ or %
  startsAt: string
  endsAt: string
  maxUses?: number
  used: number
  active: boolean
  eventId?: string // optional scope
}

export type EventItem = {
  id: string
  title: string
  category: string
  startAt: string
  endAt: string
  location: string
  visibility: "public" | "private"
  posterUrl?: string
  logoUrl?: string
  tickets: TicketTier[]
  status: "draft" | "published" | "completed" | "cancelled"
  revenue: number
  ticketsLeft: number
  sold: number
}

export type Booking = {
  id: string
  eventId: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  qty: number
  amount: number // INR
  paymentStatus: "paid" | "refunded" | "failed" | "pending"
  checkinStatus: "not_checked_in" | "checked_in"
  createdAt: string
}
