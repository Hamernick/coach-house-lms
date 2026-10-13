import { describe, expect, it } from "vitest"

import {
  buildWorkspaceAcceleratorCardSteps,
  normalizeWorkspaceAcceleratorResources,
  resolveWorkspaceAcceleratorCardTargetSize,
} from "@/features/workspace-accelerator-card/lib"

describe("workspace-accelerator-card feature contract", () => {
  it("builds ordered accelerator step sequence with module + step numbering", () => {
    const steps = buildWorkspaceAcceleratorCardSteps([
      {
        id: "m-1",
        title: "Intro",
        description: "First lesson",
        href: "/accelerator/class/foundation/module/1",
        status: "completed",
        groupTitle: "Foundation",
        videoUrl: null,
        durationMinutes: 12,
        resources: [],
        hasAssignment: false,
        hasDeck: false,
      },
      {
        id: "m-2",
        title: "Budgeting",
        description: null,
        href: "/accelerator/class/foundation/module/2",
        status: "in_progress",
        groupTitle: "Foundation",
        videoUrl: "https://cdn.example.com/video.mp4",
        durationMinutes: 24,
        resources: [],
        hasAssignment: true,
        hasDeck: true,
      },
    ])

    expect(steps).toHaveLength(5)
    expect(steps[0]).toMatchObject({
      moduleId: "m-1",
      moduleSequenceIndex: 1,
      moduleSequenceTotal: 2,
      stepSequenceIndex: 1,
      stepSequenceTotal: 5,
      stepKind: "lesson",
      status: "completed",
    })
    expect(steps[2]).toMatchObject({
      moduleId: "m-2",
      moduleSequenceIndex: 2,
      moduleSequenceTotal: 2,
      stepKind: "video",
      status: "in_progress",
    })
    expect(steps.at(-1)).toMatchObject({
      stepKind: "deck",
      status: "not_started",
      stepSequenceTotal: 5,
    })
  })

  it("normalizes resources from unknown payload", () => {
    const resources = normalizeWorkspaceAcceleratorResources([
      { title: "Deck", url: "https://example.com/deck.pdf", type: "pdf" },
      { label: "Worksheet", href: "https://example.com/sheet" },
      { bad: true },
      null,
    ])

    expect(resources).toHaveLength(2)
    expect(resources[0]?.title).toBe("Deck")
    expect(resources[0]?.kind).toBe("pdf")
    expect(resources[1]?.title).toBe("Worksheet")
    expect(resources[1]?.url).toBe("https://example.com/sheet")
  })

  it("resolves adaptive size by step payload density", () => {
    expect(
      resolveWorkspaceAcceleratorCardTargetSize({
        id: "m-1",
        moduleId: "m-1",
        moduleTitle: "Lightweight",
        stepKind: "lesson",
        stepTitle: "Lesson",
        stepDescription: "Short copy",
        href: "/accelerator/class/foundation/module/1",
        status: "not_started",
        stepSequenceIndex: 1,
        stepSequenceTotal: 1,
        moduleSequenceIndex: 1,
        moduleSequenceTotal: 1,
        groupTitle: "Foundation",
        videoUrl: null,
        durationMinutes: null,
        resources: [],
        hasAssignment: false,
        hasDeck: false,
      }),
    ).toBe("sm")

    expect(
      resolveWorkspaceAcceleratorCardTargetSize({
        id: "m-2",
        moduleId: "m-2",
        moduleTitle: "Rich",
        stepKind: "video",
        stepTitle: "Video",
        stepDescription: "Description",
        href: "/accelerator/class/foundation/module/2",
        status: "in_progress",
        stepSequenceIndex: 1,
        stepSequenceTotal: 1,
        moduleSequenceIndex: 1,
        moduleSequenceTotal: 1,
        groupTitle: "Foundation",
        videoUrl: "https://cdn.example.com/video.mp4",
        durationMinutes: 22,
        resources: [],
        hasAssignment: true,
        hasDeck: false,
      }),
    ).toBe("md")
  })
})
