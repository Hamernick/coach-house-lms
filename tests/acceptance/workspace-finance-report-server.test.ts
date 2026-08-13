import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  canViewWorkspaceFinanceMock,
  loadOrganizationFinanceEngagementEventsMock,
  loadOrganizationFinanceRecordsMock,
  resolveAuthenticatedAppContextMock,
} = vi.hoisted(() => ({
  canViewWorkspaceFinanceMock: vi.fn(),
  loadOrganizationFinanceEngagementEventsMock: vi.fn(),
  loadOrganizationFinanceRecordsMock: vi.fn(),
  resolveAuthenticatedAppContextMock: vi.fn(),
}))

vi.mock("@/lib/auth/request-context", () => ({
  resolveAuthenticatedAppContext: resolveAuthenticatedAppContextMock,
}))

vi.mock("@/lib/workspace/workspace-finance-access", () => ({
  canViewWorkspaceFinance: canViewWorkspaceFinanceMock,
}))

vi.mock("@/features/workspace-finance/server/records", () => ({
  loadOrganizationFinanceRecords: loadOrganizationFinanceRecordsMock,
}))

vi.mock("@/features/workspace-finance/server/engagement-events", () => ({
  loadOrganizationFinanceEngagementEvents:
    loadOrganizationFinanceEngagementEventsMock,
}))

import { buildWorkspaceFinanceReportDownload } from "@/features/workspace-finance/server/report-export"

function createContext() {
  const programsQuery = {
    eq: vi.fn(),
    limit: vi.fn(),
    returns: vi.fn(),
    select: vi.fn(),
  }
  programsQuery.select.mockReturnValue(programsQuery)
  programsQuery.eq.mockReturnValue(programsQuery)
  programsQuery.limit.mockReturnValue(programsQuery)
  programsQuery.returns.mockResolvedValue({
    data: [{ id: "program", title: "Community program" }],
    error: null,
  })

  return {
    activeOrg: { orgId: "organization", role: "board" },
    supabase: { from: vi.fn().mockReturnValue(programsQuery) },
    user: { id: "member" },
  }
}

describe("workspace Finance report server boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolveAuthenticatedAppContextMock.mockResolvedValue(createContext())
    canViewWorkspaceFinanceMock.mockResolvedValue(true)
    loadOrganizationFinanceRecordsMock.mockResolvedValue([
      {
        id: "record",
        programId: "program",
        effectiveAt: "2026-08-13T16:00:00.000Z",
        sourceLabel: "Stripe",
        typeLabel: "Donation",
        amountCents: 5000,
        currencyCode: "USD",
        direction: "in",
        status: "reconciled",
      },
    ])
    loadOrganizationFinanceEngagementEventsMock.mockResolvedValue([
      {
        id: "engagement:event",
        effectiveAt: "2026-08-13T15:00:00.000Z",
        sourceLabel: "Fundraising page",
        typeLabel: "View",
      },
    ])
  })

  it("rejects signed-out and unauthorized report requests before loading data", async () => {
    resolveAuthenticatedAppContextMock.mockRejectedValueOnce(
      new Error("Not authenticated")
    )
    await expect(
      buildWorkspaceFinanceReportDownload({ format: "csv" })
    ).resolves.toEqual({ error: "Unauthorized", status: 401 })
    expect(loadOrganizationFinanceRecordsMock).not.toHaveBeenCalled()

    resolveAuthenticatedAppContextMock.mockResolvedValueOnce(createContext())
    canViewWorkspaceFinanceMock.mockResolvedValueOnce(false)
    await expect(
      buildWorkspaceFinanceReportDownload({ format: "csv" })
    ).resolves.toEqual({ error: "Forbidden", status: 403 })
    expect(loadOrganizationFinanceRecordsMock).not.toHaveBeenCalled()
  })

  it("exports the authorized organization records, events, and program labels", async () => {
    const result = await buildWorkspaceFinanceReportDownload({
      format: "csv",
      generatedAt: new Date("2026-08-13T18:00:00.000Z"),
    })

    expect(canViewWorkspaceFinanceMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "member" })
    )
    expect(loadOrganizationFinanceRecordsMock).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "organization" })
    )
    expect(loadOrganizationFinanceEngagementEventsMock).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "organization" })
    )
    expect(result).toMatchObject({
      contentType: "text/csv; charset=utf-8",
      fileName: "coach-house-finance-2026-08-13.csv",
    })
    expect(result).not.toHaveProperty("error")
    if (!("error" in result) && typeof result.body === "string") {
      expect(result.body).toContain(
        "record,2026-08-13T16:00:00.000Z,Stripe,Donation,Community program"
      )
      expect(result.body).toContain(
        "engagement:event,2026-08-13T15:00:00.000Z,Fundraising page,View"
      )
    }
  })

  it("returns a bounded failure instead of a partial report", async () => {
    loadOrganizationFinanceRecordsMock.mockRejectedValue(
      new Error("Records unavailable")
    )

    await expect(
      buildWorkspaceFinanceReportDownload({ format: "pdf" })
    ).resolves.toEqual({
      error: "Unable to build the Finance report.",
      status: 500,
    })
  })
})
