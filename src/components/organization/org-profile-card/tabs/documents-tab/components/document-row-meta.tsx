"use client"

import ArrowDown from "lucide-react/dist/esm/icons/arrow-down"
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up"
import ArrowUpDown from "lucide-react/dist/esm/icons/arrow-up-down"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { STATUS_META } from "../constants"
import type { DocumentStatus, SortColumn, SortDirection } from "../types"

type StatusBadgeProps = {
  status: DocumentStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        meta.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClassName)} aria-hidden />
      {meta.label}
    </span>
  )
}

type CategoryBadgesProps = {
  categories: string[]
}

export function CategoryBadges({ categories }: CategoryBadgesProps) {
  const visible = categories.slice(0, 2)
  const hiddenCount = Math.max(0, categories.length - visible.length)
  if (visible.length === 0) {
    return <Badge variant="outline">Uncategorized</Badge>
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((category) => (
        <Badge key={category} variant="outline">
          {category}
        </Badge>
      ))}
      {hiddenCount > 0 ? <Badge variant="outline">+{hiddenCount}</Badge> : null}
    </div>
  )
}

type SortIndicatorProps = {
  column: SortColumn
  activeColumn: SortColumn
  direction: SortDirection
}

export function SortIndicator({
  column,
  activeColumn,
  direction,
}: SortIndicatorProps) {
  if (activeColumn !== column) {
    return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
  }
  return direction === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-foreground" aria-hidden />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-foreground" aria-hidden />
  )
}
