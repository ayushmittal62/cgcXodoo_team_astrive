"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Download } from "lucide-react"

type Column<T> = {
  key: keyof T
  label: string
  visible?: boolean
  render?: (value: any, row: T) => React.ReactNode
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  globalFilterKey,
  pageSize = 10,
  onExportCsv,
  onExportXlsx,
}: {
  data: T[]
  columns: Column<T>[]
  globalFilterKey?: keyof T
  pageSize?: number
  onExportCsv?: (rows: T[]) => void
  onExportXlsx?: (rows: T[]) => void
}) {
  const [filter, setFilter] = useState("")
  const [page, setPage] = useState(0)
  const [cols, setCols] = useState(columns)

  const filtered = useMemo(() => {
    if (!filter.trim() || !globalFilterKey) return data
    const q = filter.toLowerCase()
    return data.filter((row) =>
      String(row[globalFilterKey] ?? "")
        .toLowerCase()
        .includes(q),
    )
  }, [data, filter, globalFilterKey])

  const visibleCols = cols.filter((c) => c.visible !== false)

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const slice = filtered.slice(page * pageSize, page * pageSize + pageSize)

  function toggleCol(key: keyof T) {
    setCols((prev) => prev.map((c) => (c.key === key ? { ...c, visible: c.visible === false ? true : false } : c)))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search"
          value={filter}
          onChange={(e) => {
            setPage(0)
            setFilter(e.target.value)
          }}
          className="max-w-xs rounded-xl bg-muted/50"
          aria-label="Search table"
        />

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl bg-transparent">
                Columns
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {cols.map((c) => (
                <DropdownMenuCheckboxItem
                  key={String(c.key)}
                  checked={c.visible !== false}
                  onCheckedChange={() => toggleCol(c.key)}
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="rounded-xl bg-transparent"
            onClick={() => onExportCsv?.(filtered)}
            title="Export CSV"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            className="rounded-xl bg-transparent"
            onClick={() => onExportXlsx?.(filtered)}
            title="Export Excel"
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleCols.map((c) => (
                <TableHead key={String(c.key)} className="text-xs">
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.map((row, i) => (
              <TableRow key={i} className="hover:bg-muted/40">
                {visibleCols.map((c) => (
                  <TableCell key={String(c.key)}>
                    {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {slice.length === 0 && (
              <TableRow>
                <TableCell colSpan={visibleCols.length} className="text-center text-sm text-muted-foreground">
                  No results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          Page {page + 1} of {pages} • {filtered.length} rows
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl bg-transparent"
            disabled={page <= 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            className="rounded-xl bg-transparent"
            disabled={page + 1 >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
