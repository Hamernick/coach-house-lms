import { createElement, createRef } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type mapboxgl from "mapbox-gl"

import {
  PublicMapClusterMarkerButton,
  PublicMapOrganizationMarkerButton,
  PublicMapSameLocationMarkerButton,
} from "@/components/public/public-map-index/public-map-marker-overlay-buttons"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

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
    latitude: 41.8781,
    longitude: -87.6298,
    address: "Chicago, IL",
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

describe("public map marker overlay buttons", () => {
  it("renders React Grab ownership metadata on organization markers", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicMapOrganizationMarkerButton, {
        organization: buildOrganization(),
        selected: false,
        projectedX: 100,
        projectedY: 120,
        onSelect: () => undefined,
      }),
    )

    expect(markup).toContain('data-react-grab-anchor="PublicMapOrganizationMarker"')
    expect(markup).toContain('data-react-grab-owner-id="public-map-marker:org-1"')
    expect(markup).toContain(
      'data-react-grab-owner-source="src/components/public/public-map-index/public-map-marker-overlay-buttons.tsx"',
    )
  })

  it("renders React Grab ownership metadata on cluster markers", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicMapClusterMarkerButton, {
        clusterId: 42,
        pointCount: 7,
        coordinates: [-87.6298, 41.8781] as [number, number],
        projectedX: 200,
        projectedY: 160,
        mapRef: createRef<mapboxgl.Map | null>(),
        mapLoadedRef: createRef<boolean>(),
      }),
    )

    expect(markup).toContain('data-react-grab-anchor="PublicMapClusterMarker"')
    expect(markup).toContain('data-react-grab-owner-id="public-map-cluster-marker:42"')
  })

  it("renders React Grab ownership metadata on same-location markers", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicMapSameLocationMarkerButton, {
        groupKey: "-87.629800:41.878100",
        organizations: [
          buildOrganization(),
          buildOrganization({ id: "org-2", name: "Beta Org" }),
        ],
        locationLabel: "Chicago, IL",
        projectedX: 240,
        projectedY: 220,
        selected: true,
        onOpenGroup: () => undefined,
      }),
    )

    expect(markup).toContain('data-react-grab-anchor="PublicMapSameLocationMarker"')
    expect(markup).toContain(
      'data-react-grab-owner-id="public-map-same-location-marker:-87.629800:41.878100"',
    )
  })
})
