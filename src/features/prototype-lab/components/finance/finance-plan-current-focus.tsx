import TargetIcon from "lucide-react/dist/esm/icons/target"
import type { HTMLAttributes } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import {
  FINANCE_PLAN_BATCH_PROGRESS,
  FINANCE_PLAN_BATCH_WORK_COUNTS,
} from "./finance-plan-batch-progress"
import { FINANCE_RELEASE_PLAN_BATCHES } from "./finance-release-plan-batches"

const activeBatch =
  FINANCE_PLAN_BATCH_PROGRESS.find(
    (batch) =>
      batch.executionState === "in_progress" &&
      batch.workItemCounts.complete < batch.workItemCounts.total
  ) ??
  FINANCE_PLAN_BATCH_PROGRESS.find((batch) => batch.executionState !== "merged")
const activeBatchDefinition = FINANCE_RELEASE_PLAN_BATCHES.find(
  (batch) => batch.id === activeBatch?.batchId
)
const nextWorkItem = activeBatch?.items.find(
  (item) => item.state !== "complete"
)

export const FINANCE_PLAN_CURRENT_FOCUS = {
  batchId: activeBatch?.batchId ?? FINANCE_RELEASE_PLAN_BATCHES[0].id,
  batchLabel: activeBatchDefinition
    ? `Batch ${activeBatchDefinition.sequence}: ${activeBatchDefinition.title}`
    : "Release roadmap",
  complete: FINANCE_PLAN_BATCH_WORK_COUNTS.complete,
  nextStep: nextWorkItem?.title ?? "Review the next proof gate",
  remaining:
    FINANCE_PLAN_BATCH_WORK_COUNTS.total -
    FINANCE_PLAN_BATCH_WORK_COUNTS.complete,
  total: FINANCE_PLAN_BATCH_WORK_COUNTS.total,
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

export function FinancePlanCurrentFocusPill({
  onOpenBatch,
}: {
  onOpenBatch: (batchId: string) => void
}) {
  return (
    <Button
      className="bg-card pointer-events-auto h-11 max-w-80 shrink-0 justify-start rounded-full px-3 shadow-sm"
      onClick={() => onOpenBatch(FINANCE_PLAN_CURRENT_FOCUS.batchId)}
      title={`Next: ${FINANCE_PLAN_CURRENT_FOCUS.nextStep}`}
      type="button"
      variant="outline"
    >
      <TargetIcon aria-hidden="true" className="size-4 shrink-0" />
      <span className="min-w-0 truncate text-xs">
        {FINANCE_PLAN_CURRENT_FOCUS.batchLabel}
      </span>
      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
        {FINANCE_PLAN_CURRENT_FOCUS.complete}/{FINANCE_PLAN_CURRENT_FOCUS.total}
      </span>
    </Button>
  )
}
