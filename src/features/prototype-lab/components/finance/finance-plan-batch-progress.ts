import { FINANCE_RELEASE_PLAN_BATCHES } from "./finance-release-plan-batches"
import type {
  FinancePlanBatchWorkItem,
  FinancePlanExecutionState,
  FinancePlanWorkState,
} from "./finance-release-plan-data"

export type FinancePlanBatchWorkCounts = {
  complete: number
  inProgress: number
  notStarted: number
  total: number
}

export type FinancePlanBatchProgress = {
  batchId: string
  executionState: FinancePlanExecutionState
  items: FinancePlanBatchWorkItem[]
  workItemCounts: FinancePlanBatchWorkCounts
}

export function countFinancePlanBatchWork(
  items: readonly FinancePlanBatchWorkItem[]
): FinancePlanBatchWorkCounts {
  return {
    complete: items.filter((item) => item.state === "complete").length,
    inProgress: items.filter((item) => item.state === "in_progress").length,
    notStarted: items.filter((item) => item.state === "not_started").length,
    total: items.length,
  }
}

export function buildFinancePlanBatchProgress(
  workItemStates: Partial<Record<string, FinancePlanWorkState>> = {},
  executionStates: Partial<Record<string, FinancePlanExecutionState>> = {}
): FinancePlanBatchProgress[] {
  return FINANCE_RELEASE_PLAN_BATCHES.map((batch) => {
    const items = (batch.workItems ?? []).map((item) => ({
      ...item,
      state: workItemStates[item.id] ?? item.state,
    }))
    const workItemCounts = countFinancePlanBatchWork(items)
    const requestedExecutionState =
      executionStates[batch.id] ?? batch.executionState ?? "not_started"
    const allWorkComplete =
      workItemCounts.total > 0 &&
      workItemCounts.complete === workItemCounts.total
    const hasStartedWork =
      workItemCounts.complete > 0 || workItemCounts.inProgress > 0
    const executionState: FinancePlanExecutionState =
      requestedExecutionState === "merged" && allWorkComplete
        ? "merged"
        : requestedExecutionState !== "not_started" || hasStartedWork
          ? "in_progress"
          : "not_started"

    return {
      batchId: batch.id,
      executionState,
      items,
      workItemCounts,
    }
  })
}

export const FINANCE_PLAN_BATCH_PROGRESS = buildFinancePlanBatchProgress()

export const FINANCE_PLAN_BATCH_WORK_COUNTS = countFinancePlanBatchWork(
  FINANCE_PLAN_BATCH_PROGRESS.flatMap((batch) => batch.items)
)
