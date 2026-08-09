import {
  MAX_WORKSPACE_FINANCE_CSV_ROWS,
  parseWorkspaceFinanceCsv,
} from "./csv-preview"
import { WORKSPACE_FINANCE_RECORD_TYPES } from "./record-types"

export const MAX_WORKSPACE_FINANCE_CSV_IMPORT_BATCH = 200

export const WORKSPACE_FINANCE_CSV_RECORD_TYPES =
  WORKSPACE_FINANCE_RECORD_TYPES.map(({ listLabel, value }) => ({
    label: listLabel,
    value,
  }))

export type WorkspaceFinanceCsvRecordType =
  (typeof WORKSPACE_FINANCE_CSV_RECORD_TYPES)[number]["value"]

export type WorkspaceFinanceCsvMapping = {
  dateColumn: string
  amountColumn: string
  sourceColumn: string
  recordType:
    | { mode: "fixed"; value: WorkspaceFinanceCsvRecordType }
    | { mode: "column"; column: string }
  currency: { mode: "fixed"; value: "USD" } | { mode: "column"; column: string }
}

export type WorkspaceFinanceCsvMappedRecord = {
  rowNumber: number
  effectiveAt: string
  recordType: WorkspaceFinanceCsvRecordType
  direction: "in" | "out"
  sourceKind: "donations" | "grants" | "earned_revenue" | "other" | null
  sourceLabel: string
  amountCents: number
  currencyCode: string
}

export type WorkspaceFinanceCsvImportBatchInput = {
  fileFingerprint: string
  finalBatch: boolean
  programId?: string | null
  records: WorkspaceFinanceCsvMappedRecord[]
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const RECORD_TYPE_ALIASES = new Map<string, WorkspaceFinanceCsvRecordType>([
  ["donation", "donation"],
  ["donations", "donation"],
  ["contribution", "donation"],
  ["contributions", "donation"],
  ["gift", "donation"],
  ["grant", "grant"],
  ["grants", "grant"],
  ["earned revenue", "earned_revenue"],
  ["program income", "earned_revenue"],
  ["revenue", "earned_revenue"],
  ["sale", "earned_revenue"],
  ["sales", "earned_revenue"],
  ["other", "other_income"],
  ["other income", "other_income"],
  ["income", "other_income"],
  ["expense", "expense"],
  ["expenses", "expense"],
  ["purchase", "expense"],
  ["fee", "fee"],
  ["fees", "fee"],
  ["refund", "reversal"],
  ["refunds", "reversal"],
  ["reversal", "reversal"],
  ["correction", "correction"],
  ["adjustment", "correction"],
])

export function createDefaultWorkspaceFinanceCsvColumns(headers: string[]) {
  return {
    dateColumn: findHeader(headers, [
      "date",
      "transaction date",
      "effective date",
      "created date",
    ]),
    amountColumn: findHeader(headers, [
      "amount",
      "net amount",
      "gross amount",
      "total",
    ]),
    sourceColumn: findHeader(headers, [
      "source",
      "description",
      "name",
      "memo",
      "donor",
      "customer",
    ]),
    typeColumn: findHeader(headers, ["type", "record type", "category"]),
    currencyColumn: findHeader(headers, ["currency", "currency code"]),
  }
}

export function mapWorkspaceFinanceCsvRecords({
  mapping,
  source,
}: {
  mapping: WorkspaceFinanceCsvMapping
  source: string
}): WorkspaceFinanceCsvMappedRecord[] {
  const parsed = parseWorkspaceFinanceCsv(source)
  const dateIndex = requireColumn(parsed.headers, mapping.dateColumn, "Date")
  const amountIndex = requireColumn(
    parsed.headers,
    mapping.amountColumn,
    "Amount"
  )
  const sourceIndex = requireColumn(
    parsed.headers,
    mapping.sourceColumn,
    "Source"
  )
  const typeIndex =
    mapping.recordType.mode === "column"
      ? requireColumn(parsed.headers, mapping.recordType.column, "Record type")
      : null
  const currencyIndex =
    mapping.currency.mode === "column"
      ? requireColumn(parsed.headers, mapping.currency.column, "Currency")
      : null

  return parsed.records.map(({ rowNumber, values }) => {
    const recordType =
      mapping.recordType.mode === "fixed"
        ? mapping.recordType.value
        : parseRecordType(values[typeIndex ?? -1], rowNumber)
    const signedAmountCents = parseAmountCents(values[amountIndex], rowNumber)
    if (signedAmountCents < 0 && isInboundRecordType(recordType)) {
      throw new Error(
        `Row ${rowNumber}: negative amounts cannot be imported as ${recordTypeLabel(recordType)}.`
      )
    }

    const direction = resolveDirection(recordType, signedAmountCents)
    const sourceLabel = values[sourceIndex]?.trim() ?? ""
    if (!sourceLabel || sourceLabel.length > 120) {
      throw new Error(
        `Row ${rowNumber}: Source must contain 1 to 120 characters.`
      )
    }

    const currencyCode =
      mapping.currency.mode === "fixed"
        ? mapping.currency.value
        : (values[currencyIndex ?? -1]?.trim().toUpperCase() ?? "")
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      throw new Error(`Row ${rowNumber}: Currency must be a three-letter code.`)
    }

    return {
      rowNumber,
      effectiveAt: parseEffectiveAt(values[dateIndex], rowNumber),
      recordType,
      direction,
      sourceKind: resolveSourceKind(recordType, direction),
      sourceLabel,
      amountCents: Math.abs(signedAmountCents),
      currencyCode,
    }
  })
}

export function normalizeWorkspaceFinanceCsvImportBatch(
  input: WorkspaceFinanceCsvImportBatchInput | null | undefined
): WorkspaceFinanceCsvImportBatchInput | null {
  if (
    !input ||
    typeof input !== "object" ||
    typeof input.fileFingerprint !== "string" ||
    !/^[a-f0-9]{64}$/.test(input.fileFingerprint) ||
    typeof input.finalBatch !== "boolean" ||
    (input.programId != null && !UUID_PATTERN.test(input.programId))
  ) {
    return null
  }
  if (
    !Array.isArray(input.records) ||
    input.records.length < 1 ||
    input.records.length > MAX_WORKSPACE_FINANCE_CSV_IMPORT_BATCH
  ) {
    return null
  }

  const recordTypes = new Set(
    WORKSPACE_FINANCE_CSV_RECORD_TYPES.map(({ value }) => value)
  )
  const sourceKinds = new Set([
    "donations",
    "grants",
    "earned_revenue",
    "other",
  ])
  const records: WorkspaceFinanceCsvMappedRecord[] = []
  const rowNumbers = new Set<number>()

  for (const record of input.records) {
    if (!record || typeof record !== "object") return null
    const sourceLabel =
      typeof record.sourceLabel === "string" ? record.sourceLabel.trim() : ""
    if (typeof record.effectiveAt !== "string") return null
    const effectiveAt = new Date(record.effectiveAt)
    const expectedDirection =
      record.recordType === "correction"
        ? record.direction
        : resolveDirection(record.recordType, 1)
    const expectedSourceKind = resolveSourceKind(
      record.recordType,
      expectedDirection
    )
    if (
      !Number.isInteger(record.rowNumber) ||
      record.rowNumber < 2 ||
      record.rowNumber > MAX_WORKSPACE_FINANCE_CSV_ROWS + 1 ||
      rowNumbers.has(record.rowNumber) ||
      !recordTypes.has(record.recordType) ||
      (record.direction !== "in" && record.direction !== "out") ||
      record.direction !== expectedDirection ||
      (record.sourceKind !== null && !sourceKinds.has(record.sourceKind)) ||
      (record.direction === "in" && record.sourceKind === null) ||
      record.sourceKind !== expectedSourceKind ||
      !sourceLabel ||
      sourceLabel.length > 120 ||
      !Number.isInteger(record.amountCents) ||
      record.amountCents <= 0 ||
      !Number.isSafeInteger(record.amountCents) ||
      !/^[A-Z]{3}$/.test(record.currencyCode) ||
      Number.isNaN(effectiveAt.valueOf())
    ) {
      return null
    }
    rowNumbers.add(record.rowNumber)
    records.push({
      ...record,
      effectiveAt: effectiveAt.toISOString(),
      sourceLabel,
    })
  }

  return { ...input, programId: input.programId ?? null, records }
}

function findHeader(headers: string[], aliases: string[]) {
  const normalizedAliases = new Set(aliases.map(normalizeHeader))
  return (
    headers.find((header) => normalizedAliases.has(normalizeHeader(header))) ??
    ""
  )
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
}

function requireColumn(headers: string[], column: string, label: string) {
  const index = headers.indexOf(column)
  if (index < 0) throw new Error(`${label} needs a CSV column.`)
  return index
}

function parseRecordType(value: string | undefined, rowNumber: number) {
  const recordType = RECORD_TYPE_ALIASES.get(normalizeHeader(value ?? ""))
  if (!recordType)
    throw new Error(`Row ${rowNumber}: Record type is not recognized.`)
  return recordType
}

function parseAmountCents(value: string | undefined, rowNumber: number) {
  const raw = value?.trim() ?? ""
  const parenthesized = /^\(.*\)$/.test(raw)
  const normalized = raw
    .replace(/^\((.*)\)$/, "$1")
    .replace(/^[A-Za-z]{3}\s*/, "")
    .replace(/[,$£€¥\s]/g, "")
  if (!/^[+-]?\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error(
      `Row ${rowNumber}: Amount must be a number with up to two decimals.`
    )
  }

  const sign = parenthesized || normalized.startsWith("-") ? -1 : 1
  const unsigned = normalized.replace(/^[+-]/, "")
  const cents = Math.round(Number(unsigned) * 100)
  if (!Number.isSafeInteger(cents) || cents < 1) {
    throw new Error(`Row ${rowNumber}: Amount must be greater than zero.`)
  }
  return cents * sign
}

function parseEffectiveAt(value: string | undefined, rowNumber: number) {
  const raw = value?.trim() ?? ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const dateOnly = new Date(`${raw}T12:00:00.000Z`)
    if (
      !Number.isNaN(dateOnly.valueOf()) &&
      dateOnly.toISOString().slice(0, 10) === raw
    ) {
      return dateOnly.toISOString()
    }
  }
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error(`Row ${rowNumber}: Date is not recognized.`)
  }
  return parsed.toISOString()
}

function isInboundRecordType(recordType: WorkspaceFinanceCsvRecordType) {
  return ["donation", "grant", "earned_revenue", "other_income"].includes(
    recordType
  )
}

function resolveDirection(
  recordType: WorkspaceFinanceCsvRecordType,
  signedAmountCents: number
): "in" | "out" {
  if (recordType === "correction") return signedAmountCents < 0 ? "out" : "in"
  return isInboundRecordType(recordType) ? "in" : "out"
}

function resolveSourceKind(
  recordType: WorkspaceFinanceCsvRecordType,
  direction: "in" | "out"
): WorkspaceFinanceCsvMappedRecord["sourceKind"] {
  if (direction === "out") return null
  if (recordType === "donation") return "donations"
  if (recordType === "grant") return "grants"
  if (recordType === "earned_revenue") return "earned_revenue"
  return "other"
}

function recordTypeLabel(recordType: WorkspaceFinanceCsvRecordType) {
  return (
    WORKSPACE_FINANCE_CSV_RECORD_TYPES.find(({ value }) => value === recordType)
      ?.label ?? "income"
  )
}
