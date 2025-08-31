"use client"

import type React from "react"

import { useId, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type UploadInputProps = {
  label?: string
  accept?: string
  maxSizeMB?: number
  multiple?: boolean
  onFilesChange?: (files: File[]) => void
  helpText?: string
}

export function UploadInput({
  label = "Upload",
  accept = "image/*",
  maxSizeMB = 5,
  multiple,
  onFilesChange,
  helpText,
}: UploadInputProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const maxBytes = useMemo(() => maxSizeMB * 1024 * 1024, [maxSizeMB])

  function validate(fs: File[]) {
    const ok: File[] = []
    for (const f of fs) {
      if (f.size > maxBytes) continue
      if (accept && !f.type.match(accept.replace("*", ".*"))) continue
      ok.push(f)
    }
    return ok
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? [])
    const valid = validate(list)
    setFiles(valid)
    onFilesChange?.(valid)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          className="rounded-xl bg-muted/50"
          aria-describedby={`${id}-help`}
        />
        <Button variant="outline" className="rounded-xl bg-transparent" onClick={() => inputRef.current?.click()}>
          {label}
        </Button>
      </div>
      {helpText && (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {helpText} • Max {maxSizeMB}MB
        </p>
      )}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {files.map((f) => {
            const url = URL.createObjectURL(f)
            return (
              <div key={f.name} className="relative rounded-lg overflow-hidden border border-border/60">
                <Image
                  src={url || "/placeholder.svg"}
                  alt={f.name}
                  width={240}
                  height={120}
                  className="h-24 w-full object-cover"
                  onLoad={() => URL.revokeObjectURL(url)}
                />
                <div className="absolute bottom-1 left-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {(f.size / 1024 / 1024).toFixed(1)}MB
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
