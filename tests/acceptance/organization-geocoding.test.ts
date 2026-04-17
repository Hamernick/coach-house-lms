import { beforeEach, describe, expect, it, vi } from "vitest"

const { geocodeAddressMock } = vi.hoisted(() => ({
  geocodeAddressMock: vi.fn(),
}))

vi.mock("@/lib/geocoding/geocode", async () => {
  const { buildOrganizationGeocodeQueries } = await import("@/lib/location/organization-location")

  return {
    geocodeAddress: geocodeAddressMock,
    geocodeOrganizationLocation: async (input: Parameters<typeof buildOrganizationGeocodeQueries>[0]) => {
      const queries = buildOrganizationGeocodeQueries(input)
      for (const query of queries) {
        const result = await geocodeAddressMock(query)
        if (result) return result
      }
      return null
    },
  }
})

import {
  authorizeOrganizationGeocodingCronRequest,
  runOrganizationGeocodeSweep,
} from "@/features/organization-geocoding/server/actions"

function createOrganizationsSupabaseStub(
  rows: Array<{
    user_id: string
    profile: Record<string, unknown> | null
    location_lat: number | null
    location_lng: number | null
    updated_at: string
  }>,
) {
  const selectReturns = vi.fn().mockResolvedValue({ data: rows, error: null })
  const updateTargets: Array<{ column: string; value: string }> = []
  const updatePayloads: Array<Record<string, unknown>> = []

  const organizationsTable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    returns: selectReturns,
    update: vi.fn((payload: Record<string, unknown>) => {
      updatePayloads.push(payload)
      return {
        eq: vi.fn((column: string, value: string) => {
          updateTargets.push({ column, value })
          return Promise.resolve({ error: null })
        }),
      }
    }),
  }

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table !== "organizations") {
          throw new Error(`Unexpected table: ${table}`)
        }

        return organizationsTable
      }),
    },
    calls: {
      organizationsTable,
      updateTargets,
      updatePayloads,
    },
  }
}

describe("organization geocoding", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it("authorizes requests with the configured cron secret", () => {
    vi.stubEnv("INTERNAL_CRON_SECRET", "test-secret")

    const result = authorizeOrganizationGeocodingCronRequest(
      new Request("http://localhost/api/internal/cron/organization-geocoding", {
        headers: { authorization: "Bearer test-secret" },
      }),
    )

    expect(result).toEqual({ ok: true })
  })

  it("repairs public organizations with addresses and missing coordinates", async () => {
    geocodeAddressMock.mockImplementation(async (address: string) => {
      if (address === "Chicago, IL, 60601, United States") {
        return { lat: 41.8781, lng: -87.6298 }
      }
      return null
    })

    const { supabase, calls } = createOrganizationsSupabaseStub([
      {
        user_id: "org-1",
        profile: {
          name: "Atlas Org",
          address_street: "123 Main St",
          address_city: "Chicago",
          address_state: "IL",
          address_postal: "60601",
          address_country: "United States",
        },
        location_lat: null,
        location_lng: null,
        updated_at: "2026-04-14T23:00:00.000Z",
      },
      {
        user_id: "org-2",
        profile: {
          name: "Remote Org",
          location_type: "online",
          address: "Zoom",
        },
        location_lat: null,
        location_lng: null,
        updated_at: "2026-04-14T22:00:00.000Z",
      },
      {
        user_id: "org-3",
        profile: {
          name: "Unknown Address Org",
        },
        location_lat: null,
        location_lng: null,
        updated_at: "2026-04-14T21:00:00.000Z",
      },
      {
        user_id: "org-4",
        profile: {
          name: "Bad Address Org",
          address: "Definitely not resolvable",
        },
        location_lat: null,
        location_lng: null,
        updated_at: "2026-04-14T20:00:00.000Z",
      },
    ])

    const result = await runOrganizationGeocodeSweep({
      limit: 10,
      supabase: supabase as never,
    })

    expect(calls.organizationsTable.eq).toHaveBeenCalledWith("is_public", true)
    expect(calls.organizationsTable.or).toHaveBeenCalledWith("location_lat.is.null,location_lng.is.null")
    expect(calls.organizationsTable.order).toHaveBeenCalledWith("updated_at", { ascending: false })
    expect(calls.organizationsTable.limit).toHaveBeenCalledWith(10)
    expect(geocodeAddressMock).toHaveBeenCalledWith("123 Main St, Chicago, IL, 60601, United States")
    expect(geocodeAddressMock).toHaveBeenCalledWith("123 Main St, Chicago, IL, United States")
    expect(geocodeAddressMock).toHaveBeenCalledWith("Chicago, IL, 60601, United States")
    expect(geocodeAddressMock).toHaveBeenCalledWith("Definitely not resolvable")
    expect(result).toEqual({
      scanned: 4,
      updated: 1,
      failed: 1,
      skippedMissingAddress: 1,
      skippedOnlineOnly: 1,
      updatedOrganizations: [{ orgId: "org-1", name: "Atlas Org" }],
    })
    expect(calls.updatePayloads).toEqual([
      {
        location_lat: 41.8781,
        location_lng: -87.6298,
      },
    ])
    expect(calls.updateTargets).toEqual([{ column: "user_id", value: "org-1" }])
  })
})
