import { describe, expect, it } from "vitest"

import { shouldShowWorkspaceCanvasInternalTutorialRestart } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-debug-controls"

describe("workspace canvas v2 debug controls", () => {
  it("hides the tutorial restart control for local development non-admin editors", () => {
    expect(
      shouldShowWorkspaceCanvasInternalTutorialRestart({
        allowEditing: true,
        isPlatformAdmin: false,
        presentationMode: false,
        environment: "development",
      }),
    ).toBe(false)
  })

  it("hides the tutorial restart control in production for non-admin editors", () => {
    expect(
      shouldShowWorkspaceCanvasInternalTutorialRestart({
        allowEditing: true,
        isPlatformAdmin: false,
        presentationMode: false,
        environment: "production",
      }),
    ).toBe(false)
  })

  it("shows the tutorial restart control in production for platform admins", () => {
    expect(
      shouldShowWorkspaceCanvasInternalTutorialRestart({
        allowEditing: true,
        isPlatformAdmin: true,
        presentationMode: false,
        environment: "production",
      }),
    ).toBe(true)
  })

  it("shows the tutorial restart control for platform admins outside org editing mode", () => {
    expect(
      shouldShowWorkspaceCanvasInternalTutorialRestart({
        allowEditing: false,
        isPlatformAdmin: true,
        presentationMode: false,
        environment: "development",
      }),
    ).toBe(true)
  })

  it("hides the tutorial restart control outside editing mode", () => {
    expect(
      shouldShowWorkspaceCanvasInternalTutorialRestart({
        allowEditing: false,
        isPlatformAdmin: false,
        presentationMode: false,
        environment: "development",
      }),
    ).toBe(false)

    expect(
      shouldShowWorkspaceCanvasInternalTutorialRestart({
        allowEditing: true,
        isPlatformAdmin: true,
        presentationMode: true,
        environment: "development",
      }),
    ).toBe(false)
  })
})
