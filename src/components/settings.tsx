"use client"

import { useState } from "react"
import type { EventItem } from "@/lib/organizer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function SettingsSection({
  event,
  onChange,
}: {
  event: EventItem
  onChange: (patch: Partial<EventItem>) => void
}) {
  const [title, setTitle] = useState(event.title)
  const [location, setLocation] = useState(event.location)
  const [visibility, setVisibility] = useState<EventItem["visibility"]>(event.visibility)

  function save() {
    onChange({ title, location, visibility })
    toast("Event settings updated")
  }
  return (
    <Card className="rounded-2xl bg-card/90 border-border/60">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Settings</CardTitle>
        <Button onClick={save} className="rounded-xl">
          Save
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground" htmlFor="title">
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl bg-muted/50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground" htmlFor="location">
            Location
          </label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-xl bg-muted/50"
          />
        </div>
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Visibility</span>
          <Select value={visibility} onValueChange={(v: EventItem["visibility"]) => setVisibility(v)}>
            <SelectTrigger className="rounded-xl bg-muted/50">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="unlisted">Unlisted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
