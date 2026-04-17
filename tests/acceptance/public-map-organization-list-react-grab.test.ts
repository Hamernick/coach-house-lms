import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { PublicMapOrganizationList } from "@/components/public/public-map-index/organization-list"
import type {
  PublicMapOrganization,
  PublicMapProgramPreview,
} from "@/lib/queries/public-map-index"

function buildProgramPreview(
  overrides: Partial<PublicMapProgramPreview> = {},
): PublicMapProgramPreview {
  return {
    id: "program-1",
    title: "Community Kitchen",
    subtitle: "Weekly mutual-aid meals",
    imageUrl: "https://example.com/program.jpg",
    locationType: "in_person",
    ...overrides,
  }
}

function buildOrganization(
  overrides: Partial<PublicMapOrganization> = {},
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
  it("exposes stable semantic owner metadata for the card and its major sub-surfaces", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapOrganizationList, {
        organizations: [buildOrganization()],
        selectedOrgId: null,
        favorites: [],
        query: "",
        constrainedLayout: true,
        onSelectOrg: () => {},
        onToggleFavorite: () => {},
        onOpenDetails: () => {},
      }),
    )

    expect(markup).toContain('data-react-grab-anchor="PublicMapOrganizationListCard"')
    expect(markup).toContain(
      'data-react-grab-owner-id="public-map-organization-list-card:org-1"',
    )
    expect(markup).toContain(
      'data-react-grab-owner-source="src/components/public/public-map-index/organization-list.tsx"',
    )
    expect(markup).toContain('data-react-grab-surface-slot="favorite-button"')
    expect(markup).toContain('data-react-grab-surface-slot="body"')
    expect(markup).toContain('data-react-grab-surface-slot="identity-row"')
    expect(markup).toContain('data-react-grab-surface-slot="avatar"')
    expect(markup).toContain('data-react-grab-surface-slot="title"')
    expect(markup).toContain('data-react-grab-surface-slot="location"')
    expect(markup).toContain('data-react-grab-surface-slot="featured-program"')
    expect(markup).toContain('data-react-grab-surface-slot="program-preview-grid"')
    expect(markup).toContain('data-react-grab-surface-slot="program-preview-card"')
    expect(markup).toContain('data-react-grab-surface-slot="meta-row"')
    expect(markup).toContain('data-react-grab-surface-slot="view-button"')
  })
})
