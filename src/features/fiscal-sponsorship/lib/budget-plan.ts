import type { BudgetTableRow } from "@/lib/modules"

export type FiscalSponsorshipBudgetRow = BudgetTableRow

export type ProjectAssetUploadResponse = {
  assets?: Array<{
    id?: unknown
    name?: unknown
  }>
  error?: unknown
}

export const BUDGET_SUPPORT_ACCEPT =
  ".csv,text/csv,application/pdf,image/*,.xls,.xlsx,.doc,.docx"

export function makeBudgetRow(
  _index: number,
  value?: Partial<FiscalSponsorshipBudgetRow>
): FiscalSponsorshipBudgetRow {
  const explicitTotal = value?.totalCost?.trim() ?? ""
  const hasExplicitTotal = parseMoneyValue(explicitTotal) > 0

  return {
    category: value?.category ?? "",
    costPerUnit:
      value?.costPerUnit?.trim() || (hasExplicitTotal ? explicitTotal : ""),
    costType: value?.costType?.trim() || (hasExplicitTotal ? "Fixed" : ""),
    description: value?.description ?? "",
    totalCost: explicitTotal,
    unit: value?.unit?.trim() || (hasExplicitTotal ? "Program" : ""),
    units: value?.units?.trim() || (hasExplicitTotal ? "1" : ""),
  }
}

function normalizeBudgetCell(value: string) {
  return value.replaceAll("|", "/").trim()
}

function hasMeaningfulBudgetRow(row: FiscalSponsorshipBudgetRow) {
  const hasText = [row.category, row.costType, row.description, row.unit].some(
    (value) => value.trim().length > 0
  )
  const hasAmount = [row.units, row.costPerUnit, row.totalCost].some(
    (value) => parseMoneyValue(value) > 0
  )

  return hasText || hasAmount
}

function isZeroOnlyBudgetSummary(value: string) {
  return /^\s*\$?\s*0(?:\.0{1,2})?(?:\s*;\s*\$?\s*0(?:\.0{1,2})?)*\s*$/.test(
    value
  )
}

function legacyAmountRow({
  amount,
  category,
  description,
  index,
}: {
  amount: string
  category: string
  description: string
  index: number
}) {
  const normalizedAmount = amount.replace(/^\$/, "").trim()

  return makeBudgetRow(index, {
    category,
    costPerUnit: normalizedAmount,
    costType: normalizedAmount ? "Fixed" : "",
    description,
    totalCost: normalizedAmount,
    unit: normalizedAmount ? "Program" : "",
    units: normalizedAmount ? "1" : "",
  })
}

export function parseBudgetRows(value: string): FiscalSponsorshipBudgetRow[] {
  if (!value.trim() || isZeroOnlyBudgetSummary(value)) {
    return [makeBudgetRow(0)]
  }

  const rows = value
    .split(/\r?\n|;\s*/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const cells = line.includes("|")
        ? line.split("|")
        : line.includes("\t")
          ? line.split("\t")
          : line.split(" - ")

      if (cells.length >= 7) {
        return makeBudgetRow(index, {
          category: cells[0]?.trim() ?? "",
          description: cells[1]?.trim() ?? "",
          costType: cells[2]?.trim() ?? "",
          unit: cells[3]?.trim() ?? "",
          units: cells[4]?.trim() ?? "",
          costPerUnit: cells[5]?.trim() ?? "",
          totalCost: cells[6]?.trim() ?? "",
        })
      }

      return legacyAmountRow({
        amount: cells[2]?.trim() ?? "",
        category: cells[0]?.trim() ?? "",
        description: cells[1]?.trim() ?? "",
        index,
      })
    })
    .filter(hasMeaningfulBudgetRow)

  return rows.length > 0 ? rows : [makeBudgetRow(0)]
}

export function serializeBudgetRows(rows: FiscalSponsorshipBudgetRow[]) {
  return rows
    .filter(hasMeaningfulBudgetRow)
    .map((row) =>
      [
        normalizeBudgetCell(row.category),
        normalizeBudgetCell(row.description),
        normalizeBudgetCell(row.costType),
        normalizeBudgetCell(row.unit),
        normalizeBudgetCell(row.units),
        normalizeBudgetCell(row.costPerUnit),
        normalizeBudgetCell(row.totalCost),
      ].join(" | ")
    )
    .join("\n")
}

function parseMoneyValue(value: string) {
  const amount = Number(value.replace(/[^\d.-]/g, ""))
  return Number.isFinite(amount) ? amount : 0
}

export function formatBudgetDollars(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    style: "currency",
  }).format(value)
}

export function getBudgetRowTotal(row: FiscalSponsorshipBudgetRow) {
  if (row.units.trim() && row.costPerUnit.trim()) {
    return parseMoneyValue(row.units) * parseMoneyValue(row.costPerUnit)
  }

  const explicitTotal = parseMoneyValue(row.totalCost)
  if (explicitTotal > 0) return explicitTotal
  return 0
}

export function getBudgetTotal(rows: FiscalSponsorshipBudgetRow[]) {
  return rows.reduce((total, row) => total + getBudgetRowTotal(row), 0)
}

export function summarizeBudgetRows(rows: FiscalSponsorshipBudgetRow[]) {
  return rows
    .filter(hasMeaningfulBudgetRow)
    .map((row) => {
      const total = getBudgetRowTotal(row)
      const amount = total > 0 ? `$${total.toFixed(2)}` : null

      return [row.category.trim(), row.description.trim(), amount]
        .filter(Boolean)
        .join(" - ")
    })
    .filter(Boolean)
    .join("; ")
}

export function normalizeFiscalSponsorshipBudgetRows(
  value: unknown
): FiscalSponsorshipBudgetRow[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null
      }

      const record = entry as Record<string, unknown>
      const text = (key: keyof FiscalSponsorshipBudgetRow) =>
        typeof record[key] === "string" ? record[key].trim() : ""
      const row = makeBudgetRow(index, {
        category: text("category"),
        costPerUnit: text("costPerUnit"),
        costType: text("costType"),
        description: text("description"),
        totalCost: text("totalCost"),
        unit: text("unit"),
        units: text("units"),
      })

      return hasMeaningfulBudgetRow(row) ? row : null
    })
    .filter((row): row is FiscalSponsorshipBudgetRow => row !== null)
}

export function readBudgetRowsFromMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return []
  return normalizeFiscalSponsorshipBudgetRows(
    (value as Record<string, unknown>).budgetRows
  )
}

export function readBudgetSourceActivityIdFromMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const selectedActivityId = (value as Record<string, unknown>)
    .selectedActivityId
  return typeof selectedActivityId === "string" &&
    selectedActivityId.trim().length > 0
    ? selectedActivityId.trim()
    : null
}

function parseCsvLine(line: string) {
  const cells: string[] = []
  let current = ""
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const nextChar = line[index + 1]

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim())
      current = ""
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

function getBudgetCsvColumnIndexes(header: string[]) {
  const normalized = header.map((cell) => cell.toLowerCase())
  const category = normalized.findIndex((cell) =>
    /\b(category|expense|item|line)\b/.test(cell)
  )
  const description = normalized.findIndex((cell) =>
    /\b(description|detail|notes?)\b/.test(cell)
  )
  const costType = normalized.findIndex((cell) =>
    /\b(cost type|fixed|variable)\b/.test(cell)
  )
  const unit = normalized.findIndex((cell) => /\bunit(?: type)?\b/.test(cell))
  const units = normalized.findIndex((cell) =>
    /\b(quantity|qty|number of units|# of units)\b/.test(cell)
  )
  const costPerUnit = normalized.findIndex((cell) =>
    /\b(cost per unit|unit cost|rate)\b/.test(cell)
  )
  const totalCost = normalized.findIndex((cell) =>
    /\b(amount|total|total cost|estimated cost|budget)\b/.test(cell)
  )

  return {
    category: category >= 0 ? category : 0,
    costPerUnit,
    costType,
    description: description >= 0 ? description : 1,
    hasHeader:
      category >= 0 ||
      description >= 0 ||
      costType >= 0 ||
      unit >= 0 ||
      units >= 0 ||
      costPerUnit >= 0 ||
      totalCost >= 0,
    totalCost: totalCost >= 0 ? totalCost : 2,
    unit,
    units,
  }
}

export function parseCsvBudgetRows(value: string) {
  const csvRows = value
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseCsvLine)

  if (csvRows.length === 0) return []

  const indexes = getBudgetCsvColumnIndexes(csvRows[0] ?? [])
  const dataRows = indexes.hasHeader ? csvRows.slice(1) : csvRows

  return dataRows
    .map((cells, index) => {
      const totalCost = cells[indexes.totalCost] ?? ""
      return makeBudgetRow(index, {
        category: cells[indexes.category] ?? "",
        costPerUnit:
          indexes.costPerUnit >= 0
            ? (cells[indexes.costPerUnit] ?? "")
            : totalCost,
        costType:
          indexes.costType >= 0
            ? (cells[indexes.costType] ?? "")
            : totalCost
              ? "Fixed"
              : "",
        description: cells[indexes.description] ?? "",
        totalCost,
        unit:
          indexes.unit >= 0
            ? (cells[indexes.unit] ?? "")
            : totalCost
              ? "Program"
              : "",
        units:
          indexes.units >= 0
            ? (cells[indexes.units] ?? "")
            : totalCost
              ? "1"
              : "",
      })
    })
    .filter(hasMeaningfulBudgetRow)
}

export function isCsvFile(file: File | null): file is File {
  if (!file) return false
  return file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")
}

function parseUploadResponse(value: ProjectAssetUploadResponse) {
  const asset = value.assets?.[0]
  const assetId = typeof asset?.id === "string" ? asset.id : ""
  const assetName = typeof asset?.name === "string" ? asset.name : ""
  const error = typeof value.error === "string" ? value.error : null

  return { assetId, assetName, error }
}

export async function uploadProjectAsset({
  description,
  file,
  projectId,
  title,
}: {
  description: string
  file: File
  projectId: string
  title: string
}) {
  const form = new FormData()
  form.append("projectId", projectId)
  form.append("title", title)
  form.append("description", description)
  form.append("files", file)

  const response = await fetch("/api/account/project-assets", {
    body: form,
    method: "POST",
  })
  const payload = (await response
    .json()
    .catch(() => ({}))) as ProjectAssetUploadResponse
  const parsed = parseUploadResponse(payload)

  if (!response.ok) {
    throw new Error(parsed.error ?? "Unable to upload that budget file.")
  }

  if (!parsed.assetId) {
    throw new Error("Uploaded file did not return a project asset.")
  }

  return parsed
}
