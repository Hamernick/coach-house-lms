import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { PublicMapOrganizationList } from "@/components/public/public-map-index/organization-list"
import type {
  PublicMapOrganization,
  PublicMapProgramPreview,
} from "@/lib/queries/public-map-index"

function buildProgramPreview(
  overrides: Partial<PublicMapProgramPreview> = {}
): PublicMapProgramPreview {
  return {
    id: "program-1",
    title: "Community Kitchen",
    subtitle: "Weekly mutual-aid meals",
    description: "Weekly mutual-aid meals",
    activityKind: "Program",
    chips: ["Program", "Weekly"],
    ctaLabel: "Learn more",
    ctaUrl: "https://example.com/kitchen",
    durationLabel: "Weekly",
    imageUrl: "https://example.com/program.jpg",
    locationUrl: null,
    locationType: "in_person",
    startDate: null,
    ...overrides,
  }
}

function buildOrganization(
  overrides: Partial<PublicMapOrganization> = {}
): PublicMapOrganization {
  return {
    id: "org-1",
    name: "Atlas Collective",
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
    logoUrl: "https://example.com/logo.png",
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
    publicSlug: "atlas-collective",
    activityLinks: [],
    programPreview: buildProgramPreview(),
    programs: [
      buildProgramPreview(),
      buildProgramPreview({
        id: "program-2",
        title: "Youth Studio",
      }),
    ],
    programCount: 2,
    groups: ["community"],
    primaryGroup: "community",
    isOnlineOnly: false,
    ...overrides,
  }
}

describe("public map organization list react grab", () => {
  it("supports scroll-pagination batches with a load-more fallback", () => {
    const organizations = Array.from({ length: 10 }, (_, index) =>
      buildOrganization({
        id: `org-${index + 1}`,
        name: `Resource ${index + 1}`,
        publicSlug: `resource-${index + 1}`,
      })
    )
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapOrganizationList, {
        organizations,
        selectedOrgId: null,
        query: "",
        constrainedLayout: true,
        incrementalLoading: true,
        initialVisibleCount: 4,
        pageSize: 3,
        onSelectOrg: () => {},
        onOpenDetails: () => {},
      })
    )

    expect(markup).toContain("Resource 1")
    expect(markup).toContain("Resource 4")
    expect(markup).not.toContain("Resource 5")
    expect(markup).toContain('data-public-map-list-pagination="true"')
    expect(markup).toContain('data-public-map-list-load-sentinel="true"')
    expect(markup).toContain("Showing 4 of 10 resources")
    expect(markup).toContain("Load 3 more")
  })

  it("includes a selected organization even when it is beyond the first scroll page", () => {
    const organizations = Array.from({ length: 10 }, (_, index) =>
      buildOrganization({
        id: `org-${index + 1}`,
        name: `Resource ${index + 1}`,
        publicSlug: `resource-${index + 1}`,
      })
    )
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapOrganizationList, {
        organizations,
        selectedOrgId: "org-7",
        query: "",
        constrainedLayout: true,
        incrementalLoading: true,
        initialVisibleCount: 4,
        pageSize: 3,
        onSelectOrg: () => {},
        onOpenDetails: () => {},
      })
    )

    expect(markup).toContain("Resource 7")
    expect(markup).not.toContain("Resource 8")
    expect(markup).toContain("Showing 7 of 10 resources")
    expect(markup).toContain("Load 3 more")
  })

  it("exposes stable semantic owner metadata for the card and its major sub-surfaces", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapOrganizationList, {
        organizations: [buildOrganization()],
        selectedOrgId: null,
        query: "",
        constrainedLayout: true,
        onSelectOrg: () => {},
        onOpenDetails: () => {},
      })
    )

    expect(markup).toContain(
      'data-react-grab-anchor="PublicMapOrganizationListCard"'
    )
    expect(markup).toContain(
      'data-react-grab-owner-id="public-map-organization-list-card:org-1"'
    )
    expect(markup).toContain(
      'data-react-grab-owner-source="src/components/public/public-map-index/organization-list.tsx"'
    )
    expect(markup).not.toContain(
      'data-react-grab-surface-slot="favorite-button"'
    )
    expect(markup).not.toContain("Add Atlas Collective to favorites")
    expect(markup).toContain('data-react-grab-surface-slot="body"')
    expect(markup).toContain('data-react-grab-surface-slot="identity-row"')
    expect(markup).toContain('data-react-grab-surface-slot="avatar"')
    expect(markup).toContain('data-react-grab-surface-slot="title"')
    expect(markup).toContain('data-react-grab-surface-slot="location"')
    expect(markup).toContain('data-react-grab-surface-slot="featured-program"')
    expect(markup).toContain(
      'data-react-grab-surface-slot="program-preview-grid"'
    )
    expect(markup).toContain(
      'data-react-grab-surface-slot="program-preview-card"'
    )
    expect(markup).toContain('data-react-grab-surface-slot="meta-row"')
    expect(markup).toContain('data-react-grab-surface-slot="view-button"')
    expect(markup).toContain("Program")
    expect(markup).toContain("Weekly")
    expect(markup).toContain("Weekly mutual-aid meals")
    expect(markup).toContain("https://example.com/kitchen")
    expect(markup).not.toContain("Featured Programs")
  })
})
