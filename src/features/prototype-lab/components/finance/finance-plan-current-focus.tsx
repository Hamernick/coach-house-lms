import TargetIcon from "lucide-react/dist/esm/icons/target"
import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

import {
  FINANCE_PLAN_COMPLETION_PERCENTAGE,
  FINANCE_PLAN_CURRENT_WAVE,
  FINANCE_PLAN_NEXT_CRITERION,
  FINANCE_PLAN_WAVE_COUNTS,
} from "./finance-plan-wave-progress"

export const FINANCE_PLAN_CURRENT_FOCUS = {
  complete: FINANCE_PLAN_WAVE_COUNTS.complete,
  nextStep:
    FINANCE_PLAN_NEXT_CRITERION?.title ?? "Review the next production wave",
  percentage: FINANCE_PLAN_COMPLETION_PERCENTAGE,
  remaining: FINANCE_PLAN_WAVE_COUNTS.total - FINANCE_PLAN_WAVE_COUNTS.complete,
  total: FINANCE_PLAN_WAVE_COUNTS.total,
  waveId: FINANCE_PLAN_CURRENT_WAVE.id,
  waveLabel: `Wave ${FINANCE_PLAN_CURRENT_WAVE.sequence}: ${FINANCE_PLAN_CURRENT_WAVE.title}`,
} as const

const STATUS_LEGEND = [
  { className: "bg-emerald-500", label: "Complete" },
  { className: "bg-amber-500", label: "Needs info / in progress" },
  { className: "bg-blue-500", label: "Planned / reference" },
  { className: "bg-red-500", label: "Risk / guardrail" },
] as const

export function FinancePlanStatusLegend({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-label="Status colors"
      className={cn("flex flex-wrap gap-x-3 gap-y-1 text-xs", className)}
      {...props}
    >
      {STATUS_LEGEND.map((item) => (
        <span className="flex items-center gap-1.5" key={item.label}>
          <span
            aria-hidden="true"
            className={cn("size-2 rounded-full", item.className)}
          />
          {item.label}
        </span>
      ))}
    </div>
  )
}

export function FinancePlanCurrentFocusPill() {
  return (
    <div
      aria-label={`${FINANCE_PLAN_CURRENT_FOCUS.percentage}% complete. ${FINANCE_PLAN_CURRENT_FOCUS.waveLabel}`}
      className="border-border bg-card pointer-events-auto flex h-11 max-w-80 shrink-0 items-center gap-2 rounded-full border px-3 shadow-sm"
      title={`Next: ${FINANCE_PLAN_CURRENT_FOCUS.nextStep}`}
    >
      <TargetIcon aria-hidden="true" className="size-4 shrink-0" />
      <span className="min-w-0 truncate text-xs">
        {FINANCE_PLAN_CURRENT_FOCUS.waveLabel}
      </span>
      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
        {FINANCE_PLAN_CURRENT_FOCUS.percentage}%
      </span>
    </div>
  )
}
