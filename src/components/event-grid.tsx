"use client"

import { useMemo, useState } from "react"
import type { EventItem } from "@/lib/organizer"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/event-card"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Upload, XCircle, EyeOff, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

export function EventGrid({
  items,
  onPublish,
  onUnpublish,
  onCancel,
  onExport,
}: {
  items: EventItem[]
  onPublish: (ids: string[]) => void
  onUnpublish: (ids: string[]) => void
  onCancel: (ids: string[]) => void
  onExport: (ids: string[]) => void
}) {
  const [selected, setSelected] = useState<string[]>([])

  const allIds = useMemo(() => items.map((i) => i.id), [items])
  const allSelected = selected.length > 0 && selected.length === items.length

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)))
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? allIds : [])
  }

  function run(action: (ids: string[]) => void) {
    if (selected.length === 0) return
    action(selected)
    setSelected([])
  }

  return (
    <div className="space-y-3">
      {/* Bulk Bar */}
      <div
        className={cn(
          "rounded-2xl border border-border/60 bg-card/90 px-3 py-2 flex items-center justify-between gap-2",
          selected.length === 0 && "opacity-50",
        )}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(v) => toggleAll(Boolean(v))}
            aria-label="Select all"
            className="rounded-md"
          />
          <div className="text-sm">
            {selected.length} selected <span className="text-muted-foreground">/ {items.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl bg-transparent"
            disabled={selected.length === 0}
            onClick={() => run(onExport)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            className="rounded-xl bg-transparent"
            disabled={selected.length === 0}
            onClick={() => run(onPublish)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Publish
          </Button>
          <Button
            variant="outline"
            className="rounded-xl bg-transparent"
            disabled={selected.length === 0}
            onClick={() => run(onUnpublish)}
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Unpublish
          </Button>
          <ConfirmDialog
            title="Cancel selected events?"
            description="This will mark the events as cancelled. You can’t sell tickets after cancellation."
            onConfirm={() => run(onCancel)}
          >
            <Button variant="destructive" className="rounded-xl" disabled={selected.length === 0}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </ConfirmDialog>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((ev) => {
          const checked = selected.includes(ev.id)
          return (
            <div key={ev.id} className="relative">
              <div className="absolute left-2 top-2 z-10 rounded-md bg-background/80 border border-border/60 p-1">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => toggle(ev.id, Boolean(v))}
                  aria-label={`Select ${ev.title}`}
                />
              </div>
              <EventCard event={ev} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
