import {
  buildFinancePlanNodeEvidence,
  normalizeFinancePlanSearchValue,
  type FinancePrdCoverageNodeEvidence,
} from "./finance-plan-prd-index"
import { FINANCE_PLAN_OBJECTIVE_TRACEABILITY } from "./finance-plan-objective-traceability"

export type FinancePlanObjectiveIndexEntry = {
  evidence: readonly FinancePrdCoverageNodeEvidence[]
  outcome: string
  plannedEvidence: string
  searchValue: string
}

export const FINANCE_PLAN_OBJECTIVE_INDEX: readonly FinancePlanObjectiveIndexEntry[] =
  FINANCE_PLAN_OBJECTIVE_TRACEABILITY.map((entry) => {
    const evidence = buildFinancePlanNodeEvidence(entry.evidence)

    return {
      evidence,
      outcome: entry.outcome,
      plannedEvidence: entry.plannedEvidence,
      searchValue: normalizeFinancePlanSearchValue(
        [
          entry.outcome,
          entry.plannedEvidence,
          ...evidence.flatMap((item) => [
            item.viewLabel,
            item.nodeTitle,
            item.searchValue,
          ]),
        ].join(" ")
      ),
    }
  })

export const FINANCE_PLAN_OBJECTIVE_INDEX_COUNT =
  FINANCE_PLAN_OBJECTIVE_INDEX.length

export const FINANCE_PLAN_OBJECTIVE_NODE_REFERENCE_COUNT =
  FINANCE_PLAN_OBJECTIVE_INDEX.reduce(
    (count, entry) => count + entry.evidence.length,
    0
  )

export function searchFinancePlanObjectives(query: string) {
  const normalizedQuery = normalizeFinancePlanSearchValue(query)
  if (!normalizedQuery) return FINANCE_PLAN_OBJECTIVE_INDEX

  const tokens = normalizedQuery.split(" ")
  return FINANCE_PLAN_OBJECTIVE_INDEX.filter((entry) =>
    tokens.every((token) => entry.searchValue.includes(token))
  )
}
