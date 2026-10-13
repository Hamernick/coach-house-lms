import { describe, expect, it } from "vitest"

import { resolveAcceleratorReadiness } from "@/lib/accelerator/readiness"
import type { ModuleCardStatus } from "@/lib/accelerator/progress"
import type { RoadmapSection, RoadmapSectionStatus } from "@/lib/roadmap"

function makeSection(id: string, status: RoadmapSectionStatus, content = "Filled content"): RoadmapSection {
  return {
    id,
    title: id,
    subtitle: id,
    slug: id,
    titleExample: undefined,
    subtitleExample: undefined,
    prompt: "",
    placeholder: "",
    content: status === "not_started" ? "" : content,
    imageUrl: undefined,
    lastUpdated: null,
    isPublic: false,
    layout: "square",
    status,
    ctaLabel: undefined,
    ctaUrl: undefined,
    homework: null,
    templateTitle: id,
    templateSubtitle: id,
    titleIsTemplate: false,
    subtitleIsTemplate: false,
  }
}

function makeModule(slug: string, status: ModuleCardStatus) {
  return { slug, status }
}

describe("accelerator readiness", () => {
  const coreSections = [
    "origin_story",
    "need",
    "mission_vision_values",
    "theory_of_change",
    "program",
  ].map((id) => makeSection(id, "complete"))

  const baseProfile = {
    name: "Bright Futures",
    tagline: "Impact from idea to launch",
    mission: "Support families",
    need: "Absenteeism support gap",
    values: "Stewardship",
    address_city: "Los Angeles",
    address_state: "CA",
  }

  it("returns Building when hard requirements are missing", () => {
    const readiness = resolveAcceleratorReadiness({
      profile: {
        ...baseProfile,
        formationStatus: "in_progress",
      },
      modules: [makeModule("naming-your-nfp", "completed"), makeModule("nfp-registration", "not_started")],
      roadmapSections: coreSections,
      programs: [{ goal_cents: null }],
      peopleCount: 1,
    })

    expect(readiness.fundable).toBe(false)
    expect(readiness.verified).toBe(false)
    expect(readiness.fundableMissing).toContain("Complete formation lessons")
    expect(readiness.fundableMissing).toContain("Set a program funding goal")
    expect(readiness.progressPercent).toBeLessThan(readiness.fundableCheckpoint)
  })

  it("returns Fundable when fundable criteria are met", () => {
    const readiness = resolveAcceleratorReadiness({
      profile: {
        ...baseProfile,
        formationStatus: "in_progress",
        documents: {
          articlesOfIncorporation: { path: "seed/articles.pdf" },
        },
      },
      modules: [
        makeModule("naming-your-nfp", "completed"),
        makeModule("nfp-registration", "completed"),
        makeModule("filing-1023", "completed"),
      ],
      roadmapSections: coreSections,
      programs: [{ goal_cents: 2500000 }],
      peopleCount: 1,
    })

    expect(readiness.fundable).toBe(true)
    expect(readiness.verified).toBe(false)
    expect(readiness.progressPercent).toBeGreaterThanOrEqual(readiness.fundableCheckpoint)
    expect(readiness.progressPercent).toBeLessThan(readiness.verifiedCheckpoint)
  })

  it("returns Verified when verified criteria and score threshold are met", () => {
    const readiness = resolveAcceleratorReadiness({
      profile: {
        ...baseProfile,
        formationStatus: "approved",
        documents: {
          verificationLetter: { path: "seed/verification.pdf" },
          bylaws: { path: "seed/bylaws.pdf" },
          stateRegistration: { path: "seed/state.pdf" },
        },
      },
      modules: [
        makeModule("naming-your-nfp", "completed"),
        makeModule("nfp-registration", "completed"),
        makeModule("filing-1023", "completed"),
        makeModule("financial-handbook", "in_progress"),
      ],
      roadmapSections: coreSections,
      programs: [{ goal_cents: 2500000 }],
      peopleCount: 2,
    })

    expect(readiness.fundable).toBe(true)
    expect(readiness.verified).toBe(true)
    expect(readiness.score).toBe(100)
    expect(readiness.progressPercent).toBe(100)
  })
})
