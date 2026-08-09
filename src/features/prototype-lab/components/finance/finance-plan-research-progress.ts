import {
  countFinancePlanEvidence,
  deriveFinancePlanResearchInputState,
  type FinancePlanEvidenceCounts,
} from "./finance-plan-evidence"
import type {
  FinancePlanEvidenceState,
  FinancePlanInputState,
  FinancePlanResearchItem,
} from "./finance-release-plan-data"
import { FINANCE_RELEASE_PLAN_RESEARCH } from "./finance-release-plan-research"

export type FinancePlanResearchProgress = {
  inputState: FinancePlanInputState
  items: FinancePlanResearchItem[]
  itemCounts: FinancePlanEvidenceCounts
  nodeId: string
}

export function buildFinancePlanResearchProgress(
  itemStates: Partial<Record<string, FinancePlanEvidenceState>> = {}
): FinancePlanResearchProgress[] {
  return FINANCE_RELEASE_PLAN_RESEARCH.map((research) => {
    const items = (research.researchItems ?? []).map((item) => ({
      ...item,
      state: itemStates[item.id] ?? item.state,
    }))

    return {
      inputState: deriveFinancePlanResearchInputState(items),
      items,
      itemCounts: countFinancePlanEvidence(items),
      nodeId: research.id,
    }
  })
}

export const FINANCE_PLAN_RESEARCH_PROGRESS = buildFinancePlanResearchProgress()

export const FINANCE_PLAN_RESEARCH_ITEM_COUNTS = countFinancePlanEvidence(
  FINANCE_PLAN_RESEARCH_PROGRESS.flatMap((research) => research.items)
)
