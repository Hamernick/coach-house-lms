import type { BudgetTableRow } from "@/lib/modules"

import type { ProgramWizardFormState } from "../schema"

export const BLANK_PROGRAM_BUDGET_ROW: BudgetTableRow = {
  category: "",
  description: "",
  costType: "",
  unit: "",
  units: "",
  costPerUnit: "",
  totalCost: "",
}

function toUsd(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0
}

function parseNumber(value: string) {
  if (!value) return 0
  const cleaned = value.replace(/[^0-9.-]/g, "")
  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatMoney(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00"
}

export function computeProgramBudgetRowTotal(row: BudgetTableRow) {
  const explicitTotal = parseNumber(row.totalCost)
  if (explicitTotal > 0) return explicitTotal
  return parseNumber(row.units) * parseNumber(row.costPerUnit)
}

export function hasMeaningfulBudgetRows(rows: BudgetTableRow[]) {
  return rows.some((row) =>
    [
      row.category,
      row.description,
      row.costType,
      row.unit,
      row.units,
      row.costPerUnit,
      row.totalCost,
    ].some((value) => typeof value === "string" && value.trim().length > 0),
  )
}

function createLegacyBudgetRow(
  category: string,
  amount: number,
  description: string,
): BudgetTableRow | null {
  if (!Number.isFinite(amount) || amount <= 0) return null
  return {
    category,
    description,
    costType: "Fixed",
    unit: "Program",
    units: "1",
    costPerUnit: formatMoney(amount),
    totalCost: formatMoney(amount),
  }
}

export function buildLegacyProgramBudgetRows(
  form: Pick<
    ProgramWizardFormState,
    "costStaffUsd" | "costSpaceUsd" | "costMaterialsUsd" | "costOtherUsd"
  >,
) {
  return [
    createLegacyBudgetRow(
      "Staff + facilitators",
      toUsd(Number(form.costStaffUsd)),
      "Program leadership, facilitation, and staffing support.",
    ),
    createLegacyBudgetRow(
      "Space + operations",
      toUsd(Number(form.costSpaceUsd)),
      "Facility, operations, and delivery-site costs.",
    ),
    createLegacyBudgetRow(
      "Materials + supplies",
      toUsd(Number(form.costMaterialsUsd)),
      "Participant materials, curriculum, and supplies.",
    ),
    createLegacyBudgetRow(
      "Other program costs",
      toUsd(Number(form.costOtherUsd)),
      "Transportation, food, fees, or other direct costs.",
    ),
  ].filter((row): row is BudgetTableRow => Boolean(row))
}

export function normalizeProgramBudgetRows(
  rows: BudgetTableRow[],
  fallbackRows: BudgetTableRow[] = [],
) {
  const source =
    Array.isArray(rows) && hasMeaningfulBudgetRows(rows)
      ? rows
      : fallbackRows.length > 0
        ? fallbackRows
        : [BLANK_PROGRAM_BUDGET_ROW]

  return source.map((row) => ({
    category: row.category ?? "",
    description: row.description ?? "",
    costType: row.costType ?? "",
    unit: row.unit ?? "",
    units: row.units ?? "",
    costPerUnit: row.costPerUnit ?? "",
    totalCost:
      row.totalCost && row.totalCost.trim().length > 0
        ? row.totalCost
        : formatMoney(computeProgramBudgetRowTotal(row)),
  }))
}

export function resolveProgramBudgetRows(
  form: Pick<
    ProgramWizardFormState,
    | "budgetRows"
    | "costStaffUsd"
    | "costSpaceUsd"
    | "costMaterialsUsd"
    | "costOtherUsd"
  >,
) {
  return normalizeProgramBudgetRows(
    form.budgetRows,
    buildLegacyProgramBudgetRows(form),
  )
}

export function computeBudgetBreakdown(
  form: Pick<
    ProgramWizardFormState,
    | "budgetRows"
    | "costStaffUsd"
    | "costSpaceUsd"
    | "costMaterialsUsd"
    | "costOtherUsd"
    | "raisedUsd"
  >,
) {
  const rows = resolveProgramBudgetRows(form)
  const raised = toUsd(Number(form.raisedUsd))
  const legacyBuckets = rows.reduce(
    (acc, row) => {
      const value = computeProgramBudgetRowTotal(row)
      const fingerprint = `${row.category} ${row.description}`.toLowerCase()
      if (
        /staff|facilitator|personnel|payroll|mentor|coach/.test(fingerprint)
      ) {
        acc.costStaffUsd += value
      } else if (
        /space|facility|rent|operations|site|venue/.test(fingerprint)
      ) {
        acc.costSpaceUsd += value
      } else if (
        /material|supply|equipment|curriculum|tool|kit/.test(fingerprint)
      ) {
        acc.costMaterialsUsd += value
      } else {
        acc.costOtherUsd += value
      }
      return acc
    },
    {
      costStaffUsd: 0,
      costSpaceUsd: 0,
      costMaterialsUsd: 0,
      costOtherUsd: 0,
    },
  )
  const totalBudget = rows.reduce(
    (sum, row) => sum + computeProgramBudgetRowTotal(row),
    0,
  )
  const fundraisingTarget = Math.max(0, totalBudget - raised)

  return {
    rows,
    raised,
    ...legacyBuckets,
    totalBudget,
    fundraisingTarget,
  }
}
