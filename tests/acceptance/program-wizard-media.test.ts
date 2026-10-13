import { describe, expect, it } from "vitest"

import {
  hydrateFromProgram,
  serializePayload,
} from "@/components/programs/program-wizard/helpers"
import { defaultProgramWizardForm } from "@/components/programs/program-wizard/schema"
import {
  resolveProgramBannerImageUrl,
  resolveProgramCardChips,
  resolveProgramSummary,
} from "@/lib/programs/display"
import { resolveProgramMediaObjectPath } from "@/lib/storage/program-media"

describe("program wizard media fields", () => {
  it("stores the banner image separately from the profile image", () => {
    const payload = serializePayload({
      ...defaultProgramWizardForm,
      title: "Future Builders Mentorship Lab",
      oneSentence: "Career-connected mentorship for transition-age youth.",
      servesWho: "Transition-age youth",
      participantReceive1: "Mentorship",
      participantReceive2: "Career coaching",
      participantReceive3: "Work-based learning",
      successOutcome1: "A defined career plan",
      startMonth: "2026-04",
      durationLabel: "8 weeks",
      frequency: "Weekly",
      bannerImageUrl: "https://example.com/program-banner.jpg",
      imageUrl: "https://example.com/program-profile.jpg",
      budgetRows: [
        {
          category: "Staff + facilitators",
          description: "Program leadership",
          costType: "Fixed",
          unit: "Program",
          units: "1",
          costPerUnit: "12000.00",
          totalCost: "12000.00",
        },
      ],
    })

    expect(payload.imageUrl).toBe("https://example.com/program-profile.jpg")
    expect(payload.wizardSnapshot?.bannerImageUrl).toBe(
      "https://example.com/program-banner.jpg",
    )
  })

  it("hydrates the separate program banner and summary from the wizard snapshot", () => {
    const form = hydrateFromProgram({
      id: "program-1",
      title: "Future Builders Mentorship Lab",
      description: "Fallback description",
      image_url: "https://example.com/program-profile.jpg",
      wizard_snapshot: {
        oneSentence: "Career-connected mentorship for transition-age youth.",
        bannerImageUrl: "https://example.com/program-banner.jpg",
      },
    })

    expect(form.bannerImageUrl).toBe("https://example.com/program-banner.jpg")
    expect(form.imageUrl).toBe("https://example.com/program-profile.jpg")
    expect(
      resolveProgramBannerImageUrl({
        wizard_snapshot: {
          bannerImageUrl: form.bannerImageUrl,
        },
      }),
    ).toBe("https://example.com/program-banner.jpg")
    expect(
      resolveProgramSummary({
        description: "Fallback description",
        wizard_snapshot: {
          oneSentence: form.oneSentence,
        },
      }),
    ).toBe("Career-connected mentorship for transition-age youth.")
  })

  it("derives program card chips from saved wizard fields", () => {
    expect(
      resolveProgramCardChips({
        duration_label: "Should be ignored when snapshot exists",
        features: ["Old feature"],
        wizard_snapshot: {
          durationLabel: "8 weeks",
          programType: "Training & Capacity Building",
          coreFormat: "Cohort",
          formatAddons: ["1:1 Support", "Digital"],
        },
      }),
    ).toEqual([
      "8 weeks",
      "Training & Capacity Building",
      "Cohort",
      "1:1 Support",
      "Digital",
    ])
  })

  it("recognizes uploaded program-media urls for cleanup", () => {
    expect(
      resolveProgramMediaObjectPath(
        "https://example.supabase.co/storage/v1/object/public/program-media/org-1/cover/banner.webp",
      ),
    ).toBe("org-1/cover/banner.webp")
    expect(
      resolveProgramMediaObjectPath("https://example.com/program-banner.jpg"),
    ).toBeNull()
  })
})
