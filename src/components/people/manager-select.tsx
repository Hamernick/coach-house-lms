"use client"

import React, { memo, useMemo, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Option = { id: string; name: string; title?: string | null }

type Props = {
  value: string | null
  options: Option[]
  onChange: (val: string | null) => void
  className?: string
}

function ManagerSelectComponent({ value, options, onChange, className }: Props) {
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => `${o.name} ${o.title ?? ""}`.toLowerCase().includes(q))
  }, [options, query])

  return (
    <Select value={value ?? "none"} onValueChange={(v) => onChange(v === "none" ? null : v)}>
      <SelectTrigger size="sm" className={className ?? "w-48"}>
        <SelectValue placeholder="No manager" />
      </SelectTrigger>
      <SelectContent align="start" className="w-64">
        <div className="p-2">
          <Label htmlFor="mgr-search" className="sr-only">Search</Label>
          <Input
            id="mgr-search"
            autoFocus
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="h-8"
          />
        </div>
        <SelectItem value="none">No manager</SelectItem>
        {filtered.map((x) => (
          <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export const ManagerSelect = memo(ManagerSelectComponent)

