import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  buildWorkspaceAcceleratorChecklistModules,
  buildWorkspaceAcceleratorLessonGroupOptions,
  formatWorkspaceAcceleratorModuleCompletionLabel,
  resolveWorkspaceAcceleratorOpenModuleId,
} from "@/features/workspace-accelerator-card/lib"
import type { WorkspaceAcceleratorCardStep } from "@/features/workspace-accelerator-card"
import {
  canWorkspaceAcceleratorTutorialSelectLessonStep,
  shouldWorkspaceAcceleratorTutorialRestrictLessonSelection,
  WorkspaceAcceleratorCardChecklist,
} from "@/features/workspace-accelerator-card/components/workspace-accelerator-card-checklist"
import type { WorkspaceAcceleratorTutorialInteractionPolicy } from "@/features/workspace-accelerator-card"

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
  const tutorialInteractionPolicy: WorkspaceAcceleratorTutorialInteractionPolicy = {
    stepId: "accelerator-first-module",
    allowedClassGroupKey: "formation",
    allowClassDropdownOpen: true,
    allowClassSelection: false,
    allowAccordionToggle: true,
    allowedModuleId: "m-1",
    allowedStepId: "m-1:video",
    allowPreviewPlayback: false,
    allowPreviewNavigation: false,
    allowPreviewClose: false,
    allowPreviewLinks: false,
    allowPreviewSubmit: false,
    blockedMessage: "We'll go over this soon, I promise! :)",
    blockedMessageDurationMs: 3000,
  }

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

  it("keeps Formation above Strategic Foundations even if insertion order is reversed", () => {
    const reversedOrderSteps: WorkspaceAcceleratorCardStep[] = [
      CHECKLIST_STEPS[3]!,
      CHECKLIST_STEPS[0]!,
      CHECKLIST_STEPS[1]!,
      CHECKLIST_STEPS[2]!,
    ]

    expect(
      buildWorkspaceAcceleratorLessonGroupOptions(reversedOrderSteps).map(
        (group) => group.key,
      ),
    ).toEqual(["formation", "strategic-foundations"])
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

  it("restricts tutorial lesson selection to the highlighted target row only", () => {
    expect(
      shouldWorkspaceAcceleratorTutorialRestrictLessonSelection({
        tutorialInteractionPolicy,
      }),
    ).toBe(true)

    expect(
      canWorkspaceAcceleratorTutorialSelectLessonStep({
        tutorialInteractionPolicy,
        stepId: "m-1:video",
        moduleId: "m-1",
      }),
    ).toBe(true)

    expect(
      canWorkspaceAcceleratorTutorialSelectLessonStep({
        tutorialInteractionPolicy,
        stepId: "m-2:resources",
        moduleId: "m-2",
      }),
    ).toBe(false)
  })

  it("blocks all lesson rows during the accelerator overview step", () => {
    expect(
      canWorkspaceAcceleratorTutorialSelectLessonStep({
        tutorialInteractionPolicy: {
          ...tutorialInteractionPolicy,
          stepId: "accelerator",
          allowedModuleId: null,
          allowedStepId: null,
        },
        stepId: "m-1:video",
        moduleId: "m-1",
      }),
    ).toBe(false)
  })

  it("treats the guided step id as the source of truth even if the module id in policy is stale", () => {
    expect(
      canWorkspaceAcceleratorTutorialSelectLessonStep({
        tutorialInteractionPolicy: {
          ...tutorialInteractionPolicy,
          allowedModuleId: "m-2",
        },
        stepId: "m-1:video",
        moduleId: "m-1",
      }),
    ).toBe(true)
  })

  it("renders lesson rows with sidebar-style hover chrome and plain icon slots", () => {
    const modules = buildWorkspaceAcceleratorChecklistModules({
      steps: CHECKLIST_STEPS,
      completedStepIds: ["m-1:video"],
      selectedGroupKey: "formation",
      currentStepId: "m-1:assignment",
    })
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorCardChecklist, {
        modules,
        selectedLessonGroupLabel: "Formation",
        currentStepId: "m-1:assignment",
        completedStepIds: ["m-1:video"],
        openModuleId: "m-1",
        onOpenModuleIdChange: () => {},
        onStepSelect: () => {},
      }),
    )
    const buttonMatch = markup.match(
      /<button[^>]*data-react-grab-owner-id="workspace-accelerator-checklist:m-1:video"[^>]*class="([^"]+)"/,
    )
    const buttonClassName = buttonMatch?.[1] ?? ""
    const iconMatch = markup.match(
      /<button[^>]*data-react-grab-owner-id="workspace-accelerator-checklist:m-1:video"[^>]*>[\s\S]*?<span class="([^"]+)"><svg/,
    )
    const iconClassName = iconMatch?.[1] ?? ""
    const checklistRootMatch = markup.match(
      /<div class="([^"]*rounded-lg[^"]*bg-transparent[^"]*dark:bg-transparent[^"]*)">/,
    )
    const checklistRootClassName = checklistRootMatch?.[1] ?? ""

    expect(buttonClassName).toContain("hover:bg-accent")
    expect(buttonClassName).toContain("text-foreground/80")
    expect(buttonClassName).toContain("transition-[color,background-color,opacity,transform]")
    expect(buttonClassName).not.toContain("border-transparent")
    expect(iconClassName).toContain("inline-flex shrink-0 items-center justify-center")
    expect(iconClassName).not.toContain("rounded-md border")
    expect(iconClassName).not.toContain("bg-background/70")
    expect(checklistRootClassName).toContain("bg-transparent")
    expect(checklistRootClassName).toContain("dark:bg-transparent")
  })
})
