"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { title } from "process"

type OrgSettings = {
  orgName: string
  supportEmail: string
  supportPhone: string
  timezone: string
  currency: "INR"
}

const KEY = "organizer_settings_v1"

export default function OrganizerSettingsPage() {
  const [form, setForm] = useState<OrgSettings>({
    orgName: "",
    supportEmail: "",
    supportPhone: "",
    timezone: "Asia/Kolkata",
    currency: "INR",
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setForm(JSON.parse(raw))
    } catch {}
  }, [])

  function save() {
    localStorage.setItem(KEY, JSON.stringify(form))
    toast("Settings saved", { description: "Organizer settings have been updated." })
  }

  function resetLocal() {
    localStorage.removeItem(KEY)
    toast("Local settings cleared")
  }

  return (
    <main className="p-4 md:p-6">
      <div className="max-w-[900px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Organizer Settings</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl bg-transparent" onClick={resetLocal}>
              Reset Local
            </Button>
            <Button className="rounded-xl" onClick={save}>
              Save
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl bg-card/90 border-border/60">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="org" className="text-sm text-muted-foreground">
                Organization Name
              </label>
              <Input
                id="org"
                className="rounded-xl bg-muted/50"
                value={form.orgName}
                onChange={(e) => setForm((f) => ({ ...f, orgName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-muted-foreground">
                Support Email
              </label>
              <Input
                id="email"
                type="email"
                className="rounded-xl bg-muted/50"
                value={form.supportEmail}
                onChange={(e) => setForm((f) => ({ ...f, supportEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm text-muted-foreground">
                Support Phone
              </label>
              <Input
                id="phone"
                className="rounded-xl bg-muted/50"
                value={form.supportPhone}
                onChange={(e) => setForm((f) => ({ ...f, supportPhone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Timezone</label>
              <Select value={form.timezone} onValueChange={(v) => setForm((f) => ({ ...f, timezone: v }))}>
                <SelectTrigger className="rounded-xl bg-muted/50">
                  <SelectValue placeholder="Timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Currency</label>
              <Select value={form.currency} onValueChange={(v: "INR") => setForm((f) => ({ ...f, currency: v }))}>
                <SelectTrigger className="rounded-xl bg-muted/50">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card/90 border-border/60">
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Clear locally stored organizer data for this demo.</div>
            <Button variant="destructive" className="rounded-xl" onClick={resetLocal}>
              Clear
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
