import { describe, expect, it } from "vitest"

import { resolveWorkspaceAcceleratorPlaceholderVideoUrl } from "@/features/workspace-accelerator-card/components/workspace-accelerator-card-panel"
import { buildWorkspaceAcceleratorFullscreenHref } from "@/features/workspace-accelerator-card"
import {
  resolveWorkspaceAcceleratorCollapsedCardSize,
  shouldWorkspaceAcceleratorSyncModuleViewerSize,
  shouldWorkspaceAcceleratorTutorialAdvanceAfterStepOpen,
  shouldWorkspaceAcceleratorTutorialAdvanceFromFooterContinue,
  shouldWorkspaceAcceleratorTutorialKeepModuleViewerOpen,
} from "@/features/workspace-accelerator-card/components/workspace-accelerator-card-panel-support"

describe("workspace accelerator tutorial panel state", () => {
  it("builds workspace accelerator fullscreen hrefs with optional deep-link state", () => {
    expect(
      buildWorkspaceAcceleratorFullscreenHref({
        stepId: "workspace-onboarding-welcome:lesson",
        moduleId: "workspace-onboarding-welcome",
        lessonGroupKey: "formation",
      }),
    ).toBe(
      "/workspace/accelerator?step=workspace-onboarding-welcome%3Alesson&module=workspace-onboarding-welcome&group=formation",
    )

    expect(
      buildWorkspaceAcceleratorFullscreenHref({
        stepId: null,
        moduleId: null,
        lessonGroupKey: null,
      }),
    ).toBe("/workspace/accelerator")
  })

  it("keeps the embedded module viewer open for the tutorial callout and module-preview mode", () => {
    expect(
      shouldWorkspaceAcceleratorTutorialKeepModuleViewerOpen({
        tutorialCallout: null,
      }),
    ).toBe(false)
    expect(
      shouldWorkspaceAcceleratorTutorialKeepModuleViewerOpen({
        tutorialCallout: {
          focus: "first-module",
          title: "First module",
          instruction: "Click the first module step here to continue.",
        },
      }),
    ).toBe(false)
    expect(
      shouldWorkspaceAcceleratorTutorialKeepModuleViewerOpen({
        tutorialCallout: {
          focus: "picker",
          title: "Class picker",
          instruction: "Choose a class track here.",
        },
      }),
    ).toBe(false)
    expect(
      shouldWorkspaceAcceleratorTutorialKeepModuleViewerOpen({
        tutorialCallout: {
          focus: "close-module",
          title: "Close module",
          instruction: "Click here to close this module and return.",
        },
      }),
    ).toBe(true)
    expect(
      shouldWorkspaceAcceleratorTutorialKeepModuleViewerOpen({
        tutorialCallout: null,
        tutorialMode: "module-preview",
      }),
    ).toBe(true)
  })

  it("uses the embedded footer continue button as a tutorial next action only in module-preview mode", () => {
    expect(
      shouldWorkspaceAcceleratorTutorialAdvanceFromFooterContinue(null),
    ).toBe(false)
    expect(
      shouldWorkspaceAcceleratorTutorialAdvanceFromFooterContinue(
        "module-preview",
      ),
    ).toBe(true)
  })

  it("waits to advance the guided first module step until the module viewer is actually open on the target step", () => {
    const firstModuleCallout = {
      focus: "first-module" as const,
      title: "First module",
      instruction: "Click the Welcome module here to continue.",
    }

    expect(
      shouldWorkspaceAcceleratorTutorialAdvanceAfterStepOpen({
        tutorialCallout: firstModuleCallout,
        pendingAdvance: true,
        isModuleViewerOpen: false,
        currentStepId: "welcome-step",
        tutorialTargetStepId: "welcome-step",
      }),
    ).toBe(false)

    expect(
      shouldWorkspaceAcceleratorTutorialAdvanceAfterStepOpen({
        tutorialCallout: firstModuleCallout,
        pendingAdvance: true,
        isModuleViewerOpen: true,
        currentStepId: "other-step",
        tutorialTargetStepId: "welcome-step",
      }),
    ).toBe(false)

    expect(
      shouldWorkspaceAcceleratorTutorialAdvanceAfterStepOpen({
        tutorialCallout: firstModuleCallout,
        pendingAdvance: true,
        isModuleViewerOpen: true,
        currentStepId: "welcome-step",
        tutorialTargetStepId: "welcome-step",
      }),
    ).toBe(true)
  })

  it("keeps live canvas card width sync disabled while the tutorial owns module preview state", () => {
    expect(
      shouldWorkspaceAcceleratorSyncModuleViewerSize({
        tutorialCallout: null,
      }),
    ).toBe(true)
    expect(
      shouldWorkspaceAcceleratorSyncModuleViewerSize({
        tutorialCallout: {
          focus: "close-module",
          title: "Module preview",
          instruction: "Preview this module before continuing.",
        },
      }),
    ).toBe(false)
    expect(
      shouldWorkspaceAcceleratorSyncModuleViewerSize({
        tutorialCallout: null,
        tutorialMode: "module-preview",
      }),
    ).toBe(false)
  })

  it("falls back to the compact accelerator size when a closed viewer remounts without a stored collapsed size", () => {
    expect(
      resolveWorkspaceAcceleratorCollapsedCardSize({
        currentSize: "lg",
        previousCollapsedSize: null,
      }),
    ).toBe("sm")
    expect(
      resolveWorkspaceAcceleratorCollapsedCardSize({
        currentSize: "lg",
        previousCollapsedSize: "md",
      }),
    ).toBe("md")
    expect(
      resolveWorkspaceAcceleratorCollapsedCardSize({
        currentSize: "sm",
        previousCollapsedSize: null,
      }),
    ).toBe("sm")
  })

  it("prefers the Welcome onboarding video for tutorial preview placeholders", () => {
    expect(
      resolveWorkspaceAcceleratorPlaceholderVideoUrl({
        currentStepId: "workspace-onboarding-organization-setup:lesson",
        steps: [
          {
            id: "nfp-registration:video",
            moduleId: "nfp-registration",
            moduleTitle: "NFP Registration",
            stepKind: "video",
            stepTitle: "NFP Registration",
            stepDescription: null,
            href: "/accelerator/class/formation/module/nfp-registration",
            status: "not_started",
            stepSequenceIndex: 3,
            stepSequenceTotal: 3,
            moduleSequenceIndex: 3,
            moduleSequenceTotal: 3,
            groupTitle: "Formation",
            videoUrl: "https://cdn.example.com/nfp-registration.mp4",
            durationMinutes: 8,
            resources: [],
            hasAssignment: false,
            hasDeck: false,
          },
          {
            id: "workspace-onboarding-welcome:lesson",
            moduleId: "workspace-onboarding-welcome",
            moduleTitle: "Welcome",
            stepKind: "lesson",
            stepTitle: "Welcome",
            stepDescription: null,
            href: "/accelerator/class/formation/module/welcome",
            status: "in_progress",
            stepSequenceIndex: 1,
            stepSequenceTotal: 1,
            moduleSequenceIndex: 1,
            moduleSequenceTotal: 1,
            groupTitle: "Formation",
            videoUrl: "https://cdn.example.com/welcome.mp4",
            durationMinutes: 5,
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
                view: "welcome",
                defaults: null,
              },
            },
          },
        ],
      }),
    ).toBe("https://cdn.example.com/welcome.mp4")
  })
})
