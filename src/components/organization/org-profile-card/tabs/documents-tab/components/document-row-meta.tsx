"use client"

import type { ReactNode } from "react"
import ArrowDown from "lucide-react/dist/esm/icons/arrow-down"
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up"
import ArrowUpDown from "lucide-react/dist/esm/icons/arrow-up-down"

import { cn } from "@/lib/utils"
import { STATUS_META } from "../constants"
import type { DocumentStatus, SortColumn, SortDirection } from "../types"

const documentMetaPillClassName =
  "border-border bg-muted/40 text-muted-foreground inline-flex h-6 w-fit shrink-0 items-center rounded-full border px-2 text-xs font-medium whitespace-nowrap"

export function DocumentMetaPill({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cn(documentMetaPillClassName, className)}>{children}</span>
  )
}

type StatusBadgeProps = {
  status: DocumentStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn(
        "border-border bg-muted/40 text-muted-foreground inline-flex h-6 items-center gap-2 rounded-full border px-2 text-xs font-medium"
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dotClassName)}
        aria-hidden
      />
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
    return <DocumentMetaPill>Uncategorized</DocumentMetaPill>
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((category) => (
        <DocumentMetaPill key={category}>{category}</DocumentMetaPill>
      ))}
      {hiddenCount > 0 ? (
        <DocumentMetaPill>+{hiddenCount}</DocumentMetaPill>
      ) : null}
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
    return (
      <ArrowUpDown
        className="text-muted-foreground/70 h-3.5 w-3.5"
        aria-hidden
      />
    )
  }
  return direction === "asc" ? (
    <ArrowUp className="text-foreground h-3.5 w-3.5" aria-hidden />
  ) : (
    <ArrowDown className="text-foreground h-3.5 w-3.5" aria-hidden />
  )
}
