import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib"

import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"
import { canViewWorkspaceFinance } from "@/lib/workspace/workspace-finance-access"

import { normalizeWorkspaceFinanceInput } from "../lib"
import type { WorkspaceFinanceRecordInput } from "../types"
import { loadOrganizationFinanceEngagementEvents } from "./engagement-events"
import { loadOrganizationFinanceRecords } from "./records"

export type WorkspaceFinanceReportFormat = "csv" | "pdf"

export type WorkspaceFinanceReportRow = {
  amount: string
  amountCents: string
  correction: string
  currency: string
  date: string
  direction: string
  program: string
  recordId: string
  source: string
  status: string
  type: string
  verificationReference: string
}

export type WorkspaceFinanceReportDownload = {
  body: Uint8Array | string
  contentType: string
  fileName: string
}

type WorkspaceFinanceReportError = {
  error: string
  status: number
}

const CSV_COLUMNS: Array<{
  header: string
  neutralizeFormula?: boolean
  value: (row: WorkspaceFinanceReportRow) => string
}> = [
  { header: "Record ID", value: (row) => row.recordId },
  { header: "Date (UTC)", value: (row) => row.date },
  {
    header: "Source",
    neutralizeFormula: true,
    value: (row) => row.source,
  },
  { header: "Type", neutralizeFormula: true, value: (row) => row.type },
  {
    header: "Program",
    neutralizeFormula: true,
    value: (row) => row.program,
  },
  { header: "Direction", value: (row) => row.direction },
  { header: "Amount", value: (row) => row.amount },
  { header: "Amount cents", value: (row) => row.amountCents },
  { header: "Currency", value: (row) => row.currency },
  { header: "Status", value: (row) => row.status },
  { header: "Correction", value: (row) => row.correction },
  {
    header: "Verification reference",
    neutralizeFormula: true,
    value: (row) => row.verificationReference,
  },
]

const PDF_COLUMNS: Array<{
  header: string
  value: (row: WorkspaceFinanceReportRow) => string
  width: number
}> = [
  { header: "Date", value: (row) => row.date.slice(0, 10), width: 60 },
  { header: "Source", value: (row) => row.source, width: 116 },
  { header: "Type", value: (row) => row.type, width: 88 },
  { header: "Program", value: (row) => row.program, width: 104 },
  { header: "Amount", value: (row) => row.amount, width: 74 },
  { header: "Status", value: (row) => row.status, width: 60 },
  { header: "Correction", value: (row) => row.correction, width: 74 },
  {
    header: "Verification",
    value: (row) => row.verificationReference,
    width: 120,
  },
]

function normalizeCurrency(value: string | null | undefined) {
  const currency = value?.trim().toUpperCase() || "USD"
  return /^[A-Z]{3}$/.test(currency) ? currency : "USD"
}

function formatReportAmount(record: WorkspaceFinanceRecordInput) {
  if (record.amountCents == null || !record.direction) {
    return { amount: "", amountCents: "" }
  }

  const signedCents =
    record.direction === "out" ? -record.amountCents : record.amountCents
  return {
    amount: (signedCents / 100).toFixed(2),
    amountCents: String(signedCents),
  }
}

export function buildWorkspaceFinanceReportRows(
  records: WorkspaceFinanceRecordInput[]
): WorkspaceFinanceReportRow[] {
  return records.map((record) => {
    const { amount, amountCents } = formatReportAmount(record)
    return {
      amount,
      amountCents,
      correction:
        record.correction?.state === "corrected"
          ? "Corrected"
          : record.correction?.state === "replacement"
            ? "Replacement"
            : "",
      currency:
        record.amountCents == null
          ? ""
          : normalizeCurrency(record.currencyCode),
      date: record.effectiveAt,
      direction: record.direction ?? "",
      program: record.programTitle ?? "",
      recordId: record.id,
      source: record.sourceLabel,
      status: record.status ?? "",
      type: record.typeLabel,
      verificationReference: record.reconciliation?.externalReference ?? "",
    }
  })
}

function neutralizeSpreadsheetFormula(value: string) {
  return /^[=+\-@\t\r]/u.test(value) ? `'${value}` : value
}

function csvEscape(value: string, neutralizeFormula = false) {
  const safeValue = neutralizeFormula
    ? neutralizeSpreadsheetFormula(value)
    : value
  const escaped = safeValue.replace(/"/g, '""')
  return /[",\n\r]/u.test(safeValue) ? `"${escaped}"` : escaped
}

export function buildWorkspaceFinanceCsv(rows: WorkspaceFinanceReportRow[]) {
  return [
    CSV_COLUMNS.map(({ header }) => csvEscape(header)).join(","),
    ...rows.map((row) =>
      CSV_COLUMNS.map(({ neutralizeFormula, value }) =>
        csvEscape(value(row), neutralizeFormula)
      ).join(",")
    ),
  ].join("\r\n")
}

function fitPdfText(text: string, font: PDFFont, width: number, size: number) {
  if (!text) return "—"
  if (font.widthOfTextAtSize(text, size) <= width) return text

  let fitted = text
  while (fitted.length > 1) {
    fitted = fitted.slice(0, -1)
    const candidate = `${fitted}…`
    if (font.widthOfTextAtSize(candidate, size) <= width) return candidate
  }
  return "…"
}

export async function buildWorkspaceFinancePdf({
  generatedAt,
  rows,
}: {
  generatedAt: Date
  rows: WorkspaceFinanceReportRow[]
}) {
  const document = await PDFDocument.create()
  document.setTitle("Coach House Finance report")
  document.setSubject(`${rows.length} Finance history records`)
  document.setCreator("Coach House")
  document.setCreationDate(generatedAt)
  document.setModificationDate(generatedAt)

  const regular = await document.embedFont(StandardFonts.Helvetica)
  const bold = await document.embedFont(StandardFonts.HelveticaBold)
  const pageSize: [number, number] = [792, 612]
  const margin = 28
  const rowHeight = 18
  const bodySize = 7.5
  let page = document.addPage(pageSize)
  let y = 566

  const drawPageHeader = () => {
    page.drawText("Finance report", {
      color: rgb(0.06, 0.08, 0.13),
      font: bold,
      size: 17,
      x: margin,
      y,
    })
    page.drawText(
      `Generated ${generatedAt.toISOString()} · ${rows.length} history ${rows.length === 1 ? "record" : "records"}`,
      {
        color: rgb(0.35, 0.37, 0.43),
        font: regular,
        size: 8,
        x: margin,
        y: y - 15,
      }
    )
    y -= 39
    let x = margin
    for (const column of PDF_COLUMNS) {
      page.drawText(column.header, {
        color: rgb(0.2, 0.22, 0.28),
        font: bold,
        size: 7.5,
        x,
        y,
      })
      x += column.width
    }
    y -= 12
    page.drawLine({
      color: rgb(0.78, 0.8, 0.84),
      start: { x: margin, y: y + 7 },
      end: { x: pageSize[0] - margin, y: y + 7 },
      thickness: 0.5,
    })
  }

  drawPageHeader()

  if (!rows.length) {
    page.drawText("No Finance history records are available.", {
      color: rgb(0.35, 0.37, 0.43),
      font: regular,
      size: 10,
      x: margin,
      y: y - 8,
    })
  }

  for (const row of rows) {
    if (y < 34) {
      page = document.addPage(pageSize)
      y = 566
      drawPageHeader()
    }

    let x = margin
    for (const column of PDF_COLUMNS) {
      page.drawText(
        fitPdfText(column.value(row), regular, column.width - 5, bodySize),
        {
          color: rgb(0.12, 0.14, 0.2),
          font: regular,
          size: bodySize,
          x,
          y,
        }
      )
      x += column.width
    }
    y -= rowHeight
  }

  return document.save()
}

async function loadReportRecords({
  orgId,
  supabase,
}: {
  orgId: string
  supabase: Awaited<
    ReturnType<typeof resolveAuthenticatedAppContext>
  >["supabase"]
}) {
  const [records, engagementEvents, programsResult] = await Promise.all([
    loadOrganizationFinanceRecords({ orgId, supabase }),
    loadOrganizationFinanceEngagementEvents({ orgId, supabase }),
    supabase
      .from("programs")
      .select("id,title")
      .eq("user_id", orgId)
      .limit(500)
      .returns<Array<{ id: string; title: string | null }>>(),
  ])

  if (programsResult.error) {
    throw new Error("Unable to load Finance program labels.", {
      cause: programsResult.error,
    })
  }

  return normalizeWorkspaceFinanceInput({
    programs: programsResult.data ?? [],
    records: [...records, ...engagementEvents],
    recordsState: "ready",
  }).records
}

export async function buildWorkspaceFinanceReportDownload({
  format,
  generatedAt = new Date(),
}: {
  format: WorkspaceFinanceReportFormat
  generatedAt?: Date
}): Promise<WorkspaceFinanceReportDownload | WorkspaceFinanceReportError> {
  let context: Awaited<ReturnType<typeof resolveAuthenticatedAppContext>>
  try {
    context = await resolveAuthenticatedAppContext()
  } catch {
    return { error: "Unauthorized", status: 401 }
  }

  const canView = await canViewWorkspaceFinance({
    activeOrg: context.activeOrg,
    supabase: context.supabase,
    userId: context.user.id,
  })
  if (!canView) return { error: "Forbidden", status: 403 }

  let records: WorkspaceFinanceRecordInput[]
  try {
    records = await loadReportRecords({
      orgId: context.activeOrg.orgId,
      supabase: context.supabase,
    })
  } catch {
    return { error: "Unable to build the Finance report.", status: 500 }
  }

  const rows = buildWorkspaceFinanceReportRows(records)
  const date = generatedAt.toISOString().slice(0, 10)
  if (format === "csv") {
    return {
      body: buildWorkspaceFinanceCsv(rows),
      contentType: "text/csv; charset=utf-8",
      fileName: `coach-house-finance-${date}.csv`,
    }
  }

  return {
    body: await buildWorkspaceFinancePdf({ generatedAt, rows }),
    contentType: "application/pdf",
    fileName: `coach-house-finance-${date}.pdf`,
  }
}
