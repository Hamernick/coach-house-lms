import { describe, expect, it } from "vitest"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import {
  buildPublicMapSearchIndex,
  filterPublicMapOrganizationIds,
} from "@/components/public/public-map-index/search-index"

function buildOrganization(overrides: Partial<PublicMapOrganization> = {}): PublicMapOrganization {
  return {
    id: "org-1",
    name: "Alpha Org",
    tagline: null,
    description: null,
    boilerplate: null,
    vision: null,
    mission: null,
    values: null,
    needStatement: null,
    originStory: null,
    theoryOfChange: null,
    formationStatus: null,
    contactName: null,
    logoUrl: null,
    brandMarkUrl: null,
    headerUrl: null,
    website: null,
    email: null,
    phone: null,
    twitter: null,
    facebook: null,
    linkedin: null,
    instagram: null,
    brandPrimary: null,
    brandColors: [],
    brandThemePresetId: null,
    brandAccentPresetId: null,
    brandTypographyPresetId: null,
    brandTypography: null,
    brandKitAvailable: false,
    latitude: 40.7128,
    longitude: -74.006,
    address: null,
    addressStreet: null,
    addressPostal: null,
    city: "New York",
    state: "NY",
    country: "United States",
    locationUrl: null,
    publicSlug: "alpha-org",
    programPreview: null,
    programs: [],
    programCount: 0,
    groups: ["community"],
    primaryGroup: "community",
    isOnlineOnly: false,
    ...overrides,
  }
}

describe("public map search index", () => {
  it("matches against indexed narrative and program fields", () => {
    const organizations = [
      buildOrganization({
        id: "alpha",
        name: "Alpha Org",
        originStory: "Started as a neighborhood food rescue collective.",
      }),
      buildOrganization({
        id: "beacon",
        name: "Beacon Org",
        programs: [
          {
            id: "program-1",
            title: "Family Justice Accelerator",
            subtitle: null,
            imageUrl: null,
            locationType: null,
          },
        ],
      }),
    ]

    const index = buildPublicMapSearchIndex(organizations)
    const originResults = filterPublicMapOrganizationIds({
      organizations,
      searchIndex: index,
      query: "food rescue",
      appliedBounds: null,
      favorites: [],
      activeGroup: "all",
    })
    const programResults = filterPublicMapOrganizationIds({
      organizations,
      searchIndex: index,
      query: "justice accelerator",
      appliedBounds: null,
      favorites: [],
      activeGroup: "all",
    })

    expect(originResults).toEqual(["alpha"])
    expect(programResults).toEqual(["beacon"])
  })

  it("keeps online-only organizations when bounds are applied", () => {
    const organizations = [
      buildOrganization({
        id: "mapped-org",
        name: "Atlas Org",
        latitude: 40.7128,
        longitude: -74.006,
      }),
      buildOrganization({
        id: "web-resource-org",
        name: "Beacon Resource",
        latitude: null,
        longitude: null,
        isOnlineOnly: true,
        locationUrl: "https://beacon.org/resource",
      }),
    ]

    const index = buildPublicMapSearchIndex(organizations)
    const results = filterPublicMapOrganizationIds({
      organizations,
      searchIndex: index,
      query: "",
      appliedBounds: {
        west: -75,
        south: 40,
        east: -73,
        north: 41,
      },
      favorites: [],
      activeGroup: "all",
    })

    expect(results).toEqual(["mapped-org", "web-resource-org"])
  })
})
