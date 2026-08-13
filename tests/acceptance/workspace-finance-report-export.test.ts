import { PDFDocument } from "pdf-lib"
import { describe, expect, it } from "vitest"

import {
  buildWorkspaceFinanceCsv,
  buildWorkspaceFinancePdf,
  buildWorkspaceFinanceReportRows,
} from "@/features/workspace-finance/server/report-export"

const REPORT_RECORDS = [
  {
    id: "replacement-record",
    programTitle: "Youth program",
    effectiveAt: "2026-08-12T18:45:00.000Z",
    sourceLabel: '=HYPERLINK("https://example.com")',
    typeLabel: "Donation",
    amountCents: 12_345,
    currencyCode: "usd",
    direction: "in" as const,
    status: "reconciled" as const,
    correction: {
      correctionId: "correction",
      correctedAt: "2026-08-12T19:00:00.000Z",
      reason: "Corrected source",
      relatedRecordId: "original-record",
      state: "replacement" as const,
    },
    reconciliation: {
      evidenceId: "evidence",
      externalReference: "stripe_tx_123",
      fileName: "evidence.pdf",
      reconciledAt: "2026-08-12T19:10:00.000Z",
    },
  },
  {
    id: "expense-record",
    effectiveAt: "2026-08-11T15:30:00.000Z",
    sourceLabel: "Operating account",
    typeLabel: "Expense",
    amountCents: 505,
    currencyCode: "USD",
    direction: "out" as const,
    status: "recorded" as const,
  },
  {
    id: "engagement:event",
    effectiveAt: "2026-08-10T15:30:00.000Z",
    sourceLabel: "Fundraising page",
    typeLabel: "View",
    amountCents: null,
    direction: null,
    status: null,
  },
]

describe("workspace Finance report exports", () => {
  it("preserves signed cents, UTC dates, correction state, and verification", () => {
    expect(buildWorkspaceFinanceReportRows(REPORT_RECORDS)).toEqual([
      expect.objectContaining({
        amount: "123.45",
        amountCents: "12345",
        correction: "Replacement",
        currency: "USD",
        date: "2026-08-12T18:45:00.000Z",
        program: "Youth program",
        recordId: "replacement-record",
        verificationReference: "stripe_tx_123",
      }),
      expect.objectContaining({
        amount: "-5.05",
        amountCents: "-505",
        recordId: "expense-record",
      }),
      expect.objectContaining({
        amount: "",
        amountCents: "",
        currency: "",
        recordId: "engagement:event",
      }),
    ])
  })

  it("neutralizes spreadsheet formulas and escapes exact CSV fields", () => {
    const csv = buildWorkspaceFinanceCsv(
      buildWorkspaceFinanceReportRows(REPORT_RECORDS)
    )

    expect(csv).toContain(
      "Record ID,Date (UTC),Source,Type,Program,Direction,Amount,Amount cents,Currency,Status,Correction,Verification reference"
    )
    expect(csv).toContain(
      `"'=HYPERLINK(""https://example.com"")",Donation,Youth program,in,123.45,12345,USD,reconciled,Replacement,stripe_tx_123`
    )
    expect(csv).toContain(
      "expense-record,2026-08-11T15:30:00.000Z,Operating account,Expense,,out,-5.05,-505,USD,recorded,,"
    )
  })

  it("creates a parseable landscape PDF with an auditable record count", async () => {
    const generatedAt = new Date("2026-08-13T18:00:00.000Z")
    const bytes = await buildWorkspaceFinancePdf({
      generatedAt,
      rows: buildWorkspaceFinanceReportRows(REPORT_RECORDS),
    })
    const document = await PDFDocument.load(bytes)

    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe("%PDF-")
    expect(document.getTitle()).toBe("Coach House Finance report")
    expect(document.getSubject()).toBe("3 Finance history records")
    expect(document.getPages()).toHaveLength(1)
    expect(document.getPages()[0].getWidth()).toBe(792)
    expect(document.getPages()[0].getHeight()).toBe(612)
  })
})
