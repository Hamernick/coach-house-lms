import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { buildInitialOrganizationProfile } from "@/app/(dashboard)/my-organization/_lib/helpers"
import {
  resolveOrganizationProfileComplete as resolvePageProfileComplete,
} from "@/app/(dashboard)/my-organization/_lib/my-organization-page-content-helpers"
import {
  resolveOrganizationProfileComplete as resolveWorkspaceSeedProfileComplete,
} from "@/app/(dashboard)/my-organization/_lib/my-organization-workspace-seed-helpers"
import { OrgProfilePublicAboutSection } from "@/components/organization/org-profile-card/public-card-sections"
import { StoryPreview } from "@/components/organization/org-profile-card/tabs/company-tab/display-sections"
import { cleanupOrgProfileHtml } from "@/lib/organization/profile-cleanup"

describe("organization profile story contract", () => {
  it("hydrates the added story fields from both camelCase and snake_case profile keys", () => {
    const legacyProfile = buildInitialOrganizationProfile({
      profile: {
        name: "Atlas Org",
        origin_story: "Legacy origin story",
        theory_of_change: "Legacy theory of change",
      },
      organization: {
        ein: null,
        public_slug: "atlas-org",
        is_public: true,
      },
    })

    const currentProfile = buildInitialOrganizationProfile({
      profile: {
        name: "Beacon Org",
        originStory: "Current origin story",
        theoryOfChange: "Current theory of change",
      },
      organization: {
        ein: null,
        public_slug: "beacon-org",
        is_public: true,
      },
    })

    expect(legacyProfile.originStory).toBe("Legacy origin story")
    expect(legacyProfile.theoryOfChange).toBe("Legacy theory of change")
    expect(currentProfile.originStory).toBe("Current origin story")
    expect(currentProfile.theoryOfChange).toBe("Current theory of change")
  })

  it("sanitizes and renders the added story fields in the internal and public profile views", () => {
    const cleaned = cleanupOrgProfileHtml({
      originStory: "<p>Started in a church basement.</p>",
      theoryOfChange: "<strong>Pair coaching with shared tools.</strong>",
    })

    expect(cleaned.nextProfile.originStory).toBe("Started in a church basement.")
    expect(cleaned.nextProfile.theoryOfChange).toBe("Pair coaching with shared tools.")

    const company = {
      name: "Atlas Org",
      description: "",
      tagline: "",
      ein: "",
      formationStatus: "approved" as const,
      rep: "",
      email: "",
      phone: "",
      address: "",
      addressStreet: "",
      addressCity: "",
      addressState: "",
      addressPostal: "",
      addressCountry: "",
      locationType: "in_person" as const,
      locationUrl: "",
      logoUrl: "",
      brandMarkUrl: "",
      headerUrl: "",
      publicUrl: "",
      twitter: "",
      facebook: "",
      linkedin: "",
      instagram: "",
      youtube: "",
      tiktok: "",
      newsletter: "",
      github: "",
      vision: "Every neighborhood can access trusted support.",
      mission: "Equip local operators with tools and coaching.",
      need: "Families face fragmented systems.",
      values: "Care, clarity, rigor",
      originStory: "Started in a church basement.",
      theoryOfChange: "Pair coaching with shared tools.",
      programs: "",
      reports: "",
      boilerplate: "",
      brandPrimary: "",
      brandColors: [],
      brandThemePresetId: "",
      brandAccentPresetId: "",
      brandTypographyPresetId: "",
      brandTypography: null,
      publicSlug: "atlas-org",
      isPublic: true,
    }

    const previewMarkup = renderToStaticMarkup(
      createElement(StoryPreview, {
        company,
        addressLines: [],
        hasAnyBrandLink: false,
      }),
    )
    const publicMarkup = renderToStaticMarkup(
      createElement(OrgProfilePublicAboutSection, {
        description: "",
        originStory: company.originStory ?? "",
        need: company.need ?? "",
        mission: company.mission ?? "",
        vision: company.vision ?? "",
        values: company.values ?? "",
        theoryOfChange: company.theoryOfChange ?? "",
      }),
    )

    expect(previewMarkup).toContain("Origin story")
    expect(previewMarkup).toContain("Theory of change")
    expect(previewMarkup).toContain("Started in a church basement.")
    expect(publicMarkup).toContain("Origin story")
    expect(publicMarkup).toContain("Need statement")
    expect(publicMarkup).toContain("Theory of change")
    expect(publicMarkup).toContain("Pair coaching with shared tools.")
  })

  it("counts the added story fields toward organization profile completeness", () => {
    const profile = {
      name: "Atlas Org",
      tagline: "",
      description: "",
      formationStatus: "",
      originStory: "Started after repeated service gaps.",
      theoryOfChange: "Train operators and connect families earlier.",
      mission: "",
      vision: "",
      need: "",
    }

    expect(resolvePageProfileComplete(profile)).toBe(true)
    expect(resolveWorkspaceSeedProfileComplete(profile)).toBe(true)
  })
})
