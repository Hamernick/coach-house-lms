export const COLUMN_ORDER = [
  "category",
  "description",
  "costType",
  "unit",
  "units",
  "costPerUnit",
  "totalCost",
  "actions",
] as const

export type BudgetColumnKey = (typeof COLUMN_ORDER)[number]

export const COLUMN_DEFAULTS: Record<BudgetColumnKey, number> = {
  category: 200,
  description: 300,
  costType: 150,
  unit: 150,
  units: 100,
  costPerUnit: 130,
  totalCost: 170,
  actions: 70,
}

export const COLUMN_MINS: Record<BudgetColumnKey, number> = {
  category: 150,
  description: 210,
  costType: 120,
  unit: 110,
  units: 80,
  costPerUnit: 100,
  totalCost: 120,
  actions: 60,
}

export const BUDGET_TABLE_MIN_WIDTH = COLUMN_ORDER.reduce(
  (sum, id) => sum + COLUMN_MINS[id],
  0,
)

export const HEADER_LABELS: Record<BudgetColumnKey, string> = {
  category: "Expense Category",
  description: "Description / What This Covers",
  costType: "Cost Type",
  unit: "Unit (if variable)",
  units: "# of Units",
  costPerUnit: "Cost per Unit",
  totalCost: "Total Estimated Cost",
  actions: "Actions",
}
