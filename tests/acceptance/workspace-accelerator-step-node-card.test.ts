import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { WorkspaceAcceleratorStepNodeCard } from "@/features/workspace-accelerator-card"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: () => undefined,
    push: () => undefined,
    replace: () => undefined,
    prefetch: () => Promise.resolve(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

describe("workspace accelerator step node card", () => {
  it("keeps the right rail visible during the tutorial module preview", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorStepNodeCard, {
        step: {
          id: "workspace-onboarding-welcome:lesson",
          moduleId: "workspace-onboarding-welcome",
          moduleTitle: "Welcome",
          stepKind: "video",
          stepTitle: "Welcome to Workspace",
          stepDescription: null,
          href: "/accelerator/class/formation/module/welcome",
          status: "in_progress",
          stepSequenceIndex: 1,
          stepSequenceTotal: 1,
          moduleSequenceIndex: 1,
          moduleSequenceTotal: 1,
          groupTitle: "Formation",
          videoUrl: "https://cdn.example.com/welcome.mp4",
          durationMinutes: 8,
          resources: [],
          hasAssignment: false,
          hasDeck: false,
        },
        stepIndex: 0,
        stepTotal: 1,
        canGoPrevious: false,
        canGoNext: false,
        completed: false,
        moduleCompleted: false,
        onPrevious: () => undefined,
        onNext: () => undefined,
        onComplete: () => undefined,
        onClose: () => undefined,
        variant: "embedded",
        tutorialInteractionPolicy: {
          stepId: "accelerator-close-module",
          allowedClassGroupKey: "formation",
          allowClassDropdownOpen: true,
          allowClassSelection: false,
          allowAccordionToggle: true,
          allowedModuleId: "workspace-onboarding-welcome",
          allowedStepId: "workspace-onboarding-welcome:lesson",
          allowPreviewPlayback: true,
          allowPreviewNavigation: false,
          allowPreviewClose: false,
          allowPreviewLinks: false,
          allowPreviewSubmit: false,
          blockedMessage: "We'll go over this soon, I promise! :)",
          blockedMessageDurationMs: 3000,
        },
      }),
    )

    expect(markup).toContain("grid-cols-[minmax(0,1fr)_240px]")
    expect(markup).toContain("Notes")
    expect(markup).toContain("Close module")
  })

  it("starts the embedded organization setup flow at the third onboarding step", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorStepNodeCard, {
        step: {
          id: "workspace-onboarding-organization-setup:lesson",
          moduleId: "workspace-onboarding-organization-setup",
          moduleTitle: "Organization setup",
          stepKind: "lesson",
          stepTitle: "Organization setup",
          stepDescription: null,
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
        stepIndex: 0,
        stepTotal: 1,
        canGoPrevious: false,
        canGoNext: false,
        completed: false,
        moduleCompleted: false,
        onPrevious: () => undefined,
        onNext: () => undefined,
        onComplete: () => undefined,
        onClose: () => undefined,
        onWorkspaceOnboardingSubmit: async () => undefined,
        variant: "embedded",
      }),
    )

    expect(markup).toContain("Organization setup")
    expect(markup).toContain("Step 1 of 3")
    expect(markup).toContain("Create your organization")
    expect(markup).not.toContain("Choose your onboarding path")
    expect(markup).not.toContain("Unlock the builder workspace")
  })
})
