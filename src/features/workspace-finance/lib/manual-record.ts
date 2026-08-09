import type { WorkspaceFinanceSourceKind } from "../types"
import {
  getWorkspaceFinanceRecordType,
  type WorkspaceFinanceManualRecordType,
} from "./record-types"

export type WorkspaceFinanceManualRecordInput = {
  amount: string
  effectiveDate: string
  programId?: string | null
  recordType: WorkspaceFinanceManualRecordType
  sourceLabel: string
}

export type WorkspaceFinanceNormalizedManualRecord = {
  amountCents: number
  currencyCode: "USD"
  direction: "in" | "out"
  effectiveAt: string
  programId: string | null
  recordType: WorkspaceFinanceManualRecordType
  sourceKind: WorkspaceFinanceSourceKind | null
  sourceLabel: string
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const AMOUNT_PATTERN = /^\$?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/

export function normalizeWorkspaceFinanceManualRecord(
  input: WorkspaceFinanceManualRecordInput | null | undefined
): WorkspaceFinanceNormalizedManualRecord | null {
  if (!input || typeof input !== "object") return null

  const sourceLabel =
    typeof input.sourceLabel === "string" ? input.sourceLabel.trim() : ""
  const amount = typeof input.amount === "string" ? input.amount.trim() : ""
  const recordType = getWorkspaceFinanceRecordType(input.recordType)
  const effectiveDate =
    typeof input.effectiveDate === "string" ? input.effectiveDate.trim() : ""

  if (
    !sourceLabel ||
    sourceLabel.length > 120 ||
    !AMOUNT_PATTERN.test(amount) ||
    !recordType ||
    !recordType.manual ||
    !recordType.direction ||
    !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate) ||
    (input.programId != null && !UUID_PATTERN.test(input.programId))
  ) {
    return null
  }

  const date = new Date(`${effectiveDate}T12:00:00.000Z`)
  const amountCents = Math.round(
    Number(amount.replace(/^\$/, "").replaceAll(",", "")) * 100
  )
  if (
    Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== effectiveDate ||
    !Number.isSafeInteger(amountCents) ||
    amountCents < 1
  ) {
    return null
  }

  return {
    amountCents,
    currencyCode: "USD",
    direction: recordType.direction,
    effectiveAt: date.toISOString(),
    programId: input.programId ?? null,
    recordType: recordType.value,
    sourceKind: recordType.sourceKind,
    sourceLabel,
  }
}
