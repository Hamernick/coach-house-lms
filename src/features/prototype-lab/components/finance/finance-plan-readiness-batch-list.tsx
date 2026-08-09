import CircleCheckBigIcon from "lucide-react/dist/esm/icons/circle-check-big"
import CircleIcon from "lucide-react/dist/esm/icons/circle"
import Clock3Icon from "lucide-react/dist/esm/icons/clock-3"
import GitMergeIcon from "lucide-react/dist/esm/icons/git-merge"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { FinancePlanBatchReadiness } from "./finance-plan-readiness"
import type { FinancePlanWorkState } from "./finance-release-plan-data"
import {
  FinancePlanResponseTargetButton,
  type FinancePlanResponseTarget,
} from "./finance-plan-response-target-button"
import { getFinancePlanStatusBadgeClassName } from "./finance-plan-status"

function getReadinessLabel(batch: FinancePlanBatchReadiness) {
  if (
    batch.workItemCounts.total > 0 &&
    batch.workItemCounts.complete === batch.workItemCounts.total
  ) {
    return "Implementation complete"
  }

  switch (batch.readinessState) {
    case "merged":
      return "Merged"
    case "in_progress":
      return "In progress"
    case "ready":
      return "Ready"
    default:
      return "Blocked"
  }
}

function getWorkStateLabel(state: FinancePlanWorkState) {
  switch (state) {
    case "complete":
      return "Complete"
    case "in_progress":
      return "In progress"
    default:
      return "Not started"
  }
}

function getWorkStateIcon(state: FinancePlanWorkState) {
  switch (state) {
    case "complete":
      return CircleCheckBigIcon
    case "in_progress":
      return Clock3Icon
    default:
      return CircleIcon
  }
}

function getReadinessBadgeClassName(batch: FinancePlanBatchReadiness) {
  const implementationComplete =
    batch.workItemCounts.total > 0 &&
    batch.workItemCounts.complete === batch.workItemCounts.total
  return getFinancePlanStatusBadgeClassName(
    batch.readinessState === "merged" || implementationComplete
      ? "complete"
      : "attention"
  )
}

function getWorkStateClassName(state: FinancePlanWorkState) {
  switch (state) {
    case "complete":
      return "text-emerald-700 dark:text-emerald-300"
    case "in_progress":
      return "text-amber-700 dark:text-amber-300"
    default:
      return "text-blue-700 dark:text-blue-300"
  }
}

export function FinancePlanReadinessBatchList({
  batches,
  onSelect,
  onSelectResponseTarget,
  responseTargetId,
}: {
  batches: readonly FinancePlanBatchReadiness[]
  onSelect: (batch: FinancePlanBatchReadiness) => void
  onSelectResponseTarget: (target: FinancePlanResponseTarget) => void
  responseTargetId: string | null
}) {
  return (
    <ol className="space-y-2 p-2 sm:p-3">
      {batches.map((batch) => (
        <li key={batch.batchId}>
          <div className="border-border/60 rounded-xl border">
            <Button
              className="h-auto min-h-16 w-full items-start justify-start gap-3 rounded-xl px-3 py-3 text-left whitespace-normal"
              data-finance-readiness-batch-target={batch.batchId}
              onClick={() => onSelect(batch)}
              type="button"
              variant="ghost"
            >
              <span className="bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-lg">
                <GitMergeIcon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-xs tabular-nums">
                  Batch {batch.sequence}
                </span>
                <span className="mt-0.5 block font-medium text-balance">
                  {batch.title}
                </span>
                <span className="text-muted-foreground mt-1 line-clamp-2 block text-xs leading-5 text-pretty">
                  {batch.summary}
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  <Badge
                    className={cn(
                      "rounded-full",
                      getReadinessBadgeClassName(batch)
                    )}
                    variant="outline"
                  >
                    {getReadinessLabel(batch)}
                  </Badge>
                  <Badge
                    className="rounded-full tabular-nums"
                    variant="outline"
                  >
                    {batch.workItemCounts.complete}/{batch.workItemCounts.total}{" "}
                    complete
                  </Badge>
                  {batch.openInputIds.length ? (
                    <Badge
                      className="rounded-full tabular-nums"
                      variant="outline"
                    >
                      {batch.openInputIds.length} open input
                      {batch.openInputIds.length === 1 ? "" : "s"}
                    </Badge>
                  ) : null}
                  {batch.blockedByPredecessorBatch && batch.predecessorLabel ? (
                    <Badge
                      className="rounded-full tabular-nums"
                      variant="outline"
                    >
                      {batch.predecessorLabel}
                    </Badge>
                  ) : null}
                  {batch.blockedByPredecessorGate &&
                  batch.predecessorGateLabel ? (
                    <Badge
                      className="rounded-full tabular-nums"
                      variant="outline"
                    >
                      {batch.predecessorGateLabel}
                    </Badge>
                  ) : null}
                </span>
              </span>
            </Button>
            <ul
              className="border-border/70 mx-3 mb-3 space-y-2 border-t pt-3"
              data-finance-readiness-work-list={batch.batchId}
            >
              {batch.workItems.map((item) => {
                const WorkIcon = getWorkStateIcon(item.state)

                return (
                  <li
                    className="text-muted-foreground flex gap-2 text-xs leading-5 text-pretty"
                    data-finance-readiness-work-state={item.state}
                    key={item.id}
                  >
                    <WorkIcon
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        getWorkStateClassName(item.state)
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="sr-only">
                        {getWorkStateLabel(item.state)}.{" "}
                      </span>
                      {item.title}
                    </span>
                    <FinancePlanResponseTargetButton
                      onSelect={onSelectResponseTarget}
                      selected={responseTargetId === item.id}
                      target={item}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  )
}
