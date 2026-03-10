import { describe, expect, it } from "vitest"

import {
  buildWorkspaceAcceleratorChecklistModules,
  buildWorkspaceAcceleratorLessonGroupOptions,
  formatWorkspaceAcceleratorModuleCompletionLabel,
  resolveWorkspaceAcceleratorOpenModuleId,
} from "@/features/workspace-accelerator-card/lib"
import type { WorkspaceAcceleratorCardStep } from "@/features/workspace-accelerator-card"

const CHECKLIST_STEPS: WorkspaceAcceleratorCardStep[] = [
  {
    id: "m-1:video",
    moduleId: "m-1",
    moduleTitle: "Naming your NFP",
    stepKind: "video",
    stepTitle: "Video",
    stepDescription: "Watch the kickoff",
    href: "/accelerator/class/formation/module/1",
    status: "in_progress",
    stepSequenceIndex: 1,
    stepSequenceTotal: 4,
    moduleSequenceIndex: 1,
    moduleSequenceTotal: 3,
    groupTitle: "Formation",
    videoUrl: "https://cdn.example.com/formation.mp4",
    durationMinutes: 12,
    resources: [],
    hasAssignment: true,
    hasDeck: false,
  },
  {
    id: "m-1:assignment",
    moduleId: "m-1",
    moduleTitle: "Naming your NFP",
    stepKind: "assignment",
    stepTitle: "Assignment",
    stepDescription: "Write your first draft",
    href: "/accelerator/class/formation/module/1",
    status: "not_started",
    stepSequenceIndex: 2,
    stepSequenceTotal: 4,
    moduleSequenceIndex: 1,
    moduleSequenceTotal: 3,
    groupTitle: "Formation",
    videoUrl: null,
    durationMinutes: null,
    resources: [],
    hasAssignment: true,
    hasDeck: false,
  },
  {
    id: "m-2:resources",
    moduleId: "m-2",
    moduleTitle: "NFP Registration",
    stepKind: "resources",
    stepTitle: "Resources",
    stepDescription: "Review the registration kit",
    href: "/accelerator/class/formation/module/2",
    status: "not_started",
    stepSequenceIndex: 3,
    stepSequenceTotal: 4,
    moduleSequenceIndex: 2,
    moduleSequenceTotal: 3,
    groupTitle: "Formation",
    videoUrl: null,
    durationMinutes: null,
    resources: [],
    hasAssignment: false,
    hasDeck: true,
  },
  {
    id: "m-3:video",
    moduleId: "m-3",
    moduleTitle: "Budgeting for a Program",
    stepKind: "video",
    stepTitle: "Video",
    stepDescription: "Budget walkthrough",
    href: "/accelerator/class/foundations/module/1",
    status: "in_progress",
    stepSequenceIndex: 4,
    stepSequenceTotal: 4,
    moduleSequenceIndex: 3,
    moduleSequenceTotal: 3,
    groupTitle: "Strategic Foundations",
    videoUrl: "https://cdn.example.com/budgeting.mp4",
    durationMinutes: 22,
    resources: [],
    hasAssignment: false,
    hasDeck: false,
  },
]

describe("workspace accelerator checklist helpers", () => {
  it("builds lesson-group options from visible accelerator steps", () => {
    expect(buildWorkspaceAcceleratorLessonGroupOptions(CHECKLIST_STEPS)).toEqual([
      {
        key: "formation",
        label: "Formation",
        moduleIds: ["m-1", "m-2"],
      },
      {
        key: "strategic-foundations",
        label: "Strategic Foundations",
        moduleIds: ["m-3"],
      },
    ])
  })

  it("groups checklist rows by module within the selected lesson group", () => {
    expect(
      buildWorkspaceAcceleratorChecklistModules({
        steps: CHECKLIST_STEPS,
        completedStepIds: ["m-1:video", "m-2:resources"],
        selectedGroupKey: "formation",
        currentStepId: "m-2:resources",
      }),
    ).toMatchObject([
      {
        id: "m-1",
        title: "Naming your NFP",
        groupTitle: "Formation",
        totalSteps: 2,
        completedStepCount: 1,
        isCurrent: false,
        steps: [
          { id: "m-1:video", stepTitle: "Video" },
          { id: "m-1:assignment", stepTitle: "Assignment" },
        ],
      },
      {
        id: "m-2",
        title: "NFP Registration",
        groupTitle: "Formation",
        totalSteps: 1,
        completedStepCount: 1,
        isCurrent: true,
        steps: [{ id: "m-2:resources", stepTitle: "Resources" }],
      },
    ])
  })

  it("formats module completion copy as human-readable counts", () => {
    expect(formatWorkspaceAcceleratorModuleCompletionLabel(0, 3)).toBe("0 of 3 complete")
    expect(formatWorkspaceAcceleratorModuleCompletionLabel(1, 1)).toBe("1 of 1 complete")
    expect(formatWorkspaceAcceleratorModuleCompletionLabel(2, 2)).toBe("2 of 2 complete")
  })

  it("opens the current module when navigation moves into a new module", () => {
    expect(
      resolveWorkspaceAcceleratorOpenModuleId({
        previousOpenModuleId: "m-1",
        visibleModuleIds: ["m-1", "m-2", "m-3"],
        currentModuleId: "m-2",
        forceCurrentModuleOpen: true,
      }),
    ).toBe("m-2")
  })

  it("preserves the manually open module when navigation stays in the same module", () => {
    expect(
      resolveWorkspaceAcceleratorOpenModuleId({
        previousOpenModuleId: "m-1",
        visibleModuleIds: ["m-1", "m-2", "m-3"],
        currentModuleId: "m-2",
        forceCurrentModuleOpen: false,
      }),
    ).toBe("m-1")

    expect(
      resolveWorkspaceAcceleratorOpenModuleId({
        previousOpenModuleId: null,
        visibleModuleIds: ["m-2", "m-3"],
        currentModuleId: "m-2",
        forceCurrentModuleOpen: false,
      }),
    ).toBe("m-2")
  })
})
