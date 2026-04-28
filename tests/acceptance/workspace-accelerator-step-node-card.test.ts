import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { WorkspaceAcceleratorStepNodeCard } from "@/features/workspace-accelerator-card/components/workspace-accelerator-step-node-card"

const useIsMobileMock = vi.fn(() => false)

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: () => undefined,
    push: () => undefined,
    replace: () => undefined,
    prefetch: () => Promise.resolve(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))

describe("workspace accelerator step node card", () => {
  beforeEach(() => {
    useIsMobileMock.mockReturnValue(false)
  })

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

    expect(markup).toContain("grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px]")
    expect(markup).toContain("border-t bg-muted/10")
    expect(markup).toContain("Notes")
    expect(markup).toContain("Close module")
  })

  it("renders the embedded organization setup flow as a clipped read-only preview", () => {
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
    expect(markup).toContain("pointer-events-none min-h-0 select-none")
    expect(markup).toContain("inert=")
    expect(markup).toContain("absolute inset-0 z-10 cursor-default")
    expect(markup).toContain("min-h-[520px] border-0 shadow-none")
    expect(markup).not.toContain("max-h-[min(52dvh,360px)]")
    expect(markup).not.toContain("bg-gradient-to-b from-transparent to-background/95")
    expect(markup).not.toContain("Choose your onboarding path")
    expect(markup).not.toContain("Unlock the builder workspace")
  })

  it("renders the fullscreen organization setup step without the framed header or footer chrome", () => {
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
        immersive: true,
      }),
    )

    expect(markup).toContain("Create your organization")
    expect(markup).toContain("rounded-none")
    expect(markup).toContain("border-0")
    expect(markup).toContain("flex h-full min-h-full flex-1 flex-col overflow-hidden")
    expect(markup).not.toContain("absolute inset-0 z-10 cursor-default")
    expect(markup).not.toContain("Previous accelerator step")
    expect(markup).not.toContain("Close accelerator module")
    expect(markup).not.toContain("Save to continue")
  })

  it("renders non-onboarding fullscreen steps as full-bleed without reintroducing the framed card shell", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorStepNodeCard, {
        step: {
          id: "workspace-onboarding-welcome:video",
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
        immersive: true,
      }),
    )

    expect(markup).toContain("border-0")
    expect(markup).toContain("rounded-none")
    expect(markup).toContain("Previous accelerator step")
    expect(markup).toContain("Close accelerator module")
    expect(markup).toContain("px-3 py-3 sm:px-4")
  })

  it("uses the real module title as the header when the step title is only a generic data label", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorStepNodeCard, {
        step: {
          id: "nfp-registration:video",
          moduleId: "nfp-registration",
          moduleTitle: "NFP registration",
          stepKind: "video",
          stepTitle: "Video",
          stepDescription: null,
          href: "/accelerator/class/formation/module/nfp-registration",
          status: "in_progress",
          stepSequenceIndex: 1,
          stepSequenceTotal: 1,
          moduleSequenceIndex: 1,
          moduleSequenceTotal: 1,
          groupTitle: "Formation",
          videoUrl: "https://cdn.example.com/nfp-registration.mp4",
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
      }),
    )

    expect(markup).toContain("NFP registration")
    expect(markup.match(/NFP registration/g)).toHaveLength(1)
  })

  it("moves module details into a mobile drawer flow instead of stacking the rail below the content", () => {
    useIsMobileMock.mockReturnValue(true)

    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorStepNodeCard, {
        step: {
          id: "workspace-onboarding-welcome:video",
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
      }),
    )

    expect(markup).toContain("Details")
    expect(markup).not.toContain(
      "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px]",
    )
  })
})
