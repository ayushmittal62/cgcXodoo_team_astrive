"use client"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { Button } from "@/components/ui/button"
import { Calendar, Ticket, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

function Header() {
  return (
    <header className="flex items-center justify-between px-6 pt-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-amber-400 text-black font-bold">EH</span>
        <span className="font-semibold text-white">EventHive</span>
      </div>
      <nav aria-label="primary">
        <ul className="flex items-center gap-4 text-sm text-white/70">
          <li><a className="hover:text-white transition" href="#features">Features</a></li>
          <li><a className="hover:text-white transition" href="#get-started">Get Started</a></li>
        </ul>
      </nav>
    </header>
  )
}

function Hero() {
  const router = useRouter()
  return (
    <section className="relative flex flex-col items-center justify-center px-6 py-24 text-center md:py-32">
      <div className="mx-auto max-w-3xl">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1 text-xs text-white/80"
        >
          <span className="h-2 w-2 rounded-full bg-cyan-500" />
          Discover • Book • Organize
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 font-sans text-4xl font-bold tracking-tight text-white md:text-6xl"
        >
          EventHive
        </motion.h1>
        <p className="mt-3 text-lg text-white/70">Where Events Come Alive</p>

        <motion.div
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            size="lg"
            className="rounded-full bg-cyan-500 text-black hover:bg-cyan-400 transition"
            onClick={() => router.push("/sign-up")}
          >
            Get Started
          </Button>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:mx-auto md:max-w-2xl">
          {[
            { icon: <Ticket className="h-5 w-5 text-amber-400" />, title: "Seamless Tickets", desc: "Buy and store secure QR tickets in seconds." },
            { icon: <Calendar className="h-5 w-5 text-cyan-500" />, title: "Discover Events", desc: "Ongoing, upcoming, and past events in one place." },
            { icon: <BarChart3 className="h-5 w-5 text-amber-400" />, title: "Organizer Tools", desc: "Analytics, inventory, coupons, and QR check-in." }
          ].map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="rounded-xl border border-white/20 bg-white/10 backdrop-blur p-6 text-left"
            >
              <div className="flex items-center gap-2 text-white">
                {f.icon}
                <strong>{f.title}</strong>
              </div>
              <p className="mt-2 text-sm text-white/70">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-5xl grid grid-cols-1 gap-4 px-6 pb-20 md:grid-cols-3">
      {[
        { icon: <Ticket className="h-5 w-5 text-cyan-500" />, title: "Effortless Ticketing", body: "Multiple tiers (Basic, Standard, VIP), secure payments, and instant QR tickets." },
        { icon: <Calendar className="h-5 w-5 text-amber-400" />, title: "All Events in One Place", body: "Browse ongoing, upcoming, and past events with rich details." },
        { icon: <BarChart3 className="h-5 w-5 text-cyan-500" />, title: "Powerful for Organizers", body: "Create, publish, analyze revenue, manage guest lists, and scan entries." }
      ].map((f, i) => (
        <motion.div
          key={i}
          whileHover={{ scale: 1.02 }}
          className="rounded-xl border border-white/20 bg-white/10 backdrop-blur p-6"
        >
          <div className="flex items-center gap-3 text-white">{f.icon}<h3 className="font-semibold">{f.title}</h3></div>
          <p className="mt-2 text-sm text-white/70">{f.body}</p>
        </motion.div>
      ))}
    </section>
  )
}

function CTA() {
  return (
    <section id="get-started" className="relative mx-auto max-w-5xl px-6 pb-24">
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h3 className="text-xl md:text-2xl font-semibold text-white">Ready to bring your event to life?</h3>
          <p className="mt-1 text-white/70">Join EventHive and start organizing or discovering events today.</p>
        </div>
        <div className="flex gap-3">
          <Button className="rounded-full bg-cyan-500 text-black hover:bg-cyan-400">Get Started</Button>
          <Button variant="outline" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/20">Learn More</Button>
        </div>
      </motion.div>
    </section>
  )
}

export default function Page() {
  return (
    <AnimatedBackground variant="dark" animationSpeed={3} colors={[[255,255,255],[255,255,255]]} dotSize={6}>
      <main className="relative">
        <Header />
        <Hero />
        <Features />
        <CTA />
        <footer className="px-6 pb-10">
          <div className="mx-auto flex max-w-5xl flex-col md:flex-row items-center justify-between gap-3 border-t border-white/20 pt-6 text-sm text-white/50">
            <p>© {new Date().getFullYear()} Team Astrive. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </AnimatedBackground>
  )
}
