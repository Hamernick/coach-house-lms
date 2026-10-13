import { cn } from "@/lib/utils"

import type {
  AcceleratorPreviewModuleStatus,
  AcceleratorPreviewStepState,
} from "./types"

export function resolveModuleStatus(status: AcceleratorPreviewModuleStatus) {
  if (status === "completed") {
    return {
      label: "Completed",
      cta: "Review",
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    }
  }

  if (status === "in_progress") {
    return {
      label: "In progress",
      cta: "Continue",
      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    }
  }

  return {
    label: "Not started",
    cta: "Start",
    className: "border-border/60 bg-background/70 text-muted-foreground",
  }
}

export function stepCircleClass(state: AcceleratorPreviewStepState) {
  return cn(
    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums transition-colors",
    state === "complete"
      ? "border-transparent bg-sky-500 text-white"
      : state === "active"
        ? "border-sky-400 text-sky-600 dark:text-sky-200"
        : "border-border text-muted-foreground",
  )
}

export function stepTextClass(state: AcceleratorPreviewStepState) {
  return cn(
    "text-sm font-medium leading-tight tracking-tight",
    state === "complete" && "text-muted-foreground line-through decoration-2",
    state === "active" && "text-foreground",
    state === "pending" && "text-muted-foreground",
  )
}

export function buildCalendarGrid(year: number, monthIndex: number) {
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const grid: Array<number | null> = []

  for (let index = 0; index < firstWeekday; index += 1) {
    grid.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    grid.push(day)
  }

  while (grid.length % 7 !== 0) {
    grid.push(null)
  }

  return grid
}
