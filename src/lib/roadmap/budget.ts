import type { BudgetTableRow } from "@/lib/modules"

export const ROADMAP_BUDGET_MAX_ROWS = 100

export const BLANK_ROADMAP_BUDGET_ROW: BudgetTableRow = {
  category: "",
  description: "",
  costType: "",
  unit: "",
  units: "",
  costPerUnit: "",
  totalCost: "",
}

const ROADMAP_BUDGET_TEXT_LIMITS: Record<keyof BudgetTableRow, number> = {
  category: 160,
  description: 800,
  costType: 80,
  unit: 120,
  units: 40,
  costPerUnit: 40,
  totalCost: 40,
}

function normalizeBudgetValue(value: unknown, field: keyof BudgetTableRow) {
  return typeof value === "string"
    ? value.slice(0, ROADMAP_BUDGET_TEXT_LIMITS[field])
    : ""
}

export function normalizeRoadmapBudgetRows(value: unknown): BudgetTableRow[] {
  if (!Array.isArray(value)) return []

  return value.slice(0, ROADMAP_BUDGET_MAX_ROWS).flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return []
    const row = entry as Record<string, unknown>
    return [
      {
        category: normalizeBudgetValue(row.category, "category"),
        description: normalizeBudgetValue(row.description, "description"),
        costType: normalizeBudgetValue(row.costType, "costType"),
        unit: normalizeBudgetValue(row.unit, "unit"),
        units: normalizeBudgetValue(row.units, "units"),
        costPerUnit: normalizeBudgetValue(row.costPerUnit, "costPerUnit"),
        totalCost: normalizeBudgetValue(row.totalCost, "totalCost"),
      },
    ]
  })
}

export function hasMeaningfulRoadmapBudgetRows(rows: BudgetTableRow[]) {
  return rows.some((row) =>
    Object.values(row).some((value) => value.trim().length > 0)
  )
}

export function roadmapBudgetRowsEqual(
  left: BudgetTableRow[],
  right: BudgetTableRow[]
) {
  if (left.length !== right.length) return false

  return left.every((row, index) => {
    const other = right[index]
    return (
      other !== undefined &&
      (Object.keys(BLANK_ROADMAP_BUDGET_ROW) as (keyof BudgetTableRow)[]).every(
        (field) => row[field] === other[field]
      )
    )
  })
}

export function parseRoadmapBudgetAmount(value: string) {
  const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}

export function getRoadmapBudgetRowTotal(row: BudgetTableRow) {
  return (
    parseRoadmapBudgetAmount(row.units) *
    parseRoadmapBudgetAmount(row.costPerUnit)
  )
}

export function formatRoadmapBudgetAmount(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00"
}
