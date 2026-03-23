import { describe, expect, it, vi } from "vitest"

import {
  executeWorkspaceCanvasViewportCommand,
  resolveWorkspaceCanvasViewportCommand,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/runtime/workspace-canvas-viewport-command"

const LAYOUT_OPTIONS = {
  padding: 0.24,
  minZoom: 0.2,
  maxZoom: 1.25,
  duration: 220,
} as const

const SCENE_OPTIONS = {
  padding: 0.3,
  minZoom: 0.24,
  maxZoom: 1.14,
  duration: 280,
} as const

const FOCUS_OPTIONS = {
  padding: 0.34,
  minZoom: 0.24,
  maxZoom: 1.15,
  duration: 240,
} as const

describe("workspace canvas viewport command", () => {
  it("uses the shared precedence of scene-fit, then tutorial completion exit, then focus-card, then fit-visible", () => {
    expect(
      resolveWorkspaceCanvasViewportCommand({
        tutorialSceneFitRequest: {
          nodeIds: ["workspace-canvas-tutorial"],
          requestKey: 2,
          signature: "scene::2",
          layoutKey: "scene-layout",
          x: 100,
          y: 200,
          zoom: 0.72,
        },
        tutorialCompletionExitRequest: {
          kind: "focus-card",
          cardId: "accelerator",
          requestKey: 4,
        },
        focusCardRequest: {
          cardId: "calendar",
          requestKey: 5,
        },
        journeyGuideTargetCardId: "accelerator",
        visibleNodeIds: ["organization-overview", "calendar", "accelerator"],
      }),
    ).toEqual({
      kind: "scene-fit",
      sceneFitRequest: {
        nodeIds: ["workspace-canvas-tutorial"],
        requestKey: 2,
        signature: "scene::2",
        layoutKey: "scene-layout",
        x: 100,
        y: 200,
        zoom: 0.72,
      },
    })

    expect(
      resolveWorkspaceCanvasViewportCommand({
        tutorialSceneFitRequest: null,
        tutorialCompletionExitRequest: {
          kind: "focus-card",
          cardId: "accelerator",
          requestKey: 4,
        },
        focusCardRequest: {
          cardId: "calendar",
          requestKey: 5,
        },
        journeyGuideTargetCardId: "accelerator",
        visibleNodeIds: ["organization-overview", "calendar", "accelerator"],
      }),
    ).toEqual({
      kind: "focus-card",
      cardId: "accelerator",
    })

    expect(
      resolveWorkspaceCanvasViewportCommand({
        tutorialSceneFitRequest: null,
        tutorialCompletionExitRequest: {
          kind: "focus-card",
          cardId: "deck",
          requestKey: 4,
        },
        focusCardRequest: {
          cardId: "calendar",
          requestKey: 5,
        },
        journeyGuideTargetCardId: "accelerator",
        visibleNodeIds: ["organization-overview", "calendar", "accelerator"],
      }),
    ).toEqual({
      kind: "fit-visible",
      nodeIds: ["organization-overview", "calendar", "accelerator"],
    })

    expect(
      resolveWorkspaceCanvasViewportCommand({
        tutorialSceneFitRequest: null,
        tutorialCompletionExitRequest: null,
        focusCardRequest: {
          cardId: "calendar",
          requestKey: 5,
        },
        journeyGuideTargetCardId: "accelerator",
        visibleNodeIds: ["organization-overview", "calendar", "accelerator"],
      }),
    ).toEqual({
      kind: "focus-card",
      cardId: "calendar",
    })

    expect(
      resolveWorkspaceCanvasViewportCommand({
        tutorialSceneFitRequest: null,
        tutorialCompletionExitRequest: null,
        focusCardRequest: null,
        journeyGuideTargetCardId: null,
        visibleNodeIds: ["organization-overview", "accelerator"],
      }),
    ).toEqual({
      kind: "fit-visible",
      nodeIds: ["organization-overview", "accelerator"],
    })
  })

  it("executes authored scene-fit centers through the shared viewport executor", () => {
    const setCenter = vi.fn()
    const fitView = vi.fn()
    const flowInstance = {
      getNodes: vi.fn(() => []),
      setCenter,
      fitView,
    } as const

    executeWorkspaceCanvasViewportCommand({
      flowInstance: flowInstance as never,
      command: {
        kind: "scene-fit",
        sceneFitRequest: {
          nodeIds: ["workspace-canvas-tutorial"],
          requestKey: 1,
          signature: "scene::1",
          layoutKey: "scene-layout",
          x: 512,
          y: 388,
          zoom: 2,
          duration: 320,
        },
      },
      layoutFitOptions: LAYOUT_OPTIONS,
      sceneFitOptions: SCENE_OPTIONS,
      focusCardOptions: FOCUS_OPTIONS,
    })

    expect(setCenter).toHaveBeenCalledWith(512, 388, {
      zoom: 1.14,
      duration: 320,
    })
    expect(fitView).not.toHaveBeenCalled()
  })

  it("executes accelerator branch fits through the shared viewport executor", () => {
    const setCenter = vi.fn()
    const fitView = vi.fn()
    const flowInstance = {
      getNodes: vi.fn(() => [
        { id: "accelerator" },
        { id: "workspace-board-accelerator-step" },
      ]),
      setCenter,
      fitView,
    } as const

    const result = executeWorkspaceCanvasViewportCommand({
      flowInstance: flowInstance as never,
      command: {
        kind: "fit-nodes",
        nodeIds: ["accelerator", "workspace-board-accelerator-step"],
        options: "accelerator-focus",
      },
      layoutFitOptions: LAYOUT_OPTIONS,
      sceneFitOptions: SCENE_OPTIONS,
      focusCardOptions: FOCUS_OPTIONS,
      acceleratorFocusOptions: {
        padding: 0.4,
        minZoom: 0.3,
        maxZoom: 1.05,
        duration: 260,
      },
    })

    expect(result).toEqual({
      executed: true,
      kind: "fit-nodes",
      nodeCount: 2,
    })
    expect(fitView).toHaveBeenCalledWith({
      nodes: [{ id: "accelerator" }, { id: "workspace-board-accelerator-step" }],
      padding: 0.4,
      minZoom: 0.3,
      maxZoom: 1.05,
      duration: 260,
    })
    expect(setCenter).not.toHaveBeenCalled()
  })
})
