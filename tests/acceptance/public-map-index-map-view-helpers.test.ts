import { describe, expect, it, vi } from "vitest"
import type mapboxgl from "mapbox-gl"

import {
  buildPublicMapOrganizationFeatureCollection,
  CHICAGO_FALLBACK_CENTER,
  CHICAGO_FALLBACK_ZOOM,
  focusChicagoFallback,
  PUBLIC_MAP_CAMERA_EDGE_PADDING,
  PUBLIC_MAP_SIDEBAR_MAX_WIDTH,
  PUBLIC_MAP_SIDEBAR_MIN_WIDTH,
  PUBLIC_MAP_SIDEBAR_MIN_VISIBLE_MAP_WIDTH,
  resolvePublicMapCameraPadding,
  resolvePublicMapSidebarWidth,
} from "@/components/public/public-map-index/map-view-helpers"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

describe("focusChicagoFallback", () => {
  it("centers the map on Chicago when browser location is unavailable or denied", () => {
    const easeTo = vi.fn()
    const map = {
      easeTo,
    } as unknown as mapboxgl.Map

    focusChicagoFallback({
      map,
      duration: 450,
    })

    expect(easeTo).toHaveBeenCalledWith({
      center: CHICAGO_FALLBACK_CENTER,
      zoom: CHICAGO_FALLBACK_ZOOM,
      duration: 450,
    })
  })
})

describe("resolvePublicMapSidebarWidth", () => {
  it("returns zero when the sidebar is hidden", () => {
    expect(
      resolvePublicMapSidebarWidth({
        surfaceWidth: 1200,
        sidebarMode: "hidden",
      }),
    ).toBe(0)
  })

  it("caps width at desktop maximum when space is available", () => {
    expect(
      resolvePublicMapSidebarWidth({
        surfaceWidth: 1600,
        sidebarMode: "search",
      }),
    ).toBe(PUBLIC_MAP_SIDEBAR_MAX_WIDTH)
  })

  it("keeps the minimum sidebar width when there is still enough map area", () => {
    expect(
      resolvePublicMapSidebarWidth({
        surfaceWidth: 280,
        sidebarMode: "details",
      }),
    ).toBe(PUBLIC_MAP_SIDEBAR_MIN_WIDTH)
  })

  it("shrinks sidebar width below minimum to preserve map visibility on very narrow surfaces", () => {
    expect(
      resolvePublicMapSidebarWidth({
        surfaceWidth: 240,
        sidebarMode: "details",
      }),
    ).toBe(240 - PUBLIC_MAP_SIDEBAR_MIN_VISIBLE_MAP_WIDTH)
  })
})

describe("resolvePublicMapCameraPadding", () => {
  it("adds sidebar inset to left camera padding while keeping edge gutters", () => {
    expect(resolvePublicMapCameraPadding(320)).toEqual({
      top: PUBLIC_MAP_CAMERA_EDGE_PADDING,
      right: PUBLIC_MAP_CAMERA_EDGE_PADDING,
      bottom: PUBLIC_MAP_CAMERA_EDGE_PADDING,
      left: 320 + PUBLIC_MAP_CAMERA_EDGE_PADDING,
    })
  })

  it("falls back to symmetric edge padding with no sidebar inset", () => {
    expect(resolvePublicMapCameraPadding(0)).toEqual({
      top: PUBLIC_MAP_CAMERA_EDGE_PADDING,
      right: PUBLIC_MAP_CAMERA_EDGE_PADDING,
      bottom: PUBLIC_MAP_CAMERA_EDGE_PADDING,
      left: PUBLIC_MAP_CAMERA_EDGE_PADDING,
    })
  })
})

describe("buildPublicMapOrganizationFeatureCollection", () => {
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
      latitude: 41.8781,
      longitude: -87.6298,
      address: null,
      addressStreet: null,
      addressPostal: null,
      city: "Chicago",
      state: "IL",
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

  it("emits only organizations with map coordinates", () => {
    const featureCollection = buildPublicMapOrganizationFeatureCollection([
      buildOrganization({ id: "mapped-org", longitude: -87.62, latitude: 41.88 }),
      buildOrganization({ id: "profile-only-org", latitude: null, longitude: null }),
    ])

    expect(featureCollection.type).toBe("FeatureCollection")
    expect(featureCollection.features).toHaveLength(1)
    expect(featureCollection.features[0]?.properties.organizationId).toBe("mapped-org")
    expect(featureCollection.features[0]?.geometry.coordinates).toEqual([-87.62, 41.88])
  })
})
