import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  WorkspaceAcceleratorCardFullscreenRailContent,
  resolveWorkspaceAcceleratorHeaderPickerScrollDistance,
  WorkspaceAcceleratorCardSidebar,
  WorkspaceAcceleratorHeaderPicker,
} from "@/features/workspace-accelerator-card/components/workspace-accelerator-card-panel-support"
import { WORKSPACE_ACCELERATOR_TUTORIAL_GUARD_CHROME_CLASSNAME } from "@/features/workspace-accelerator-card/components/workspace-accelerator-tutorial-guard-tooltip"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: () => {},
  }),
}))

function extractTriggerMarkup(markup: string) {
  const match = markup.match(/<button[^>]*aria-label="Choose a class track\.[^"]*"[^>]*>[\s\S]*?<\/button>/)
  return match?.[0] ?? ""
}

function extractTriggerBody(markup: string) {
  const match = markup.match(/<button[^>]*>([\s\S]*?)<\/button>/)
  return match?.[1] ?? ""
}

describe("workspace accelerator header picker", () => {
  it("only returns a hover pan distance when the label actually overflows", () => {
    expect(
      resolveWorkspaceAcceleratorHeaderPickerScrollDistance({
        contentWidth: 88,
        viewportWidth: 88,
      }),
    ).toBe(0)

    expect(
      resolveWorkspaceAcceleratorHeaderPickerScrollDistance({
        contentWidth: 60,
        viewportWidth: 88,
      }),
    ).toBe(0)

    expect(
      resolveWorkspaceAcceleratorHeaderPickerScrollDistance({
        contentWidth: 140,
        viewportWidth: 88,
      }),
    ).toBe(60)
  })

  it("renders a single visible class-track label path inside the trigger", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorHeaderPicker, {
        lessonGroupOptions: [
          { key: "formation", label: "Formation" },
          {
            key: "strategic-foundations",
            label: "Strategic Foundations",
          },
        ],
        selectedLessonGroupKey: "formation",
        tutorialCallout: null,
        onLessonGroupChange: () => {},
      }),
    )

    const triggerMarkup = extractTriggerMarkup(markup)
    const triggerBody = extractTriggerBody(triggerMarkup)

    expect(triggerBody).toContain("Formation")
    expect(triggerBody.match(/Formation/g)).toHaveLength(1)
    expect(triggerBody).not.toContain('data-slot="select-value"')
    expect(triggerMarkup).toContain(
      'aria-label="Choose a class track. Current selection: Formation"',
    )
    expect(triggerMarkup).toContain(
      'data-react-grab-owner-component="WorkspaceAcceleratorHeaderPicker"',
    )
    expect(triggerMarkup).toContain(
      'data-react-grab-owner-source="src/features/workspace-accelerator-card/components/workspace-accelerator-header-picker.tsx"',
    )
    expect(triggerMarkup).toContain("w-[196px]")
    expect(markup).toContain('class="inline-flex items-start pb-1"')
  })

  it("anchors the picker tutorial indicator on the right edge of the trigger", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorHeaderPicker, {
        lessonGroupOptions: [
          { key: "communications", label: "Communications" },
          { key: "formation", label: "Formation" },
        ],
        selectedLessonGroupKey: "communications",
        tutorialCallout: {
          focus: "picker",
          title: "Classes",
          instruction:
            "Choose a class track here to update the module list and focus on a different part of the Accelerator.",
        },
        tutorialInteractionPolicy: {
          stepId: "accelerator-picker",
          allowedClassGroupKey: "communications",
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
        },
        onLessonGroupChange: () => {},
      }),
    )

    const triggerMarkup = extractTriggerMarkup(markup)

    expect(triggerMarkup).toContain(
      'style="right:0;top:50%;transform:translate(0px, calc(-50% + 0px))"',
    )
    expect(triggerMarkup).toContain("bg-muted/70")
    expect(triggerMarkup).toContain("text-foreground")
    expect(triggerMarkup).toContain("supports-[backdrop-filter]:bg-muted/55")
    expect(triggerMarkup).toContain("dark:bg-input/30")
    expect(triggerMarkup).toContain("dark:text-foreground")
    expect(triggerMarkup).toContain("rounded-xl")
    expect(triggerMarkup).toContain("h-9")
    expect(triggerMarkup).toContain("border-border/60")
  })

  it("keeps the guarded picker on the same tutorial surface even when the picker callout is not the active one", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorHeaderPicker, {
        lessonGroupOptions: [
          { key: "formation", label: "Formation" },
          {
            key: "strategic-foundations",
            label: "Strategic Foundations",
          },
        ],
        selectedLessonGroupKey: "formation",
        tutorialCallout: null,
        tutorialInteractionPolicy: {
          stepId: "accelerator-first-module",
          allowedClassGroupKey: "formation",
          allowClassDropdownOpen: true,
          allowClassSelection: false,
          allowAccordionToggle: true,
          allowedModuleId: "workspace-onboarding-welcome",
          allowedStepId: "workspace-onboarding-welcome:lesson",
          allowPreviewPlayback: false,
          allowPreviewNavigation: false,
          allowPreviewClose: false,
          allowPreviewLinks: false,
          allowPreviewSubmit: false,
          blockedMessage: "We'll go over this soon, I promise! :)",
          blockedMessageDurationMs: 3000,
        },
        onLessonGroupChange: () => {},
      }),
    )

    const triggerMarkup = extractTriggerMarkup(markup)

    expect(triggerMarkup).toContain("bg-muted/70")
    expect(triggerMarkup).toContain("text-foreground")
    expect(triggerMarkup).toContain("supports-[backdrop-filter]:bg-muted/55")
    expect(triggerMarkup).toContain("dark:bg-input/30")
    expect(triggerMarkup).toContain("dark:text-foreground")
    expect(triggerMarkup).toContain("border-border/60")
  })

  it("uses the same inverse tooltip chrome as the workspace shortcut rail", () => {
    expect(WORKSPACE_ACCELERATOR_TUTORIAL_GUARD_CHROME_CLASSNAME).toContain(
      "bg-foreground",
    )
    expect(WORKSPACE_ACCELERATOR_TUTORIAL_GUARD_CHROME_CLASSNAME).toContain(
      "text-background",
    )
    expect(WORKSPACE_ACCELERATOR_TUTORIAL_GUARD_CHROME_CLASSNAME).toContain(
      "shadow-md",
    )
    expect(WORKSPACE_ACCELERATOR_TUTORIAL_GUARD_CHROME_CLASSNAME).toContain(
      "[&_[data-slot=tooltip-arrow]]:bg-foreground",
    )
    expect(WORKSPACE_ACCELERATOR_TUTORIAL_GUARD_CHROME_CLASSNAME).toContain(
      "[&_[data-slot=tooltip-arrow]]:fill-foreground",
    )
    expect(WORKSPACE_ACCELERATOR_TUTORIAL_GUARD_CHROME_CLASSNAME).toContain(
      "dark:bg-white",
    )
    expect(WORKSPACE_ACCELERATOR_TUTORIAL_GUARD_CHROME_CLASSNAME).toContain(
      "dark:text-slate-950",
    )
    expect(WORKSPACE_ACCELERATOR_TUTORIAL_GUARD_CHROME_CLASSNAME).toContain(
      "dark:[&_[data-slot=tooltip-arrow]]:bg-white",
    )
    expect(WORKSPACE_ACCELERATOR_TUTORIAL_GUARD_CHROME_CLASSNAME).toContain(
      "dark:[&_[data-slot=tooltip-arrow]]:fill-white",
    )
    expect(WORKSPACE_ACCELERATOR_TUTORIAL_GUARD_CHROME_CLASSNAME).not.toContain(
      "border-foreground/10",
    )
    expect(WORKSPACE_ACCELERATOR_TUTORIAL_GUARD_CHROME_CLASSNAME).not.toContain(
      "dark:border-black/10",
    )
  })

  it("uses the wider picker trigger only when the accelerator viewer is open", () => {
    const compactMarkup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorHeaderPicker, {
        lessonGroupOptions: [{ key: "formation", label: "Formation" }],
        selectedLessonGroupKey: "formation",
        tutorialCallout: null,
        viewerOpen: false,
        onLessonGroupChange: () => {},
      }),
    )
    const expandedMarkup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorHeaderPicker, {
        lessonGroupOptions: [{ key: "formation", label: "Formation" }],
        selectedLessonGroupKey: "formation",
        tutorialCallout: null,
        viewerOpen: true,
        onLessonGroupChange: () => {},
      }),
    )

    expect(extractTriggerMarkup(compactMarkup)).toContain("w-[196px]")
    expect(extractTriggerMarkup(compactMarkup)).not.toContain("w-[248px]")
    expect(extractTriggerMarkup(expandedMarkup)).toContain("w-[248px]")
  })

  it("uses a full-width trigger inside the accelerator right rail layout", () => {
    const railMarkup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorHeaderPicker, {
        lessonGroupOptions: [{ key: "formation", label: "Formation" }],
        selectedLessonGroupKey: "formation",
        tutorialCallout: null,
        viewerOpen: true,
        layout: "rail",
        onLessonGroupChange: () => {},
      }),
    )

    expect(extractTriggerMarkup(railMarkup)).toContain("w-full")
    expect(extractTriggerMarkup(railMarkup)).toContain("max-w-none")
    expect(extractTriggerMarkup(railMarkup)).not.toContain("w-[248px]")
    expect(railMarkup).toContain('class="flex w-full items-start"')
  })

  it("renders header controls above the progress strip in the accelerator rail sidebar", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorCardSidebar, {
        selectedLessonGroup: {
          key: "formation",
          label: "Formation",
          moduleIds: ["workspace-onboarding-welcome"],
        },
        tutorialCallout: null,
        filteredProgressPercent: 14,
        readinessSummary: null,
        checklistModules: [
          {
            id: "workspace-onboarding-welcome",
            title: "Welcome",
            groupTitle: "Formation",
            totalSteps: 1,
            completedStepCount: 0,
            isCurrent: true,
            steps: [
              {
                id: "workspace-onboarding-welcome:lesson",
                moduleId: "workspace-onboarding-welcome",
                moduleTitle: "Welcome",
                stepKind: "lesson",
                stepTitle: "Welcome to Workspace",
                stepDescription: null,
                href: "/accelerator/class/formation/module/welcome",
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
              },
            ],
          },
        ],
        currentStepId: "workspace-onboarding-welcome:lesson",
        completedStepIds: [],
        openModuleId: "workspace-onboarding-welcome",
        onOpenModuleIdChange: () => {},
        onStepSelect: () => {},
        tutorialTargetStepId: null,
        headerControls: React.createElement("div", null, "Header picker"),
      }),
    )

    expect(markup).toContain("Header picker")
    expect(markup.indexOf("Header picker")).toBeLessThan(markup.indexOf("Progress"))
  })

  it("renders the roadmap/accelerator rail switcher above the class picker and includes roadmap content", () => {
    const acceleratorMarkup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorCardFullscreenRailContent, {
        selectedLessonGroup: {
          key: "formation",
          label: "Formation",
          moduleIds: ["workspace-onboarding-welcome"],
        },
        lessonGroupOptions: [
          { key: "formation", label: "Formation" },
          { key: "fundraising", label: "Fundraising" },
        ],
        selectedLessonGroupKey: "formation",
        onLessonGroupChange: () => {},
        tutorialCallout: null,
        filteredProgressPercent: 14,
        readinessSummary: null,
        checklistModules: [
          {
            id: "workspace-onboarding-welcome",
            title: "Welcome",
            groupTitle: "Formation",
            totalSteps: 1,
            completedStepCount: 0,
            isCurrent: true,
            steps: [
              {
                id: "workspace-onboarding-welcome:lesson",
                moduleId: "workspace-onboarding-welcome",
                moduleTitle: "Welcome",
                stepKind: "lesson",
                stepTitle: "Welcome to Workspace",
                stepDescription: null,
                href: "/accelerator/class/formation/module/welcome",
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
              },
            ],
          },
        ],
        currentStepId: "workspace-onboarding-welcome:lesson",
        completedStepIds: [],
        openModuleId: "workspace-onboarding-welcome",
        onOpenModuleIdChange: () => {},
        onStepSelect: () => {},
        tutorialTargetStepId: null,
        roadmapSections: [
          {
            id: "mission-vision-values",
            title: "Mission, Vision, Values",
            subtitle: "Clarify your north star",
            slug: "mission-vision-values",
            content: "Define the principles that guide the organization.",
            lastUpdated: null,
            isPublic: false,
            layout: "vertical",
            status: "in_progress",
            templateTitle: "Mission, Vision, Values",
            templateSubtitle: "Clarify your north star",
            titleIsTemplate: false,
            subtitleIsTemplate: false,
          },
        ],
      }),
    )
    const roadmapMarkup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorCardFullscreenRailContent, {
        selectedLessonGroup: {
          key: "formation",
          label: "Formation",
          moduleIds: ["workspace-onboarding-welcome"],
        },
        lessonGroupOptions: [
          { key: "formation", label: "Formation" },
          { key: "fundraising", label: "Fundraising" },
        ],
        selectedLessonGroupKey: "formation",
        onLessonGroupChange: () => {},
        tutorialCallout: null,
        filteredProgressPercent: 14,
        readinessSummary: null,
        checklistModules: [
          {
            id: "workspace-onboarding-welcome",
            title: "Welcome",
            groupTitle: "Formation",
            totalSteps: 1,
            completedStepCount: 0,
            isCurrent: true,
            steps: [
              {
                id: "workspace-onboarding-welcome:lesson",
                moduleId: "workspace-onboarding-welcome",
                moduleTitle: "Welcome",
                stepKind: "lesson",
                stepTitle: "Welcome to Workspace",
                stepDescription: null,
                href: "/accelerator/class/formation/module/welcome",
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
              },
            ],
          },
        ],
        currentStepId: "workspace-onboarding-welcome:lesson",
        completedStepIds: [],
        openModuleId: "workspace-onboarding-welcome",
        onOpenModuleIdChange: () => {},
        onStepSelect: () => {},
        tutorialTargetStepId: null,
        roadmapSections: [
          {
            id: "mission-vision-values",
            title: "Mission, Vision, Values",
            subtitle: "Clarify your north star",
            slug: "mission-vision-values",
            content: "Define the principles that guide the organization.",
            lastUpdated: null,
            isPublic: false,
            layout: "vertical",
            status: "in_progress",
            templateTitle: "Mission, Vision, Values",
            templateSubtitle: "Clarify your north star",
            titleIsTemplate: false,
            subtitleIsTemplate: false,
          },
        ],
        initialView: "roadmap",
      }),
    )

    expect(acceleratorMarkup).toContain("Roadmap")
    expect(acceleratorMarkup).toContain("Accelerator")
    expect(acceleratorMarkup).toContain('data-slot="tabs-list"')
    expect(acceleratorMarkup).toContain("w-full gap-1 rounded-full")
    expect(acceleratorMarkup).toContain("min-w-0 flex-1")
    expect(acceleratorMarkup).not.toContain(
      'data-react-grab-owner-id="workspace-accelerator-checklist:workspace-onboarding-welcome:lesson"',
    )
    expect(acceleratorMarkup.indexOf("Roadmap")).toBeLessThan(
      acceleratorMarkup.indexOf('aria-label="Choose a class track. Current selection: Formation"'),
    )
    expect(roadmapMarkup).toContain("Mission, Vision, Values")
  })
})
