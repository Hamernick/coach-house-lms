import { describe, expect, it } from "vitest"

import {
  createDraft,
  resolveRoadmapSectionStatus,
} from "@/components/roadmap/roadmap-editor/helpers"
import { deriveRoadmapEditorSectionUi } from "@/components/roadmap/roadmap-editor/ui-state"
import { resolveRoadmapSections, type RoadmapSection, type RoadmapSectionStatus } from "@/lib/roadmap"

function makeSection(
  overrides: Partial<RoadmapSection> = {},
): RoadmapSection {
  const status = overrides.status ?? "not_started"
  return {
    id: "mission",
    title: "Mission",
    subtitle: "Clarify the mission",
    slug: "mission",
    titleExample: undefined,
    subtitleExample: undefined,
    prompt: "",
    placeholder: "",
    content: "",
    imageUrl: undefined,
    lastUpdated: null,
    isPublic: false,
    layout: "square",
    status: status as RoadmapSectionStatus,
    ctaLabel: undefined,
    ctaUrl: undefined,
    homework: null,
    templateTitle: "Mission",
    templateSubtitle: "Clarify the mission",
    titleIsTemplate: false,
    subtitleIsTemplate: false,
    ...overrides,
  }
}

describe("roadmap editor status indicators", () => {
  it("marks a not-started section in progress while it has unsaved draft content", () => {
    const section = makeSection()
    const draft = {
      ...createDraft(section),
      content: "We help neighborhood leaders launch practical programs.",
    }

    expect(resolveRoadmapSectionStatus(section, draft)).toBe("in_progress")
  })

  it("keeps complete sections complete while edits are pending", () => {
    const section = makeSection({ status: "complete", content: "Published mission." })
    const draft = {
      ...createDraft(section),
      content: "Published mission with a pending edit.",
    }

    expect(resolveRoadmapSectionStatus(section, draft)).toBe("complete")
  })

  it("feeds draft-derived status into the active editor state", () => {
    const section = makeSection()
    const draft = {
      ...createDraft(section),
      title: "Community health mission",
    }

    const uiState = deriveRoadmapEditorSectionUi({
      sections: [section],
      activeId: section.id,
      drafts: { [section.id]: draft },
    })

    expect(uiState.status).toBe("in_progress")
  })

  it("normalizes legacy completed section status to complete", () => {
    const sections = resolveRoadmapSections({
      roadmap: {
        sections: [
          {
            id: "mission_vision_values",
            title: "Mission, Vision, Values",
            slug: "mission-vision-values",
            content: "Complete content",
            status: "completed",
          },
        ],
      },
    })
    const section = sections.find((entry) => entry.id === "mission_vision_values")

    expect(section?.status).toBe("complete")
  })
})
