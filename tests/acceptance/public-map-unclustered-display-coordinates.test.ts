import { describe, expect, it, vi } from "vitest"
import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { resolveUnclusteredDisplayCoordinates } from "@/components/public/public-map-index/unclustered-display-coordinates"

function buildOrganization(
  id: string,
  longitude: number,
  latitude: number,
): PublicMapOrganization {
  return {
    id,
    name: `Organization ${id}`,
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
    latitude,
    longitude,
    address: null,
    addressStreet: null,
    addressPostal: null,
    city: "Chicago",
    state: "IL",
    country: "United States",
    locationUrl: null,
    publicSlug: id,
    programPreview: null,
    programs: [],
    programCount: 0,
    groups: ["community"],
    primaryGroup: "community",
    isOnlineOnly: false,
  }
}

function buildFeature(organizationId: string, longitude: number, latitude: number) {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    properties: {
      organizationId,
      name: `Organization ${organizationId}`,
    },
  } as unknown as mapboxgl.MapboxGeoJSONFeature
}

describe("resolveUnclusteredDisplayCoordinates", () => {
  it("fans out duplicate-coordinate organizations into distinct clickable marker positions", () => {
    const map = {
      getCenter: vi.fn().mockReturnValue({ lng: -87.6298, lat: 41.8781 }),
      project: vi.fn(() => ({ x: 320, y: 240 })),
      unproject: vi.fn(([x, y]: [number, number]) => ({
        lng: -87.6298 + (x - 320) / 10_000,
        lat: 41.8781 + (y - 240) / 10_000,
      })),
    } as unknown as mapboxgl.Map

    const organizationById = new Map<string, PublicMapOrganization>([
      ["org-1", buildOrganization("org-1", -87.6298, 41.8781)],
      ["org-2", buildOrganization("org-2", -87.6298, 41.8781)],
    ])

    const displayCoordinates = resolveUnclusteredDisplayCoordinates({
      map,
      features: [
        buildFeature("org-1", -87.6298, 41.8781),
        buildFeature("org-2", -87.6298, 41.8781),
      ],
      organizationById,
    })

    const first = displayCoordinates.get("org-1")
    const second = displayCoordinates.get("org-2")
    expect(first).toBeTruthy()
    expect(second).toBeTruthy()
    expect(first).not.toEqual(second)
  })

  it("buckets by canonical organization coordinates instead of feature drift", () => {
    const map = {
      getCenter: vi.fn().mockReturnValue({ lng: -87.6298, lat: 41.8781 }),
      project: vi.fn(() => ({ x: 320, y: 240 })),
      unproject: vi.fn(([x, y]: [number, number]) => ({
        lng: -87.6298 + (x - 320) / 10_000,
        lat: 41.8781 + (y - 240) / 10_000,
      })),
    } as unknown as mapboxgl.Map

    const organizationById = new Map<string, PublicMapOrganization>([
      ["org-1", buildOrganization("org-1", -87.6298, 41.8781)],
      ["org-2", buildOrganization("org-2", -87.6298, 41.8781)],
    ])

    const displayCoordinates = resolveUnclusteredDisplayCoordinates({
      map,
      features: [
        buildFeature("org-1", -87.6296, 41.8781),
        buildFeature("org-2", -87.6300, 41.8781),
      ],
      organizationById,
    })

    expect(displayCoordinates.get("org-1")).toBeTruthy()
    expect(displayCoordinates.get("org-2")).toBeTruthy()
    expect(displayCoordinates.get("org-1")).not.toEqual(displayCoordinates.get("org-2"))
  })
})
