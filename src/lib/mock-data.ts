import type { Event } from "@/components/event-card"

export const events: Event[] = [
  {
    id: "ev-aurora-fest",
    poster: "/aurora-night-festival-poster.png",
    logo: "/aurora-logo.png",
    title: "Aurora Night Music Fest",
    description:
      "Immerse yourself in an electrifying night of music, lights, and immersive installations featuring world-class DJs and visual artists.",
    category: "Music",
    date: "Oct 12, 2025",
    time: "7:00 PM",
    location: "Downtown Arena, Seattle",
    status: "ongoing",
    tickets: [
      { tier: "Basic", price: 39, stock: 80 },
      { tier: "Standard", price: 69, stock: 120 },
      { tier: "VIP", price: 149, stock: 25 },
    ],
  },
  {
    id: "ev-dev-summit",
    poster: "/developer-summit-poster.png",
    logo: "/dev-summit-logo.png",
    title: "Global Developer Summit",
    description:
      "A two-day conference for modern web and AI developers. Talks, workshops, and hands-on labs from industry leaders.",
    category: "Conference",
    date: "Nov 4–5, 2025",
    time: "9:00 AM",
    location: "Moscone West, San Francisco",
    status: "upcoming",
    tickets: [
      { tier: "Basic", price: 99, stock: 200 },
      { tier: "Standard", price: 179, stock: 180 },
      { tier: "VIP", price: 399, stock: 40 },
    ],
  },
  {
    id: "ev-design-days",
    poster: "/design-days-poster.png",
    logo: "/design-days-logo.png",
    title: "Design Days Expo",
    description:
      "Explore the future of product design with live demos, portfolio reviews, and interactive exhibits from top studios.",
    category: "Design",
    date: "Aug 04, 2025",
    time: "10:00 AM",
    location: "Expo Center, Berlin",
    status: "past",
    tickets: [
      { tier: "Basic", price: 25, stock: 0 },
      { tier: "Standard", price: 49, stock: 0 },
      { tier: "VIP", price: 119, stock: 0 },
    ],
  },
]
