import { describe, expect, it } from "vitest"

import {
  buildWorkspaceCanvasV2CardNode,
  resolveWorkspaceCanvasAcceleratorCardSize,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-helpers"
import type { WorkspaceBoardNodeData } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node"

describe("workspace canvas v2 card node builder", () => {
  it("builds the accelerator card node with intrinsic height on the canvas", () => {
    const node = buildWorkspaceCanvasV2CardNode({
      cardId: "accelerator",
      position: { x: 0, y: 0 },
      data: { size: "sm" } as WorkspaceBoardNodeData,
      allowEditing: true,
    })

    expect(node.className).toContain("h-auto")
    expect(node.style?.width).toBe(400)
    expect(node.style?.minHeight).toBeUndefined()
    expect(node.style?.height).toBeUndefined()
  })

  it("builds the organization overview card node with intrinsic height on the canvas", () => {
    const node = buildWorkspaceCanvasV2CardNode({
      cardId: "organization-overview",
      position: { x: 0, y: 0 },
      data: { size: "md" } as WorkspaceBoardNodeData,
      allowEditing: true,
    })

    expect(node.className).toContain("h-auto")
    expect(node.style?.width).toBe(552)
    expect(node.style?.minHeight).toBeUndefined()
    expect(node.style?.height).toBeUndefined()
  })

  it("builds the programs card node with intrinsic height on the canvas", () => {
    const node = buildWorkspaceCanvasV2CardNode({
      cardId: "programs",
      position: { x: 0, y: 0 },
      data: { size: "md" } as WorkspaceBoardNodeData,
      allowEditing: true,
    })

    expect(node.className).toContain("h-auto")
    expect(node.style?.width).toBe(440)
    expect(node.style?.minHeight).toBeUndefined()
    expect(node.style?.height).toBeUndefined()
  })

  it("builds the communications card node with intrinsic height on the canvas", () => {
    const node = buildWorkspaceCanvasV2CardNode({
      cardId: "communications",
      position: { x: 0, y: 0 },
      data: { size: "md" } as WorkspaceBoardNodeData,
      allowEditing: true,
    })

    expect(node.className).toContain("h-auto")
    expect(node.style?.width).toBe(560)
    expect(node.style?.minHeight).toBeUndefined()
    expect(node.style?.height).toBeUndefined()
  })

  it("builds the calendar card node with intrinsic height on the canvas", () => {
    const node = buildWorkspaceCanvasV2CardNode({
      cardId: "calendar",
      position: { x: 0, y: 0 },
      data: { size: "sm" } as WorkspaceBoardNodeData,
      allowEditing: true,
    })

    expect(node.className).toContain("h-auto")
    expect(node.style?.width).toBe(320)
    expect(node.style?.minHeight).toBeUndefined()
    expect(node.style?.height).toBeUndefined()
  })

  it("builds the execution card node with intrinsic height on the canvas", () => {
    const node = buildWorkspaceCanvasV2CardNode({
      cardId: "deck",
      position: { x: 0, y: 0 },
      data: { size: "md" } as WorkspaceBoardNodeData,
      allowEditing: true,
    })

    expect(node.className).toContain("h-auto")
    expect(node.style?.width).toBe(552)
    expect(node.style?.minHeight).toBeUndefined()
    expect(node.style?.height).toBeUndefined()
  })

  it("promotes the accelerator canvas card to lg while the module viewer is open", () => {
    expect(
      resolveWorkspaceCanvasAcceleratorCardSize({
        nodes: [{ id: "accelerator", x: 0, y: 0, size: "sm" }],
        acceleratorRuntimeSnapshot: {
          isModuleViewerOpen: true,
        } as never,
      }),
    ).toBe("lg")
  })

  it("collapses a stale lg accelerator node back to the compact canvas size when no module is open", () => {
    expect(
      resolveWorkspaceCanvasAcceleratorCardSize({
        nodes: [{ id: "accelerator", x: 0, y: 0, size: "lg" }],
        acceleratorRuntimeSnapshot: null,
      }),
    ).toBe("sm")
  })
})
