import { describe, expect, it } from "vitest"

import {
  resolveWorkspaceCanvasPresentationHandoffDelayMs,
  resolveWorkspaceCanvasSceneTransitionTiming,
  resolveWorkspaceCanvasStageMotion,
  shouldWorkspaceCanvasAnimateInitialPresentation,
} from "@/lib/workspace-canvas/motion-spec"

describe("workspace canvas motion spec", () => {
  it("keeps the shared scene timing contract for accelerator entry", () => {
    expect(
      resolveWorkspaceCanvasSceneTransitionTiming({
        transitionKind: "accelerator-entry",
        prefersReducedMotion: false,
      }),
    ).toEqual({
      transitionKind: "accelerator-entry",
      layoutDurationMs: 300,
      cameraDelayMs: 40,
      cameraDurationMs: 360,
    })
  })

  it("stages the presentation frame and bottom fade off the same shared preset", () => {
    expect(resolveWorkspaceCanvasPresentationHandoffDelayMs("accelerator-entry")).toBe(
      140,
    )
    expect(
      shouldWorkspaceCanvasAnimateInitialPresentation("accelerator-entry", false),
    ).toBe(true)

    expect(
      resolveWorkspaceCanvasStageMotion({
        stage: "presentation-frame",
        preset: "accelerator-entry",
        prefersReducedMotion: false,
      }).transition?.y?.delay,
    ).toBe(0.04)

    expect(
      resolveWorkspaceCanvasStageMotion({
        stage: "bottom-fade",
        preset: "accelerator-entry",
        prefersReducedMotion: false,
      }).transition?.y?.delay,
    ).toBe(0.18)
  })

  it("uses the shared content-swap motion for local panel islands like the accelerator step view", () => {
    expect(
      resolveWorkspaceCanvasStageMotion({
        stage: "content-swap",
        preset: "default",
        prefersReducedMotion: false,
      }),
    ).toMatchObject({
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
    })
  })
})
