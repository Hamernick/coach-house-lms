export const MAX_WORKSPACE_FINANCE_CSV_ROWS = 5_000

export type WorkspaceFinanceCsvPreview = {
  headers: string[]
  rowCount: number
}

export type ParsedWorkspaceFinanceCsv = {
  headers: string[]
  records: Array<{ rowNumber: number; values: string[] }>
}

export function parseWorkspaceFinanceCsvPreview(
  source: string
): WorkspaceFinanceCsvPreview {
  const parsed = parseWorkspaceFinanceCsv(source)
  return { headers: parsed.headers, rowCount: parsed.records.length }
}

export function parseWorkspaceFinanceCsv(
  source: string
): ParsedWorkspaceFinanceCsv {
  const rows = parseCsvRows(source)
    .map((values, index) => ({ rowNumber: index + 1, values }))
    .filter(({ values }) => values.some((value) => value.trim()))

  if (!rows.length) throw new Error("This CSV file is empty.")

  const headers =
    rows[0]?.values.map((header, index) =>
      (index === 0 ? header.replace(/^\uFEFF/, "") : header).trim()
    ) ?? []
  if (!headers.length || headers.some((header) => !header)) {
    throw new Error("Every CSV column needs a heading.")
  }

  const normalizedHeaders = headers.map((header) => header.toLocaleLowerCase())
  if (new Set(normalizedHeaders).size !== normalizedHeaders.length) {
    throw new Error("CSV column headings must be unique.")
  }

  const records = rows.slice(1)
  if (!records.length) {
    throw new Error("This CSV file has headings but no records.")
  }
  if (records.length > MAX_WORKSPACE_FINANCE_CSV_ROWS) {
    throw new Error(
      `Choose a CSV file with ${MAX_WORKSPACE_FINANCE_CSV_ROWS.toLocaleString()} records or fewer.`
    )
  }
  if (records.some(({ values }) => values.length > headers.length)) {
    throw new Error("Some CSV records contain more values than the headings.")
  }

  return { headers, records }
}

function parseCsvRows(source: string) {
  const rows: string[][] = []
  let row: string[] = []
  let value = ""
  let inQuotes = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (character === '"') {
      if (inQuotes && source[index + 1] === '"') {
        value += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (!inQuotes && character === ",") {
      row.push(value)
      value = ""
      continue
    }
    if (!inQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && source[index + 1] === "\n") index += 1
      row.push(value)
      rows.push(row)
      row = []
      value = ""
      continue
    }
    value += character
  }

  if (inQuotes) throw new Error("This CSV file has an unfinished quoted value.")
  if (value || row.length) {
    row.push(value)
    rows.push(row)
  }
  return rows
}
