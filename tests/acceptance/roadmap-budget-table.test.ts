import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import {
  BLANK_ROADMAP_BUDGET_ROW,
  getRoadmapBudgetRowTotal,
  hasMeaningfulRoadmapBudgetRows,
  normalizeRoadmapBudgetRows,
  ROADMAP_BUDGET_MAX_ROWS,
} from "@/lib/roadmap/budget"
import { resolveRoadmapSections, updateRoadmapSection } from "@/lib/roadmap"

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

describe("roadmap budget table", () => {
  it("stores structured budget rows with the Budget roadmap section", () => {
    const budgetRows = [
      {
        ...BLANK_ROADMAP_BUDGET_ROW,
        category: "Program staff",
        costType: "Variable",
        unit: "Person / Hour",
        units: "120",
        costPerUnit: "45",
        totalCost: "5400.00",
      },
    ]
    const { nextProfile, section } = updateRoadmapSection(null, "budget", {
      budgetRows,
    })
    const resolvedBudget = resolveRoadmapSections(nextProfile).find(
      (entry) => entry.id === "budget"
    )

    expect(section.budgetRows).toEqual(budgetRows)
    expect(resolvedBudget?.budgetRows).toEqual(budgetRows)
    expect(getRoadmapBudgetRowTotal(budgetRows[0])).toBe(5400)
  })

  it("normalizes malformed rows and caps stored profile data", () => {
    const rows = Array.from(
      { length: ROADMAP_BUDGET_MAX_ROWS + 5 },
      (_, index) => ({
        category: `Line ${index + 1}`,
        description: null,
        costType: "Fixed",
        unit: "Item",
        units: "1",
        costPerUnit: "20",
        totalCost: "20.00",
      })
    )
    const normalized = normalizeRoadmapBudgetRows(rows)

    expect(normalized).toHaveLength(ROADMAP_BUDGET_MAX_ROWS)
    expect(normalized[0]?.description).toBe("")
    expect(hasMeaningfulRoadmapBudgetRows(normalized)).toBe(true)
  })

  it("replaces only the Budget editor body with the shared TanStack table", () => {
    const shell = readSource(
      "src/components/roadmap/roadmap-editor/components/roadmap-editor-shell.tsx"
    )
    const uiState = readSource(
      "src/components/roadmap/roadmap-editor/ui-state.ts"
    )
    const budgetEditor = readSource(
      "src/components/roadmap/roadmap-budget-table-editor.tsx"
    )
    const action = readSource("src/actions/roadmap.ts")

    expect(uiState).toContain('activeSection?.id === "budget"')
    expect(shell).toContain("<RoadmapBudgetTableEditor")
    expect(shell).toContain("isCalendarSection || isBudgetSection")
    expect(budgetEditor).toContain(
      'from "@/components/training/module-detail/budget-table"'
    )
    expect(budgetEditor).toContain('layout={isMobile ? "stacked" : "grid"}')
    expect(budgetEditor).toContain("onRowsChange")
    expect(action).toContain("budgetRows?: BudgetTableRow[]")
    expect(action).toContain("budgetRows,")
  })

  it("supports a non-editable shared table without active controls", () => {
    const table = readSource(
      "src/components/training/module-detail/budget-table.tsx"
    )
    const columns = readSource(
      "src/components/training/module-detail/budget-table-columns.tsx"
    )
    const stacked = readSource(
      "src/components/training/module-detail/budget-table-stacked-rows.tsx"
    )

    expect(table).toContain("readOnly?: boolean")
    expect(columns).toContain("draggable={!readOnly}")
    expect(columns).toContain("disabled={readOnly}")
    expect(columns).toContain("readOnly={readOnly}")
    expect(stacked).toContain("disabled={readOnly}")
    expect(stacked).toContain("readOnly={readOnly}")
  })
})
