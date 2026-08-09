import {
  buildFinancePlanNodeEvidence,
  normalizeFinancePlanSearchValue,
  type FinancePrdCoverageNodeEvidence,
} from "./finance-plan-prd-index"
import { FINANCE_PLAN_DIAGRAM_TRACEABILITY } from "./finance-plan-diagram-traceability"
import { getFinancePlanningView } from "./finance-plan-views"

export type FinancePlanDiagramIndexEntry = {
  evidence: readonly FinancePrdCoverageNodeEvidence[]
  graphEdgeCount: number
  graphSourceStepCount: number
  label: string
  searchValue: string
  sourceConnectionCount: number
  sourceKind: "entity relationship" | "flowchart" | "sequence"
  sourceSection: string
  viewId: FinancePrdCoverageNodeEvidence["viewId"]
}

export const FINANCE_PLAN_DIAGRAM_INDEX: readonly FinancePlanDiagramIndexEntry[] =
  FINANCE_PLAN_DIAGRAM_TRACEABILITY.map((entry) => {
    const view = getFinancePlanningView(entry.viewId)
    const edges = view.buildEdges()
    const evidence = buildFinancePlanNodeEvidence([
      {
        nodeIds: view.buildNodes().map((node) => node.id),
        viewId: entry.viewId,
      },
    ])
    const graphSourceStepCount = edges.reduce(
      (count, edge) =>
        count +
        ((edge.data as { sourceStepCount?: number } | undefined)
          ?.sourceStepCount ?? 1),
      0
    )

    return {
      evidence,
      graphEdgeCount: edges.length,
      graphSourceStepCount,
      label: entry.label,
      searchValue: normalizeFinancePlanSearchValue(
        [
          entry.label,
          entry.sourceSection,
          entry.sourceKind,
          view.label,
          view.title,
          view.summary,
          ...edges.map((edge) => edge.label ?? ""),
          ...evidence.flatMap((item) => [item.nodeTitle, item.searchValue]),
        ].join(" ")
      ),
      sourceConnectionCount: entry.sourceConnectionCount,
      sourceKind: entry.sourceKind,
      sourceSection: entry.sourceSection,
      viewId: entry.viewId,
    }
  })

export const FINANCE_PLAN_DIAGRAM_INDEX_COUNT =
  FINANCE_PLAN_DIAGRAM_INDEX.length

export function searchFinancePlanDiagrams(query: string) {
  const normalizedQuery = normalizeFinancePlanSearchValue(query)
  if (!normalizedQuery) return FINANCE_PLAN_DIAGRAM_INDEX

  const tokens = normalizedQuery.split(" ")
  return FINANCE_PLAN_DIAGRAM_INDEX.filter((entry) =>
    tokens.every((token) => entry.searchValue.includes(token))
  )
}
