import { beforeEach, describe, expect, it, vi } from "vitest"

const { authorizeOrganizationGeocodingCronRequestMock, runOrganizationGeocodeSweepMock } = vi.hoisted(() => ({
  authorizeOrganizationGeocodingCronRequestMock: vi.fn(),
  runOrganizationGeocodeSweepMock: vi.fn(),
}))

vi.mock("@/features/organization-geocoding", () => ({
  authorizeOrganizationGeocodingCronRequest: authorizeOrganizationGeocodingCronRequestMock,
  runOrganizationGeocodeSweep: runOrganizationGeocodeSweepMock,
}))

import { GET } from "@/app/api/internal/cron/organization-geocoding/route"

describe("organization geocoding cron route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects unauthorized requests", async () => {
    authorizeOrganizationGeocodingCronRequestMock.mockReturnValue({
      ok: false,
      status: 401,
      error: "Unauthorized",
    })

    const response = await GET(new Request("http://localhost/api/internal/cron/organization-geocoding"))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toEqual({ error: "Unauthorized" })
    expect(runOrganizationGeocodeSweepMock).not.toHaveBeenCalled()
  })

  it("returns the sweep payload for authorized requests", async () => {
    authorizeOrganizationGeocodingCronRequestMock.mockReturnValue({ ok: true })
    runOrganizationGeocodeSweepMock.mockResolvedValue({
      scanned: 4,
      updated: 2,
      failed: 1,
      skippedMissingAddress: 1,
      skippedOnlineOnly: 0,
      updatedOrganizations: [
        { orgId: "org-1", name: "Atlas Org" },
        { orgId: "org-2", name: "Beacon Org" },
      ],
    })

    const response = await GET(
      new Request("http://localhost/api/internal/cron/organization-geocoding", {
        headers: { authorization: "Bearer test-secret" },
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({
      scanned: 4,
      updated: 2,
      failed: 1,
      skippedMissingAddress: 1,
      skippedOnlineOnly: 0,
      updatedOrganizations: [
        { orgId: "org-1", name: "Atlas Org" },
        { orgId: "org-2", name: "Beacon Org" },
      ],
    })
  })
})
