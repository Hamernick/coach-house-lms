import { describe, expect, it } from "vitest"

import {
  resolveWorkspaceCanvasTutorialPositionOverrideForScene,
  resolveWorkspaceCanvasTutorialRuntime,
  resolveWorkspaceCanvasTutorialSceneSignature,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-runtime"
import { resolveCardDimensions } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout-config"
import type { WorkspaceCardId } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-types"

function rectsOverlap(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
) {
  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  )
}

const EXISTING_NODES = [
  { id: "organization-overview", x: 120, y: 220, size: "md" },
  { id: "programs", x: 632, y: 220, size: "md" },
  { id: "accelerator", x: 1144, y: 220, size: "sm" },
  { id: "brand-kit", x: 120, y: 692, size: "sm" },
  { id: "economic-engine", x: 1544, y: 220, size: "md" },
  { id: "calendar", x: 1544, y: 500, size: "sm" },
  { id: "communications", x: 1544, y: 988, size: "md" },
  { id: "deck", x: 480, y: 692, size: "md" },
  { id: "vault", x: 632, y: 220, size: "sm" },
  { id: "atlas", x: 840, y: 692, size: "md" },
] as const

describe("workspace canvas tutorial runtime", () => {
  it("starts with only the tutorial card visible", () => {
    const runtime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: 0,
      visibleCardIds: [],
      existingNodes: [...EXISTING_NODES],
    })

    expect(runtime.tutorialEdgeTargetCardId).toBeNull()
    expect(runtime.tutorialNodePosition).toEqual({ x: 560, y: 280 })
    expect(runtime.guidePlacement).toBe("center")
  })

  it("places the guide away from the visible cluster while keeping the current target", () => {
    const runtime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: 7,
      openedTutorialStepIds: ["accelerator", "calendar", "programs"],
      visibleCardIds: [
        "organization-overview",
        "accelerator",
        "calendar",
        "programs",
        "vault",
      ],
      existingNodes: [...EXISTING_NODES],
    })
    const tutorialRect = {
      x: runtime.tutorialNodePosition.x,
      y: runtime.tutorialNodePosition.y,
      width: Number(runtime.tutorialNodeStyle.width),
      height: Number(runtime.tutorialNodeStyle.minHeight),
    }
    const visibleRects = [
      { id: "organization-overview" as WorkspaceCardId, x: 120, y: 220, size: "md" as const },
      { id: "accelerator" as WorkspaceCardId, x: 1144, y: 220, size: "sm" as const },
      { id: "calendar" as WorkspaceCardId, x: 1544, y: 500, size: "sm" as const },
      { id: "programs" as WorkspaceCardId, x: 632, y: 220, size: "md" as const },
      { id: "vault" as WorkspaceCardId, x: 632, y: 220, size: "sm" as const },
    ].map((node) => ({
      ...node,
      ...resolveCardDimensions(node.size, node.id),
    }))

    expect(runtime.tutorialEdgeTargetCardId).toBe("organization-overview")
    expect(runtime.guidePlacement).toBe("above")
    expect(visibleRects.every((rect) => !rectsOverlap(tutorialRect, rect))).toBe(
      true,
    )
  })

  it("targets the current tool once it becomes visible", () => {
    const runtime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: 4,
      openedTutorialStepIds: ["accelerator", "calendar"],
      visibleCardIds: ["organization-overview", "accelerator", "calendar"],
      existingNodes: [...EXISTING_NODES],
    })

    expect(runtime.tutorialEdgeTargetCardId).toBe("calendar")
  })

  it("keeps the accelerator introduction scene non-overlapping", () => {
    const runtime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: 3,
      openedTutorialStepIds: ["accelerator"],
      visibleCardIds: ["organization-overview", "accelerator"],
      existingNodes: [...EXISTING_NODES],
    })
    const tutorialRect = {
      x: runtime.tutorialNodePosition.x,
      y: runtime.tutorialNodePosition.y,
      width: Number(runtime.tutorialNodeStyle.width),
      height: Number(runtime.tutorialNodeStyle.minHeight),
    }
    const organizationRect = {
      x: 120,
      y: 220,
      ...resolveCardDimensions("md", "organization-overview"),
    }
    const acceleratorRect = {
      x: 1144,
      y: 220,
      ...resolveCardDimensions("sm", "accelerator"),
    }

    expect(runtime.tutorialEdgeTargetCardId).toBe("accelerator")
    expect(runtime.guidePlacement).toBe("above")
    expect(rectsOverlap(tutorialRect, organizationRect)).toBe(false)
    expect(rectsOverlap(tutorialRect, acceleratorRect)).toBe(false)
  })

  it("moves the guide toward the currently introduced tool instead of the full cluster", () => {
    const runtime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: 7,
      openedTutorialStepIds: ["accelerator", "calendar", "programs", "documents", "fundraising"],
      visibleCardIds: [
        "organization-overview",
        "accelerator",
        "calendar",
        "programs",
        "vault",
        "economic-engine",
      ],
      existingNodes: [...EXISTING_NODES],
    })

    expect(runtime.tutorialEdgeTargetCardId).toBe("economic-engine")
    expect(runtime.tutorialNodePosition.x).toBeGreaterThan(1200)
    expect(runtime.guidePlacement).toBe("above")
  })

  it("scopes manual guide drag overrides to the current tutorial scene", () => {
    const organizationSceneSignature = resolveWorkspaceCanvasTutorialSceneSignature({
      tutorialActive: true,
      tutorialStepIndex: 1,
      openedTutorialStepIds: [],
    })
    const acceleratorSceneSignature = resolveWorkspaceCanvasTutorialSceneSignature({
      tutorialActive: true,
      tutorialStepIndex: 3,
      openedTutorialStepIds: [],
    })

    expect(
      resolveWorkspaceCanvasTutorialPositionOverrideForScene(
        { x: 704, y: 168, sceneSignature: organizationSceneSignature! },
        organizationSceneSignature,
      ),
    ).toEqual({ x: 704, y: 168 })
    expect(
      resolveWorkspaceCanvasTutorialPositionOverrideForScene(
        { x: 704, y: 168, sceneSignature: organizationSceneSignature! },
        acceleratorSceneSignature,
      ),
    ).toBeNull()
  })
})
