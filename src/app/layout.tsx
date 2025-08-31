import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

import { AuthProvider } from "@/contexts/AuthContext"


export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (

    <html lang="en" className={`dark antialiased ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh bg-background text-foreground font-sans">
        <AuthProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </AuthProvider>

        <Analytics />
      </body>
    </html>
  )
}
