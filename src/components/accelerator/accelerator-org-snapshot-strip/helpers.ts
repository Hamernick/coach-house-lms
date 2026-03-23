import BadgeCheckIcon from "lucide-react/dist/esm/icons/badge-check"
import BookOpenIcon from "lucide-react/dist/esm/icons/book-open"
import DollarSignIcon from "lucide-react/dist/esm/icons/dollar-sign"
import RouteIcon from "lucide-react/dist/esm/icons/route"

import { type AcceleratorReadinessChecklistItem } from "@/components/accelerator/accelerator-org-snapshot-strip/types"

export const ORG_HEADER_SQUARES: Array<[number, number]> = [
  [4, 4],
  [5, 1],
  [8, 2],
  [5, 3],
  [5, 5],
  [10, 10],
  [12, 15],
  [15, 10],
  [10, 15],
  [15, 10],
]

export function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

const COMPACT_USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 0,
})

export function formatFundingGoal(cents: number) {
  if (!Number.isFinite(cents) || cents <= 0) return "Not set"
  return COMPACT_USD.format(cents / 100)
}

export function resolveReadinessChecklistVisual(item: AcceleratorReadinessChecklistItem) {
  const normalized = `${item.label} ${item.href}`.toLowerCase()

  if (normalized.includes("formation class")) {
    return {
      icon: BookOpenIcon,
      iconClass: "text-amber-700 dark:text-amber-300",
      iconWrapClass: "border-amber-300/70 bg-amber-100/75 dark:border-amber-500/40 dark:bg-amber-500/15",
    }
  }

  if (normalized.includes("roadmap")) {
    return {
      icon: RouteIcon,
      iconClass: "text-violet-700 dark:text-violet-300",
      iconWrapClass: "border-violet-300/70 bg-violet-100/75 dark:border-violet-500/40 dark:bg-violet-500/15",
    }
  }

  if (normalized.includes("funding goal") || normalized.includes("program")) {
    return {
      icon: DollarSignIcon,
      iconClass: "text-emerald-700 dark:text-emerald-300",
      iconWrapClass: "border-emerald-300/70 bg-emerald-100/75 dark:border-emerald-500/40 dark:bg-emerald-500/15",
    }
  }

  return {
    icon: BadgeCheckIcon,
    iconClass: "text-sky-700 dark:text-sky-300",
    iconWrapClass: "border-sky-300/70 bg-sky-100/75 dark:border-sky-500/40 dark:bg-sky-500/15",
  }
}
