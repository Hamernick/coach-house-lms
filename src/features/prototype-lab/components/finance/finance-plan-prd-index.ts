import type { FinancePlanningViewId } from "./finance-plan-diagram-data"
import { FINANCE_PRD_SECTION_COVERAGE } from "./finance-plan-prd-coverage"
import { FINANCE_PLANNING_VIEWS } from "./finance-plan-views"

export type FinancePrdCoverageNodeEvidence = {
  nodeId: string
  nodeTitle: string
  searchValue: string
  viewId: FinancePlanningViewId
  viewLabel: string
}

export type FinancePrdCoverageIndexEntry = {
  evidence: readonly FinancePrdCoverageNodeEvidence[]
  searchValue: string
  section: string
}

export function normalizeFinancePlanSearchValue(value: string) {
  return value.toLowerCase().replace(/\s+/gu, " ").trim()
}

const FINANCE_VIEW_INDEX = new Map(
  FINANCE_PLANNING_VIEWS.map((view) => [
    view.id,
    {
      label: view.label,
      nodes: new Map(
        view.buildNodes().map(
          (node) =>
            [
              node.id,
              {
                searchValue: normalizeFinancePlanSearchValue(
                  [
                    node.data.eyebrow,
                    node.data.title,
                    node.data.summary,
                    node.data.statusLabel,
                    ...(node.data.dependencies ?? []),
                    ...node.data.sections.flatMap((section) => [
                      section.label,
                      ...section.items,
                    ]),
                  ].join(" ")
                ),
                title: node.data.title,
              },
            ] as const
        )
      ),
    },
  ])
)

export function buildFinancePlanNodeEvidence(
  evidenceReferences: readonly {
    nodeIds: readonly string[]
    viewId: FinancePlanningViewId
  }[]
): FinancePrdCoverageNodeEvidence[] {
  return evidenceReferences.flatMap((viewEvidence) => {
    const view = FINANCE_VIEW_INDEX.get(viewEvidence.viewId)
    if (!view) return []

    return viewEvidence.nodeIds.flatMap((nodeId) => {
      const node = view.nodes.get(nodeId)
      if (!node) return []

      return [
        {
          nodeId,
          nodeTitle: node.title,
          searchValue: node.searchValue,
          viewId: viewEvidence.viewId,
          viewLabel: view.label,
        },
      ]
    })
  })
}

export const FINANCE_PRD_COVERAGE_INDEX: readonly FinancePrdCoverageIndexEntry[] =
  FINANCE_PRD_SECTION_COVERAGE.map((entry) => {
    const evidence = buildFinancePlanNodeEvidence(entry.evidence)

    return {
      evidence,
      searchValue: normalizeFinancePlanSearchValue(
        [
          entry.section,
          ...evidence.flatMap((item) => [
            item.viewLabel,
            item.nodeTitle,
            item.searchValue,
          ]),
        ].join(" ")
      ),
      section: entry.section,
    }
  })

export const FINANCE_PRD_COVERAGE_INDEX_COUNT =
  FINANCE_PRD_COVERAGE_INDEX.length

export const FINANCE_PRD_COVERAGE_NODE_REFERENCE_COUNT =
  FINANCE_PRD_COVERAGE_INDEX.reduce(
    (count, entry) => count + entry.evidence.length,
    0
  )

export function searchFinancePrdCoverage(query: string) {
  const normalizedQuery = normalizeFinancePlanSearchValue(query)
  if (!normalizedQuery) return FINANCE_PRD_COVERAGE_INDEX

  const tokens = normalizedQuery.split(" ")
  return FINANCE_PRD_COVERAGE_INDEX.filter((entry) =>
    tokens.every((token) => entry.searchValue.includes(token))
  )
}
