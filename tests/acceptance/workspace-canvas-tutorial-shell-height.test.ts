import { describe, expect, it } from "vitest"

import {
  resolveWorkspaceTutorialRenderedShellHeight,
  shouldWorkspaceTutorialMeasurePresentationContentHeight,
  shouldWorkspaceTutorialUseMeasuredShellHeight,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-shell-height"

describe("workspace tutorial rendered shell height", () => {
  it("prefers the measured shell height for adaptive families when available", () => {
    expect(
      resolveWorkspaceTutorialRenderedShellHeight({
        family: "accelerator-module",
        estimatedShellHeight: 960,
        measuredShellHeight: 1188,
      }),
    ).toBe(1188)

    expect(
      resolveWorkspaceTutorialRenderedShellHeight({
        family: "welcome",
        estimatedShellHeight: 324,
        measuredShellHeight: 372,
      }),
    ).toBe(372)
  })

  it("falls back to the estimated shell height when no measured value exists", () => {
    expect(
      resolveWorkspaceTutorialRenderedShellHeight({
        family: "tool",
        estimatedShellHeight: 960,
        measuredShellHeight: null,
      }),
    ).toBe(960)
  })

  it("ignores measured shell heights for fixed-height families", () => {
    expect(
      resolveWorkspaceTutorialRenderedShellHeight({
        family: "overview",
        estimatedShellHeight: 664,
        measuredShellHeight: 724,
      }),
    ).toBe(664)

    expect(shouldWorkspaceTutorialUseMeasuredShellHeight("welcome")).toBe(true)
    expect(shouldWorkspaceTutorialUseMeasuredShellHeight("overview")).toBe(false)
    expect(shouldWorkspaceTutorialUseMeasuredShellHeight("accelerator")).toBe(false)
    expect(shouldWorkspaceTutorialUseMeasuredShellHeight("tool")).toBe(true)
    expect(
      shouldWorkspaceTutorialUseMeasuredShellHeight("accelerator-module"),
    ).toBe(true)
    expect(
      shouldWorkspaceTutorialMeasurePresentationContentHeight("overview"),
    ).toBe(true)
    expect(
      shouldWorkspaceTutorialMeasurePresentationContentHeight("accelerator"),
    ).toBe(false)
    expect(
      shouldWorkspaceTutorialMeasurePresentationContentHeight("tool"),
    ).toBe(false)
    expect(
      shouldWorkspaceTutorialMeasurePresentationContentHeight(
        "accelerator-module",
      ),
    ).toBe(false)
    expect(
      shouldWorkspaceTutorialMeasurePresentationContentHeight("map"),
    ).toBe(true)
  })
})
