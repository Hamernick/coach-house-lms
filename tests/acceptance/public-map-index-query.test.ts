import { beforeEach, describe, expect, it, vi } from "vitest"

const { createSupabaseAdminClientMock } = vi.hoisted(() => ({
  createSupabaseAdminClientMock: vi.fn(),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}))

import { fetchPublicMapOrganizations } from "@/lib/queries/public-map-index"

function buildSupabaseAdminStub({
  organizations,
  programs,
}: {
  organizations: Array<{
    user_id: string
    profile: Record<string, unknown> | null
    location_lat: number | null
    location_lng: number | null
    public_slug: string | null
  }>
  programs: Array<{
    id: string
    user_id: string
    title: string | null
    subtitle: string | null
    created_at: string | null
    image_url: string | null
    location_type: "in_person" | "online" | null
  }>
}) {
  const organizationsReturns = vi.fn().mockResolvedValue({ data: organizations, error: null })
  const programsReturns = vi.fn().mockResolvedValue({ data: programs, error: null })

  const organizationsQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    returns: organizationsReturns,
  }

  const programsQuery = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    returns: programsReturns,
  }

  const from = vi.fn((table: string) => {
    if (table === "organizations") return organizationsQuery
    if (table === "programs") return programsQuery
    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    supabase: { from },
    calls: {
      from,
      organizationsQuery,
      programsQuery,
      organizationsReturns,
      programsReturns,
    },
  }
}

describe("fetchPublicMapOrganizations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns published orgs even when coordinates are missing", async () => {
    const { supabase, calls } = buildSupabaseAdminStub({
      organizations: [
        {
          user_id: "org-with-marker",
          profile: {
            name: "Atlas Org",
            tagline: "In-person programs",
            formationStatus: "approved",
            address_street: "123 Main St",
            address_city: "Brooklyn",
            address_state: "NY",
            address_country: "United States",
          },
          location_lat: 40.6782,
          location_lng: -73.9442,
          public_slug: "atlas-org",
        },
        {
          user_id: "org-without-marker",
          profile: {
            name: "Beacon Org",
            tagline: "Public profile without address",
            location_type: "online",
            location_url: "https://beacon.org/visit",
          },
          location_lat: null,
          location_lng: null,
          public_slug: "beacon-org",
        },
      ],
      programs: [
        {
          id: "program-1",
          user_id: "org-with-marker",
          title: "Neighborhood Workshops",
          subtitle: "Weekly support",
          created_at: "2026-03-01T00:00:00.000Z",
          image_url: null,
          location_type: "in_person",
        },
        {
          id: "program-2",
          user_id: "org-without-marker",
          title: "Remote Office Hours",
          subtitle: "Open to all",
          created_at: "2026-03-02T00:00:00.000Z",
          image_url: null,
          location_type: "online",
        },
      ],
    })

    createSupabaseAdminClientMock.mockReturnValue(supabase)

    const organizations = await fetchPublicMapOrganizations()

    expect(calls.from).toHaveBeenCalledWith("organizations")
    expect(calls.from).toHaveBeenCalledWith("programs")
    expect(calls.organizationsQuery.eq).toHaveBeenCalledWith("is_public", true)
    expect(calls.programsQuery.eq).toHaveBeenCalledWith("is_public", true)

    expect(organizations).toHaveLength(2)
    expect(organizations.map((organization) => organization.name)).toEqual([
      "Atlas Org",
      "Beacon Org",
    ])

    expect(organizations.find((organization) => organization.id === "org-with-marker")).toMatchObject({
      publicSlug: "atlas-org",
      formationStatus: "approved",
      latitude: 40.6782,
      longitude: -73.9442,
      city: "Brooklyn",
      state: "NY",
      country: "United States",
      programPreview: {
        id: "program-1",
        title: "Neighborhood Workshops",
      },
    })

    expect(organizations.find((organization) => organization.id === "org-without-marker")).toMatchObject({
      publicSlug: "beacon-org",
      latitude: null,
      longitude: null,
      isOnlineOnly: true,
      locationUrl: "https://beacon.org/visit",
      programPreview: {
        id: "program-2",
        title: "Remote Office Hours",
      },
    })
  })
})
