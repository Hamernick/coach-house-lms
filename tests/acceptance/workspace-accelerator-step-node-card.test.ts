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
  usePathname: () => "/workspace/accelerator",
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
    expect(markup).toContain("Close lesson")
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
    expect(markup).toContain("Close accelerator lesson")
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

  it("replaces the embedded Complete footer button with assignment step navigation", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorStepNodeCard, {
        step: {
          id: "origin-module:assignment:assignment-overview",
          moduleId: "origin-module",
          moduleTitle: "Start with your why",
          stepKind: "assignment",
          stepTitle: "Overview",
          stepDescription: null,
          assignmentSectionId: "assignment-overview",
          href: "/workspace/accelerator?step=origin-module%3Aassignment%3Aassignment-overview",
          status: "in_progress",
          stepSequenceIndex: 1,
          stepSequenceTotal: 2,
          moduleSequenceIndex: 1,
          moduleSequenceTotal: 1,
          groupTitle: "Strategic Foundations",
          videoUrl: null,
          durationMinutes: null,
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
                label: "How to approach this exercise",
                type: "subtitle",
                screen: "intro",
                description: "Review the context first.",
              },
              {
                name: "origin_roots_place",
                label: "Where did you grow up?",
                type: "long_text",
                screen: "question",
              },
            ],
          },
        },
        stepIndex: 0,
        stepTotal: 2,
        canGoPrevious: false,
        canGoNext: true,
        completed: false,
        moduleCompleted: false,
        onPrevious: () => undefined,
        onNext: () => undefined,
        onComplete: () => undefined,
        onClose: () => undefined,
        variant: "embedded",
      }),
    )

    expect(markup).toContain("border-t px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 sm:px-4 sm:pb-2")
    expect(markup.match(/Start questions/g)).toHaveLength(1)
    expect(markup).toContain("rounded-full")
    expect(markup).toContain("w-full")
    expect(markup).toContain("sm:w-auto")
    expect(markup).not.toContain(">Complete</button>")
    expect(markup).not.toContain("sm:h-7 sm:w-auto")
  })

  it("uses the lesson title in assignment headers so question labels are not duplicated", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorStepNodeCard, {
        step: {
          id: "origin-module:assignment:section-1",
          moduleId: "origin-module",
          moduleTitle: "Start with your why",
          stepKind: "assignment",
          stepTitle: "Where did you grow up?",
          stepDescription: null,
          assignmentSectionId: "section-1",
          href: "/workspace/accelerator?step=origin-module%3Aassignment%3Asection-1",
          status: "in_progress",
          stepSequenceIndex: 2,
          stepSequenceTotal: 2,
          moduleSequenceIndex: 1,
          moduleSequenceTotal: 1,
          groupTitle: "Strategic Foundations",
          videoUrl: null,
          durationMinutes: null,
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
                name: "origin_roots_place",
                label: "Where did you grow up?",
                type: "long_text",
                screen: "question",
              },
            ],
          },
        },
        stepIndex: 1,
        stepTotal: 2,
        canGoPrevious: true,
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

    expect(markup).toContain("Start with your why")
    expect(markup.match(/Start with your why/g)).toHaveLength(1)
    expect(markup).toContain('aria-label="Done reviewing this lesson"')
    expect(markup).toContain("Done")
    expect(markup).toContain("min-w-[76px]")
    expect(markup).toContain("bg-background/90")
    expect(markup).not.toContain("bg-sky-500/12")
    expect(markup).not.toContain("h-7 w-auto")
    expect(markup).toContain(">Complete<")
    expect(markup).not.toContain("Finish lesson")
    expect(markup.match(/Where did you grow up\\?/g)).toHaveLength(1)
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
