import { describe, expect, it } from "vitest"

import {
  buildWorkspaceCanvasV2Edges,
  resolveWorkspaceCanvasDisconnectActionSets,
  resolveWorkspaceCanvasConnectAttempt,
  shouldLogWorkspaceCanvasDroppedConnections,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/runtime/workspace-canvas-connections"
import {
  WORKSPACE_CARD_SOURCE_HANDLE_IDS,
  WORKSPACE_CARD_TARGET_HANDLE_IDS,
  resolveWorkspaceCardConnectionHandleIds,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-connection-handles"
import type { WorkspaceCardReadiness } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/runtime/workspace-canvas-card-readiness"
import { WORKSPACE_EDGE_SPECS } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-copy"

const READY: WorkspaceCardReadiness = { status: "ready", isReady: true }
const EMPTY: WorkspaceCardReadiness = { status: "empty", isReady: false }
const READINESS_MAP = {
  "organization-overview": READY,
  programs: READY,
  roadmap: READY,
  accelerator: READY,
  "brand-kit": EMPTY,
  "economic-engine": EMPTY,
  calendar: READY,
  communications: EMPTY,
  atlas: EMPTY,
  deck: READY,
}

describe("workspace canvas v2 runtime connections", () => {
  it("accepts valid visible connections in edit mode", () => {
    const result = resolveWorkspaceCanvasConnectAttempt({
      connection: {
        source: "organization-overview",
        target: "programs",
      },
      allowEditing: true,
      visibleCardIdSet: new Set([
        "organization-overview",
        "programs",
      ]),
    })

    expect(result).toEqual({
      allowed: true,
      source: "organization-overview",
      target: "programs",
      matchedPortType: "organization-context",
    })
  })

  it("rejects invalid runtime attempts with explicit reasons", () => {
    expect(
      resolveWorkspaceCanvasConnectAttempt({
        connection: {
          source: "organization-overview",
          target: "programs",
        },
        allowEditing: false,
        visibleCardIdSet: new Set([
          "organization-overview",
          "programs",
        ]),
      }),
    ).toEqual({ allowed: false, reason: "read-only" })

    expect(
      resolveWorkspaceCanvasConnectAttempt({
        connection: {
          source: "organization-overview",
          target: "deck",
        },
        allowEditing: true,
        visibleCardIdSet: new Set(["organization-overview"]),
      }),
    ).toEqual({ allowed: false, reason: "hidden-node-id" })

    expect(
      resolveWorkspaceCanvasConnectAttempt({
        connection: {
          source: "legacy-card",
          target: "programs",
        },
        allowEditing: true,
        visibleCardIdSet: new Set(["programs"]),
      }),
    ).toEqual({ allowed: false, reason: "unknown-node-id" })

    expect(
      resolveWorkspaceCanvasConnectAttempt({
        connection: {
          source: "organization-overview",
          target: "programs",
        },
        allowEditing: true,
        visibleCardIdSet: new Set(["organization-overview"]),
      }),
    ).toEqual({ allowed: false, reason: "hidden-node-id" })

    expect(
      resolveWorkspaceCanvasConnectAttempt({
        connection: {
          source: "calendar",
          target: "calendar",
        },
        allowEditing: true,
        visibleCardIdSet: new Set(["calendar"]),
      }),
    ).toEqual({ allowed: false, reason: "same-node" })
  })

  it("builds only valid visible card edges and reports dropped ids", () => {
    const { edges, droppedConnectionIds, droppedConnections } = buildWorkspaceCanvasV2Edges({
      connections: [
        {
          id: "edge-valid",
          source: "organization-overview",
          target: "programs",
        },
        {
          id: "edge-valid-calendar-to-brand",
          source: "calendar",
          target: "brand-kit",
        },
        {
          id: "edge-unknown-node",
          source: "legacy-card" as never,
          target: "roadmap",
        },
        {
          id: "edge-hidden-target",
          source: "brand-kit",
          target: "communications",
        },
      ],
      visibleCardIdSet: new Set([
        "organization-overview",
        "programs",
        "brand-kit",
        "calendar",
      ]),
      presentationMode: false,
      readinessMap: {
        "organization-overview": READY,
        programs: READY,
        roadmap: READY,
        accelerator: READY,
        "brand-kit": EMPTY,
        "economic-engine": EMPTY,
        calendar: READY,
        communications: EMPTY,
        atlas: EMPTY,
        deck: READY,
      },
      includeAcceleratorStepEdge: true,
      acceleratorWorkspaceNodeId: "accelerator",
      tutorialEdgeTargetId: null,
    })

    expect(edges.map((edge) => edge.id)).toEqual([
      "edge-valid",
      "edge-valid-calendar-to-brand",
      "edge-accelerator-to-active-step",
    ])
    expect(droppedConnectionIds).toEqual([
      "edge-unknown-node",
      "edge-hidden-target",
    ])
    expect(droppedConnections).toEqual([
      { id: "edge-unknown-node", reason: "unknown-node-id" },
      { id: "edge-hidden-target", reason: "hidden-node-id" },
    ])
  })

  it("keeps default hidden graph connections quiet when secondary cards are not rendered", () => {
    const { droppedConnectionIds, droppedConnections } = buildWorkspaceCanvasV2Edges({
      connections: WORKSPACE_EDGE_SPECS,
      visibleCardIdSet: new Set([
        "organization-overview",
        "programs",
        "roadmap",
        "accelerator",
      ]),
      presentationMode: false,
      readinessMap: READINESS_MAP,
      includeAcceleratorStepEdge: false,
      acceleratorWorkspaceNodeId: null,
      tutorialEdgeTargetId: null,
    })

    expect(droppedConnectionIds).toEqual([
      "edge-roadmap-to-deck",
      "edge-organization-to-atlas",
      "edge-deck-to-accelerator",
      "edge-accelerator-to-economic",
      "edge-accelerator-to-calendar",
      "edge-accelerator-to-comms",
    ])
    expect(droppedConnections).toEqual(
      droppedConnectionIds.map((id) => ({
        id,
        reason: "hidden-node-id",
      })),
    )
    expect(shouldLogWorkspaceCanvasDroppedConnections(droppedConnections)).toBe(false)
  })

  it("resolves card connection handles from the closest aligned sides", () => {
    expect(
      resolveWorkspaceCardConnectionHandleIds({
        source: { x: 100, y: 100, width: 200, height: 120 },
        target: { x: 420, y: 112, width: 200, height: 120 },
      }),
    ).toMatchObject({
      sourceHandle: WORKSPACE_CARD_SOURCE_HANDLE_IDS.right,
      targetHandle: WORKSPACE_CARD_TARGET_HANDLE_IDS.left,
    })

    expect(
      resolveWorkspaceCardConnectionHandleIds({
        source: { x: 420, y: 112, width: 200, height: 120 },
        target: { x: 100, y: 100, width: 200, height: 120 },
      }),
    ).toMatchObject({
      sourceHandle: WORKSPACE_CARD_SOURCE_HANDLE_IDS.left,
      targetHandle: WORKSPACE_CARD_TARGET_HANDLE_IDS.right,
    })

    expect(
      resolveWorkspaceCardConnectionHandleIds({
        source: { x: 100, y: 100, width: 200, height: 120 },
        target: { x: 124, y: 380, width: 200, height: 120 },
      }),
    ).toMatchObject({
      sourceHandle: WORKSPACE_CARD_SOURCE_HANDLE_IDS.bottom,
      targetHandle: WORKSPACE_CARD_TARGET_HANDLE_IDS.top,
    })
  })

  it("attaches built graph edges to the side nearest the connected card", () => {
    const { edges } = buildWorkspaceCanvasV2Edges({
      connections: [
        {
          id: "edge-roadmap-to-accelerator",
          source: "roadmap",
          target: "accelerator",
        },
      ],
      visibleCardIdSet: new Set(["roadmap", "accelerator"]),
      presentationMode: false,
      readinessMap: {
        "organization-overview": READY,
        programs: READY,
        roadmap: READY,
        accelerator: READY,
        "brand-kit": EMPTY,
        "economic-engine": EMPTY,
        calendar: READY,
        communications: EMPTY,
        atlas: EMPTY,
      },
      includeAcceleratorStepEdge: false,
      acceleratorWorkspaceNodeId: null,
      tutorialEdgeTargetId: null,
      nodeGeometryLookup: {
        roadmap: { x: 640, y: 120, width: 320, height: 560 },
        accelerator: { x: 120, y: 144, width: 400, height: 252 },
      },
    })

    expect(edges[0]).toMatchObject({
      id: "edge-roadmap-to-accelerator",
      sourceHandle: WORKSPACE_CARD_SOURCE_HANDLE_IDS.left,
      targetHandle: WORKSPACE_CARD_TARGET_HANDLE_IDS.right,
    })
  })

  it("does not log dropped-connection warnings for hidden tutorial edges alone", () => {
    expect(
      shouldLogWorkspaceCanvasDroppedConnections([
        { id: "edge-hidden-target", reason: "hidden-node-id" },
      ]),
    ).toBe(false)

    expect(
      shouldLogWorkspaceCanvasDroppedConnections([
        { id: "edge-hidden-target", reason: "hidden-node-id" },
        { id: "edge-unknown-node", reason: "unknown-node-id" },
      ]),
    ).toBe(true)
  })

  it("keeps real graph edges when the tutorial edge is rendered", () => {
    const { edges } = buildWorkspaceCanvasV2Edges({
      connections: [
        {
          id: "edge-valid",
          source: "organization-overview",
          target: "programs",
        },
      ],
      visibleCardIdSet: new Set([
        "organization-overview",
        "programs",
      ]),
      presentationMode: false,
      readinessMap: {
        "organization-overview": READY,
        programs: READY,
        roadmap: READY,
        accelerator: READY,
        "brand-kit": EMPTY,
        "economic-engine": EMPTY,
        calendar: READY,
        communications: EMPTY,
        atlas: EMPTY,
      },
      includeAcceleratorStepEdge: false,
      acceleratorWorkspaceNodeId: null,
      tutorialEdgeTargetId: "programs",
    })

    expect(edges.map((edge) => edge.id)).toEqual([
      "edge-valid",
      "workspace-canvas-tutorial-edge",
    ])
    expect(edges.find((edge) => edge.id === "edge-valid")?.zIndex).toBeUndefined()
    expect(edges.find((edge) => edge.id === "workspace-canvas-tutorial-edge")?.zIndex).toBeUndefined()
  })

  it("builds disconnect action sets for right-click edge menu", () => {
    const sets = resolveWorkspaceCanvasDisconnectActionSets({
      connections: [
        {
          id: "edge-org-to-accel",
          source: "organization-overview",
          target: "programs",
        },
        {
          id: "edge-org-to-brand",
          source: "organization-overview",
          target: "brand-kit",
        },
        {
          id: "edge-brand-to-accel",
          source: "brand-kit",
          target: "accelerator",
        },
      ],
      edgeId: "edge-org-to-accel",
      source: "organization-overview",
      target: "programs",
    })

    expect(sets.edgeConnectionIds).toEqual(["edge-org-to-accel"])
    expect(sets.sourceConnectionIds).toEqual([
      "edge-org-to-accel",
      "edge-org-to-brand",
    ])
    expect(sets.targetConnectionIds).toEqual([
      "edge-org-to-accel",
    ])
  })

  it("keeps readiness maps typed for the standalone programs card", () => {
    const readinessMap = {
      "organization-overview": READY,
      programs: READY,
      roadmap: READY,
      accelerator: READY,
      "brand-kit": EMPTY,
      "economic-engine": EMPTY,
      calendar: READY,
      communications: EMPTY,
      atlas: EMPTY,
    }

    expect(readinessMap.programs).toEqual(READY)
  })
})
