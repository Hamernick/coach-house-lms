import { describe, expect, it } from "vitest"

import { resolveWorkspaceTutorialSceneCameraViewport } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-camera"

describe("workspace tutorial camera viewport", () => {
  it("recenters paired tutorial scenes from the final adapted shell geometry", () => {
    expect(
      resolveWorkspaceTutorialSceneCameraViewport({
        tutorialNodePosition: { x: 752, y: 50 },
        shellWidth: 560,
        shellHeight: 1040,
        tutorialSceneCameraViewport: {
          x: 1032,
          y: 570,
          zoom: 0.64,
          duration: 240,
        },
      }),
    ).toEqual({
      x: 1032,
      y: 570,
      zoom: 0.64,
      duration: 240,
    })

    expect(
      resolveWorkspaceTutorialSceneCameraViewport({
        tutorialNodePosition: { x: 752, y: 50 },
        shellWidth: 560,
        shellHeight: 1184,
        tutorialSceneCameraViewport: {
          x: 1032,
          y: 570,
          zoom: 0.64,
          duration: 240,
        },
      }),
    ).toEqual({
      x: 1032,
      y: 642,
      zoom: 0.64,
      duration: 240,
    })
  })
})
