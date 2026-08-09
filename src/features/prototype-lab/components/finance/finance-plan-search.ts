import type { FinancePlanningViewId } from "./finance-plan-diagram-data"
import { FINANCE_PLANNING_VIEWS } from "./finance-plan-views"

export type FinancePlanSearchEntry = {
  eyebrow: string
  nodeId: string
  searchValue: string
  statusLabel: string
  summary: string
  title: string
  viewId: FinancePlanningViewId
  viewLabel: string
}

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/\s+/gu, " ").trim()
}

export const FINANCE_PLAN_SEARCH_ENTRIES: readonly FinancePlanSearchEntry[] =
  FINANCE_PLANNING_VIEWS.flatMap((view) =>
    view
      .buildNodes()
      .filter((node) => node.data.kind !== "lane")
      .map((node) => {
        const searchValue = normalizeSearchValue(
          [
            view.label,
            node.data.eyebrow,
            node.data.title,
            node.data.summary,
            node.data.statusLabel,
            ...(node.data.dependencies ?? []),
            ...(node.data.decisionItems ?? []).map((item) => item.title),
            ...(node.data.workItems ?? []).map((item) => item.title),
            ...node.data.sections.flatMap((section) => [
              section.label,
              ...section.items,
            ]),
          ].join(" ")
        )

        return {
          eyebrow: node.data.eyebrow,
          nodeId: node.id,
          searchValue,
          statusLabel: node.data.statusLabel,
          summary: node.data.summary,
          title: node.data.title,
          viewId: view.id,
          viewLabel: view.label,
        }
      })
  )

export const FINANCE_PLAN_SEARCH_ENTRY_COUNT =
  FINANCE_PLAN_SEARCH_ENTRIES.length

const FINANCE_PLAN_START_ENTRIES = FINANCE_PLANNING_VIEWS.flatMap((view) => {
  const startEntry = FINANCE_PLAN_SEARCH_ENTRIES.find(
    (entry) =>
      entry.viewId === view.id &&
      (view.initialNodeIds as readonly string[]).includes(entry.nodeId)
  )
  return startEntry ? [startEntry] : []
})

function getSearchRank(entry: FinancePlanSearchEntry, query: string) {
  const title = normalizeSearchValue(entry.title)
  const eyebrow = normalizeSearchValue(entry.eyebrow)

  if (title === query) return 0
  if (title.startsWith(query)) return 1
  if (title.includes(query)) return 2
  if (eyebrow.includes(query)) return 3
  return 4
}

export function searchFinancePlanNodes(query: string, limit = 12) {
  const normalizedQuery = normalizeSearchValue(query)
  if (!normalizedQuery) return FINANCE_PLAN_START_ENTRIES.slice(0, limit)

  const tokens = normalizedQuery.split(" ")

  return FINANCE_PLAN_SEARCH_ENTRIES.filter((entry) =>
    tokens.every((token) => entry.searchValue.includes(token))
  )
    .sort((left, right) => {
      const rankDifference =
        getSearchRank(left, normalizedQuery) -
        getSearchRank(right, normalizedQuery)
      if (rankDifference) return rankDifference

      const viewDifference = left.viewLabel.localeCompare(right.viewLabel)
      return viewDifference || left.title.localeCompare(right.title)
    })
    .slice(0, limit)
}
