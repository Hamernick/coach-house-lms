import type { WorkspaceFinanceSourceKind } from "../types"

export const WORKSPACE_FINANCE_RECORD_TYPES = [
  {
    label: "Donation",
    listLabel: "Donations",
    value: "donation",
    direction: "in",
    sourceKind: "donations",
    manual: true,
  },
  {
    label: "Grant",
    listLabel: "Grants",
    value: "grant",
    direction: "in",
    sourceKind: "grants",
    manual: true,
  },
  {
    label: "Earned revenue",
    listLabel: "Earned revenue",
    value: "earned_revenue",
    direction: "in",
    sourceKind: "earned_revenue",
    manual: true,
  },
  {
    label: "Other income",
    listLabel: "Other income",
    value: "other_income",
    direction: "in",
    sourceKind: "other",
    manual: true,
  },
  {
    label: "Expense",
    listLabel: "Expenses",
    value: "expense",
    direction: "out",
    sourceKind: null,
    manual: true,
  },
  {
    label: "Fee",
    listLabel: "Fees",
    value: "fee",
    direction: "out",
    sourceKind: null,
    manual: true,
  },
  {
    label: "Reversal",
    listLabel: "Reversals",
    value: "reversal",
    direction: "out",
    sourceKind: null,
    manual: true,
  },
  {
    label: "Correction",
    listLabel: "Corrections",
    value: "correction",
    direction: null,
    sourceKind: null,
    manual: false,
  },
] as const satisfies ReadonlyArray<{
  label: string
  listLabel: string
  value: string
  direction: "in" | "out" | null
  sourceKind: WorkspaceFinanceSourceKind | null
  manual: boolean
}>

export type WorkspaceFinanceRecordType =
  (typeof WORKSPACE_FINANCE_RECORD_TYPES)[number]["value"]
export type WorkspaceFinanceManualRecordType = Exclude<
  WorkspaceFinanceRecordType,
  "correction"
>

export const WORKSPACE_FINANCE_MANUAL_RECORD_TYPES =
  WORKSPACE_FINANCE_RECORD_TYPES.filter(
    (
      record
    ): record is Extract<
      (typeof WORKSPACE_FINANCE_RECORD_TYPES)[number],
      { manual: true }
    > => record.manual
  )

export function getWorkspaceFinanceRecordType(
  value: string
): (typeof WORKSPACE_FINANCE_RECORD_TYPES)[number] | null {
  return (
    WORKSPACE_FINANCE_RECORD_TYPES.find((record) => record.value === value) ??
    null
  )
}

export function getWorkspaceFinanceRecordTypeLabel(value: string) {
  return getWorkspaceFinanceRecordType(value)?.label ?? "Other"
}
