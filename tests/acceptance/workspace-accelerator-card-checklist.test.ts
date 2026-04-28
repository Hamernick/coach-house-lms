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

  it("moves the Idea to Impact intro module into its own Introduction picker group", () => {
    const introStep: WorkspaceAcceleratorCardStep = {
      ...CHECKLIST_STEPS[3]!,
      id: "intro-idea-to-impact-accelerator:video",
      moduleId: "intro-module-id",
      moduleSlug: "intro-idea-to-impact-accelerator",
      moduleTitle: "Introduction: Idea to Impact Accelerator",
      groupTitle: "Strategic Foundations",
    }

    expect(
      buildWorkspaceAcceleratorLessonGroupOptions([
        CHECKLIST_STEPS[0]!,
        CHECKLIST_STEPS[3]!,
        introStep,
      ]),
    ).toEqual([
      {
        key: "introduction",
        label: "Introduction",
        moduleIds: ["intro-module-id"],
      },
      {
        key: "formation",
        label: "Formation",
        moduleIds: ["m-1"],
      },
      {
        key: "strategic-foundations",
        label: "Strategic Foundations",
        moduleIds: ["m-3"],
      },
    ])

    expect(
      buildWorkspaceAcceleratorChecklistModules({
        steps: [introStep, CHECKLIST_STEPS[3]!],
        completedStepIds: [],
        selectedGroupKey: "introduction",
        currentStepId: introStep.id,
      }),
    ).toMatchObject([
      {
        id: "intro-module-id",
        title: "Introduction: Idea to Impact Accelerator",
        groupTitle: "Introduction",
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

  it("renders lesson rows with task-list style chrome", () => {
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
    const buttonMatch = markup.match(/<button[^>]*class="([^"]+)"/)
    const buttonClassName = buttonMatch?.[1] ?? ""
    expect(buttonClassName).toContain("hover:bg-muted/60")
    expect(buttonClassName).toContain("text-foreground")
    expect(buttonClassName).toContain("rounded-lg")
    expect(buttonClassName).toContain("bg-background")
    expect(buttonClassName).toContain("transition-[color,background-color,opacity,transform]")
    expect(buttonClassName).toContain("border-border/60")
    expect(markup).not.toContain('data-react-grab-owner-id="workspace-accelerator-checklist:')
    expect(markup).toContain("Naming your NFP")
    expect(markup).toContain("video • review")
    expect(markup).toContain("assignment • start")
    expect(markup).toContain("12 min")
    expect(markup).not.toContain(
      'class="inline-flex h-5 shrink-0 self-center items-center text-[10px] leading-none text-muted-foreground"',
    )
    expect(markup).toContain("size-4 shrink-0 rounded-full border border-border bg-background shadow-xs transition-shadow")
    expect(markup).toContain('class="space-y-2"')
  })

  it("renders the step-kind plus action subtitle for organization-setup onboarding rows", () => {
    const modules = buildWorkspaceAcceleratorChecklistModules({
      steps: [
        {
          id: "workspace-onboarding-organization-setup:lesson",
          moduleId: "workspace-onboarding-organization-setup",
          moduleTitle: "Organization setup",
          stepKind: "lesson",
          stepTitle: "Organization setup",
          stepDescription: "Set up your organization, roadmap, and operating foundation.",
          href: "/onboarding?source=formation-setup",
          status: "in_progress",
          stepSequenceIndex: 1,
          stepSequenceTotal: 1,
          moduleSequenceIndex: 1,
          moduleSequenceTotal: 1,
          groupTitle: "Formation",
          videoUrl: null,
          durationMinutes: null,
          resources: [],
          hasAssignment: false,
          hasDeck: false,
          moduleContext: {
            classTitle: "Formation",
            lessonNotesContent: null,
            moduleResources: [],
            assignmentFields: [],
            assignmentSubmission: null,
            completeOnSubmit: false,
            workspaceOnboarding: {
              view: "organization-setup",
              defaults: null,
            },
          },
        },
      ],
      completedStepIds: [],
      selectedGroupKey: "formation",
      currentStepId: "workspace-onboarding-organization-setup:lesson",
    })

    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorCardChecklist, {
        modules,
        selectedLessonGroupLabel: "Formation",
        currentStepId: "workspace-onboarding-organization-setup:lesson",
        completedStepIds: [],
        openModuleId: "workspace-onboarding-organization-setup",
        onOpenModuleIdChange: () => {},
        onStepSelect: () => {},
      }),
    )

    expect(markup).toContain("Organization setup")
    expect(markup).toContain("lesson • start")
    expect(markup).not.toContain("Set up your organization, roadmap, and operating foundation.")
  })

  it("renders checklist rows directly without accordion chevrons or card shells", () => {
    const modules = buildWorkspaceAcceleratorChecklistModules({
      steps: CHECKLIST_STEPS,
      completedStepIds: ["m-2:resources"],
      selectedGroupKey: "formation",
      currentStepId: "m-2:resources",
    })

    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorCardChecklist, {
        modules,
        selectedLessonGroupLabel: "Formation",
        currentStepId: "m-2:resources",
        completedStepIds: ["m-2:resources"],
        openModuleId: "m-1",
        onOpenModuleIdChange: () => {},
        onStepSelect: () => {},
      }),
    )

    expect(markup.match(/data-slot="accordion-trigger"/g)?.length ?? 0).toBe(0)
    expect(markup).toContain("NFP Registration")
    expect(markup).toContain("resources • review")
    expect(markup).not.toContain("rounded-2xl border border-border/70 bg-muted/30 p-2")
    expect(markup).not.toContain("shadow-[0_10px_28px_-24px_rgba(15,23,42,0.42)]")
  })
})
