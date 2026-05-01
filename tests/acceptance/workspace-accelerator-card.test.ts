import { describe, expect, it } from "vitest"

import {
  buildWorkspaceAcceleratorRuntimeActionsSignature,
  buildWorkspaceAcceleratorCardSteps,
  normalizeWorkspaceAcceleratorCardInput,
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

    expect(steps).toHaveLength(7)
    expect(steps[0]).toMatchObject({
      moduleId: "m-1",
      moduleSequenceIndex: 1,
      moduleSequenceTotal: 2,
      stepSequenceIndex: 1,
      stepSequenceTotal: 7,
      stepKind: "lesson",
      status: "completed",
    })
    expect(steps[2]).toMatchObject({
      moduleId: "m-2",
      moduleSequenceIndex: 2,
      moduleSequenceTotal: 2,
      stepKind: "lesson",
      status: "in_progress",
    })
    expect(steps.at(-1)).toMatchObject({
      stepKind: "complete",
      status: "not_started",
      stepSequenceTotal: 7,
    })
  })

  it("expands multi-screen assignment schemas into workspace assignment steps", () => {
    const steps = buildWorkspaceAcceleratorCardSteps([
      {
        id: "origin-module",
        title: "Start with your why",
        description: "Origin story",
        href: "/accelerator/class/strategic-foundations/module/start-with-your-why",
        status: "in_progress",
        groupTitle: "Strategic Foundations",
        videoUrl: "https://cdn.example.com/origin.mp4",
        durationMinutes: 18,
        resources: [],
        hasAssignment: true,
        hasDeck: false,
        moduleContext: {
          classTitle: "Strategic Foundations",
          lessonNotesContent: null,
          moduleResources: [],
          assignmentSubmission: null,
          completeOnSubmit: true,
          assignmentFields: [
            {
              name: "origin_intro",
              label: "Start with your why",
              type: "subtitle",
              required: false,
              screen: "intro",
            },
            {
              name: "origin_roots_place",
              label: "Where did you grow up?",
              type: "long_text",
              required: false,
              screen: "question",
            },
            {
              name: "origin_roots_influences",
              label: "What were the major influences in your early life?",
              type: "long_text",
              required: false,
              screen: "question",
            },
          ],
        },
      },
    ])

    expect(steps.map((step) => step.id)).toEqual([
      "origin-module:lesson",
      "origin-module:video",
      "origin-module:assignment:assignment-overview",
      "origin-module:assignment:section-1",
      "origin-module:assignment:section-2",
      "origin-module:complete",
    ])
    expect(steps[2]).toMatchObject({
      stepKind: "assignment",
      stepTitle: "Overview",
      assignmentSectionId: "assignment-overview",
    })
    expect(steps[3]).toMatchObject({
      stepKind: "assignment",
      stepTitle: "Where did you grow up?",
      assignmentSectionId: "section-1",
    })
  })

  it("folds resources into the overview step for multi-screen assignments", () => {
    const steps = buildWorkspaceAcceleratorCardSteps([
      {
        id: "origin-module",
        title: "Start with your why",
        description: "Origin story",
        href: "/accelerator/class/strategic-foundations/module/start-with-your-why",
        status: "in_progress",
        groupTitle: "Strategic Foundations",
        videoUrl: null,
        durationMinutes: 18,
        resources: [
          {
            id: "resource-1",
            title: "Origin story worksheet",
            url: "https://example.com/worksheet",
            kind: "generic",
          },
        ],
        hasAssignment: true,
        hasDeck: false,
        moduleContext: {
          classTitle: "Strategic Foundations",
          lessonNotesContent: null,
          moduleResources: [
            {
              label: "Origin story worksheet",
              url: "https://example.com/worksheet",
              provider: "generic",
            },
          ],
          assignmentSubmission: null,
          completeOnSubmit: true,
          assignmentFields: [
            {
              name: "origin_intro",
              label: "Start with your why",
              type: "subtitle",
              required: false,
              screen: "intro",
            },
            {
              name: "origin_roots_place",
              label: "Where did you grow up?",
              type: "long_text",
              required: false,
              screen: "question",
            },
          ],
        },
      },
    ])

    expect(steps.map((step) => step.stepKind)).toEqual([
      "lesson",
      "assignment",
      "assignment",
      "complete",
    ])
    expect(steps.some((step) => step.stepKind === "resources")).toBe(false)
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

  it("keeps the workspace accelerator card compact regardless of step payload density", () => {
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
    ).toBe("sm")
  })

  it("builds stable runtime-actions signature for equivalent semantics", () => {
    const left = buildWorkspaceAcceleratorRuntimeActionsSignature({
      currentStepId: "module-1:lesson",
      canGoPrevious: false,
      canGoNext: true,
      isCurrentStepCompleted: false,
      totalSteps: 12,
    })
    const right = buildWorkspaceAcceleratorRuntimeActionsSignature({
      currentStepId: "module-1:lesson",
      canGoPrevious: false,
      canGoNext: true,
      isCurrentStepCompleted: false,
      totalSteps: 12,
    })
    const changed = buildWorkspaceAcceleratorRuntimeActionsSignature({
      currentStepId: "module-1:lesson",
      canGoPrevious: true,
      canGoNext: true,
      isCurrentStepCompleted: false,
      totalSteps: 12,
    })

    expect(left).toBe(right)
    expect(left).not.toBe(changed)
  })

  it("treats completed step statuses as completed progress even without explicit saved ids", () => {
    const normalized = normalizeWorkspaceAcceleratorCardInput({
      size: "sm",
      steps: [
        {
          id: "module-1:video",
          moduleId: "module-1",
          moduleTitle: "Theory of Change",
          stepKind: "video",
          stepTitle: "Video",
          stepDescription: "Watch the walkthrough",
          href: "/accelerator/class/foundation/module/1",
          status: "completed",
          stepSequenceIndex: 1,
          stepSequenceTotal: 2,
          moduleSequenceIndex: 1,
          moduleSequenceTotal: 1,
          groupTitle: "Strategic Foundations",
          videoUrl: "https://cdn.example.com/video.mp4",
          durationMinutes: 10,
          resources: [],
          hasAssignment: false,
          hasDeck: false,
        },
        {
          id: "module-1:resources",
          moduleId: "module-1",
          moduleTitle: "Theory of Change",
          stepKind: "resources",
          stepTitle: "Resources",
          stepDescription: "Review the worksheet",
          href: "/accelerator/class/foundation/module/1",
          status: "not_started",
          stepSequenceIndex: 2,
          stepSequenceTotal: 2,
          moduleSequenceIndex: 1,
          moduleSequenceTotal: 1,
          groupTitle: "Strategic Foundations",
          videoUrl: null,
          durationMinutes: null,
          resources: [],
          hasAssignment: false,
          hasDeck: false,
        },
      ],
      initialCompletedStepIds: ["module-1:resources", ""],
    })

    expect(normalized.initialCompletedStepIds).toEqual([
      "module-1:resources",
      "module-1:video",
    ])
  })

  it("maps legacy assignment step ids to the first expanded assignment screen", () => {
    const normalized = normalizeWorkspaceAcceleratorCardInput({
      size: "sm",
      steps: [
        {
          id: "origin-module:assignment:assignment-overview",
          moduleId: "origin-module",
          moduleTitle: "Start with your why",
          stepKind: "assignment",
          stepTitle: "Overview",
          stepDescription: null,
          assignmentSectionId: "assignment-overview",
          href: "/accelerator/class/strategic-foundations/module/start-with-your-why",
          status: "in_progress",
          stepSequenceIndex: 1,
          stepSequenceTotal: 1,
          moduleSequenceIndex: 1,
          moduleSequenceTotal: 1,
          groupTitle: "Strategic Foundations",
          videoUrl: null,
          durationMinutes: null,
          resources: [],
          hasAssignment: true,
          hasDeck: false,
        },
      ],
      initialCurrentStepId: "origin-module:assignment",
      initialCompletedStepIds: [],
    })

    expect(normalized.initialCurrentStepId).toBe("origin-module:assignment:assignment-overview")
  })
})
