import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createDraft,
  loadRoadmapDraftsFromStorage,
  persistRoadmapDraftsToStorage,
  roadmapDraftStorageKey,
  resolveRoadmapSectionStatus,
} from "@/components/roadmap/roadmap-editor/helpers"
import { deriveRoadmapEditorSectionUi } from "@/components/roadmap/roadmap-editor/ui-state"
import {
  mergeSavedRoadmapDraft,
  reconcileRoadmapEditorSections,
} from "@/components/roadmap/roadmap-editor/save-state"
import {
  resolveRoadmapSections,
  type RoadmapSection,
  type RoadmapSectionStatus,
} from "@/lib/roadmap"

function makeSection(overrides: Partial<RoadmapSection> = {}): RoadmapSection {
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
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("isolates drafts by user and organization and never falls back to a shared private key", () => {
    expect(roadmapDraftStorageKey()).toBeNull()
    const first = roadmapDraftStorageKey({
      userId: "user-a",
      organizationId: "org-a",
    })
    expect(first).not.toBe(
      roadmapDraftStorageKey({ userId: "user-b", organizationId: "org-a" })
    )
    expect(first).not.toBe(
      roadmapDraftStorageKey({ userId: "user-a", organizationId: "org-b" })
    )
  })

  it("retains an unsaved draft's base revision after reload, including intentional blank edits", () => {
    const storage = new Map<string, string>()
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key),
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    })
    const section = makeSection({
      content: "Original",
      lastUpdated: "2026-09-09T03:00:00Z",
    })
    const draft = { ...createDraft(section), content: "" }
    expect(
      persistRoadmapDraftsToStorage({
        storageKey: "scoped",
        sections: [section],
        drafts: { [section.id]: draft },
      })
    ).toBe(true)
    const remote = {
      ...section,
      content: "Remote change",
      lastUpdated: "2026-09-09T04:00:00Z",
    }
    const restored = loadRoadmapDraftsFromStorage("scoped", [remote])[
      section.id
    ]
    expect(restored.content).toBe("")
    expect(restored.lastUpdated).toBe(section.lastUpdated)
    expect(restored.lastUpdated).not.toBe(remote.lastUpdated)
  })

  it("reports unavailable storage without losing the in-memory draft", () => {
    vi.stubGlobal("window", {
      localStorage: {
        setItem: () => {
          throw new Error("Quota exceeded")
        },
      },
    })
    const section = makeSection()
    const draft = { ...createDraft(section), content: "Keep this" }
    expect(
      persistRoadmapDraftsToStorage({
        storageKey: "scoped",
        sections: [section],
        drafts: { [section.id]: draft },
      })
    ).toBe(false)
    expect(draft.content).toBe("Keep this")
  })

  it("adopts saved normalization without losing text typed during the save", () => {
    const submitted = createDraft(
      makeSection({ title: "  Title  ", content: "Submitted text" })
    )
    const current = {
      ...submitted,
      content: "Submitted text plus a new sentence",
    }
    const saved = makeSection({
      title: "Title",
      content: "Submitted text",
      lastUpdated: "2026-09-09T03:00:01.000Z",
    })
    const merged = mergeSavedRoadmapDraft(saved, submitted, current)
    expect(merged.title).toBe("Title")
    expect(merged.content).toBe(current.content)
    expect(merged.lastUpdated).toBe(saved.lastUpdated)
  })

  it("keeps the latest local save when older server props arrive", () => {
    const original = makeSection()
    const saved = makeSection({
      content: "Saved text",
      lastUpdated: "2026-09-09T03:00:01.000Z",
    })
    const draft = createDraft(saved)
    const next = reconcileRoadmapEditorSections([original], [saved], {
      [saved.id]: draft,
    })
    expect(next.sections[0]).toBe(saved)
    expect(next.drafts[saved.id]).toBe(draft)
  })

  it("retains the dirty draft's original revision when a remote update arrives", () => {
    const original = makeSection({
      content: "Original",
      lastUpdated: "2026-09-09T03:00:01.000Z",
    })
    const remote = {
      ...original,
      content: "Someone else's change",
      lastUpdated: "2026-09-09T03:00:02.000Z",
    }
    const draft = { ...createDraft(original), content: "My change" }
    const next = reconcileRoadmapEditorSections([remote], [original], {
      [original.id]: draft,
    })
    expect(next.sections[0].lastUpdated).toBe(original.lastUpdated)
    expect(next.drafts[original.id]).toBe(draft)
  })

  it("accepts newer server content when there are no unsaved edits", () => {
    const original = makeSection()
    const remote = makeSection({
      content: "Updated remotely",
      lastUpdated: "2026-09-09T03:00:02.000Z",
    })
    const next = reconcileRoadmapEditorSections([remote], [original], {
      [original.id]: createDraft(original),
    })
    expect(next.sections[0]).toBe(remote)
    expect(next.drafts[original.id]).toEqual(createDraft(remote))
  })

  it("marks a not-started section in progress while it has unsaved draft content", () => {
    const section = makeSection()
    const draft = {
      ...createDraft(section),
      content: "We help neighborhood leaders launch practical programs.",
    }

    expect(resolveRoadmapSectionStatus(section, draft)).toBe("in_progress")
  })

  it("keeps complete sections complete while edits are pending", () => {
    const section = makeSection({
      status: "complete",
      content: "Published mission.",
    })
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

  it("keeps the complete calendar panel aligned to the standard content width", () => {
    const calendarSection = makeSection({
      id: "board_calendar",
      title: "Calendar",
      slug: "calendar",
    })
    const budgetSection = makeSection({
      id: "budget",
      title: "Budget",
      slug: "budget",
    })

    const calendarUiState = deriveRoadmapEditorSectionUi({
      sections: [calendarSection],
      activeId: calendarSection.id,
      drafts: { [calendarSection.id]: createDraft(calendarSection) },
    })
    const budgetUiState = deriveRoadmapEditorSectionUi({
      sections: [budgetSection],
      activeId: budgetSection.id,
      drafts: { [budgetSection.id]: createDraft(budgetSection) },
    })

    expect(calendarUiState.contentMaxWidth).toBe("max-w-3xl")
    expect(budgetUiState.contentMaxWidth).toBe("max-w-none")
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
    const section = sections.find(
      (entry) => entry.id === "mission_vision_values"
    )

    expect(section?.status).toBe("complete")
  })

  it("does not let stale browser drafts mask newer saved roadmap content", () => {
    const section = makeSection({
      id: "fundraising_strategy",
      title: "Strategy",
      slug: "fundraising-strategy",
      status: "complete",
      content: "Saved fundraising strategy.",
      lastUpdated: "2026-06-16T06:30:00.000Z",
    })
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () =>
          JSON.stringify({
            version: 1,
            updatedAt: "2026-06-16T06:00:00.000Z",
            drafts: {
              fundraising_strategy: {
                content: "",
              },
            },
          }),
      },
    })

    const drafts = loadRoadmapDraftsFromStorage("roadmap-draft:test", [section])

    expect(drafts.fundraising_strategy.content).toBe(
      "Saved fundraising strategy."
    )
  })

  it("does not let blank browser drafts mask saved complete sections", () => {
    const section = makeSection({
      id: "board_handbook",
      title: "Handbook",
      slug: "board-handbook",
      status: "complete",
      content: "Saved board handbook.",
    })
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () =>
          JSON.stringify({
            version: 1,
            updatedAt: "2026-06-16T07:00:00.000Z",
            drafts: {
              board_handbook: {
                title: "",
                subtitle: "",
                content: "",
                imageUrl: "",
              },
            },
          }),
      },
    })

    const drafts = loadRoadmapDraftsFromStorage("roadmap-draft:test", [section])

    expect(drafts.board_handbook.content).toBe("Saved board handbook.")
  })
})
