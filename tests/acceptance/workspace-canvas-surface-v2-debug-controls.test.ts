import { describe, expect, it } from "vitest"

import { shouldShowWorkspaceCanvasInternalTutorialRestart } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-debug-controls"

describe("workspace canvas v2 debug controls", () => {
  it("shows the tutorial restart control only in local development editing mode", () => {
    expect(
      shouldShowWorkspaceCanvasInternalTutorialRestart({
        allowEditing: true,
        presentationMode: false,
        environment: "development",
      }),
    ).toBe(true)
  })

  it("hides the tutorial restart control in production even for editors", () => {
    expect(
      shouldShowWorkspaceCanvasInternalTutorialRestart({
        allowEditing: true,
        presentationMode: false,
        environment: "production",
      }),
    ).toBe(false)
  })

  it("hides the tutorial restart control outside editing mode", () => {
    expect(
      shouldShowWorkspaceCanvasInternalTutorialRestart({
        allowEditing: false,
        presentationMode: false,
        environment: "development",
      }),
    ).toBe(false)

    expect(
      shouldShowWorkspaceCanvasInternalTutorialRestart({
        allowEditing: true,
        presentationMode: true,
        environment: "development",
      }),
    ).toBe(false)
  })
})
