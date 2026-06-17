export type FiscalSponsorshipBudgetRow = {
  amount: string
  category: string
  description: string
  id: string
}

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
  index: number,
  value?: Partial<FiscalSponsorshipBudgetRow>
): FiscalSponsorshipBudgetRow {
  return {
    amount: value?.amount ?? "",
    category: value?.category ?? "",
    description: value?.description ?? "",
    id: value?.id ?? `budget-row-${index}`,
  }
}

function normalizeBudgetCell(value: string) {
  return value.replaceAll("|", "/").trim()
}

export function parseBudgetRows(value: string): FiscalSponsorshipBudgetRow[] {
  const rows = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const cells = line.includes("|")
        ? line.split("|")
        : line.includes("\t")
          ? line.split("\t")
          : line.split(" - ")

      return makeBudgetRow(index, {
        amount: cells[2]?.trim() ?? "",
        category: cells[0]?.trim() ?? "",
        description: cells[1]?.trim() ?? "",
      })
    })

  return rows.length > 0 ? rows : [makeBudgetRow(0)]
}

export function serializeBudgetRows(rows: FiscalSponsorshipBudgetRow[]) {
  return rows
    .filter(
      (row) =>
        row.category.trim() || row.description.trim() || row.amount.trim()
    )
    .map((row) =>
      [
        normalizeBudgetCell(row.category),
        normalizeBudgetCell(row.description),
        normalizeBudgetCell(row.amount),
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

export function getBudgetTotal(rows: FiscalSponsorshipBudgetRow[]) {
  return rows.reduce((total, row) => total + parseMoneyValue(row.amount), 0)
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
  const amount = normalized.findIndex((cell) =>
    /\b(amount|cost|budget|total)\b/.test(cell)
  )

  return {
    amount: amount >= 0 ? amount : 2,
    category: category >= 0 ? category : 0,
    description: description >= 0 ? description : 1,
    hasHeader: category >= 0 || description >= 0 || amount >= 0,
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
    .map((cells, index) =>
      makeBudgetRow(index, {
        amount: cells[indexes.amount] ?? "",
        category: cells[indexes.category] ?? "",
        description: cells[indexes.description] ?? "",
        id: `budget-csv-row-${index}`,
      })
    )
    .filter(
      (row) =>
        row.category.trim() || row.description.trim() || row.amount.trim()
    )
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
