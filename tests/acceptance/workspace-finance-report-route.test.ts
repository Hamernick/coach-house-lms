import { beforeEach, describe, expect, it, vi } from "vitest"

const { buildWorkspaceFinanceReportDownloadMock } = vi.hoisted(() => ({
  buildWorkspaceFinanceReportDownloadMock: vi.fn(),
}))

vi.mock("@/actions/workspace-finance-report", () => ({
  buildWorkspaceFinanceReportDownload: buildWorkspaceFinanceReportDownloadMock,
}))

import { GET } from "@/app/api/account/finance-report/route"

describe("workspace Finance report route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects unsupported report formats", async () => {
    const response = await GET(
      new Request("http://localhost/api/account/finance-report?format=xlsx")
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Choose CSV or PDF.",
    })
    expect(buildWorkspaceFinanceReportDownloadMock).not.toHaveBeenCalled()
  })

  it("preserves authorization failures", async () => {
    buildWorkspaceFinanceReportDownloadMock.mockResolvedValue({
      error: "Forbidden",
      status: 403,
    })

    const response = await GET(
      new Request("http://localhost/api/account/finance-report?format=pdf")
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" })
  })

  it("returns private attachment headers for an authorized report", async () => {
    buildWorkspaceFinanceReportDownloadMock.mockResolvedValue({
      body: "record-id,date\nrecord,2026-08-13",
      contentType: "text/csv; charset=utf-8",
      fileName: "coach-house-finance-2026-08-13.csv",
    })

    const response = await GET(
      new Request("http://localhost/api/account/finance-report?format=csv")
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="coach-house-finance-2026-08-13.csv"'
    )
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8")
    expect(response.headers.get("x-content-type-options")).toBe("nosniff")
    await expect(response.text()).resolves.toContain("record-id,date")
    expect(buildWorkspaceFinanceReportDownloadMock).toHaveBeenCalledWith({
      format: "csv",
    })
  })
})
