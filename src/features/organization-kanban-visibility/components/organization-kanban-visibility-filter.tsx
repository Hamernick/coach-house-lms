"use client"

import { Eye, EyeSlash } from "@phosphor-icons/react/dist/ssr"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ORGANIZATION_KANBAN_VISIBILITY_HIDDEN,
  ORGANIZATION_KANBAN_VISIBILITY_VISIBLE,
} from "../lib"
import type { OrganizationKanbanVisibilityMode } from "../types"

function Count({ value }: { value: number }) {
  return (
    <span className="text-muted-foreground ml-auto tabular-nums">{value}</span>
  )
}

export function OrganizationKanbanVisibilityFilter({
  hiddenCount,
  onValueChange,
  value,
  visibleCount,
}: {
  hiddenCount: number
  onValueChange: (value: OrganizationKanbanVisibilityMode) => void
  value: OrganizationKanbanVisibilityMode
  visibleCount: number
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="text-muted-foreground hidden text-xs font-medium sm:inline">
        Kanban
      </span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className="h-11 w-[10.5rem] md:h-9"
          aria-label="Choose organization Kanban visibility"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="w-60">
          <SelectItem
            value={ORGANIZATION_KANBAN_VISIBILITY_VISIBLE}
            className="min-h-11 *:[span]:last:flex-1"
          >
            <Eye className="size-4" aria-hidden />
            <span>My Kanban</span>
            <Count value={visibleCount} />
          </SelectItem>
          <SelectItem
            value={ORGANIZATION_KANBAN_VISIBILITY_HIDDEN}
            className="min-h-11 *:[span]:last:flex-1"
          >
            <EyeSlash className="size-4" aria-hidden />
            <span>Hidden</span>
            <Count value={hiddenCount} />
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
