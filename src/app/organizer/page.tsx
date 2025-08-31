"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function OrganizerPage() {
  const router = useRouter()

  useEffect(() => {

    router.push('/organizer/dashboard')
  }, [router])

  return (
    <main className="p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold mb-2">Redirecting...</h1>
          <p className="text-muted-foreground">Taking you to your organizer dashboard</p>
        </div>
      </div>
    </main>
  )
}
