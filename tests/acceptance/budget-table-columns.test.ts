import { describe, expect, it } from "vitest"

import { fitBudgetTableColumnSizes } from "@/components/training/module-detail/budget-table-columns"
import {
  BUDGET_TABLE_MIN_WIDTH,
  COLUMN_MINS,
  COLUMN_ORDER,
} from "@/components/training/module-detail/budget-table-column-config"

describe("budget table column sizing", () => {
  it("derives the minimum table width from the column minimums", () => {
    const computedMinWidth = COLUMN_ORDER.reduce(
      (sum, columnId) => sum + COLUMN_MINS[columnId],
      0,
    )

    expect(BUDGET_TABLE_MIN_WIDTH).toBe(computedMinWidth)
  })

  it("uses the minimum column widths before a container has been measured", () => {
    const sizing = fitBudgetTableColumnSizes(0)

    expect(sizing).toEqual(
      Object.fromEntries(
        COLUMN_ORDER.map((columnId) => [columnId, COLUMN_MINS[columnId]]),
      ),
    )
  })

  it("keeps the minimum column widths when the container is narrower than the minimum table width", () => {
    const sizing = fitBudgetTableColumnSizes(BUDGET_TABLE_MIN_WIDTH - 24)

    expect(sizing).toEqual(
      Object.fromEntries(
        COLUMN_ORDER.map((columnId) => [columnId, COLUMN_MINS[columnId]]),
      ),
    )
  })
})
