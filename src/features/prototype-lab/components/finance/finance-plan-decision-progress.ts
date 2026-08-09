import type {
  FinancePlanDecisionItem,
  FinancePlanDecisionItemState,
  FinancePlanInputState,
} from "./finance-release-plan-data"
import { FINANCE_RELEASE_PLAN_SUPPORT_NODES } from "./finance-release-plan-support"

export type FinancePlanDecisionItemCounts = {
  approved: number
  changesRequired: number
  pending: number
  total: number
}

export type FinancePlanDecisionProgress = {
  decisionState: FinancePlanDecisionItemState
  inputState: FinancePlanInputState
  itemCounts: FinancePlanDecisionItemCounts
  items: FinancePlanDecisionItem[]
  nodeId: string
}

export function countFinancePlanDecisionItems(
  items: readonly FinancePlanDecisionItem[]
): FinancePlanDecisionItemCounts {
  return {
    approved: items.filter((item) => item.state === "approved").length,
    changesRequired: items.filter((item) => item.state === "changes_required")
      .length,
    pending: items.filter((item) => item.state === "pending").length,
    total: items.length,
  }
}

export function buildFinancePlanDecisionProgress(
  itemStates: Partial<Record<string, FinancePlanDecisionItemState>> = {}
): FinancePlanDecisionProgress[] {
  return FINANCE_RELEASE_PLAN_SUPPORT_NODES.filter(
    (node) => node.kind === "decision"
  ).map((decision) => {
    const items = (decision.decisionItems ?? []).map((item) => ({
      ...item,
      state: itemStates[item.id] ?? item.state,
    }))
    const itemCounts = countFinancePlanDecisionItems(items)
    const inputState: FinancePlanInputState =
      itemCounts.total > 0 && itemCounts.approved === itemCounts.total
        ? "resolved"
        : "open"
    const decisionState: FinancePlanDecisionItemState =
      inputState === "resolved"
        ? "approved"
        : itemCounts.changesRequired > 0
          ? "changes_required"
          : "pending"

    return {
      decisionState,
      inputState,
      itemCounts,
      items,
      nodeId: decision.id,
    }
  })
}

export const FINANCE_PLAN_DECISION_PROGRESS = buildFinancePlanDecisionProgress()

export const FINANCE_PLAN_DECISION_ITEM_COUNTS = countFinancePlanDecisionItems(
  FINANCE_PLAN_DECISION_PROGRESS.flatMap((decision) => decision.items)
)
