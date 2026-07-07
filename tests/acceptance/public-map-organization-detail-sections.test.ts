import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  OrganizationDetailActivitiesSection,
  OrganizationDetailBrandKitSection,
  OrganizationDetailOriginSection,
} from "@/components/public/public-map-index/organization-detail-sections"
import { PublicMapOrganizationDetail } from "@/components/public/public-map-index/organization-detail"
import { OrganizationDetailResourceLinksSection } from "@/components/public/public-map-index/organization-detail-resource-links-section"
import {
  PUBLIC_MAP_SIDEBAR_SECTION_ALT_CLASSNAME,
  PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME,
} from "@/components/public/public-map-index/sidebar-theme"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

function buildOrganization(
  overrides: Partial<PublicMapOrganization> = {}
): PublicMapOrganization {
  return {
    id: "org-1",
    name: "Atlas Collective",
    tagline: "Neighborhood support",
    description: "Atlas supports local families through civic programming.",
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
    latitude: null,
    longitude: null,
    address: null,
    addressStreet: null,
    addressPostal: null,
    city: null,
    state: null,
    country: null,
    locationUrl: null,
    publicSlug: "atlas-collective",
    activityLinks: [],
    programPreview: null,
    programs: [],
    programCount: 0,
    groups: ["community"],
    primaryGroup: "community",
    isOnlineOnly: false,
    ...overrides,
  }
}

describe("public map detail section chrome", () => {
  it("does not apply a drop shadow to detail section surfaces", () => {
    expect(PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME).toContain(
      "rounded-xl border border-border/70 bg-background/75"
    )
    expect(PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME).not.toContain("shadow")
    expect(PUBLIC_MAP_SIDEBAR_SECTION_ALT_CLASSNAME).toContain(
      "rounded-xl border border-border/70 bg-background/85"
    )
    expect(PUBLIC_MAP_SIDEBAR_SECTION_ALT_CLASSNAME).not.toContain("shadow")
  })

  it("renders brand kit content without the visible parent container chrome", () => {
    const organization = buildOrganization({
      brandKitAvailable: true,
      logoUrl: "https://example.org/logo.png",
      brandMarkUrl: "https://example.org/mark.png",
      publicSlug: "atlas-collective",
    })

    const sectionMarkup = renderToStaticMarkup(
      React.createElement(OrganizationDetailBrandKitSection, {
        organization,
        brandKitDownloadHref:
          "/api/public/organizations/atlas-collective/brand-kit",
      })
    )
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapOrganizationDetail, {
        organization,
        favorites: [],
        onBack: () => {},
        onToggleFavorite: () => {},
      })
    )

    expect(sectionMarkup).toContain('<section class="p-2.5">')
    expect(sectionMarkup).not.toContain(
      `p-2.5 ${PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME}`
    )
    expect(markup).toContain('<p class="text-sm font-medium">Brand kit</p>')
    expect(markup).toContain(">Download<")
    expect(markup).toContain("Primary logo")
    expect(markup).toContain("Logo mark")
    expect(markup).toContain("https://example.org/mark.png")
  })
})

describe("OrganizationDetailOriginSection", () => {
  it('renders the section title as "About"', () => {
    const markup = renderToStaticMarkup(
      React.createElement(OrganizationDetailOriginSection, {
        storyFields: [
          {
            label: "Origin story",
            value: "Started after repeated service gaps.",
          },
        ],
        expandedStoryFields: {},
        onToggleField: () => {},
      })
    )

    expect(markup).toContain(">About<")
    expect(markup).not.toContain(">Origin<")
    expect(markup).toContain("Origin story")
  })
})

describe("OrganizationDetailResourceLinksSection", () => {
  it("renders activity links from org-created public activity", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OrganizationDetailResourceLinksSection, {
        resources: [
          {
            key: "activity:resource-1:location",
            label: "Youth Resource Hub",
            href: "https://example.org/resources",
            domain: "example.org",
            kind: "online_resource",
            kindLabel: "Web resource",
            note: "Web resource · Ongoing",
          },
        ],
      })
    )

    expect(markup).toContain(">Links from activities<")
    expect(markup).toContain(">1<")
    expect(markup).toContain(
      "Links attached to published programs, events, services, and web resources from this organization."
    )
    expect(markup).toContain("Youth Resource Hub")
    expect(markup).toContain("example.org")
    expect(markup).toContain("Web resource · Ongoing")
    expect(markup).not.toContain(">Resources<")
    expect(markup).not.toContain(">Activity links<")
    expect(markup).not.toContain("Needs review")
    expect(markup).not.toContain("Coach House reviewed")
    expect(markup).not.toContain("Reviewed source")
    expect(markup).not.toContain("Verified source")
    expect(markup).not.toContain("Scraped")
    expect(markup).not.toContain("AI")
  })
})

describe("OrganizationDetailActivitiesSection", () => {
  it("renders public organization activities with kind and link actions", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OrganizationDetailActivitiesSection, {
        activities: [
          {
            id: "program-1",
            title: "Youth Resource Hub",
            subtitle: null,
            description: "A public information hub for youth services.",
            activityKind: "Web resource",
            chips: ["Web resource", "Digital"],
            ctaLabel: "Open hub",
            ctaUrl: "https://hub.example.org",
            durationLabel: "Ongoing",
            locationUrl: "https://hub.example.org",
            locationType: "online",
          },
        ],
      })
    )

    expect(markup).toContain(">Activity<")
    expect(markup).not.toContain("Featured Programs")
    expect(markup).toContain("Youth Resource Hub")
    expect(markup).toContain("A public information hub for youth services.")
    expect(markup).toContain("Web resource")
    expect(markup).toContain("Ongoing")
    expect(markup).toContain("Online")
    expect(markup).toContain("https://hub.example.org")
  })

  it("renders the full activity list from activity metadata, not the visual preview cap", () => {
    const activities: PublicMapOrganization["activityLinks"] = Array.from(
      { length: 7 },
      (_, index): PublicMapOrganization["activityLinks"][number] => {
        const number = index + 1
        return {
          id: `activity-${number}`,
          title: `Activity ${number}`,
          subtitle: null,
          description: `Public activity ${number}`,
          activityKind: number === 7 ? "Web resource" : "Program",
          chips: [number === 7 ? "Web resource" : "Program"],
          ctaLabel: null,
          ctaUrl: number === 7 ? "https://example.org/seven" : null,
          durationLabel: "Ongoing",
          locationUrl: null,
          locationType: number === 7 ? "online" : "in_person",
        }
      }
    )

    const markup = renderToStaticMarkup(
      React.createElement(OrganizationDetailActivitiesSection, {
        activities,
      })
    )

    expect(markup).toContain(">7<")
    expect(markup).toContain("Activity 7")
    expect(markup).toContain("Public activity 7")
    expect(markup).toContain("https://example.org/seven")
  })
})
