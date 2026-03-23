import { describe, expect, it } from "vitest"

import type { WorkspaceAcceleratorCardStep } from "@/features/workspace-accelerator-card"
import {
  resolveWorkspaceAcceleratorStepVideoUrl,
  shouldShowWorkspaceAcceleratorModuleTitle,
} from "@/features/workspace-accelerator-card/components/workspace-accelerator-step-node-card-helpers"

function createStep(
  overrides: Partial<WorkspaceAcceleratorCardStep> = {},
): WorkspaceAcceleratorCardStep {
  return {
    id: "workspace-onboarding-welcome:lesson",
    moduleId: "workspace-onboarding-welcome",
    moduleTitle: "Welcome",
    stepKind: "lesson",
    stepTitle: "Welcome",
    stepDescription: "Start here.",
    href: "/workspace",
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
        view: "welcome",
        defaults: null,
      },
    },
    ...overrides,
  }
}

describe("workspace accelerator step node card helpers", () => {
  it("suppresses the module eyebrow when module and step titles are identical", () => {
    expect(
      shouldShowWorkspaceAcceleratorModuleTitle({
        moduleTitle: "Welcome",
        stepTitle: "Welcome",
      }),
    ).toBe(false)
    expect(
      shouldShowWorkspaceAcceleratorModuleTitle({
        moduleTitle: "Formation",
        stepTitle: "Lesson",
      }),
    ).toBe(true)
  })

  it("uses a placeholder lesson video for workspace welcome steps", () => {
    expect(
      resolveWorkspaceAcceleratorStepVideoUrl({
        step: createStep(),
        placeholderVideoUrl: "https://www.youtube.com/watch?v=abc123",
      }),
    ).toBe("https://www.youtube.com/watch?v=abc123")

    expect(
      resolveWorkspaceAcceleratorStepVideoUrl({
        step: createStep({ videoUrl: "https://www.youtube.com/watch?v=real456" }),
        placeholderVideoUrl: "https://www.youtube.com/watch?v=abc123",
      }),
    ).toBe("https://www.youtube.com/watch?v=real456")
  })
})
