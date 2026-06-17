import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import {
  buildWorkspaceCanvasV2CardNode,
  resolveWorkspaceCanvasRenderNodes,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-helpers"
import type { WorkspaceBoardNodeData } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node-types"
import type { WorkspaceCardId } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-types"

describe("workspace canvas v2 render state", () => {
  it("reconciles the live accelerator node width to lg when the module viewer opens outside tutorial mode", () => {
    const previousNodes = [
      buildWorkspaceCanvasV2CardNode({
        cardId: "accelerator",
        position: { x: 0, y: 0 },
        data: {
          cardId: "accelerator",
          size: "sm",
        } as WorkspaceBoardNodeData,
        allowEditing: true,
      }),
    ]

    const renderNodes = resolveWorkspaceCanvasRenderNodes({
      nodes: previousNodes,
      visibleCardIds: ["accelerator"],
      boardNodeLookup: new Map([
        ["accelerator", { id: "accelerator", x: 0, y: 0, size: "sm" }],
      ]),
      cardDataLookup: {
        accelerator: {
          cardId: "accelerator",
          size: "lg",
        } as WorkspaceBoardNodeData,
      } as Record<WorkspaceCardId, WorkspaceBoardNodeData>,
      orgNodePositionFromBoard: { x: 0, y: 0 },
      allowEditing: true,
      acceleratorStepNodeData: null,
      tutorialNodeData: null,
      workspacePersonPlacements: [],
      workspacePersonById: new Map(),
      onRemoveWorkspacePerson: () => {},
      tutorialCardPositionOverrides: null,
      tutorialDraggableCardIds: [],
    })

    expect(renderNodes).toHaveLength(1)
    expect(renderNodes[0]?.style?.width).toBe(1180)
  })

  it("guards person placements before iterating canvas node lists", () => {
    const nodeBuilderSource = readFileSync(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-node-builders.ts",
      "utf8"
    )
    const reconcileSource = readFileSync(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-reconcile.ts",
      "utf8"
    )

    expect(nodeBuilderSource).toContain(
      "const safeWorkspacePersonPlacements = Array.isArray(workspacePersonPlacements)"
    )
    expect(nodeBuilderSource).toContain(
      "for (const placement of safeWorkspacePersonPlacements)"
    )
    expect(reconcileSource).toContain(
      "const safeWorkspacePersonPlacements = Array.isArray(workspacePersonPlacements)"
    )
    expect(reconcileSource).toContain(
      "for (const placement of safeWorkspacePersonPlacements)"
    )
  })
})
