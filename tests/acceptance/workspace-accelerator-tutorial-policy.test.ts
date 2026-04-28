import { describe, expect, it } from "vitest"

import { resolveWorkspaceAcceleratorTutorialInteractionPolicy } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-accelerator-interaction-policy"
import type { WorkspaceAcceleratorCardRuntimeSnapshot } from "@/features/workspace-accelerator-card"
import { resolveWorkspaceCanvasTutorialStep, resolveWorkspaceCanvasTutorialStepCount } from "@/features/workspace-canvas-tutorial"

function findTutorialStepIndex(stepId: ReturnType<typeof resolveWorkspaceCanvasTutorialStep>["id"]) {
  for (let index = 0; index < resolveWorkspaceCanvasTutorialStepCount(); index += 1) {
    if (resolveWorkspaceCanvasTutorialStep(index).id === stepId) {
      return index
    }
  }

  throw new Error(`Missing tutorial step: ${stepId}`)
}

function buildRuntimeSnapshot(
  overrides: Partial<WorkspaceAcceleratorCardRuntimeSnapshot> = {},
): WorkspaceAcceleratorCardRuntimeSnapshot {
  return {
    currentStep: {
      id: "workspace-onboarding-welcome:lesson",
      moduleId: "workspace-onboarding-welcome",
      moduleTitle: "Welcome",
      stepKind: "video",
      stepTitle: "Welcome to Workspace",
      stepDescription: null,
      href: "/accelerator/class/formation/module/welcome",
      status: "in_progress",
      stepSequenceIndex: 1,
      stepSequenceTotal: 3,
      moduleSequenceIndex: 1,
      moduleSequenceTotal: 1,
      groupTitle: "Formation",
      videoUrl: "https://cdn.example.com/welcome.mp4",
      durationMinutes: 8,
      resources: [],
      hasAssignment: false,
      hasDeck: false,
    },
    currentIndex: 0,
    totalSteps: 1,
    canGoPrevious: false,
    canGoNext: true,
    currentModuleStepIndex: 0,
    currentModuleStepTotal: 1,
    currentModuleCompletedCount: 0,
    isCurrentModuleCompleted: false,
    isCurrentStepCompleted: false,
    selectedLessonGroupKey: "formation",
    selectedLessonGroupLabel: "Formation",
    lessonGroupOptions: [
      { key: "formation", label: "Formation" },
      { key: "strategic-foundations", label: "Strategic Foundations" },
    ],
    firstVisibleChecklistStepId: "workspace-onboarding-welcome:lesson",
    isModuleViewerOpen: false,
    openModuleId: "workspace-onboarding-welcome",
    placeholderVideoUrl: null,
    readinessSummary: null,
    checklistModuleCount: 1,
    filteredStepCount: 1,
    ...overrides,
  }
}

describe("workspace accelerator tutorial interaction policy", () => {
  it("returns null outside tutorial mode", () => {
    expect(
      resolveWorkspaceAcceleratorTutorialInteractionPolicy({
        tutorialActive: false,
        tutorialStepIndex: findTutorialStepIndex("accelerator-picker"),
        acceleratorRuntimeSnapshot: null,
      }),
    ).toBeNull()
  })

  it("returns null for non-accelerator tutorial steps", () => {
    expect(
      resolveWorkspaceAcceleratorTutorialInteractionPolicy({
        tutorialActive: true,
        tutorialStepIndex: findTutorialStepIndex("calendar"),
        acceleratorRuntimeSnapshot: buildRuntimeSnapshot(),
      }),
    ).toBeNull()
  })

  it("pins classes and blocks navigation during the picker step", () => {
    expect(
      resolveWorkspaceAcceleratorTutorialInteractionPolicy({
        tutorialActive: true,
        tutorialStepIndex: findTutorialStepIndex("accelerator-picker"),
        acceleratorRuntimeSnapshot: buildRuntimeSnapshot(),
      }),
    ).toMatchObject({
      stepId: "accelerator-picker",
      allowedClassGroupKey: "formation",
      allowClassDropdownOpen: true,
      allowClassSelection: false,
      allowAccordionToggle: true,
      allowedModuleId: null,
      allowedStepId: null,
      allowPreviewPlayback: false,
      allowPreviewNavigation: false,
      allowPreviewClose: false,
      allowPreviewLinks: false,
      allowPreviewSubmit: false,
      blockedMessage: "We'll go over this soon, I promise! :)",
      blockedMessageDurationMs: 3000,
    })
  })

  it("blocks all internal accelerator actions during the accelerator overview step", () => {
    expect(
      resolveWorkspaceAcceleratorTutorialInteractionPolicy({
        tutorialActive: true,
        tutorialStepIndex: findTutorialStepIndex("accelerator"),
        acceleratorRuntimeSnapshot: buildRuntimeSnapshot(),
      }),
    ).toMatchObject({
      stepId: "accelerator",
      allowedClassGroupKey: "formation",
      allowClassDropdownOpen: true,
      allowClassSelection: false,
      allowAccordionToggle: true,
      allowedModuleId: null,
      allowedStepId: null,
    })
  })

  it("allows only the guided Welcome path during the first-module step", () => {
    expect(
      resolveWorkspaceAcceleratorTutorialInteractionPolicy({
        tutorialActive: true,
        tutorialStepIndex: findTutorialStepIndex("accelerator-first-module"),
        acceleratorRuntimeSnapshot: buildRuntimeSnapshot(),
      }),
    ).toMatchObject({
      stepId: "accelerator-first-module",
      allowedModuleId: "workspace-onboarding-welcome",
      allowedStepId: "workspace-onboarding-welcome:lesson",
      allowPreviewPlayback: false,
    })
  })

  it("derives the guided module from the visible checklist target instead of a stale current step", () => {
    expect(
      resolveWorkspaceAcceleratorTutorialInteractionPolicy({
        tutorialActive: true,
        tutorialStepIndex: findTutorialStepIndex("accelerator-first-module"),
        acceleratorRuntimeSnapshot: buildRuntimeSnapshot({
          currentStep: {
            ...buildRuntimeSnapshot().currentStep!,
            id: "workspace-setup:lesson",
            moduleId: "workspace-setup",
            moduleTitle: "Workspace setup",
          },
          openModuleId: "workspace-setup",
          firstVisibleChecklistStepId: "workspace-onboarding-welcome:lesson",
        }),
      }),
    ).toMatchObject({
      stepId: "accelerator-first-module",
      allowedModuleId: "workspace-onboarding-welcome",
      allowedStepId: "workspace-onboarding-welcome:lesson",
    })
  })

  it("turns the module preview into a read-only guided surface", () => {
    expect(
      resolveWorkspaceAcceleratorTutorialInteractionPolicy({
        tutorialActive: true,
        tutorialStepIndex: findTutorialStepIndex("accelerator-close-module"),
        acceleratorRuntimeSnapshot: buildRuntimeSnapshot({
          isModuleViewerOpen: true,
        }),
      }),
    ).toMatchObject({
      stepId: "accelerator-close-module",
      allowedModuleId: "workspace-onboarding-welcome",
      allowedStepId: "workspace-onboarding-welcome:lesson",
      allowClassDropdownOpen: false,
      allowPreviewPlayback: true,
      allowPreviewNavigation: false,
      allowPreviewClose: false,
      allowPreviewLinks: false,
      allowPreviewSubmit: false,
    })
  })

  it("keeps policy booleans stable even when the accelerator runtime has not hydrated yet", () => {
    expect(
      resolveWorkspaceAcceleratorTutorialInteractionPolicy({
        tutorialActive: true,
        tutorialStepIndex: findTutorialStepIndex("accelerator-first-module"),
        acceleratorRuntimeSnapshot: null,
      }),
    ).toMatchObject({
      stepId: "accelerator-first-module",
      allowedClassGroupKey: "formation",
      allowClassDropdownOpen: true,
      allowClassSelection: false,
      allowAccordionToggle: true,
      allowedModuleId: null,
      allowedStepId: null,
    })
  })
})
